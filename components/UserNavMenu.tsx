"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, CreditCard, LogOut, Settings, User } from "lucide-react";

type UserNavMenuProps = {
  name: string;
  planType: string;
  variant?: "light" | "dark";
};

export default function UserNavMenu({
  name,
  planType,
  variant = "light",
}: UserNavMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const displayName = name || "User";
  const isDark = variant === "dark";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition ${
          isDark ? "hover:bg-white/10" : "hover:bg-slate-100"
        }`}
      >
        <div className="text-right hidden sm:block">
          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>
            {displayName}
          </p>
          <p className={`text-xs capitalize ${isDark ? "text-slate-300" : "text-slate-500"}`}>
            {planType} Plan
          </p>
        </div>
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
            isDark
              ? "bg-gradient-to-br from-cyan-500 to-blue-600"
              : "bg-gradient-to-br from-blue-500 to-indigo-600"
          }`}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>
        <ChevronDown className={`h-4 w-4 ${isDark ? "text-slate-300" : "text-slate-500"}`} />
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500 capitalize">{planType} Plan</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/settings/billing"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
          <Link
            href="/settings/billing"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
