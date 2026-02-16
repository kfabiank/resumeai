import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

const allowedStatuses = new Set([
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
]);

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const body = (await request.json()) as {
    ids?: string[];
    action?: 'delete' | 'status';
    status?: string;
  };

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (!ids.length) {
    return NextResponse.json({ error: 'ids are required' }, { status: 400, headers });
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: 'Too many ids' }, { status: 400, headers });
  }

  if (body.action === 'delete') {
    const result = await prisma.jobApplication.deleteMany({
      where: {
        userId,
        id: { in: ids },
      },
    });
    return NextResponse.json({ success: true, affected: result.count }, { headers });
  }

  if (body.action === 'status') {
    if (!body.status || !allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400, headers });
    }
    const result = await prisma.jobApplication.updateMany({
      where: {
        userId,
        id: { in: ids },
      },
      data: {
        status: body.status,
      },
    });
    return NextResponse.json({ success: true, affected: result.count }, { headers });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers });
}
