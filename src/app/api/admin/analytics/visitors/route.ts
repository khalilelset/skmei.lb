import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseServer
    .from('pageviews')
    .select('url, country, device, browser, created_at')
    .gte('created_at', from)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  const dailyMap:   Record<string, number> = {};
  const countryMap: Record<string, number> = {};
  const deviceMap:  Record<string, number> = {};
  const browserMap: Record<string, number> = {};
  const pageMap:    Record<string, number> = {};

  for (const row of rows) {
    const date = (row.created_at as string).slice(0, 10);
    dailyMap[date] = (dailyMap[date] ?? 0) + 1;

    if (row.country) countryMap[row.country] = (countryMap[row.country] ?? 0) + 1;
    if (row.device)  deviceMap[row.device]   = (deviceMap[row.device]   ?? 0) + 1;
    if (row.browser) browserMap[row.browser] = (browserMap[row.browser] ?? 0) + 1;

    const page = (row.url as string).split('?')[0];
    pageMap[page] = (pageMap[page] ?? 0) + 1;
  }

  // Fill every day of the last 30 days (zeros for days with no data)
  const daily: { date: string; pageviews: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const date = d.toISOString().slice(0, 10);
    daily.push({ date, pageviews: dailyMap[date] ?? 0 });
  }

  const rank = (map: Record<string, number>) =>
    Object.entries(map).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));

  return NextResponse.json({
    total:     rows.length,
    daily,
    countries: rank(countryMap),
    devices:   rank(deviceMap),
    browsers:  rank(browserMap),
    pages:     rank(pageMap).slice(0, 10),
  });
}
