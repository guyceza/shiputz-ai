'use client';

import { captureAttribution, getStoredAttribution } from '@/lib/attribution';

const SESSION_KEY = 'shiputzai_acquisition_session';
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

function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function trackAcquisitionEvent(
  eventType: 'landing_view' | 'page_view' | 'signup_click' | 'tool_click' | 'tool_start' | 'cta_click',
  options: { eventName?: string; targetUrl?: string } = {}
) {
  if (typeof window === 'undefined') return;

  try {
    const attribution = getStoredAttribution() || captureAttribution();
    const aiSignal = AI_SOURCES.some((source) => {
      const firstSource = attribution?.first_source?.toLowerCase() || '';
      const firstMedium = attribution?.first_medium?.toLowerCase() || '';
      const firstReferrer = attribution?.first_referrer?.toLowerCase() || '';
      const utmSource = attribution?.utm_source?.toLowerCase() || '';
      return (
        firstMedium === 'ai_referral' ||
        firstSource.includes(source) ||
        firstReferrer.includes(source) ||
        utmSource.includes(source)
      );
    });
    const hasPaidOrCampaignSignal = Boolean(
      attribution?.gclid ||
        attribution?.fbclid ||
        attribution?.msclkid ||
        attribution?.utm_source ||
        attribution?.utm_campaign ||
        attribution?.first_source === 'google' ||
        aiSignal
    );

    if (!hasPaidOrCampaignSignal && eventType === 'page_view') return;

    fetch('/api/track/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event_type: eventType,
        event_name: options.eventName || null,
        page_path: `${window.location.pathname}${window.location.search}`,
        page_url: window.location.href,
        target_url: options.targetUrl || null,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        attribution,
      }),
    }).catch(() => {});
  } catch {}
}
