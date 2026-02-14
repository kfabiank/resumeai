import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      upsert: vi.fn(),
    },
  },
  mockGetAuthSession: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: mockGetAuthSession,
}));

import { GET, PATCH } from '@/app/api/profile/route';

describe('/api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockGetAuthSession.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('GET returns profile payload when authenticated', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'John',
      email: 'john@example.com',
      planType: 'free',
      image: null,
      profile: {
        phone: '123',
        location: 'Madrid',
        headline: 'Engineer',
        summary: 'Summary',
        linkedinUrl: 'https://linkedin.com/in/john',
        portfolioUrl: '',
        githubUrl: 'https://github.com/john',
      },
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe('john@example.com');
    expect(body.headline).toBe('Engineer');
  });

  it('PATCH validates email', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'John' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req as any);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Email is required' });
  });

  it('PATCH updates user and profile', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    const req = new Request('http://localhost/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        name: '  John  ',
        email: '  JOHN@EXAMPLE.COM ',
        phone: '555',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PATCH(req as any);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { name: 'John', email: 'john@example.com' },
    });
    expect(mockPrisma.userProfile.upsert).toHaveBeenCalled();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ success: true });
  });
});
