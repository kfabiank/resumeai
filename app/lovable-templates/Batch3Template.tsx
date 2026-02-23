import { premiumTemplatesBatch3 } from "@/lib/premiumTemplatesBatch3";
import type { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  templateId: string;
  data: ResumeData;
}

type Context = Record<string, any>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function lookupRaw(path: string, stack: any[]): any {
  if (path === ".") return stack[0];
  const parts = path.split(".");
  for (const ctx of stack) {
    if (ctx == null) continue;
    let value: any = ctx;
    let found = true;
    for (const part of parts) {
      if (part === "length") {
        value = value?.length;
        continue;
      }
      if (value && Object.prototype.hasOwnProperty.call(value, part)) {
        value = value[part];
      } else {
        found = false;
        break;
      }
    }
    if (found) return value;
  }
  return "";
}

function findMatchingClose(template: string, key: string, openEndIndex: number) {
  const tagRe = /{{\s*(#|\/)\s*([a-zA-Z0-9_.]+)\s*}}/g;
  tagRe.lastIndex = openEndIndex;
  let depth = 1;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(template)) !== null) {
    const [full, marker, name] = match;
    if (name !== key) continue;
    if (marker === "#") depth += 1;
    if (marker === "/") depth -= 1;
    if (depth === 0) {
      return {
        start: match.index,
        end: match.index + full.length,
      };
    }
  }
  return null;
}

function renderMustache(template: string, stack: any[]): string {
  const openRe = /{{\s*#\s*([a-zA-Z0-9_.]+)\s*}}/;
  const openMatch = template.match(openRe);
  if (openMatch && openMatch.index != null) {
    const key = openMatch[1];
    const openStart = openMatch.index;
    const openEnd = openStart + openMatch[0].length;
    const closePos = findMatchingClose(template, key, openEnd);
    if (closePos) {
      const before = template.slice(0, openStart);
      const inner = template.slice(openEnd, closePos.start);
      const after = template.slice(closePos.end);
      const value = lookupRaw(key, stack);

      let sectionRendered = "";
      const hasSameNestedTag = inner.includes(`{{#${key}}}`);
      if (Array.isArray(value)) {
        if (hasSameNestedTag) {
          sectionRendered = value.length > 0 ? renderMustache(inner, stack) : "";
        } else {
          sectionRendered = value.map((item) => renderMustache(inner, [item, ...stack])).join("");
        }
      } else if (value && typeof value === "object") {
        sectionRendered = renderMustache(inner, [value, ...stack]);
      } else if (value) {
        sectionRendered = renderMustache(inner, stack);
      }

      return renderMustache(before + sectionRendered + after, stack);
    }
  }

  return template.replace(/{{\s*([^{}]+?)\s*}}/g, (_, rawToken: string) => {
    const token = rawToken.trim();
    if (token.startsWith("#") || token.startsWith("/")) return "";

    const [rawPath, ...filters] = token.split("|").map((part) => part.trim());
    const rawValue = lookupRaw(rawPath, stack);
    let value = rawValue == null ? "" : String(rawValue);

    for (const filter of filters) {
      if (filter === "lowercase") value = value.toLowerCase();
      if (filter === "uppercase") value = value.toUpperCase();
    }

    return escapeHtml(value);
  });
}

function extractYear(value: string) {
  const normalized = `${value || ""}`.trim();
  const yearMatch = normalized.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return yearMatch[0];
  const formatted = formatDate(normalized);
  const formattedYear = formatted.match(/\b(19|20)\d{2}\b/);
  return formattedYear ? formattedYear[0] : formatted || "";
}

function mapToBatch3Context(data: ResumeData): Context {
  const fullName = `${data.personalInfo?.name || ""}`.trim() || "John Doe";
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(" ") || "Doe";

  const experience = (data.experiences || []).map((exp: any) => ({
    title: exp?.title || "",
    company: exp?.company || "",
    location: exp?.location || "",
    startDate: formatDate(exp?.startDate || ""),
    endDate: exp?.current ? "Present" : formatDate(exp?.endDate || ""),
    description: Array.isArray(exp?.optimizedBullets) ? exp.optimizedBullets.join(" ") : "",
  }));

  const education = (data.education || []).map((edu: any) => ({
    degree: edu?.degree || "",
    institution: edu?.institution || "",
    graduationYear: extractYear(edu?.graduationDate || ""),
    gpa: edu?.gpa || "",
  }));

  const certifications = (data.certifications || []).map((cert: any) => ({
    name: cert?.name || "",
    issuer: cert?.issuer || "",
    date: cert?.issueDate ? formatDate(cert.issueDate) : "",
  }));
  const languages = (data.languages || [])
    .map((lang: any) => {
      if (typeof lang === "string") return lang.trim();
      const name = `${lang?.name || lang?.language || ""}`.trim();
      const level = `${lang?.level || lang?.proficiency || ""}`.trim();
      if (!name) return "";
      return level ? `${name} (${level})` : name;
    })
    .filter(Boolean);

  return {
    firstName,
    lastName,
    email: data.personalInfo?.email || "",
    phone: data.personalInfo?.phone || "",
    location: data.personalInfo?.location || "",
    summary: data.professionalSummary || data.personalInfo?.headline || "",
    experience,
    education,
    skills: Array.isArray(data.skills?.technical) ? data.skills.technical : [],
    languages,
    certifications,
  };
}

export default function Batch3Template({ templateId, data }: Props) {
  const template = premiumTemplatesBatch3.find((item) => item.id === templateId);
  if (!template) return null;

  const context = mapToBatch3Context(data);
  const renderedHtml = renderMustache(template.htmlContent, [context]);

  return (
    <div className="a4-page min-h-[1123px] overflow-hidden">
      <style>{template.cssContent}</style>
      <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </div>
  );
}
