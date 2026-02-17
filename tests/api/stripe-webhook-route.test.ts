import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockPrisma,
  mockStripe,
  mockGetPlanByPriceId,
  mockSendBillingEmail,
} = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    usageLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
  mockStripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
  mockGetPlanByPriceId: vi.fn(),
  mockSendBillingEmail: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@/lib/stripe', () => ({
  stripe: mockStripe,
  getPlanByPriceId: mockGetPlanByPriceId,
}));
vi.mock('@/lib/email', () => ({
  sendBillingEmail: mockSendBillingEmail,
}));

import { POST } from '@/app/api/stripe/webhook/route';

describe('/api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    mockGetPlanByPriceId.mockReturnValue({ plan: 'pro' });
    mockSendBillingEmail.mockResolvedValue({ ok: true, skipped: false });
    mockPrisma.usageLog.findFirst.mockResolvedValue(null);
  });

  it('returns 400 when signature header is missing', async () => {
    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Missing stripe-signature header' });
  });

  it('handles checkout.session.completed and sends welcome email', async () => {
    const event = {
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          subscription: 'sub_1',
          customer: 'cus_1',
          metadata: {
            userId: 'u1',
            plan: 'pro',
          },
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(event);
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_1',
      status: 'active',
      current_period_end: 1735689600,
      metadata: { userId: 'u1' },
      items: { data: [{ price: { id: 'price_pro' } }] },
    });

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'u1@example.com',
      planType: 'free',
    });

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ any: 'payload' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
    });

    const res = await POST(req as any);

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          planType: 'pro',
          stripeSubscriptionId: 'sub_1',
          subscriptionStatus: 'active',
        }),
      })
    );
    expect(mockSendBillingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u1@example.com',
        kind: 'welcome',
      })
    );
  });

  it('handles customer.subscription.updated via fallback mapping and sends plan_upgraded email', async () => {
    const event = {
      id: 'evt_2',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_2',
          customer: 'cus_2',
          metadata: {},
          status: 'active',
          current_period_end: 1735689600,
          items: { data: [{ price: { id: 'price_premium' } }] },
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(event);
    mockGetPlanByPriceId.mockReturnValue({ plan: 'premium' });

    mockPrisma.user.findFirst.mockResolvedValueOnce({
      id: 'u2',
      email: 'u2@example.com',
      planType: 'pro',
    });

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ any: 'payload' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
    });

    const res = await POST(req as any);

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({ planType: 'premium' }),
      })
    );
    expect(mockSendBillingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u2@example.com',
        kind: 'plan_upgraded',
      })
    );
  });

  it('returns 400 for invalid Stripe signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('handles customer.subscription.deleted and sends cancellation email', async () => {
    const event = {
      id: 'evt_3',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_3',
          customer: 'cus_3',
          metadata: { userId: 'u3', plan: 'pro' },
          current_period_end: 1735689600,
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(event);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u3',
      email: 'u3@example.com',
      planType: 'pro',
    });

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ any: 'payload' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u3' },
        data: expect.objectContaining({ planType: 'free', subscriptionStatus: 'canceled' }),
      })
    );
    expect(mockSendBillingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u3@example.com',
        kind: 'subscription_canceled',
      })
    );
  });

  it('handles invoice.payment_failed and sends payment_failed email', async () => {
    const event = {
      id: 'evt_4',
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_4',
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(event);
    mockStripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_4',
      status: 'past_due',
      current_period_end: 1735689600,
      metadata: { userId: 'u4', plan: 'pro' },
      customer: 'cus_4',
      items: { data: [{ price: { id: 'price_pro' } }] },
    });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u4',
      email: 'u4@example.com',
      planType: 'pro',
    });

    const req = new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ any: 'payload' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'sig_test',
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u4' },
        data: expect.objectContaining({ subscriptionStatus: 'past_due' }),
      })
    );
    expect(mockSendBillingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'u4@example.com',
        kind: 'payment_failed',
      })
    );
  });
});
