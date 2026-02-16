import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession } = vi.hoisted(() => ({
  mockPrisma: {
    resume: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  mockGetAuthSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));

import { GET, PATCH } from '@/app/api/resume/[id]/share/route';

describe('/api/resume/[id]/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns share status for owner', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.resume.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      isPublic: false,
    });

    const res = await GET({} as any, { params: { id: 'r1' } } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPublic).toBe(false);
  });

  it('PATCH updates visibility', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.resume.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      isPublic: false,
    });
    mockPrisma.resume.update.mockResolvedValue({
      id: 'r1',
      isPublic: true,
    });

    const req = new Request('http://localhost/api/resume/r1/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    });
    const res = await PATCH(req as any, { params: { id: 'r1' } } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isPublic).toBe(true);
  });
});
