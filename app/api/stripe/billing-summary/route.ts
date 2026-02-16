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
        planType: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({
        provider: "none",
        currentPlan: { planType: user.planType || "free" },
        paymentMethod: null,
        invoices: [],
      });
    }

    let customer: Stripe.Customer | null = null;
    let subscriptions: Stripe.ApiList<Stripe.Subscription> | null = null;
    let invoices: Stripe.ApiList<Stripe.Invoice> | null = null;

    try {
      customer = (await stripe.customers.retrieve(user.stripeCustomerId, {
        expand: ["invoice_settings.default_payment_method"],
      })) as Stripe.Customer;

      subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 10,
        expand: ["data.items.data.price.product", "data.default_payment_method"],
      });

      invoices = await stripe.invoices.list({
        customer: user.stripeCustomerId,
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
        return NextResponse.json({
          provider: "none",
          currentPlan: { planType: user.planType || "free" },
          paymentMethod: null,
          invoices: [],
          warning: "Stripe customer not found for current environment",
        });
      }
      throw stripeErr;
    }

    const currentSubscription =
      subscriptions?.data.find((sub) => sub.id === user.stripeSubscriptionId) ||
      subscriptions?.data[0] ||
      null;

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
    console.error("Stripe billing summary error:", error);
    return NextResponse.json(
      { error: "Failed to load billing summary", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
