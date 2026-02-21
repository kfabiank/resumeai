import Link from "next/link";
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";

export const metadata = {
  title: "Terms of Service | ResumeAI",
  description: "Terms of Service for ResumeAI.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  const updatedAt = "February 16, 2026";

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav authMode="auto" />
      <main className="px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {updatedAt}</p>

          <section className="space-y-4 text-gray-700">
            <p>
              By accessing or using ResumeAI, you agree to these Terms. You are responsible for the
              accuracy of the information you submit and for activity under your account.
            </p>
            <p>
              Paid subscriptions renew according to the selected billing cycle unless canceled. Fees,
              plan limits, and feature access are managed according to your active plan.
            </p>
            <p>
              You retain ownership of your content. By using the service, you grant permission to
              process content as needed to provide features such as resume optimization and exports.
            </p>
            <p>
              The service is provided on an "as is" basis without guarantees of job outcomes. We may
              update these Terms over time; continued use means acceptance of updated terms.
            </p>
          </section>

          <div className="mt-10 pt-6 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
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
