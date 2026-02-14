import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLAN_FEATURES, PLAN_LIMITS } from '@/lib/stripe';

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const plan = user.planType as keyof typeof PLAN_FEATURES;
  return NextResponse.json({
    plan,
    limits: PLAN_LIMITS[plan] || PLAN_LIMITS.free,
    features: PLAN_FEATURES[plan] || PLAN_FEATURES.free,
  });
}
