"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpDown, Check, Eye, FileText, Lock, Search, Sparkles, Star } from "lucide-react";
import AppTopNav from "@/components/AppTopNav";
import {
  isTemplateId,
  TEMPLATE_CATALOG,
  type TemplateCatalogItem,
} from "@/lib/template-catalog";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

const categories = [
  { id: "all", name: "All" },
  { id: "professional", name: "Professional" },
  { id: "tech", name: "Tech" },
  { id: "creative", name: "Creative" },
  { id: "executive", name: "Executive" },
  { id: "academic", name: "Academic" },
  { id: "modern", name: "Modern" },
];

const NEW_TEMPLATE_IDS = new Set([
  "accountant-template",
  "consultant-template",
  "data-science-template",
  "devops-template",
  "finance-template",
  "frontend-template",
  "legal-template",
  "marketing-template",
  "medical-template",
  "nurse-template",
  "paralegal-template",
  "product-manager-template",
  "sales-template",
  "startup-template",
  "ux-designer-template",
  "boardroom-template",
  "impact-template",
]);

const PREVIEW_DATA: ResumeData = {
  personalInfo: {
    name: "Fabian Moya",
    email: "kfabiank@gmail.com",
    phone: "+1 555 234 8891",
    location: "Miami, FL",
    headline: "Senior Full-Stack Engineer",
    linkedin: "linkedin.com/in/fabian",
    portfolio: "fabian.dev",
  },
  professionalSummary:
    "Senior Full-Stack Engineer with 8+ years building SaaS platforms. Strong in Next.js, TypeScript, PostgreSQL, and cloud architecture.",
  experiences: [
    {
      title: "Senior Full-Stack Engineer",
      company: "ResumeAI",
      startDate: "2023-01",
      endDate: "",
      current: true,
      optimizedBullets: [
        "Reduced p95 API latency by 40% via query optimization.",
        "Improved paid conversion by 22% with billing flow redesign.",
      ],
      keywordsUsed: ["next.js", "prisma", "postgresql"],
    },
    {
      title: "Full-Stack Engineer",
      company: "TalentFlow",
      startDate: "2020-05",
      endDate: "2022-12",
      current: false,
      optimizedBullets: ["Built recruiter dashboard used by 10k+ MAU."],
      keywordsUsed: ["react", "typescript"],
    },
  ],
  education: [
    {
      degree: "B.S. Computer Science",
      institution: "Florida International University",
      graduationDate: "2018-05",
      gpa: "3.7",
    },
  ],
  skills: {
    technical: ["TypeScript", "Next.js", "Node.js", "PostgreSQL", "AWS"],
    soft: ["Leadership", "Communication", "Mentoring"],
  },
  keywords: ["SaaS", "ATS", "Optimization"],
};

