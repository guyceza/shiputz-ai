#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

const DISCORD_TOKEN = process.env.DISCORD_BOT_TOKEN || require('../.secrets/discord.json').token;
const DISCORD_CHANNEL = '1475501214979330081'; // #shiputz-monitor
const ADMIN_EMAIL = 'guyceza@gmail.com';
const STATS_URL = 'https://shipazti.com/api/admin/stats';
const STATE_FILE = path.join(__dirname, '..', 'logs', 'monitor-state.json');

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } 
  catch { return { lastAlerts: [], lastCheck: null }; }
}

function saveState(data) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
}

function sendDiscord(content) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ content });
    const req = https.request({
      hostname: 'discord.com',
      path: `/api/v10/channels/${DISCORD_CHANNEL}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 429) {
          const wait = JSON.parse(body).retry_after * 1000 || 5000;
          setTimeout(() => sendDiscord(content).then(resolve), wait);
        } else {
          resolve(res.statusCode < 300);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function fetchStats() {
  return new Promise((resolve, reject) => {
    const url = `${STATS_URL}?adminEmail=${encodeURIComponent(ADMIN_EMAIL)}`;
    https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${body.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log(`[${new Date().toISOString()}] ShiputzAI Monitor running...`);
  
  const state = loadState();
  
  try {
    const data = await fetchStats();
    
    if (data.error) {
      console.error('API error:', data.error);
      return;
    }
    
    const { stats, alerts } = data;
    
    // Filter new alerts (not in last check)
    const newAlerts = alerts.filter(a => !state.lastAlerts.includes(a));
    
    if (newAlerts.length > 0) {
      const msg = [
        '🔔 **ShiputzAI Alert**',
        '',
        ...newAlerts.map(a => `• ${a}`),
        '',
        `👥 Users: ${stats.users.total} (${stats.users.premium} premium, ${stats.users.vision} vision)`,
        `📊 This hour: ${stats.usage.requestsThisHour} requests, ${stats.usage.errorRate} errors`
      ].join('\n');
      
      await sendDiscord(msg);
      console.log('Alert sent:', newAlerts);
    } else {
      console.log('No new alerts');
    }
    
    // Daily summary at 08:00 UTC (check if hour is 8 and we haven't sent today)
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (now.getUTCHours() === 8 && state.lastSummaryDate !== today) {
      const summary = [
        '📈 **ShiputzAI Daily Summary**',
        '',
        `👥 Total users: ${stats.users.total}`,
        `💎 Premium: ${stats.users.premium}`,
        `👁️ Vision subs: ${stats.users.vision}`,
        '',
        `📊 High usage users: ${stats.highUsageUsers.length}`,
        stats.highUsageUsers.length > 0 
          ? stats.highUsageUsers.map(u => `  • ${u.email}: ${u.vision_usage_count}/10`).join('\n')
          : ''
      ].filter(Boolean).join('\n');
      
      await sendDiscord(summary);
      state.lastSummaryDate = today;
      console.log('Daily summary sent');
    }
    
    // Update state
    state.lastAlerts = alerts;
    state.lastCheck = now.toISOString();
    saveState(state);
    
  } catch (error) {
    console.error('Monitor error:', error.message);
    // Alert on persistent failures
    if (state.consecutiveFailures >= 3) {
      await sendDiscord(`🚨 **ShiputzAI Monitor Error**\n\n${error.message}`);
      state.consecutiveFailures = 0;
    } else {
      state.consecutiveFailures = (state.consecutiveFailures || 0) + 1;
    }
    saveState(state);
  }
}

main();
