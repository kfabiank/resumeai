import { NextRequest, NextResponse } from 'next/server';
import { paypalClient, PAYPAL_PLANS, PLAN_PRICES } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { SubscriptionsController } from '@paypal/paypal-server-sdk';
import { getAuthSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, billingPeriod } = body;

    if (!plan || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: plan and billingPeriod' },
        { status: 400 }
      );
    }

    if (!['pro', 'premium'].includes(plan)) {
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

    // Get the PayPal plan ID
    const planConfig = PAYPAL_PLANS[plan as keyof typeof PAYPAL_PLANS];
    const planId = planConfig[billingPeriod as 'monthly' | 'annual'];

    if (!planId || planId === 'P-xxx') {
      return NextResponse.json(
        {
          error: 'PayPal plans not configured',
          message: 'Please set up your PayPal subscription plans and add the plan IDs to your .env file',
          setupRequired: true,
        },
        { status: 400 }
      );
    }

    const subscriptionsController = new SubscriptionsController(paypalClient);

    // Create subscription
    const { body: subscription } = await subscriptionsController.subscriptionsCreate({
      body: {
        planId: planId,
        applicationContext: {
          brandName: 'ResumeAI',
          locale: 'en-US',
          shippingPreference: 'NO_SHIPPING',
          userAction: 'SUBSCRIBE_NOW',
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/capture-subscription?userId=${currentUserId}&plan=${plan}`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        },
        customId: JSON.stringify({ userId: currentUserId, plan, billingPeriod }),
      },
    });

    // Find the approval link
    const approvalLink = subscription.links?.find(
      (link: { rel?: string; href?: string }) => link.rel === 'approve'
    );

    if (!approvalLink?.href) {
      throw new Error('No approval link found in PayPal response');
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      approvalUrl: approvalLink.href,
    });
  } catch (error: any) {
    console.error('PayPal subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal subscription', message: error.message },
      { status: 500 }
    );
  }
}
