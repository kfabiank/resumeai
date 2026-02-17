"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  UserCircle2,
} from "lucide-react";
import AppTopNav from "@/components/AppTopNav";

type BillingUser = {
  name: string;
  email: string;
  planType: "free" | "pro" | "premium";
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string;
};

type BillingSummary = {
  provider: "none" | "stripe";
  warning?: string;
  currentPlan: {
    planType: string;
    subscriptionId?: string | null;
    status?: string | null;
    productName?: string | null;
    cancelAtPeriodEnd?: boolean;
    nextBillingDate?: string | null;
    interval?: string | null;
    intervalCount?: number | null;
  };
  paymentMethod: {
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
  } | null;
  invoices: Array<{
    id: string;
    createdAt: string;
    amountPaid: number;
    currency: string;
    status: string | null;
    planName: string | null;
    paymentMethod: string;
    receiptUrl: string | null;
  }>;
};

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<BillingUser | null>(null);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [isRelinking, setIsRelinking] = useState(false);
  const [hasAutoRelinked, setHasAutoRelinked] = useState(false);

  const loadBillingData = async () => {
    const [profileRes, billingRes] = await Promise.all([
      fetch("/api/profile", { cache: "no-store" }),
      fetch("/api/stripe/billing-summary", { cache: "no-store" }),
    ]);

    if (profileRes.status === 401) {
      window.location.href = "/login";
      return;
    }

    const profileBody = await profileRes.json();
    if (!profileRes.ok) {
      throw new Error(profileBody.error || "Failed to load profile");
    }

    setUser({
      name: profileBody.name || "",
      email: profileBody.email || "",
      planType: profileBody.planType || "free",
      subscriptionStatus: profileBody.subscriptionStatus || "",
      currentPeriodEnd: profileBody.currentPeriodEnd || null,
      stripeCustomerId: profileBody.stripeCustomerId || "",
    });

    const billingBody = await billingRes.json();
    if (!billingRes.ok) {
      setSummary({
        provider: "none",
        currentPlan: {
          planType: profileBody.planType || "free",
        },
        paymentMethod: null,
        invoices: [],
      });
    } else {
      setSummary(billingBody);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadBillingData();
      } catch (err: any) {
        setError(err.message || "Failed to load billing data");
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadData();
  }, []);

  const isPaidPlan = (user?.planType || "free") !== "free";
  const canUseStripePortal =
    isPaidPlan &&
    summary?.provider === "stripe" &&
    (Boolean(summary?.currentPlan?.subscriptionId) || Boolean(user?.stripeCustomerId));
  const currentPlanName = useMemo(() => {
    const nameFromStripe = summary?.currentPlan?.productName?.trim();
    if (nameFromStripe) return nameFromStripe;
    if (!user) return "Free";
    return user.planType.charAt(0).toUpperCase() + user.planType.slice(1);
  }, [summary?.currentPlan?.productName, user]);

  const nextBillingDate = useMemo(() => {
    const raw = summary?.currentPlan?.nextBillingDate || user?.currentPeriodEnd;
    if (!raw) return null;
    return new Date(raw);
  }, [summary?.currentPlan?.nextBillingDate, user?.currentPeriodEnd]);

  const paymentMethodLabel = useMemo(() => {
    if (!summary?.paymentMethod) return "No card on file";
    const brand = (summary.paymentMethod.brand || "CARD").toUpperCase();
    const last4 = summary.paymentMethod.last4 || "****";
    return `${brand} **** ${last4}`;
  }, [summary?.paymentMethod]);

  const openPortal = async (
    action: "default" | "cancel" | "update_payment" | "update_plan" = "default"
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          subscriptionId: summary?.currentPlan?.subscriptionId || undefined,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to open billing portal");
      if (body.url) window.location.href = body.url;
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const relinkStripe = async () => {
    setIsRelinking(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/relink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || "Failed to relink Stripe");

      await loadBillingData();
    } catch (err: any) {
      setError(err.message || "Failed to relink Stripe");
    } finally {
      setIsRelinking(false);
    }
  };

  useEffect(() => {
    if (!user || !summary || hasAutoRelinked) return;
    if (user.planType === "free") return;
    if (summary.provider !== "none") return;

    setHasAutoRelinked(true);
    void relinkStripe();
  }, [user, summary, hasAutoRelinked]);

  if (isProfileLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav
        active="billing"
        userName={user.name || user.email?.split("@")[0] || "User"}
        planType={user.planType}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[240px_1fr_1fr]">
          <aside className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-4 text-blue-600 border-b border-gray-100 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="p-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <UserCircle2 className="h-4 w-4" />
                Your Profile
              </Link>
              <Link
                href="/settings/billing"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-blue-600 bg-blue-50"
              >
                <CreditCard className="h-4 w-4" />
                Billing
              </Link>
            </div>
          </aside>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-4xl font-semibold text-gray-900 mb-6">Your Plan</h2>
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-semibold text-gray-900">{currentPlanName}</h3>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                  {summary?.currentPlan?.cancelAtPeriodEnd ? "Canceling" : "Active"}
                </span>
              </div>

              {nextBillingDate ? (
                <p className="mt-4 text-gray-700">
                  Next billing:{" "}
                  <span className="font-semibold text-orange-500">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: summary?.invoices?.[0]?.currency || "USD",
                    }).format(summary?.invoices?.[0]?.amountPaid || 0)}
                  </span>{" "}
                  on {nextBillingDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              ) : null}

              <p className="mt-2 text-gray-600">
                {summary?.currentPlan?.intervalCount
                  ? `Billed every ${summary.currentPlan.intervalCount} ${summary.currentPlan.interval || "month"}${summary.currentPlan.intervalCount > 1 ? "s" : ""}`
                  : "Billed by active subscription cycle"}
              </p>

              {canUseStripePortal ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openPortal("cancel")}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 underline disabled:opacity-50"
                  >
                    Cancel Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => openPortal("update_plan")}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
                  >
                    Change Plan
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <Link href="/pricing" className="text-blue-600 hover:text-blue-700 underline">
                    Upgrade Subscription
                  </Link>
                </div>
              )}

              {isPaidPlan && !canUseStripePortal ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-700">
                    We could not connect your billing account automatically.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={relinkStripe}
                      disabled={isRelinking}
                      className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {isRelinking ? "Reconnecting..." : "Reconnect Billing"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 rounded-xl border border-emerald-500 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-3xl font-semibold text-gray-900">Save more with annual plans</h4>
                  <p className="text-gray-600 mt-1">Upgrade or switch billing cycle from pricing.</p>
                  <p className="mt-2 text-gray-600">
                    <span className="font-bold">SAVE</span>{" "}
                    <span className="font-bold text-orange-500">up to 45%</span>
                  </p>
                  <Link href="/pricing" className="mt-4 inline-flex text-blue-600 hover:text-blue-700 underline">
                    Other Plans Available
                  </Link>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-white hover:bg-emerald-600"
                >
                  Upgrade
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-4xl font-semibold text-gray-900 mb-6">Payment Details</h2>

            <div className="rounded-xl border border-gray-200 p-5">
              <p className="font-semibold text-gray-900">Card</p>
              <p className="mt-3 text-gray-700">{user.name || user.email}</p>
              <p className="mt-2 text-gray-700">{paymentMethodLabel}</p>
              <button
                type="button"
                onClick={() => openPortal("update_payment")}
                disabled={isLoading || !canUseStripePortal}
                className="mt-4 text-blue-600 hover:text-blue-700 underline disabled:opacity-50"
              >
                Update Payment Method
              </button>
            </div>

            <h3 className="text-4xl font-semibold text-gray-900 mt-10 mb-4">Billing History</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Payment Method</th>
                    <th className="px-4 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.invoices?.length ? (
                    summary.invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-700">
                          {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: invoice.currency || "USD",
                          }).format(invoice.amountPaid || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{invoice.planName || currentPlanName}</td>
                        <td className="px-4 py-3 text-gray-700">{invoice.paymentMethod || "N/A"}</td>
                        <td className="px-4 py-3">
                          {invoice.receiptUrl ? (
                            <a
                              href={invoice.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        No invoices yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {canUseStripePortal ? (
              <button
                type="button"
                onClick={() => openPortal("default")}
                disabled={isLoading}
                className="mt-5 inline-flex items-center text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Open full billing portal
                <ExternalLink className="ml-1 h-4 w-4" />
              </button>
            ) : null}
          </section>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="inline-flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Need billing help?{" "}
            <a href="mailto:support@resumeai.com" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
