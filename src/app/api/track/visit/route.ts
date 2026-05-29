import { NextRequest, NextResponse } from 'next/server';
import { sanitizeAttribution, getRequestIp } from '@/lib/attribution-server';
import { createServiceClient } from '@/lib/supabase';

export const runtime = 'nodejs';

const EVENT_TYPES = new Set([
  'landing_view',
  'page_view',
  'signup_click',
  'tool_click',
  'tool_start',
  'cta_click',
]);

function cleanString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const body = payload as Record<string, unknown>;
    const eventType = cleanString(body.event_type, 80);
    if (!eventType || !EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const attribution = sanitizeAttribution(body.attribution) || {};
    const userAgent =
      cleanString(body.user_agent, 500) ||
      request.headers.get('user-agent')?.slice(0, 500) ||
      null;

    const supabase = createServiceClient();
    const { error } = await supabase.from('acquisition_events').insert({
      session_id: cleanString(body.session_id, 120),
      event_type: eventType,
      event_name: cleanString(body.event_name, 120),
      page_path: cleanString(body.page_path, 1000),
      page_url: cleanString(body.page_url, 1000),
      target_url: cleanString(body.target_url, 1000),
      ...attribution,
      user_agent: userAgent,
      ip_address: getRequestIp(request.headers),
    });

    if (error) {
      console.error('Failed to store acquisition event', error);
      return NextResponse.json({ error: 'Failed to store event' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track visit error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
