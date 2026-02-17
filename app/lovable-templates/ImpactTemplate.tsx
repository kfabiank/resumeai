import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const ImpactTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page" style={{ fontFamily: "'Inter', sans-serif", background: "#f8fafc" }}>
      <div className="grid grid-cols-[205px_1fr] min-h-full">
        <aside className="p-6" style={{ background: "#0f172a", color: "#dbeafe" }}>
          <h1 className="text-xl font-bold leading-tight text-white">{personalInfo.name}</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.14em]" style={{ color: "#60a5fa" }}>
            {personalInfo.headline}
          </p>

          <section className="mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#93c5fd" }}>
              Contact
            </h2>
            <div className="space-y-1 text-xs" style={{ color: "#bfdbfe" }}>
              <p>{personalInfo.email}</p>
              <p>{personalInfo.phone}</p>
              <p>{personalInfo.location}</p>
            </div>
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#93c5fd" }}>
              Technical
            </h2>
            <div className="flex flex-wrap gap-1">
              {skills.technical.map((skill, i) => (
                <span
                  key={i}
                  className="rounded px-1.5 py-0.5 text-[10px]"
                  style={{ background: "#1e3a8a", color: "#dbeafe" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#93c5fd" }}>
              Soft Skills
            </h2>
            <ul className="space-y-1">
              {skills.soft.map((skill, i) => (
                <li key={i} className="text-xs" style={{ color: "#bfdbfe" }}>
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <main className="p-7">
          <section className="mb-5 rounded-lg border border-blue-100 bg-white px-4 py-3">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#1d4ed8" }}>
              Professional Summary
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
              {professionalSummary}
            </p>
          </section>

          <section className="mb-5">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#1d4ed8" }}>
              Experience Highlights
            </h2>
            <div className="space-y-3">
              {experiences.map((exp, i) => (
                <article key={i} className="rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                        {exp.title}
                      </h3>
                      <p className="text-xs font-medium" style={{ color: "#2563eb" }}>
                        {exp.company}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: "#64748b" }}>
                      {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {exp.optimizedBullets.map((bullet, j) => (
                      <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                        <span style={{ color: "#2563eb" }}>▸</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#1d4ed8" }}>
              Education
            </h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                  {edu.degree}
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {edu.institution} · {formatDate(edu.graduationDate)} {edu.gpa ? `· GPA: ${edu.gpa}` : ""}
                </p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ImpactTemplate;
