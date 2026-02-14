import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession, mockGenerateOptimizedResume } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
    resume: {
      count: vi.fn(),
      create: vi.fn(),
    },
    usageLog: {
      create: vi.fn(),
    },
    template: {
      upsert: vi.fn(),
    },
  },
  mockGetAuthSession: vi.fn(),
  mockGenerateOptimizedResume: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));
vi.mock('@/lib/ai-service', () => ({
  generateOptimizedResume: mockGenerateOptimizedResume,
}));

import { POST } from '@/app/api/generate/resume/route';

describe('/api/generate/resume', () => {
  const validBody = {
    templateId: 'tech-minimal',
    jobDescription: 'We need a senior engineer with React and Node experience.',
    jobUrl: 'https://example.com/job',
    personalInfo: {
      name: 'Jane Doe',
      headline: 'Senior Engineer',
      email: 'jane@example.com',
    },
    experiences: [{ title: 'Software Engineer' }],
    education: [],
    skills: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthSession.mockResolvedValue(null);

    const req = new Request('http://localhost/api/generate/resume', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });

    const req = new Request('http://localhost/api/generate/resume', {
      method: 'POST',
      body: JSON.stringify({ personalInfo: { name: 'Jane' }, experiences: [] }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing required fields' });
  });

  it('creates resume using selected template id', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', planType: 'free' });
    mockPrisma.resume.count.mockResolvedValue(0);
    mockGenerateOptimizedResume.mockResolvedValue({
      personalInfo: { name: 'Jane Doe' },
      professionalSummary: 'Summary',
      experiences: [],
      education: [],
      skills: [],
      keywords: ['react'],
      improvements: ['add metrics'],
      atsScore: 89,
    });
    mockPrisma.resume.create.mockResolvedValue({ id: 'r1' });

    const req = new Request('http://localhost/api/generate/resume', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as any);

    expect(mockPrisma.template.upsert).toHaveBeenCalled();
    expect(mockPrisma.resume.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          templateId: 'tech-minimal',
          userId: 'u1',
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.resumeId).toBe('r1');
  });

  it('enforces free plan monthly limit', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', planType: 'free' });
    mockPrisma.resume.count.mockResolvedValue(3);

    const req = new Request('http://localhost/api/generate/resume', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Monthly resume limit reached');
  });
});
