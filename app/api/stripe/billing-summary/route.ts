import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function formatPaymentMethodFromCharge(charge: Stripe.Charge | null): string {
  if (!charge) return "N/A";
  const details = charge.payment_method_details;
  if (!details) return "N/A";

  if (details.type === "card" && details.card) {
    const brand = details.card.brand?.toUpperCase() || "CARD";
    return `${brand} **** ${details.card.last4 || "****"}`;
  }

  if (details.type === "paypal") {
    return "PayPal";
  }

  return details.type ? details.type.toUpperCase() : "N/A";
}

export async function GET() {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        planType: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    const rank = (status: string) => {
      if (status === "active") return 5;
      if (status === "trialing") return 4;
      if (status === "past_due") return 3;
      if (status === "incomplete") return 2;
      if (status === "incomplete_expired") return 1;
      return 0;
    };

    const pickBestSubscription = (subs: Stripe.Subscription[]) => {
      if (!subs.length) return null;
      return [...subs].sort((a, b) => rank(b.status) - rank(a.status))[0];
    };

    const recoverSubscriptionByKnownId = async () => {
      if (!user.stripeSubscriptionId) return null;
      try {
        return await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ["items.data.price.product", "default_payment_method"],
        });
      } catch {
        return null;
      }
    };

    const recoverSubscriptionFromUsageLogs = async () => {
      const latestUpgrade = await prisma.usageLog.findFirst({
        where: {
          userId,
          actionType: "plan_upgraded",
        },
        orderBy: { timestamp: "desc" },
        select: { metadata: true },
      });
      const metadata = latestUpgrade?.metadata as Record<string, any> | null;
      const subId =
        (typeof metadata?.subscriptionId === "string" && metadata.subscriptionId) ||
        null;
      if (!subId) return null;
      try {
        return await stripe.subscriptions.retrieve(subId, {
          expand: ["items.data.price.product", "default_payment_method"],
        });
      } catch {
        return null;
      }
    };

    const recoverSubscriptionByUserId = async () => {
      const matches: Stripe.Subscription[] = [];
      let startingAfter: string | undefined;
      let page = 0;

      while (page < 10) {
        const subs: Stripe.ApiList<Stripe.Subscription> = await stripe.subscriptions.list({
          status: "all",
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
          expand: ["data.items.data.price.product", "data.default_payment_method"],
        });
        matches.push(...subs.data.filter((sub) => sub.metadata?.userId === userId));
        if (!subs.has_more || subs.data.length === 0) break;
        startingAfter = subs.data[subs.data.length - 1]?.id;
        page += 1;
      }

      return pickBestSubscription(matches);
    };

    const recoverCustomerByEmail = async () => {
      if (!user.email) return null;
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });
      const candidate =
        customers.data.find((c) => !("deleted" in c && c.deleted)) || null;
      return candidate;
    };

    const recoverSubscriptionFromEmailCustomers = async () => {
      if (!user.email) return null;
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      const validCustomers = customers.data.filter((c) => !("deleted" in c && c.deleted));
      const collected: Stripe.Subscription[] = [];
      for (const customer of validCustomers) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 10,
          expand: ["data.items.data.price.product", "data.default_payment_method"],
        });
        collected.push(...subs.data);
      }
      return pickBestSubscription(collected);
    };

    const recoverFromCheckoutSessions = async () => {
      let startingAfter: string | undefined;
      let page = 0;

      while (page < 10) {
        const sessions = await stripe.checkout.sessions.list({
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
          expand: ["data.subscription"],
        });

        for (const s of sessions.data) {
          const matchesUserId = s.metadata?.userId === userId;
          const sessionEmail = s.customer_details?.email || s.customer_email || null;
          const matchesEmail =
            !!user.email && !!sessionEmail && sessionEmail.toLowerCase() === user.email.toLowerCase();
          if (!matchesUserId && !matchesEmail) continue;

          const subId =
            typeof s.subscription === "string" ? s.subscription : s.subscription?.id || null;
          if (subId) {
            try {
              const sub = await stripe.subscriptions.retrieve(subId, {
                expand: ["items.data.price.product", "default_payment_method"],
              });
              return sub;
            } catch {
              // keep searching
            }
          }

          const customerId =
            typeof s.customer === "string" ? s.customer : s.customer?.id || null;
          if (customerId) {
            const subs = await stripe.subscriptions.list({
              customer: customerId,
              status: "all",
              limit: 20,
              expand: ["data.items.data.price.product", "data.default_payment_method"],
            });
            const best = pickBestSubscription(subs.data);
            if (best) return best;
          }
        }

        if (!sessions.has_more || sessions.data.length === 0) break;
        startingAfter = sessions.data[sessions.data.length - 1]?.id;
        page += 1;
      }

      return null;
    };

    if (!stripeCustomerId) {
      const recovered = await recoverCustomerByEmail().catch(() => null);
      if (recovered) {
        stripeCustomerId = recovered.id;
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        });
      } else {
        const recoveredSubscription =
          (await recoverSubscriptionByKnownId().catch(() => null)) ||
          (await recoverSubscriptionFromUsageLogs().catch(() => null)) ||
          (await recoverFromCheckoutSessions().catch(() => null)) ||
          (await recoverSubscriptionByUserId().catch(() => null)) ||
          (await recoverSubscriptionFromEmailCustomers().catch(() => null));
        const recoveredFromSubscriptionCustomerId = recoveredSubscription
          ? typeof recoveredSubscription.customer === "string"
            ? recoveredSubscription.customer
            : recoveredSubscription.customer?.id || null
          : null;

        if (!recoveredFromSubscriptionCustomerId) {
          return NextResponse.json({
            provider: "none",
            currentPlan: { planType: user.planType || "free" },
            paymentMethod: null,
            invoices: [],
          });
        }

        stripeCustomerId = recoveredFromSubscriptionCustomerId;
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId,
            stripeSubscriptionId: recoveredSubscription?.id || user.stripeSubscriptionId || null,
            subscriptionStatus: recoveredSubscription?.status || user.subscriptionStatus || null,
            currentPeriodEnd: recoveredSubscription?.current_period_end
              ? new Date(recoveredSubscription.current_period_end * 1000)
              : null,
          },
        });
      }
    }

    let customer: Stripe.Customer | null = null;
    let subscriptions: Stripe.ApiList<Stripe.Subscription> | null = null;
    let invoices: Stripe.ApiList<Stripe.Invoice> | null = null;

    try {
      customer = (await stripe.customers.retrieve(stripeCustomerId, {
        expand: ["invoice_settings.default_payment_method"],
      })) as Stripe.Customer;

      subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price.product", "data.default_payment_method"],
      });

      invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 25,
        expand: ["data.charge"],
      });
    } catch (stripeErr: any) {
      // Common local case: stale/mismatched stripeCustomerId between test/live mode.
      if (
        stripeErr?.type === "StripeInvalidRequestError" ||
        stripeErr?.code === "resource_missing" ||
        stripeErr?.statusCode === 404
      ) {
        const recovered = await recoverCustomerByEmail().catch(() => null);
        const recoveredSub =
          (await recoverSubscriptionByKnownId().catch(() => null)) ||
          (await recoverSubscriptionFromUsageLogs().catch(() => null)) ||
          (await recoverFromCheckoutSessions().catch(() => null)) ||
          (await recoverSubscriptionByUserId().catch(() => null)) ||
          (await recoverSubscriptionFromEmailCustomers().catch(() => null));
        const recoveredFromSubCustomerId = recoveredSub
          ? typeof recoveredSub.customer === "string"
            ? recoveredSub.customer
            : recoveredSub.customer?.id || null
          : null;

        const recoveredCustomerId =
          recovered?.id && recovered.id !== stripeCustomerId
            ? recovered.id
            : recoveredFromSubCustomerId && recoveredFromSubCustomerId !== stripeCustomerId
            ? recoveredFromSubCustomerId
            : null;

        if (recoveredCustomerId) {
          stripeCustomerId = recoveredCustomerId;
          await prisma.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId,
              stripeSubscriptionId: recoveredSub?.id || user.stripeSubscriptionId || null,
              subscriptionStatus: recoveredSub?.status || user.subscriptionStatus || null,
              currentPeriodEnd: recoveredSub?.current_period_end
                ? new Date(recoveredSub.current_period_end * 1000)
                : null,
            },
          });

          customer = (await stripe.customers.retrieve(stripeCustomerId, {
            expand: ["invoice_settings.default_payment_method"],
          })) as Stripe.Customer;
          subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: "all",
            limit: 10,
            expand: ["data.items.data.price.product", "data.default_payment_method"],
          });
          invoices = await stripe.invoices.list({
            customer: stripeCustomerId,
            limit: 25,
            expand: ["data.charge"],
          });
          // recovered successfully, continue response
        } else {
          return NextResponse.json({
            provider: "none",
            currentPlan: { planType: user.planType || "free" },
            paymentMethod: null,
            invoices: [],
            warning: "Stripe customer not found for current environment",
          });
        }
      } else {
        throw stripeErr;
      }
    }

    const currentSubscription =
      subscriptions?.data.find((sub) => sub.id === user.stripeSubscriptionId) ||
      subscriptions?.data[0] ||
      null;

    if (currentSubscription) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId,
          stripeSubscriptionId: currentSubscription.id,
          subscriptionStatus: currentSubscription.status,
          currentPeriodEnd: currentSubscription.current_period_end
            ? new Date(currentSubscription.current_period_end * 1000)
            : null,
        },
      });
    }

    const defaultPm = customer?.invoice_settings
      ?.default_payment_method as Stripe.PaymentMethod | string | null | undefined;
    const subscriptionPm = currentSubscription?.default_payment_method as
      | Stripe.PaymentMethod
      | string
      | null
      | undefined;
    const selectedPm =
      (typeof subscriptionPm === "object" ? subscriptionPm : null) ||
      (typeof defaultPm === "object" ? defaultPm : null) ||
      null;

    const planProduct = currentSubscription?.items.data[0]?.price.product;
    const planName =
      typeof planProduct === "object" && "deleted" in planProduct === false && planProduct?.name
        ? planProduct.name
        : (currentSubscription?.items.data[0]?.price.nickname ?? null);

    return NextResponse.json({
      provider: "stripe",
      currentPlan: {
        planType: user.planType || "free",
        subscriptionId: currentSubscription?.id || null,
        status: currentSubscription?.status || null,
        productName: planName,
        cancelAtPeriodEnd: currentSubscription?.cancel_at_period_end || false,
        nextBillingDate: currentSubscription?.current_period_end
          ? new Date(currentSubscription.current_period_end * 1000).toISOString()
          : null,
        interval: currentSubscription?.items.data[0]?.price.recurring?.interval || null,
        intervalCount:
          currentSubscription?.items.data[0]?.price.recurring?.interval_count || null,
      },
      paymentMethod: selectedPm
        ? {
            brand: selectedPm.card?.brand || null,
            last4: selectedPm.card?.last4 || null,
            expMonth: selectedPm.card?.exp_month || null,
            expYear: selectedPm.card?.exp_year || null,
          }
        : null,
      invoices: (invoices?.data || []).map((invoice) => {
        const charge =
          typeof invoice.charge === "object" && invoice.charge
            ? (invoice.charge as Stripe.Charge)
            : null;

        return {
          id: invoice.id,
          createdAt: new Date(invoice.created * 1000).toISOString(),
          amountPaid: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          planName:
            invoice.lines.data[0]?.price?.nickname ||
            (typeof invoice.lines.data[0]?.price?.product === "object" &&
            "deleted" in invoice.lines.data[0]?.price?.product === false
              ? invoice.lines.data[0]?.price?.product?.name
              : null) ||
            null,
          paymentMethod: formatPaymentMethodFromCharge(charge),
          receiptUrl: invoice.hosted_invoice_url || invoice.invoice_pdf || null,
        };
      }),
    });
  } catch (error: any) {
    console.error("Stripe billing summary error:", {
      message: error?.message,
      code: error?.code,
      type: error?.type,
      param: error?.param,
      requestId: error?.requestId,
      statusCode: error?.statusCode,
    });
    return NextResponse.json(
      { error: "Failed to load billing summary", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
