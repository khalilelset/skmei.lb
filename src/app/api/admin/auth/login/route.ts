import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = 'khalilelset';
const ADMIN_PASSWORD = 'khalil123';
const SESSION_TOKEN = btoa(ADMIN_USERNAME + ':' + ADMIN_PASSWORD + ':skmei-admin-session');

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_auth', SESSION_TOKEN, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
