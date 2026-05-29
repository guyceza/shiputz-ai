'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution } from '@/lib/attribution';
import { trackAcquisitionEvent } from '@/lib/acquisition-tracking';

const SEEN_PAGES_KEY = 'shiputzai_acquisition_pages';

const TOOL_PATHS = [
  '/visualize',
  '/floorplan',
  '/quote-analysis',
  '/receipt-scanner',
  '/shop-look',
  '/style-match',
  '/ai-vision',
  '/dashboard/bill-of-quantities',
];

function shouldTrackPage(pageKey: string) {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SEEN_PAGES_KEY) || '[]') as string[];
    if (seen.includes(pageKey)) return false;
    seen.push(pageKey);
    sessionStorage.setItem(SEEN_PAGES_KEY, JSON.stringify(seen.slice(-50)));
    return true;
  } catch {
    return true;
  }
}

export default function AcquisitionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const attribution = captureAttribution();
    if (!attribution) return;

    const pageKey = `${pathname}?${searchParams.toString()}`;
    if (!shouldTrackPage(pageKey)) return;

    const isLanding = Boolean(
      searchParams.get('gclid') ||
        searchParams.get('fbclid') ||
        searchParams.get('msclkid') ||
        searchParams.get('utm_source') ||
        searchParams.get('utm_campaign')
    );

    trackAcquisitionEvent(isLanding ? 'landing_view' : 'page_view');
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;

      const href = link.getAttribute('href') || '';
      const targetUrl = link.href || href;
      if (/\/(signup|login|checkout|pricing)/.test(href)) {
        trackAcquisitionEvent('signup_click', { targetUrl });
        return;
      }

      if (TOOL_PATHS.some((toolPath) => href.startsWith(toolPath))) {
        trackAcquisitionEvent('tool_click', { eventName: href.split('?')[0], targetUrl });
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  return null;
}
