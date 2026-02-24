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
  jobTitle?: string | null;
  jobDescription?: string | null;
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

type PremiumAiFeature =
  | "resume_rewrite_pro"
  | "job_match_scoring"
  | "interview_simulation"
  | "salary_negotiation_scripts"
  | "advanced_ats_strategy";

type PremiumAiUsage = {
  used: number;
  limit: number;
  remaining: number;
};

type NoticeTone = "info" | "success" | "error";

function mapToLovableResumeData(content: ResumeContent): ResumeData {
  const normalizedLanguages = (content.languages || [])
    .map((lang) => ({
      name:
        typeof lang === "string"
          ? lang
          : (lang as any)?.name || (lang as any)?.language || "",
      level:
        typeof lang === "string"
          ? ""
          : (lang as any)?.level || (lang as any)?.proficiency || "",
    }))
    .filter((lang) => lang.name);

  const projectExperiences = (content.projects || []).map((project) => {
    const bullets = [
      project.description || "",
      ...((project.achievements || []).filter(Boolean) as string[]),
      project.technologies?.length
        ? `Technologies: ${project.technologies.join(", ")}`
        : "",
      project.url ? `Link: ${project.url}` : "",
    ].filter(Boolean);

    return {
      title: project.name || "Project",
      company: project.role || "Independent Project",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      optimizedBullets: bullets.length ? bullets : ["Project details available upon request."],
      keywordsUsed: project.technologies || [],
    };
  });

  const certificationEducation = (content.certifications || []).map((cert) => ({
    degree: cert.name || "Certification",
    institution: cert.issuer || "Certification Body",
    location: cert.url || "",
    graduationDate: cert.issueDate || "",
    gpa: cert.credentialId ? `ID: ${cert.credentialId}` : "",
  }));


  return {
    personalInfo: {
      ...content.personalInfo,
      linkedin: content.personalInfo.linkedin,
      portfolio: content.personalInfo.portfolio,
    },
    professionalSummary: content.professionalSummary,
    experiences: [...content.experiences, ...projectExperiences].map((exp) => ({
      ...exp,
      keywordsUsed: exp.keywordsUsed || [],
    })),
    education: [...content.education, ...certificationEducation],
    certifications: content.certifications || [],
    projects: content.projects || [],
    languages: normalizedLanguages,
    skills: {
      technical: content.skills.technical || [],
      soft: content.skills.soft || [],
    },
    keywords: content.keywords,
  };
}

