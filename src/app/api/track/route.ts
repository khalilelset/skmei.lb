import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

function parseDevice(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  return 'desktop';
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua))            return 'Edge';
  if (/opr\/|opera/i.test(ua))      return 'Opera';
  if (/firefox/i.test(ua))          return 'Firefox';
  if (/chrome/i.test(ua))           return 'Chrome';
  if (/safari/i.test(ua))           return 'Safari';
  return 'Other';
}

const BOT_RE = /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|googlebot|bingbot|slurp|duckduck/i;

export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') ?? '';
  if (BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const url      = typeof body.url === 'string'      ? body.url.slice(0, 500)      : '/';
  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null;

  const country = req.headers.get('x-vercel-ip-country') ?? null;
  const device  = parseDevice(ua);
  const browser = parseBrowser(ua);

  await supabaseServer.from('pageviews').insert({ url, referrer: referrer || null, country, device, browser });

  return new NextResponse(null, { status: 204 });
}
