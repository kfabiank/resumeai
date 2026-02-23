import ModernTemplate from '@/app/lovable-templates/ModernTemplate';
import TechTemplate from '@/app/lovable-templates/TechTemplate';
import ExecutiveTemplate from '@/app/lovable-templates/ExecutiveTemplate';
import CreativeTemplate from '@/app/lovable-templates/CreativeTemplate';
import AcademicTemplate from '@/app/lovable-templates/AcademicTemplate';
import AccountantTemplate from '@/app/lovable-templates/AccountantTemplate';
import ConsultantTemplate from '@/app/lovable-templates/ConsultantTemplate';
import DataScienceTemplate from '@/app/lovable-templates/DataScienceTemplate';
import DevOpsTemplate from '@/app/lovable-templates/DevOpsTemplate';
import FinanceTemplate from '@/app/lovable-templates/FinanceTemplate';
import FrontEndTemplate from '@/app/lovable-templates/FrontEndTemplate';
import LegalTemplate from '@/app/lovable-templates/LegalTemplate';
import MarketingTemplate from '@/app/lovable-templates/MarketingTemplate';
import MedicalTemplate from '@/app/lovable-templates/MedicalTemplate';
import NurseTemplate from '@/app/lovable-templates/NurseTemplate';
import ParalegalTemplate from '@/app/lovable-templates/ParalegalTemplate';
import ProductManagerTemplate from '@/app/lovable-templates/ProductManagerTemplate';
import SalesTemplate from '@/app/lovable-templates/SalesTemplate';
import StartupTemplate from '@/app/lovable-templates/StartupTemplate';
import UXDesignerTemplate from '@/app/lovable-templates/UXDesignerTemplate';
import BoardroomTemplate from '@/app/lovable-templates/BoardroomTemplate';
import ImpactTemplate from '@/app/lovable-templates/ImpactTemplate';
import Batch3Template from '@/app/lovable-templates/Batch3Template';
import type { ResumeData } from '@/types/resume';

type Props = {
  templateId?: string;
  data: ResumeData;
};

const COMMON_LANGUAGES = [
  "english",
  "spanish",
  "french",
  "german",
  "portuguese",
  "italian",
  "mandarin",
  "chinese",
  "japanese",
  "korean",
  "arabic",
  "hindi",
  "russian",
];

function parseLanguageLabel(raw: string) {
  const text = `${raw || ""}`.trim();
  if (!text) return null;
  const match = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { name: match[1].trim(), level: match[2].trim(), label: text };
  }
  return { name: text, level: "", label: text };
}

function looksLikeLanguage(raw: string) {
  const parsed = parseLanguageLabel(raw);
  if (!parsed) return false;
  const lower = parsed.name.toLowerCase();
  return COMMON_LANGUAGES.some((lang) => lower === lang || lower.startsWith(`${lang} `));
}

export default function TemplateRenderer({ templateId, data }: Props) {
  const normalizedLanguages = (data.languages || [])
    .map((lang: any) => ({
      name: typeof lang === "string" ? lang : lang?.name || lang?.language || "",
      level: typeof lang === "string" ? "" : lang?.level || lang?.proficiency || "",
    }))
    .filter((lang) => lang.name);

  const softSkillsRaw = Array.isArray(data.skills?.soft) ? data.skills.soft : [];
  const inferredLanguages =
    normalizedLanguages.length > 0
      ? []
      : softSkillsRaw
          .filter((skill) => looksLikeLanguage(skill))
          .map((skill) => parseLanguageLabel(skill))
          .filter(Boolean)
          .map((lang) => ({ name: lang!.name, level: lang!.level }));

  const finalLanguages = normalizedLanguages.length > 0 ? normalizedLanguages : inferredLanguages;
  const languageLabelSet = new Set(
    finalLanguages
      .map((lang) => `${lang.name}${lang.level ? ` (${lang.level})` : ""}`.toLowerCase().trim())
      .filter(Boolean)
  );
  const cleanSoftSkills = softSkillsRaw.filter(
    (skill) =>
      !languageLabelSet.has(`${skill || ""}`.toLowerCase().trim()) &&
      !looksLikeLanguage(skill)
  );

  const normalizedData: ResumeData = {
    ...data,
    languages: finalLanguages,
    skills: {
      technical: Array.isArray(data.skills?.technical) ? data.skills.technical : [],
      soft: cleanSoftSkills,
    },
  };

  switch (templateId) {
    case 'tech-minimal':
    case 'startup-modern':
      return <TechTemplate data={normalizedData} />;
    case 'startup-template':
      return <StartupTemplate data={normalizedData} />;
    case 'data-science-template':
      return <DataScienceTemplate data={normalizedData} />;
    case 'devops-template':
      return <DevOpsTemplate data={normalizedData} />;
    case 'frontend-template':
      return <FrontEndTemplate data={normalizedData} />;
    case 'executive-classic':
      return <ExecutiveTemplate data={normalizedData} />;
    case 'creative-bold':
      return <CreativeTemplate data={normalizedData} />;
    case 'ux-designer-template':
      return <UXDesignerTemplate data={normalizedData} />;
    case 'marketing-template':
      return <MarketingTemplate data={normalizedData} />;
    case 'academic-formal':
      return <AcademicTemplate data={normalizedData} />;
    case 'accountant-template':
      return <AccountantTemplate data={normalizedData} />;
    case 'consultant-template':
      return <ConsultantTemplate data={normalizedData} />;
    case 'finance-template':
      return <FinanceTemplate data={normalizedData} />;
    case 'legal-template':
      return <LegalTemplate data={normalizedData} />;
    case 'paralegal-template':
      return <ParalegalTemplate data={normalizedData} />;
    case 'medical-template':
      return <MedicalTemplate data={normalizedData} />;
    case 'nurse-template':
      return <NurseTemplate data={normalizedData} />;
    case 'product-manager-template':
      return <ProductManagerTemplate data={normalizedData} />;
    case 'sales-template':
      return <SalesTemplate data={normalizedData} />;
    case 'boardroom-template':
      return <BoardroomTemplate data={normalizedData} />;
    case 'impact-template':
      return <ImpactTemplate data={normalizedData} />;
    case 'noir-elegance':
    case 'swiss-precision':
    case 'architect-blueprint':
    case 'vogue-editorial':
    case 'carbon-terminal':
      return <Batch3Template templateId={templateId || ""} data={normalizedData} />;
    case 'consultant-pro':
      return <ConsultantTemplate data={normalizedData} />;
    case 'simple-clean':
    case 'modern-professional':
    default:
      return <ModernTemplate data={normalizedData} />;
  }
}