function normalizeResumeContent(content: any): ResumeContent {
  return {
    personalInfo: {
      name: content?.personalInfo?.name || "",
      email: content?.personalInfo?.email || "",
      phone: content?.personalInfo?.phone || "",
      location: content?.personalInfo?.location || "",
      linkedin: content?.personalInfo?.linkedin || "",
      portfolio: content?.personalInfo?.portfolio || "",
      headline: content?.personalInfo?.headline || "",
    },
    professionalSummary: content?.professionalSummary || "",
    experiences: Array.isArray(content?.experiences)
      ? content.experiences.map((exp: any) => ({
          title: exp?.title || "",
          company: exp?.company || "",
          location: exp?.location || "",
          startDate: exp?.startDate || "",
          endDate: exp?.endDate || "",
          current: !!exp?.current,
          optimizedBullets: Array.isArray(exp?.optimizedBullets) ? exp.optimizedBullets : [""],
          keywordsUsed: Array.isArray(exp?.keywordsUsed) ? exp.keywordsUsed : [],
        }))
      : [],
    education: Array.isArray(content?.education)
      ? content.education.map((edu: any) => ({
          degree: edu?.degree || "",
          institution: edu?.institution || "",
          location: edu?.location || "",
          graduationDate: edu?.graduationDate || "",
          gpa: edu?.gpa || "",
        }))
      : [],
    certifications: Array.isArray(content?.certifications)
      ? content.certifications.map((cert: any) => ({
          name: cert?.name || "",
          issuer: cert?.issuer || "",
          issueDate: cert?.issueDate || "",
          credentialId: cert?.credentialId || "",
          url: cert?.url || "",
        }))
      : [],
    projects: Array.isArray(content?.projects)
      ? content.projects.map((project: any) => ({
          name: project?.name || "",
          role: project?.role || "",
          url: project?.url || "",
          description: project?.description || "",
          achievements: Array.isArray(project?.achievements) ? project.achievements : [],
          technologies: Array.isArray(project?.technologies) ? project.technologies : [],
        }))
      : [],
    languages: Array.isArray(content?.languages)
      ? content.languages.map((lang: any) => ({
          name: typeof lang === "string" ? lang : lang?.name || lang?.language || "",
          level: typeof lang === "string" ? "" : lang?.level || lang?.proficiency || "",
        }))
      : [],
    skills: {
      technical: Array.isArray(content?.skills?.technical) ? content.skills.technical : [],
      soft: Array.isArray(content?.skills?.soft) ? content.skills.soft : [],
    },
    keywords: Array.isArray(content?.keywords) ? content.keywords : [],
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
  const [premiumAiLoading, setPremiumAiLoading] = useState(false);
  const [premiumAiResult, setPremiumAiResult] = useState<any>(null);
  const [premiumAiFeature, setPremiumAiFeature] = useState<PremiumAiFeature>("job_match_scoring");
  const [premiumAiContextNote, setPremiumAiContextNote] = useState("");
  const [premiumAiUsage, setPremiumAiUsage] = useState<PremiumAiUsage | null>(null);
  const [isApplyingPremiumAi, setIsApplyingPremiumAi] = useState(false);
  const [keepOriginalOnApply, setKeepOriginalOnApply] = useState(true);
  const [originalResumeBackup, setOriginalResumeBackup] = useState<ResumeContent | null>(null);
  const [noticeModal, setNoticeModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    tone: NoticeTone;
    actionLabel?: string;
    actionHref?: string;
  }>({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalMode, setUpgradeModalMode] = useState<"soft" | "hard">("soft");
  const summaryRef = useRef<HTMLTextAreaElement | null>(null);
  const experienceRef = useRef<HTMLDivElement | null>(null);
  const skillsRef = useRef<HTMLDivElement | null>(null);

  const showNotice = (
    tone: NoticeTone,
    title: string,
    message: string,
    action?: { label: string; href: string }
  ) => {
    setNoticeModal({
      open: true,
      tone,
      title,
      message,
      actionLabel: action?.label,
      actionHref: action?.href,
    });
  };

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
        const normalized = normalizeResumeContent(data.content);
        setContent(normalized);
        setOriginalResumeBackup(null);
        setSelectedTemplateId(data.templateId || "modern-professional");
        setUserPlan(data.user?.planType || "free");
        setAtsResult(runAtsScan(normalized));

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

  const persistResume = async (opts?: { showSuccessToast?: boolean }) => {
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
        throw new Error(body.error || body.message || "Failed to save resume");
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
      if (opts?.showSuccessToast) {
        showNotice("success", "Saved", "Resume saved successfully.");
      }
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      await persistResume({ showSuccessToast: true });
    } catch (error: any) {
      showNotice("error", "Save Failed", error?.message || "Failed to save resume");
    }
  };

  const handleExportPDF = async () => {
    if (!resume) return;
    setIsExporting(true);

    try {
      await persistResume();

      const res = await fetch(`/api/resume/${id}/export-styled-pdf`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to export PDF");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const headerFileName =
        disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ||
        disposition.match(/filename="([^"]+)"/i)?.[1] ||
        disposition.match(/filename=([^;]+)/i)?.[1] ||
        "";
      const fileName = headerFileName
        ? decodeURIComponent(headerFileName).replace(/^["']|["']$/g, "")
        : `Resume - ${content?.personalInfo?.name || resume.title || "Resume"}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      showNotice("error", "Export Failed", error?.message || "Failed to export PDF");
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
      const disposition = res.headers.get("content-disposition") || "";
      const headerFileName =
        disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ||
        disposition.match(/filename="([^"]+)"/i)?.[1] ||
        disposition.match(/filename=([^;]+)/i)?.[1] ||
        "";
      const fileName = headerFileName
        ? decodeURIComponent(headerFileName).replace(/^["']|["']$/g, "")
        : `Resume - ${content?.personalInfo?.name || resume.title || "Resume"}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      showNotice("error", "Export Failed", error?.message || "Failed to export DOCX");
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
        showNotice("success", "Share Link", "Share link copied to clipboard.");
      } else {
        showNotice("success", "Shared", "Resume shared.");
      }
    } catch (error: any) {
      showNotice("error", "Share Failed", error?.message || "Failed to share resume");
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
      showNotice("error", "ATS Scan Failed", error?.message || "Failed to run ATS scan");
    } finally {
      setIsScanningAts(false);
    }
  };

  const handleRunPremiumAi = async (feature: PremiumAiFeature) => {
    if (!content) return;

    setPremiumAiFeature(feature);
    setPremiumAiLoading(true);
    try {
      const response = await fetch(`/api/resume/${id}/premium-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature,
          content,
          jobDescription: resume?.jobDescription || "",
          targetRole: resume?.jobTitle || content.personalInfo.headline || "",
          contextNote: premiumAiContextNote,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 403) {
        showNotice(
          "info",
          "Premium Required",
          body?.message || "This feature requires Premium plan.",
          { label: "Upgrade Now", href: "/pricing" }
        );
        return;
      }
      if (!response.ok) {
        throw new Error(body.error || body.message || "Failed to run Premium AI");
      }
      setPremiumAiResult(body.result || null);
      setPremiumAiUsage(body.usage || null);
    } catch (error: any) {
      showNotice("error", "Premium AI Failed", error?.message || "Failed to run Premium AI");
    } finally {
      setPremiumAiLoading(false);
    }
  };

  const handleApplyPremiumAiResult = async () => {
    if (!premiumAiResult) return;
    if (premiumAiFeature !== "resume_rewrite_pro" && premiumAiFeature !== "advanced_ats_strategy") {
      showNotice(
        "info",
        "Apply Not Available",
        "Apply is currently available for Resume Rewrite Pro and Advanced ATS Strategy."
      );
      return;
    }
    setIsApplyingPremiumAi(true);
    try {
      if (keepOriginalOnApply && content && !originalResumeBackup) {
        setOriginalResumeBackup(JSON.parse(JSON.stringify(content)) as ResumeContent);
      }
      const response = await fetch(`/api/resume/${id}/premium-ai/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature: premiumAiFeature,
          result: premiumAiResult,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || body.message || "Failed to apply AI result");
      }
      const normalized = normalizeResumeContent(body.content);
      setContent(normalized);
      setAtsResult(runAtsScan(normalized));
      showNotice("success", "Applied", "Premium AI changes applied to resume.");
    } catch (error: any) {
      showNotice("error", "Apply Failed", error?.message || "Failed to apply Premium AI result");
    } finally {
      setIsApplyingPremiumAi(false);
    }
  };

  const handleRestoreOriginalResume = () => {
    if (!originalResumeBackup) return;
    const restored = JSON.parse(JSON.stringify(originalResumeBackup)) as ResumeContent;
    setContent(restored);
    setAtsResult(runAtsScan(restored));
    setOriginalResumeBackup(null);
    showNotice("success", "Original Restored", "Your original resume content has been restored.");
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
              {/* <button
                onClick={handleExportDOCX}
                disabled={isExportingDocx}
                className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExportingDocx ? "Exporting..." : "Export DOCX"}
              </button> */}
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
              {atsResult?.subscores ? (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Semantic</p>
                    <p className="text-sm font-semibold text-gray-900">{atsResult.subscores.semantic}/100</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Quality</p>
                    <p className="text-sm font-semibold text-gray-900">{atsResult.subscores.quality}/100</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Technical</p>
                    <p className="text-sm font-semibold text-gray-900">{atsResult.subscores.technical}/100</p>
                  </div>
                </div>
              ) : null}
              {atsResult?.benchmark ? (
                <div
                  className={`mb-4 rounded-lg border px-3 py-2 text-xs ${
                    atsResult.benchmark.status === "on_track"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  Target benchmark ({atsResult.benchmark.seniority.toUpperCase()}): {atsResult.benchmark.target} ·{" "}
                  {atsResult.benchmark.status === "on_track" ? "On track" : "Below target"}
                </div>
              ) : null}
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
              {atsResult?.gaps?.length ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Top Vacancy Gaps
                  </p>
                  {atsResult.gaps.slice(0, 3).map((gap) => (
                    <div key={gap.id} className="rounded-lg border border-orange-200 bg-orange-50 p-2">
                      <p className="text-xs font-semibold text-orange-900">
                        {gap.keyword} ({gap.area})
                      </p>
                      <p className="text-xs text-orange-800">{gap.insertionHint}</p>
                      {gap.suggestedBullet ? (
                        <p className="mt-1 text-xs text-orange-900">
                          Example: <span className="italic">{gap.suggestedBullet}</span>
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Premium AI Studio</h3>
                {userPlan === "premium" ? (
                  <span className="rounded-full px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                    Premium Enabled
                  </span>
                ) : (
                  <Link
                    href="/pricing"
                    className="rounded-full px-2 py-1 text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition"
                  >
                    Premium Required
                  </Link>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                AI Resume Rewrite Pro, Job Match Scoring, Interview Simulation, Salary Negotiation Scripts, and advanced ATS strategy.
              </p>

              <textarea
                value={premiumAiContextNote}
                onChange={(e) => setPremiumAiContextNote(e.target.value)}
                rows={2}
                placeholder="Optional context (role level, compensation goal, interview stage...)"
                className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleRunPremiumAi("resume_rewrite_pro")}
                  disabled={premiumAiLoading || userPlan !== "premium"}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  AI Resume Rewrite Pro
                </button>
                <button
                  onClick={() => handleRunPremiumAi("job_match_scoring")}
                  disabled={premiumAiLoading || userPlan !== "premium"}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  AI Job Match Scoring
                </button>
                <button
                  onClick={() => handleRunPremiumAi("interview_simulation")}
                  disabled={premiumAiLoading || userPlan !== "premium"}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  AI Interview Simulation
                </button>
                <button
                  onClick={() => handleRunPremiumAi("salary_negotiation_scripts")}
                  disabled={premiumAiLoading || userPlan !== "premium"}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  AI Salary Negotiation Scripts
                </button>
                <button
                  onClick={() => handleRunPremiumAi("advanced_ats_strategy")}
                  disabled={premiumAiLoading || userPlan !== "premium"}
                  className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Advanced ATS Strategy Recommendations
                </button>
              </div>

              {premiumAiLoading ? (
                <p className="text-sm text-blue-700">Running {premiumAiFeature.replaceAll("_", " ")}...</p>
              ) : null}
              {premiumAiUsage ? (
                <p className="text-xs text-gray-600 mb-2">
                  Usage this month: {premiumAiUsage.used}/{premiumAiUsage.limit} · Remaining {premiumAiUsage.remaining}
                </p>
              ) : null}
              {userPlan !== "premium" ? (
                <div className="mb-3">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
                  >
                    Upgrade to Premium
                  </Link>
                </div>
              ) : null}
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={keepOriginalOnApply}
                    onChange={(e) => setKeepOriginalOnApply(e.target.checked)}
                    className="h-4 w-4 accent-blue-600"
                  />
                  Keep original resume backup when applying AI changes
                </label>
                {originalResumeBackup ? (
                  <button
                    type="button"
                    onClick={handleRestoreOriginalResume}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                  >
                    Restore Original Resume
                  </button>
                ) : null}
              </div>

              {premiumAiResult ? (
                <>
                  {(premiumAiFeature === "resume_rewrite_pro" ||
                    premiumAiFeature === "advanced_ats_strategy") && (
                    <button
                      onClick={handleApplyPremiumAiResult}
                      disabled={isApplyingPremiumAi}
                      className="mb-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {isApplyingPremiumAi ? "Applying..." : "Apply to Resume"}
                    </button>
                  )}
                  <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
                    {JSON.stringify(premiumAiResult, null, 2)}
                  </pre>
                </>
              ) : null}
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

              <div className="mb-6 rounded-lg border border-gray-200 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Education</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        education: [
                          ...(content.education || []),
                          { degree: "", institution: "", location: "", graduationDate: "", gpa: "" },
                        ],
                      })
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add Education
                  </button>
                </div>
                <div className="space-y-3">
                  {(content.education || []).map((edu, eduIndex) => (
                    <div key={eduIndex} className="rounded-md border border-gray-200 p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-xs font-medium text-gray-500">Entry {eduIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setContent({
                              ...content,
                              education: (content.education || []).filter((_, i) => i !== eduIndex),
                            })
                          }
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={edu.degree}
                          onChange={(e) => {
                            const next = [...(content.education || [])];
                            next[eduIndex] = { ...next[eduIndex], degree: e.target.value };
                            setContent({ ...content, education: next });
                          }}
                          placeholder="Degree"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={edu.institution}
                          onChange={(e) => {
                            const next = [...(content.education || [])];
                            next[eduIndex] = { ...next[eduIndex], institution: e.target.value };
                            setContent({ ...content, education: next });
                          }}
                          placeholder="Institution"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={edu.location || ""}
                          onChange={(e) => {
                            const next = [...(content.education || [])];
                            next[eduIndex] = { ...next[eduIndex], location: e.target.value };
                            setContent({ ...content, education: next });
                          }}
                          placeholder="Location"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={edu.graduationDate}
                          onChange={(e) => {
                            const next = [...(content.education || [])];
                            next[eduIndex] = { ...next[eduIndex], graduationDate: e.target.value };
                            setContent({ ...content, education: next });
                          }}
                          placeholder="Graduation Date"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={edu.gpa || ""}
                          onChange={(e) => {
                            const next = [...(content.education || [])];
                            next[eduIndex] = { ...next[eduIndex], gpa: e.target.value };
                            setContent({ ...content, education: next });
                          }}
                          placeholder="GPA (optional)"
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  {(content.education || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No education entries yet.</p>
                  ) : null}
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-gray-200 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Certifications</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        certifications: [
                          ...(content.certifications || []),
                          { name: "", issuer: "", issueDate: "", credentialId: "", url: "" },
                        ],
                      })
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add Certification
                  </button>
                </div>
                <div className="space-y-3">
                  {(content.certifications || []).map((cert, certIndex) => (
                    <div key={certIndex} className="rounded-md border border-gray-200 p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-xs font-medium text-gray-500">Certification {certIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setContent({
                              ...content,
                              certifications: (content.certifications || []).filter((_, i) => i !== certIndex),
                            })
                          }
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={cert.name || ""}
                          onChange={(e) => {
                            const next = [...(content.certifications || [])];
                            next[certIndex] = { ...next[certIndex], name: e.target.value };
                            setContent({ ...content, certifications: next });
                          }}
                          placeholder="Certification Name"
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={cert.issuer || ""}
                          onChange={(e) => {
                            const next = [...(content.certifications || [])];
                            next[certIndex] = { ...next[certIndex], issuer: e.target.value };
                            setContent({ ...content, certifications: next });
                          }}
                          placeholder="Issuer"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={cert.issueDate || ""}
                          onChange={(e) => {
                            const next = [...(content.certifications || [])];
                            next[certIndex] = { ...next[certIndex], issueDate: e.target.value };
                            setContent({ ...content, certifications: next });
                          }}
                          placeholder="Issue Date"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={cert.credentialId || ""}
                          onChange={(e) => {
                            const next = [...(content.certifications || [])];
                            next[certIndex] = { ...next[certIndex], credentialId: e.target.value };
                            setContent({ ...content, certifications: next });
                          }}
                          placeholder="Credential ID (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={cert.url || ""}
                          onChange={(e) => {
                            const next = [...(content.certifications || [])];
                            next[certIndex] = { ...next[certIndex], url: e.target.value };
                            setContent({ ...content, certifications: next });
                          }}
                          placeholder="Verification URL (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  {(content.certifications || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No certifications yet.</p>
                  ) : null}
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-gray-200 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Projects</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        projects: [
                          ...(content.projects || []),
                          { name: "", role: "", url: "", description: "", achievements: [], technologies: [] },
                        ],
                      })
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add Project
                  </button>
                </div>
                <div className="space-y-3">
                  {(content.projects || []).map((project, projectIndex) => (
                    <div key={projectIndex} className="rounded-md border border-gray-200 p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <span className="text-xs font-medium text-gray-500">Project {projectIndex + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setContent({
                              ...content,
                              projects: (content.projects || []).filter((_, i) => i !== projectIndex),
                            })
                          }
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          value={project.name || ""}
                          onChange={(e) => {
                            const next = [...(content.projects || [])];
                            next[projectIndex] = { ...next[projectIndex], name: e.target.value };
                            setContent({ ...content, projects: next });
                          }}
                          placeholder="Project Name"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={project.role || ""}
                          onChange={(e) => {
                            const next = [...(content.projects || [])];
                            next[projectIndex] = { ...next[projectIndex], role: e.target.value };
                            setContent({ ...content, projects: next });
                          }}
                          placeholder="Role"
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={project.url || ""}
                          onChange={(e) => {
                            const next = [...(content.projects || [])];
                            next[projectIndex] = { ...next[projectIndex], url: e.target.value };
                            setContent({ ...content, projects: next });
                          }}
                          placeholder="Project URL (optional)"
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <textarea
                          value={project.description || ""}
                          onChange={(e) => {
                            const next = [...(content.projects || [])];
                            next[projectIndex] = { ...next[projectIndex], description: e.target.value };
                            setContent({ ...content, projects: next });
                          }}
                          rows={2}
                          placeholder="Project description and impact"
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <input
                          value={(project.technologies || []).join(", ")}
                          onChange={(e) => {
                            const next = [...(content.projects || [])];
                            next[projectIndex] = {
                              ...next[projectIndex],
                              technologies: e.target.value
                                .split(",")
                                .map((v) => v.trim())
                                .filter(Boolean),
                            };
                            setContent({ ...content, projects: next });
                          }}
                          placeholder="Technologies (comma separated)"
                          className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  {(content.projects || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No projects yet.</p>
                  ) : null}
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-gray-200 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">Languages</h3>
                  <button
                    type="button"
                    onClick={() =>
                      setContent({
                        ...content,
                        languages: [...(content.languages || []), { name: "", level: "" }],
                      })
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    + Add Language
                  </button>
                </div>
                <div className="space-y-2">
                  {(content.languages || []).map((language, languageIndex) => (
                    <div key={languageIndex} className="grid grid-cols-2 gap-2">
                      <input
                        value={language.name || ""}
                        onChange={(e) => {
                          const next = [...(content.languages || [])];
                          next[languageIndex] = { ...next[languageIndex], name: e.target.value };
                          setContent({ ...content, languages: next });
                        }}
                        placeholder="Language"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <input
                          value={language.level || ""}
                          onChange={(e) => {
                            const next = [...(content.languages || [])];
                            next[languageIndex] = { ...next[languageIndex], level: e.target.value };
                            setContent({ ...content, languages: next });
                          }}
                          placeholder="Level (e.g. C1, Native)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setContent({
                              ...content,
                              languages: (content.languages || []).filter((_, i) => i !== languageIndex),
                            })
                          }
                          className="px-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {(content.languages || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No languages added yet.</p>
                  ) : null}
                </div>
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
      {noticeModal.open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-gray-200 mx-4 overflow-hidden">
            <div
              className={`px-5 py-4 ${
                noticeModal.tone === "success"
                  ? "bg-emerald-50 border-b border-emerald-100"
                  : noticeModal.tone === "error"
                  ? "bg-rose-50 border-b border-rose-100"
                  : "bg-blue-50 border-b border-blue-100"
              }`}
            >
              <h4
                className={`text-sm font-semibold ${
                  noticeModal.tone === "success"
                    ? "text-emerald-800"
                    : noticeModal.tone === "error"
                    ? "text-rose-800"
                    : "text-blue-800"
                }`}
              >
                {noticeModal.title}
              </h4>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{noticeModal.message}</p>
              <div className="mt-4 flex justify-end">
                {noticeModal.actionHref && noticeModal.actionLabel ? (
                  <Link
                    href={noticeModal.actionHref}
                    className="mr-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {noticeModal.actionLabel}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={() => setNoticeModal((prev) => ({ ...prev, open: false }))}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
