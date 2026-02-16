import { NextRequest, NextResponse } from 'next/server';
import { getPlanByPriceId, stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const userId = session.metadata?.userId;
          const subscriptionPriceId = subscription.items.data[0]?.price?.id;
          const inferredPlan = subscriptionPriceId
            ? getPlanByPriceId(subscriptionPriceId)?.plan
            : null;
          const plan = session.metadata?.plan || inferredPlan;

          if (userId && plan) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                planType: plan,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });

            // Log the upgrade
            await prisma.usageLog.create({
              data: {
                userId,
                actionType: 'plan_upgraded',
                metadata: {
                  plan,
                  subscriptionId: subscription.id,
                },
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.userId;
          const subscriptionPriceId = subscription.items.data[0]?.price?.id;
          const inferredPlan = subscriptionPriceId
            ? getPlanByPriceId(subscriptionPriceId)?.plan
            : null;

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionStatus: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                planType: subscription.metadata?.plan || inferredPlan || 'free',
              },
            });
          }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              planType: 'free',
              subscriptionStatus: 'canceled',
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
            },
          });

          // Log the downgrade
          await prisma.usageLog.create({
            data: {
              userId,
              actionType: 'plan_downgraded',
              metadata: {
                previousPlan: subscription.metadata?.plan || 'paid',
                reason: 'subscription_canceled',
              },
            },
          });
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userId = subscription.metadata?.userId;

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionStatus: 'active',
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          const userId = subscription.metadata?.userId;

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionStatus: 'past_due',
              },
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error.message },
      { status: 500 }
    );
  }
}
