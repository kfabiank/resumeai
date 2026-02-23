"use client";

import { useEffect, useMemo, useState } from "react";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";

type Rule = {
  free: boolean;
  pro: boolean;
  premium: boolean;
};

type MapByTemplate = Record<string, Rule>;

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
    "Senior Full-Stack Engineer with 8+ years building SaaS products. Strong in Next.js, TypeScript, PostgreSQL, and cloud architecture.",
  experiences: [
    {
      title: "Senior Full-Stack Engineer",
      company: "ResumeAI",
      startDate: "2023-01",
      endDate: "",
      current: true,
      optimizedBullets: [
        "Reduced p95 API latency by 40% through query optimization and caching.",
        "Improved paid conversion by 22% with onboarding and billing flow redesign.",
      ],
      keywordsUsed: ["next.js", "prisma", "postgresql"],
    },
    {
      title: "Full-Stack Engineer",
      company: "TalentFlow",
      startDate: "2020-05",
      endDate: "2022-12",
      current: false,
      optimizedBullets: ["Built recruiter dashboard used by 10k+ monthly active users."],
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
  languages: [
    { name: "English", level: "Native" },
    { name: "Spanish", level: "Professional" },
  ],
  keywords: ["SaaS", "ATS", "Optimization"],
};

function defaultRule(isPremium: boolean): Rule {
  return isPremium
    ? { free: false, pro: true, premium: true }
    : { free: true, pro: true, premium: true };
}

export default function TemplateAccessManager() {
  const [map, setMap] = useState<MapByTemplate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/template-access", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "Failed to load template access");

        const next: MapByTemplate = {};
        for (const t of TEMPLATE_CATALOG) {
          next[t.id] = body.map?.[t.id] || defaultRule(t.isPremium);
        }
        setMap(next);
      } catch (err: any) {
        setError(err?.message || "Failed to load template access");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const rows = useMemo(
    () =>
      TEMPLATE_CATALOG.map((template) => ({
        ...template,
        rule: map[template.id] || defaultRule(template.isPremium),
      })),
    [map]
  );

  const toggle = (templateId: string, plan: keyof Rule, checked: boolean) => {
    setMap((prev) => ({
      ...prev,
      [templateId]: {
        ...(prev[templateId] || { free: false, pro: true, premium: true }),
        [plan]: checked,
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/template-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ map }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to save template access");
      setMessage("Template access updated.");
    } catch (err: any) {
      setError(err?.message || "Failed to save template access");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Template Access By Plan</h2>
          <p className="text-xs text-slate-600">
            Configure which templates are available for Free, Pro, and Premium.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving || loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save access rules"}
        </button>
      </div>

      {message ? <p className="px-4 pt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="px-4 pt-3 text-sm text-red-600">{error}</p> : null}

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Template</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium text-center">Preview</th>
              <th className="px-4 py-2 font-medium text-center">Free</th>
              <th className="px-4 py-2 font-medium text-center">Pro</th>
              <th className="px-4 py-2 font-medium text-center">Premium</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <p className="font-medium text-slate-900">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.id}</p>
                </td>
                <td className="px-4 py-2 text-slate-700">{row.categoryLabel}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => setPreviewTemplateId(row.id)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Preview
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.rule.free}
                    onChange={(e) => toggle(row.id, "free", e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.rule.pro}
                    onChange={(e) => toggle(row.id, "pro", e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={row.rule.premium}
                    onChange={(e) => toggle(row.id, "premium", e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewTemplateId ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4">
          <div className="mx-auto h-full max-w-5xl rounded-xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="font-semibold text-slate-900">
                Template Preview:{" "}
                {TEMPLATE_CATALOG.find((t) => t.id === previewTemplateId)?.name || previewTemplateId}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewTemplateId(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              <div className="mx-auto max-w-[860px] rounded-lg bg-white shadow">
                <TemplateRenderer templateId={previewTemplateId} data={PREVIEW_DATA} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
