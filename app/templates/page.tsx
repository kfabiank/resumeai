"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  ChevronRight,
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
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
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
          name: body.name || body.email?.split("@")?.[0] || "User",
          planType: body.planType || "free",
        });
      } catch {
        // Keep defaults for guests
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
        // fallback to legacy behavior
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
      sorted.sort(
        (a, b) => Number(NEW_TEMPLATE_IDS.has(b.id)) - Number(NEW_TEMPLATE_IDS.has(a.id))
      );
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

  const previewIndex = previewTemplate
    ? filteredTemplates.findIndex((t) => t.id === previewTemplate)
    : -1;

  const freeCount = TEMPLATE_CATALOG.filter((t) => !t.isPremium).length;
  const proCount = TEMPLATE_CATALOG.filter((t) => t.isPremium).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <AppTopNav active="templates" authMode="auto" />

      {/* ── Hero ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-5 border border-blue-100">
              <Sparkles className="w-4 h-4" />
              {TEMPLATE_CATALOG.length} ATS-Optimized Templates
            </div>
            <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Find Your Perfect<br className="hidden sm:block" /> Resume Design
            </h1>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Crafted by hiring experts. Preview any template instantly — switch anytime.
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-12 flex flex-wrap justify-center gap-10">
            {[
              { label: "Total Templates", value: `${TEMPLATE_CATALOG.length}` },
              { label: "Free Templates", value: `${freeCount}` },
              { label: "Pro Templates", value: `${proCount}` },
              { label: "Industries Covered", value: "12" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-4xl font-black text-slate-900">{value}</p>
                <p className="text-sm text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters + Grid ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, style, or industry…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm text-sm">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent font-medium text-slate-700 outline-none"
            >
              <option value="recommended">Recommended</option>
              <option value="newest">Newest First</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Category pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const count =
              cat.id === "all" ? TEMPLATE_CATALOG.length : categoryCounts.get(cat.id) || 0;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                }`}
              >
                {cat.name}
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result count */}
        <p className="mt-5 text-sm text-slate-400 font-medium">
          {filteredTemplates.length === TEMPLATE_CATALOG.length
            ? `Showing all ${TEMPLATE_CATALOG.length} templates`
            : `${filteredTemplates.length} template${filteredTemplates.length !== 1 ? "s" : ""} found`}
        </p>

        {/* Grid */}
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No templates match your search.</p>
              <p className="text-sm mt-1">Try a different keyword or category.</p>
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isNew={NEW_TEMPLATE_IDS.has(template.id)}
                canUse={canUseTemplate(template)}
                selected={selectedTemplate === template.id}
                onSelect={() => setSelectedTemplate(template.id)}
                onPreview={() => setPreviewTemplate(template.id)}
              />
            ))
          )}
        </div>
      </main>

      {/* ── Selected sticky bar ── */}
      {selectedTemplateData && (
        <div className="fixed bottom-5 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-2xl border border-slate-200 shadow-2xl px-5 py-3.5 flex items-center gap-4 max-w-xl w-full">
            <div
              className={`w-1.5 h-10 rounded-full bg-gradient-to-b shrink-0 ${selectedTemplateData.colors}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">
                {selectedTemplateData.name}
              </p>
              <p className="text-xs text-slate-400">Ready to build your resume</p>
            </div>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-slate-300 hover:text-slate-500 transition shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            {canUseTemplate(selectedTemplateData) ? (
              <Link
                href={`/builder/new?template=${selectedTemplateData.id}`}
                className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5"
              >
                Use Template
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <TemplatePreviewModal
          templateId={previewTemplate}
          filteredTemplates={filteredTemplates}
          currentIndex={previewIndex}
          canUse={canUseTemplate(TEMPLATE_CATALOG.find((t) => t.id === previewTemplate)!)}
          onClose={() => setPreviewTemplate(null)}
          onNavigate={(id) => setPreviewTemplate(id)}
          onSelect={(id) => {
            setSelectedTemplate(id);
            setPreviewTemplate(null);
          }}
        />
      )}

      <AppFooter />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Template Card
───────────────────────────────────────────── */
function TemplateCard({
  template,
  isNew,
  canUse,
  selected,
  onSelect,
  onPreview,
}: {
  template: TemplateCatalogItem;
  isNew: boolean;
  canUse: boolean;
  selected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.42);
  const [visible, setVisible] = useState(false);

  // Dynamically compute scale so the template fills the card thumbnail exactly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / 794);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Lazy-render: only mount the template when the card scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <article
      className={`group bg-white rounded-2xl overflow-hidden transition-all duration-200 ${
        selected
          ? "ring-2 ring-blue-500 shadow-xl shadow-blue-100/60"
          : "shadow-sm hover:shadow-xl hover:-translate-y-0.5 ring-1 ring-slate-200/80"
      }`}
    >
      {/* Color accent stripe */}
      <div className={`h-1.5 bg-gradient-to-r ${template.colors}`} />

      {/* Thumbnail */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-white cursor-pointer"
        style={{ aspectRatio: "8.5 / 11" }}
        onClick={onPreview}
      >
        {/* Scaled live preview */}
        {visible ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "794px",
              minHeight: "1123px",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            <TemplateRenderer templateId={template.id} data={PREVIEW_DATA} />
          </div>
        ) : (
          /* Skeleton while off-screen */
          <div className="absolute inset-0 bg-slate-100 animate-pulse" />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1 z-10">
          {isNew && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              NEW
            </span>
          )}
          {template.isPopular && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
              <Star className="w-2.5 h-2.5" />
              POPULAR
            </span>
          )}
          {template.isPremium && (
            <span className="bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              PRO
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/55 transition-all duration-200 flex items-center justify-center gap-2.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {selected ? "Selected" : "Select"}
          </button>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-slate-900 leading-tight">{template.name}</h3>
          <span className="shrink-0 text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-medium">
            {template.categoryLabel}
          </span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">{template.description}</p>

        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Preview
          </button>
          {canUse ? (
            <button
              onClick={onSelect}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {selected ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Selected
                </>
              ) : (
                "Use Template"
              )}
            </button>
          ) : (
            <Link
              href="/pricing"
              className="flex-1 py-2 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition text-center flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Upgrade
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────
   Preview Modal
───────────────────────────────────────────── */
const MODAL_PREVIEW_WIDTH = 440;
const MODAL_PREVIEW_SCALE = MODAL_PREVIEW_WIDTH / 794;
const MODAL_PREVIEW_HEIGHT = MODAL_PREVIEW_WIDTH * (11 / 8.5);

function TemplatePreviewModal({
  templateId,
  filteredTemplates,
  currentIndex,
  canUse,
  onClose,
  onNavigate,
  onSelect,
}: {
  templateId: string;
  filteredTemplates: TemplateCatalogItem[];
  currentIndex: number;
  canUse: boolean;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const template = TEMPLATE_CATALOG.find((t) => t.id === templateId)!;
  const prevTemplate = currentIndex > 0 ? filteredTemplates[currentIndex - 1] : null;
  const nextTemplate =
    currentIndex < filteredTemplates.length - 1 ? filteredTemplates[currentIndex + 1] : null;
  const isNew = NEW_TEMPLATE_IDS.has(templateId);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && prevTemplate) onNavigate(prevTemplate.id);
      if (e.key === "ArrowRight" && nextTemplate) onNavigate(nextTemplate.id);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prevTemplate, nextTemplate, onNavigate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex overflow-hidden">
        {/* ── Preview pane ── */}
        <div className="flex-1 bg-slate-100 flex flex-col items-center justify-start pt-10 pb-6 px-10 relative overflow-y-auto min-w-0">
          {/* Page counter */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 text-slate-500 text-xs font-semibold px-3 py-1 rounded-full shadow-sm select-none">
            {currentIndex + 1} / {filteredTemplates.length}
          </div>

          {/* Prev arrow */}
          {prevTemplate && (
            <button
              onClick={() => onNavigate(prevTemplate.id)}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-slate-50 transition z-10"
              title={prevTemplate.name}
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {/* Next arrow */}
          {nextTemplate && (
            <button
              onClick={() => onNavigate(nextTemplate.id)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-slate-50 transition z-10"
              title={nextTemplate.name}
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          )}

          {/* Template page */}
          <div
            className="shadow-2xl rounded overflow-hidden shrink-0"
            style={{ width: `${MODAL_PREVIEW_WIDTH}px`, height: `${MODAL_PREVIEW_HEIGHT}px` }}
          >
            <div
              style={{
                transform: `scale(${MODAL_PREVIEW_SCALE})`,
                transformOrigin: "top left",
                width: "794px",
                minHeight: "1123px",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              <TemplateRenderer templateId={templateId} data={PREVIEW_DATA} />
            </div>
          </div>

          {/* Keyboard hint */}
          <p className="mt-4 text-xs text-slate-400 select-none">
            Use ← → arrow keys to browse
          </p>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-72 shrink-0 flex flex-col border-l border-slate-100 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Preview
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Template info */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className={`h-1 w-14 rounded-full bg-gradient-to-r ${template.colors} mb-4`} />
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {template.name}
            </h2>
            <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-medium">
              {template.categoryLabel}
            </span>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">{template.description}</p>

            {/* Badges */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {isNew && (
                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold rounded-full px-2.5 py-1">
                  New
                </span>
              )}
              {template.isPopular && (
                <span className="text-xs bg-amber-100 text-amber-700 font-semibold rounded-full px-2.5 py-1">
                  Popular
                </span>
              )}
              {template.isPremium ? (
                <span className="text-xs bg-violet-100 text-violet-700 font-semibold rounded-full px-2.5 py-1">
                  Pro Template
                </span>
              ) : (
                <span className="text-xs bg-green-100 text-green-700 font-semibold rounded-full px-2.5 py-1">
                  Free
                </span>
              )}
              <span className="text-xs bg-blue-100 text-blue-700 font-semibold rounded-full px-2.5 py-1">
                ATS-Optimized
              </span>
            </div>

            {/* Features checklist */}
            <div className="mt-6 space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                What&apos;s included
              </p>
              {[
                "ATS-friendly formatting",
                "Professional typography",
                "Skills & experience layout",
                "Fully customizable",
              ].map((f) => (
                <div key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-green-600" />
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="px-6 py-5 border-t border-slate-100 space-y-2.5">
            {canUse ? (
              <>
                <Link
                  href={`/builder/new?template=${template.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition text-sm"
                >
                  Use This Template
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onSelect(template.id)}
                  className="w-full text-slate-600 font-semibold py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-sm"
                >
                  Select for Later
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition text-sm"
                >
                  <Lock className="w-4 h-4" />
                  Upgrade to Pro
                </Link>
                <p className="text-xs text-center text-slate-400">
                  Unlock all {TEMPLATE_CATALOG.filter((t) => t.isPremium).length} premium templates
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
