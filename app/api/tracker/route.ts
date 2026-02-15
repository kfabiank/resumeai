import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { company: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
    ];
  }

  const applications = await prisma.jobApplication.findMany({
    where,
    orderBy: { appliedDate: 'desc' },
  });

  return NextResponse.json(applications, { headers });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const body = await request.json();

  if (!body.company?.trim() || !body.position?.trim()) {
    return NextResponse.json({ error: 'Company and position are required' }, { status: 400, headers });
  }

  const application = await prisma.jobApplication.create({
    data: {
      userId,
      company: body.company.trim(),
      position: body.position.trim(),
      location: body.location?.trim() || null,
      jobUrl: body.jobUrl?.trim() || null,
      salary: body.salary?.trim() || null,
      status: body.status || 'applied',
      priority: body.priority || 'medium',
      appliedDate: body.appliedDate ? new Date(body.appliedDate) : new Date(),
      interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      notes: body.notes?.trim() || null,
      contacts: body.contacts || null,
    },
  });

  return NextResponse.json(application, { status: 201, headers });
}
