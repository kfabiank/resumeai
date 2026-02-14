import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const FinanceTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-widest" style={{ color: "#1e293b" }}>
          {personalInfo.name}
        </h1>
        <div className="mx-auto mt-2 h-px w-32" style={{ background: "#b8860b" }} />
        <p className="mt-2 text-xs font-medium tracking-wide" style={{ color: "#b8860b" }}>
          {personalInfo.headline}
        </p>
        <div className="mt-2 flex justify-center gap-4 text-xs" style={{ color: "#6b7280" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#b8860b" }}>Executive Summary</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
      </section>

      <div className="mb-5 h-px" style={{ background: "#e5e7eb" }} />

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#b8860b" }}>Professional Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold" style={{ color: "#1e293b" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#b8860b" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#b8860b" }}>■</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="mb-5 h-px" style={{ background: "#e5e7eb" }} />

      <div className="flex gap-10">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#b8860b" }}>Education</h2>
          {education.map((edu, i) => (
            <div key={i}>
              <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>{edu.degree}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{edu.institution} · {formatDate(edu.graduationDate)}</p>
            </div>
          ))}
        </section>
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#b8860b" }}>Core Competencies</h2>
          <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>
            {[...skills.technical, ...skills.soft].join(" · ")}
          </p>
        </section>
      </div>
    </div>
  );
};

export default FinanceTemplate;
