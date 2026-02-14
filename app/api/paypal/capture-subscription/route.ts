import { NextRequest, NextResponse } from 'next/server';
import { paypalClient } from '@/lib/paypal';
import { prisma } from '@/lib/prisma';
import { SubscriptionsController } from '@paypal/paypal-server-sdk';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subscriptionId = searchParams.get('subscription_id');
    const userId = searchParams.get('userId');
    const plan = searchParams.get('plan');

    if (!subscriptionId || !userId || !plan) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=missing_params`
      );
    }

    const subscriptionsController = new SubscriptionsController(paypalClient);

    // Get subscription details
    const { result: subscription } = await subscriptionsController.getSubscription({
      id: subscriptionId,
    });

    const subscriptionStatus = (subscription as any)?.status as string | undefined;

    if (subscriptionStatus === 'ACTIVE') {
      // Update user in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          planType: plan,
          stripeSubscriptionId: subscriptionId, // Reusing field for PayPal subscription ID
          subscriptionStatus: 'active',
          currentPeriodEnd: subscription.billingInfo?.nextBillingTime
            ? new Date(subscription.billingInfo.nextBillingTime)
            : null,
        },
      });

      // Log the upgrade
      await prisma.usageLog.create({
        data: {
          userId,
          actionType: 'plan_upgraded',
          metadata: {
            plan,
            subscriptionId,
            provider: 'paypal',
          },
        },
      });

      // Redirect to success page
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?provider=paypal`
      );
    } else {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=subscription_not_active`
      );
    }
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/pricing?error=capture_failed`
    );
  }
}
