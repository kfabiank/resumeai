export type ResumeContent = {
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
};

export type AtsArea = "summary" | "experience" | "skills" | "format";
export type AtsSeverity = "high" | "medium" | "low";

export type AtsSuggestion = {
  id: string;
  area: AtsArea;
  severity: AtsSeverity;
  message: string;
  action: string;
};

export type AtsScanResult = {
  score: number;
  suggestions: AtsSuggestion[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasNumber(text: string) {
  return /\d/.test(text);
}

export function runAtsScan(content: ResumeContent): AtsScanResult {
  const suggestions: AtsSuggestion[] = [];
  let score = 100;

  const summaryWords = wordCount(content.professionalSummary || "");
  if (summaryWords < 40) {
    score -= 12;
    suggestions.push({
      id: "summary-short",
      area: "summary",
      severity: "high",
      message: "Professional summary is too short for ATS context.",
      action: "Expand to 40-120 words with role, years, stack, and measurable impact.",
    });
  } else if (summaryWords > 140) {
    score -= 6;
    suggestions.push({
      id: "summary-long",
      area: "summary",
      severity: "low",
      message: "Professional summary is long and may reduce readability.",
      action: "Keep it concise (40-120 words) and prioritize relevant keywords.",
    });
  }

  if (content.experiences.length < 2) {
    score -= 10;
    suggestions.push({
      id: "exp-count",
      area: "experience",
      severity: "high",
      message: "Few experience entries detected.",
      action: "Add at least 2 roles (or projects) with clear scope and outcomes.",
    });
  }

  const allBullets = content.experiences.flatMap((exp) => exp.optimizedBullets || []);
  const bulletsWithNumbers = allBullets.filter((bullet) => hasNumber(bullet)).length;
  const quantifiedRatio = allBullets.length ? bulletsWithNumbers / allBullets.length : 0;

  if (!allBullets.length) {
    score -= 20;
    suggestions.push({
      id: "exp-bullets-missing",
      area: "experience",
      severity: "high",
      message: "No experience bullets found.",
      action: "Add 3-5 bullets per role focused on outcomes and technologies used.",
    });
  } else if (quantifiedRatio < 0.35) {
    score -= 10;
    suggestions.push({
      id: "exp-quantified",
      area: "experience",
      severity: "medium",
      message: "Most bullets are not quantified.",
      action: "Add numbers, percentages, scale, or time impact in more bullets.",
    });
  }

  const technicalCount = content.skills.technical.length;
  const softCount = content.skills.soft.length;
  if (technicalCount < 8) {
    score -= 8;
    suggestions.push({
      id: "skills-technical",
      area: "skills",
      severity: "medium",
      message: "Technical skills section looks limited.",
      action: "Include 8+ technical skills aligned to your target role keywords.",
    });
  }
  if (softCount < 4) {
    score -= 4;
    suggestions.push({
      id: "skills-soft",
      area: "skills",
      severity: "low",
      message: "Soft skills section is short.",
      action: "Add 4-6 relevant soft skills (leadership, communication, ownership).",
    });
  }

  const derivedKeywords = new Set([
    ...content.keywords.map((k) => k.toLowerCase()),
    ...content.experiences.flatMap((exp) => (exp.keywordsUsed || []).map((k) => k.toLowerCase())),
    ...content.skills.technical.map((k) => k.toLowerCase()),
  ]);
  if (derivedKeywords.size < 12) {
    score -= 8;
    suggestions.push({
      id: "keyword-density",
      area: "format",
      severity: "medium",
      message: "Keyword coverage can improve for ATS matching.",
      action: "Add job-specific terms in summary, bullets, and skills using exact wording.",
    });
  }

  if (!content.personalInfo.name || !content.personalInfo.email || !content.personalInfo.phone) {
    score -= 8;
    suggestions.push({
      id: "contact-fields",
      area: "format",
      severity: "high",
      message: "Missing critical contact details.",
      action: "Ensure name, email, and phone are present and correctly formatted.",
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: "great-shape",
      area: "format",
      severity: "low",
      message: "Resume is in strong ATS shape.",
      action: "Tailor keywords to each job description before applying.",
    });
  }

  return { score: clampScore(score), suggestions };
}
