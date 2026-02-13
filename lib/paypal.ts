import { Client, Environment, LogLevel } from '@paypal/paypal-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID!;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
const mode = process.env.PAYPAL_MODE || 'sandbox';

export const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: clientId,
    oAuthClientSecret: clientSecret,
  },
  environment: mode === 'production' ? Environment.Production : Environment.Sandbox,
  logging: {
    logLevel: LogLevel.Info,
    logRequest: { logBody: true },
    logResponse: { logHeaders: true },
  },
});

export const PAYPAL_PLANS = {
  pro: {
    monthly: process.env.PAYPAL_PRO_MONTHLY_PLAN!,
    annual: process.env.PAYPAL_PRO_ANNUAL_PLAN!,
  },
  premium: {
    monthly: process.env.PAYPAL_PREMIUM_MONTHLY_PLAN!,
    annual: process.env.PAYPAL_PREMIUM_ANNUAL_PLAN!,
  },
} as const;

export const PLAN_PRICES = {
  pro: { monthly: 12, annual: 108 }, // $9/mo billed annually = $108
  premium: { monthly: 29, annual: 288 }, // $24/mo billed annually = $288
} as const;
