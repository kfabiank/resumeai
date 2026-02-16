"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Briefcase,
  GraduationCap,
  Code,
  CheckCircle,
  Sparkles,
  Loader2,
  UploadCloud,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Award,
  Zap,
  Target,
  BarChart3,
} from "lucide-react";
import { DEFAULT_TEMPLATE_ID, getTemplateById, isTemplateId } from "@/lib/template-catalog";

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  graduationDate: string;
  gpa?: string;
}

type ProfileResponse = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  experiences?: Array<{
    title?: string;
    company?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    description?: string;
    optimizedBullets?: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    location?: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  skills?:
    | string[]
    | {
        technical?: string[];
        soft?: string[];
      };
};

const STEPS = [
  { label: "Job Info", icon: Target },
  { label: "Personal", icon: User },
  { label: "Experience", icon: Briefcase },
  { label: "Generate", icon: Sparkles },
] as const;

const inputClass =
  "w-full h-12 px-4 pl-11 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors outline-none";
const inputClassNoIcon =
  "w-full h-12 px-4 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors outline-none";

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}>
      <ResumeBuilderContent />
    </Suspense>
  );
}

function ResumeBuilderContent() {
  const searchParams = useSearchParams();
  const requestedTemplate = searchParams.get("template") || DEFAULT_TEMPLATE_ID;
  const selectedTemplateId = isTemplateId(requestedTemplate)
    ? requestedTemplate
    : DEFAULT_TEMPLATE_ID;
  const selectedTemplate = getTemplateById(selectedTemplateId);

  const [step, setStep] = useState(1);
  const [showStartChooser, setShowStartChooser] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // Form data
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: "",
    headline: "",
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: "1",
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    },
  ]);

  const [education, setEducation] = useState<Education[]>([
    {
      id: "1",
      degree: "",
      institution: "",
      location: "",
      graduationDate: "",
      gpa: "",
    },
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [isImportingProfile, setIsImportingProfile] = useState(false);
  const [isImportingResumeDocx, setIsImportingResumeDocx] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importError, setImportError] = useState("");

  const applyProfileToPersonalInfo = (data: ProfileResponse) => {
    setPersonalInfo((prev) => ({
      ...prev,
      name: data.name || prev.name,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      location: data.location || prev.location,
      linkedin: data.linkedinUrl || prev.linkedin,
      portfolio: data.portfolioUrl || prev.portfolio,
      headline: data.headline || prev.headline,
    }));
  };

  const applyProfileCollections = (data: ProfileResponse) => {
    const mappedExperiences = Array.isArray(data.experiences)
      ? data.experiences
          .map((exp, index) => ({
            id: `profile-exp-${index}-${Date.now()}`,
            title: exp.title || "",
            company: exp.company || "",
            location: exp.location || "",
            startDate: exp.startDate || "",
            endDate: exp.endDate || "",
            current: Boolean(exp.current),
            description:
              exp.description ||
              (Array.isArray(exp.optimizedBullets) ? exp.optimizedBullets.join("\n") : ""),
          }))
          .filter((exp) => exp.title || exp.company || exp.description)
      : [];

    if (mappedExperiences.length > 0) {
      setExperiences(mappedExperiences);
    }

    const mappedEducation = Array.isArray(data.education)
      ? data.education
          .map((edu, index) => ({
            id: `profile-edu-${index}-${Date.now()}`,
            degree: edu.degree || "",
            institution: edu.institution || "",
            location: edu.location || "",
            graduationDate: edu.graduationDate || "",
            gpa: edu.gpa || "",
          }))
          .filter((edu) => edu.degree || edu.institution)
      : [];

    if (mappedEducation.length > 0) {
      setEducation(mappedEducation);
    }

    let importedSkills: string[] = [];
    if (Array.isArray(data.skills)) {
      importedSkills = data.skills.filter((value): value is string => typeof value === "string");
    } else if (data.skills && typeof data.skills === "object") {
      const technical = Array.isArray(data.skills.technical) ? data.skills.technical : [];
      const soft = Array.isArray(data.skills.soft) ? data.skills.soft : [];
      importedSkills = [...technical, ...soft];
    }

    if (importedSkills.length > 0) {
      setSkills(Array.from(new Set(importedSkills.map((skill) => skill.trim()).filter(Boolean))));
    }
  };

  const loadSavedProfile = async (options?: { includeCollections?: boolean }) => {
    const profileResponse = await fetch("/api/profile", { cache: "no-store" });
    if (!profileResponse.ok) {
      throw new Error("Could not load saved profile");
    }
    const profile = (await profileResponse.json()) as ProfileResponse;
    applyProfileToPersonalInfo(profile);
    if (options?.includeCollections) {
      applyProfileCollections(profile);
    }
    return profile;
  };

  const handleUseSavedProfile = async () => {
    setImportError("");
    setImportMessage("");
    setIsImportingProfile(true);
    try {
      await loadSavedProfile({ includeCollections: true });
      setImportMessage("Profile loaded successfully.");
      setShowStartChooser(false);
      setStep(1);
    } catch (error: any) {
      setImportError(error.message || "Could not load saved profile");
    } finally {
      setIsImportingProfile(false);
    }
  };

  const startBlank = () => {
    setShowStartChooser(false);
    setStep(1);
  };

  const handleImportResumeDocx = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportMessage("");
    setIsImportingResumeDocx(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("templateId", selectedTemplateId);

      const res = await fetch("/api/resume/import-docx", {
        method: "POST",
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Could not import Word resume");
      }

      if (body.resumeId) {
        window.location.href = `/builder/${body.resumeId}`;
        return;
      }
      throw new Error("Resume import did not return a resume id");
    } catch (error: any) {
      setImportError(error.message || "Could not import Word resume");
    } finally {
      setIsImportingResumeDocx(false);
      e.target.value = "";
    }
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      },
    ]);
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setExperiences(
      experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const addEducation = () => {
    setEducation([
      ...education,
      {
        id: Date.now().toString(),
        degree: "",
        institution: "",
        location: "",
        graduationDate: "",
        gpa: "",
      },
    ]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducation(
      education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    const resumeData = {
      jobDescription,
      jobUrl,
      personalInfo,
      experiences,
      education,
      skills,
      templateId: selectedTemplateId,
    };

    try {
      const response = await fetch("/api/generate/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = `/builder/${result.resumeId}`;
      }
    } catch (error) {
      console.error("Error generating resume:", error);
      alert("Error generating resume. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceedStep1 = jobDescription.trim().length > 50;
  const canProceedStep2 =
    personalInfo.name && personalInfo.email && personalInfo.phone;
  const canProceedStep3 =
    experiences.some((exp) => exp.title && exp.company) &&
    education.some((edu) => edu.degree && edu.institution);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-white">
      {/* ── Start Chooser Overlay ── */}
      {showStartChooser && (
        <div className="fixed inset-0 z-40 bg-gradient-to-b from-blue-50 via-white to-white flex items-center justify-center px-4">
          <div className="max-w-3xl w-full">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                How would you like to start?
              </h1>
              <p className="text-gray-500 text-lg">
                Choose a path and we&apos;ll help you build a great resume.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Upload .docx */}
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={isImportingResumeDocx}
                className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 text-left hover:border-violet-400 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 mb-4 group-hover:bg-violet-200 transition-colors">
                  <UploadCloud className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Upload Resume
                </h3>
                <p className="text-sm text-gray-500">
                  Import from a .docx file and auto-fill all fields
                </p>
                {isImportingResumeDocx && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                  </div>
                )}
              </button>

              {/* Use saved profile */}
              <button
                type="button"
                onClick={handleUseSavedProfile}
                disabled={isImportingProfile}
                className="group relative rounded-xl border-2 border-gray-200 bg-white p-6 text-left hover:border-blue-400 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4 group-hover:bg-blue-200 transition-colors">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Use My Profile
                </h3>
                <p className="text-sm text-gray-500">
                  Pre-fill from your saved profile data
                </p>
                {isImportingProfile && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                )}
              </button>

              {/* Start from scratch */}
              <button
                type="button"
                onClick={startBlank}
                className="group rounded-xl border-2 border-gray-200 bg-white p-6 text-left hover:border-emerald-400 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 mb-4 group-hover:bg-emerald-200 transition-colors">
                  <FileText className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Start Fresh
                </h3>
                <p className="text-sm text-gray-500">
                  Fill in every section manually from scratch
                </p>
              </button>
            </div>

            <input
              ref={csvInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleImportResumeDocx}
              className="hidden"
              disabled={isImportingResumeDocx}
            />

            {importError && (
              <p className="mt-4 text-sm text-red-600 text-center">{importError}</p>
            )}

            <p className="text-center text-xs text-gray-400 mt-8">
              Template: {selectedTemplate?.name || "Modern Professional"}
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <ArrowLeft className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-1.5 rounded-lg">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ResumeAI
              </span>
            </Link>
            <div className="text-sm text-gray-500">
              Template: <span className="font-medium text-gray-700">{selectedTemplate?.name || "Modern Professional"}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ── Progress Stepper ── */}
        <div className="mb-10">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const stepNum = i + 1;
              const isComplete = step > stepNum;
              const isCurrent = step === stepNum;
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (stepNum < step) setStep(stepNum);
                    }}
                    disabled={stepNum > step}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      isCurrent
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : isComplete
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-default"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1.5 rounded-full transition-colors ${
                        step > stepNum ? "bg-blue-300" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {importMessage && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
            {importMessage}
          </div>
        )}

        {/* ── Step 1: Job Description ── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Target Job</h2>
                  <p className="text-sm text-gray-500">Paste the job description you&apos;re applying for</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job URL <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://company.com/careers/job-posting"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here. Include responsibilities, requirements, and qualifications for best AI optimization."
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors outline-none resize-y"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    {jobDescription.length} characters · minimum 50 recommended
                  </p>
                  {jobDescription.length >= 50 && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Ready
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">AI-powered optimization.</span>{" "}
                    We extract keywords, requirements, and skills from the job posting to tailor your resume for ATS systems.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-blue-600 text-white h-12 px-8 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Personal Information ── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
                    <User className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-sm text-gray-500">Your contact details and professional headline</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUseSavedProfile}
                    disabled={isImportingProfile}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 transition disabled:opacity-60"
                  >
                    {isImportingProfile ? "Loading..." : "Load Profile"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                      placeholder="John Doe"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                      placeholder="john@example.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={personalInfo.location}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                      placeholder="San Francisco, CA"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                  <div className="relative">
                    <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={personalInfo.linkedin}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/johndoe"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio</label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={personalInfo.portfolio}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                      placeholder="johndoe.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Headline</label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={personalInfo.headline}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, headline: e.target.value })}
                      placeholder="Senior Software Engineer | React & Node.js Specialist"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {importMessage && (
                <p className="mt-4 text-sm text-green-600">{importMessage}</p>
              )}
              {importError && (
                <p className="mt-4 text-sm text-red-600">{importError}</p>
              )}
            </div>

            <div className="px-8 pb-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="border border-gray-200 text-gray-600 h-12 px-6 rounded-lg hover:bg-gray-50 transition font-medium inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-blue-600 text-white h-12 px-8 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Experience & Education ── */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Work Experience */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100">
                      <Briefcase className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Work Experience</h2>
                      <p className="text-sm text-gray-500">Add your relevant work history</p>
                    </div>
                  </div>
                  <button
                    onClick={addExperience}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 transition"
                  >
                    + Add Role
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {experiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 relative"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Position {index + 1}
                      </h3>
                      {experiences.length > 1 && (
                        <button
                          onClick={() => removeExperience(exp.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Job Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateExperience(exp.id, "title", e.target.value)}
                          placeholder="Software Engineer"
                          className={inputClassNoIcon}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Company <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                          placeholder="Tech Corp"
                          className={inputClassNoIcon}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExperience(exp.id, "location", e.target.value)}
                          placeholder="San Francisco, CA"
                          className={inputClassNoIcon}
                        />
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Start</label>
                          <input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                            className={inputClassNoIcon}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">End</label>
                          <input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                            disabled={exp.current}
                            className={`${inputClassNoIcon} disabled:bg-gray-100 disabled:text-gray-400`}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            id={`current-${exp.id}`}
                            checked={exp.current}
                            onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-200"
                          />
                          I currently work here
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Description
                        </label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                          placeholder="Describe your responsibilities and achievements..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-colors outline-none resize-y"
                        />
                        <p className="mt-1.5 text-xs text-gray-400">
                          AI will optimize this based on the target job description
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100">
                      <GraduationCap className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Education</h2>
                      <p className="text-sm text-gray-500">Add your educational background</p>
                    </div>
                  </div>
                  <button
                    onClick={addEducation}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-orange-200 text-orange-700 bg-white hover:bg-orange-50 transition"
                  >
                    + Add Degree
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                {education.map((edu, index) => (
                  <div
                    key={edu.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 p-6 relative"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Education {index + 1}
                      </h3>
                      {education.length > 1 && (
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Degree <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                          placeholder="Bachelor of Science in Computer Science"
                          className={inputClassNoIcon}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Institution <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                          placeholder="Stanford University"
                          className={inputClassNoIcon}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Location</label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) => updateEducation(edu.id, "location", e.target.value)}
                          placeholder="Stanford, CA"
                          className={inputClassNoIcon}
                        />
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Graduation</label>
                          <input
                            type="month"
                            value={edu.graduationDate}
                            onChange={(e) => updateEducation(edu.id, "graduationDate", e.target.value)}
                            className={inputClassNoIcon}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">GPA</label>
                          <input
                            type="text"
                            value={edu.gpa}
                            onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                            placeholder="3.8/4.0"
                            className={inputClassNoIcon}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 px-8 py-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100">
                    <Code className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Skills</h2>
                    <p className="text-sm text-gray-500">Add your technical and soft skills</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Type a skill and press Enter"
                    className={`flex-1 ${inputClassNoIcon}`}
                  />
                  <button
                    onClick={addSkill}
                    className="bg-blue-600 text-white h-12 px-6 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                  >
                    Add
                  </button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 pl-3 pr-2 py-1.5 rounded-full text-sm font-medium border border-indigo-100"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-indigo-400 hover:text-indigo-700 transition p-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {skills.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No skills added yet. Type above to add.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="border border-gray-200 text-gray-600 h-12 px-6 rounded-lg hover:bg-gray-50 transition font-medium inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="bg-blue-600 text-white h-12 px-8 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Generate ── */}
        {step === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 px-8 py-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Ready to Generate</h2>
                  <p className="text-sm text-gray-500">Review your info and let AI do the magic</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border-l-4 border-blue-500">
                  <Target className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Job Target</h3>
                    <p className="text-sm text-gray-500 truncate">{jobDescription.substring(0, 120)}...</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border-l-4 border-emerald-500">
                  <User className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Personal Info</h3>
                    <p className="text-sm text-gray-500">{personalInfo.name} &middot; {personalInfo.email}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border-l-4 border-purple-500">
                  <Briefcase className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Experience & Education</h3>
                    <p className="text-sm text-gray-500">
                      {experiences.filter(e => e.title).length} position(s) &middot; {education.filter(e => e.degree).length} degree(s)
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-auto" />
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border-l-4 border-indigo-500">
                  <Code className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Skills</h3>
                    <p className="text-sm text-gray-500">{skills.length} skill{skills.length !== 1 ? "s" : ""} added</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-auto" />
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  What happens next
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2.5">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Extracts job keywords &amp; requirements</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Calculates real-time ATS score</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Optimizes bullet points for ATS</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Generates a polished, ready resume</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                disabled={isGenerating}
                className="border border-gray-200 text-gray-600 h-12 px-6 rounded-lg hover:bg-gray-50 transition font-medium inline-flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white h-12 px-10 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 inline-flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate My Resume
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
