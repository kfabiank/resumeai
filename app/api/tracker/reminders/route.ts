import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

type ReminderType = 'interview' | 'followup';

type ReminderItem = {
  id: string;
  applicationId: string;
  type: ReminderType;
  dueDate: string;
  company: string;
  position: string;
  urgency: 'overdue' | 'today' | 'upcoming';
};

export async function GET() {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
  }

  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const endWindow = new Date(startToday);
  endWindow.setDate(endWindow.getDate() + 14);

  const apps = await prisma.jobApplication.findMany({
    where: {
      userId,
      status: { notIn: ['rejected', 'withdrawn'] },
      OR: [
        { interviewDate: { not: null } },
        { followUpDate: { not: null } },
      ],
    },
    select: {
      id: true,
      company: true,
      position: true,
      interviewDate: true,
      followUpDate: true,
    },
  });

  const reminders: ReminderItem[] = [];

  const toUrgency = (date: Date): ReminderItem['urgency'] => {
    const cmp = new Date(date);
    cmp.setHours(0, 0, 0, 0);
    if (cmp < startToday) return 'overdue';
    if (cmp.getTime() === startToday.getTime()) return 'today';
    return 'upcoming';
  };

  for (const app of apps) {
    if (app.interviewDate) {
      const d = new Date(app.interviewDate);
      if (d <= endWindow) {
        reminders.push({
          id: `${app.id}-interview`,
          applicationId: app.id,
          type: 'interview',
          dueDate: d.toISOString(),
          company: app.company,
          position: app.position,
          urgency: toUrgency(d),
        });
      }
    }

    if (app.followUpDate) {
      const d = new Date(app.followUpDate);
      if (d <= endWindow) {
        reminders.push({
          id: `${app.id}-followup`,
          applicationId: app.id,
          type: 'followup',
          dueDate: d.toISOString(),
          company: app.company,
          position: app.position,
          urgency: toUrgency(d),
        });
      }
    }
  }

  reminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return NextResponse.json(
    {
      reminders,
      counts: {
        overdue: reminders.filter((r) => r.urgency === 'overdue').length,
        today: reminders.filter((r) => r.urgency === 'today').length,
        upcoming: reminders.filter((r) => r.urgency === 'upcoming').length,
      },
    },
    { headers }
  );
}
