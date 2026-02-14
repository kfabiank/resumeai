import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const PLANS = {
  free: {
    name: 'Free',
    resumesPerMonth: 3,
    features: ['3 resumes/month', 'Basic templates', 'PDF export'],
  },
  pro: {
    name: 'Pro',
    resumesPerMonth: -1, // unlimited
    priceId: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE!,
      annual: process.env.STRIPE_PRO_ANNUAL_PRICE!,
    },
    features: [
      'Unlimited resumes',
      '20+ premium templates',
      'Cover letter generator',
      'PDF & DOCX export',
      'Priority support',
    ],
  },
  premium: {
    name: 'Premium',
    resumesPerMonth: -1, // unlimited
    priceId: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE!,
      annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE!,
    },
    features: [
      'Everything in Pro',
      'Custom branding',
      'LinkedIn optimization',
      '1-on-1 resume review',
      'Interview prep tips',
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;
