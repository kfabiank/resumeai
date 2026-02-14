import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const ModernTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-10">
      {/* Header */}
      <div className="mb-6 border-b-2 pb-4" style={{ borderColor: "#2563eb" }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1e293b" }}>
          {personalInfo.name}
        </h1>
        <p className="mt-1 text-sm font-medium" style={{ color: "#2563eb" }}>
          {personalInfo.headline}
        </p>
        <div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: "#64748b" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      {/* Two columns */}
      <div className="flex gap-8">
        {/* Main */}
        <div className="flex-1">
          {/* Summary */}
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#2563eb" }}>
              Professional Summary
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
              {professionalSummary}
            </p>
          </section>

          {/* Experience */}
          <section className="mb-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#2563eb" }}>
              Experience
            </h2>
            {experiences.map((exp, i) => (
              <div key={i} className="mb-4">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                    {exp.title}
                  </h3>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
                  </span>
                </div>
                <p className="text-xs font-medium" style={{ color: "#64748b" }}>
                  {exp.company}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {exp.optimizedBullets.map((bullet, j) => (
                    <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                      <span style={{ color: "#2563eb" }}>•</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* Education */}
          <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#2563eb" }}>
              Education
            </h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                    {edu.degree}
                  </h3>
                  <span className="text-xs" style={{ color: "#94a3b8" }}>
                    {formatDate(edu.graduationDate)}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "#64748b" }}>
                  {edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}
                </p>
              </div>
            ))}
          </section>
        </div>

        {/* Sidebar */}
        <div className="w-44">
          <section className="mb-5">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#2563eb" }}>
              Technical Skills
            </h2>
            <div className="flex flex-wrap gap-1">
              {skills.technical.map((skill, i) => (
                <span
                  key={i}
                  className="rounded px-2 py-0.5 text-xs"
                  style={{ background: "#eff6ff", color: "#1d4ed8" }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#2563eb" }}>
              Soft Skills
            </h2>
            <ul className="space-y-1">
              {skills.soft.map((skill, i) => (
                <li key={i} className="text-xs" style={{ color: "#475569" }}>
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ModernTemplate;
