import { NextRequest, NextResponse } from 'next/server';

// Simple in-process rate limiter — max 10 attempts per 15 min per IP
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await req.json();

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET;

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !SESSION_SECRET) {
      console.error('[auth] Admin env vars not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const validUser = username === ADMIN_USERNAME;
    const validPass = password === ADMIN_PASSWORD;

    if (!validUser || !validPass) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_auth', SESSION_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
