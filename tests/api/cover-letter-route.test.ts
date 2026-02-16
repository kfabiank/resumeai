import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession, mockGenerateCoverLetter } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
    resume: { findUnique: vi.fn() },
    coverLetter: { findMany: vi.fn(), create: vi.fn() },
    usageLog: { create: vi.fn() },
  },
  mockGetAuthSession: vi.fn(),
  mockGenerateCoverLetter: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));
vi.mock('@/lib/ai-service', () => ({ generateCoverLetter: mockGenerateCoverLetter }));

import { GET, POST } from '@/app/api/cover-letter/route';

describe('/api/cover-letter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockGetAuthSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('POST enforces paid plan', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ planType: 'free' });

    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: 'r1', company: 'ACME' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);
  });

  it('POST creates cover letter for pro plan', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ planType: 'pro' });
    mockPrisma.resume.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      jobTitle: 'Engineer',
      jobDescription: 'React role',
      jobUrl: null,
      content: {
        personalInfo: { name: 'Jane', email: 'jane@example.com', phone: '123' },
        experiences: [{ title: 'Dev', company: 'A', optimizedBullets: ['Did X'] }],
        education: [],
        skills: { technical: ['React'], soft: ['Communication'] },
      },
    });
    mockGenerateCoverLetter.mockResolvedValue('Generated letter');
    mockPrisma.coverLetter.create.mockResolvedValue({
      id: 'c1',
      company: 'ACME',
      position: 'Engineer',
      content: 'Generated letter',
      createdAt: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/cover-letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeId: 'r1', company: 'ACME', position: 'Engineer' }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.letter.id).toBe('c1');
    expect(mockGenerateCoverLetter).toHaveBeenCalled();
    expect(mockPrisma.usageLog.create).toHaveBeenCalled();
  });
});
