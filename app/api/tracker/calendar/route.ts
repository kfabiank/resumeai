import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatDateOnly(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apps = await prisma.jobApplication.findMany({
    where: {
      userId,
      status: { notIn: ['rejected', 'withdrawn'] },
      OR: [{ interviewDate: { not: null } }, { followUpDate: { not: null } }],
    },
    select: {
      id: true,
      company: true,
      position: true,
      interviewDate: true,
      followUpDate: true,
      notes: true,
    },
  });

  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ResumeAI//Tracker Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const app of apps) {
    const events: Array<{ type: 'Interview' | 'Follow-up'; date: Date }> = [];
    if (app.interviewDate) events.push({ type: 'Interview', date: new Date(app.interviewDate) });
    if (app.followUpDate) events.push({ type: 'Follow-up', date: new Date(app.followUpDate) });

    for (const event of events) {
      const startDate = formatDateOnly(event.date);
      const endDate = formatDateOnly(addDays(event.date, 1));
      const summary = `${event.type}: ${app.company} (${app.position})`;
      const description = app.notes
        ? `Tracker event from ResumeAI\\n\\n${escapeIcsText(app.notes)}`
        : 'Tracker event from ResumeAI';

      lines.push(
        'BEGIN:VEVENT',
        `UID:${app.id}-${event.type.toLowerCase()}@resumeai.local`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT'
      );
    }
  }

  lines.push('END:VCALENDAR');

  const ics = `${lines.join('\r\n')}\r\n`;
  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="resumeai-tracker.ics"',
      'Cache-Control': 'no-store',
    },
  });
}
