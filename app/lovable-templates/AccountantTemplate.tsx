import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const AccountantTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-5 border-b pb-4" style={{ borderColor: "#334155" }}>
        <h1 className="text-2xl font-bold" style={{ color: "#0f172a" }}>{personalInfo.name}</h1>
        <p className="mt-0.5 text-sm" style={{ color: "#334155" }}>{personalInfo.headline}</p>
        <div className="mt-2 flex gap-4 text-xs" style={{ color: "#64748b" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-4">
        <h2 className="mb-1 text-xs font-bold uppercase" style={{ color: "#334155" }}>Professional Summary</h2>
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{professionalSummary}</p>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 text-xs font-bold uppercase" style={{ color: "#334155" }}>Experience</h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#0f172a" }}>{exp.title} — {exp.company}</h3>
              <span className="text-xs" style={{ color: "#94a3b8" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                  <span>•</span><span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-4">
        <h2 className="mb-1 text-xs font-bold uppercase" style={{ color: "#334155" }}>Education</h2>
        {education.map((edu, i) => (
          <p key={i} className="text-sm" style={{ color: "#475569" }}>
            <span className="font-semibold" style={{ color: "#0f172a" }}>{edu.degree}</span> — {edu.institution}, {formatDate(edu.graduationDate)}
            {edu.gpa && ` (GPA: ${edu.gpa})`}
          </p>
        ))}
      </section>

      <section>
        <h2 className="mb-1 text-xs font-bold uppercase" style={{ color: "#334155" }}>Skills</h2>
        <p className="text-xs" style={{ color: "#475569" }}>{[...skills.technical, ...skills.soft].join(", ")}</p>
      </section>
    </div>
  );
};

export default AccountantTemplate;
