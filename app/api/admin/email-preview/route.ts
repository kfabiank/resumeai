import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getBillingEmailPreview, type BillingEmailKind } from "@/lib/email";

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
    kind?: BillingEmailKind;
    planLabel?: string;
  };

  const kind = body.kind || "welcome";
  const planLabel = (body.planLabel || "Pro").trim();
  if (!VALID_KINDS.includes(kind)) {
    return NextResponse.json(
      { error: `Invalid kind. Use one of: ${VALID_KINDS.join(", ")}` },
      { status: 400 }
    );
  }

  const email = getBillingEmailPreview(
    kind,
    planLabel,
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
  );

  return NextResponse.json({
    kind,
    subject: email.subject,
    html: email.html,
  });
}
