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
      { key: "dashboard", href: "/", label: "Home" },
      { key: "templates", href: "/templates", label: "Templates" },
      { key: "pricing", href: "/pricing", label: "Pricing" },
    ] as const;
  }, [isAuthenticated]);

  const linkClass = (key: AppTopNavProps["active"] | "dashboard" | "templates" | "tracker" | "pricing" | "cover-letter") =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active === key
        ? "bg-white/10 text-white"
        : "text-slate-300 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={brandHref} className="flex items-center space-x-3">
            <div className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 p-2 shadow-lg shadow-blue-900/40">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-xl font-bold text-transparent">
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
                  className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-white/10 hover:text-cyan-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/builder/new"
                  className="inline-flex items-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400"
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
