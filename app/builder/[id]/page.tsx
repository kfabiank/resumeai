"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Save, Sparkles, Share2, Loader2, X } from "lucide-react";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import type { ResumeData } from "@/types/resume";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";

interface ResumeContent {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    headline?: string;
  };
  professionalSummary: string;
  experiences: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    optimizedBullets: string[];
    keywordsUsed: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  keywords: string[];
}

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
  const [technicalSkillInput, setTechnicalSkillInput] = useState("");
  const [softSkillInput, setSoftSkillInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportPreviewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resume/${id}`);
        if (!response.ok) throw new Error("Resume not found");
        const data: ResumeApiResponse = await response.json();
        setResume(data);
        setContent(data.content);
        setSelectedTemplateId(data.templateId || "modern-professional");
        setUserPlan(data.user?.planType || "free");
      } catch (error) {
        console.error("Failed to load resume:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchResume();
  }, [id]);

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
    if (!exportPreviewRef.current) {
      alert("Preview is not ready yet");
      return;
    }
    setIsExporting(true);

    try {
      const [{ default: html2canvas }, { default: JsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(exportPreviewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: exportPreviewRef.current.scrollWidth,
        windowHeight: exportPreviewRef.current.scrollHeight,
      });

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

  if (isLoading || !content || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Back to Dashboard</span>
            </Link>

            <div className="flex items-center space-x-3">
              <div className="bg-green-100 px-4 py-2 rounded-lg">
                <span className="text-sm text-green-700 font-medium">
                  ATS Score: <span className="text-xl font-bold">{resume.atsScore}</span>/100
                </span>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save"}
              </button>

              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition inline-flex items-center text-sm font-medium">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center text-sm font-medium disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
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
                    const isLocked = userPlan === 'free' && template.isPremium;
                    return (
                      <option key={template.id} value={template.id} disabled={isLocked}>
                        {template.name}{isLocked ? ' (Pro)' : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedTemplate?.isPremium && userPlan === 'free' && (
                  <p className="text-xs text-purple-700 mt-2">
                    This is a premium template. Upgrade your plan to save with this template.
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Summary</label>
                <textarea
                  value={content.professionalSummary}
                  onChange={(e) => setContent({ ...content, professionalSummary: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Experience</h3>
                {content.experiences.map((exp, expIndex) => (
                  <div key={expIndex} className="mb-4 pb-4 border-b last:border-0">
                    <div className="font-medium text-gray-900 mb-2">{exp.title} at {exp.company}</div>
                    <div className="space-y-2">
                      {exp.optimizedBullets.map((bullet, bulletIndex) => (
                        <textarea
                          key={bulletIndex}
                          value={bullet}
                          onChange={(e) => {
                            const newExperiences = [...content.experiences];
                            newExperiences[expIndex].optimizedBullets[bulletIndex] = e.target.value;
                            setContent({ ...content, experiences: newExperiences });
                          }}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
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

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-900">ATS Insights</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start"><span className="text-green-600 mr-2">✓</span><span className="text-gray-700">Strong keyword match - resume includes key terms from job description</span></div>
                <div className="flex items-start"><span className="text-green-600 mr-2">✓</span><span className="text-gray-700">Quantifiable achievements - metrics improve credibility</span></div>
                <div className="flex items-start"><span className="text-yellow-600 mr-2">→</span><span className="text-gray-700">Consider adding more industry-specific certifications</span></div>
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
    </div>
  );
}
