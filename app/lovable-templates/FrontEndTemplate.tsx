import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const FrontendTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold text-white" style={{ background: "linear-gradient(135deg, #06b6d4, #8b5cf6)" }}>
            {personalInfo.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>{personalInfo.name}</h1>
            <p className="text-sm" style={{ color: "#06b6d4" }}>{personalInfo.headline}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-4 text-xs" style={{ color: "#94a3b8" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#06b6d4" }}>Tech Stack</h2>
        <div className="flex flex-wrap gap-1.5">
          {skills.technical.map((s, i) => (
            <span key={i} className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ background: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" }}>{s}</span>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#06b6d4" }}>Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4" style={{ borderLeft: "2px solid #06b6d4", paddingLeft: "12px" }}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#06b6d4" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#8b5cf6" }}>→</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex gap-8">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#06b6d4" }}>Education</h2>
          {education.map((edu, i) => (
            <div key={i}>
              <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>{edu.degree}</p>
              <p className="text-xs" style={{ color: "#64748b" }}>{edu.institution} · {formatDate(edu.graduationDate)}</p>
            </div>
          ))}
        </section>
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#06b6d4" }}>Soft Skills</h2>
          <p className="text-xs" style={{ color: "#64748b" }}>{skills.soft.join(" · ")}</p>
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
    </div>
  );
};

export default FrontendTemplate;
