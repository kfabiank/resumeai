import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { runPremiumAiFeature, type PremiumAiFeature } from "@/lib/ai-service";

const ACTION_TYPE_BY_FEATURE: Record<PremiumAiFeature, string> = {
  resume_rewrite_pro: "admin_ai_rewrite_pro",
  job_match_scoring: "admin_ai_job_match",
  interview_simulation: "admin_ai_interview_simulation",
  salary_negotiation_scripts: "admin_ai_salary_script",
  advanced_ats_strategy: "admin_ai_ats_strategy",
};

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const userId = session?.user?.id;
    const sessionEmail = session?.user?.email?.toLowerCase().trim();
    const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();
    if (!userId || !sessionEmail || !rootAdminEmail || sessionEmail !== rootAdminEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      resumeId?: string;
      feature?: PremiumAiFeature;
      jobDescription?: string;
      targetRole?: string;
      contextNote?: string;
    };

    if (!body.resumeId) {
      return NextResponse.json({ error: "Missing resumeId" }, { status: 400 });
    }
    if (!body.feature || !(body.feature in ACTION_TYPE_BY_FEATURE)) {
      return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
    }

    const resume = await prisma.resume.findUnique({
      where: { id: body.resumeId },
      select: {
        id: true,
        userId: true,
        jobTitle: true,
        jobDescription: true,
        content: true,
        user: { select: { planType: true, email: true } },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const result = await runPremiumAiFeature({
      feature: body.feature,
      resume: (resume.content || {}) as any,
      jobDescription: body.jobDescription || resume.jobDescription || "",
      targetRole: body.targetRole || resume.jobTitle || "",
      contextNote: body.contextNote || "",
    });

    await prisma.usageLog.create({
      data: {
        userId,
        actionType: ACTION_TYPE_BY_FEATURE[body.feature],
        metadata: {
          resumeId: resume.id,
          targetUserId: resume.userId,
          targetUserEmail: resume.user.email,
          targetPlan: resume.user.planType,
          feature: body.feature,
        },
      },
    });

    return NextResponse.json({
      feature: body.feature,
      target: {
        userId: resume.userId,
        email: resume.user.email,
        planType: resume.user.planType,
      },
      result,
    });
  } catch (error: any) {
    console.error("Admin premium AI API error:", error);
    return NextResponse.json(
      {
        error: "Failed to run admin premium AI feature",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

