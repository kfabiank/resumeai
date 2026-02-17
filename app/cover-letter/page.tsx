"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import AppTopNav from "@/components/AppTopNav";

type ResumeItem = {
  id: string;
  title: string;
};

type CoverLetterItem = {
  id: string;
  company: string;
  position: string;
  content: string;
  createdAt: string;
};

export default function CoverLetterPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [letters, setLetters] = useState<CoverLetterItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [resumeRes, lettersRes] = await Promise.all([
        fetch("/api/resume", { cache: "no-store" }),
        fetch("/api/cover-letter", { cache: "no-store" }),
      ]);

      if (resumeRes.status === 401 || lettersRes.status === 401) {
        window.location.href = "/login";
        return;
      }

      const resumeBody = await resumeRes.json();
      const lettersBody = await lettersRes.json();

      if (!resumeRes.ok) throw new Error(resumeBody.error || "Failed to load resumes");
      if (!lettersRes.ok) throw new Error(lettersBody.error || "Failed to load cover letters");

      const nextResumes = (resumeBody.resumes || []).map((r: any) => ({
        id: r.id,
        title: r.title,
      }));
      setResumes(nextResumes);
      setLetters(lettersBody.letters || []);
      if (nextResumes.length && !selectedResumeId) {
        setSelectedResumeId(nextResumes[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selectedResumeId || !company.trim()) {
      setError("Select a resume and add company.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId,
          company,
          position,
          jobDescription,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to generate cover letter");

      setLetters((prev) => [body.letter, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to generate cover letter");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav active="cover-letter" authMode="auto" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Cover Letter Generator</h1>
          <p className="text-gray-600">Generate personalized cover letters from your resume data.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={onGenerate} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resume</label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Select a resume</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description (optional)</label>
              <textarea
                rows={6}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {generating ? "Generating..." : "Generate Cover Letter"}
            </button>
          </form>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Cover Letters</h2>
            {letters.length === 0 ? (
              <p className="text-gray-600 text-sm">No cover letters yet.</p>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {letters.map((letter) => (
                  <div key={letter.id} className="border border-gray-200 rounded-lg p-4">
                    <p className="font-medium text-gray-900">
                      {letter.position} - {letter.company}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(letter.createdAt).toLocaleString()}
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700 font-sans">
                      {letter.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
