import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { PLAN_LIMITS } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        planType: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: noStoreHeaders });
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [resumes, resumesThisMonth, applications, interviews, avgAts, coverLetters] = await Promise.all([
      prisma.resume.findMany({
        where: { userId },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.resume.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.jobApplication.count({ where: { userId } }),
      prisma.jobApplication.count({ where: { userId, status: 'interview' } }),
      prisma.resume.aggregate({ where: { userId }, _avg: { atsScore: true } }),
      prisma.coverLetter.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          company: true,
          position: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      user: {
        ...user,
        resumesThisMonth,
        resumesLimit: PLAN_LIMITS[user.planType as keyof typeof PLAN_LIMITS]?.resumesPerMonth ?? 3,
      },
      stats: {
        totalResumes: resumes.length,
        avgScore: avgAts._avg.atsScore ? Number(avgAts._avg.atsScore.toFixed(1)) : 0,
        applications,
        interviews,
      },
      resumes: resumes.map((r) => ({
        id: r.id,
        title: r.title,
        atsScore: r.atsScore,
        updatedAt: r.updatedAt,
        templateName: r.template?.name || r.templateId,
        templateId: r.templateId,
      })),
      coverLetters: coverLetters.map((cl) => ({
        id: cl.id,
        company: cl.company,
        position: cl.position,
        createdAt: cl.createdAt,
      })),
    }, { headers: noStoreHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', message: error.message },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
