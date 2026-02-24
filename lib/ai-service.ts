import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from "zod";

// Check if providers are enabled via environment flags
const useAnthropic = process.env.USE_ANTHROPIC !== 'false';
const useOpenAI = process.env.USE_OPENAI !== 'false';

// Initialize clients (only if enabled AND API keys are available)
const anthropic = useAnthropic && process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const openai = useOpenAI && process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export interface ResumeData {
  jobDescription: string;
  jobUrl?: string;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location?: string;
    linkedin?: string;
    portfolio?: string;
    headline?: string;
  };
  experiences: Array<{
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    graduationDate: string;
    gpa?: string;
  }>;
  skills: string[];
}

export interface OptimizedResume {
  personalInfo: ResumeData['personalInfo'];
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
  education: ResumeData['education'];
  skills: {
    technical: string[];
    soft: string[];
  };
  keywords: string[];
  atsScore: number;
  improvements: string[];
}

/**
 * Extract keywords from job description
 */
export function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Count frequency
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Get top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Call AI with automatic provider selection and fallback
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options: { maxTokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  const { maxTokens = 2500, jsonMode = false } = options;

  // Try Claude first
  if (anthropic) {
    try {
      console.log('Using Claude (Anthropic) for AI generation...');
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userPrompt}`,
          },
        ],
      });

      const responseContent = message.content[0].type === 'text' ? message.content[0].text : null;
      if (!responseContent) {
        throw new Error('No response from Claude');
      }
      return responseContent;
    } catch (error: any) {
      console.warn('Claude API failed, trying OpenAI fallback:', error.message);
      // Fall through to OpenAI
    }
  }

  // Try OpenAI as fallback
  if (openai) {
    console.log('Using OpenAI for AI generation...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: 'json_object' as const } }),
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('No response from OpenAI');
    }
    return responseContent;
  }

  throw new Error('No AI provider configured. Please set ANTHROPIC_API_KEY or OPENAI_API_KEY in your .env file.');
}

/**
 * Generate optimized resume using AI
 */
export async function generateOptimizedResume(
  data: ResumeData
): Promise<OptimizedResume> {
  const keywords = extractKeywords(data.jobDescription);

  const systemPrompt = `You are an expert resume writer and ATS optimization specialist. Your goal is to help job seekers create resumes that pass Applicant Tracking Systems (ATS) and impress hiring managers.

Key principles:
1. Use strong action verbs (Led, Developed, Implemented, Achieved, etc.)
2. Include quantifiable results whenever possible
3. Naturally integrate keywords from the job description
4. Keep bullet points concise (1-2 lines)
5. Focus on achievements, not just responsibilities
6. Match the tone and language of the target industry`;

  const userPrompt = `Create an optimized resume for this candidate applying to this job.

JOB DESCRIPTION:
${data.jobDescription}

CANDIDATE PROFILE:
Name: ${data.personalInfo.name}
${data.personalInfo.headline ? `Headline: ${data.personalInfo.headline}` : ''}

WORK EXPERIENCE:
${data.experiences.map((exp, i) => `
${i + 1}. ${exp.title} at ${exp.company}
   ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}
   Current description: ${exp.description}
`).join('\n')}

EDUCATION:
${data.education.map(edu => `${edu.degree} from ${edu.institution}`).join('\n')}

SKILLS:
${data.skills.join(', ')}

TASK:
1. Write a compelling 2-3 sentence professional summary
2. For EACH work experience, create 3-5 optimized bullet points that:
   - Highlight relevant achievements
   - Include specific metrics/results
   - Naturally use keywords: ${keywords.slice(0, 10).join(', ')}
   - Match the job requirements
3. Categorize skills into technical and soft skills
4. Provide 3-5 specific improvement suggestions

Return ONLY valid JSON in this exact format:
{
  "professionalSummary": "...",
  "experiences": [
    {
      "title": "...",
      "company": "...",
      "location": "...",
      "startDate": "...",
      "endDate": "...",
      "current": false,
      "optimizedBullets": ["...", "...", "..."],
      "keywordsUsed": ["keyword1", "keyword2"]
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "soft": ["skill1", "skill2"]
  },
  "improvements": ["suggestion1", "suggestion2", "suggestion3"]
}`;

  try {
    const responseContent = await callAI(systemPrompt, userPrompt, { maxTokens: 2500, jsonMode: true });

    // Extract JSON from response (Claude may include markdown code blocks)
    const jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/) ||
                      responseContent.match(/```\s*([\s\S]*?)\s*```/) ||
                      [null, responseContent];
    const jsonString = jsonMatch[1] || responseContent;

    const generated = JSON.parse(jsonString);

    // Calculate ATS score
    const atsScore = calculateATSScore(data, generated, keywords);

    return {
      personalInfo: data.personalInfo,
      professionalSummary: generated.professionalSummary,
      experiences: generated.experiences,
      education: data.education,
      skills: generated.skills,
      keywords,
      atsScore,
      improvements: generated.improvements || [],
    };
  } catch (error: any) {
    console.error('Error generating resume:', error);
    throw new Error(`Failed to generate optimized resume: ${error.message || error}`);
  }
}

/**
 * Calculate ATS score for a resume
 */
export function calculateATSScore(
  originalData: ResumeData,
  optimizedData: any,
  jobKeywords: string[]
): number {
  let score = 0;

  // 1. Keyword Match (40 points)
  const resumeText = JSON.stringify(optimizedData).toLowerCase();
  const matchedKeywords = jobKeywords.filter(keyword =>
    resumeText.includes(keyword.toLowerCase())
  );
  const keywordScore = (matchedKeywords.length / jobKeywords.length) * 40;
  score += keywordScore;

  // 2. Complete Sections (20 points)
  if (optimizedData.professionalSummary) score += 5;
  if (optimizedData.experiences.length > 0) score += 10;
  if (optimizedData.education && originalData.education.length > 0) score += 3;
  if (optimizedData.skills) score += 2;

  // 3. Bullet Point Quality (20 points)
  const totalBullets = optimizedData.experiences.reduce(
    (sum: number, exp: any) => sum + exp.optimizedBullets.length,
    0
  );
  if (totalBullets >= 9) score += 20;
  else if (totalBullets >= 6) score += 15;
  else score += 10;

  // 4. Quantifiable Results (10 points)
  const hasNumbers = optimizedData.experiences.some((exp: any) =>
    exp.optimizedBullets.some((bullet: string) => /\d+/.test(bullet))
  );
  if (hasNumbers) score += 10;
  else score += 5;

  // 5. Action Verbs (10 points)
  const actionVerbs = [
    'led', 'developed', 'implemented', 'achieved', 'managed', 'created',
    'improved', 'increased', 'reduced', 'launched', 'designed', 'built'
  ];
  const hasActionVerbs = optimizedData.experiences.some((exp: any) =>
    exp.optimizedBullets.some((bullet: string) =>
      actionVerbs.some(verb => bullet.toLowerCase().includes(verb))
    )
  );
  if (hasActionVerbs) score += 10;
  else score += 5;

  return Math.min(100, Math.round(score));
}

/**
 * Generate cover letter for job application
 */
export async function generateCoverLetter(
  resumeData: ResumeData,
  companyName: string
): Promise<string> {
  const systemPrompt = `You are an expert at writing compelling cover letters that get interviews. Write personalized, enthusiastic cover letters that highlight the candidate's most relevant qualifications.`;

  const userPrompt = `Write a professional cover letter for this job application.

JOB DESCRIPTION:
${resumeData.jobDescription}

CANDIDATE:
Name: ${resumeData.personalInfo.name}
Headline: ${resumeData.personalInfo.headline || ''}

RELEVANT EXPERIENCE:
${resumeData.experiences.slice(0, 2).map(exp => `
- ${exp.title} at ${exp.company}: ${exp.description}
`).join('\n')}

COMPANY: ${companyName}

Requirements:
- 3-4 paragraphs
- Professional but warm tone
- Highlight 2-3 key qualifications that match the job
- Show enthusiasm for the role and company
- Strong opening and closing
- Do not include address block, just the letter body`;

  try {
    return await callAI(systemPrompt, userPrompt, { maxTokens: 800 });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    throw new Error('Failed to generate cover letter');
  }
}

export type PremiumAiFeature =
  | "resume_rewrite_pro"
  | "job_match_scoring"
  | "interview_simulation"
  | "salary_negotiation_scripts"
  | "advanced_ats_strategy";

export type PremiumAiRunInput = {
  feature: PremiumAiFeature;
  resume: {
    personalInfo?: Record<string, any>;
    professionalSummary?: string;
    experiences?: Array<Record<string, any>>;
    education?: Array<Record<string, any>>;
    skills?: { technical?: string[]; soft?: string[] };
    keywords?: string[];
  };
  jobDescription?: string;
  targetRole?: string;
  contextNote?: string;
};

const resumeRewriteProSchema = z.object({
  headline: z.string().optional().default(""),
  professionalSummary: z.string().default(""),
  experienceRewrites: z
    .array(
      z.object({
        role: z.string().default(""),
        company: z.string().default(""),
        improvedBullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
  highImpactEdits: z.array(z.string()).default([]),
});

const jobMatchScoringSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["low", "medium", "high"]),
  strengths: z.array(z.string()).default([]),
  gaps: z
    .array(
      z.object({
        theme: z.string(),
        whyItMatters: z.string(),
        whereToAdd: z.enum(["summary", "experience", "skills"]),
        suggestedBullet: z.string().default(""),
      })
    )
    .default([]),
  matchedSignals: z.array(z.string()).default([]),
});

const interviewSimulationSchema = z.object({
  interviewType: z.enum(["phone", "hiring-manager", "onsite"]),
  questions: z
    .array(
      z.object({
        question: z.string(),
        whatStrongAnswerIncludes: z.array(z.string()).default([]),
        followUps: z.array(z.string()).default([]),
      })
    )
    .default([]),
  coachTips: z.array(z.string()).default([]),
});

const salaryNegotiationSchema = z.object({
  targetCompensationStrategy: z.object({
    anchor: z.string(),
    justificationPoints: z.array(z.string()).default([]),
  }),
  emailScript: z.string(),
  liveCallScript: z.array(z.string()).default([]),
  fallbackOptions: z.array(z.string()).default([]),
});

const advancedAtsStrategySchema = z.object({
  priorityActions: z
    .array(
      z.object({
        title: z.string(),
        impact: z.enum(["high", "medium", "low"]),
        reason: z.string(),
        implementation: z.string(),
      })
    )
    .default([]),
  parseabilityChecks: z.array(z.string()).default([]),
  contentStrategy: z.array(z.string()).default([]),
  quickWins: z.array(z.string()).default([]),
  suggestedSummary: z.string().optional(),
  suggestedSkillKeywords: z.array(z.string()).optional(),
  experienceBulletPatches: z
    .array(
      z.object({
        role: z.string().default(""),
        company: z.string().default(""),
        addBullets: z.array(z.string()).default([]),
      })
    )
    .optional(),
});

export type ResumeRewriteProResult = z.infer<typeof resumeRewriteProSchema>;
export type JobMatchScoringResult = z.infer<typeof jobMatchScoringSchema>;
export type InterviewSimulationResult = z.infer<typeof interviewSimulationSchema>;
export type SalaryNegotiationResult = z.infer<typeof salaryNegotiationSchema>;
export type AdvancedAtsStrategyResult = z.infer<typeof advancedAtsStrategySchema>;
export type PremiumAiResult =
  | ResumeRewriteProResult
  | JobMatchScoringResult
  | InterviewSimulationResult
  | SalaryNegotiationResult
  | AdvancedAtsStrategyResult;

function extractJson(text: string) {
  const fenced =
    text.match(/```json\s*([\s\S]*?)\s*```/i) ||
    text.match(/```\s*([\s\S]*?)\s*```/);
  return fenced?.[1] || text;
}

function resumeContextText(resume: PremiumAiRunInput["resume"]) {
  const personal = resume.personalInfo || {};
  const experiences = Array.isArray(resume.experiences) ? resume.experiences : [];
  const education = Array.isArray(resume.education) ? resume.education : [];
  const technical = Array.isArray(resume.skills?.technical) ? resume.skills?.technical : [];
  const soft = Array.isArray(resume.skills?.soft) ? resume.skills?.soft : [];

  return `CANDIDATE
Name: ${personal.name || "Unknown"}
Headline: ${personal.headline || ""}
Location: ${personal.location || ""}

SUMMARY
${resume.professionalSummary || ""}

EXPERIENCE
${experiences
  .map((exp, index) => {
    const bullets = Array.isArray(exp?.optimizedBullets)
      ? exp.optimizedBullets
      : exp?.description
      ? [exp.description]
      : [];
    return `${index + 1}. ${exp?.title || ""} @ ${exp?.company || ""}
Dates: ${exp?.startDate || ""} - ${exp?.current ? "Present" : exp?.endDate || ""}
Bullets:
${bullets.map((bullet: string) => `- ${bullet}`).join("\n")}`;
  })
  .join("\n\n")}

EDUCATION
${education
  .map((item, index) => `${index + 1}. ${item?.degree || ""} - ${item?.institution || ""} (${item?.graduationDate || ""})`)
  .join("\n")}

SKILLS
Technical: ${technical.join(", ")}
Soft: ${soft.join(", ")}
Keywords: ${(resume.keywords || []).join(", ")}`;
}

export async function runPremiumAiFeature(input: PremiumAiRunInput) {
  const resumeText = resumeContextText(input.resume);
  const jobText = input.jobDescription || "";
  const roleText = input.targetRole || input.resume.personalInfo?.headline || "";
  const note = input.contextNote?.trim() || "";

  let taskInstruction = "";
  let jsonShape = "";

  if (input.feature === "resume_rewrite_pro") {
    taskInstruction = `Rewrite the resume at premium quality for ATS + recruiter readability.
- Keep truthfulness (no fabricated facts).
- Produce stronger summary and stronger bullets with action + impact.
- Preserve candidate voice and role level.`;
    jsonShape = `{
  "headline": "optional improved headline",
  "professionalSummary": "improved summary",
  "experienceRewrites": [
    {
      "role": "role",
      "company": "company",
      "improvedBullets": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ],
  "highImpactEdits": ["edit 1", "edit 2", "edit 3"]
}`;
  } else if (input.feature === "job_match_scoring") {
    taskInstruction = `Score semantic job-match quality between resume and target role/JD.
- Use semantic similarity, not only exact keywords.
- Explain strengths and gaps.
- Include insertion suggestions for missing themes.`;
    jsonShape = `{
  "score": 0,
  "verdict": "low|medium|high",
  "strengths": ["strength 1", "strength 2"],
  "gaps": [
    {
      "theme": "missing theme",
      "whyItMatters": "reason",
      "whereToAdd": "summary|experience|skills",
      "suggestedBullet": "concrete bullet"
    }
  ],
  "matchedSignals": ["signal 1", "signal 2"]
}`;
  } else if (input.feature === "interview_simulation") {
    taskInstruction = `Generate a realistic interview simulation pack.
- Include technical + behavioral + role-fit questions.
- Provide what a strong answer should include.
- Add follow-up probes.`;
    jsonShape = `{
  "interviewType": "phone|hiring-manager|onsite",
  "questions": [
    {
      "question": "question text",
      "whatStrongAnswerIncludes": ["point 1", "point 2"],
      "followUps": ["follow up 1", "follow up 2"]
    }
  ],
  "coachTips": ["tip 1", "tip 2"]
}`;
  } else if (input.feature === "salary_negotiation_scripts") {
    taskInstruction = `Generate salary negotiation scripts personalized to this profile.
- Include email script and live-call script.
- Include anchor, walk-away framing, and non-cash levers.
- Keep tone professional and assertive.`;
    jsonShape = `{
  "targetCompensationStrategy": {
    "anchor": "anchor statement",
    "justificationPoints": ["point 1", "point 2"]
  },
  "emailScript": "ready-to-send email",
  "liveCallScript": ["line 1", "line 2", "line 3"],
  "fallbackOptions": ["option 1", "option 2"]
}`;
  } else {
    taskInstruction = `Produce advanced ATS strategy recommendations with prioritized fixes.
- Separate parseability issues from content-quality issues.
- Give concrete before/after examples.
- Focus on highest ROI edits first.`;
    jsonShape = `{
  "priorityActions": [
    {
      "title": "action",
      "impact": "high|medium|low",
      "reason": "why",
      "implementation": "exact change"
    }
  ],
  "parseabilityChecks": ["check 1", "check 2"],
  "contentStrategy": ["strategy 1", "strategy 2"],
  "quickWins": ["quick win 1", "quick win 2"],
  "suggestedSummary": "optional improved summary",
  "suggestedSkillKeywords": ["keyword 1", "keyword 2"],
  "experienceBulletPatches": [
    {
      "role": "role",
      "company": "company",
      "addBullets": ["new bullet 1", "new bullet 2"]
    }
  ]
}`;
  }

  const systemPrompt = `You are a senior career strategist and resume expert. Return only valid JSON. Do not include markdown.`;
  const userPrompt = `${taskInstruction}

TARGET ROLE
${roleText}

JOB DESCRIPTION
${jobText}

ADDITIONAL CONTEXT
${note}

RESUME DATA
${resumeText}

Return ONLY JSON in this shape:
${jsonShape}`;

  const raw = await callAI(systemPrompt, userPrompt, { maxTokens: 2200, jsonMode: true });
  const parsed = JSON.parse(extractJson(raw));
  if (input.feature === "resume_rewrite_pro") return resumeRewriteProSchema.parse(parsed);
  if (input.feature === "job_match_scoring") return jobMatchScoringSchema.parse(parsed);
  if (input.feature === "interview_simulation") return interviewSimulationSchema.parse(parsed);
  if (input.feature === "salary_negotiation_scripts") return salaryNegotiationSchema.parse(parsed);
  return advancedAtsStrategySchema.parse(parsed);
}
