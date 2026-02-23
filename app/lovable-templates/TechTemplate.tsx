import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const TechTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'JetBrains Mono', 'Inter', monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>
          {">"} {personalInfo.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#10b981" }}>
          // {personalInfo.headline}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "#64748b" }}>
          <span>[{personalInfo.email}]</span>
          <span>[{personalInfo.phone}]</span>
          <span>[{personalInfo.location}]</span>
        </div>
        <div className="mt-3 h-px" style={{ background: "linear-gradient(to right, #10b981, transparent)" }} />
      </div>

      {/* Summary */}
      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#10b981" }}>
          # about
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: "#334155", fontFamily: "'Inter', sans-serif" }}>
          {professionalSummary}
        </p>
      </section>

      {/* Experience */}
      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase" style={{ color: "#10b981" }}>
          # experience
        </h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4" style={{ borderLeft: "2px solid #10b981", paddingLeft: "12px" }}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                {exp.title}
              </h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} → {exp.current ? "now" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#10b981" }}>
              @{exp.company}
            </p>
            <ul className="mt-1.5 space-y-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#10b981" }}>→</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#10b981" }}>
          # stack
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {skills.technical.map((skill, i) => (
            <span
              key={i}
              className="inline-flex items-center whitespace-nowrap rounded-sm px-2 py-[3px] text-xs font-medium leading-tight"
              style={{ background: "#0f172a", color: "#10b981" }}
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      {/* Education */}
      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#10b981" }}>
          # education
        </h2>
        {education.map((edu, i) => (
          <div key={i}>
            <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>
              {edu.degree}
            </span>
            <span className="ml-2 text-xs" style={{ color: "#64748b" }}>
              {edu.institution} · {formatDate(edu.graduationDate)} · GPA {edu.gpa}
            </span>
          </div>
        ))}
      </section>

      {/* Soft skills */}
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#10b981" }}>
          # traits
        </h2>
        <p className="text-xs" style={{ color: "#64748b" }}>
          {skills.soft.join(" · ")}
        </p>
        {languages.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>Languages</p>
              <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                {languages.join(" · ")}
              </p>
            </div>
          )}
      </section>
    </div>
  );
};

export default TechTemplate;
