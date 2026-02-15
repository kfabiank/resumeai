import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({
      authenticated: false,
      session: null,
      dbUser: null,
    });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      planType: true,
    },
  });

  return NextResponse.json({
    authenticated: true,
    session: {
      id: session?.user?.id || null,
      email: session?.user?.email || null,
      name: session?.user?.name || null,
      role: session?.user?.role || null,
    },
    dbUser,
  });
}
