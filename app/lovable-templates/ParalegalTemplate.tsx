import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const ParalegalTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-5 rounded-md p-5" style={{ background: "#f8fafc", borderLeft: "4px solid #475569" }}>
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>{personalInfo.name}</h1>
        <p className="mt-0.5 text-sm font-medium" style={{ color: "#475569" }}>{personalInfo.headline}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs" style={{ color: "#94a3b8" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Summary</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#1e293b" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#64748b" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span>–</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Education</h2>
        {education.map((edu, i) => (
          <div key={i} className="mb-1 flex items-baseline justify-between">
            <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>{edu.degree} — {edu.institution}</span>
            <span className="text-xs" style={{ color: "#94a3b8" }}>{formatDate(edu.graduationDate)}</span>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#475569" }}>Skills</h2>
        <div className="flex flex-wrap gap-1.5">
          {[...skills.technical, ...skills.soft].map((skill, i) => (
            <span key={i} className="rounded border px-2 py-0.5 text-xs" style={{ borderColor: "#cbd5e1", color: "#475569" }}>
              {skill}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ParalegalTemplate;
