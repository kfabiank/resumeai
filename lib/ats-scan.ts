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
  certifications?: Array<{
    name: string;
    issuer?: string;
    issueDate?: string;
    credentialId?: string;
    url?: string;
  }>;
  projects?: Array<{
    name: string;
    role?: string;
    url?: string;
    description?: string;
    achievements?: string[];
    technologies?: string[];
  }>;
  languages?: Array<{
    name: string;
    level?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  keywords: string[];
};

export type AtsArea = "summary" | "experience" | "skills" | "format";
export type AtsSeverity = "high" | "medium" | "low";
export type AtsSeniority = "ic" | "manager" | "director";

export type AtsSuggestion = {
  id: string;
  area: AtsArea;
  severity: AtsSeverity;
  message: string;
  action: string;
};

export type AtsSubscores = {
  semantic: number;
  quality: number;
  technical: number;
};

export type AtsGap = {
  id: string;
  keyword: string;
  area: "summary" | "experience" | "skills";
  severity: AtsSeverity;
  reason: string;
  insertionHint: string;
  suggestedBullet?: string;
};

export type AtsBenchmark = {
  seniority: AtsSeniority;
  target: number;
  status: "below" | "on_track";
};

export type AtsScanResult = {
  version: "v2";
  score: number;
  suggestions: AtsSuggestion[];
  subscores: AtsSubscores;
  gaps: AtsGap[];
  benchmark: AtsBenchmark;
  diagnostics: {
    semanticCoverage: number;
    evidenceCoverage: number;
    stuffingPenalty: number;
    matchedKeywords: string[];
    missingKeywords: string[];
  };
};

type AtsScanOptions = {
  jobDescription?: string;
  targetRole?: string;
};

type OntologySkill = {
  canonical: string;
  aliases: string[];
};

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "of", "to", "for", "in", "on", "with", "at", "by", "from", "as",
  "is", "are", "be", "you", "we", "our", "your", "their", "this", "that", "will", "must", "can",
  "should", "have", "has", "had", "about", "into", "across", "through", "using", "use", "plus",
  "strong", "experience", "years", "year", "role", "position", "team", "skills", "ability",
]);

const ACTION_VERBS = [
  "led", "built", "improved", "reduced", "increased", "optimized", "implemented", "architected",
  "launched", "designed", "delivered", "automated", "scaled", "migrated", "developed", "owned",
  "drove", "collaborated", "mentored", "managed",
];

const SKILL_ONTOLOGY: OntologySkill[] = [
  { canonical: "typescript", aliases: ["ts"] },
  { canonical: "javascript", aliases: ["js", "ecmascript"] },
  { canonical: "react", aliases: ["reactjs", "react.js"] },
  { canonical: "next.js", aliases: ["nextjs", "next"] },
  { canonical: "node.js", aliases: ["node", "nodejs"] },
  { canonical: "postgresql", aliases: ["postgres", "psql"] },
  { canonical: "aws", aliases: ["amazon web services"] },
  { canonical: "docker", aliases: [] },
  { canonical: "kubernetes", aliases: ["k8s"] },
  { canonical: "terraform", aliases: [] },
  { canonical: "microservices", aliases: ["service-oriented architecture", "soa"] },
  { canonical: "ci/cd", aliases: ["cicd", "continuous integration", "continuous delivery", "continuous deployment"] },
  { canonical: "graphql", aliases: [] },
  { canonical: "rest api", aliases: ["rest", "api design"] },
  { canonical: "redis", aliases: [] },
  { canonical: "python", aliases: [] },
  { canonical: "machine learning", aliases: ["ml"] },
  { canonical: "data analysis", aliases: ["analytics"] },
  { canonical: "leadership", aliases: ["people leadership", "team leadership"] },
  { canonical: "stakeholder management", aliases: ["cross-functional communication"] },
];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasNumber(text: string) {
  return /\d/.test(text);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\-\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t));
}

function canonicalizeTerm(term: string): string {
  const v = term.toLowerCase().trim();
  for (const skill of SKILL_ONTOLOGY) {
    if (skill.canonical === v || skill.aliases.includes(v)) {
      return skill.canonical;
    }
  }
  return v;
}

