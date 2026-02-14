export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/builder/:path*', '/settings/:path*', '/tracker/:path*', '/profile/:path*', '/admin/:path*'],
};
