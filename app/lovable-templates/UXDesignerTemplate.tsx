import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const UXDesignerTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-4xl font-extralight tracking-tight" style={{ color: "#0f172a" }}>
          {personalInfo.name}
        </h1>
        <p className="mt-2 text-sm font-medium tracking-wide" style={{ color: "#e11d48" }}>
          {personalInfo.headline}
        </p>
        <div className="mt-3 flex gap-4 text-xs" style={{ color: "#94a3b8" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
        <div className="mt-4 flex gap-1">
          <div className="h-1 w-16 rounded" style={{ background: "#e11d48" }} />
          <div className="h-1 w-8 rounded" style={{ background: "#fb923c" }} />
          <div className="h-1 w-4 rounded" style={{ background: "#fbbf24" }} />
        </div>
      </div>

      <section className="mb-6">
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{professionalSummary}</p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#e11d48" }}>Design Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-5">
            <h3 className="text-base font-semibold" style={{ color: "#0f172a" }}>{exp.title}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: "#e11d48" }}>{exp.company}</span>
              <span className="text-xs" style={{ color: "#d1d5db" }}>|</span>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#fb923c" }}>○</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex gap-10">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#e11d48" }}>Tools & Methods</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.technical.map((s, i) => (
              <span key={i} className="rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: "#fecdd3", color: "#be123c" }}>{s}</span>
            ))}
          </div>
        </section>
        <section className="w-44">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#e11d48" }}>Education</h2>
          {education.map((edu, i) => (
            <div key={i}>
              <p className="text-xs font-semibold" style={{ color: "#0f172a" }}>{edu.degree}</p>
              <p className="text-xs" style={{ color: "#64748b" }}>{edu.institution}</p>
            </div>
          ))}
          <h2 className="mb-1 mt-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#e11d48" }}>Strengths</h2>
          <p className="text-xs" style={{ color: "#64748b" }}>{skills.soft.join(", ")}</p>
        </section>
      </div>
    </div>
  );
};

export default UXDesignerTemplate;
