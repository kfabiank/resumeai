import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const BoardroomTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;
  const languages = (data.languages || [])
    .map((lang: any) => typeof lang === "string" ? lang : ((lang && (lang.name || "")) + ((lang && lang.level) ? (" (" + lang.level + ")") : "")))
    .filter(Boolean);

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', sans-serif", background: "#fcfcfb" }}>
      <header className="mb-7 border-b pb-4" style={{ borderColor: "#d4c7aa" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1c2430" }}>
              {personalInfo.name}
            </h1>
            <p className="mt-1 text-sm uppercase tracking-[0.18em]" style={{ color: "#7b6542" }}>
              {personalInfo.headline}
            </p>
          </div>
          <div className="text-right text-xs leading-5" style={{ color: "#4d5562" }}>
            <p>{personalInfo.email}</p>
            <p>{personalInfo.phone}</p>
            <p>{personalInfo.location}</p>
          </div>
        </div>
      </header>

      <section className="mb-6 rounded-lg border px-4 py-3" style={{ borderColor: "#e4dccd", background: "#fffdf7" }}>
        <h2 className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a6d3b" }}>
          Executive Profile
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#364152" }}>
          {professionalSummary}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a6d3b" }}>
          Leadership Experience
        </h2>
        <div className="space-y-4">
          {experiences.map((exp, i) => (
            <article key={i} className="rounded-md border p-3" style={{ borderColor: "#e9e5da", background: "#ffffff" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: "#1c2430" }}>
                    {exp.title}
                  </h3>
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#7b6542" }}>
                    {exp.company}
                  </p>
                </div>
                <span className="text-xs" style={{ color: "#6b7280" }}>
                  {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                </span>
              </div>
              <ul className="mt-2 space-y-1">
                {exp.optimizedBullets.map((bullet, j) => (
                  <li key={j} className="flex gap-2 text-xs" style={{ color: "#455064" }}>
                    <span style={{ color: "#8a6d3b" }}>•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a6d3b" }}>
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i} className="mb-2">
              <p className="text-sm font-semibold" style={{ color: "#1c2430" }}>
                {edu.degree}
              </p>
              <p className="text-xs" style={{ color: "#5d6675" }}>
                {edu.institution} · {formatDate(edu.graduationDate)} {edu.gpa ? `· GPA: ${edu.gpa}` : ""}
              </p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a6d3b" }}>
            Core Competencies
          </h2>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {skills.technical.map((skill, i) => (
              <span
                key={i}
                className="rounded px-2 py-0.5 text-xs"
                style={{ background: "#f2efe7", color: "#4a3d27" }}
              >
                {skill}
              </span>
            ))}
          </div>
          <ul className="space-y-1">
            {skills.soft.map((skill, i) => (
              <li key={i} className="text-xs" style={{ color: "#4f5a6c" }}>
                {skill}
              </li>
            ))}
          </ul>
          {languages.length > 0 && (
            <>
              <h3 className="mb-2 mt-3 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#8a6d3b" }}>
                Languages
              </h3>
              <ul className="space-y-1">
                {languages.map((language, i) => (
                  <li key={`lang-${i}`} className="text-xs" style={{ color: "#4f5a6c" }}>
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

export default BoardroomTemplate;
