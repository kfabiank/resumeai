import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function expireCookie(response: NextResponse, name: string) {
  response.cookies.set(name, '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function GET(request: NextRequest) {
  const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard';
  const origin = request.nextUrl.origin;
  const googleUrl = new URL('/api/auth/signin/google', origin);
  googleUrl.searchParams.set('callbackUrl', callbackUrl);
  googleUrl.searchParams.set('prompt', 'select_account');
  googleUrl.searchParams.set('t', Date.now().toString());

  const response = NextResponse.redirect(googleUrl.toString());

  // Clear known NextAuth cookies before switching provider.
  expireCookie(response, 'next-auth.session-token');
  expireCookie(response, '__Secure-next-auth.session-token');
  expireCookie(response, 'next-auth.callback-url');
  expireCookie(response, '__Secure-next-auth.callback-url');
  expireCookie(response, 'next-auth.csrf-token');
  expireCookie(response, '__Host-next-auth.csrf-token');
  expireCookie(response, '__Secure-next-auth.csrf-token');
  expireCookie(response, 'next-auth.pkce.code_verifier');
  expireCookie(response, '__Secure-next-auth.pkce.code_verifier');

  // Also clear any chunked/variant next-auth cookies present in request.
  const authCookiePrefixes = [
    'next-auth.',
    '__Secure-next-auth.',
    '__Host-next-auth.',
  ];
  for (const cookie of request.cookies.getAll()) {
    if (authCookiePrefixes.some((prefix) => cookie.name.startsWith(prefix))) {
      expireCookie(response, cookie.name);
    }
  }

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
