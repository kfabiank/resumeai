import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const MarketingTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6 rounded-lg p-6" style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
        <h1 className="text-3xl font-bold text-white">{personalInfo.name}</h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "#c4b5fd" }}>{personalInfo.headline}</p>
        <div className="mt-3 flex gap-4 text-xs text-white/70">
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#7c3aed" }}>About</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold" style={{ color: "#1e293b" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#7c3aed" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#7c3aed" }}>✦</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex gap-8">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Tools & Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.technical.map((s, i) => (
              <span key={i} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: "#f5f3ff", color: "#6d28d9" }}>{s}</span>
            ))}
          </div>
        </section>
        <section className="w-48">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Education</h2>
          {education.map((edu, i) => (
            <div key={i}>
              <p className="text-xs font-semibold" style={{ color: "#1e293b" }}>{edu.degree}</p>
              <p className="text-xs" style={{ color: "#64748b" }}>{edu.institution}</p>
            </div>
          ))}
          <h2 className="mb-1 mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#7c3aed" }}>Soft Skills</h2>
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

export default MarketingTemplate;
