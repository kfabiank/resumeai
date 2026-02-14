"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

const QA_USERS = [
  { email: "qa-free@resumeai.local", label: "QA Free", plan: "free" },
  { email: "qa-pro@resumeai.local", label: "QA Pro", plan: "pro" },
  { email: "qa-premium@resumeai.local", label: "QA Premium", plan: "premium" },
];

type Props = {
  adminEmail: string;
};

export default function AdminSwitcher({ adminEmail }: Props) {
  const [qaPassword, setQaPassword] = useState("");
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            Logged in as admin: <span className="font-semibold">{adminEmail}</span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
      </div>
    </main>
  );
}
