import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
    jobApplication: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
  mockGetAuthSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));

import { POST } from '@/app/api/tracker/route';

describe('/api/tracker POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enforces free plan tracker limit', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ planType: 'free' });
    mockPrisma.jobApplication.count.mockResolvedValue(10);

    const req = new Request('http://localhost/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: 'ACME', position: 'SE' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('TRACKER_LIMIT_REACHED');
  });

  it('creates application for paid plans', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ planType: 'pro' });
    mockPrisma.jobApplication.create.mockResolvedValue({ id: 'a1', company: 'ACME' });

    const req = new Request('http://localhost/api/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: 'ACME', position: 'SE', status: 'applied', priority: 'medium' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    expect(mockPrisma.jobApplication.create).toHaveBeenCalled();
  });
});
