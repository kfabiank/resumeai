export interface TemplateCatalogItem {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  isPremium: boolean;
  isPopular?: boolean;
  colors: string;
}

export const TEMPLATE_CATALOG: TemplateCatalogItem[] = [
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Clean and contemporary design perfect for corporate roles.',
    category: 'professional',
    categoryLabel: 'Professional',
    isPremium: false,
    isPopular: true,
    colors: 'from-blue-500 to-blue-700',
  },
  {
    id: 'tech-minimal',
    name: 'Tech Minimal',
    description: 'Sleek layout optimized for tech and startup positions.',
    category: 'tech',
    categoryLabel: 'Tech',
    isPremium: false,
    colors: 'from-slate-600 to-slate-800',
  },
  {
    id: 'executive-classic',
    name: 'Executive Classic',
    description: 'Elegant template for senior leadership positions.',
    category: 'executive',
    categoryLabel: 'Executive',
    isPremium: true,
    colors: 'from-gray-700 to-gray-900',
  },
  {
    id: 'creative-bold',
    name: 'Creative Bold',
    description: 'Eye-catching style for marketing and creative roles.',
    category: 'creative',
    categoryLabel: 'Creative',
    isPremium: true,
    colors: 'from-fuchsia-500 to-rose-700',
  },
  {
    id: 'simple-clean',
    name: 'Simple Clean',
    description: 'Minimal design that keeps focus on experience.',
    category: 'modern',
    categoryLabel: 'Modern',
    isPremium: false,
    colors: 'from-teal-500 to-teal-700',
  },
  {
    id: 'startup-modern',
    name: 'Startup Modern',
    description: 'Dynamic and modern structure for fast-paced companies.',
    category: 'tech',
    categoryLabel: 'Tech',
    isPremium: true,
    colors: 'from-orange-500 to-orange-700',
  },
  {
    id: 'consultant-pro',
    name: 'Consultant Pro',
    description: 'Structured format for consulting and advisory profiles.',
    category: 'professional',
    categoryLabel: 'Professional',
    isPremium: true,
    colors: 'from-indigo-500 to-indigo-700',
  },
  {
    id: 'academic-formal',
    name: 'Academic Formal',
    description: 'Traditional format for research and academic careers.',
    category: 'academic',
    categoryLabel: 'Academic',
    isPremium: false,
    colors: 'from-green-600 to-green-800',
  },
];

export const DEFAULT_TEMPLATE_ID = 'modern-professional';

export const TEMPLATE_ID_SET = new Set(TEMPLATE_CATALOG.map((t) => t.id));

export function isTemplateId(value: string): boolean {
  return TEMPLATE_ID_SET.has(value);
}

export function getTemplateById(value: string) {
  return TEMPLATE_CATALOG.find((t) => t.id === value);
}
