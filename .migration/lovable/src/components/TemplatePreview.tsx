interface TemplatePreviewProps {
  templateId: string;
  colors: string;
  compact?: boolean;
}

export function TemplatePreview({ templateId, colors, compact = true }: TemplatePreviewProps) {
  const textSize = compact ? "text-[8px]" : "text-[10px]";
  const sectionGap = compact ? "space-y-2" : "space-y-3";
  const pad = compact ? "p-3" : "p-5";

  switch (templateId) {
    case "creative-bold":
      return (
        <div className={`h-full w-full bg-white flex ${textSize}`}>
          <div className={`w-1/3 bg-gradient-to-b ${colors} text-white ${pad} ${sectionGap}`}>
            <p className="font-bold">John Doe</p>
            <p>Product Designer</p>
            <p>SF, CA</p>
            <p>john@email.com</p>
          </div>
          <div className={`w-2/3 ${pad} ${sectionGap} text-slate-700`}>
            <p className="font-semibold text-slate-900">Selected Projects</p>
            <p>Fintech Redesign (+24% conv.)</p>
            <p>Design System v3</p>
            <p className="font-semibold text-slate-900">Toolkit</p>
            <p>Figma, Framer, After Effects</p>
          </div>
        </div>
      );
    case "academic-formal":
      return (
        <div className={`h-full w-full bg-white ${pad} ${textSize} text-slate-700 ${sectionGap}`}>
          <p className="font-bold text-slate-900 text-[11px]">Dr. John Doe</p>
          <p className="italic">Computational Biology Researcher</p>
          <div className={`h-[1px] w-full bg-gradient-to-r ${colors}`} />
          <p><span className="font-semibold text-slate-900">Education:</span> PhD, MIT</p>
          <p><span className="font-semibold text-slate-900">Publications:</span> Nature, Science</p>
          <p><span className="font-semibold text-slate-900">Grants:</span> NIH R01, NSF</p>
        </div>
      );
    case "consultant-pro":
      return (
        <div className={`h-full w-full bg-white ${pad} ${textSize} text-slate-700`}>
          <div className="grid grid-cols-2 gap-3 h-full">
            <div className={sectionGap}>
              <p className="font-bold text-slate-900 text-[11px]">John Doe</p>
              <p>Management Consultant</p>
              <p className="font-semibold text-slate-900">Domains</p>
              <p>Ops, GTM, PMO</p>
            </div>
            <div className={sectionGap}>
              <div className={`rounded bg-gradient-to-r ${colors} text-white p-2`}>
                <p>Impact</p>
                <p>+18% margin</p>
                <p>$2.3M savings</p>
              </div>
            </div>
          </div>
        </div>
      );
    case "executive-classic":
      return (
        <div className={`h-full w-full bg-white ${pad} ${textSize} text-slate-700 ${sectionGap}`}>
          <div className={`h-1.5 w-24 rounded bg-gradient-to-r ${colors}`} />
          <p className="font-bold text-slate-900 text-[11px]">John Doe, MBA</p>
          <p>VP Product & Strategy</p>
          <p className="font-semibold text-slate-900">Board-Level Summary</p>
          <p>Scaled ARR from $12M to $48M in 3 years.</p>
          <p className="font-semibold text-slate-900">Leadership</p>
          <p>Led 60-person cross-functional org.</p>
        </div>
      );
    case "startup-modern":
      return (
        <div className={`h-full w-full bg-slate-50 ${pad} ${textSize} text-slate-700`}>
          <div className={`rounded-xl p-2 bg-gradient-to-r ${colors} text-white mb-2`}>
            <p className="font-bold">John Doe</p>
            <p>Founding Engineer</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="rounded bg-white p-2">
              <p className="font-semibold">Growth</p>
              <p>0→120k MAU</p>
            </div>
            <div className="rounded bg-white p-2">
              <p className="font-semibold">Speed</p>
              <p>-41% deploy</p>
            </div>
            <div className="rounded bg-white p-2">
              <p className="font-semibold">Up</p>
              <p>99.95%</p>
            </div>
          </div>
          <p>React, Node, Postgres</p>
        </div>
      );
    case "simple-clean":
      return (
        <div className={`h-full w-full bg-white ${pad} ${textSize} text-slate-700 ${sectionGap}`}>
          <p className="font-bold text-slate-900 text-[11px]">John Doe</p>
          <div className="h-[1px] bg-slate-300" />
          <p>Senior Software Engineer</p>
          <p className="font-semibold text-slate-900">Experience</p>
          <p>Acme Tech, Beta Labs, Nova</p>
          <p className="font-semibold text-slate-900">Skills</p>
          <p>TypeScript, React, Node, SQL</p>
        </div>
      );
    case "tech-minimal":
      return (
        <div className={`h-full w-full bg-white ${pad} ${textSize} text-slate-700`}>
          <div className={`h-7 rounded bg-gradient-to-r ${colors} mb-3`} />
          <div className="grid grid-cols-[1fr_2fr] gap-3 h-[80%]">
            <div className={sectionGap}>
              <p className="font-semibold text-slate-900">Stack</p>
              <p>Next.js</p>
              <p>Prisma</p>
              <p>Postgres</p>
            </div>
            <div className={sectionGap}>
              <p className="font-semibold text-slate-900">Timeline</p>
              <p>2024 - Staff Eng</p>
              <p>2022 - Senior Eng</p>
              <p>2020 - SWE</p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className={`h-full w-full bg-white ${pad} ${textSize} text-slate-700 ${sectionGap}`}>
          <div className={`rounded ${compact ? "p-2" : "p-3"} bg-gradient-to-r ${colors} text-white`}>
            <p className="font-bold text-[11px]">John Doe</p>
            <p>Senior Software Engineer</p>
          </div>
          <p className="font-semibold text-slate-900">Summary</p>
          <p>8+ years building scalable products with React and Node.js.</p>
          <p className="font-semibold text-slate-900">Experience</p>
          <p>Led migration to microservices, +35% velocity.</p>
          <p className="font-semibold text-slate-900">Skills</p>
          <p>TypeScript, React, PostgreSQL, AWS</p>
        </div>
      );
  }
}
