import { NextRequest, NextResponse } from 'next/server';

const LOGIN_PATH = '/admin/login';
const EXPECTED_TOKEN = btoa('khalilelset:khalil123:skmei-admin-session');

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('admin_auth')?.value;
  const isAuthenticated = token === EXPECTED_TOKEN;

  // If already authenticated and hitting login, redirect to dashboard
  if (pathname === LOGIN_PATH) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
