import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { generateCoverLetter } from '@/lib/ai-service';
import { PLAN_FEATURES } from '@/lib/stripe';

type ResumeContent = {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    headline?: string;
  };
  professionalSummary?: string;
  experiences?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    optimizedBullets?: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
  };
};

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const letters = await prisma.coverLetter.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ letters }, { headers });
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true, name: true, email: true },
  });
  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers });
  }

  const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
  const canUseCoverLetters =
    PLAN_FEATURES[currentUser.planType as keyof typeof PLAN_FEATURES]?.coverLetters ?? false;
  if (!canUseCoverLetters) {
    return NextResponse.json(
      { error: 'Cover Letter generator requires Pro or Premium plan' },
      { status: 403, headers }
    );
  }

  const body = (await request.json()) as {
    resumeId?: string;
    company?: string;
    position?: string;
    jobDescription?: string;
  };

  if (!body.resumeId || !body.company?.trim()) {
    return NextResponse.json(
      { error: 'resumeId and company are required' },
      { status: 400, headers }
    );
  }

  const resume = await prisma.resume.findUnique({ where: { id: body.resumeId } });
  if (!resume || resume.userId !== userId) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404, headers });
  }

  const content = (resume.content || {}) as ResumeContent;

  // Fallback chain: resume content → user profile → session
  const profileExperiences = Array.isArray(userProfile?.experiences)
    ? (userProfile.experiences as Array<{ title?: string; company?: string; location?: string; startDate?: string; endDate?: string; description?: string }>)
    : [];
  const profileEducation = Array.isArray(userProfile?.education)
    ? (userProfile.education as Array<{ degree?: string; institution?: string; location?: string; graduationDate?: string; gpa?: string }>)
    : [];
  const profileSkills = Array.isArray(userProfile?.skills)
    ? (userProfile.skills as string[])
    : [];

  const experienceForAI = (content.experiences?.length
    ? content.experiences.map((exp) => ({
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: !!exp.current,
        description: (exp.optimizedBullets || []).join(' '),
      }))
    : profileExperiences.map((exp) => ({
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: false,
        description: exp.description || '',
      }))
  );

  const generatedContent = await generateCoverLetter(
    {
      jobDescription: body.jobDescription || resume.jobDescription || '',
      jobUrl: resume.jobUrl || undefined,
      personalInfo: {
        name: content.personalInfo?.name || currentUser.name || '',
        email: content.personalInfo?.email || currentUser.email || '',
        phone: content.personalInfo?.phone || userProfile?.phone || '',
        location: content.personalInfo?.location || userProfile?.location || '',
        linkedin: content.personalInfo?.linkedin || userProfile?.linkedinUrl || '',
        portfolio: content.personalInfo?.portfolio || userProfile?.portfolioUrl || '',
        headline: content.personalInfo?.headline || userProfile?.headline || '',
      },
      experiences: experienceForAI,
      education: (content.education?.length
        ? content.education.map((edu) => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            location: edu.location || '',
            graduationDate: edu.graduationDate || '',
            gpa: edu.gpa || '',
          }))
        : profileEducation.map((edu) => ({
            degree: edu.degree || '',
            institution: edu.institution || '',
            location: edu.location || '',
            graduationDate: edu.graduationDate || '',
            gpa: edu.gpa || '',
          }))
      ),
      skills: (content.skills?.technical?.length || content.skills?.soft?.length)
        ? [
            ...(content.skills?.technical || []),
            ...(content.skills?.soft || []),
          ]
        : profileSkills,
    },
    body.company.trim()
  );

  const letter = await prisma.coverLetter.create({
    data: {
      userId,
      resumeId: resume.id,
      company: body.company.trim(),
      position: body.position?.trim() || resume.jobTitle || 'Role',
      content: generatedContent,
    },
  });

  await prisma.usageLog.create({
    data: {
      userId,
      actionType: 'cover_letter',
      metadata: {
        coverLetterId: letter.id,
        resumeId: resume.id,
      },
    },
  });

  return NextResponse.json({ letter }, { status: 201, headers });
}
