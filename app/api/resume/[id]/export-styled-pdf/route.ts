import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPrintToken } from "@/lib/print-token";
import { buildResumeDownloadName } from "@/lib/resume-render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBaseUrl(request: NextRequest) {
  const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    const session = await getAuthSession();
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        content: true,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    if (resume.userId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const token = createPrintToken(resume.id, 180);
    const baseUrl = getBaseUrl(request);
    const printUrl = `${baseUrl}/print/resume/${resume.id}?token=${encodeURIComponent(token)}`;

    browser = await chromium.launch({
      headless: true,
      args: ["--font-render-hinting=none"],
    });
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2,
    });
    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector(".a4-page", { timeout: 30000 });
    await page.emulateMedia({ media: "print" });
    await page.addStyleTag({
      content: `
        @page { size: A4; margin: 0; }
        html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
        *, *::before, *::after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `,
    });

    const pdfBuffer = await page.pdf({
      width: "210mm",
      height: "297mm",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });

    await prisma.usageLog.create({
      data: {
        userId: currentUserId,
        actionType: "resume_exported",
        metadata: {
          resumeId: resume.id,
          format: "pdf",
          source: "styled-playwright",
        },
      },
    });

    const personName = (resume.content as any)?.personalInfo?.name || "";
    const fileName = buildResumeDownloadName(personName, resume.title || "resume");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error exporting styled PDF:", error);
    return NextResponse.json({ error: "Failed to export styled PDF" }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
