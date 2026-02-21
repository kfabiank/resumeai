"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Save, Sparkles, Share2, Loader2, X } from "lucide-react";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import AppTopNav from "@/components/AppTopNav";
import type { ResumeData } from "@/types/resume";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import {
  runAtsScan,
  type ResumeContent,
  type AtsArea,
  type AtsScanResult,
} from "@/lib/ats-scan";

type ResumeApiResponse = {
  id: string;
  title: string;
  templateId: string;
  atsScore: number;
  content: ResumeContent;
  user?: {
    planType: string;
  };
};

type AtsUsage = {
  used: number;
  limit: number;
  remaining: number;
  softUpsellThreshold: number;
  softUpsell: boolean;
  blocked: boolean;
  counted?: boolean;
};

function mapToLovableResumeData(content: ResumeContent): ResumeData {
  return {
    personalInfo: {
      ...content.personalInfo,
      linkedin: content.personalInfo.linkedin,
      portfolio: content.personalInfo.portfolio,
    },
    professionalSummary: content.professionalSummary,
    experiences: content.experiences.map((exp) => ({
      ...exp,
      keywordsUsed: exp.keywordsUsed || [],
    })),
    education: content.education,
    skills: content.skills,
    keywords: content.keywords,
  };
}

export default function ResumeEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<ResumeApiResponse | null>(null);
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("modern-professional");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [allowedTemplateIds, setAllowedTemplateIds] = useState<Set<string> | null>(null);
  const [technicalSkillInput, setTechnicalSkillInput] = useState("");
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isPublicResume, setIsPublicResume] = useState(false);
  const [isScanningAts, setIsScanningAts] = useState(false);
  const [atsResult, setAtsResult] = useState<AtsScanResult | null>(null);
  const [atsUsage, setAtsUsage] = useState<AtsUsage | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMode, setUpgradeModalMode] = useState<"soft" | "hard">("soft");
  const exportPreviewRef = useRef<HTMLDivElement | null>(null);
  const summaryRef = useRef<HTMLTextAreaElement | null>(null);
  const experienceRef = useRef<HTMLDivElement | null>(null);
  const skillsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resume/${id}`);
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || "Resume not found");
        }
        const data: ResumeApiResponse = await response.json();
        setResume(data);
        setContent(data.content);
        setSelectedTemplateId(data.templateId || "modern-professional");
        setUserPlan(data.user?.planType || "free");
        setAtsResult(runAtsScan(data.content));

        const [shareRes, atsUsageRes] = await Promise.all([
          fetch(`/api/resume/${id}/share`, { cache: "no-store" }),
          fetch(`/api/resume/${id}/ats-scan`, { cache: "no-store" }),
        ]);
        if (shareRes.ok) {
          const shareBody = await shareRes.json();
          setIsPublicResume(!!shareBody.isPublic);
        }
        if (atsUsageRes.ok) {
          const atsBody = await atsUsageRes.json();
          setAtsUsage(atsBody.usage || null);
        }
      } catch (error: any) {
        console.error("Failed to load resume:", error);
        setLoadError(error?.message || "Could not load this resume");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResume();
  }, [id]);

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
        // fallback to legacy lock logic
      }
    };
    void loadAccess();
  }, []);

  const selectedTemplate = useMemo(
    () => TEMPLATE_CATALOG.find((t) => t.id === selectedTemplateId),
    [selectedTemplateId]
  );

  const handleSave = async () => {
    if (!resume || !content) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/resume/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: resume.title,
          content,
          templateId: selectedTemplateId,
        }),
      });

      const body = await response.json();
      if (!response.ok) {
        alert(body.error || body.message || "Failed to save resume");
        return;
      }

      setResume((prev) =>
        prev
          ? {
              ...prev,
              templateId: body.templateId || selectedTemplateId,
            }
          : prev
      );
      setSelectedTemplateId(body.templateId || selectedTemplateId);
      alert("Resume saved successfully!");
    } catch (error) {
      alert("Failed to save resume");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!resume) return;
    const exportNode = exportPreviewRef.current;
    if (!exportNode) {
      alert("Preview is not ready yet");
      return;
    }
    setIsExporting(true);

    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.removeAllRanges();
      }
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      if ("fonts" in document) {
        await document.fonts.ready;
      }

      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const sandbox = document.createElement("div");
      sandbox.style.position = "fixed";
      sandbox.style.left = "-10000px";
      sandbox.style.top = "0";
      sandbox.style.zIndex = "-1";
      sandbox.style.background = "#ffffff";
      sandbox.style.width = `${exportNode.scrollWidth}px`;
      sandbox.style.overflow = "hidden";

      const clonedNode = exportNode.cloneNode(true) as HTMLDivElement;
      clonedNode.setAttribute("data-template-id", selectedTemplateId);
      clonedNode.style.position = "static";
      clonedNode.style.left = "0";
      clonedNode.style.top = "0";
      clonedNode.style.opacity = "1";
      clonedNode.style.pointerEvents = "none";

      sandbox.appendChild(clonedNode);
      document.body.appendChild(sandbox);

      const baseCanvasOptions = {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: clonedNode.scrollWidth,
        windowHeight: clonedNode.scrollHeight,
        onclone: (clonedDoc: Document) => {
          clonedDoc.getSelection()?.removeAllRanges();
          const style = clonedDoc.createElement("style");
          style.textContent = `
            * { animation: none !important; transition: none !important; caret-color: transparent !important; }
            * , *::before, *::after {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            ::selection { background: transparent !important; color: inherit !important; }
            [data-template-id="tech-minimal"] span,
            [data-template-id="startup-modern"] span {
              line-height: 1.1 !important;
            }
            [data-template-id="tech-minimal"] section:nth-of-type(3) span {
              display: inline-block !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      };

      const isCanvasBlank = (target: HTMLCanvasElement) => {
        if (!target.width || !target.height) return true;
        const ctx = target.getContext("2d", { willReadFrequently: true });
        if (!ctx) return true;

        const sampleGrid = 12;
        const stepX = Math.max(1, Math.floor(target.width / sampleGrid));
        const stepY = Math.max(1, Math.floor(target.height / sampleGrid));

        for (let y = 0; y < target.height; y += stepY) {
          for (let x = 0; x < target.width; x += stepX) {
            const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
            const isTransparent = a === 0;
            const isWhite = r > 245 && g > 245 && b > 245;
            if (!isTransparent && !isWhite) {
              return false;
            }
          }
        }

        return true;
      };

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(clonedNode, {
          ...baseCanvasOptions,
          foreignObjectRendering: true,
        });
        if (isCanvasBlank(canvas)) {
          canvas = await html2canvas(clonedNode, {
            ...baseCanvasOptions,
            foreignObjectRendering: false,
          });
        }
      } catch {
        canvas = await html2canvas(clonedNode, {
          ...baseCanvasOptions,
          foreignObjectRendering: false,
        });
      }

      sandbox.remove();

      const pdf = new JsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pageWidth;
      const pageHeightPx = Math.floor(pageHeight * pxPerMm);

      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height - 1) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedHeight);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;

        const ctx = pageCanvas.getContext("2d");
        if (!ctx) throw new Error("Failed to render PDF page");

        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const pageData = pageCanvas.toDataURL("image/png");
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const pdfSliceHeight = (sliceHeight * pageWidth) / canvas.width;
        pdf.addImage(pageData, "PNG", 0, 0, pageWidth, pdfSliceHeight);

        renderedHeight += sliceHeight;
        pageIndex += 1;
      }

      const safeName = `${resume.title || "resume"}`
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim() || "resume";

      pdf.save(`${safeName}.pdf`);
    } catch (error: any) {
      alert(error?.message || "Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDOCX = async () => {
    if (!resume) return;
    setIsExportingDocx(true);
    try {
      const res = await fetch(`/api/resume/${id}/export-docx`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to export DOCX");
      }

      const blob = await res.blob();
      const fileName = `${resume.title || "resume"}`
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .trim() || "resume";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error?.message || "Failed to export DOCX");
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleShareResume = async () => {
    setIsSharing(true);
    try {
      let shareData: { isPublic: boolean; shareUrl: string } | null = null;
      const current = await fetch(`/api/resume/${id}/share`, { cache: "no-store" });
      if (current.ok) {
        shareData = await current.json();
      }

      if (!shareData?.isPublic) {
        const publishRes = await fetch(`/api/resume/${id}/share`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: true }),
        });
        const publishBody = await publishRes.json();
        if (!publishRes.ok) {
          throw new Error(publishBody.error || "Failed to publish resume");
        }
        shareData = publishBody;
      }

      setIsPublicResume(true);
      if (shareData?.shareUrl) {
        await navigator.clipboard.writeText(shareData.shareUrl);
        alert("Share link copied to clipboard.");
      } else {
        alert("Resume shared.");
      }
    } catch (error: any) {
      alert(error?.message || "Failed to share resume");
    } finally {
      setIsSharing(false);
    }
  };

  const addSkill = (type: "technical" | "soft") => {
    if (!content) return;
    const inputValue = type === "technical" ? technicalSkillInput : softSkillInput;
    const normalized = inputValue.trim();
    if (!normalized) return;

    const currentSkills = content.skills[type] || [];
    if (currentSkills.some((s) => s.toLowerCase() === normalized.toLowerCase())) return;

    setContent({
      ...content,
      skills: {
        ...content.skills,
        [type]: [...currentSkills, normalized],
      },
    });

    if (type === "technical") {
      setTechnicalSkillInput("");
    } else {
      setSoftSkillInput("");
    }
  };

  const removeSkill = (type: "technical" | "soft", index: number) => {
    if (!content) return;
    setContent({
      ...content,
      skills: {
        ...content.skills,
        [type]: content.skills[type].filter((_, i) => i !== index),
      },
    });
  };

  const handleRunAtsScan = async () => {
    if (!content) return;

    setIsScanningAts(true);
    try {
      const response = await fetch(`/api/resume/${id}/ats-scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const body = await response.json().catch(() => ({}));
      if (response.status === 403) {
        setAtsUsage(body.usage || null);
        setUpgradeModalMode("hard");
        setShowUpgradeModal(true);
        return;
      }
      if (!response.ok) {
        throw new Error(body.error || body.message || "Failed to run ATS scan");
      }

      setAtsResult(body.result || null);
      setAtsUsage(body.usage || null);

      if (userPlan === "free" && body.usage?.softUpsell) {
        setUpgradeModalMode("soft");
        setShowUpgradeModal(true);
      }
    } catch (error: any) {
      alert(error?.message || "Failed to run ATS scan");
    } finally {
      setIsScanningAts(false);
    }
  };

  const jumpToArea = (area: AtsArea) => {
    if (area === "summary") {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      summaryRef.current?.focus();
      return;
    }
    if (area === "experience") {
      experienceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (area === "skills") {
      skillsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  };

  const highlightSummary = !!atsResult?.suggestions.some((s) => s.area === "summary");
  const highlightExperience = !!atsResult?.suggestions.some((s) => s.area === "experience");
  const highlightSkills = !!atsResult?.suggestions.some((s) => s.area === "skills");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (loadError || !content || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center bg-white border border-gray-200 rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Resume not available</h1>
          <p className="text-gray-600 mb-6">{loadError || "The requested resume does not exist."}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppTopNav authMode="auto" />

      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Back to Dashboard</span>
            </Link>

            <div className="flex items-center space-x-3">
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-green-700 font-medium">
                  ATS Score: <span className="text-xl font-bold">{atsResult?.score ?? resume.atsScore}</span>/100
                </span>
              </div>

              <button
                onClick={handleRunAtsScan}
                disabled={isScanningAts}
                className="border border-emerald-300 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isScanningAts
                  ? "Scanning..."
                  : userPlan === "free" && atsUsage?.limit
                  ? `Run ATS Scan (${Math.max(0, atsUsage.remaining)}/${atsUsage.limit})`
                  : "Run ATS Scan"}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={handleShareResume}
                disabled={isSharing}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Share2 className="mr-2 h-4 w-4" />
                {isSharing ? "Sharing..." : isPublicResume ? "Copy Share Link" : "Share"}
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                onClick={handleExportDOCX}
                disabled={isExportingDocx}
                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExportingDocx ? "Exporting..." : "Export DOCX"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            href="/cover-letter"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            Generate Cover Letter
          </Link>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-900">ATS Insights</h3>
              </div>
              <div className="space-y-3 text-sm">
                {(atsResult?.suggestions || []).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToArea(item.area)}
                    className="w-full text-left rounded-lg border border-transparent hover:border-blue-200 hover:bg-white/60 p-2 transition"
                  >
                    <div className="flex items-start">
                      <span
                        className={`mr-2 ${
                          item.severity === "high"
                            ? "text-red-600"
                            : item.severity === "medium"
                            ? "text-yellow-700"
                            : "text-green-600"
                        }`}
                      >
                        {item.severity === "high" ? "!" : item.severity === "medium" ? "→" : "✓"}
                      </span>
                      <span className="text-gray-800">
                        <span className="font-medium">{item.message}</span>{" "}
                        <span className="text-gray-600">{item.action}</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Resume</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                >
                  {TEMPLATE_CATALOG.map((template) => {
                    const isLocked = allowedTemplateIds
                      ? !allowedTemplateIds.has(template.id)
                      : userPlan === 'free' && template.isPremium;
                    return (
                      <option key={template.id} value={template.id} disabled={isLocked}>
                        {template.name}{isLocked ? ' (Pro)' : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedTemplate && ((allowedTemplateIds && !allowedTemplateIds.has(selectedTemplate.id)) || (!allowedTemplateIds && selectedTemplate.isPremium && userPlan === 'free')) && (
                  <p className="text-xs text-purple-700 mt-2">
                    This template is not available in your current plan.
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                <textarea
                  ref={summaryRef}
                  value={content.professionalSummary}
                  onChange={(e) => setContent({ ...content, professionalSummary: e.target.value })}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm ${
                    highlightSummary ? "border-amber-400 bg-amber-50/40" : "border-gray-300"
                  }`}
                />
              </div>

              <div
                ref={experienceRef}
                className={`mb-6 rounded-lg p-3 ${
                  highlightExperience ? "border border-amber-400 bg-amber-50/30" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">Experience</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setContent({
                        ...content,
                        experiences: [
                          ...content.experiences,
                          {
                            title: "",
                            company: "",
                            location: "",
                            startDate: "",
                            endDate: "",
                            current: false,
                            optimizedBullets: [""],
                            keywordsUsed: [],
                          },
                        ],
                      });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add Experience
                  </button>
                </div>
                {content.experiences.map((exp, expIndex) => (
                  <div key={expIndex} className="mb-4 pb-4 border-b last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-gray-500 font-medium">Role {expIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newExperiences = content.experiences.filter((_, i) => i !== expIndex);
                          setContent({ ...content, experiences: newExperiences });
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        value={exp.title}
                        onChange={(e) => {
                          const newExperiences = [...content.experiences];
                          newExperiences[expIndex] = { ...newExperiences[expIndex], title: e.target.value };
                          setContent({ ...content, experiences: newExperiences });
                        }}
                        placeholder="Job Title"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <input
                        value={exp.company}
                        onChange={(e) => {
                          const newExperiences = [...content.experiences];
                          newExperiences[expIndex] = { ...newExperiences[expIndex], company: e.target.value };
                          setContent({ ...content, experiences: newExperiences });
                        }}
                        placeholder="Company"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div className="mb-2">
                      <input
                        value={exp.location || ""}
                        onChange={(e) => {
                          const newExperiences = [...content.experiences];
                          newExperiences[expIndex] = { ...newExperiences[expIndex], location: e.target.value };
                          setContent({ ...content, experiences: newExperiences });
                        }}
                        placeholder="Location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input
                        value={exp.startDate}
                        onChange={(e) => {
                          const newExperiences = [...content.experiences];
                          newExperiences[expIndex] = { ...newExperiences[expIndex], startDate: e.target.value };
                          setContent({ ...content, experiences: newExperiences });
                        }}
                        placeholder="Start Date"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <input
                        value={exp.current ? "Present" : (exp.endDate || "")}
                        onChange={(e) => {
                          const newExperiences = [...content.experiences];
                          newExperiences[expIndex] = { ...newExperiences[expIndex], endDate: e.target.value, current: false };
                          setContent({ ...content, experiences: newExperiences });
                        }}
                        placeholder="End Date"
                        disabled={exp.current}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => {
                            const newExperiences = [...content.experiences];
                            newExperiences[expIndex] = { ...newExperiences[expIndex], current: e.target.checked, endDate: e.target.checked ? "" : newExperiences[expIndex].endDate };
                            setContent({ ...content, experiences: newExperiences });
                          }}
                          className="rounded"
                        />
                        Currently working here
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Bullets</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newExperiences = [...content.experiences];
                            newExperiences[expIndex] = {
                              ...newExperiences[expIndex],
                              optimizedBullets: [...newExperiences[expIndex].optimizedBullets, ""],
                            };
                            setContent({ ...content, experiences: newExperiences });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Add Bullet
                        </button>
                      </div>
                      {exp.optimizedBullets.map((bullet, bulletIndex) => (
                        <div key={bulletIndex} className="flex gap-1">
                          <textarea
                            value={bullet}
                            onChange={(e) => {
                              const newExperiences = [...content.experiences];
                              newExperiences[expIndex].optimizedBullets[bulletIndex] = e.target.value;
                              setContent({ ...content, experiences: newExperiences });
                            }}
                            rows={2}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newExperiences = [...content.experiences];
                              newExperiences[expIndex] = {
                                ...newExperiences[expIndex],
                                optimizedBullets: newExperiences[expIndex].optimizedBullets.filter((_, i) => i !== bulletIndex),
                              };
                              setContent({ ...content, experiences: newExperiences });
                            }}
                            className="text-gray-400 hover:text-red-500 self-start mt-2"
                            aria-label="Remove bullet"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div
                ref={skillsRef}
                className={`rounded-lg p-3 ${
                  highlightSkills ? "border border-amber-400 bg-amber-50/30" : ""
                }`}
              >
                <h3 className="text-sm font-medium text-gray-900 mb-3">Skills</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Technical</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={technicalSkillInput}
                        onChange={(e) => setTechnicalSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill("technical");
                          }
                        }}
                        placeholder="Add technical skill"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill("technical")}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {content.skills.technical.map((skill, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill("technical", index)}
                            className="text-blue-700 hover:text-blue-900"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Soft Skills</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        value={softSkillInput}
                        onChange={(e) => setSoftSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSkill("soft");
                          }
                        }}
                        placeholder="Add soft skill"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill("soft")}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {content.skills.soft.map((skill, index) => (
                        <span key={index} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill("soft", index)}
                            className="text-green-700 hover:text-green-900"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Preview</h2>
                <Eye className="h-5 w-5 text-gray-400" />
              </div>

              <TemplateRenderer templateId={selectedTemplateId} data={mapToLovableResumeData(content)} />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0">
        <div ref={exportPreviewRef} className="w-[794px] min-h-[1123px] bg-white overflow-hidden">
          <TemplateRenderer templateId={selectedTemplateId} data={mapToLovableResumeData(content)} />
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 px-6 py-8 text-center">
              <Sparkles className="h-10 w-10 text-white mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white">
                {upgradeModalMode === "hard" ? "ATS Scan Limit Reached" : "ATS Scan Usage"}
              </h3>
              <p className="text-blue-100 mt-2 text-sm">
                {upgradeModalMode === "hard"
                  ? `You've used ${atsUsage?.used ?? 0} of ${atsUsage?.limit ?? 0} free ATS scans this month.`
                  : `You've used ${atsUsage?.used ?? 0} of ${atsUsage?.limit ?? 0} free ATS scans this month.`}
              </p>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-600 text-sm mb-4">
                {upgradeModalMode === "hard" ? (
                  <>
                    Upgrade to <span className="font-semibold text-gray-900">Pro</span> to continue scanning with
                    unlimited ATS checks, premium templates, cover letters, and more.
                  </>
                ) : (
                  <>
                    You still have <span className="font-semibold text-gray-900">{Math.max(0, atsUsage?.remaining ?? 0)}</span>{" "}
                    free scans left this month. Upgrade to <span className="font-semibold text-gray-900">Pro</span> for
                    unlimited ATS scans.
                  </>
                )}
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold">&#10003;</span> Unlimited ATS scans
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold">&#10003;</span> 20+ premium templates
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold">&#10003;</span> Unlimited resumes per month
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500 font-bold">&#10003;</span> Cover letter generator
                </li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Maybe Later
                </button>
                <a
                  href="/pricing"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold text-center hover:from-blue-700 hover:to-purple-700 transition shadow-sm"
                >
                  Upgrade Now
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
