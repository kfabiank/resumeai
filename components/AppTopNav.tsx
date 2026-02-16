"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import UserNavMenu from "@/components/UserNavMenu";

type AppTopNavProps = {
  active?: "dashboard" | "templates" | "tracker" | "profile" | "billing";
  userName: string;
  planType: string;
};

export default function AppTopNav({
  active,
  userName,
  planType,
}: AppTopNavProps) {
  const linkClass = (key: AppTopNavProps["active"]) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active === key
        ? "text-blue-600 bg-blue-50"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ResumeAI
            </span>
          </Link>

          <div className="flex items-center space-x-1">
            <Link href="/dashboard" className={linkClass("dashboard")}>
              Dashboard
            </Link>
            <Link href="/templates" className={linkClass("templates")}>
              Templates
            </Link>
            <Link href="/tracker" className={linkClass("tracker")}>
              Tracker
            </Link>
            <div className="ml-3">
              <UserNavMenu name={userName} planType={planType} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
