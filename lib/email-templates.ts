type BillingEmailTemplate = {
  title: string;
  subtitle: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  badge?: string;
};

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL || "support@resumeai.local";
}

function shell({
  title,
  subtitle,
  body,
  primaryCtaLabel,
  primaryCtaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
  badge,
}: BillingEmailTemplate) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="background:linear-gradient(120deg,#2563eb,#4f46e5);padding:24px 28px;">
                <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#dbeafe;font-weight:700;">ResumeAI</p>
                <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;color:#ffffff;">${title}</h1>
                <p style="margin:8px 0 0;font-size:15px;color:#e0e7ff;">${subtitle}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 10px;">
                ${badge ? `<div style="display:inline-block;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:700;font-size:12px;padding:6px 10px;border-radius:999px;margin-bottom:14px;">${badge}</div>` : ""}
                <div style="font-size:15px;line-height:1.65;color:#334155;">${body}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 28px;">
                <a href="${primaryCtaUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:700;">${primaryCtaLabel}</a>
                ${
                  secondaryCtaLabel && secondaryCtaUrl
                    ? `<a href="${secondaryCtaUrl}" style="display:inline-block;margin-left:12px;color:#2563eb;text-decoration:none;font-size:14px;font-weight:600;">${secondaryCtaLabel}</a>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 22px;">
                <div style="height:1px;background:#e2e8f0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 26px;">
                <p style="margin:0;font-size:12px;color:#64748b;">Need help? Reply to this email and we’ll help you out.</p>
                <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} ResumeAI</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildWelcomeEmail(planLabel: string) {
  const url = appUrl();
  return {
    subject: "Welcome to ResumeAI",
    html: shell({
      title: "Welcome aboard",
      subtitle: "Your account is ready. Let’s build your next resume.",
      badge: `Plan: ${planLabel}`,
      body: `<p style="margin:0 0 10px;">Thanks for joining ResumeAI. You can now create ATS-optimized resumes, manage templates, and track your applications in one place.</p>
<p style="margin:0;">Start with your dashboard and create your first tailored resume in minutes.</p>`,
      primaryCtaLabel: "Open Dashboard",
      primaryCtaUrl: `${url}/dashboard`,
      secondaryCtaLabel: "Manage Billing",
      secondaryCtaUrl: `${url}/settings/billing`,
    }),
  };
}

export function buildPlanUpgradedEmail(planLabel: string, periodEnd: Date | null) {
  const url = appUrl();
  const dateText = periodEnd
    ? periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "your next billing date";
  return {
    subject: "Your plan has been upgraded",
    html: shell({
      title: "Plan upgraded successfully",
      subtitle: "You now have access to premium features.",
      badge: `Current plan: ${planLabel}`,
      body: `<p style="margin:0 0 10px;">Your subscription update is complete.</p>
<p style="margin:0;">Your next billing date is <strong>${dateText}</strong>.</p>`,
      primaryCtaLabel: "Use Premium Features",
      primaryCtaUrl: `${url}/dashboard`,
      secondaryCtaLabel: "View Billing",
      secondaryCtaUrl: `${url}/settings/billing`,
    }),
  };
}

export function buildPlanDowngradedEmail() {
  const url = appUrl();
  return {
    subject: "Your plan has changed",
    html: shell({
      title: "You are now on Free plan",
      subtitle: "Your existing resumes are still safe and available.",
      badge: "Plan: Free",
      body: `<p style="margin:0 0 10px;">Your account is now on the Free plan. You can still access your existing resumes and profile.</p>
<p style="margin:0;">If you need unlimited resumes and premium templates again, you can upgrade anytime.</p>`,
      primaryCtaLabel: "See Pricing",
      primaryCtaUrl: `${url}/pricing`,
      secondaryCtaLabel: "Go to Dashboard",
      secondaryCtaUrl: `${url}/dashboard`,
    }),
  };
}

export function buildSubscriptionCanceledEmail(periodEnd: Date | null) {
  const url = appUrl();
  const dateText = periodEnd
    ? periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "the end of your billing period";
  return {
    subject: "Your subscription was canceled",
    html: shell({
      title: "Subscription canceled",
      subtitle: "You can reactivate anytime from Billing.",
      badge: "Status: Canceled",
      body: `<p style="margin:0 0 10px;">We confirmed your cancellation request.</p>
<p style="margin:0;">Your paid benefits remain active until <strong>${dateText}</strong>.</p>`,
      primaryCtaLabel: "Open Billing",
      primaryCtaUrl: `${url}/settings/billing`,
      secondaryCtaLabel: "See Plans",
      secondaryCtaUrl: `${url}/pricing`,
    }),
  };
}

export function buildPaymentFailedEmail() {
  const url = appUrl();
  return {
    subject: "Payment failed for your subscription",
    html: shell({
      title: "Payment failed",
      subtitle: "Update your payment method to keep premium access.",
      badge: "Action needed",
      body: `<p style="margin:0 0 10px;">We couldn’t process your latest subscription payment.</p>
<p style="margin:0;">Please update your payment method to avoid interruption to your paid features.</p>`,
      primaryCtaLabel: "Update Payment Method",
      primaryCtaUrl: `${url}/settings/billing`,
      secondaryCtaLabel: "Contact Support",
      secondaryCtaUrl: `mailto:${supportEmail()}`,
    }),
  };
}
