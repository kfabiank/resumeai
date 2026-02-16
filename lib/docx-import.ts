export type ImportedExperience = {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  optimizedBullets: string[];
  keywordsUsed: string[];
};

export type ImportedEducation = {
  degree: string;
  institution: string;
  location?: string;
  graduationDate: string;
  gpa?: string;
};

export type ImportedResumeContent = {
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
  experiences: ImportedExperience[];
  education: ImportedEducation[];
  skills: {
    technical: string[];
    soft: string[];
  };
  keywords: string[];
};

const SOFT_SKILL_SET = new Set(
  [
    "communication",
    "leadership",
    "teamwork",
    "problem solving",
    "critical thinking",
    "time management",
    "collaboration",
    "adaptability",
    "mentoring",
    "ownership",
    "stakeholder management",
    "negotiation",
  ].map((v) => v.toLowerCase())
);

function splitNonEmptyLines(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] || "";
}

function extractPhone(text: string) {
  const match = text.match(/(\+?\d[\d\s().-]{7,}\d)/);
  return match?.[0] || "";
}

function extractLinkedIn(text: string) {
  const urlMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i);
  if (urlMatch?.[0]) return urlMatch[0];
  const bareMatch = text.match(/(?:www\.)?linkedin\.com\/[^\s)]+/i);
  return bareMatch?.[0] ? `https://${bareMatch[0].replace(/^https?:\/\//i, "")}` : "";
}

function looksLikeHeading(line: string) {
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  return (
    normalized === "summary" ||
    normalized === "professional summary" ||
    normalized === "experience" ||
    normalized === "work experience" ||
    normalized === "employment" ||
    normalized === "education" ||
    normalized === "skills" ||
    normalized === "technical skills"
  );
}

function sectionKey(line: string): "summary" | "experience" | "education" | "skills" | null {
  const normalized = line.toLowerCase().replace(/[^a-z\s]/g, "").trim();
  if (normalized === "summary" || normalized === "professional summary") return "summary";
  if (normalized === "experience" || normalized === "work experience" || normalized === "employment") {
    return "experience";
  }
  if (normalized === "education") return "education";
  if (normalized === "skills" || normalized === "technical skills") return "skills";
  return null;
}

function splitBlocksByEmptyLine(raw: string) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

function parseExperienceBlocks(raw: string): ImportedExperience[] {
  const blocks = splitBlocksByEmptyLine(raw);
  const parsed = blocks
    .map((block) => {
      const lines = splitNonEmptyLines(block);
      if (!lines.length) return null;

      const first = lines[0];
      let title = "";
      let company = "";
      if (/\sat\s/i.test(first)) {
        const [left, ...right] = first.split(/\sat\s/i);
        title = left.trim();
        company = right.join(" at ").trim();
      } else if (first.includes(" - ")) {
        const [left, ...right] = first.split(" - ");
        title = left.trim();
        company = right.join(" - ").trim();
      } else {
        title = first.trim();
      }

      const bulletLines = lines
        .slice(1)
        .filter((line) => /^[-*•]\s*/.test(line))
        .map((line) => line.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean);

      const fallbackLines = lines
        .slice(1)
        .filter((line) => !/^[-*•]\s*/.test(line))
        .filter(Boolean);

      const optimizedBullets = bulletLines.length
        ? bulletLines
        : fallbackLines.length
        ? [fallbackLines.join(" ")]
        : [];

      const dateLine = lines.find((line) => /(?:19|20)\d{2}/.test(line)) || "";
      const dateTokens = [...dateLine.matchAll(/(19|20)\d{2}/g)].map((m) => m[0]);
      const startDate = dateTokens[0] ? `${dateTokens[0]}-01` : "";
      const endDate = /present|current/i.test(dateLine)
        ? ""
        : dateTokens[1]
        ? `${dateTokens[1]}-01`
        : "";

      return {
        title: title || "Role",
        company: company || "Company",
        location: "",
        startDate,
        endDate,
        current: /present|current/i.test(dateLine),
        optimizedBullets,
        keywordsUsed: [],
      } as ImportedExperience;
    })
    .filter((item): item is ImportedExperience => Boolean(item));

  return parsed.length
    ? parsed
    : [
        {
          title: "Role",
          company: "Company",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          optimizedBullets: [],
          keywordsUsed: [],
        },
      ];
}

