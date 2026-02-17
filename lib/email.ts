import {
  buildPaymentFailedEmail,
  buildPlanDowngradedEmail,
  buildPlanUpgradedEmail,
  buildSubscriptionCanceledEmail,
  buildWelcomeEmail,
} from "@/lib/email-templates";

export type BillingEmailKind =
  | "welcome"
  | "plan_upgraded"
  | "plan_downgraded"
  | "subscription_canceled"
  | "payment_failed";

type BillingEmailParams = {
  to: string;
  kind: BillingEmailKind;
  planLabel?: string;
  periodEnd?: Date | null;
};

function getFromEmail() {
  return process.env.EMAIL_FROM || process.env.FROM_EMAIL;
}

export function getBillingEmailPreview(
  kind: BillingEmailKind,
  planLabel: string,
  periodEnd: Date | null
) {
  if (kind === "welcome") return buildWelcomeEmail(planLabel);
  if (kind === "plan_upgraded") return buildPlanUpgradedEmail(planLabel, periodEnd);
  if (kind === "plan_downgraded") return buildPlanDowngradedEmail();
  if (kind === "subscription_canceled") return buildSubscriptionCanceledEmail(periodEnd);
  return buildPaymentFailedEmail();
}

export async function sendBillingEmail({
  to,
  kind,
  planLabel = "Free",
  periodEnd = null,
}: BillingEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = getFromEmail();

  if (!apiKey || !from || !to) {
    return {
      ok: false,
      skipped: true,
      reason: "Missing RESEND_API_KEY or EMAIL_FROM or recipient email",
    };
  }

  const email = getBillingEmailPreview(kind, planLabel, periodEnd);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "Unknown error");
    throw new Error(`Resend error (${response.status}): ${details}`);
  }

  return {
    ok: true,
    skipped: false,
  };
}
