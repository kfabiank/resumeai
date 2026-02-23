import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const ConsultantTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6 border-b pb-4" style={{ borderColor: "#1d4ed8" }}>
        <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>
          {personalInfo.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "#1d4ed8" }}>
          {personalInfo.headline}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "#64748b" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Executive Summary
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
          {professionalSummary}
        </p>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Professional Experience
        </h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                {exp.title}
              </h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#475569" }}>
              {exp.company}
            </p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#1d4ed8" }}>▸</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Education
        </h2>
        {education.map((edu, i) => (
          <div key={i} className="mb-2">
            <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
              {edu.degree}
            </p>
            <p className="text-xs" style={{ color: "#64748b" }}>
              {edu.institution} · {formatDate(edu.graduationDate)}
              {edu.gpa ? ` · GPA: ${edu.gpa}` : ""}
            </p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
          Core Skills
        </h2>
        <p className="text-xs" style={{ color: "#475569" }}>
          {[...skills.technical, ...skills.soft].join(" · ")}
        </p>
        {languages.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>Languages</p>
              <p className="mt-1 text-xs" style={{ color: "#475569" }}>
                {languages.join(" · ")}
              </p>
            </div>
          )}
      </section>
    </div>
  );
};

export default ConsultantTemplate;
