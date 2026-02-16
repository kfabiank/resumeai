import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

async function getOwnedResume(userId: string, resumeId: string) {
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  if (!resume || resume.userId !== userId) return null;
  return resume;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const resume = await getOwnedResume(userId, params.id);
  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404, headers });
  }

  return NextResponse.json(
    {
      isPublic: resume.isPublic,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/resume/shared/${resume.id}`,
    },
    { headers }
  );
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const resume = await getOwnedResume(userId, params.id);
  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404, headers });
  }

  const body = (await request.json()) as { isPublic?: boolean };
  if (typeof body.isPublic !== 'boolean') {
    return NextResponse.json({ error: 'isPublic is required' }, { status: 400, headers });
  }

  const updated = await prisma.resume.update({
    where: { id: params.id },
    data: { isPublic: body.isPublic },
    select: { id: true, isPublic: true },
  });

  return NextResponse.json(
    {
      ...updated,
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/resume/shared/${updated.id}`,
    },
    { headers }
  );
}
