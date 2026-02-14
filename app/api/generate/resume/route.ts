import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOptimizedResume, ResumeData } from '@/lib/ai-service';
import { getAuthSession } from '@/lib/auth';
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateById,
  isTemplateId,
} from '@/lib/template-catalog';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ResumeData & { templateId?: string };
    const rawTemplateId = body.templateId ?? '';
    const selectedTemplateId = isTemplateId(rawTemplateId)
      ? rawTemplateId
      : DEFAULT_TEMPLATE_ID;
    const selectedTemplate = getTemplateById(selectedTemplateId);

    if (!selectedTemplate) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    // Validate required fields
    if (!body.jobDescription || !body.personalInfo?.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check user's plan limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { resumes: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check monthly limits
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const resumesThisMonth = await prisma.resume.count({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const limits = {
      free: 3,
      pro: -1, // unlimited
      premium: -1,
    };

    const planLimit = limits[user.planType as keyof typeof limits] || 3;

    if (planLimit !== -1 && resumesThisMonth >= planLimit) {
      return NextResponse.json(
        {
          error: 'Monthly resume limit reached',
          message: 'Upgrade your plan to create more resumes',
          resumesUsed: resumesThisMonth,
          resumesLimit: planLimit,
        },
        { status: 403 }
      );
    }

    // Generate optimized resume using AI
    console.log('Generating optimized resume with AI...');
    const optimizedResume = await generateOptimizedResume(body);

    // Prepare content for database
    const resumeContent = {
      personalInfo: optimizedResume.personalInfo,
      professionalSummary: optimizedResume.professionalSummary,
      experiences: optimizedResume.experiences,
      education: optimizedResume.education,
      skills: optimizedResume.skills,
      keywords: optimizedResume.keywords,
    };

    // Determine job title from description or first experience
    const jobTitle =
      body.experiences[0]?.title ||
      body.personalInfo.headline ||
      'Professional Resume';

    // Ensure the selected template exists so the Resume -> Template relation is valid.
    await prisma.template.upsert({
      where: { id: selectedTemplate.id },
      update: {
        name: selectedTemplate.name,
        category: selectedTemplate.category,
        isPremium: selectedTemplate.isPremium,
        isActive: true,
      },
      create: {
        id: selectedTemplate.id,
        name: selectedTemplate.name,
        description: `${selectedTemplate.name} resume template`,
        category: selectedTemplate.category,
        thumbnail: '',
        htmlStructure: `<div>${selectedTemplate.name}</div>`,
        cssStyles: '',
        colorScheme: {
          gradient: selectedTemplate.colors,
        },
        isPremium: selectedTemplate.isPremium,
        isActive: true,
      },
    });

    // Create resume in database
    const resume = await prisma.resume.create({
      data: {
        userId: userId,
        title: `${jobTitle} - ${new Date().toLocaleDateString()}`,
        jobTitle: body.experiences[0]?.title,
        jobDescription: body.jobDescription,
        jobUrl: body.jobUrl,
        content: resumeContent,
        templateId: selectedTemplate.id,
        atsScore: optimizedResume.atsScore,
        atsFeedback: {
          keywords: optimizedResume.keywords,
          improvements: optimizedResume.improvements,
          score: optimizedResume.atsScore,
        },
      },
    });

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId: userId,
        actionType: 'resume_created',
        metadata: {
          resumeId: resume.id,
          atsScore: optimizedResume.atsScore,
          hasJobUrl: !!body.jobUrl,
        },
      },
    });

    console.log('Resume created successfully:', resume.id);

    return NextResponse.json({
      success: true,
      resumeId: resume.id,
      atsScore: optimizedResume.atsScore,
      message: 'Resume generated successfully',
    });
  } catch (error: any) {
    console.error('Error in resume generation API:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate resume',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
