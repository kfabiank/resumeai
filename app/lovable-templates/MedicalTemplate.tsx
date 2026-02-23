import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const MedicalTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="mb-6 border-b-2 pb-4" style={{ borderColor: "#0891b2" }}>
        <h1 className="text-3xl font-bold" style={{ color: "#164e63" }}>
          {personalInfo.name}
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "#0891b2" }}>
          {personalInfo.headline}
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: "#64748b" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      {/* Summary */}
      <section className="mb-5 rounded-md p-3" style={{ background: "#f0fdfa" }}>
        <h2 className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "#0891b2" }}>
          Professional Summary
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
          {professionalSummary}
        </p>
      </section>

      {/* Education - important for medical */}
      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#0891b2" }}>
          Education & Training
        </h2>
        {education.map((edu, i) => (
          <div key={i} className="mb-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#164e63" }}>{edu.degree}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>{formatDate(edu.graduationDate)}</span>
            </div>
            <p className="text-xs" style={{ color: "#64748b" }}>
              {edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}
            </p>
          </div>
        ))}
      </section>

      {/* Experience */}
      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#0891b2" }}>
          Clinical & Professional Experience
        </h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4" style={{ borderLeft: "3px solid #0891b2", paddingLeft: "12px" }}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#164e63" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs font-medium" style={{ color: "#0891b2" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#0891b2" }}>+</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Skills */}
      <div className="flex gap-8">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#0891b2" }}>
            Clinical Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.technical.map((skill, i) => (
              <span key={i} className="rounded px-2 py-0.5 text-xs" style={{ background: "#ecfdf5", color: "#065f46" }}>
                {skill}
              </span>
            ))}
          </div>
        </section>
        <section className="w-40">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#0891b2" }}>
            Core Competencies
          </h2>
          <ul className="space-y-0.5">
            {skills.soft.map((skill, i) => (
              <li key={i} className="text-xs" style={{ color: "#475569" }}>{skill}</li>
            ))}
          </ul>
          {languages.length > 0 && (
            <>
              <h3 className="mb-2 mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#0891b2" }}>
                Languages
              </h3>
              <ul className="space-y-0.5">
                {languages.map((language, i) => (
                  <li key={`lang-${i}`} className="text-xs" style={{ color: "#475569" }}>
                    {language}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default MedicalTemplate;
