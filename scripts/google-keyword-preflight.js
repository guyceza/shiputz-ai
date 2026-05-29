#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v24';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_LANGUAGE = process.env.GOOGLE_ADS_KEYWORD_LANGUAGE || 'languageConstants/1014';
const DEFAULT_GEO = process.env.GOOGLE_ADS_KEYWORD_GEO || 'geoTargetConstants/2376';
const DEFAULT_NETWORK = 'GOOGLE_SEARCH';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function loadEnv() {
  loadEnvFile(path.join(PROJECT_ROOT, '.env'));
  loadEnvFile(path.join(PROJECT_ROOT, '.env.local'));
  loadEnvFile(path.join(process.env.HOME || '/home/ubuntu', '.env'));
}

function normalizeCustomerId(value) {
  return (value || '').replace(/-/g, '').trim();
}

function googleConfig() {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID),
    loginCustomerId: normalizeCustomerId(
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID ||
        ''
    ),
    loginCustomerIdMode: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE || 'auto')
      .trim()
      .toLowerCase(),
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { json: false, file: null, terms: [] };

  for (const arg of args) {
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg.startsWith('--file=')) {
      options.file = arg.slice('--file='.length);
    } else if (arg.startsWith('--terms=')) {
      options.terms.push(...splitTerms(arg.slice('--terms='.length)));
    } else {
      options.terms.push(arg);
    }
  }

  if (options.file) {
    options.terms.push(...splitTerms(fs.readFileSync(options.file, 'utf8')));
  }

  if (!process.stdin.isTTY) {
    const stdin = fs.readFileSync(0, 'utf8');
    options.terms.push(...splitTerms(stdin));
  }

  options.terms = Array.from(new Set(options.terms.map(normalizeTerm).filter(Boolean)));
  return options;
}

function splitTerms(value) {
  return (value || '')
    .split(/\r?\n|,/)
    .map(normalizeTerm)
    .filter(Boolean);
}

function normalizeTerm(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function assertPresent(name, value) {
  if (!value) throw new Error(`Missing ${name}`);
}

async function getAccessToken(config) {
  assertPresent('GOOGLE_ADS_CLIENT_ID', config.clientId);
  assertPresent('GOOGLE_ADS_CLIENT_SECRET', config.clientSecret);
  assertPresent('GOOGLE_ADS_REFRESH_TOKEN', config.refreshToken);

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Google OAuth refresh failed');
  }

  return payload.access_token;
}

async function googleAdsRequest(config, endpoint, body) {
  assertPresent('GOOGLE_ADS_DEVELOPER_TOKEN', config.developerToken);
  assertPresent('GOOGLE_ADS_CUSTOMER_ID', config.customerId);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await getAccessToken(config)}`,
    'developer-token': config.developerToken,
  };

  if (config.loginCustomerId && config.loginCustomerIdMode === 'always') {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const response = await fetch(`https://googleads.googleapis.com/${API_VERSION}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      (typeof payload === 'string' ? payload : 'Google Ads API request failed');
    throw new Error(message);
  }

  return payload || {};
}

function microsToShekels(value) {
  const number = Number(value || 0);
  return number > 0 ? number / 1_000_000 : 0;
}

function shekels(value) {
  if (!value) return 'אין נתון';
  return `₪${Number(value).toFixed(2).replace(/\.00$/, '')}`;
}

function competitionLabel(value) {
  if (!value) return 'אין נתון';
  return value.replace('UNSPECIFIED', 'אין נתון').replace('UNKNOWN', 'אין נתון');
}

function keywordSignals(term) {
  const lower = term.toLowerCase();
  const reasons = [];
  let score = 30;
  let hardBlock = false;

  const strongIntent = [
    [/הצעת מחיר|בדיקת הצעה|בדיקת מחיר|להשוות הצעות|השוואת הצעות|האם .*יקר|הוגן|חריגה/, 30, 'חשד או בדיקת הצעת מחיר'],
    [/כתב כמויות|תקציב שיפוץ|רשימת עבודות|מחשבון שיפוץ|מחשבון עלות/, 24, 'תכנון תקציב או כתב כמויות'],
    [/כמה עולה|עלות|מחיר|מחירון/, 20, 'כוונת מחיר'],
    [/שיפוץ|שיפוצים|אמבטיה|מקלחת|מטבח|צביע|צבעי|דירה|חדר/, 16, 'תחום שיפוץ רלוונטי'],
    [/עיצוב פנים|מעצב פנים|אדריכל|תכנון דירה|שרטוט|תוכנית דירה|הדמיה|ai|אפליקציה לעיצוב/, 16, 'תחום תכנון או הדמיה רלוונטי'],
    [/מידרג|המקצוענים|יצאת גדול|שפץ לי|שיפוצים פלוס|פרו פיקס|דפי זהב/, 10, 'חיפוש ליד אצל מתווך/אינדקס'],
  ];

  const weakOrBad = [
    [/פרוץ|פריצה|crack|cracked/, -80, 'כוונה לא חוקית/פרוצה', true],
    [/ניקיון|ניקוי|פינוי פסולת/, -60, 'כוונת ניקיון/פינוי אחרי עבודה, לא בדיקת שיפוץ', false],
    [/דרושים|עבודה|משרה|שכר/, -60, 'כוונת עבודה/גיוס, לא לקוח משפץ', false],
    [/קורס|לימודי|לימודים|ללמוד/, -55, 'כוונת לימודים/קורס, לא לקוח משפץ', false],
    [/חומרי בניין|חנות חומרי|כלי עבודה/, -35, 'מחפש חומרי בניין/ציוד, לא בדיקת שיפוץ', false],
    [/חינם|free/, -18, 'כוונת תשלום חלשה', false],
    [/pdf|קובץ|להורדה|download/, -20, 'מחפש קובץ/הורדה', false],
    [/דקל|לוי יצחק|יצחק לוי/, -16, 'מחירון חיצוני שלא בהכרח מתאים', false],
  ];

  for (const [pattern, points, reason] of strongIntent) {
    if (pattern.test(lower)) {
      score += points;
      reasons.push(reason);
    }
  }

  for (const [pattern, points, reason, block] of weakOrBad) {
    if (pattern.test(lower)) {
      score += points;
      reasons.push(reason);
      if (block) hardBlock = true;
    }
  }

  if (/^(שיפוץ|שיפוצים)$/.test(lower)) {
    score -= 25;
    reasons.push('מילת גג רחבה מדי בלי כוונת מחיר/בדיקה');
  }

  score = Math.max(0, Math.min(100, score));
  return { score, hardBlock, reasons: Array.from(new Set(reasons)) };
}