function extractOntologyMatches(text: string): Set<string> {
  const lower = text.toLowerCase();
  const out = new Set<string>();
  for (const skill of SKILL_ONTOLOGY) {
    const all = [skill.canonical, ...skill.aliases];
    if (all.some((k) => lower.includes(k.toLowerCase()))) {
      out.add(skill.canonical);
    }
  }
  return out;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function inferSeniority(content: ResumeContent, targetRole = ""): AtsSeniority {
  const text = [
    targetRole,
    content.personalInfo.headline || "",
    ...content.experiences.map((e) => e.title || ""),
  ]
    .join(" ")
    .toLowerCase();

  if (/(director|head|vp|vice president|chief|c-level)/.test(text)) return "director";
  if (/(manager|lead|supervisor)/.test(text)) return "manager";
  return "ic";
}

function benchmarkForSeniority(seniority: AtsSeniority): number {
  if (seniority === "director") return 72;
  if (seniority === "manager") return 75;
  return 78;
}

function extractJobKeywords(jobDescription: string, targetRole: string): string[] {
  const source = `${targetRole} ${jobDescription}`.trim();
  if (!source) return [];

  const ontology = Array.from(extractOntologyMatches(source));
  const tokens = tokenize(source)
    .filter((t) => t.length >= 3)
    .map(canonicalizeTerm);

  // Keep top terms by frequency, plus ontology matches for semantic recall.
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  const frequent = Array.from(freq.entries())
    .filter(([t, count]) => count >= 2 || /(manager|director|senior|principal)/.test(t))
    .map(([t]) => t);

  return unique([...ontology, ...frequent]).slice(0, 24);
}

function extractResumeSignals(content: ResumeContent) {
  const summaryText = content.professionalSummary || "";
  const experienceBullets = content.experiences.flatMap((e) => e.optimizedBullets || []);
  const experienceText = [
    ...content.experiences.map((e) => `${e.title} ${e.company}`),
    ...experienceBullets,
  ].join(" ");
  const skillsText = [
    ...(content.skills.technical || []),
    ...(content.skills.soft || []),
    ...(content.keywords || []),
    ...content.experiences.flatMap((e) => e.keywordsUsed || []),
  ].join(" ");

  const summarySet = new Set<string>([
    ...tokenize(summaryText).map(canonicalizeTerm),
    ...extractOntologyMatches(summaryText),
  ]);
  const experienceSet = new Set<string>([
    ...tokenize(experienceText).map(canonicalizeTerm),
    ...extractOntologyMatches(experienceText),
  ]);
  const skillsSet = new Set<string>([
    ...tokenize(skillsText).map(canonicalizeTerm),
    ...extractOntologyMatches(skillsText),
  ]);

  return { summaryText, experienceBullets, summarySet, experienceSet, skillsSet };
}

function scoreSemanticCoverage(jobKeywords: string[], signals: ReturnType<typeof extractResumeSignals>) {
  if (!jobKeywords.length) {
    return {
      score: 78,
      coverage: 0.7,
      matched: [] as string[],
      missing: [] as string[],
      perKeywordWeight: {} as Record<string, number>,
    };
  }

  const perKeywordWeight: Record<string, number> = {};
  const matched: string[] = [];
  const missing: string[] = [];
  let weighted = 0;

  for (const keyword of jobKeywords) {
    const inExp = signals.experienceSet.has(keyword);
    const inSummary = signals.summarySet.has(keyword);
    const inSkills = signals.skillsSet.has(keyword);
    const weight = inExp ? 1 : inSummary ? 0.7 : inSkills ? 0.45 : 0;
    perKeywordWeight[keyword] = weight;
    weighted += weight;
    if (weight > 0) matched.push(keyword);
    else missing.push(keyword);
  }

  const coverage = weighted / jobKeywords.length;
  const semanticScore = clampScore(coverage * 100);
  return { score: semanticScore, coverage, matched, missing, perKeywordWeight };
}

function scoreEvidence(jobKeywords: string[], signals: ReturnType<typeof extractResumeSignals>) {
  const bullets = signals.experienceBullets || [];
  if (!bullets.length || !jobKeywords.length) {
    return { score: 55, coverage: 0.4 };
  }

  let evidencedKeywords = 0;

  for (const keyword of jobKeywords) {
    const found = bullets.some((bullet) => {
      const text = bullet.toLowerCase();
      const hasKeyword = text.includes(keyword) || text.includes(canonicalizeTerm(keyword));
      const hasAction = ACTION_VERBS.some((verb) => text.includes(`${verb} `));
      const hasMetric = hasNumber(text);
      const hasContext = /(users|customers|revenue|latency|uptime|team|system|pipeline|product)/.test(text);
      return hasKeyword && hasAction && (hasMetric || hasContext);
    });
    if (found) evidencedKeywords += 1;
  }

  const coverage = evidencedKeywords / jobKeywords.length;
  return { score: clampScore(coverage * 100), coverage };
}

function scoreTechnicalParseability(content: ResumeContent) {
  let score = 100;

  if (!content.personalInfo.name || !content.personalInfo.email || !content.personalInfo.phone) score -= 15;

  const summaryWords = wordCount(content.professionalSummary || "");
  if (summaryWords < 35 || summaryWords > 160) score -= 8;

  if (content.experiences.length < 2) score -= 10;

  const bullets = content.experiences.flatMap((e) => e.optimizedBullets || []);
  if (bullets.length < 4) score -= 12;

  const malformedDates = content.experiences.some(
    (e) => !e.startDate || (!e.current && !e.endDate)
  );
  if (malformedDates) score -= 8;

  const avgBulletWords = bullets.length
    ? bullets.reduce((acc, b) => acc + wordCount(b), 0) / bullets.length
    : 0;
  if (avgBulletWords > 36 || avgBulletWords < 7) score -= 8;

  const totalWords =
    wordCount(content.professionalSummary || "") +
    bullets.reduce((acc, b) => acc + wordCount(b), 0);
  if (totalWords > 1100) score -= 10;

  return clampScore(score);
}

function scoreQuality(
  content: ResumeContent,
  semantic: ReturnType<typeof scoreSemanticCoverage>,
  evidence: ReturnType<typeof scoreEvidence>
) {
  const bullets = content.experiences.flatMap((e) => e.optimizedBullets || []);
  const quantified = bullets.filter((b) => hasNumber(b)).length;
  const quantifiedRatio = bullets.length ? quantified / bullets.length : 0;
  const quantifiedScore = clampScore(quantifiedRatio * 100);

  const skillsCount = (content.skills.technical?.length || 0) + (content.skills.soft?.length || 0);
  const stuffingSignal = bullets.length ? skillsCount / bullets.length : skillsCount;
  const stuffingPenalty = stuffingSignal > 3.2 ? Math.min(20, (stuffingSignal - 3.2) * 8) : 0;

  const base =
    semantic.score * 0.25 +
    evidence.score * 0.45 +
    quantifiedScore * 0.2 +
    Math.min(100, (content.experiences.length / 3) * 100) * 0.1;

  return {
    score: clampScore(base - stuffingPenalty),
    stuffingPenalty: Math.round(stuffingPenalty),
  };
}

function buildGapReport(
  missingKeywords: string[],
  semantic: ReturnType<typeof scoreSemanticCoverage>,
  content: ResumeContent
): AtsGap[] {
  const role = content.personalInfo.headline || "target role";
  return missingKeywords.slice(0, 8).map((keyword, idx) => {
    const isTechnical = SKILL_ONTOLOGY.some((s) => s.canonical === keyword);
    const area: AtsGap["area"] = isTechnical ? "skills" : "experience";
    const severity: AtsSeverity = semantic.coverage < 0.5 ? "high" : "medium";
    const insertionHint =
      area === "skills"
        ? "Add to technical skills and reference it in a recent achievement bullet."
        : "Add in a recent experience bullet with action + measurable impact.";
    const suggestedBullet = isTechnical
      ? `Implemented ${keyword} improvements for ${role} workflows, reducing cycle time by 28% while improving reliability.`
      : `Led ${keyword} initiatives aligned to ${role} goals, delivering measurable business impact and faster execution.`;
    return {
      id: `gap-${idx + 1}`,
      keyword,
      area,
      severity,
      reason: `Missing or weak evidence for "${keyword}" compared with the target vacancy.`,
      insertionHint,
      suggestedBullet,
    };
  });
}

function buildSuggestions(
  content: ResumeContent,
  semantic: ReturnType<typeof scoreSemanticCoverage>,
  technicalScore: number,
  quality: ReturnType<typeof scoreQuality>,
  gaps: AtsGap[]
): AtsSuggestion[] {
  const suggestions: AtsSuggestion[] = [];
  const summaryWords = wordCount(content.professionalSummary || "");
  const bullets = content.experiences.flatMap((e) => e.optimizedBullets || []);
  const quantifiedRatio = bullets.length ? bullets.filter((b) => hasNumber(b)).length / bullets.length : 0;

  if (semantic.coverage < 0.55) {
    suggestions.push({
      id: "semantic-match-low",
      area: "experience",
      severity: "high",
      message: "Low semantic match with target vacancy.",
      action: "Mirror required skills/responsibilities in experience bullets using the vacancy terminology.",
    });
  }

  if (summaryWords < 40 || summaryWords > 140) {
    suggestions.push({
      id: "summary-length",
      area: "summary",
      severity: summaryWords < 40 ? "high" : "medium",
      message: "Professional summary length is not optimal for ATS parsing.",
      action: "Keep summary between 40-120 words with role, stack, and measurable outcomes.",
    });
  }

  if (quantifiedRatio < 0.35) {
    suggestions.push({
      id: "quantification-low",
      area: "experience",
      severity: "medium",
      message: "Experience evidence is weak on measurable outcomes.",
      action: "Add numbers (%, $, scale, time) to at least 35-50% of bullets.",
    });
  }

  if (quality.stuffingPenalty > 0) {
    suggestions.push({
      id: "skills-stuffing",
      area: "skills",
      severity: "medium",
      message: "Skills list is likely over-indexed versus evidence in experience.",
      action: "Reduce keyword-only skills and prove key skills in outcome-driven bullets.",
    });
  }

  if (technicalScore < 75) {
    suggestions.push({
      id: "technical-parseability",
      area: "format",
      severity: "high",
      message: "ATS parseability checks need attention.",
      action: "Fix contact fields, dates, section completeness, and bullet readability.",
    });
  }

  if (gaps.length) {
    suggestions.push({
      id: "gap-report",
      area: "skills",
      severity: "medium",
      message: `Detected ${gaps.length} vacancy gaps (keywords/skills).`,
      action: `Prioritize: ${gaps.slice(0, 3).map((g) => g.keyword).join(", ")}.`,
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: "great-shape",
      area: "format",
      severity: "low",
      message: "Resume is in strong ATS shape.",
      action: "Tailor 2-3 bullets per application to maximize semantic fit.",
    });
  }

  return suggestions;
}

export function runAtsScan(content: ResumeContent, options?: AtsScanOptions): AtsScanResult {
  const jobDescription = options?.jobDescription || "";
  const targetRole = options?.targetRole || content.personalInfo.headline || "";

  const jobKeywords = extractJobKeywords(jobDescription, targetRole);
  const signals = extractResumeSignals(content);

  const semantic = scoreSemanticCoverage(jobKeywords, signals);
  const evidence = scoreEvidence(jobKeywords, signals);
  const technicalScore = scoreTechnicalParseability(content);
  const quality = scoreQuality(content, semantic, evidence);

  const hybridScore = clampScore(
    semantic.score * 0.4 +
      quality.score * 0.4 +
      technicalScore * 0.2
  );

  const seniority = inferSeniority(content, targetRole);
  const target = benchmarkForSeniority(seniority);
  const gaps = buildGapReport(semantic.missing, semantic, content);
  const suggestions = buildSuggestions(content, semantic, technicalScore, quality, gaps);

  return {
    version: "v2",
    score: hybridScore,
    suggestions,
    subscores: {
      semantic: semantic.score,
      quality: quality.score,
      technical: technicalScore,
    },
    gaps,
    benchmark: {
      seniority,
      target,
      status: hybridScore >= target ? "on_track" : "below",
    },
    diagnostics: {
      semanticCoverage: Number(semantic.coverage.toFixed(3)),
      evidenceCoverage: Number(evidence.coverage.toFixed(3)),
      stuffingPenalty: quality.stuffingPenalty,
      matchedKeywords: semantic.matched,
      missingKeywords: semantic.missing,
    },
  };
}
