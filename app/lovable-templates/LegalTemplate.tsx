import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const LegalTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-12" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <div className="mb-6 border-b-2 pb-4" style={{ borderColor: "#1e3a5f" }}>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1e3a5f" }}>
          {personalInfo.name}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#1e3a5f", fontFamily: "'Inter', sans-serif" }}>
          {personalInfo.headline}
        </p>
        <div className="mt-2 flex gap-4 text-xs" style={{ color: "#64748b", fontFamily: "'Inter', sans-serif" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <h2 className="mb-2 text-sm font-bold uppercase" style={{ color: "#1e3a5f", letterSpacing: "0.1em" }}>
          Professional Profile
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#334155", fontFamily: "'Inter', sans-serif" }}>
          {professionalSummary}
        </p>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-sm font-bold uppercase" style={{ color: "#1e3a5f", letterSpacing: "0.1em" }}>
          Education
        </h2>
        {education.map((edu, i) => (
          <div key={i} className="mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold" style={{ color: "#1e3a5f" }}>{edu.degree}</span>
              <span className="text-xs" style={{ color: "#94a3b8" }}>{formatDate(edu.graduationDate)}</span>
            </div>
            <p className="text-xs" style={{ color: "#64748b" }}>{edu.institution} {edu.gpa && `· GPA: ${edu.gpa}`}</p>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-sm font-bold uppercase" style={{ color: "#1e3a5f", letterSpacing: "0.1em" }}>
          Legal Experience
        </h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#1e3a5f" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs italic" style={{ color: "#64748b" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span style={{ color: "#1e3a5f" }}>§</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase" style={{ color: "#1e3a5f", letterSpacing: "0.1em" }}>
          Areas of Expertise
        </h2>
        <p className="text-xs" style={{ color: "#475569", fontFamily: "'Inter', sans-serif" }}>
          {[...skills.technical, ...skills.soft].join(" · ")}
        </p>
      </section>
    </div>
  );
};

export default LegalTemplate;
