import { NextRequest, NextResponse } from 'next/server';
import { paypalClient, PAYPAL_PLANS, PLAN_PRICES } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import {
  ApplicationContextUserAction,
  ExperienceContextShippingPreference,
  SubscriptionsController,
} from '@paypal/paypal-server-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, billingPeriod, userId } = body;

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

    // For demo purposes, use a mock user ID if not provided
    const currentUserId = userId || 'demo-user-123';

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: currentUserId,
          email: 'demo@example.com',
          name: 'Demo User',
          planType: 'free',
        },
      });
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
    const { result: subscription } = await subscriptionsController.createSubscription({
      body: {
        planId: planId,
        applicationContext: {
          brandName: 'ResumeAI',
          locale: 'en-US',
          shippingPreference: ExperienceContextShippingPreference.NoShipping,
          userAction: ApplicationContextUserAction.SubscribeNow,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/capture-subscription?userId=${currentUserId}&plan=${plan}`,
          cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        },
        customId: JSON.stringify({ userId: currentUserId, plan, billingPeriod }),
      },
    });

    // Find the approval link
    const approvalLink = subscription.links?.find((link: { rel?: string }) => link.rel === 'approve');

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
