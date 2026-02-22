import { notFound } from "next/navigation";
import TemplateRenderer from "@/app/lovable-templates/TemplateRenderer";
import { isTemplateId } from "@/lib/template-catalog";
import { TEMPLATE_PREVIEW_DATA } from "@/lib/template-preview-data";

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isTemplateId(id)) notFound();

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div id="thumbnail-root" className="mx-auto w-[794px] rounded border border-slate-300 bg-white shadow-lg">
        <TemplateRenderer templateId={id} data={TEMPLATE_PREVIEW_DATA} />
      </div>
    </main>
  );
}
