"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppTopNav from "@/components/AppTopNav";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  Star,
  ArrowRight,
  HelpCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  premium: boolean | string;
}

const features: PlanFeature[] = [
  { name: "ATS-Optimized Resumes", free: "3/month", pro: "Unlimited", premium: "Unlimited" },
  { name: "AI Resume Generation", free: true, pro: true, premium: true },
  { name: "Basic Templates", free: true, pro: true, premium: true },
  { name: "Premium Templates", free: false, pro: true, premium: true },
  { name: "Cover Letter Generator", free: false, pro: true, premium: true },
  { name: "Job Application Tracker", free: "10 apps", pro: "Unlimited", premium: "Unlimited" },
  { name: "PDF Export", free: true, pro: true, premium: true },
  { name: "DOCX Export", free: false, pro: true, premium: true },
  { name: "Custom Branding", free: false, pro: false, premium: true },
  { name: "LinkedIn Optimization", free: false, pro: false, premium: true },
  { name: "Priority Support", free: false, pro: true, premium: true },
  { name: "1-on-1 Resume Review", free: false, pro: false, premium: true },
];

const faqs = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to your plan features until the end of your billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.",
  },
  {
    question: "Is there a free trial for Pro or Premium?",
    answer: "We don't offer free trials, but we do have a 14-day money-back guarantee. If you're not satisfied, we'll refund your payment.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the new rate applies at the next billing cycle.",
  },
  {
    question: "Do my resumes get deleted if I downgrade?",
    answer: "No, your resumes are never deleted. However, you may not be able to create new ones beyond your plan's limit until you upgrade again.",
  },
];

