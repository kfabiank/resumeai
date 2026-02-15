"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CreditCard,
  Calendar,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

type BillingUser = {
  name: string;
  email: string;
  planType: "free" | "pro" | "premium";
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string;
};

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<BillingUser | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load profile");
        setUser({
          name: body.name || "",
          email: body.email || "",
          planType: body.planType || "free",
          subscriptionStatus: body.subscriptionStatus || "",
          currentPeriodEnd: body.currentPeriodEnd || null,
          stripeCustomerId: body.stripeCustomerId || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load billing profile");
      } finally {
        setIsProfileLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const isPaidPlan = (user?.planType || "free") !== "free";
  const periodEndDate = useMemo(
    () => (user?.currentPeriodEnd ? new Date(user.currentPeriodEnd) : null),
    [user?.currentPeriodEnd]
  );

  const handleManageBilling = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to open billing portal");
        return;
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ResumeAI
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/templates" className="text-gray-600 hover:text-gray-900">
                Templates
              </Link>
              <Link href="/settings/billing" className="text-blue-600 font-medium">
                Billing
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Current Plan */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                  className={`p-3 rounded-lg ${
                    user.planType === "premium"
                    ? "bg-purple-100"
                    : user.planType === "pro"
                    ? "bg-blue-100"
                    : "bg-gray-100"
                }`}
              >
                <CreditCard
                  className={`h-6 w-6 ${
                    user.planType === "premium"
                      ? "text-purple-600"
                      : user.planType === "pro"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 capitalize">
                  {user.planType} Plan
                </h3>
                {isPaidPlan && (
                  <p className="text-sm text-gray-600">
                    {user.subscriptionStatus === "active" ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        Active subscription
                      </span>
                    ) : (
                      <span className="text-yellow-600">
                        Status: {user.subscriptionStatus}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {isPaidPlan ? (
              <button
                onClick={handleManageBilling}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Manage Subscription
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Upgrade Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            )}
          </div>

                  {isPaidPlan && user.currentPeriodEnd && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  Next billing date:{" "}
                  <strong>{periodEndDate?.toLocaleDateString()}</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Plan Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Plan Features
          </h2>

          {user.planType === "free" ? (
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />3 resumes per
                month
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Basic templates
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                PDF export
              </li>
            </ul>
          ) : user.planType === "pro" ? (
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Unlimited resumes
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                20+ premium templates
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Cover letter generator
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                PDF & DOCX export
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Priority support
              </li>
            </ul>
          ) : (
            <ul className="space-y-3">
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Everything in Pro
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                Custom branding
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                LinkedIn optimization
              </li>
              <li className="flex items-center text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                1-on-1 resume review
              </li>
            </ul>
          )}

          {user.planType !== "premium" && (
            <div className="mt-6 pt-4 border-t">
              <Link
                href="/pricing"
                className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                Compare all plans
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment History
          </h2>

          {isPaidPlan ? (
            <>
              <p className="text-gray-600 mb-4">
                View and download your invoices from the Stripe customer portal.
              </p>
              <button
                onClick={handleManageBilling}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    View Payment History
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </>
          ) : (
            <p className="text-gray-600">
              No payment history available. Upgrade to a paid plan to see your
              invoices here.
            </p>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-gray-600">
          <p>
            Need help with billing?{" "}
            <a href="mailto:support@resumeai.com" className="text-blue-600 hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
