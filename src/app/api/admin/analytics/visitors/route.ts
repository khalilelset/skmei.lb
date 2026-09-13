import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

type Period = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_30_days';

function getDateRange(period: Period): { from: Date; to: Date } {
  const now = new Date();

  switch (period) {
    case 'today': {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case 'this_week': {
      const from = new Date(now);
      const day = from.getDay();
      from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    case 'last_week': {
      const from = new Date(now);
      const day = from.getDay();
      from.setDate(from.getDate() - (day === 0 ? 6 : day - 1) - 7);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    case 'last_30_days':
    default: {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return { from, to: now };
    }
  }
}

function fillDays(from: Date, to: Date, dailyMap: Record<string, number>): { date: string; pageviews: number }[] {
  const days: { date: string; pageviews: number }[] = [];
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const date = cur.toISOString().slice(0, 10);
    days.push({ date, pageviews: dailyMap[date] ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export async function GET(req: NextRequest) {
  const period = (req.nextUrl.searchParams.get('period') ?? 'last_30_days') as Period;
  const { from, to } = getDateRange(period);

  const { data, error } = await supabaseServer
    .from('pageviews')
    .select('url, country, device, browser, created_at')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
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

  const daily = fillDays(from, to, dailyMap);

  const rank = (map: Record<string, number>) =>
    Object.entries(map).sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));

  const todayStr = new Date().toISOString().slice(0, 10);

  return NextResponse.json({
    total:       rows.length,
    todayVisits: dailyMap[todayStr] ?? 0,
    daily,
    countries:   rank(countryMap),
    devices:     rank(deviceMap),
    browsers:    rank(browserMap),
    pages:       rank(pageMap).slice(0, 10),
  });
}