export default function PricingPage() {
  const [canceled, setCanceled] = useState(false);

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [stripePlans, setStripePlans] = useState<
    Record<
      string,
      {
        priceId: string | null;
        amount: number | null;
        productName: string | null;
      }
    >
  >({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setCanceled(params.get("canceled") === "true");
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetch("/api/stripe/plans");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Failed to load Stripe plans");

        const mapped: Record<
          string,
          {
            priceId: string | null;
            amount: number | null;
            productName: string | null;
          }
        > = {};

        for (const plan of body.plans || []) {
          mapped[`${plan.plan}:${plan.billingPeriod}`] = {
            priceId: plan.priceId || null,
            amount: typeof plan.unitAmount === "number" ? plan.unitAmount / 100 : null,
            productName: plan.productName || null,
          };
        }

        setStripePlans(mapped);
      } catch (err: any) {
        setError(err.message || "Failed to load Stripe plans");
      } finally {
        setPlansLoading(false);
      }
    };

    void loadPlans();
  }, []);

  const prices = useMemo(
    () => ({
      pro: {
        monthly: stripePlans["pro:monthly"]?.amount ?? 0,
        annual: stripePlans["pro:annual"]?.amount ?? 0,
        monthlyId: stripePlans["pro:monthly"]?.priceId ?? null,
        annualId: stripePlans["pro:annual"]?.priceId ?? null,
        name: stripePlans[`pro:${billingPeriod}`]?.productName || "Pro",
      },
      premium: {
        monthly: stripePlans["premium:monthly"]?.amount ?? 0,
        annual: stripePlans["premium:annual"]?.amount ?? 0,
        monthlyId: stripePlans["premium:monthly"]?.priceId ?? null,
        annualId: stripePlans["premium:annual"]?.priceId ?? null,
        name: stripePlans[`premium:${billingPeriod}`]?.productName || "Premium",
      },
    }),
    [billingPeriod, stripePlans]
  );

  const handleSubscribe = async (plan: "pro" | "premium") => {
    setIsLoading(plan);
    setError(null);

    try {
      const selectedPriceId =
        billingPeriod === "monthly"
          ? prices[plan].monthlyId
          : prices[plan].annualId;

      if (!selectedPriceId) {
        setError(`No Stripe price configured for ${plan} (${billingPeriod}).`);
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          billingPeriod,
          priceId: selectedPriceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.setupRequired) {
          setError("Stripe is not configured yet. Please set up your Stripe account and add the price IDs to your .env file.");
        } else {
          setError(data.message || "Failed to create checkout session");
        }
        return;
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav active="pricing" authMode="auto" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Canceled Banner */}
        {canceled && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
            <p className="text-yellow-800">
              Your checkout was canceled. No charges were made. Feel free to try again when you're ready.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your job search. All plans include our AI-powered resume optimization.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === "monthly"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === "annual"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Save 25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Free</h3>
              <p className="text-gray-600 text-sm">Perfect for trying out ResumeAI</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-600">{billingPeriod === "annual" ? "/year" : "/month"}</span>
            </div>

            <Link
              href="/builder/new"
              className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center mb-6"
            >
              Get Started
            </Link>

            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">3 resumes per month</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">AI-powered optimization</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">5 basic templates</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">PDF export</span>
              </li>
              <li className="flex items-start">
                <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                <span className="text-gray-400">Premium templates</span>
              </li>
              <li className="flex items-start">
                <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0" />
                <span className="text-gray-400">Cover letters</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan - Most Popular */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                {prices.pro.name}
                <Zap className="h-5 w-5 text-yellow-500 ml-2" />
              </h3>
              <p className="text-gray-600 text-sm">For active job seekers</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">
                {plansLoading ? "..." : `$${prices.pro[billingPeriod]}`}
              </span>
              <span className="text-gray-600">/month</span>
              {billingPeriod === "annual" && (
                <p className="text-sm text-green-600 mt-1">
                  Billed ${prices.pro.annual}/year
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe("pro")}
              disabled={isLoading !== null}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "pro" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>

            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600"><strong>Unlimited</strong> resumes</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">AI-powered optimization</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600"><strong>20+</strong> premium templates</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Cover letter generator</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">PDF & DOCX export</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Unlimited job tracking</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-600">Priority support</span>
              </li>
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                {prices.premium.name}
                <Star className="h-5 w-5 text-yellow-400 ml-2" />
              </h3>
              <p className="text-purple-200 text-sm">For serious career advancement</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">
                {plansLoading ? "..." : `$${prices.premium[billingPeriod]}`}
              </span>
              <span className="text-purple-200">{billingPeriod === "annual" ? "/year" : "/month"}</span>
              {billingPeriod === "annual" && (
                <p className="text-sm text-purple-200 mt-1">
                  Billed ${prices.premium.annual}/year
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe("premium")}
              disabled={isLoading !== null}
              className="w-full py-3 px-4 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition flex items-center justify-center mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading === "premium" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Go Premium
                  <Sparkles className="h-4 w-4 ml-2" />
                </>
              )}
            </button>

            <ul className="space-y-3">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>Custom branding</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>LinkedIn profile optimization</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>1-on-1 resume review</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>Interview preparation tips</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>Salary negotiation guide</span>
              </li>
              <li className="flex items-start">
                <Shield className="h-5 w-5 text-purple-300 mr-3 flex-shrink-0" />
                <span>14-day money-back guarantee</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-16">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Compare Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Feature</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-900">Free</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-blue-600">Pro</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-purple-600">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{feature.name}</td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.free === "boolean" ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{feature.free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center bg-blue-50/50">
                      {typeof feature.pro === "boolean" ? (
                        feature.pro ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-blue-600 font-medium">{feature.pro}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center bg-purple-50/50">
                      {typeof feature.premium === "boolean" ? (
                        feature.premium ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-purple-600 font-medium">{feature.premium}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <HelpCircle className={`h-5 w-5 text-gray-400 transition-transform ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`} />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to land your dream job?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of job seekers who have improved their resume with ResumeAI.
          </p>
          <Link
            href="/builder/new"
            className="inline-flex items-center bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition font-semibold text-lg"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
