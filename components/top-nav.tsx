"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, LogOut, UserCircle2 } from "lucide-react";
import { DemoUser, clearDemoUser } from "@/lib/demo-auth";

type TopNavProps = {
  active: "dashboard" | "templates" | "tracker";
  user: DemoUser;
};

export default function TopNav({ active, user }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!user.email;

  const logout = () => {
    clearDemoUser();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              ResumeAI
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className={active === "dashboard" ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"}>
              Dashboard
            </Link>
            <Link href="/templates" className={active === "templates" ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"}>
              Templates
            </Link>
            <Link href="/tracker" className={active === "tracker" ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"}>
              Tracker
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center space-x-3 hover:opacity-90 transition"
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.planType} Plan</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                        onClick={() => setOpen(false)}
                      >
                        <UserCircle2 className="h-4 w-4 mr-2" />
                        My Dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      onClick={() => setOpen(false)}
                    >
                      Log in
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
