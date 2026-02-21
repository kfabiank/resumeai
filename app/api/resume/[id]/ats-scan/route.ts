import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { runAtsScan, type ResumeContent } from "@/lib/ats-scan";

const FREE_ATS_SCAN_LIMIT = 3;
const FREE_ATS_SOFT_UPSELL_THRESHOLD = 2;

function monthStartUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
}

function contentHash(content: ResumeContent) {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

export async function GET(
  _request: NextRequest,
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
      select: { userId: true, user: { select: { planType: true } } },
    });

    if (!resume || resume.userId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const planType = resume.user.planType || "free";
    const isFree = planType === "free";
    const startOfMonth = monthStartUtc();

    const monthlyScanCount = await prisma.usageLog.count({
      where: {
        userId,
        actionType: "ats_scan",
        timestamp: { gte: startOfMonth },
      },
    });

    const limit = isFree ? FREE_ATS_SCAN_LIMIT : -1;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - monthlyScanCount);

    return NextResponse.json({
      usage: {
        used: monthlyScanCount,
        limit,
        remaining,
        softUpsellThreshold: FREE_ATS_SOFT_UPSELL_THRESHOLD,
        softUpsell: isFree && monthlyScanCount >= FREE_ATS_SOFT_UPSELL_THRESHOLD && remaining > 0,
        blocked: isFree && monthlyScanCount >= FREE_ATS_SCAN_LIMIT,
      },
    });
  } catch (error: any) {
    console.error("ATS usage GET error:", error);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
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
    const body = (await request.json()) as { content?: ResumeContent };
    const content = body?.content;
    if (!content) {
      return NextResponse.json({ error: "Missing content payload" }, { status: 400 });
    }

    const resume = await prisma.resume.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            planType: true,
          },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    if (resume.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const planType = resume.user.planType || "free";
    const isFree = planType === "free";
    const scanResult = runAtsScan(content);

    const startOfMonth = monthStartUtc();
    const currentHash = contentHash(content);

    const [monthlyScanCount, latestScanLog] = await Promise.all([
      prisma.usageLog.count({
        where: {
          userId,
          actionType: "ats_scan",
          timestamp: { gte: startOfMonth },
        },
      }),
      prisma.usageLog.findFirst({
        where: {
          userId,
          actionType: "ats_scan",
          timestamp: { gte: startOfMonth },
        },
        orderBy: {
          timestamp: "desc",
        },
        select: {
          metadata: true,
        },
      }),
    ]);

    const lastHash =
      latestScanLog?.metadata &&
      typeof latestScanLog.metadata === "object" &&
      "contentHash" in latestScanLog.metadata
        ? String((latestScanLog.metadata as any).contentHash || "")
        : "";

    const contentChanged = currentHash !== lastHash;

    if (isFree && contentChanged && monthlyScanCount >= FREE_ATS_SCAN_LIMIT) {
      return NextResponse.json(
        {
          error: "ATS scan limit reached",
          message: "You reached your monthly ATS scan limit. Upgrade for unlimited scans.",
          usage: {
            used: monthlyScanCount,
            limit: FREE_ATS_SCAN_LIMIT,
            remaining: 0,
            softUpsellThreshold: FREE_ATS_SOFT_UPSELL_THRESHOLD,
            softUpsell: true,
            blocked: true,
          },
        },
        { status: 403 }
      );
    }

    let usedAfter = monthlyScanCount;
    if (contentChanged) {
      await prisma.usageLog.create({
        data: {
          userId,
          actionType: "ats_scan",
          metadata: {
            resumeId: resume.id,
            score: scanResult.score,
            contentHash: currentHash,
            planType,
          },
        },
      });
      usedAfter += 1;
    }

    const limit = isFree ? FREE_ATS_SCAN_LIMIT : -1;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - usedAfter);
    const softUpsell =
      isFree && usedAfter >= FREE_ATS_SOFT_UPSELL_THRESHOLD && remaining > 0;

    return NextResponse.json({
      result: scanResult,
      usage: {
        used: usedAfter,
        limit,
        remaining,
        softUpsellThreshold: FREE_ATS_SOFT_UPSELL_THRESHOLD,
        softUpsell,
        blocked: false,
        counted: contentChanged,
      },
    });
  } catch (error: any) {
    console.error("ATS scan API error:", error);
    return NextResponse.json(
      {
        error: "Failed to run ATS scan",
        message: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
