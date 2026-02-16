import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: {
      findMany: vi.fn(),
    },
  },
  mockGetAuthSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));

import { GET } from '@/app/api/tracker/reminders/route';

describe('/api/tracker/reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 unauthenticated', async () => {
    mockGetAuthSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns normalized reminders payload', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    mockPrisma.jobApplication.findMany.mockResolvedValue([
      {
        id: 'a1',
        company: 'ACME',
        position: 'SE',
        interviewDate: tomorrow,
        followUpDate: null,
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reminders).toHaveLength(1);
    expect(body.reminders[0].type).toBe('interview');
  });
});
