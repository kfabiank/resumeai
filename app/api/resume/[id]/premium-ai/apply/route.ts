import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { PLAN_FEATURES } from "@/lib/stripe";
import type { PremiumAiFeature } from "@/lib/ai-service";

function normalizeBullets(raw: any): string[] {
  return (Array.isArray(raw) ? raw : [])
    .map((item) => `${item || ""}`.trim())
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        content: true,
        user: { select: { planType: true } },
      },
    });
    if (!resume) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    if (resume.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const planType = resume.user.planType || "free";
    const hasPremiumAi =
      PLAN_FEATURES[planType as keyof typeof PLAN_FEATURES]?.aiResumeRewritePro &&
      PLAN_FEATURES[planType as keyof typeof PLAN_FEATURES]?.advancedAtsRecommendations;
    if (!hasPremiumAi) {
      return NextResponse.json(
        { error: "Upgrade required", message: "This action requires Premium plan." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      feature?: PremiumAiFeature;
      result?: any;
    };
    const feature = body.feature;
    const result = body.result;
    if (!feature || !result) {
      return NextResponse.json({ error: "Missing feature/result" }, { status: 400 });
    }
    if (feature !== "resume_rewrite_pro" && feature !== "advanced_ats_strategy") {
      return NextResponse.json(
        { error: "Apply not supported for this feature" },
        { status: 400 }
      );
    }

    const content = ((resume.content || {}) as any) || {};
    const nextContent = {
      ...content,
      personalInfo: { ...(content.personalInfo || {}) },
      experiences: Array.isArray(content.experiences) ? [...content.experiences] : [],
      skills: {
        technical: Array.isArray(content.skills?.technical) ? [...content.skills.technical] : [],
        soft: Array.isArray(content.skills?.soft) ? [...content.skills.soft] : [],
      },
    };

    if (feature === "resume_rewrite_pro") {
      if (typeof result.professionalSummary === "string" && result.professionalSummary.trim()) {
        nextContent.professionalSummary = result.professionalSummary.trim();
      }
      if (typeof result.headline === "string" && result.headline.trim()) {
        nextContent.personalInfo.headline = result.headline.trim();
      }
      const rewrites = Array.isArray(result.experienceRewrites) ? result.experienceRewrites : [];
      for (const patch of rewrites) {
        const role = `${patch?.role || ""}`.trim().toLowerCase();
        const company = `${patch?.company || ""}`.trim().toLowerCase();
        const bullets = normalizeBullets(patch?.improvedBullets);
        if (!bullets.length) continue;

        const idx = nextContent.experiences.findIndex(
          (exp: any) =>
            `${exp?.title || ""}`.trim().toLowerCase() === role &&
            `${exp?.company || ""}`.trim().toLowerCase() === company
        );
        if (idx >= 0) {
          nextContent.experiences[idx] = {
            ...nextContent.experiences[idx],
            optimizedBullets: bullets,
          };
        }
      }
    }

    if (feature === "advanced_ats_strategy") {
      if (typeof result.suggestedSummary === "string" && result.suggestedSummary.trim()) {
        nextContent.professionalSummary = result.suggestedSummary.trim();
      }
      const suggestedKeywords = normalizeBullets(result.suggestedSkillKeywords);
      for (const keyword of suggestedKeywords) {
        if (!nextContent.skills.technical.some((s: string) => s.toLowerCase() === keyword.toLowerCase())) {
          nextContent.skills.technical.push(keyword);
        }
      }
      const patches = Array.isArray(result.experienceBulletPatches) ? result.experienceBulletPatches : [];
      for (const patch of patches) {
        const role = `${patch?.role || ""}`.trim().toLowerCase();
        const company = `${patch?.company || ""}`.trim().toLowerCase();
        const addBullets = normalizeBullets(patch?.addBullets);
        if (!addBullets.length) continue;
        const idx = nextContent.experiences.findIndex(
          (exp: any) =>
            `${exp?.title || ""}`.trim().toLowerCase() === role &&
            `${exp?.company || ""}`.trim().toLowerCase() === company
        );
        if (idx >= 0) {
          const existing = Array.isArray(nextContent.experiences[idx]?.optimizedBullets)
            ? nextContent.experiences[idx].optimizedBullets
            : [];
          const merged = [...existing];
          for (const bullet of addBullets) {
            if (!merged.some((item: string) => item.toLowerCase() === bullet.toLowerCase())) {
              merged.push(bullet);
            }
          }
          nextContent.experiences[idx] = {
            ...nextContent.experiences[idx],
            optimizedBullets: merged,
          };
        }
      }
    }

    const updated = await prisma.resume.update({
      where: { id: resume.id },
      data: {
        content: nextContent,
      },
      select: { id: true, content: true, updatedAt: true },
    });

    await prisma.usageLog.create({
      data: {
        userId,
        actionType: "ai_feature_applied",
        metadata: {
          resumeId: resume.id,
          feature,
        },
      },
    });

    return NextResponse.json({
      success: true,
      resumeId: updated.id,
      updatedAt: updated.updatedAt,
      content: updated.content,
    });
  } catch (error: any) {
    console.error("Premium AI apply API error:", error);
    return NextResponse.json(
      {
        error: "Failed to apply premium AI result",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

