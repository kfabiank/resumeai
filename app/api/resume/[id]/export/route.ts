import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import jsPDF from 'jspdf';
import { buildResumeDownloadName } from '@/lib/resume-render';

export async function POST(
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

    // Get resume from database
    const resume = await prisma.resume.findUnique({
      where: { id },
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

    const content = resume.content as any;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = 595;
    const pageHeight = 842;
    const left = 50;
    const right = 50;
    const maxWidth = pageWidth - left - right;
    let y = 60;

    const ensureSpace = (needed = 24) => {
      if (y + needed > pageHeight - 50) {
        doc.addPage();
        y = 60;
      }
    };

    const writeText = (text: string, size = 11, style: 'normal' | 'bold' = 'normal', gap = 8) => {
      const safe = String(text || '').trim();
      if (!safe) return;
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(safe, maxWidth);
      ensureSpace(lines.length * (size + 2) + gap);
      doc.text(lines, left, y);
      y += lines.length * (size + 2) + gap;
    };

    const sectionTitle = (title: string) => {
      ensureSpace(24);
      doc.setDrawColor(200, 200, 200);
      doc.line(left, y, pageWidth - right, y);
      y += 16;
      writeText(title, 12, 'bold', 6);
    };

    const name = content?.personalInfo?.name || resume.title || 'Resume';
    const headline = content?.personalInfo?.headline || '';
    const contactLine = [
      content?.personalInfo?.email,
      content?.personalInfo?.phone,
      content?.personalInfo?.location,
      content?.personalInfo?.linkedin,
      content?.personalInfo?.portfolio,
    ]
      .filter(Boolean)
      .join('  |  ');

    writeText(name, 24, 'bold', 8);
    writeText(headline, 13, 'normal', 4);
    writeText(contactLine, 10, 'normal', 14);

    sectionTitle('PROFESSIONAL SUMMARY');
    writeText(content?.professionalSummary || '', 11, 'normal', 10);

    sectionTitle('EXPERIENCE');
    const experiences = Array.isArray(content?.experiences) ? content.experiences : [];
    for (const exp of experiences) {
      const period = `${exp?.startDate || ''}${exp?.current ? ' - Present' : exp?.endDate ? ` - ${exp.endDate}` : ''}`;
      writeText(`${exp?.title || ''} - ${exp?.company || ''}`, 12, 'bold', 4);
      writeText(period, 10, 'normal', 6);
      const bullets = Array.isArray(exp?.optimizedBullets) ? exp.optimizedBullets : [];
      for (const bullet of bullets) {
        writeText(`- ${bullet}`, 10, 'normal', 4);
      }
      y += 6;
    }

    sectionTitle('EDUCATION');
    const education = Array.isArray(content?.education) ? content.education : [];
    for (const edu of education) {
      writeText(`${edu?.degree || ''} - ${edu?.institution || ''}`, 11, 'bold', 4);
      writeText(
        [edu?.graduationDate, edu?.location, edu?.gpa ? `GPA ${edu.gpa}` : null].filter(Boolean).join(' | '),
        10,
        'normal',
        8
      );
    }

    sectionTitle('SKILLS');
    const technical = Array.isArray(content?.skills?.technical) ? content.skills.technical.join(', ') : '';
    const soft = Array.isArray(content?.skills?.soft) ? content.skills.soft.join(', ') : '';
    writeText(`Technical: ${technical}`, 10, 'normal', 6);
    writeText(`Soft: ${soft}`, 10, 'normal', 10);

    await prisma.usageLog.create({
      data: {
        userId: currentUserId,
        actionType: 'resume_exported',
        metadata: {
          resumeId: resume.id,
          format: 'pdf',
        },
      },
    });

    const fileName = buildResumeDownloadName(content?.personalInfo?.name, resume.title || 'resume');
    const pdfArrayBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
