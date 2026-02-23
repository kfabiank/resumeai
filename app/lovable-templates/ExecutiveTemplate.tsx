import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const ExecutiveTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-12" style={{ fontFamily: "'Playfair Display', 'Inter', serif" }}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-semibold tracking-wide" style={{ color: "#1a1a2e" }}>
          {personalInfo.name}
        </h1>
        <p className="mt-2 text-sm font-light tracking-widest uppercase" style={{ color: "#6b7280", fontFamily: "'Inter', sans-serif" }}>
          {personalInfo.headline}
        </p>
        <div className="mx-auto mt-3 h-px w-24" style={{ background: "#92754c" }} />
        <div className="mt-3 flex justify-center gap-6 text-xs" style={{ color: "#9ca3af", fontFamily: "'Inter', sans-serif" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      {/* Summary */}
      <section className="mb-6">
        <p className="text-center text-sm italic leading-relaxed" style={{ color: "#4b5563", fontFamily: "'Inter', sans-serif" }}>
          "{professionalSummary}"
        </p>
      </section>

      <div className="mx-auto mb-6 h-px w-full" style={{ background: "#e5e7eb" }} />

      {/* Experience */}
      <section className="mb-6">
        <h2 className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#92754c", fontFamily: "'Inter', sans-serif" }}>
          Professional Experience
        </h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-5">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold" style={{ color: "#1a1a2e" }}>
                {exp.title}
              </h3>
              <span className="text-xs italic" style={{ color: "#9ca3af", fontFamily: "'Inter', sans-serif" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs tracking-wide" style={{ color: "#92754c", fontFamily: "'Inter', sans-serif" }}>
              {exp.company}
            </p>
            <ul className="mt-2 space-y-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#4b5563" }}>
                  <span style={{ color: "#92754c" }}>◆</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="mx-auto mb-6 h-px w-full" style={{ background: "#e5e7eb" }} />

      {/* Education */}
      <section className="mb-6">
        <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#92754c", fontFamily: "'Inter', sans-serif" }}>
          Education
        </h2>
        {education.map((edu, i) => (
          <div key={i} className="text-center">
            <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>
              {edu.degree}
            </p>
            <p className="text-xs" style={{ color: "#6b7280", fontFamily: "'Inter', sans-serif" }}>
              {edu.institution} · {formatDate(edu.graduationDate)} · GPA: {edu.gpa}
            </p>
          </div>
        ))}
      </section>

      <div className="mx-auto mb-6 h-px w-full" style={{ background: "#e5e7eb" }} />

      {/* Skills */}
      <section>
        <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "#92754c", fontFamily: "'Inter', sans-serif" }}>
          Core Competencies
        </h2>
        <div className="flex flex-wrap justify-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
          {[...skills.technical, ...skills.soft].map((skill, i) => (
            <span
              key={i}
              className="rounded-full px-3 py-0.5 text-xs"
              style={{ border: "1px solid #d1d5db", color: "#4b5563" }}
            >
              {skill}
            </span>
          ))}
        </div>
        {languages.length > 0 && (
          <div className="mt-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#6b7280", fontFamily: "'Inter', sans-serif" }}>Languages</p>
            <p className="mt-1 text-xs" style={{ color: "#6b7280", fontFamily: "'Inter', sans-serif" }}>
              {languages.join(" · ")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ExecutiveTemplate;
