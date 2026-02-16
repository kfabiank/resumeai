import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPrisma, mockGetAuthSession, mockPackerToBuffer } = vi.hoisted(() => ({
  mockPrisma: {
    resume: { findUnique: vi.fn() },
    usageLog: { create: vi.fn() },
  },
  mockGetAuthSession: vi.fn(),
  mockPackerToBuffer: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));
vi.mock('docx', () => ({
  Document: class {},
  Paragraph: class {},
  TextRun: class {},
  HeadingLevel: { TITLE: 'TITLE', HEADING_2: 'HEADING_2' },
  Packer: { toBuffer: mockPackerToBuffer },
}));

import { POST } from '@/app/api/resume/[id]/export-docx/route';

describe('/api/resume/[id]/export-docx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 403 for free plan', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.resume.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      user: { planType: 'free' },
      content: {},
    });

    const res = await POST({} as any, { params: Promise.resolve({ id: 'r1' }) } as any);
    expect(res.status).toBe(403);
  });

  it('returns docx file for pro plan', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.resume.findUnique.mockResolvedValue({
      id: 'r1',
      userId: 'u1',
      title: 'Resume',
      user: { planType: 'pro' },
      content: {
        personalInfo: { name: 'Jane' },
        skills: { technical: ['TS'], soft: ['Comms'] },
      },
    });
    mockPackerToBuffer.mockResolvedValue(Buffer.from('docx-data'));

    const res = await POST({} as any, { params: Promise.resolve({ id: 'r1' }) } as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(mockPrisma.usageLog.create).toHaveBeenCalled();
  });
});
