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
      'AI Resume Rewrite Pro',
      'AI Job Match Scoring',
      'AI Interview Simulation',
      'AI Salary Negotiation Scripts',
      'Advanced ATS strategy recommendations',
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;
export type PaidPlanType = Exclude<PlanType, 'free'>;
export type BillingPeriod = 'monthly' | 'annual';

export const PLAN_LIMITS = {
  free: {
    resumesPerMonth: 3,
  },
  pro: {
    resumesPerMonth: -1,
  },
  premium: {
    resumesPerMonth: -1,
  },
} as const;

export const PLAN_FEATURES = {
  free: {
    premiumTemplates: false,
    coverLetters: false,
    docxExport: false,
    jobTrackerLimit: 10,
    aiResumeRewritePro: false,
    aiJobMatchScoring: false,
    aiInterviewSimulation: false,
    aiSalaryNegotiationScripts: false,
    advancedAtsRecommendations: false,
  },
  pro: {
    premiumTemplates: true,
    coverLetters: true,
    docxExport: true,
    jobTrackerLimit: -1,
    aiResumeRewritePro: false,
    aiJobMatchScoring: false,
    aiInterviewSimulation: false,
    aiSalaryNegotiationScripts: false,
    advancedAtsRecommendations: false,
  },
  premium: {
    premiumTemplates: true,
    coverLetters: true,
    docxExport: true,
    jobTrackerLimit: -1,
    aiResumeRewritePro: true,
    aiJobMatchScoring: true,
    aiInterviewSimulation: true,
    aiSalaryNegotiationScripts: true,
    advancedAtsRecommendations: true,
  },
} as const;

export function getConfiguredPriceId(
  plan: PaidPlanType,
  billingPeriod: BillingPeriod
) {
  const configured = PLANS[plan];
  if (!('priceId' in configured)) return null;
  const value = configured.priceId[billingPeriod];
  return value || null;
}

export function getPlanByPriceId(priceId: string): {
  plan: PaidPlanType;
  billingPeriod: BillingPeriod;
} | null {
  const paidPlans: PaidPlanType[] = ['pro', 'premium'];
  const periods: BillingPeriod[] = ['monthly', 'annual'];

  for (const plan of paidPlans) {
    for (const billingPeriod of periods) {
      const configured = getConfiguredPriceId(plan, billingPeriod);
      if (configured && configured === priceId) {
        return { plan, billingPeriod };
      }
    }
  }

  return null;
}
