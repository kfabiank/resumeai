import { prisma } from "@/lib/prisma";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";

export type TemplatePlan = "free" | "pro" | "premium";

export type TemplateAccessRule = {
  free: boolean;
  pro: boolean;
  premium: boolean;
};

export type TemplateAccessMap = Record<string, TemplateAccessRule>;

function defaultRuleForTemplate(templateId: string): TemplateAccessRule {
  const template = TEMPLATE_CATALOG.find((t) => t.id === templateId);
  const isPremium = Boolean(template?.isPremium);
  if (isPremium) {
    return { free: false, pro: true, premium: true };
  }
  return { free: true, pro: true, premium: true };
}

export function getDefaultTemplateAccessMap(): TemplateAccessMap {
  const map: TemplateAccessMap = {};
  for (const template of TEMPLATE_CATALOG) {
    map[template.id] = defaultRuleForTemplate(template.id);
  }
  return map;
}

function sanitizeRule(raw: any, fallback: TemplateAccessRule): TemplateAccessRule {
  return {
    free: typeof raw?.free === "boolean" ? raw.free : fallback.free,
    pro: typeof raw?.pro === "boolean" ? raw.pro : fallback.pro,
    premium: typeof raw?.premium === "boolean" ? raw.premium : fallback.premium,
  };
}

function sanitizeOverrideMap(raw: any): TemplateAccessMap {
  const out: TemplateAccessMap = {};
  for (const template of TEMPLATE_CATALOG) {
    const fallback = defaultRuleForTemplate(template.id);
    out[template.id] = sanitizeRule(raw?.[template.id], fallback);
  }
  return out;
}

export async function getStoredTemplateAccessOverride(): Promise<TemplateAccessMap | null> {
  try {
    const rows = await prisma.templatePlanAccess.findMany();
    if (!rows.length) return null;

    const map = getDefaultTemplateAccessMap();
    for (const row of rows) {
      const template = TEMPLATE_CATALOG.find((t) => t.id === row.templateId);
      if (!template) continue;
      if (row.planType !== "free" && row.planType !== "pro" && row.planType !== "premium") continue;
      map[row.templateId][row.planType] = row.isEnabled;
    }
    return map;
  } catch {
    // If DB/model is temporarily out of sync, fallback to defaults instead of breaking admin UI.
    return null;
  }
}

export async function getEffectiveTemplateAccessMap(): Promise<TemplateAccessMap> {
  const defaults = getDefaultTemplateAccessMap();
  const override = await getStoredTemplateAccessOverride();
  if (!override) return defaults;
  return override;
}

export function canPlanUseTemplate(
  plan: string,
  templateId: string,
  map: TemplateAccessMap
): boolean {
  const rule = map[templateId] || defaultRuleForTemplate(templateId);
  if (plan === "premium") return rule.premium;
  if (plan === "pro") return rule.pro;
  return rule.free;
}

export async function canUserPlanUseTemplate(plan: string, templateId: string): Promise<boolean> {
  const map = await getEffectiveTemplateAccessMap();
  return canPlanUseTemplate(plan, templateId, map);
}

export async function saveTemplateAccessOverride(userId: string, override: unknown) {
  const sanitized = sanitizeOverrideMap(override);
  const operations = Object.entries(sanitized).flatMap(([templateId, rule]) => {
    const plans: Array<{ planType: TemplatePlan; isEnabled: boolean }> = [
      { planType: "free", isEnabled: rule.free },
      { planType: "pro", isEnabled: rule.pro },
      { planType: "premium", isEnabled: rule.premium },
    ];

    return plans.map((item) =>
      prisma.templatePlanAccess.upsert({
        where: {
          templateId_planType: {
            templateId,
            planType: item.planType,
          },
        },
        create: {
          templateId,
          planType: item.planType,
          isEnabled: item.isEnabled,
          updatedByUserId: userId,
        },
        update: {
          isEnabled: item.isEnabled,
          updatedByUserId: userId,
        },
      })
    );
  });

  await prisma.$transaction(operations);
  return sanitized;
}
