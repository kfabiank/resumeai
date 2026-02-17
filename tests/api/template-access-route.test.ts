import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAuthSession,
  mockPrisma,
  mockGetEffectiveTemplateAccessMap,
  mockCanPlanUseTemplate,
} = vi.hoisted(() => ({
  mockGetAuthSession: vi.fn(),
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
  mockGetEffectiveTemplateAccessMap: vi.fn(),
  mockCanPlanUseTemplate: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));
vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/template-access', () => ({
  getEffectiveTemplateAccessMap: mockGetEffectiveTemplateAccessMap,
  canPlanUseTemplate: mockCanPlanUseTemplate,
}));

import { GET } from '@/app/api/template-access/route';

describe('/api/template-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockGetAuthSession.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when user does not exist', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns allowed template ids based on plan', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1' } });
    mockPrisma.user.findUnique.mockResolvedValue({ planType: 'pro' });
    mockGetEffectiveTemplateAccessMap.mockResolvedValue({
      'modern-professional': { free: true, pro: true, premium: true },
      'executive-classic': { free: false, pro: true, premium: true },
      'creative-bold': { free: false, pro: false, premium: true },
    });

    mockCanPlanUseTemplate.mockImplementation((plan: string, templateId: string) => {
      if (plan !== 'pro') return false;
      return templateId !== 'creative-bold';
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.planType).toBe('pro');
    expect(body.allowedTemplateIds).toEqual(['modern-professional', 'executive-classic']);
  });
});
