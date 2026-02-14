import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    name: user.name || '',
    email: user.email,
    planType: user.planType,
    image: user.image || '',
    phone: user.profile?.phone || '',
    location: user.profile?.location || '',
    headline: user.profile?.headline || '',
    summary: user.profile?.summary || '',
    linkedinUrl: user.profile?.linkedinUrl || '',
    portfolioUrl: user.profile?.portfolioUrl || '',
    githubUrl: user.profile?.githubUrl || '',
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    headline?: string;
    summary?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    githubUrl?: string;
  };

  const email = body.email?.trim().toLowerCase();
  const name = body.name?.trim();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        email,
      },
    });

    await prisma.userProfile.upsert({
      where: { userId },
      update: {
        phone: body.phone?.trim() || null,
        location: body.location?.trim() || null,
        headline: body.headline?.trim() || null,
        summary: body.summary?.trim() || null,
        linkedinUrl: body.linkedinUrl?.trim() || null,
        portfolioUrl: body.portfolioUrl?.trim() || null,
        githubUrl: body.githubUrl?.trim() || null,
      },
      create: {
        userId,
        phone: body.phone?.trim() || null,
        location: body.location?.trim() || null,
        headline: body.headline?.trim() || null,
        summary: body.summary?.trim() || null,
        linkedinUrl: body.linkedinUrl?.trim() || null,
        portfolioUrl: body.portfolioUrl?.trim() || null,
        githubUrl: body.githubUrl?.trim() || null,
        experiences: [],
        education: [],
        skills: [],
        languages: [],
        certifications: [],
      },
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'That email is already in use' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
