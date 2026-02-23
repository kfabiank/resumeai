import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const DevOpsTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", background: "#0f172a", color: "#e2e8f0" }}>
      <div className="mb-6">
        <p className="text-xs" style={{ color: "#38bdf8" }}>$ whoami</p>
        <h1 className="text-2xl font-bold text-white">{personalInfo.name}</h1>
        <p className="mt-1 text-sm" style={{ color: "#38bdf8" }}>{personalInfo.headline}</p>
        <div className="mt-2 flex gap-3 text-xs" style={{ color: "#64748b" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
        <div className="mt-3 h-px" style={{ background: "#1e293b" }} />
      </div>

      <section className="mb-5">
        <p className="text-xs" style={{ color: "#38bdf8" }}>$ cat summary.txt</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "#94a3b8", fontFamily: "'Inter', sans-serif" }}>
          {professionalSummary}
        </p>
      </section>

      <section className="mb-5">
        <p className="text-xs" style={{ color: "#38bdf8" }}>$ history --experience</p>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4 mt-2 rounded p-3" style={{ background: "#1e293b" }}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-bold text-white">{exp.title}</h3>
              <span className="text-xs" style={{ color: "#64748b" }}>
                {formatDate(exp.startDate)} → {exp.current ? "now" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#38bdf8" }}>@{exp.company}</p>
            <ul className="mt-1.5 space-y-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#94a3b8" }}>
                  <span style={{ color: "#22c55e" }}>✓</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <p className="text-xs" style={{ color: "#38bdf8" }}>$ kubectl get skills</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.technical.map((s, i) => (
            <span key={i} className="rounded px-2 py-0.5 text-xs" style={{ background: "#022c22", color: "#22c55e", border: "1px solid #166534" }}>{s}</span>
          ))}
        </div>
      </section>

      <div className="flex gap-8">
        <section className="flex-1">
          <p className="text-xs" style={{ color: "#38bdf8" }}>$ cat education.log</p>
          {education.map((edu, i) => (
            <p key={i} className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
              {edu.degree} — {edu.institution} ({formatDate(edu.graduationDate)})
            </p>
          ))}
        </section>
        <section className="flex-1">
          <p className="text-xs" style={{ color: "#38bdf8" }}>$ echo $TRAITS</p>
          <p className="mt-1 text-xs" style={{ color: "#64748b" }}>{skills.soft.join(" | ")}</p>
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

export default DevOpsTemplate;
