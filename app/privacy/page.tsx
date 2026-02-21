import Link from "next/link";
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";

export const metadata = {
  title: "Privacy Policy | ResumeAI",
  description: "Privacy Policy for ResumeAI.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  const updatedAt = "February 16, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav authMode="auto" />
      <main className="px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {updatedAt}</p>

          <section className="space-y-4 text-gray-700">
            <p>
              ResumeAI collects account and profile data you provide, plus usage data required to
              operate core features such as resume generation, job tracking, and billing.
            </p>
            <p>
              We use this information to provide and improve the service, process payments, secure
              accounts, and support users. We do not sell your personal data.
            </p>
            <p>
              Third-party providers may process limited data on our behalf, including authentication
              providers, payment processors, and cloud infrastructure providers.
            </p>
            <p>
              You can request access, correction, or deletion of your data by contacting the app
              owner. Additional terms may apply based on your jurisdiction.
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/terms" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </Link>
            <Link href="/" className="text-gray-600 hover:text-gray-800">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
