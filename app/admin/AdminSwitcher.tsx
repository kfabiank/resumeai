"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import type { BillingEmailKind } from "@/lib/email";

const QA_USERS = [
  { email: "qa-free@resumeai.local", label: "QA Free", plan: "free" },
  { email: "qa-pro@resumeai.local", label: "QA Pro", plan: "pro" },
  { email: "qa-premium@resumeai.local", label: "QA Premium", plan: "premium" },
];

type Props = {
  adminEmail: string;
};

const EMAIL_TYPES: Array<{ value: BillingEmailKind; label: string }> = [
  { value: "welcome", label: "Welcome" },
  { value: "plan_upgraded", label: "Plan Upgraded" },
  { value: "plan_downgraded", label: "Plan Downgraded" },
  { value: "subscription_canceled", label: "Subscription Canceled" },
  { value: "payment_failed", label: "Payment Failed" },
];

export default function AdminSwitcher({ adminEmail }: Props) {
  const [tab, setTab] = useState<"qa" | "emails">("qa");
  const [qaPassword, setQaPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [recipient, setRecipient] = useState("kfabiank@gmail.com");
  const [emailKind, setEmailKind] = useState<BillingEmailKind>("welcome");
  const [planLabel, setPlanLabel] = useState("Pro");
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const loginAsQa = async (email: string) => {
    setError("");
    if (!qaPassword.trim()) {
      setError("Enter QA_TEST_PASSWORD first.");
      return;
    }

    setLoadingEmail(email);
    const result = await signIn("credentials", {
      email,
      password: qaPassword,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setLoadingEmail(null);

    if (result?.error) {
      setError("Invalid credentials or QA_TEST_PASSWORD mismatch.");
      return;
    }

    window.location.href = "/dashboard";
  };

  const sendTestEmail = async () => {
    setEmailError("");
    setEmailResult("");
    setEmailSending(true);
    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipient,
          kind: emailKind,
          planLabel,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmailError(body.message || body.error || "Failed to send test email");
        return;
      }
      setEmailResult(
        body.skipped
          ? `Skipped: ${body.reason || "Unknown reason"}`
          : `Email sent to ${body.to} (${body.kind})`
      );
    } catch (err: any) {
      setEmailError(err?.message || "Failed to send test email");
    } finally {
      setEmailSending(false);
    }
  };

  useEffect(() => {
    if (tab !== "emails") return;
    let mounted = true;
    const loadPreview = async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/admin/email-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: emailKind,
            planLabel,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) {
          setPreviewSubject("");
          setPreviewHtml("");
          setEmailError(body.error || "Could not load preview");
          return;
        }
        setEmailError("");
        setPreviewSubject(body.subject || "");
        setPreviewHtml(body.html || "");
      } catch (err: any) {
        if (!mounted) return;
        setPreviewSubject("");
        setPreviewHtml("");
        setEmailError(err?.message || "Could not load preview");
      } finally {
        if (mounted) setPreviewLoading(false);
      }
    };
    void loadPreview();
    return () => {
      mounted = false;
    };
  }, [tab, emailKind, planLabel]);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          Logged in as admin: <span className="font-semibold">{adminEmail}</span>
        </p>
      </div>

      <div className="mt-4 inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          type="button"
          onClick={() => setTab("qa")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "qa" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          QA Switcher
        </button>
        <button
          type="button"
          onClick={() => setTab("emails")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            tab === "emails" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Test Emails
        </button>
      </div>

      {tab === "qa" ? (
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin User Switcher</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter <code>QA_TEST_PASSWORD</code>, then click a QA user to switch session quickly.
          </p>

          <div className="mt-4">
            <label htmlFor="qa-password" className="mb-1 block text-sm font-medium text-gray-700">
              QA password
            </label>
            <input
              id="qa-password"
              type="password"
              value={qaPassword}
              onChange={(e) => setQaPassword(e.target.value)}
              placeholder="QA_TEST_PASSWORD"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {QA_USERS.map((user) => (
              <button
                key={user.email}
                type="button"
                disabled={loadingEmail === user.email}
                onClick={() => loginAsQa(user.email)}
                className="rounded-lg border border-gray-300 px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50 disabled:opacity-60"
              >
                <p className="font-semibold text-gray-900">{user.label}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="mt-1 text-xs capitalize text-blue-700">{user.plan} plan</p>
              </button>
            ))}
          </div>

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Go to dashboard
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">Test Emails</h1>
          <p className="mt-2 text-sm text-gray-600">
            Send any transactional email template to validate UI, copy, and Resend setup.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Recipient</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email Type</label>
              <select
                value={emailKind}
                onChange={(e) => setEmailKind(e.target.value as BillingEmailKind)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                {EMAIL_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Plan label (for dynamic templates)</label>
            <input
              value={planLabel}
              onChange={(e) => setPlanLabel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={sendTestEmail}
              disabled={emailSending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {emailSending ? "Sending..." : "Send test email"}
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-800">
              Preview {previewSubject ? `- ${previewSubject}` : ""}
            </p>
            {previewLoading ? (
              <p className="mt-2 text-sm text-gray-500">Loading preview...</p>
            ) : previewHtml ? (
              <iframe
                title="Email preview"
                srcDoc={previewHtml}
                className="mt-3 h-[480px] w-full rounded-md border border-gray-200 bg-white"
              />
            ) : (
              <p className="mt-2 text-sm text-gray-500">No preview available.</p>
            )}
          </div>

          {emailResult ? <p className="mt-3 text-sm text-emerald-700">{emailResult}</p> : null}
          {emailError ? <p className="mt-3 text-sm text-red-600">{emailError}</p> : null}
        </div>
      )}
    </section>
  );
}