function parseEducationBlocks(raw: string): ImportedEducation[] {
  const blocks = splitBlocksByEmptyLine(raw);
  const parsed = blocks
    .map((block) => {
      const lines = splitNonEmptyLines(block);
      if (!lines.length) return null;
      const first = lines[0];
      let degree = first;
      let institution = "";
      if (first.includes(",")) {
        const [left, ...right] = first.split(",");
        degree = left.trim();
        institution = right.join(",").trim();
      }
      const dateLine = lines.find((line) => /(?:19|20)\d{2}/.test(line)) || "";
      const dateMatch = dateLine.match(/(19|20)\d{2}/);
      return {
        degree: degree || "Degree",
        institution: institution || lines[1] || "Institution",
        location: "",
        graduationDate: dateMatch ? `${dateMatch[0]}-01` : "",
        gpa: "",
      } as ImportedEducation;
    })
    .filter((item): item is ImportedEducation => Boolean(item));

  return parsed.length
    ? parsed
    : [
        {
          degree: "Degree",
          institution: "Institution",
          location: "",
          graduationDate: "",
          gpa: "",
        },
      ];
}

function parseSkills(raw: string) {
  const tokens = raw
    .replace(/\n/g, ",")
    .split(/[;,]/g)
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const unique = Array.from(new Set(tokens));
  const technical: string[] = [];
  const soft: string[] = [];
  for (const skill of unique) {
    if (SOFT_SKILL_SET.has(skill.toLowerCase())) {
      soft.push(skill);
    } else {
      technical.push(skill);
    }
  }
  return { technical, soft };
}

export function parseDocxTextToResumeContent(rawText: string): ImportedResumeContent {
  const text = rawText || "";
  const allLines = splitNonEmptyLines(text);
  const head = allLines.slice(0, 12).join("\n");

  const sections: Record<"summary" | "experience" | "education" | "skills", string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
  };

  let currentSection: keyof typeof sections | null = null;
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (currentSection) sections[currentSection].push("");
      continue;
    }
    const key = sectionKey(line);
    if (key) {
      currentSection = key;
      continue;
    }
    if (currentSection) {
      sections[currentSection].push(line);
    }
  }

  const firstLine = allLines.find((line) => !looksLikeHeading(line)) || "";
  const secondLine = allLines.find((line, idx) => idx > 0 && !looksLikeHeading(line)) || "";
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const linkedin = extractLinkedIn(text);

  let location = "";
  const headerComposite = head.split("\n").slice(0, 4).join(" | ");
  if (headerComposite.includes("|")) {
    const chunks = headerComposite
      .split("|")
      .map((c) => c.trim())
      .filter(Boolean);
    location =
      chunks.find(
        (c) =>
          !c.includes("@") &&
          !/\d{3}/.test(c) &&
          !/linkedin\.com/i.test(c) &&
          c.length > 2 &&
          c.length < 40
      ) || "";
  }

  const summaryText = sections.summary.join("\n").trim();
  const experienceText = sections.experience.join("\n").trim();
  const educationText = sections.education.join("\n").trim();
  const skillsText = sections.skills.join("\n").trim();

  const experiences = parseExperienceBlocks(experienceText);
  const education = parseEducationBlocks(educationText);
  const skills = parseSkills(skillsText);

  const keywordPool = new Set<string>();
  [...skills.technical, ...skills.soft].forEach((s) => keywordPool.add(s.toLowerCase()));
  experiences.forEach((exp) => {
    exp.optimizedBullets.forEach((b) => {
      b.split(/\W+/)
        .map((word) => word.toLowerCase())
        .filter((word) => word.length > 4)
        .forEach((word) => keywordPool.add(word));
    });
  });

  return {
    personalInfo: {
      name: firstLine || "Imported Candidate",
      email,
      phone,
      location,
      linkedin,
      portfolio: "",
      headline:
        secondLine && secondLine !== firstLine && !secondLine.includes("@")
          ? secondLine
          : experiences[0]?.title || "",
    },
    professionalSummary: summaryText || "Imported from resume file.",
    experiences,
    education,
    skills,
    keywords: Array.from(keywordPool).slice(0, 20),
  };
}
