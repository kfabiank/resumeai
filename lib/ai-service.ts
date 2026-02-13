import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

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