function recommendation(row) {
  const metrics = row.metrics;
  const signals = row.signals;
  const avgMonthlySearches = Number(metrics.avgMonthlySearches || 0);
  const highBid = microsToShekels(metrics.highTopOfPageBidMicros);

  if (signals.hardBlock) return 'לחסום';
  if (
    signals.reasons.some((reason) =>
      reason.includes('ניקיון') ||
      reason.includes('עבודה/גיוס') ||
      reason.includes('לימודים') ||
      reason.includes('חומרי בניין') ||
      reason.includes('קובץ/הורדה')
    )
  ) {
    return 'לא להוסיף; לשקול שלילי';
  }
  if (signals.reasons.some((reason) => reason.includes('מילת גג רחבה'))) {
    return 'לא להוסיף כמילה; להשתמש כ-seed';
  }
  if (signals.score >= 75 && avgMonthlySearches >= 10) return 'להוסיף Phrase/Exact';
  if (signals.score >= 65 && avgMonthlySearches > 0) return 'בדיקה קטנה Exact';
  if (avgMonthlySearches === 0 && signals.score >= 70) return 'אולי Exact, נפח לא ודאי';
  if (highBid >= 12 && signals.score < 70) return 'לא להוסיף כרגע';
  return 'לעקוב/לא למהר';
}

async function fetchHistoricalMetrics(config, terms) {
  const payload = await googleAdsRequest(
    config,
    `/customers/${config.customerId}:generateKeywordHistoricalMetrics`,
    {
      keywords: terms,
      language: DEFAULT_LANGUAGE,
      geoTargetConstants: [DEFAULT_GEO],
      includeAdultKeywords: false,
      keywordPlanNetwork: DEFAULT_NETWORK,
    }
  );

  const byTerm = new Map();
  for (const result of payload.results || []) {
    byTerm.set(normalizeTerm(result.text), result.keywordMetrics || {});
  }

  return terms.map((term) => {
    const metrics = byTerm.get(term) || {};
    const signals = keywordSignals(term);
    const row = {
      term,
      metrics,
      signals,
    };
    row.recommendation = recommendation(row);
    return row;
  });
}

function printReport(rows) {
  console.log(`בדיקת מילות חיפוש לפני הוספה - ${rows.length} ביטויים`);
  console.log('');
  console.log('מקור Google: נפח חודשי ממוצע, תחרות, וטווח הצעת מחיר לראש העמוד בישראל.');
  console.log('ציון התאמה: סיווג פנימי שלנו לפי כוונת משתמש והתאמה ל-ShiputzAI.');
  console.log('');

  const sorted = [...rows].sort((a, b) => {
    if (a.recommendation !== b.recommendation) {
      return b.signals.score - a.signals.score;
    }
    return Number(b.metrics.avgMonthlySearches || 0) - Number(a.metrics.avgMonthlySearches || 0);
  });

  for (const row of sorted) {
    const metrics = row.metrics || {};
    const avgMonthly = metrics.avgMonthlySearches || 0;
    const competition = competitionLabel(metrics.competition);
    const competitionIndex = metrics.competitionIndex ? ` (${metrics.competitionIndex})` : '';
    const lowBid = shekels(microsToShekels(metrics.lowTopOfPageBidMicros));
    const highBid = shekels(microsToShekels(metrics.highTopOfPageBidMicros));
    const reasons = row.signals.reasons.length ? row.signals.reasons.join(', ') : 'אין סיגנל ברור';

    console.log(`- "${row.term}"`);
    console.log(
      `  נפח: ${avgMonthly}/חודש | תחרות: ${competition}${competitionIndex} | עלות ראש עמוד: ${lowBid}-${highBid}`
    );
    console.log(
      `  התאמה: ${row.signals.score}/100 | המלצה: ${row.recommendation} | סיבה: ${reasons}`
    );
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/google-keyword-preflight.js --terms="מילה אחת, מילה שנייה"
  printf "מילה אחת\\nמילה שנייה\\n" | node scripts/google-keyword-preflight.js
  node scripts/google-keyword-preflight.js --file=/tmp/keywords.txt --json`);
}

async function main() {
  loadEnv();
  const options = parseArgs();
  if (options.help) {
    printHelp();
    return;
  }
  if (!options.terms.length) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const rows = await fetchHistoricalMetrics(googleConfig(), options.terms);
  if (options.json) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    printReport(rows);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
