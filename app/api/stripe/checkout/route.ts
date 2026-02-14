import { NextRequest, NextResponse } from 'next/server';
import {
  stripe,
  getConfiguredPriceId,
  getPlanByPriceId,
  type BillingPeriod,
  type PaidPlanType,
} from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const authSession = await getAuthSession();
    const currentUserId = authSession?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, billingPeriod, priceId: incomingPriceId } = body as {
      plan?: PaidPlanType;
      billingPeriod?: BillingPeriod;
      priceId?: string;
    };

    if (!incomingPriceId && (!plan || !billingPeriod)) {
      return NextResponse.json(
        { error: 'Missing required fields: provide priceId OR plan + billingPeriod' },
        { status: 400 }
      );
    }

    let selectedPlan: PaidPlanType | undefined = plan;
    let selectedBillingPeriod: BillingPeriod | undefined = billingPeriod;
    let resolvedPriceId = incomingPriceId || '';

    if (incomingPriceId) {
      const mapped = getPlanByPriceId(incomingPriceId);
      if (!mapped) {
        return NextResponse.json(
          { error: 'Invalid priceId. It is not mapped to a paid plan.' },
          { status: 400 }
        );
      }
      selectedPlan = mapped.plan;
      selectedBillingPeriod = mapped.billingPeriod;
      resolvedPriceId = incomingPriceId;
    } else {
      if (!selectedPlan || !selectedBillingPeriod) {
        return NextResponse.json(
          { error: 'Missing plan or billingPeriod' },
          { status: 400 }
        );
      }
    }

    // Validate plan
    if (!selectedPlan || !['pro', 'premium'].includes(selectedPlan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro" or "premium"' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to user
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    if (!incomingPriceId) {
      resolvedPriceId = getConfiguredPriceId(
        selectedPlan,
        selectedBillingPeriod as BillingPeriod
      ) || '';
    }

    if (!resolvedPriceId || resolvedPriceId === 'price_xxx') {
      // For demo/development, return a message about setting up Stripe
      return NextResponse.json(
        {
          error: 'Stripe price IDs not configured',
          message: 'Please set up your Stripe products and add the price IDs to your .env file',
          setupRequired: true,
        },
        { status: 400 }
      );
    }

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan: selectedPlan,
        billingPeriod: selectedBillingPeriod,
        priceId: resolvedPriceId,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: selectedPlan,
          billingPeriod: selectedBillingPeriod,
          priceId: resolvedPriceId,
        },
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', message: error.message },
      { status: 500 }
    );
  }
}
