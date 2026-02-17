"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FileText } from "lucide-react";
import UserNavMenu from "@/components/UserNavMenu";

type AppTopNavProps = {
  active?: "dashboard" | "templates" | "tracker" | "profile" | "billing" | "pricing" | "cover-letter";
  userName?: string;
  planType?: string;
  authMode?: "auto" | "authenticated" | "guest";
  rightSlot?: ReactNode;
};

export default function AppTopNav({
  active,
  userName,
  planType,
  authMode = "auto",
  rightSlot,
}: AppTopNavProps) {
  const [resolvedUser, setResolvedUser] = useState({
    name: userName || "User",
    planType: planType || "free",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(
    authMode === "authenticated" || Boolean(userName || planType)
  );

  useEffect(() => {
    if (authMode === "authenticated") {
      setResolvedUser({
        name: userName || "User",
        planType: planType || "free",
      });
      setIsAuthenticated(true);
      return;
    }

    if (authMode === "guest") {
      setIsAuthenticated(false);
      return;
    }

    if (userName || planType) {
      setResolvedUser({
        name: userName || "User",
        planType: planType || "free",
      });
      setIsAuthenticated(true);
      return;
    }

    let mounted = true;
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!mounted || !res.ok) {
          if (mounted) setIsAuthenticated(false);
          return;
        }

        const body = await res.json();
        if (!mounted) return;

        setResolvedUser({
          name: body.name || body.email?.split("@")?.[0] || "User",
          planType: body.planType || "free",
        });
        setIsAuthenticated(true);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [authMode, userName, planType]);

  const brandHref = isAuthenticated ? "/dashboard" : "/";

  const navLinks = useMemo(() => {
    if (isAuthenticated) {
      return [
        { key: "dashboard", href: "/dashboard", label: "Dashboard" },
        { key: "templates", href: "/templates", label: "Templates" },
        { key: "tracker", href: "/tracker", label: "Tracker" },
        { key: "cover-letter", href: "/cover-letter", label: "Cover Letter" },
        { key: "pricing", href: "/pricing", label: "Pricing" },
      ] as const;
    }

    return [
      { key: "templates", href: "/templates", label: "Templates" },
      { key: "pricing", href: "/pricing", label: "Pricing" },
    ] as const;
  }, [isAuthenticated]);

  const linkClass = (key: AppTopNavProps["active"] | "dashboard" | "templates" | "tracker" | "pricing" | "cover-letter") =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active === key
        ? "text-blue-600 bg-blue-50"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={brandHref} className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ResumeAI
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {rightSlot ? <div className="hidden md:block">{rightSlot}</div> : null}

            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((item) => (
                <Link key={item.key} href={item.href} className={linkClass(item.key)}>
                  {item.label}
                </Link>
              ))}
            </div>

            {isAuthenticated ? (
              <div className="ml-1">
                <UserNavMenu name={resolvedUser.name} planType={resolvedUser.planType} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/builder/new"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
