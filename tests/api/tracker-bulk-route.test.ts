import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession } = vi.hoisted(() => ({
  mockPrisma: {
    jobApplication: {
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  mockGetAuthSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));

import { POST } from '@/app/api/tracker/bulk/route';

describe('/api/tracker/bulk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid action', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/tracker/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['1'], action: 'noop' }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('deletes applications in bulk', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.jobApplication.deleteMany.mockResolvedValue({ count: 2 });

    const req = new Request('http://localhost/api/tracker/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['1', '2'], action: 'delete' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.jobApplication.deleteMany).toHaveBeenCalled();
  });

  it('updates status in bulk', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.jobApplication.updateMany.mockResolvedValue({ count: 3 });

    const req = new Request('http://localhost/api/tracker/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['1', '2', '3'], action: 'status', status: 'interview' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.jobApplication.updateMany).toHaveBeenCalled();
  });
});
