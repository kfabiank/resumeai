import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanByPriceId, stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { sessionId?: string };
    const sessionId = body?.sessionId?.trim();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "line_items.data.price"],
    });

    if (checkout.mode !== "subscription") {
      return NextResponse.json({ error: "Checkout session is not a subscription" }, { status: 400 });
    }

    const metadataUserId = checkout.metadata?.userId;
    if (metadataUserId && metadataUserId !== userId) {
      return NextResponse.json({ error: "Session does not belong to current user" }, { status: 403 });
    }

    const subscriptionId =
      typeof checkout.subscription === "string"
        ? checkout.subscription
        : checkout.subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription not found in checkout session" }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price?.id || null;
    const mappedPlan = priceId ? getPlanByPriceId(priceId)?.plan : null;
    const planFromMetadata = checkout.metadata?.plan || subscription.metadata?.plan;
    const resolvedPlan = planFromMetadata || mappedPlan || "free";

    const customerId =
      typeof checkout.customer === "string"
        ? checkout.customer
        : checkout.customer?.id || null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: resolvedPlan,
        stripeCustomerId: customerId || undefined,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    await prisma.usageLog.create({
      data: {
        userId,
        actionType: "plan_upgraded",
        metadata: {
          source: "checkout_success_sync",
          sessionId: checkout.id,
          subscriptionId: subscription.id,
          plan: resolvedPlan,
          status: subscription.status,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      planType: resolvedPlan,
      subscriptionStatus: subscription.status,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error("Stripe sync-subscription error:", {
      message: error?.message,
      code: error?.code,
      type: error?.type,
      param: error?.param,
      requestId: error?.requestId,
      statusCode: error?.statusCode,
    });
    return NextResponse.json(
      { error: "Failed to sync subscription", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
