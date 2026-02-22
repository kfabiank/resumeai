"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  Eye,
  Lock,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import AppTopNav from "@/components/AppTopNav";
import AppFooter from "@/components/AppFooter";
import {
  isTemplateId,
  TEMPLATE_CATALOG,
  type TemplateCatalogItem,
} from "@/lib/template-catalog";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import { TEMPLATE_PREVIEW_DATA } from "@/lib/template-preview-data";

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

type SortMode = "recommended" | "name" | "newest";

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [user, setUser] = useState<{ name: string; planType: string }>({
    name: "User",
    planType: "free",
  });
  const [allowedTemplateIds, setAllowedTemplateIds] = useState<Set<string> | null>(null);

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
        if (!res.ok) return;
        const body = await res.json();
        setUser({
          name: body.name || body.email?.split("@")[0] || "User",
          planType: body.planType || "free",
        });
      } catch {
        // guest fallback
      }
    };

    void loadProfile();
  }, []);

  useEffect(() => {
    const loadAccess = async () => {
      try {
        const res = await fetch("/api/template-access", { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        if (Array.isArray(body.allowedTemplateIds)) {
          setAllowedTemplateIds(new Set(body.allowedTemplateIds));
        }
      } catch {
        // keep legacy fallback
      }
    };
    void loadAccess();
  }, []);

  const canUseTemplate = (template: TemplateCatalogItem) => {
    if (allowedTemplateIds) return allowedTemplateIds.has(template.id);
    return !template.isPremium || user.planType !== "free";
  };

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

  const previewTemplateData = previewTemplateId
    ? TEMPLATE_CATALOG.find((item) => item.id === previewTemplateId) || null
    : null;

  const featuredCount = TEMPLATE_CATALOG.filter(
    (item) => NEW_TEMPLATE_IDS.has(item.id) || item.isPopular
  ).length;

  return (
    <div className="min-h-screen bg-slate-100">
      <AppTopNav active="templates" authMode="auto" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 p-8 shadow-sm">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-200/40 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Premium Template Gallery
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Resume Templates</h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Preview full-size layouts, compare styles quickly, and launch directly into the builder.
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
                  onPreview={() => setPreviewTemplateId(template.id)}
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

      {previewTemplateData && (
        <section className="fixed inset-0 z-[80] bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">{previewTemplateData.name}</h2>
                <p className="text-sm text-slate-600">{previewTemplateData.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplateId(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close template preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="relative min-h-0 overflow-auto bg-slate-200/70 p-4 sm:p-6">
                <div className="mx-auto w-[794px] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
                  <TemplateRenderer templateId={previewTemplateData.id} data={TEMPLATE_PREVIEW_DATA} />
                </div>
              </div>

              <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
                <div className="space-y-3 text-sm">
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Category:</span> {previewTemplateData.categoryLabel}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold text-slate-900">Access:</span>{" "}
                    {previewTemplateData.isPremium ? "Pro" : "Free"}
                  </p>
                  <p className="text-slate-600">Designed for ATS readability and fast recruiter scanning.</p>
                </div>

                <div className="mt-6 space-y-2">
                  {canUseTemplate(previewTemplateData) ? (
                    <Link
                      href={`/builder/new?template=${previewTemplateData.id}`}
                      className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Use This Template
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      href="/pricing"
                      className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Upgrade to Unlock
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTemplate(previewTemplateData.id);
                      setPreviewTemplateId(null);
                    }}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Select for Later
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>
      )}

      <AppFooter />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 backdrop-blur">
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
  onPreview,
}: {
  template: TemplateCatalogItem;
  selected: boolean;
  isNew: boolean;
  canUse: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <article
      className={`group overflow-hidden rounded-2xl border bg-white transition ${
        selected
          ? "border-blue-500 shadow-lg shadow-blue-100"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
      }`}
    >
      <div className="relative aspect-[8.5/11] overflow-hidden bg-slate-100">
        <div className={`absolute inset-0 bg-gradient-to-br ${template.colors}`} style={{ opacity: 0.12 }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_55%)]" />
        <div className="absolute inset-2 overflow-hidden rounded-lg border border-slate-300/70 bg-white shadow-xl">
          <Image
            src={`/template-thumbnails/${template.id}.png`}
            alt={`${template.name} resume template preview`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover object-top"
          />
        </div>

        <div className="absolute bottom-3 right-3 z-10 flex flex-wrap justify-end gap-2 rounded-xl bg-slate-900/55 p-1.5 backdrop-blur-sm">
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

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/55 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={onPreview}
            className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            <Eye className="mr-2 h-4 w-4" />
            Full Preview
          </button>
          <button
            onClick={onSelect}
            className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Select
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
              selected
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-800 hover:bg-blue-600 hover:text-white"
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
