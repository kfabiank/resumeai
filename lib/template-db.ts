import { prisma } from '@/lib/prisma';
import { getTemplateById, isTemplateId } from '@/lib/template-catalog';

export async function ensureTemplateExists(templateId: string) {
  if (!isTemplateId(templateId)) {
    throw new Error('Invalid templateId');
  }

  const selectedTemplate = getTemplateById(templateId);
  if (!selectedTemplate) {
    throw new Error('Template not found in catalog');
  }

  await prisma.template.upsert({
    where: { id: selectedTemplate.id },
    update: {
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      category: selectedTemplate.category,
      isPremium: selectedTemplate.isPremium,
      isActive: true,
    },
    create: {
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      category: selectedTemplate.category,
      thumbnail: '',
      htmlStructure: `<div>${selectedTemplate.name}</div>`,
      cssStyles: '',
      colorScheme: {
        gradient: selectedTemplate.colors,
      },
      isPremium: selectedTemplate.isPremium,
      isActive: true,
    },
  });
}
