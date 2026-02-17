import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAuthSession,
  mockSendBillingEmail,
  mockGetBillingEmailPreview,
} = vi.hoisted(() => ({
  mockGetAuthSession: vi.fn(),
  mockSendBillingEmail: vi.fn(),
  mockGetBillingEmailPreview: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ getAuthSession: mockGetAuthSession }));
vi.mock('@/lib/email', () => ({
  sendBillingEmail: mockSendBillingEmail,
  getBillingEmailPreview: mockGetBillingEmailPreview,
}));

import { POST as sendTestEmail } from '@/app/api/admin/test-email/route';
import { POST as previewEmail } from '@/app/api/admin/email-preview/route';

describe('/api/admin email routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ROOT_ADMIN_EMAIL = 'admin@example.com';
    mockSendBillingEmail.mockResolvedValue({ ok: true, skipped: false, reason: null });
    mockGetBillingEmailPreview.mockReturnValue({
      subject: 'Welcome to ResumeAI',
      html: '<html><body>Preview</body></html>',
    });
  });

  it('test-email returns 401 for unauthorized user', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'user@example.com' } });

    const req = new Request('http://localhost/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await sendTestEmail(req as any);
    expect(res.status).toBe(401);
  });

  it('test-email sends email for admin', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });

    const req = new Request('http://localhost/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'kfabiank@gmail.com',
        kind: 'payment_failed',
        planLabel: 'Premium',
      }),
    });

    const res = await sendTestEmail(req as any);
    expect(res.status).toBe(200);
    expect(mockSendBillingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kfabiank@gmail.com',
        kind: 'payment_failed',
        planLabel: 'Premium',
      })
    );
  });

  it('test-email validates kind', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });

    const req = new Request('http://localhost/api/admin/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'invalid_kind',
      }),
    });

    const res = await sendTestEmail(req as any);
    expect(res.status).toBe(400);
  });

  it('email-preview validates kind', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });

    const req = new Request('http://localhost/api/admin/email-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'invalid_kind' }),
    });

    const res = await previewEmail(req as any);
    expect(res.status).toBe(400);
  });

  it('email-preview returns subject and html for admin', async () => {
    mockGetAuthSession.mockResolvedValue({ user: { id: 'u1', email: 'admin@example.com' } });

    const req = new Request('http://localhost/api/admin/email-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'welcome', planLabel: 'Pro' }),
    });

    const res = await previewEmail(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subject).toBe('Welcome to ResumeAI');
    expect(body.html).toContain('Preview');
  });
});
