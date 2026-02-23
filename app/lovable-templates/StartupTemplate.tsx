import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const StartupTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6">
        <h1 className="text-3xl font-black" style={{ color: "#0f172a" }}>
          {personalInfo.name}
          <span style={{ color: "#f59e0b" }}>.</span>
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "#64748b" }}>{personalInfo.headline}</p>
        <div className="mt-2 flex gap-3 text-xs" style={{ color: "#94a3b8" }}>
          <span>{personalInfo.email}</span>
          <span>·</span>
          <span>{personalInfo.phone}</span>
          <span>·</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5 rounded-lg border p-4" style={{ borderColor: "#fde68a", background: "#fffbeb" }}>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-black uppercase tracking-widest" style={{ color: "#f59e0b" }}>Stack</h2>
        <div className="flex flex-wrap gap-1.5">
          {skills.technical.map((s, i) => (
            <span key={i} className="rounded-md px-2.5 py-1 text-xs font-semibold" style={{ background: "#0f172a", color: "#f59e0b" }}>{s}</span>
          ))}
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest" style={{ color: "#f59e0b" }}>Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold" style={{ color: "#0f172a" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-semibold" style={{ color: "#f59e0b" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#f59e0b" }}>⚡</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex gap-8">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-black uppercase tracking-widest" style={{ color: "#f59e0b" }}>Education</h2>
          {education.map((edu, i) => (
            <p key={i} className="text-xs" style={{ color: "#475569" }}>
              <span className="font-semibold" style={{ color: "#0f172a" }}>{edu.degree}</span> — {edu.institution}
            </p>
          ))}
        </section>
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-black uppercase tracking-widest" style={{ color: "#f59e0b" }}>Superpowers</h2>
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

export default StartupTemplate;
