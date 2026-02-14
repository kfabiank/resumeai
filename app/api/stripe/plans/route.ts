import { NextResponse } from 'next/server';
import {
  stripe,
  type BillingPeriod,
  type PaidPlanType,
  getConfiguredPriceId,
} from '@/lib/stripe';

type PricePayload = {
  plan: PaidPlanType;
  billingPeriod: BillingPeriod;
  priceId: string | null;
  unitAmount: number | null;
  currency: string | null;
  interval: string | null;
  productName: string | null;
  active: boolean;
};

export async function GET() {
  try {
    const plans: PricePayload[] = [];
    const paidPlans: PaidPlanType[] = ['pro', 'premium'];
    const periods: BillingPeriod[] = ['monthly', 'annual'];

    for (const plan of paidPlans) {
      for (const billingPeriod of periods) {
        const priceId = getConfiguredPriceId(plan, billingPeriod);

        if (!priceId) {
          plans.push({
            plan,
            billingPeriod,
            priceId: null,
            unitAmount: null,
            currency: null,
            interval: null,
            productName: null,
            active: false,
          });
          continue;
        }

        const price = await stripe.prices.retrieve(priceId, {
          expand: ['product'],
        });

        const product =
          typeof price.product === 'string' ||
          (typeof price.product === 'object' && price.product.deleted)
            ? null
            : price.product;

        plans.push({
          plan,
          billingPeriod,
          priceId,
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval || null,
          productName: product?.name || null,
          active: price.active,
        });
      }
    }

    return NextResponse.json({
      plans,
      free: {
        plan: 'free',
        unitAmount: 0,
        currency: 'usd',
        productName: 'Free',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to load Stripe plans',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
