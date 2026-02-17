const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeUrl(rawUrl?: string): string {
  const candidate = (rawUrl || DEFAULT_SITE_URL).trim();
  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
);

export const siteName = "ResumeAI";
export const defaultTitle = "ResumeAI | AI Resume Builder for ATS-Optimized CVs";
export const defaultDescription =
  "Build ATS-optimized resumes with AI, track applications, and export professional CVs in minutes.";

export const defaultKeywords = [
  "AI resume builder",
  "ATS resume",
  "resume optimization",
  "CV builder",
  "cover letter generator",
  "job application tracker",
  "resume templates",
  "resume maker",
];
