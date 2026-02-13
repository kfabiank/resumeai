import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOptimizedResume, ResumeData } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const body: ResumeData = await request.json();

    // Validate required fields
    if (!body.jobDescription || !body.personalInfo?.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // For now, we'll use a mock user ID
    // In production, get this from session/auth
    const userId = 'demo-user-123';

    // Check user's plan limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { resumes: true },
        },
      },
    });

    // If user doesn't exist, create demo user
    let currentUser = user;
    if (!currentUser) {
      currentUser = await prisma.user.create({
        data: {
          id: userId,
          email: body.personalInfo.email,
          name: body.personalInfo.name,
          planType: 'free',
        },
        include: {
          _count: {
            select: { resumes: true },
          },
        },
      });
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

    const planLimit = limits[currentUser.planType as keyof typeof limits] || 3;

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

    // Create resume in database
    const resume = await prisma.resume.create({
      data: {
        userId: userId,
        title: `${jobTitle} - ${new Date().toLocaleDateString()}`,
        jobTitle: body.experiences[0]?.title,
        jobDescription: body.jobDescription,
        jobUrl: body.jobUrl,
        content: resumeContent,
        templateId: 'modern-professional', // Default template
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
