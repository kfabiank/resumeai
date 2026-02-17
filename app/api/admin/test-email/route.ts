import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { sendBillingEmail, type BillingEmailKind } from "@/lib/email";

const VALID_KINDS: BillingEmailKind[] = [
  "welcome",
  "plan_upgraded",
  "plan_downgraded",
  "subscription_canceled",
  "payment_failed",
];

export async function POST(request: NextRequest) {
  const session = await getAuthSession();
  const sessionEmail = session?.user?.email?.toLowerCase().trim();
  const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();

  if (!session?.user?.id || !sessionEmail || !rootAdminEmail || sessionEmail !== rootAdminEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    kind?: BillingEmailKind;
    planLabel?: string;
  };

  const to = (body.to || "kfabiank@gmail.com").trim().toLowerCase();
  const kind = body.kind || "welcome";
  const planLabel = (body.planLabel || "Pro").trim();

  if (!to) {
    return NextResponse.json({ error: "Missing recipient email" }, { status: 400 });
  }

  if (!VALID_KINDS.includes(kind)) {
    return NextResponse.json(
      { error: `Invalid kind. Use one of: ${VALID_KINDS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const result = await sendBillingEmail({
      to,
      kind,
      planLabel,
      periodEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    return NextResponse.json({
      ok: result.ok,
      skipped: result.skipped,
      reason: result.reason || null,
      to,
      kind,
      planLabel,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to send test email", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
