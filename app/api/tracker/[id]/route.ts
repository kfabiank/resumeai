import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

async function getOwnedApplication(userId: string, id: string) {
  const app = await prisma.jobApplication.findUnique({ where: { id } });
  if (!app || app.userId !== userId) return null;
  return app;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const app = await getOwnedApplication(userId, params.id);
  if (!app) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
  }

  return NextResponse.json(app, { headers });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const existing = await getOwnedApplication(userId, params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
  }

  const body = await request.json();

  const updated = await prisma.jobApplication.update({
    where: { id: params.id },
    data: {
      company: body.company?.trim() ?? existing.company,
      position: body.position?.trim() ?? existing.position,
      location: body.location?.trim() || null,
      jobUrl: body.jobUrl?.trim() || null,
      salary: body.salary?.trim() || null,
      status: body.status ?? existing.status,
      priority: body.priority ?? existing.priority,
      appliedDate: body.appliedDate ? new Date(body.appliedDate) : existing.appliedDate,
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : body.interviewDate === null ? null : existing.interviewDate,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : body.followUpDate === null ? null : existing.followUpDate,
      notes: body.notes !== undefined ? (body.notes?.trim() || null) : existing.notes,
      contacts: body.contacts !== undefined ? body.contacts : existing.contacts,
    },
  });

  return NextResponse.json(updated, { headers });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const existing = await getOwnedApplication(userId, params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers });
  }

  await prisma.jobApplication.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true }, { headers });
}
