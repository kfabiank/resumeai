import NextAuth from 'next-auth';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, context: { params: { nextauth: string[] } }) {
  const { authOptions } = await import('@/lib/auth');
  const nextAuthHandler = NextAuth(authOptions);
  return nextAuthHandler(request, context);
}

export { handler as GET, handler as POST };
