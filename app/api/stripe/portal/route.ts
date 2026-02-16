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

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
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

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin || 'http://localhost:3000';
    const returnUrl = `${appUrl.replace(/\/$/, '')}/settings/billing`;

    const params: any = {
      customer: user.stripeCustomerId,
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
        customerId: user.stripeCustomerId,
        subscriptionId: subscriptionId || null,
        ...getStripeErrorMeta(err),
      });
      if (params.flow_data) {
        portalSession = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
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
