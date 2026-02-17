import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlanByPriceId, stripe } from "@/lib/stripe";

function rank(status: string) {
  if (status === "active") return 5;
  if (status === "trialing") return 4;
  if (status === "past_due") return 3;
  if (status === "incomplete") return 2;
  if (status === "incomplete_expired") return 1;
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      subscriptionId?: string;
      customerId?: string;
      sessionId?: string;
    };

    const subscriptionId = body.subscriptionId?.trim() || null;
    const customerId = body.customerId?.trim() || null;
    const sessionId = body.sessionId?.trim() || null;

    let subscription: any = null;
    let resolvedCustomerId: string | null = null;

    if (sessionId) {
      const checkout = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription"],
      });
      const subId =
        typeof checkout.subscription === "string"
          ? checkout.subscription
          : checkout.subscription?.id || null;
      if (subId) {
        subscription = await stripe.subscriptions.retrieve(subId);
      }
      resolvedCustomerId =
        typeof checkout.customer === "string"
          ? checkout.customer
          : checkout.customer?.id || null;
    }

    if (!subscription && subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price.product", "default_payment_method"],
      });
    }

    if (!subscription && customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 20,
      });
      subscription =
        subscriptions.data.sort((a, b) => rank(b.status) - rank(a.status))[0] || null;
      resolvedCustomerId = customerId;
    }

    if (!subscription && user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      let candidates: any[] = [];
      for (const customer of customers.data) {
        if ("deleted" in customer && customer.deleted) continue;
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 20,
        });
        candidates = candidates.concat(subscriptions.data);
      }
      subscription = candidates.sort((a, b) => rank(b.status) - rank(a.status))[0] || null;
    }

    if (!subscription) {
      let startingAfter: string | undefined;
      let page = 0;
      while (!subscription && page < 10) {
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
          expand: ["data.subscription"],
        });

        for (const s of sessions.data) {
          const matchesUserId = s.metadata?.userId === user.id;
          const sessionEmail = s.customer_details?.email || s.customer_email || null;
          const matchesEmail =
            !!user.email && !!sessionEmail && sessionEmail.toLowerCase() === user.email.toLowerCase();
          if (!matchesUserId && !matchesEmail) continue;

          const subId =
            typeof s.subscription === "string" ? s.subscription : s.subscription?.id || null;
          if (subId) {
            try {
              subscription = await stripe.subscriptions.retrieve(subId, {
                expand: ["items.data.price.product", "default_payment_method"],
              });
              break;
            } catch {
              // keep searching
            }
          }

          const sessionCustomerId =
            typeof s.customer === "string" ? s.customer : s.customer?.id || null;
          if (sessionCustomerId) {
            const subscriptions = await stripe.subscriptions.list({
              customer: sessionCustomerId,
              status: "all",
              limit: 20,
            });
            subscription =
              subscriptions.data.sort((a, b) => rank(b.status) - rank(a.status))[0] || null;
            if (subscription) {
              resolvedCustomerId = sessionCustomerId;
              break;
            }
          }
        }

        if (!sessions.has_more || sessions.data.length === 0) break;
        startingAfter = sessions.data[sessions.data.length - 1]?.id;
        page += 1;
      }
    }

    if (!subscription) {
      const latestUpgrade = await prisma.usageLog.findFirst({
        where: {
          userId: user.id,
          actionType: "plan_upgraded",
        },
        orderBy: { timestamp: "desc" },
        select: { metadata: true },
      });
      const metadata = latestUpgrade?.metadata as Record<string, any> | null;
      const subId =
        (typeof metadata?.subscriptionId === "string" && metadata.subscriptionId) || null;
      if (subId) {
        try {
          subscription = await stripe.subscriptions.retrieve(subId, {
            expand: ["items.data.price.product", "default_payment_method"],
          });
        } catch {
          subscription = null;
        }
      }
    }

    if (!subscription) {
      return NextResponse.json(
        {
          error: "No Stripe subscription found to relink",
          hint: "Provide subscriptionId (sub_...) or customerId (cus_...) from Stripe dashboard.",
        },
        { status: 400 }
      );
    }

    if (!resolvedCustomerId) {
      resolvedCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id || null;
    }

    const priceId = subscription.items?.data?.[0]?.price?.id || null;
    const mapped = priceId ? getPlanByPriceId(priceId) : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        planType: mapped?.plan || "pro",
        stripeCustomerId: resolvedCustomerId || undefined,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    });

    return NextResponse.json({
      ok: true,
      stripeCustomerId: resolvedCustomerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      planType: mapped?.plan || "pro",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to relink Stripe", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
