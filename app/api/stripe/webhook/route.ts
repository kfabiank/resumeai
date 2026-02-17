import { NextRequest, NextResponse } from 'next/server';
import { getPlanByPriceId, stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { sendBillingEmail } from '@/lib/email';

function toPlanLabel(plan: string | null | undefined) {
  if (plan === 'premium') return 'Premium';
  if (plan === 'pro') return 'Pro';
  return 'Free';
}

type StripeUserRef = {
  id: string;
  email: string;
  planType: string;
};

async function resolveUserByStripeRefs(params: {
  metadataUserId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<StripeUserRef | null> {
  const metadataUserId = params.metadataUserId?.trim() || null;
  const subscriptionId = params.subscriptionId?.trim() || null;
  const customerId = params.customerId?.trim() || null;

  if (metadataUserId) {
    const user = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true, email: true, planType: true },
    });
    if (user) return user;
  }

  if (subscriptionId) {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      select: { id: true, email: true, planType: true },
    });
    if (user) return user;
  }

  if (customerId) {
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { id: true, email: true, planType: true },
    });
    if (user) return user;
  }

  return null;
}

async function alreadySentForEvent(stripeEventId: string, kind: string) {
  const log = await prisma.usageLog.findFirst({
    where: {
      actionType: 'billing_email_sent',
      metadata: {
        path: ['stripeEventId'],
        equals: stripeEventId,
      },
    },
    select: { id: true, metadata: true },
  });

  if (!log) return false;
  const meta = (log.metadata || {}) as Record<string, unknown>;
  return meta.kind === kind;
}

async function logBillingEmailResult(params: {
  userId: string;
  stripeEventId: string;
  kind: string;
  recipient: string;
  status: 'sent' | 'skipped' | 'failed';
  details?: string;
}) {
  await prisma.usageLog.create({
    data: {
      userId: params.userId,
      actionType: 'billing_email_sent',
      metadata: {
        stripeEventId: params.stripeEventId,
        kind: params.kind,
        recipient: params.recipient,
        status: params.status,
        details: params.details || null,
      },
    },
  });
}

async function sendStripeBillingEmail(params: {
  stripeEventId: string;
  userId: string;
  to: string | null | undefined;
  kind: 'welcome' | 'plan_upgraded' | 'plan_downgraded' | 'subscription_canceled' | 'payment_failed';
  plan: string;
  periodEnd?: number | null;
}) {
  if (!params.to) return;
  if (await alreadySentForEvent(params.stripeEventId, params.kind)) return;

  try {
    const periodEndDate = params.periodEnd ? new Date(params.periodEnd * 1000) : null;
    const result = await sendBillingEmail({
      to: params.to,
      kind: params.kind,
      planLabel: toPlanLabel(params.plan),
      periodEnd: periodEndDate,
    });

    await logBillingEmailResult({
      userId: params.userId,
      stripeEventId: params.stripeEventId,
      kind: params.kind,
      recipient: params.to,
      status: result.ok ? 'sent' : 'skipped',
      details: result.ok ? undefined : result.reason,
    });
  } catch (error: any) {
    await logBillingEmailResult({
      userId: params.userId,
      stripeEventId: params.stripeEventId,
      kind: params.kind,
      recipient: params.to,
      status: 'failed',
      details: error?.message || 'unknown',
    });
  }
}

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

          const customerId =
            typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
          const resolvedUser = await resolveUserByStripeRefs({
            metadataUserId: session.metadata?.userId || subscription.metadata?.userId,
            subscriptionId: subscription.id,
            customerId,
          });
          const userId = resolvedUser?.id;
          const subscriptionPriceId = subscription.items.data[0]?.price?.id;
          const inferredPlan = subscriptionPriceId
            ? getPlanByPriceId(subscriptionPriceId)?.plan
            : null;
          const plan = session.metadata?.plan || inferredPlan;

          if (userId && plan) {
            const stripeCustomerId =
              typeof session.customer === 'string'
                ? session.customer
                : session.customer?.id || null;

            await prisma.user.update({
              where: { id: userId },
              data: {
                planType: plan,
                stripeCustomerId: stripeCustomerId || undefined,
                stripeSubscriptionId: subscription.id,
                subscriptionStatus: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });

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

            const kind = resolvedUser?.planType === 'free' ? 'welcome' : 'plan_upgraded';
            await sendStripeBillingEmail({
              stripeEventId: event.id,
              userId,
              to: resolvedUser?.email,
              kind,
              plan,
              periodEnd: subscription.current_period_end || null,
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || null;
        const resolvedUser = await resolveUserByStripeRefs({
          metadataUserId: subscription.metadata?.userId,
          subscriptionId: subscription.id,
          customerId,
        });
        const userId = resolvedUser?.id;
        const subscriptionPriceId = subscription.items.data[0]?.price?.id;
        const inferredPlan = subscriptionPriceId
          ? getPlanByPriceId(subscriptionPriceId)?.plan
          : null;

        if (userId) {
          const nextPlan = subscription.metadata?.plan || inferredPlan || 'free';

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              planType: nextPlan,
            },
          });

          if (resolvedUser?.planType && resolvedUser.planType !== nextPlan) {
            await sendStripeBillingEmail({
              stripeEventId: event.id,
              userId,
              to: resolvedUser.email,
              kind: nextPlan === 'free' ? 'plan_downgraded' : 'plan_upgraded',
              plan: nextPlan,
              periodEnd: subscription.current_period_end || null,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer?.id || null;
        const resolvedUser = await resolveUserByStripeRefs({
          metadataUserId: subscription.metadata?.userId,
          subscriptionId: subscription.id,
          customerId,
        });
        const userId = resolvedUser?.id;

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

          await sendStripeBillingEmail({
            stripeEventId: event.id,
            userId,
            to: resolvedUser?.email,
            kind: 'subscription_canceled',
            plan: resolvedUser?.planType || 'free',
            periodEnd: subscription.current_period_end || null,
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
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer?.id || null;
          const resolvedUser = await resolveUserByStripeRefs({
            metadataUserId: subscription.metadata?.userId,
            subscriptionId: subscription.id,
            customerId,
          });
          const userId = resolvedUser?.id;

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
          const customerId =
            typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer?.id || null;
          const resolvedUser = await resolveUserByStripeRefs({
            metadataUserId: subscription.metadata?.userId,
            subscriptionId: subscription.id,
            customerId,
          });
          const userId = resolvedUser?.id;

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionStatus: 'past_due',
              },
            });

            await sendStripeBillingEmail({
              stripeEventId: event.id,
              userId,
              to: resolvedUser?.email,
              kind: 'payment_failed',
              plan: resolvedUser?.planType || subscription.metadata?.plan || 'free',
              periodEnd: subscription.current_period_end || null,
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
