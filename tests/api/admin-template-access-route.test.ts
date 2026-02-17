import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAuthSession,
  mockGetEffectiveTemplateAccessMap,
  mockGetDefaultTemplateAccessMap,
  mockSaveTemplateAccessOverride,
} = vi.hoisted(() => ({
  mockGetAuthSession: vi.fn(),
  mockGetEffectiveTemplateAccessMap: vi.fn(),
  mockGetDefaultTemplateAccessMap: vi.fn(),
  mockSaveTemplateAccessOverride: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));
vi.mock('@/lib/template-access', () => ({
  getEffectiveTemplateAccessMap: mockGetEffectiveTemplateAccessMap,
  getDefaultTemplateAccessMap: mockGetDefaultTemplateAccessMap,
  saveTemplateAccessOverride: mockSaveTemplateAccessOverride,
}));

import { GET, POST } from '@/app/api/admin/template-access/route';

describe('/api/admin/template-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ROOT_ADMIN_EMAIL = 'admin@example.com';
    mockGetDefaultTemplateAccessMap.mockReturnValue({
      'modern-professional': { free: true, pro: true, premium: true },
    });
  });

  it('GET returns 401 for non-admin user', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'user@example.com' } });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns map for admin', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockGetEffectiveTemplateAccessMap.mockResolvedValue({
      'modern-professional': { free: true, pro: true, premium: true },
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map['modern-professional'].free).toBe(true);
  });

  it('POST validates payload', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });

    const req = new Request('http://localhost/api/admin/template-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('POST saves override map for admin', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });
    mockSaveTemplateAccessOverride.mockResolvedValue({
      'modern-professional': { free: false, pro: true, premium: true },
    });

    const req = new Request('http://localhost/api/admin/template-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        map: {
          'modern-professional': { free: false, pro: true, premium: true },
        },
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockSaveTemplateAccessOverride).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        'modern-professional': expect.any(Object),
      })
    );
  });
});
