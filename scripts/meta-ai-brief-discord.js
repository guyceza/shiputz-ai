#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const META_API = 'https://graph.facebook.com/v21.0';
const TOKEN_PATH = '/home/ubuntu/clawd/config/meta-shiputzai-token.txt';
const WEBHOOK_CONFIG_PATH = '/home/ubuntu/clawd/config/shiputzai-ads-discord-webhook.json';
const MEDIA_PATH = '/home/ubuntu/clawd/media/shiputzai-meta-ai-brief.png';
const HTML_PATH = '/tmp/shiputzai-meta-ai-brief.html';
const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID || 'act_1215839217370072';
const TOKEN = process.env.META_ACCESS_TOKEN || fs.readFileSync(TOKEN_PATH, 'utf8').trim();
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.SEND !== '1';

function getWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL;
  if (!fs.existsSync(WEBHOOK_CONFIG_PATH)) return null;
  const config = JSON.parse(fs.readFileSync(WEBHOOK_CONFIG_PATH, 'utf8'));
  return config.webhookUrl || config.webhook_url || null;
}

function graph(path, params = {}) {
  const url = new URL(`${META_API}/${path.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  url.searchParams.set('access_token', TOKEN);

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            reject(new Error(`${parsed.error.message} (${parsed.error.code || 'Meta API'})`));
            return;
          }
          resolve(parsed);
        } catch {
          reject(new Error(body || 'Invalid Meta response'));
        }
      });
    }).on('error', reject);
  });
}

function num(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function int(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function fmtCur(value, digits = 0) {
  return '₪' + num(value).toLocaleString('he-IL', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function fmtPct(value, digits = 1) {
  return num(value).toFixed(digits) + '%';
}

function fmtNum(value) {
  return Math.round(num(value)).toLocaleString('he-IL');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shortName(name, max = 36) {
  if (!name) return 'ללא שם';
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function actionValue(actions, types) {
  const wanted = Array.isArray(types) ? types : [types];
  return (actions || [])
    .filter((action) => wanted.includes(action.action_type))
    .reduce((sum, action) => sum + int(action.value || 0), 0);
}

function outboundClicks(row) {
  const arr = row.outbound_clicks || [];
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return int(arr[0].value || 0);
}

function linkClicks(row) {
  return int(row.inline_link_clicks || 0) || outboundClicks(row) || int(row.clicks || 0);
}

function delta(current, previous) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function toneClass(tone) {
  if (tone === 'danger') return 'danger';
  if (tone === 'warning') return 'warning';
  if (tone === 'success') return 'success';
  return 'info';
}

function renderLines(lines) {
  return lines.map((line) => `<div class="line">${escapeHtml(line)}</div>`).join('');
}

function renderList(items) {
  return `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function insightFromRow(row, previousRow) {
  const spend = num(row.spend);
  const impressions = num(row.impressions);
  const clicks = linkClicks(row);
  const landingViews = actionValue(row.actions, 'landing_page_view');
  const leads = actionValue(row.actions, ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead']);
  const purchases = actionValue(row.actions, ['purchase', 'offsite_conversion.fb_pixel_purchase']);
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cplv = landingViews > 0 ? spend / landingViews : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const frequency = num(row.frequency);

  const prevSpend = previousRow ? num(previousRow.spend) : 0;
  const prevImpressions = previousRow ? num(previousRow.impressions) : 0;
  const prevClicks = previousRow ? linkClicks(previousRow) : 0;
  const prevLandingViews = previousRow ? actionValue(previousRow.actions, 'landing_page_view') : 0;
  const prevCtr = prevImpressions > 0 ? (prevClicks / prevImpressions) * 100 : 0;
  const prevCplv = prevLandingViews > 0 ? prevSpend / prevLandingViews : 0;

  return {
    name: row.ad_name || row.adset_name || row.campaign_name || row.name,
    spend,
    impressions,
    clicks,
    landingViews,
    leads,
    purchases,
    cpc,
    cplv,
    ctr,
    frequency,
    ctrDelta: prevCtr > 0 ? delta(ctr, prevCtr) : null,
    cplvDelta: prevCplv > 0 && cplv > 0 ? delta(cplv, prevCplv) : null,
  };
}

async function run() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];
  const twoWeeksAgo = new Date(now - 14 * 86400000).toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('he-IL', { timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit' });
  const dateLabel = new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);

  const fields = 'campaign_name,adset_name,ad_name,spend,clicks,impressions,reach,frequency,actions,outbound_clicks,inline_link_clicks';
  const [campaigns, adsets, week, prevWeek, adsToday, adsWeek] = await Promise.all([
    graph(`${AD_ACCOUNT}/campaigns`, {
      fields: 'id,name,status,effective_status',
      filtering: [{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }],
      limit: 50,
    }),
    graph(`${AD_ACCOUNT}/adsets`, {
      fields: 'id,name,status,effective_status,daily_budget,campaign{name,effective_status}',
      filtering: [{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }],
      limit: 50,
    }),
    graph(`${AD_ACCOUNT}/insights`, {
      fields,
      level: 'campaign',
      time_range: { since: weekAgo, until: today },
      limit: 50,
    }),
    graph(`${AD_ACCOUNT}/insights`, {
      fields,
      level: 'campaign',
      time_range: { since: twoWeeksAgo, until: weekAgo },
      limit: 50,
    }),
    graph(`${AD_ACCOUNT}/insights`, {
      fields,
      level: 'ad',
      time_range: { since: today, until: today },
      limit: 50,
    }),
    graph(`${AD_ACCOUNT}/insights`, {
      fields,
      level: 'ad',
      time_range: { since: weekAgo, until: today },
      limit: 50,
    }),
  ]);

  const activeCampaignNames = new Set((campaigns.data || []).map((campaign) => campaign.name));
  const prevByName = new Map((prevWeek.data || []).map((row) => [row.campaign_name, row]));
  const campaignStats = (week.data || [])
    .filter((row) => activeCampaignNames.has(row.campaign_name))
    .map((row) => insightFromRow(row, prevByName.get(row.campaign_name)))
    .filter((row) => row.spend > 0);

  const adStatsToday = (adsToday.data || [])
    .map((row) => insightFromRow(row, null))
    .filter((row) => row.spend > 0)
    .sort((a, b) => b.spend - a.spend);

  const adStatsWeek = (adsWeek.data || [])
    .map((row) => insightFromRow(row, null))
    .filter((row) => row.spend > 0)
    .sort((a, b) => {
      const aScore = a.landingViews > 0 ? a.cplv : a.spend + 1000;
      const bScore = b.landingViews > 0 ? b.cplv : b.spend + 1000;
      return aScore - bScore;
    });

  const totalSpend = campaignStats.reduce((sum, row) => sum + row.spend, 0);
  const totalImpressions = campaignStats.reduce((sum, row) => sum + row.impressions, 0);
  const totalClicks = campaignStats.reduce((sum, row) => sum + row.clicks, 0);
  const totalLandingViews = campaignStats.reduce((sum, row) => sum + row.landingViews, 0);
  const totalLeads = campaignStats.reduce((sum, row) => sum + row.leads, 0);
  const weightedCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const blendedCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const blendedCplv = totalLandingViews > 0 ? totalSpend / totalLandingViews : 0;
  const activeBudget = (adsets.data || []).reduce((sum, adset) => sum + int(adset.daily_budget || 0), 0) / 100;

  const bestAd = adStatsWeek.find((ad) => ad.landingViews > 0) || adStatsWeek[0] || null;
  const weakAd = [...adStatsWeek].sort((a, b) => {
    const aScore = a.landingViews > 0 ? a.cplv : a.spend + 1000;
    const bScore = b.landingViews > 0 ? b.cplv : b.spend + 1000;
    return bScore - aScore;
  })[0] || null;
  const mainCampaign = campaignStats[0] || null;

  const primaryIssue = (() => {
    if (!campaignStats.length) {
      return {
        tone: 'warning',
        title: 'אין נתוני פעילות זמינים',
        body: 'Meta לא החזירה נתוני הוצאה לקמפיינים פעילים בטווח השבועי. צריך לבדוק שהקמפיין פעיל ושיש Delivery.',
      };
    }
    if (totalLandingViews === 0 && totalSpend > 40) {
      return {
        tone: 'danger',
        title: 'יש הוצאה בלי צפיות נחיתה',
        body: `המערכת הוציאה ${fmtCur(totalSpend, 2)} השבוע, אבל Meta לא מדווחת על Landing Page Views. זה בדרך כלל אומר בעיית פיקסל/אופטימיזציה או קליקים לא איכותיים.`,
      };
    }
    if (weakAd && weakAd.spend > 20 && weakAd.landingViews === 0) {
      return {
        tone: 'warning',
        title: 'מודעה אחת שורפת תקציב בלי נחיתה',
        body: `${shortName(weakAd.name, 36)} כבר על ${fmtCur(weakAd.spend, 2)} בלי צפיות נחיתה מדווחות.`,
      };
    }
    if (mainCampaign && mainCampaign.ctrDelta !== null && mainCampaign.ctrDelta < -25) {
      return {
        tone: 'warning',
        title: 'ה-CTR נחלש מול השבוע הקודם',
        body: `${shortName(mainCampaign.name, 36)} ירד ${Math.abs(mainCampaign.ctrDelta).toFixed(0)}% ב-CTR מול השבוע הקודם. לא פאניקה, אבל צריך לעקוב.`,
      };
    }
    return {
      tone: 'success',
      title: 'הקמפיין חי ואוסף דאטה',
      body: `השבוע: ${fmtCur(totalSpend, 2)} הוצאה, ${fmtNum(totalClicks)} קליקים, ${fmtNum(totalLandingViews)} צפיות נחיתה ו-${fmtPct(weightedCtr)} CTR.`,
    };
  })();

  const actions = [];
  if (bestAd && bestAd.landingViews > 0) {
    actions.push(`לתת יותר חשיפה ל-${shortName(bestAd.name, 18)} דרך כיבוי/רענון מודעות חלשות, כי התקציב כרגע נשלט ברמת ה-Ad Set`);
  }
  if (weakAd && weakAd.spend > 15 && (weakAd.landingViews === 0 || weakAd.cplv > blendedCplv * 1.6)) {
    actions.push(`לעצור או לרענן את ${shortName(weakAd.name, 18)} אם אין שיפור בחלון הנתונים הבא`);
  }
  if (totalLandingViews > 0 && totalLeads === 0) {
    actions.push('לחבר את הדוח הבא גם לאירועי הרשמה/רכישה כדי שנראה איכות, לא רק תנועה');
  }
  if (!actions.length) {
    actions.push('להשאיר את המבנה פעיל עוד יום ולא להזיז תקציב לפני שיש יותר דאטה');
    actions.push('לבדוק בבוקר הבא איזה קריאייטיב מביא צפיות נחיתה זולות יותר');
  }

  const aiInsights = [];
  if (bestAd && weakAd && bestAd.name !== weakAd.name && bestAd.landingViews > 0) {
    aiInsights.push(`אי אפשר להזיז תקציב ישירות בין מודעות בתוך אותו Ad Set; כדי לחזק את ${shortName(bestAd.name, 20)}, לכבות/לרענן חלשות או לפצל אותה ל-Ad Set נפרד`);
  }
  if (weakAd && weakAd.spend > 15) {
    aiInsights.push(`לייצר וריאציה חדשה ל-${shortName(weakAd.name, 20)} עם פתיח ישיר יותר: לפני/אחרי, כאב ברור, וקריאה להעלאת תמונה`);
  }
  if (totalClicks > 0 && totalLandingViews > 0 && totalLandingViews / totalClicks < 0.55) {
    aiInsights.push('יש פער בין קליקים לנחיתות: לבדוק מהירות דף, התאמת קריאייטיב לדף, והאם הקהל לוחץ מסקרנות ולא מכוונה');
  }
  if (totalLandingViews > 20 && totalLeads === 0) {
    aiInsights.push('יש מספיק צפיות נחיתה בלי ליד: להבליט מעל הקיפול את ההצעה הראשית ולבדוק CTA קצר יותר');
  }
  if (weightedCtr < 0.8 && totalImpressions > 1000) {
    aiInsights.push('ה-CTR נמוך יחסית: לבדוק קריאייטיב עם תמונת תוצאה ברורה יותר וכותרת שמתחילה בבעיה של הלקוח');
  }
  if (!aiInsights.length) {
    aiInsights.push('לא לשנות יותר מדי בבת אחת: לתת לקמפיין עוד יום דאטה ואז להזיז תקציב לפי עלות צפיית נחיתה');
    aiInsights.push('להכין מראש קריאייטיב נוסף באותו מסר, כדי שיהיה מה להחליף אם התדירות מתחילה לעלות');
  }

  const metricCards = [
    { label: 'קמפיינים פעילים', value: fmtNum(campaignStats.length) },
    { label: 'תקציב יומי', value: activeBudget > 0 ? fmtCur(activeBudget) : '—' },
    { label: 'הוצאה 7 ימים', value: fmtCur(totalSpend, 0) },
    { label: 'צפיות נחיתה', value: fmtNum(totalLandingViews) },
    { label: 'CTR לינק', value: fmtPct(weightedCtr) },
  ];

  const bottomLineLines = [
    `${campaignStats.length} קמפיינים פעילים · ${fmtCur(totalSpend, 2)} הוצאה · ${fmtNum(totalImpressions)} חשיפות`,
    `${fmtNum(totalClicks)} קליקים · ${fmtNum(totalLandingViews)} צפיות נחיתה · ${fmtCur(blendedCpc, 2)} CPC`,
    totalLandingViews > 0 ? `${fmtCur(blendedCplv, 2)} עלות לצפיית נחיתה` : 'עדיין אין עלות צפיית נחיתה יציבה',
  ];

  const secondaryCards = [];
  if (bestAd) {
    secondaryCards.push({
      tone: 'success',
      eyebrow: 'המודעה החזקה כרגע',
      title: shortName(bestAd.name, 38),
      body: renderLines([
        `${fmtNum(bestAd.landingViews)} צפיות נחיתה · ${fmtCur(bestAd.cplv || 0, 2)} לצפייה`,
        `${fmtNum(bestAd.clicks)} קליקים · ${fmtPct(bestAd.ctr)} CTR · ${fmtCur(bestAd.spend, 2)} הוצאה`,
      ]),
    });
  }
  if (weakAd) {
    secondaryCards.push({
      tone: weakAd.landingViews === 0 ? 'danger' : 'warning',
      eyebrow: 'דורש בדיקה',
      title: shortName(weakAd.name, 38),
      body: renderLines([
        weakAd.landingViews === 0
          ? `${fmtCur(weakAd.spend, 2)} הוצאה בלי צפיות נחיתה`
          : `${fmtCur(weakAd.cplv, 2)} לצפיית נחיתה · ${fmtNum(weakAd.landingViews)} צפיות`,
        `${fmtNum(weakAd.clicks)} קליקים · ${fmtPct(weakAd.ctr)} CTR`,
      ]),
    });
  }
  if (adStatsToday.length) {
    secondaryCards.push({
      tone: 'info',
      eyebrow: 'היום',
      title: 'מה רץ עכשיו',
      body: renderLines(adStatsToday.slice(0, 3).map((ad) => (
        `${shortName(ad.name, 24)} · ${fmtCur(ad.spend, 2)} · ${fmtNum(ad.clicks)} קליקים · ${fmtNum(ad.landingViews)} נחיתות`
      ))),
    });
  }

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="utf-8">
<style>
  @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Hebrew:wght@400;500;700;800&display=swap");
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1280px;
    padding: 28px;
    background: #120d09;
    color: #fff7ed;
    font-family: "Inter", "Noto Sans Hebrew", sans-serif;
  }
  .frame {
    background: #1a120d;
    border: 1px solid #3a281d;
    border-radius: 24px;
    padding: 26px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    padding-bottom: 18px;
    border-bottom: 1px solid #3a281d;
    margin-bottom: 18px;
  }
  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d39b72;
    margin-bottom: 8px;
  }
  .title {
    font-size: 34px;
    font-weight: 800;
    line-height: 1.05;
    color: #fff7ed;
  }
  .subtitle {
    margin-top: 8px;
    color: #d8b69d;
    font-size: 14px;
  }
  .header-meta {
    text-align: left;
    min-width: 220px;
  }
  .header-meta .stamp {
    font-size: 24px;
    font-weight: 800;
    color: #fff7ed;
  }
  .header-meta .substamp {
    margin-top: 6px;
    font-size: 13px;
    color: #c99775;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }
  .metric {
    background: #211710;
    border: 1px solid #3a281d;
    border-radius: 16px;
    padding: 14px 16px;
  }
  .metric-label {
    color: #c99775;
    font-size: 11px;
    margin-bottom: 8px;
  }
  .metric-value {
    font-size: 26px;
    font-weight: 800;
    color: #fff7ed;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 14px;
  }
  .card {
    background: #211710;
    border: 1px solid #3a281d;
    border-radius: 18px;
    padding: 18px 20px;
    min-height: 178px;
  }
  .card.span-2 { grid-column: span 2; }
  .card.danger { border-top: 3px solid #ef4444; }
  .card.warning { border-top: 3px solid #f97316; }
  .card.success { border-top: 3px solid #22c55e; }
  .card.info { border-top: 3px solid #f59e0b; }
  .card.ai { border-top: 3px solid #fb923c; background: #27180f; }
  .card-label {
    color: #c99775;
    font-size: 11px;
    margin-bottom: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .card-title {
    font-size: 26px;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 10px;
    color: #fff7ed;
  }
  .card-body {
    font-size: 15px;
    line-height: 1.7;
    color: #f1d8c5;
  }
  .bullet-list {
    list-style: none;
    display: grid;
    gap: 10px;
  }
  .bullet-list li {
    position: relative;
    padding-right: 18px;
    color: #f4dfcf;
    font-size: 15px;
    line-height: 1.65;
  }
  .bullet-list li::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #fb923c;
    position: absolute;
    right: 0;
    top: 10px;
  }
  .line { margin-bottom: 8px; }
  .footer {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #3a281d;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #b98564;
    font-size: 12px;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="header">
      <div>
        <div class="eyebrow">Meta AI Brief</div>
        <div class="title">תובנות קמפיינים</div>
        <div class="subtitle">ShiputzAI · אותו פורמט דיסקורד, מותאם למודעות שמביאות תנועה וצפיות נחיתה</div>
      </div>
      <div class="header-meta">
        <div class="stamp">${escapeHtml(timeStr)} · ${escapeHtml(dateLabel)}</div>
        <div class="substamp">ShiputzAI · Active campaigns only</div>
      </div>
    </div>

    <div class="metrics">
      ${metricCards.map((card) => `
        <div class="metric">
          <div class="metric-label">${escapeHtml(card.label)}</div>
          <div class="metric-value">${escapeHtml(card.value)}</div>
        </div>
      `).join('')}
    </div>

    <div class="grid">
      <div class="card span-2 ${toneClass(primaryIssue.tone)}">
        <div class="card-label">הדבר הכי חשוב עכשיו</div>
        <div class="card-title">${escapeHtml(primaryIssue.title)}</div>
        <div class="card-body">${escapeHtml(primaryIssue.body)}</div>
      </div>

      <div class="card info">
        <div class="card-label">שורה תחתונה</div>
        <div class="card-title">מה רואים מהשבוע</div>
        <div class="card-body">${renderLines(bottomLineLines)}</div>
      </div>

      <div class="card span-2 warning">
        <div class="card-label">מה הייתי עושה</div>
        <div class="card-title">3 צעדים ברורים</div>
        <div class="card-body">${renderList(actions.slice(0, 3))}</div>
      </div>

      <div class="card ai">
        <div class="card-label">AI Insights</div>
        <div class="card-title">איך לשפר מחר</div>
        <div class="card-body">${renderList(aiInsights.slice(0, 3))}</div>
      </div>

      ${secondaryCards.map((card) => `
        <div class="card ${toneClass(card.tone)}">
          <div class="card-label">${escapeHtml(card.eyebrow)}</div>
          <div class="card-title">${escapeHtml(card.title)}</div>
          <div class="card-body">${card.body}</div>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <div>ButlerOllie · ShiputzAI Analytics</div>
      <div>Designed for Toxin's Discord, same brief shape as Uranus</div>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(HTML_PATH, html);

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1400, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  const body = await page.$('body');
  const box = await body.boundingBox();
  await page.screenshot({
    path: MEDIA_PATH,
    clip: { x: 0, y: 0, width: Math.ceil(box.width), height: Math.ceil(box.height) },
  });
  await browser.close();

  const summaryLines = [
    '**Meta AI Brief**',
    `**מה חשוב עכשיו:** ${primaryIssue.title} — ${primaryIssue.body}`,
    '',
    '**מה הייתי עושה:**',
    ...actions.slice(0, 3).map((action) => `• ${action}`),
    '',
    '**AI Insights לשיפור:**',
    ...aiInsights.slice(0, 3).map((insight) => `• ${insight}`),
  ];

  if (bestAd) {
    summaryLines.push('');
    summaryLines.push(`**החזק כרגע:** ${bestAd.name} · ${fmtCur(bestAd.cplv || 0, 2)} לצפיית נחיתה`);
  }

  const webhook = getWebhookUrl();
  if (!DRY_RUN && webhook) {
    const payload = JSON.stringify({
      username: 'ShiputzAI',
      avatar_url: 'https://shipazti.com/favicon.ico',
      content: summaryLines.join('\n').trim(),
    });
    execFileSync('curl', [
      '-s',
      '-X', 'POST',
      webhook,
      '-F', `file=@${MEDIA_PATH}`,
      '-F', `payload_json=${payload}`,
    ], { stdio: 'inherit' });
    console.log('Sent ShiputzAI Meta AI Brief to Discord');
  } else {
    console.log(`DRY_RUN complete: ${MEDIA_PATH}`);
    if (!webhook) console.log(`No Discord webhook configured at ${WEBHOOK_CONFIG_PATH}`);
  }
}

run().catch((error) => {
  console.error('Error:', error.message || error);
  process.exit(1);
});
