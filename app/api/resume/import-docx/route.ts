import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureTemplateExists } from "@/lib/template-db";
import { getTemplateById, isTemplateId } from "@/lib/template-catalog";
import { parseDocxTextToResumeContent } from "@/lib/docx-import";
import { PLAN_LIMITS } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function extractDocxText(fileBuffer: Buffer) {
  try {
    const dynamicImporter = new Function("m", "return import(m);") as (
      moduleName: string
    ) => Promise<any>;
    const mammothModule = await dynamicImporter("mammoth");
    const mammoth = mammothModule?.default || mammothModule;
    const result = await mammoth.extractRawText({
      buffer: fileBuffer,
    });
    return String(result?.value || "");
  } catch {
    throw new Error(
      "DOCX parser is not available. Install dependency 'mammoth' and redeploy."
    );
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const templateIdRaw = `${formData.get("templateId") || ""}`.trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const isDocx =
    file.name.toLowerCase().endsWith(".docx") ||
    file.type.includes(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  if (!isDocx) {
    return NextResponse.json({ error: "Only .docx files are supported" }, { status: 400 });
  }

  if (!isTemplateId(templateIdRaw)) {
    return NextResponse.json({ error: "Invalid templateId" }, { status: 400 });
  }
  const template = getTemplateById(templateIdRaw);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (template.isPremium && user.planType === "free") {
    return NextResponse.json(
      { error: "Upgrade required to use premium templates" },
      { status: 403 }
    );
  }

  // Check monthly resume limit
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const resumesThisMonth = await prisma.resume.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
  });

  const planLimit =
    PLAN_LIMITS[user.planType as keyof typeof PLAN_LIMITS]?.resumesPerMonth ?? 3;

  if (planLimit !== -1 && resumesThisMonth >= planLimit) {
    return NextResponse.json(
      {
        error: "Monthly resume limit reached",
        message: "Upgrade your plan to import more resumes",
        resumesUsed: resumesThisMonth,
        resumesLimit: planLimit,
      },
      { status: 403 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawText = await extractDocxText(Buffer.from(arrayBuffer));

  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "Could not extract text from the uploaded file" },
      { status: 400 }
    );
  }

  const content = parseDocxTextToResumeContent(rawText);
  await ensureTemplateExists(template.id);

  const resume = await prisma.resume.create({
    data: {
      userId,
      title: `${content.personalInfo.name || "Imported Resume"} - ${new Date().toLocaleDateString()}`,
      jobTitle: content.personalInfo.headline || content.experiences[0]?.title || null,
      jobDescription: null,
      jobUrl: null,
      content,
      templateId: template.id,
      atsScore: null,
      atsFeedback: {
        source: "docx-import",
      },
    },
  });

  await prisma.usageLog.create({
    data: {
      userId,
      actionType: "resume_created",
      metadata: {
        source: "docx_import",
        resumeId: resume.id,
        templateId: template.id,
      },
    },
  });

  return NextResponse.json({
    success: true,
    resumeId: resume.id,
  });
}
