import { redirect } from "next/navigation";
import { access } from "node:fs/promises";
import path from "node:path";
import { getAuthSession } from "@/lib/auth";
import AdminSwitcher from "./AdminSwitcher";
import { prisma } from "@/lib/prisma";
import TemplateAccessManager from "./TemplateAccessManager";
import { TEMPLATE_CATALOG } from "@/lib/template-catalog";
import AdminQABulkDownloads from "./AdminQABulkDownloads";
import AdminScriptsPanel from "./AdminScriptsPanel";
import { ADMIN_CUSTOM_SCRIPTS } from "@/lib/admin-custom-scripts";
import StyledPdfDownloadButton from "./StyledPdfDownloadButton";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "N/A";
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type AdminPageProps = {
  searchParams?: {
    userId?: string;
    q?: string;
  };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAuthSession();
  const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL?.toLowerCase().trim();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const sessionEmail = session.user.email?.toLowerCase().trim();
  if (!rootAdminEmail || !sessionEmail || sessionEmail !== rootAdminEmail) {
    redirect("/dashboard");
  }

  const adminUserId = session.user.id;
  const query = searchParams?.q?.trim() || "";
  const selectedUserId = searchParams?.userId?.trim() || null;

  const [
    totalUsers,
    totalResumes,
    totalApplications,
    totalCoverLetters,
    users,
    qaPreviewResumes,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.resume.count(),
    prisma.jobApplication.count(),
    prisma.coverLetter.count(),
    prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        _count: {
          select: {
            resumes: true,
            applications: true,
            usageLogs: true,
          },
        },
      },
    }),
    prisma.resume.findMany({
      where: {
        userId: adminUserId,
        title: { startsWith: "QA Preview - " },
      },
      select: {
        id: true,
        templateId: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  const currentUserId = selectedUserId || users[0]?.id || null;
  const selectedUser = currentUserId
    ? await prisma.user.findUnique({
        where: { id: currentUserId },
        include: {
          profile: true,
          resumes: {
            orderBy: { updatedAt: "desc" },
            take: 30,
            select: {
              id: true,
              title: true,
              templateId: true,
              atsScore: true,
              updatedAt: true,
              isPublic: true,
            },
          },
          applications: {
            orderBy: { updatedAt: "desc" },
            take: 20,
            select: {
              id: true,
              company: true,
              position: true,
              status: true,
              updatedAt: true,
            },
          },
          _count: {
            select: {
              resumes: true,
              applications: true,
              usageLogs: true,
            },
          },
        },
      })
    : null;

  const resumeByTemplateId = new Map(qaPreviewResumes.map((resume) => [resume.templateId, resume]));

  const qaPreviewStatuses = await Promise.all(
    TEMPLATE_CATALOG.map(async (template) => {
      const localPath = path.join(process.cwd(), "public", "qa-design-previews", `${template.id}.png`);
      let pngExists = false;
      try {
        await access(localPath);
        pngExists = true;
      } catch {
        pngExists = false;
      }
      return {
        id: template.id,
        name: template.name,
        categoryLabel: template.categoryLabel,
        pngExists,
        resume: resumeByTemplateId.get(template.id) || null,
        file: `/qa-design-previews/${template.id}.png`,
      };
    })
  );

  const qaBulkItems = qaPreviewStatuses.map((item) => ({
    id: item.id,
    pngFile: item.pngExists ? item.file : null,
    resumeId: item.resume?.id || null,
  }));

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            Logged in as super admin: <span className="font-semibold">{session.user.email || "admin"}</span>
          </p>
        </div>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Users" value={String(totalUsers)} />
          <StatCard label="Resumes" value={String(totalResumes)} />
          <StatCard label="Applications" value={String(totalApplications)} />
          <StatCard label="Cover Letters" value={String(totalCoverLetters)} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form className="flex flex-col gap-3 md:flex-row">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="font-semibold text-slate-900">Users ({users.length})</h2>
            </div>
            <div className="max-h-[580px] overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 font-medium">User</th>
                    <th className="px-4 py-2 font-medium">Plan</th>
                    <th className="px-4 py-2 font-medium">Data</th>
                    <th className="px-4 py-2 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const active = user.id === currentUserId;
                    return (
                      <tr
                        key={user.id}
                        className={`${active ? "bg-blue-50" : "hover:bg-slate-50"} border-t border-slate-100`}
                      >
                        <td className="px-4 py-3">
                          <a
                            href={`/admin?userId=${user.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                            className="block"
                          >
                            <p className="font-medium text-slate-900">{user.name || "Unnamed user"}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                            {user.planType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          <p>{user._count.resumes} resumes</p>
                          <p>{user._count.applications} apps</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{formatDate(user.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900">User Detail</h2>
              {selectedUser ? (
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-medium">Name:</span> {selectedUser.name || "N/A"}</p>
                  <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                  <p><span className="font-medium">Plan:</span> {selectedUser.planType}</p>
                  <p><span className="font-medium">Status:</span> {selectedUser.subscriptionStatus || "N/A"}</p>
                  <p><span className="font-medium">Stripe customer:</span> {selectedUser.stripeCustomerId || "N/A"}</p>
                  <p><span className="font-medium">Stripe subscription:</span> {selectedUser.stripeSubscriptionId || "N/A"}</p>
                  <p><span className="font-medium">Current period end:</span> {formatDate(selectedUser.currentPeriodEnd)}</p>
                  <p><span className="font-medium">Created:</span> {formatDate(selectedUser.createdAt)}</p>
                  <p><span className="font-medium">Profile phone:</span> {selectedUser.profile?.phone || "N/A"}</p>
                  <p><span className="font-medium">Profile location:</span> {selectedUser.profile?.location || "N/A"}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a user to see details.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900">
                Resumes ({selectedUser?._count.resumes || 0})
              </h2>
              <div className="max-h-64 space-y-2 overflow-auto">
                {selectedUser?.resumes.length ? (
                  selectedUser.resumes.map((resume) => (
                    <div key={resume.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-900">{resume.title}</p>
                      <p className="text-xs text-slate-600">Template: {resume.templateId}</p>
                      <p className="text-xs text-slate-600">ATS: {resume.atsScore ?? "N/A"} | Public: {resume.isPublic ? "Yes" : "No"}</p>
                      <p className="text-xs text-slate-500">Updated: {formatDate(resume.updatedAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No resumes found.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900">
                Applications ({selectedUser?._count.applications || 0})
              </h2>
              <div className="max-h-64 space-y-2 overflow-auto">
                {selectedUser?.applications.length ? (
                  selectedUser.applications.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-900">{item.company} - {item.position}</p>
                      <p className="text-xs capitalize text-slate-600">Status: {item.status.replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-500">Updated: {formatDate(item.updatedAt)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No applications found.</p>
                )}
              </div>
            </section>
          </div>
        </section>

        <TemplateAccessManager />
        <AdminScriptsPanel scripts={ADMIN_CUSTOM_SCRIPTS} />

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Template QA Design Previews</h2>
              <p className="text-xs text-slate-600">
                1) Generate PNG previews: <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5">npm run templates:qa-previews</code>
              </p>
              <p className="text-xs text-slate-600">
                2) Generate resume records for PDF/DOCX export: <code className="ml-1 rounded bg-slate-100 px-1.5 py-0.5">npm run templates:qa-resumes</code>
              </p>
            </div>
          </div>
          <AdminQABulkDownloads items={qaBulkItems} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {qaPreviewStatuses.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">{item.categoryLabel}</p>

                <p className={`mt-2 text-xs font-medium ${item.pngExists ? "text-emerald-600" : "text-amber-600"}`}>
                  PNG: {item.pngExists ? "Generated" : "Missing"}
                </p>
                <p className={`text-xs font-medium ${item.resume ? "text-emerald-600" : "text-amber-600"}`}>
                  PDF/DOCX record: {item.resume ? "Ready" : "Missing"}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {item.resume ? (
                    <>
                      <StyledPdfDownloadButton resumeId={item.resume.id} fallbackName={item.id} />
                      <form method="POST" action={`/api/resume/${item.resume.id}/export-docx`} target="_blank">
                        <button
                          type="submit"
                          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                        >
                          Download DOCX
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <span className="cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        Download PDF
                      </span>
                      <span className="cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
                        Download DOCX
                      </span>
                    </>
                  )}

                  {item.pngExists ? (
                    <a
                      href={item.file}
                      download={`${item.id}.png`}
                      className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      Download PNG
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
                      Download PNG
                    </span>
                  )}
                </div>

                {item.resume ? (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Resume ID: {item.resume.id} · Updated: {formatDate(item.resume.updatedAt)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <AdminSwitcher adminEmail={session.user.email || "admin"} />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