type SortMode = "recommended" | "name" | "newest";

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [user, setUser] = useState<{ name: string; planType: string }>({
    name: "User",
    planType: "free",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const queryTemplate = new URLSearchParams(window.location.search).get("template");
    if (queryTemplate && isTemplateId(queryTemplate)) {
      setSelectedTemplate(queryTemplate);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) {
          setIsAuthenticated(false);
          return;
        }
        const body = await res.json();
        setUser({
          name: body.name || body.email?.split("@")?.[0] || "User",
          planType: body.planType || "free",
        });
        setIsAuthenticated(true);
      } catch {
        // Keep defaults for guests
        setIsAuthenticated(false);
      }
    };

    void loadProfile();
  }, []);

  const canUseTemplate = (template: TemplateCatalogItem) => !template.isPremium || user.planType !== "free";

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of TEMPLATE_CATALOG) {
      map.set(item.category, (map.get(item.category) || 0) + 1);
    }
    return map;
  }, []);

  const filteredTemplates = useMemo(() => {
    const base = TEMPLATE_CATALOG.filter((item) => {
      const inCategory = selectedCategory === "all" || item.category === selectedCategory;
      if (!inCategory) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    });

    const sorted = [...base];
    if (sortMode === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      return sorted;
    }

    if (sortMode === "newest") {
      sorted.sort((a, b) => Number(NEW_TEMPLATE_IDS.has(b.id)) - Number(NEW_TEMPLATE_IDS.has(a.id)));
      return sorted;
    }

    sorted.sort((a, b) => {
      const aWeight =
        (NEW_TEMPLATE_IDS.has(a.id) ? 20 : 0) +
        (a.isPopular ? 10 : 0) +
        (a.isPremium ? 2 : 0);
      const bWeight =
        (NEW_TEMPLATE_IDS.has(b.id) ? 20 : 0) +
        (b.isPopular ? 10 : 0) +
        (b.isPremium ? 2 : 0);
      if (aWeight !== bWeight) return bWeight - aWeight;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [query, selectedCategory, sortMode]);

  const selectedTemplateData = selectedTemplate
    ? TEMPLATE_CATALOG.find((item) => item.id === selectedTemplate) || null
    : null;

  const featuredCount = TEMPLATE_CATALOG.filter(
    (item) => NEW_TEMPLATE_IDS.has(item.id) || item.isPopular
  ).length;

  return (
    <div className="min-h-screen bg-slate-100">
      {isAuthenticated ? (
        <AppTopNav active="templates" userName={user.name} planType={user.planType} />
      ) : (
        <PublicTopNav />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Professional Collection
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Resume Templates</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Choose a high-conversion design, preview it instantly, and switch templates anytime.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Total Templates" value={`${TEMPLATE_CATALOG.length}`} />
              <StatCard label="Featured" value={`${featuredCount}`} />
              <StatCard
                label="Premium"
                value={`${TEMPLATE_CATALOG.filter((item) => item.isPremium).length}`}
              />
              <StatCard label="Free" value={`${TEMPLATE_CATALOG.filter((item) => !item.isPremium).length}`} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by style, industry or category..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none ring-blue-500 transition focus:ring-2"
              />
            </div>
            <div className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => {
              const count =
                category.id === "all" ? TEMPLATE_CATALOG.length : categoryCounts.get(category.id) || 0;
              const active = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-blue-500" : "bg-white"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              No templates match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  selected={selectedTemplate === template.id}
                  isNew={NEW_TEMPLATE_IDS.has(template.id)}
                  canUse={canUseTemplate(template)}
                  onSelect={() => setSelectedTemplate(template.id)}
                />
              ))}
            </div>
          )}
        </section>

        {selectedTemplateData && (
          <section className="sticky bottom-3 mt-8 rounded-2xl border border-blue-200 bg-white p-4 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Selected: {selectedTemplateData.name}
                </p>
                <p className="text-sm text-slate-600">Create your next resume with this design.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                {canUseTemplate(selectedTemplateData) ? (
                  <Link
                    href={`/builder/new?template=${selectedTemplateData.id}`}
                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Use This Template
                  </Link>
                ) : (
                  <Link
                    href="/pricing"
                    className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                  >
                    Upgrade to Use
                  </Link>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function PublicTopNav() {
  return (
    <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 shadow-lg shadow-blue-500/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ResumeAI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Sign In
          </Link>
          <Link
            href="/builder/new"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Get Started
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  isNew,
  canUse,
  onSelect,
}: {
  template: TemplateCatalogItem;
  selected: boolean;
  isNew: boolean;
  canUse: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition ${
        selected ? "border-blue-500 shadow-lg shadow-blue-100" : "border-slate-200 hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div className="relative aspect-[8.5/11] overflow-hidden bg-slate-100">
        <div className="absolute inset-0 bg-white">
          <div className="origin-top-left scale-[0.29] w-[794px]">
            <TemplateRenderer templateId={template.id} data={PREVIEW_DATA} />
          </div>
        </div>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {isNew ? (
            <span className="rounded-full bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white">
              New
            </span>
          ) : null}
          {template.isPopular ? (
            <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white">
              <Star className="mr-1 h-3 w-3" />
              Popular
            </span>
          ) : null}
          {template.isPremium ? (
            <span className="inline-flex items-center rounded-full bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white">
              <Lock className="mr-1 h-3 w-3" />
              Pro
            </span>
          ) : null}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onSelect}
            className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview & Select
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-900">{template.name}</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {template.categoryLabel}
          </span>
        </div>
        <p className="mb-4 text-sm text-slate-600">{template.description}</p>

        {canUse ? (
          <button
            onClick={onSelect}
            className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
              selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800 hover:bg-blue-600 hover:text-white"
            }`}
          >
            {selected ? (
              <span className="inline-flex items-center">
                <Check className="mr-1.5 h-4 w-4" />
                Selected
              </span>
            ) : (
              "Select Template"
            )}
          </button>
        ) : (
          <Link
            href="/pricing"
            className="inline-flex w-full items-center justify-center rounded-lg bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-200"
          >
            <Lock className="mr-1.5 h-4 w-4" />
            Upgrade to Use
          </Link>
        )}
      </div>
    </article>
  );
}
