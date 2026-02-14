import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const DataScienceTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page flex">
      {/* Sidebar */}
      <div className="w-52 p-6" style={{ background: "#1e1b4b", color: "#e0e7ff", fontFamily: "'Inter', sans-serif" }}>
        <div className="mb-6">
          <h1 className="text-lg font-bold text-white">{personalInfo.name}</h1>
          <p className="mt-1 text-xs" style={{ color: "#a5b4fc" }}>{personalInfo.headline}</p>
        </div>

        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#818cf8" }}>Contact</h2>
          <div className="space-y-1 text-xs" style={{ color: "#a5b4fc" }}>
            <p>{personalInfo.email}</p>
            <p>{personalInfo.phone}</p>
            <p>{personalInfo.location}</p>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#818cf8" }}>Tech Stack</h2>
          <div className="flex flex-wrap gap-1">
            {skills.technical.map((s, i) => (
              <span key={i} className="rounded px-1.5 py-0.5 text-xs" style={{ background: "#312e81", color: "#a5b4fc" }}>{s}</span>
            ))}
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#818cf8" }}>Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="mb-2">
              <p className="text-xs font-semibold text-white">{edu.degree}</p>
              <p className="text-xs" style={{ color: "#a5b4fc" }}>{edu.institution}</p>
              <p className="text-xs" style={{ color: "#6366f1" }}>{formatDate(edu.graduationDate)}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#818cf8" }}>Soft Skills</h2>
          <ul className="space-y-0.5">
            {skills.soft.map((s, i) => (
              <li key={i} className="text-xs" style={{ color: "#a5b4fc" }}>{s}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Main */}
      <div className="flex-1 p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>Summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>{professionalSummary}</p>
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#6366f1" }}>Experience</h2>
          {experiences.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>{exp.title}</h3>
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <p className="text-xs font-medium" style={{ color: "#6366f1" }}>{exp.company}</p>
              <ul className="mt-1.5 space-y-1">
                {exp.optimizedBullets.map((bullet, j) => (
                  <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                    <span style={{ color: "#818cf8" }}>◇</span><span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default DataScienceTemplate;
