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

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}>
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
      await loadSavedProfile();
      setImportMessage("Saved profile loaded into the form.");
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
    
    // Prepare data for AI generation
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
        // Redirect to resume editor with generated content
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
    <div className="min-h-screen bg-gray-50">
      {showStartChooser && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
                  How would you like to start your resume?
                </h1>
                <p className="text-slate-600 mt-2">
                  Pick a fast path and we will prefill as much as possible.
                </p>
              </div>
              <button
                type="button"
                onClick={startBlank}
                className="p-2 text-slate-500 hover:text-slate-800"
                aria-label="Close start options"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="group rounded-2xl border border-slate-200 bg-white p-8 text-left hover:shadow-lg transition"
              >
                <UploadCloud className="h-10 w-10 text-violet-500 mb-6" />
                <p className="text-4xl font-bold text-slate-600 mb-2">01</p>
                <h3 className="text-3xl font-extrabold text-slate-700 leading-tight">
                  Upload your Word resume
                </h3>
                <p className="text-sm text-slate-500 mt-3">
                  Supported format: .docx
                </p>
              </button>

              <button
                type="button"
                onClick={startBlank}
                className="group rounded-2xl border border-slate-200 bg-white p-8 text-left hover:shadow-lg transition"
              >
                <FileText className="h-10 w-10 text-blue-500 mb-6" />
                <p className="text-4xl font-bold text-slate-600 mb-2">02</p>
                <h3 className="text-3xl font-extrabold text-slate-700 leading-tight">
                  Create from scratch
                </h3>
                <p className="text-sm text-slate-500 mt-3">
                  Fill all sections manually
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

            {isImportingResumeDocx && (
              <p className="mt-5 text-sm text-slate-600">Importing Word resume...</p>
            )}
            {importError && (
              <p className="mt-3 text-sm text-red-700">{importError}</p>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                ResumeAI
              </span>
            </Link>
          <div className="text-sm text-gray-600">
              Step {step} of 4 · Template: {selectedTemplate?.name || "Modern Professional"}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s ? <CheckCircle className="h-6 w-6" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > s ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span className={step >= 1 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Job Info
            </span>
            <span className={step >= 2 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Personal
            </span>
            <span className={step >= 3 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Experience
            </span>
            <span className={step >= 4 ? "text-blue-600 font-medium" : "text-gray-500"}>
              Generate
            </span>
          </div>
        </div>

        {/* Step 1: Job Description */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Target Job</h2>
                <p className="text-gray-600">Paste the job description you're applying for</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Job URL (Optional)
                </label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://company.com/careers/job-posting"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Job Description *
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here. Include responsibilities, requirements, and qualifications. The more detail you provide, the better AI can optimize your resume."
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500">
                  {jobDescription.length} characters (minimum 50 recommended)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Why this matters:</p>
                    <p>
                      Our AI analyzes the job description to extract key requirements, skills,
                      and keywords. It then optimizes your resume to match what the employer is
                      looking for and pass ATS systems.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                <p className="text-gray-600">Tell us about yourself</p>
              </div>
            </div>

            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleUseSavedProfile}
                  disabled={isImportingProfile}
                  className="px-4 py-2 rounded-lg border border-blue-300 text-blue-700 font-medium hover:bg-blue-100 disabled:opacity-60"
                >
                  Use Saved Profile
                </button>
                <label className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer">
                  {isImportingResumeDocx ? "Importing .docx..." : "Import Word Resume (.docx)"}
                  <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleImportResumeDocx}
                    className="hidden"
                    disabled={isImportingResumeDocx}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-blue-900">
                Upload a .docx resume to create a new resume prefilled in your selected template.
              </p>
              {importMessage ? <p className="mt-2 text-sm text-green-700">{importMessage}</p> : null}
              {importError ? <p className="mt-2 text-sm text-red-700">{importError}</p> : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={personalInfo.name}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, name: e.target.value })
                  }
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, phone: e.target.value })
                  }
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={personalInfo.location}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, location: e.target.value })
                  }
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={personalInfo.linkedin}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, linkedin: e.target.value })
                  }
                  placeholder="linkedin.com/in/johndoe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Portfolio/Website
                </label>
                <input
                  type="url"
                  value={personalInfo.portfolio}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, portfolio: e.target.value })
                  }
                  placeholder="johndoe.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={personalInfo.headline}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, headline: e.target.value })
                  }
                  placeholder="Senior Software Engineer | React & Node.js Specialist"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Experience & Education */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Work Experience */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-lg mr-4">
                    <Briefcase className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                    <p className="text-gray-600">Add your relevant work history</p>
                  </div>
                </div>
                <button
                  onClick={addExperience}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  + Add Another
                </button>
              </div>

              <div className="space-y-6">
                {experiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="border border-gray-200 rounded-lg p-6 relative"
                  >
                    {experiences.length > 1 && (
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}

                    <h3 className="font-semibold text-gray-900 mb-4">
                      Position {index + 1}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) =>
                            updateExperience(exp.id, "title", e.target.value)
                          }
                          placeholder="Software Engineer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company *
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) =>
                            updateExperience(exp.id, "company", e.target.value)
                          }
                          placeholder="Tech Corp"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) =>
                            updateExperience(exp.id, "location", e.target.value)
                          }
                          placeholder="San Francisco, CA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="month"
                          value={exp.startDate}
                          onChange={(e) =>
                            updateExperience(exp.id, "startDate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="month"
                          value={exp.endDate}
                          onChange={(e) =>
                            updateExperience(exp.id, "endDate", e.target.value)
                          }
                          disabled={exp.current}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm disabled:bg-gray-100"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`current-${exp.id}`}
                          checked={exp.current}
                          onChange={(e) =>
                            updateExperience(exp.id, "current", e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                        />
                        <label
                          htmlFor={`current-${exp.id}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          I currently work here
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={exp.description}
                          onChange={(e) =>
                            updateExperience(exp.id, "description", e.target.value)
                          }
                          placeholder="Describe your responsibilities and achievements..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          AI will optimize this based on the job description
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <GraduationCap className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                    <p className="text-gray-600">Add your educational background</p>
                  </div>
                </div>
                <button
                  onClick={addEducation}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  + Add Another
                </button>
              </div>

              <div className="space-y-6">
                {education.map((edu, index) => (
                  <div
                    key={edu.id}
                    className="border border-gray-200 rounded-lg p-6 relative"
                  >
                    {education.length > 1 && (
                      <button
                        onClick={() => removeEducation(edu.id)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}

                    <h3 className="font-semibold text-gray-900 mb-4">
                      Education {index + 1}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Degree *
                        </label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) =>
                            updateEducation(edu.id, "degree", e.target.value)
                          }
                          placeholder="Bachelor of Science in Computer Science"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Institution *
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) =>
                            updateEducation(edu.id, "institution", e.target.value)
                          }
                          placeholder="Stanford University"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={edu.location}
                          onChange={(e) =>
                            updateEducation(edu.id, "location", e.target.value)
                          }
                          placeholder="Stanford, CA"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Graduation Date
                        </label>
                        <input
                          type="month"
                          value={edu.graduationDate}
                          onChange={(e) =>
                            updateEducation(edu.id, "graduationDate", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GPA (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) =>
                            updateEducation(edu.id, "gpa", e.target.value)
                          }
                          placeholder="3.8/4.0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <Code className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                  <p className="text-gray-600">Add your technical and soft skills</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
                <button
                  onClick={addSkill}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center"
                  >
                    {skill}
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Ready to Generate!</h2>
                <p className="text-gray-600">Review and let AI optimize your resume</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Job Target</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{jobDescription.substring(0, 200)}...</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Personal Info</h3>
                <p className="text-sm text-gray-600">
                  {personalInfo.name} • {personalInfo.email}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Experience</h3>
                <p className="text-sm text-gray-600">
                  {experiences.length} position(s) • {education.length} degree(s)
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Skills</h3>
                <p className="text-sm text-gray-600">{skills.length} skills added</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <Sparkles className="h-6 w-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">What happens next:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center">
                      <span className="text-green-600 mr-2">→</span>
                      AI analyzes job requirements and extracts keywords
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-600 mr-2">→</span>
                      Optimizes your bullet points for ATS systems
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-600 mr-2">→</span>
                      Generates multiple versions to choose from
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-600 mr-2">→</span>
                      Calculates ATS score in real-time
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                disabled={isGenerating}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition font-semibold inline-flex items-center disabled:opacity-50"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-semibold disabled:opacity-50 inline-flex items-center shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
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
