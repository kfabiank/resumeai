"use client";

import { setDemoUser } from "@/lib/demo-auth";

const USERS = [
  { name: "QA Free User", email: "qa-free@resumeai.local", planType: "free" as const },
  { name: "QA Pro User", email: "qa-pro@resumeai.local", planType: "pro" as const },
  { name: "QA Premium User", email: "qa-premium@resumeai.local", planType: "premium" as const },
];

export default function LoginPage() {
  const loginAs = (index: number) => {
    setDemoUser(USERS[index]);
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Log In</h1>
        <p className="text-sm text-gray-600 mb-6">
          Select a user to test login/avatar behavior.
        </p>

        <div className="space-y-3">
          {USERS.map((u, idx) => (
            <button
              key={u.email}
              type="button"
              onClick={() => loginAs(idx)}
              className="w-full text-left border border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 hover:bg-blue-50"
            >
              <div className="font-medium text-gray-900">{u.name}</div>
              <div className="text-xs text-gray-500">{u.email} · {u.planType} plan</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
