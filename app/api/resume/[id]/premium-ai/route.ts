import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { PLAN_FEATURES } from "@/lib/stripe";
import { runPremiumAiFeature, type PremiumAiFeature } from "@/lib/ai-service";

type FeatureFlagKey =
  | "aiResumeRewritePro"
  | "aiJobMatchScoring"
  | "aiInterviewSimulation"
  | "aiSalaryNegotiationScripts"
  | "advancedAtsRecommendations";

const FEATURE_FLAG_BY_ACTION: Record<PremiumAiFeature, FeatureFlagKey> = {
  resume_rewrite_pro: "aiResumeRewritePro",
  job_match_scoring: "aiJobMatchScoring",
  interview_simulation: "aiInterviewSimulation",
  salary_negotiation_scripts: "aiSalaryNegotiationScripts",
  advanced_ats_strategy: "advancedAtsRecommendations",
};

const ACTION_TYPE_BY_FEATURE: Record<PremiumAiFeature, string> = {
  resume_rewrite_pro: "ai_rewrite_pro",
  job_match_scoring: "ai_job_match",
  interview_simulation: "ai_interview_simulation",
  salary_negotiation_scripts: "ai_salary_script",
  advanced_ats_strategy: "ai_ats_strategy",
};

const PREMIUM_FEATURE_MONTHLY_LIMITS: Record<PremiumAiFeature, number> = {
  resume_rewrite_pro: 40,
  job_match_scoring: 60,
  interview_simulation: 60,
  salary_negotiation_scripts: 30,
  advanced_ats_strategy: 40,
};

function monthStartUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
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
        jobTitle: true,
        jobDescription: true,
        content: true,
        customizations: true,
        user: { select: { planType: true } },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    if (resume.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      feature?: PremiumAiFeature;
      content?: any;
      jobDescription?: string;
      targetRole?: string;
      contextNote?: string;
    };

    const feature = body.feature;
    if (!feature || !(feature in FEATURE_FLAG_BY_ACTION)) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    const planType = resume.user.planType || "free";
    const featureFlag = FEATURE_FLAG_BY_ACTION[feature];
    const hasAccess =
      PLAN_FEATURES[planType as keyof typeof PLAN_FEATURES]?.[featureFlag] ?? false;
    if (!hasAccess) {
      return NextResponse.json(
        {
          error: "Upgrade required",
          message: "This AI feature is available on Premium plan.",
          requiredPlan: "premium",
        },
        { status: 403 }
      );
    }

    const startOfMonth = monthStartUtc();
    const actionType = ACTION_TYPE_BY_FEATURE[feature];
    const monthlyLimit = PREMIUM_FEATURE_MONTHLY_LIMITS[feature];
    const usedThisMonth = await prisma.usageLog.count({
      where: {
        userId,
        actionType,
        timestamp: { gte: startOfMonth },
      },
    });
    if (usedThisMonth >= monthlyLimit) {
      return NextResponse.json(
        {
          error: "Premium AI monthly limit reached",
          message: `You reached your monthly limit for ${feature}.`,
          usage: {
            used: usedThisMonth,
            limit: monthlyLimit,
            remaining: 0,
          },
        },
        { status: 429 }
      );
    }

    const result = await runPremiumAiFeature({
      feature,
      resume: (body.content || resume.content || {}) as any,
      jobDescription: body.jobDescription || resume.jobDescription || "",
      targetRole: body.targetRole || resume.jobTitle || "",
      contextNote: body.contextNote || "",
    });

    const usageLog = await prisma.usageLog.create({
      data: {
        userId,
        actionType,
        metadata: {
          resumeId: resume.id,
          feature,
          planType,
          result,
        },
      },
    });

    const existingCustomizations =
      resume.customizations && typeof resume.customizations === "object"
        ? (resume.customizations as Record<string, any>)
        : {};
    const history = Array.isArray(existingCustomizations.premiumAiHistory)
      ? existingCustomizations.premiumAiHistory
      : [];
    const nextHistory = [
      ...history,
      {
        id: usageLog.id,
        feature,
        timestamp: new Date().toISOString(),
        result,
      },
    ].slice(-50);

    await prisma.resume.update({
      where: { id: resume.id },
      data: {
        customizations: {
          ...existingCustomizations,
          premiumAiLastResult: {
            id: usageLog.id,
            feature,
            timestamp: new Date().toISOString(),
            result,
          },
          premiumAiHistory: nextHistory,
        },
      },
    });

    return NextResponse.json({
      feature,
      result,
      usage: {
        used: usedThisMonth + 1,
        limit: monthlyLimit,
        remaining: Math.max(0, monthlyLimit - (usedThisMonth + 1)),
      },
      artifactId: usageLog.id,
    });
  } catch (error: any) {
    console.error("Premium AI API error:", error);
    return NextResponse.json(
      {
        error: "Failed to run premium AI feature",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
