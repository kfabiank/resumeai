import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const ProductManagerTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6 border-l-4 pl-5" style={{ borderColor: "#059669" }}>
        <h1 className="text-2xl font-bold" style={{ color: "#064e3b" }}>{personalInfo.name}</h1>
        <p className="mt-0.5 text-sm font-medium" style={{ color: "#059669" }}>{personalInfo.headline}</p>
        <div className="mt-2 flex gap-4 text-xs" style={{ color: "#6b7280" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5 rounded p-3" style={{ background: "#ecfdf5" }}>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#059669" }}>Product Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#064e3b" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#059669" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#059669" }}>●</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex gap-8">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#059669" }}>Skills & Tools</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.technical.map((s, i) => (
              <span key={i} className="rounded px-2 py-0.5 text-xs" style={{ background: "#d1fae5", color: "#065f46" }}>{s}</span>
            ))}
          </div>
          <p className="mt-2 text-xs" style={{ color: "#64748b" }}>{skills.soft.join(" · ")}</p>
          {languages.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#64748b" }}>Languages</p>
              <p className="mt-1 text-xs" style={{ color: "#64748b" }}>
                {languages.join(" · ")}
              </p>
            </div>
          )}
        </section>
        <section className="w-44">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#059669" }}>Education</h2>
          {education.map((edu, i) => (
            <div key={i}>
              <p className="text-sm font-semibold" style={{ color: "#064e3b" }}>{edu.degree}</p>
              <p className="text-xs" style={{ color: "#6b7280" }}>{edu.institution} · {formatDate(edu.graduationDate)}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default ProductManagerTemplate;
