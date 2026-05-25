import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Routes that require an authenticated session */
const PROTECTED_PATHS = ['/profil', '/sikayet-bildir'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Supabase sets a cookie with 'auth-token' in its name or 'sb-' prefix
  const hasCookie = [...request.cookies.getAll()].some(
    c => c.name.includes('auth-token') || c.name.startsWith('sb-')
  );

  if (!hasCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/giris';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profil/:path*',
    '/sikayet-bildir/:path*',
  ],
};
