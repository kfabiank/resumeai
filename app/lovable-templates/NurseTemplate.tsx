import { ResumeData } from "@/types/resume";
import { formatDate } from "@/lib/formatDate";

interface Props {
  data: ResumeData;
}

const NurseTemplate = ({ data }: Props) => {
  const { personalInfo, professionalSummary, experiences, education, skills } = data;

  return (
    <div className="a4-page p-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold" style={{ color: "#831843" }}>{personalInfo.name}</h1>
        <p className="mt-1 text-sm" style={{ color: "#be185d" }}>{personalInfo.headline}</p>
        <div className="mx-auto mt-2 h-0.5 w-16" style={{ background: "#ec4899" }} />
        <div className="mt-2 flex justify-center gap-4 text-xs" style={{ color: "#6b7280" }}>
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="mb-5">
        <p className="text-center text-sm italic leading-relaxed" style={{ color: "#4b5563" }}>
          {professionalSummary}
        </p>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#be185d", borderBottom: "1px solid #fce7f3", paddingBottom: "4px" }}>
          Education & Certifications
        </h2>
        {education.map((edu, i) => (
          <div key={i} className="mb-2 flex items-baseline justify-between">
            <div>
              <span className="text-sm font-semibold" style={{ color: "#831843" }}>{edu.degree}</span>
              <span className="ml-2 text-xs" style={{ color: "#6b7280" }}>{edu.institution}</span>
            </div>
            <span className="text-xs" style={{ color: "#9ca3af" }}>{formatDate(edu.graduationDate)}</span>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "#be185d", borderBottom: "1px solid #fce7f3", paddingBottom: "4px" }}>
          Professional Experience
        </h2>
        {experiences.map((exp, i) => (
          <div key={i} className="mb-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold" style={{ color: "#831843" }}>{exp.title}</h3>
              <span className="text-xs" style={{ color: "#9ca3af" }}>
                {formatDate(exp.startDate)} – {exp.current ? "Present" : formatDate(exp.endDate)}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#be185d" }}>{exp.company}</p>
            <ul className="mt-1.5 space-y-1">
              {exp.optimizedBullets.map((bullet, j) => (
                <li key={j} className="flex gap-2 text-xs" style={{ color: "#4b5563" }}>
                  <span style={{ color: "#ec4899" }}>♥</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="flex gap-6">
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#be185d" }}>Skills</h2>
          <p className="text-xs" style={{ color: "#4b5563" }}>{skills.technical.join(" · ")}</p>
        </section>
        <section className="flex-1">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "#be185d" }}>Strengths</h2>
          <p className="text-xs" style={{ color: "#4b5563" }}>{skills.soft.join(" · ")}</p>
        </section>
      </div>
    </div>
  );
};

export default NurseTemplate;
