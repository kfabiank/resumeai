import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const resume = await prisma.resume.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      content: true,
      templateId: true,
      updatedAt: true,
      isPublic: true,
      viewCount: true,
    },
  });

  if (!resume || !resume.isPublic) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }

  await prisma.resume.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({
    id: resume.id,
    title: resume.title,
    content: resume.content,
    templateId: resume.templateId,
    updatedAt: resume.updatedAt,
    viewCount: resume.viewCount + 1,
  });
}
