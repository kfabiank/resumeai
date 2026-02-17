import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { sendBillingEmail } from "@/lib/email";

type EmailKind =
  | "welcome"
  | "plan_upgraded"
  | "plan_downgraded"
  | "subscription_canceled"
  | "payment_failed";

const VALID_KINDS: EmailKind[] = [
  "welcome",
  "plan_upgraded",
  "plan_downgraded",
  "subscription_canceled",
  "payment_failed",
];

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await getAuthSession();
  const sessionEmail = session?.user?.email || null;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    kind?: EmailKind;
    planLabel?: string;
  };

  const to = (body.to || sessionEmail || "").trim().toLowerCase();
  const kind = body.kind || "welcome";
  const planLabel = body.planLabel || "Pro";

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
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to send test email", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
