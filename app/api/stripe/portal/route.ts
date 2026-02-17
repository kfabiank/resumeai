import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

function getStripeErrorMeta(error: any) {
  return {
    message: error?.message || 'Unknown Stripe error',
    code: error?.code,
    type: error?.type,
    param: error?.param,
    requestId: error?.requestId,
    statusCode: error?.statusCode,
    rawMessage: error?.raw?.message,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await getAuthSession();
    const currentUserId = authSession?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body?.action as
      | 'default'
      | 'cancel'
      | 'update_payment'
      | 'update_plan'
      | undefined;
    const subscriptionId = body?.subscriptionId as string | undefined;

    let stripeCustomerId = user.stripeCustomerId || null;

    const recoverSubscriptionByUserId = async () => {
      const subscriptions = await stripe.subscriptions.list({
        status: 'all',
        limit: 100,
      });
      const rank = (status: string) => {
        if (status === 'active') return 4;
        if (status === 'trialing') return 3;
        if (status === 'past_due') return 2;
        if (status === 'incomplete') return 1;
        return 0;
      };
      const matches = subscriptions.data.filter((sub) => sub.metadata?.userId === user.id);
      if (!matches.length) return null;
      matches.sort((a, b) => rank(b.status) - rank(a.status));
      return matches[0];
    };
    if (!stripeCustomerId && user.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 5,
      });
      const recovered =
        customers.data.find((c) => !('deleted' in c && c.deleted)) || null;
      stripeCustomerId = recovered?.id || null;
    }

    if (!stripeCustomerId && subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        stripeCustomerId =
          typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || null;
      } catch {
        // no-op, fallback to "No subscription found" below
      }
    }

    if (!stripeCustomerId) {
      const recoveredSub = await recoverSubscriptionByUserId().catch(() => null);
      stripeCustomerId = recoveredSub
        ? typeof recoveredSub.customer === 'string'
          ? recoveredSub.customer
          : recoveredSub.customer?.id || null
        : null;
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    if (stripeCustomerId !== user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin || 'http://localhost:3000';
    const returnUrl = `${appUrl.replace(/\/$/, '')}/settings/billing`;

    const params: any = {
      customer: stripeCustomerId,
      return_url: returnUrl,
    };

    if (action === 'update_payment') {
      params.flow_data = { type: 'payment_method_update' };
    } else if (action === 'cancel' && subscriptionId) {
      params.flow_data = {
        type: 'subscription_cancel',
        subscription_cancel: { subscription: subscriptionId },
      };
    } else if (action === 'update_plan' && subscriptionId) {
      params.flow_data = {
        type: 'subscription_update',
        subscription_update: { subscription: subscriptionId },
      };
    }

    // Create Stripe Customer Portal session. If specific flow fails, fallback to default portal.
    let portalSession;
    try {
      portalSession = await stripe.billingPortal.sessions.create(params);
    } catch (err: any) {
      console.error('Stripe portal flow error', {
        flowType: params?.flow_data?.type || 'default',
        customerId: stripeCustomerId,
        subscriptionId: subscriptionId || null,
        ...getStripeErrorMeta(err),
      });
      if (params.flow_data) {
        portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: returnUrl,
        });
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: any) {
    const meta = getStripeErrorMeta(error);
    console.error('Stripe portal error', meta);

    const hint =
      meta.code === 'resource_missing'
        ? 'Stripe customer or subscription not found in current mode (test/live mismatch).'
        : meta.param === 'flow_data'
        ? 'Customer Portal flow not enabled in Stripe dashboard.'
        : 'Verify Stripe keys, customer portal config, and subscription linkage.';

    return NextResponse.json(
      {
        error: 'Failed to create portal session',
        message: meta.message,
        hint: process.env.NODE_ENV === 'development' ? hint : undefined,
        stripe: process.env.NODE_ENV === 'development' ? meta : undefined,
      },
      { status: 500 }
    );
  }
}
