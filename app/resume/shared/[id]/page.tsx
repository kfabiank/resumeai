import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import { prisma } from "@/lib/prisma";
import { mapResumeContentToResumeData } from "@/lib/resume-render";
import { siteName } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resume = await prisma.resume.findUnique({
    where: { id },
    select: { title: true, isPublic: true },
  });

  if (!resume?.isPublic) return {};

  const title = resume.title || "Shared Resume";
  const description = `View ${title} — built with ${siteName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    robots: { index: false, follow: false },
  };
}

export default async function SharedResumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      templateId: true,
      isPublic: true,
      viewCount: true,
    },
  });

  if (!resume || !resume.isPublic) {
    notFound();
  }

  await prisma.resume.update({
    where: { id: resume.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between text-sm text-gray-600">
        <span>Resume shared by ResumeAI</span>
        <span>{resume.viewCount + 1} views</span>
      </div>
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
        <TemplateRenderer
          templateId={resume.templateId || "modern-professional"}
          data={mapResumeContentToResumeData(resume.content || {})}
        />
      </div>
    </div>
  );
}
