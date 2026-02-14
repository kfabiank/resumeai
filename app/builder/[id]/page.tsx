"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Save, Sparkles, Share2 } from "lucide-react";

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

export default function ResumeEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const [resume, setResume] = useState<any>(null);
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchResume = async () => {
      try {
        const response = await fetch(`/api/resume/${id}`);
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Resume not found');
        }
        const data = await response.json();
        setResume(data);
        setContent(data.content);
      } catch (error: any) {
        console.error('Failed to load resume:', error);
        setLoadError(error?.message || 'Could not load this resume');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    // Save to API
    setTimeout(() => {
      setIsSaving(false);
      alert("Resume saved successfully!");
    }, 1000);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // In production, this would call your PDF generation API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock PDF download
      alert("PDF export would download here");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resume...</p>
        </div>
      </div>
    );
  }

  if (loadError || !content || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center bg-white border border-gray-200 rounded-xl p-8 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Resume not available</h1>
          <p className="text-gray-600 mb-6">{loadError || 'The requested resume does not exist.'}</p>
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
      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-600">Back to Dashboard</span>
            </Link>

            <div className="flex items-center space-x-3">
              {/* ATS Score */}
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
          {/* Editor Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Resume</h2>
              
              {/* Professional Summary */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Summary
                </label>
                <textarea
                  value={content.professionalSummary}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      professionalSummary: e.target.value,
                    })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>

              {/* Experiences */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Experience</h3>
                {content.experiences.map((exp, expIndex) => (
                  <div key={expIndex} className="mb-4 pb-4 border-b last:border-0">
                    <div className="font-medium text-gray-900 mb-2">
                      {exp.title} at {exp.company}
                    </div>
                    <div className="space-y-2">
                      {exp.optimizedBullets.map((bullet, bulletIndex) => (
                        <textarea
                          key={bulletIndex}
                          value={bullet}
                          onChange={(e) => {
                            const newExperiences = [...content.experiences];
                            newExperiences[expIndex].optimizedBullets[bulletIndex] =
                              e.target.value;
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

              {/* Skills */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Skills</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Technical</label>
                    <div className="flex flex-wrap gap-2">
                      {content.skills.technical.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Soft Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {content.skills.soft.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ATS Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-bold text-gray-900">ATS Insights</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">
                    Strong keyword match - resume includes key terms from job description
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span className="text-gray-700">
                    Quantifiable achievements - metrics improve credibility
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-600 mr-2">→</span>
                  <span className="text-gray-700">
                    Consider adding more industry-specific certifications
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Preview</h2>
                <Eye className="h-5 w-5 text-gray-400" />
              </div>

              {/* Resume Preview - Modern Professional Template */}
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center pb-6 border-b-2 border-blue-600">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {content.personalInfo.name}
                  </h1>
                  {content.personalInfo.headline && (
                    <p className="text-lg text-blue-600 font-medium mb-3">
                      {content.personalInfo.headline}
                    </p>
                  )}
                  <div className="flex justify-center flex-wrap gap-4 text-sm text-gray-600">
                    <span>{content.personalInfo.email}</span>
                    <span>•</span>
                    <span>{content.personalInfo.phone}</span>
                    {content.personalInfo.location && (
                      <>
                        <span>•</span>
                        <span>{content.personalInfo.location}</span>
                      </>
                    )}
                  </div>
                  {(content.personalInfo.linkedin || content.personalInfo.portfolio) && (
                    <div className="flex justify-center flex-wrap gap-4 text-sm text-blue-600 mt-2">
                      {content.personalInfo.linkedin && (
                        <span>{content.personalInfo.linkedin}</span>
                      )}
                      {content.personalInfo.portfolio && (
                        <span>{content.personalInfo.portfolio}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Professional Summary */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2 uppercase tracking-wide">
                    Professional Summary
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    {content.professionalSummary}
                  </p>
                </div>

                {/* Experience */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Experience
                  </h2>
                  <div className="space-y-4">
                    {content.experiences.map((exp, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-700">{exp.company}</p>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>
                              {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                            </p>
                            {exp.location && <p>{exp.location}</p>}
                          </div>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {exp.optimizedBullets.map((bullet, bIndex) => (
                            <li key={bIndex}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Education
                  </h2>
                  <div className="space-y-3">
                    {content.education.map((edu, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900">{edu.degree}</h3>
                            <p className="text-gray-700">{edu.institution}</p>
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>{edu.graduationDate}</p>
                            {edu.gpa && <p>GPA: {edu.gpa}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
                    Skills
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-gray-900">Technical: </span>
                      <span className="text-gray-700">
                        {content.skills.technical.join(" • ")}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Soft Skills: </span>
                      <span className="text-gray-700">
                        {content.skills.soft.join(" • ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
