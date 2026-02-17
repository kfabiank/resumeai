import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { isTemplateId } from '@/lib/template-catalog';
import { getTemplateById } from '@/lib/template-catalog';
import { ensureTemplateExists } from '@/lib/template-db';
import { PLAN_FEATURES } from '@/lib/stripe';
import { canUserPlanUseTemplate } from '@/lib/template-access';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            planType: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    if (resume.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(resume);
  } catch (error: any) {
    console.error('Error fetching resume:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume', message: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const templateId = body.templateId;

    const existingResume = await prisma.resume.findUnique({ where: { id } });
    if (!existingResume) {
      return NextResponse.json(
        { error: 'Resume not found' },
        { status: 404 }
      );
    }
    if (existingResume.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (templateId && !isTemplateId(templateId)) {
      return NextResponse.json(
        { error: 'Invalid templateId' },
        { status: 400 }
      );
    }

    if (templateId) {
      const tpl = getTemplateById(templateId);
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { planType: true },
      });
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const canUsePremiumTemplates =
        PLAN_FEATURES[currentUser.planType as keyof typeof PLAN_FEATURES]
          ?.premiumTemplates ?? false;
      const canUseTemplateByPolicy = await canUserPlanUseTemplate(currentUser.planType, templateId);
      if (!canUseTemplateByPolicy || (tpl?.isPremium && !canUsePremiumTemplates)) {
        return NextResponse.json(
          { error: 'Upgrade required to use premium templates' },
          { status: 403 }
        );
      }

      await ensureTemplateExists(templateId);
    }

    const resume = await prisma.resume.update({
      where: { id },
      data: {
        content: body.content,
        title: body.title,
        ...(templateId ? { templateId } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(resume);
  } catch (error: any) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { error: 'Failed to update resume', message: error.message },
      { status: 500 }
    );
  }
}
