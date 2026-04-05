import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/admin/login';

function getExpectedToken(): string {
  return process.env.ADMIN_SESSION_SECRET ?? '';
}

function isAdminAuthed(req: NextRequest): boolean {
  const token = req.cookies.get('admin_auth')?.value;
  const expected = getExpectedToken();
  if (!token || !expected) return false;
  // Constant-time comparison to prevent timing attacks
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAdminAuthed(req);

  // ── /api/admin/* — return JSON 401 when unauthenticated ──────────────
  if (pathname.startsWith('/api/admin/')) {
    // Always allow auth endpoints (login / logout)
    if (
      pathname === '/api/admin/auth/login' ||
      pathname === '/api/admin/auth/logout'
    ) {
      return NextResponse.next();
    }
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── /admin/* UI routes — redirect to login when unauthenticated ──────
  if (pathname === LOGIN_PATH) {
    if (authed) return NextResponse.redirect(new URL('/admin', req.url));
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
