import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { PLAN_FEATURES } from '@/lib/stripe';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

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
    startDate?: string;
    endDate?: string;
    current?: boolean;
    optimizedBullets?: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
  };
};

export async function POST(
  _request: NextRequest,
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
      },
    });

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }
    if (resume.userId !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const canExportDocx =
      PLAN_FEATURES[resume.user.planType as keyof typeof PLAN_FEATURES]?.docxExport ?? false;
    if (!canExportDocx) {
      return NextResponse.json(
        { error: 'DOCX export requires Pro or Premium plan' },
        { status: 403 }
      );
    }

    const content = (resume.content || {}) as ResumeContent;
    const personal = content.personalInfo || {};

    const children: Paragraph[] = [];

    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun(personal.name || resume.title || 'Resume')],
      })
    );

    const contactLine = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio]
      .filter(Boolean)
      .join(' | ');
    if (contactLine) {
      children.push(new Paragraph(contactLine));
    }
    if (personal.headline) {
      children.push(new Paragraph(personal.headline));
    }

    if (content.professionalSummary) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Professional Summary' }));
      children.push(new Paragraph(content.professionalSummary));
    }

    if (content.experiences?.length) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Experience' }));
      for (const exp of content.experiences) {
        const titleLine = `${exp.title || ''}${exp.company ? ` - ${exp.company}` : ''}`.trim();
        if (titleLine) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: titleLine, bold: true })],
            })
          );
        }
        const period = `${exp.startDate || ''}${exp.current ? ' - Present' : exp.endDate ? ` - ${exp.endDate}` : ''}`;
        if (period.trim()) {
          children.push(new Paragraph(period));
        }
        for (const bullet of exp.optimizedBullets || []) {
          children.push(
            new Paragraph({
              text: bullet,
              bullet: { level: 0 },
            })
          );
        }
      }
    }

    if (content.education?.length) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Education' }));
      for (const edu of content.education) {
        const line = `${edu.degree || ''}${edu.institution ? ` - ${edu.institution}` : ''}`.trim();
        if (line) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: line, bold: true })],
            })
          );
        }
        const meta = [edu.graduationDate, edu.gpa ? `GPA ${edu.gpa}` : null].filter(Boolean).join(' | ');
        if (meta) {
          children.push(new Paragraph(meta));
        }
      }
    }

    if (content.skills) {
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: 'Skills' }));
      if (content.skills.technical?.length) {
        children.push(new Paragraph(`Technical: ${content.skills.technical.join(', ')}`));
      }
      if (content.skills.soft?.length) {
        children.push(new Paragraph(`Soft: ${content.skills.soft.join(', ')}`));
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    await prisma.usageLog.create({
      data: {
        userId: currentUserId,
        actionType: 'resume_exported',
        metadata: {
          resumeId: resume.id,
          format: 'docx',
        },
      },
    });

    const safeName = `${resume.title || 'resume'}`.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'resume';
    const fileBuffer = await Packer.toBuffer(doc);
    const fileData = new Uint8Array(fileBuffer);

    return new NextResponse(fileData, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeName}.docx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting DOCX:', error);
    return NextResponse.json({ error: 'Failed to export DOCX' }, { status: 500 });
  }
}
