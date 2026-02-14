import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const CreativeTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page flex">
      {/* Left sidebar */}
      <div className="w-56 p-8" style={{ background: "#1a1a2e", color: "#e2e8f0" }}>
        <div className="mb-8">
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", color: "white" }}
          >
            {personalInfo.name.split(" ").map(n => n[0]).join("")}
          </div>
          <h1 className="text-center text-lg font-bold">{personalInfo.name}</h1>
          <p className="mt-1 text-center text-xs" style={{ color: "#f59e0b" }}>
            {personalInfo.headline}
          </p>
        </div>

        {/* Contact */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Contact
          </h2>
          <div className="space-y-1.5 text-xs" style={{ color: "#94a3b8" }}>
            <p>{personalInfo.email}</p>
            <p>{personalInfo.phone}</p>
            <p>{personalInfo.location}</p>
          </div>
        </section>

        {/* Skills */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-1">
            {skills.technical.map((skill, i) => (
              <span
                key={i}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{ background: "#2d2d4e", color: "#f59e0b" }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        {/* Soft skills */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#f59e0b" }}>
            Strengths
          </h2>
          <ul className="space-y-1 text-xs" style={{ color: "#94a3b8" }}>
            {skills.soft.map((skill, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#f59e0b" }} />
                {skill}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Right main */}
      <div className="flex-1 p-8">
        {/* Summary */}
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
            About Me
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#334155" }}>
            {professionalSummary}
          </p>
        </section>

        <div className="mb-6 h-px" style={{ background: "linear-gradient(to right, #ef4444, #f59e0b, transparent)" }} />

        {/* Experience */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
            Experience
          </h2>
          {experiences.map((exp, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold" style={{ color: "#0f172a" }}>
                  {exp.title}
                </h3>
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <p className="text-xs font-medium" style={{ color: "#ef4444" }}>
                {exp.company}
              </p>
              <ul className="mt-1.5 space-y-1">
                {exp.optimizedBullets.map((bullet, j) => (
                  <li key={j} className="flex gap-2 text-xs" style={{ color: "#475569" }}>
                    <span style={{ color: "#f59e0b" }}>▸</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Education */}
        <section>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#ef4444" }}>
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i}>
              <p className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                {edu.degree}
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                {edu.institution} · {formatDate(edu.graduationDate)} · GPA: {edu.gpa}
              </p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default CreativeTemplate;
