"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <AppTopNav authMode="auto" />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
        <AppFooter />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncSubscription = async () => {
      if (!sessionId) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/stripe/sync-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.message || "Could not confirm subscription in local environment");
        }
      } catch (error: any) {
        if (mounted) {
          setSyncError(error?.message || "Could not sync subscription");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void syncSubscription();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full">
          <AppTopNav authMode="auto" />
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Confirming your subscription...</p>
          </div>
          <AppFooter />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav authMode="auto" />

      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Pro!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your subscription is now active. You have access to all premium features.
          </p>

          {syncError ? (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {syncError}
            </div>
          ) : null}

          {/* Features unlocked */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
              Features Unlocked
            </h3>
            <ul className="space-y-3 text-left max-w-sm mx-auto">
              <li className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                Unlimited resume creation
              </li>
              <li className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                20+ premium templates
              </li>
              <li className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                Cover letter generator
              </li>
              <li className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                PDF & DOCX export
              </li>
              <li className="flex items-center text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                Priority support
              </li>
            </ul>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/builder/new"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              Create a Resume
            </Link>
          </div>

          {/* Receipt info */}
          <p className="text-sm text-gray-500 mt-8">
            A receipt has been sent to your email address.
            <br />
            You can manage your subscription in{" "}
            <Link href="/settings/billing" className="text-blue-600 hover:underline">
              billing settings
            </Link>
            .
          </p>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
