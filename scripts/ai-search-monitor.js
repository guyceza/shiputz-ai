#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, '../..');
const MONITOR_DIR = path.join(WORKSPACE_ROOT, 'monitor');
const ARTIFACT_DIR = path.join(WORKSPACE_ROOT, 'artifacts', 'shiputzai-ai-search-monitor');
const LOG_PATH = path.join(MONITOR_DIR, 'shiputzai-ai-search-monitor.jsonl');

const TARGET_HOSTS = ['shipazti.com', 'www.shipazti.com'];
const AI_SOURCES = [
  'chatgpt',
  'openai',
  'perplexity',
  'claude',
  'gemini',
  'copilot',
  'you.com',
  'phind',
];

const QUERIES = [
  'אתר ישראלי לדמיין שיפוץ',
  'Redesign AI בעברית',
  'AI לעיצוב פנים בישראל',
  'הדמיית שיפוץ מתמונה',
  'אתר להעלות תמונה ולראות שיפוץ',
  'כלי AI לעיצוב פנים בעברית',
  'הדמיית חדר AI בעברית',
  'אתר ישראלי לעיצוב פנים AI',
  'AI renovation visualization Israel',
  'Hebrew AI interior design tool',
  'ShiputzAI',
  'ShiputzAI Redesign AI',
];

const HEALTH_URLS = [
  'https://shipazti.com/',
  'https://shipazti.com/studio',
  'https://shipazti.com/tips/redesign-ai-hebrew',
  'https://shipazti.com/llms.txt',
  'https://shipazti.com/llms-full.txt',
  'https://shipazti.com/robots.txt',
  'https://shipazti.com/sitemap.xml',
];

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

function decodeXml(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 ShiputzAI AI search monitor (+https://shipazti.com/robots.txt)',
      },
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, text, url: response.url };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkBing(query) {
  const url = `https://www.bing.com/search?format=rss&cc=IL&setlang=he-IL&q=${encodeURIComponent(query)}`;
  try {
    const result = await fetchText(url);
    const items = [...result.text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => {
      const item = match[1];
      const title = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
      const link = decodeXml(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '');
      const description = decodeXml(
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || ''
      );
      return { title, link, host: hostFromUrl(link), description };
    });
    const targetIndex = items.findIndex((item) => TARGET_HOSTS.includes(item.host));
    return {
      engine: 'bing_rss',
      query,
      ok: result.ok,
      status: result.status,
      rank: targetIndex >= 0 ? targetIndex + 1 : null,
      targetUrl: targetIndex >= 0 ? items[targetIndex].link : null,
      targetTitle: targetIndex >= 0 ? items[targetIndex].title : null,
      topResults: items.slice(0, 10),
    };
  } catch (error) {
    return {
      engine: 'bing_rss',
      query,
      ok: false,
      rank: null,
      error: error.message || String(error),
      topResults: [],
    };
  }
}

async function checkHealthUrl(url) {
  try {
    const result = await fetchText(url);
    const lower = result.text.toLowerCase();
    return {
      url,
      ok: result.ok,
      status: result.status,
      bytes: result.text.length,
      hasShiputzAI: /shiputzai/i.test(result.text),
      hasRedesignHebrew: result.text.includes('Redesign AI בעברית'),
      hasIsraeliRenovationPhrase: result.text.includes('אתר ישראלי לדמיין שיפוץ'),
      hasAiCrawlerAllow:
        url.endsWith('/robots.txt') &&
        lower.includes('gptbot') &&
        lower.includes('perplexitybot') &&
        lower.includes('claudebot'),
    };
  } catch (error) {
    return { url, ok: false, error: error.message || String(error) };
  }
}

async function fetchAiReferrals(days = 30) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { ok: false, error: 'Missing Supabase env' };

  const supabase = createClient(url, key);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('acquisition_events')
    .select(
      'created_at,event_type,event_name,page_path,page_url,target_url,first_source,first_medium,first_referrer,utm_source,utm_campaign,user_agent'
    )
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) return { ok: false, error: error.message };

  const rows = (data || []).filter((row) => {
    const haystack = [
      row.first_source,
      row.first_medium,
      row.first_referrer,
      row.utm_source,
      row.utm_campaign,
      row.page_url,
      row.user_agent,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return AI_SOURCES.some((source) => haystack.includes(source));
  });

  const bySource = {};
  const byPage = {};
  for (const row of rows) {
    const source =
      row.utm_source ||
      row.first_source ||
      (row.first_referrer ? hostFromUrl(row.first_referrer) : 'unknown');
    const page = row.page_path || row.page_url || 'unknown';
    bySource[source] = (bySource[source] || 0) + 1;
    byPage[page] = (byPage[page] || 0) + 1;
  }

  return {
    ok: true,
    days,
    count: rows.length,
    bySource,
    byPage,
    latest: rows.slice(0, 20),
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# ShiputzAI AI Search Monitor`);
  lines.push('');
  lines.push(`Run: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Current Web Presence Checks');
  for (const item of report.health) {
    const flags = [];
    if (item.hasRedesignHebrew) flags.push('Redesign AI בעברית');
    if (item.hasIsraeliRenovationPhrase) flags.push('אתר ישראלי לדמיין שיפוץ');
    if (item.hasAiCrawlerAllow) flags.push('AI crawler allow rules');
    lines.push(
      `- ${item.ok ? 'OK' : 'FAIL'} ${item.url} (${item.status || item.error || 'no status'})${flags.length ? ` - ${flags.join(', ')}` : ''}`
    );
  }

  lines.push('');
  lines.push('## Bing RSS Baseline');
  for (const result of report.search) {
    const rank = result.rank ? `rank ${result.rank}` : 'not in top 10';
    lines.push(`- ${result.query}: ${rank}${result.targetUrl ? ` - ${result.targetUrl}` : ''}`);
  }

  lines.push('');
  lines.push('## Tracked AI Referrals');
  if (!report.aiReferrals.ok) {
    lines.push(`- Could not query Supabase: ${report.aiReferrals.error}`);
  } else {
    lines.push(`- Last ${report.aiReferrals.days} days: ${report.aiReferrals.count} tracked AI referral events.`);
    const sources = Object.entries(report.aiReferrals.bySource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [source, count] of sources) lines.push(`- ${source}: ${count}`);
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('- ChatGPT search volume is not public; this monitors proxy signals: Bing visibility, AI referrals, and site readiness for AI crawlers.');
  lines.push('- Google/Search Console impressions still need Search Console export or manual GA/Search Console review.');

  return `${lines.join('\n')}\n`;
}

async function run() {
  loadEnv();
  fs.mkdirSync(MONITOR_DIR, { recursive: true });
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const [health, search, aiReferrals] = await Promise.all([
    Promise.all(HEALTH_URLS.map((url) => checkHealthUrl(url))),
    Promise.all(QUERIES.map((query) => checkBing(query))),
    fetchAiReferrals(30),
  ]);

  const report = { generatedAt, health, search, aiReferrals };

  if (!process.argv.includes('--no-write')) {
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(report)}\n`);
    const safeStamp = generatedAt.replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(ARTIFACT_DIR, `${safeStamp}.json`), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(ARTIFACT_DIR, `${safeStamp}.md`), renderMarkdown(report));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'latest.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'latest.md'), renderMarkdown(report));
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(renderMarkdown(report));
}

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
