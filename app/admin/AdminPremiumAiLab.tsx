"use client";

import { useMemo, useState } from "react";

type ResumeOption = {
  id: string;
  title: string;
  templateId: string;
  atsScore: number | null;
};

type PremiumAiFeature =
  | "resume_rewrite_pro"
  | "job_match_scoring"
  | "interview_simulation"
  | "salary_negotiation_scripts"
  | "advanced_ats_strategy";

const FEATURES: Array<{ id: PremiumAiFeature; label: string }> = [
  { id: "resume_rewrite_pro", label: "AI Resume Rewrite Pro" },
  { id: "job_match_scoring", label: "AI Job Match Scoring" },
  { id: "interview_simulation", label: "AI Interview Simulation" },
  { id: "salary_negotiation_scripts", label: "AI Salary Negotiation Scripts" },
  { id: "advanced_ats_strategy", label: "Advanced ATS Strategy Recommendations" },
];

export default function AdminPremiumAiLab({ resumes }: { resumes: ResumeOption[] }) {
  const [resumeId, setResumeId] = useState<string>(resumes[0]?.id || "");
  const [feature, setFeature] = useState<PremiumAiFeature>("job_match_scoring");
  const [contextNote, setContextNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const selectedResume = useMemo(
    () => resumes.find((item) => item.id === resumeId) || null,
    [resumes, resumeId]
  );

  const run = async () => {
    if (!resumeId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/premium-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          feature,
          contextNote,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || body.message || "Failed to run Premium AI");
      }
      setResult(body);
    } catch (err: any) {
      setError(err?.message || "Failed to run Premium AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-900">Admin Premium AI Lab</h2>
      <p className="mt-1 text-xs text-slate-600">
        Run premium AI capabilities against a selected resume for QA and plan validation.
      </p>

      {!resumes.length ? (
        <p className="mt-3 text-sm text-slate-500">No resumes available for selected user.</p>
      ) : (
        <>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Resume</label>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {resumes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Feature</label>
              <select
                value={feature}
                onChange={(e) => setFeature(e.target.value as PremiumAiFeature)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {FEATURES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={run}
                disabled={loading || !resumeId}
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Running..." : "Run"}
              </button>
            </div>
          </div>

          <textarea
            value={contextNote}
            onChange={(e) => setContextNote(e.target.value)}
            rows={2}
            placeholder="Optional context note (interview stage, salary target, etc.)"
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />

          {selectedResume ? (
            <p className="mt-2 text-xs text-slate-600">
              Resume ID: {selectedResume.id} · Template: {selectedResume.templateId} · ATS:{" "}
              {selectedResume.atsScore ?? "N/A"}
            </p>
          ) : null}

          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          {result ? (
            <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(result, null, 2)}
            </pre>
          ) : null}
        </>
      )}
    </section>
  );
}

