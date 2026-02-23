import { notFound } from "next/navigation";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import { prisma } from "@/lib/prisma";
import { verifyPrintToken } from "@/lib/print-token";
import { mapResumeContentToResumeData } from "@/lib/resume-render";

export const dynamic = "force-dynamic";

export default async function PrintResumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!verifyPrintToken(id, token)) {
    notFound();
  }

  const resume = await prisma.resume.findUnique({
    where: { id },
    select: {
      templateId: true,
      content: true,
    },
  });

  if (!resume) notFound();

  return (
    <main className="m-0 bg-white p-0">
      <div className="w-[794px] bg-white">
        <TemplateRenderer
          templateId={resume.templateId || "modern-professional"}
          data={mapResumeContentToResumeData(resume.content || {})}
        />
      </div>
    </main>
  );
}
