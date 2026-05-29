/**
 * Track when a user starts an action (for abandoned action emails).
 * Call trackAction when user uploads/starts, clearAction when they complete.
 */

import { trackAnalyticsEvent } from "./ads-tracking";
import { trackAcquisitionEvent } from "./acquisition-tracking";

export function trackAction(action: string, page: string) {
  try {
    trackAnalyticsEvent("tool_start", {
      tool_name: action,
      page,
    });
    trackAcquisitionEvent("tool_start", { eventName: action, targetUrl: page });

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user?.email) return;

    fetch('/api/track-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, action, page }),
    }).catch(() => {}); // Fire and forget
  } catch {}
}

export function clearAction() {
  try {
    trackAnalyticsEvent("tool_complete");

    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (!user?.email) return;

    fetch('/api/track-action', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    }).catch(() => {});
  } catch {}
}
