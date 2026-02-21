/**
 * Additional Premium Templates — Batch 2
 * 10 more self-contained HTML+CSS templates for DB storage
 * Same variable system as premiumTemplates.ts
 */

import type { PremiumTemplate } from "@/lib/premiumTemplates";

// ─────────────────────────────────────────────
// 1. MODERN PROFESSIONAL
// ─────────────────────────────────────────────
const modernProfessionalHtml = `
<div class="mod-resume">
  <header class="mod-header">
    <div class="mod-header-left">
      <h1 class="mod-name">{{firstName}} {{lastName}}</h1>
      <p class="mod-headline">{{summary}}</p>
    </div>
    <div class="mod-header-right">
      <p>{{email}}</p>
      <p>{{phone}}</p>
      <p>{{location}}</p>
    </div>
  </header>

  <div class="mod-accent-line"></div>

  <div class="mod-body">
    <main class="mod-main">
      <section class="mod-section">
        <h2 class="mod-title">Experience</h2>
        {{#experience}}
        <div class="mod-entry">
          <div class="mod-entry-top">
            <h3 class="mod-role">{{title}}</h3>
            <span class="mod-dates">{{startDate}} – {{endDate}}</span>
          </div>
          <p class="mod-company">{{company}} · {{location}}</p>
          <ul class="mod-bullets">
            {{#description}}<li>{{.}}</li>{{/description}}
          </ul>
        </div>
        {{/experience}}
      </section>

      <section class="mod-section">
        <h2 class="mod-title">Education</h2>
        {{#education}}
        <div class="mod-edu">
          <h3 class="mod-role">{{degree}}</h3>
          <p class="mod-company">{{institution}} · {{graduationYear}}{{#gpa}} · GPA: {{gpa}}{{/gpa}}</p>
        </div>
        {{/education}}
      </section>
    </main>

    <aside class="mod-sidebar">
      <section class="mod-section">
        <h2 class="mod-title">Skills</h2>
        <div class="mod-tags">
          {{#skills}}<span class="mod-tag">{{.}}</span>{{/skills}}
        </div>
      </section>
      {{#certifications.length}}
      <section class="mod-section">
        <h2 class="mod-title">Certifications</h2>
        {{#certifications}}
        <p class="mod-cert"><strong>{{name}}</strong><br/>{{issuer}} · {{date}}</p>
        {{/certifications}}
      </section>
      {{/certifications.length}}
    </aside>
  </div>
</div>
`;

const modernProfessionalCss = `
:root {
  --mod-primary: #1e40af;
  --mod-text: #1f2937;
  --mod-muted: #6b7280;
  --mod-bg: #ffffff;
  --mod-line: #dbeafe;
}
.mod-resume { max-width:794px; margin:0 auto; padding:44px 48px; background:var(--mod-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; }
.mod-header { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
.mod-header-left { flex:1; }
.mod-name { font-size:24pt; font-weight:700; color:var(--mod-text); margin:0; }
.mod-headline { font-size:9.5pt; color:var(--mod-muted); margin:6px 0 0; line-height:1.5; }
.mod-header-right { text-align:right; font-size:9pt; color:var(--mod-muted); }
.mod-header-right p { margin:2px 0; }
.mod-accent-line { height:3px; margin:16px 0 20px; background:linear-gradient(to right,var(--mod-primary),var(--mod-line)); border-radius:2px; }
.mod-body { display:grid; grid-template-columns:1fr 200px; gap:28px; }
.mod-main { min-width:0; }
.mod-section { margin-bottom:20px; }
.mod-title { font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:var(--mod-primary); margin:0 0 10px; padding-bottom:4px; border-bottom:1px solid var(--mod-line); }
.mod-entry { margin-bottom:14px; }
.mod-entry-top { display:flex; justify-content:space-between; align-items:baseline; }
.mod-role { font-size:11pt; font-weight:600; color:var(--mod-text); margin:0; }
.mod-dates { font-size:9pt; color:var(--mod-muted); white-space:nowrap; }
.mod-company { font-size:9pt; color:var(--mod-primary); margin:2px 0 0; }
.mod-bullets { margin:5px 0 0; padding:0; list-style:none; }
.mod-bullets li { font-size:9.5pt; color:var(--mod-text); margin-bottom:3px; padding-left:12px; position:relative; }
.mod-bullets li::before { content:'•'; position:absolute; left:0; color:var(--mod-primary); }
.mod-edu { margin-bottom:8px; }
.mod-tags { display:flex; flex-wrap:wrap; gap:4px; }
.mod-tag { font-size:8.5pt; padding:2px 8px; border-radius:4px; background:var(--mod-line); color:var(--mod-primary); font-weight:500; }
.mod-cert { font-size:9pt; color:var(--mod-text); margin:4px 0; }
.mod-sidebar { border-left:1px solid var(--mod-line); padding-left:20px; }
@media print { .mod-resume { padding:36px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 2. STARTUP MODERN
// ─────────────────────────────────────────────
const startupModernHtml = `
<div class="srt-resume">
  <header class="srt-header">
    <div class="srt-badge">⚡</div>
    <div>
      <h1 class="srt-name">{{firstName}} {{lastName}}</h1>
      <div class="srt-contact">{{email}} · {{phone}} · {{location}}</div>
    </div>
  </header>
  <p class="srt-summary">{{summary}}</p>

  <section class="srt-section">
    <h2 class="srt-title">🚀 Experience</h2>
    {{#experience}}
    <div class="srt-entry">
      <div class="srt-entry-top">
        <h3 class="srt-role">{{title}} <span class="srt-at">@ {{company}}</span></h3>
        <span class="srt-dates">{{startDate}} – {{endDate}}</span>
      </div>
      <ul class="srt-bullets">
        {{#description}}<li>{{.}}</li>{{/description}}
      </ul>
    </div>
    {{/experience}}
  </section>

  <div class="srt-grid">
    <section class="srt-section">
      <h2 class="srt-title">🛠 Skills</h2>
      <div class="srt-tags">
        {{#skills}}<span class="srt-tag">{{.}}</span>{{/skills}}
      </div>
    </section>
    <section class="srt-section">
      <h2 class="srt-title">🎓 Education</h2>
      {{#education}}
      <p class="srt-edu"><strong>{{degree}}</strong><br/>{{institution}} · {{graduationYear}}</p>
      {{/education}}
    </section>
  </div>
</div>
`;

const startupModernCss = `
:root { --srt-accent:#ea580c; --srt-text:#1e293b; --srt-muted:#64748b; --srt-bg:#fff; --srt-card:#fff7ed; }
.srt-resume { max-width:794px; margin:0 auto; padding:40px 44px; background:var(--srt-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; }
.srt-header { display:flex; align-items:center; gap:14px; margin-bottom:12px; }
.srt-badge { font-size:28pt; line-height:1; }
.srt-name { font-size:22pt; font-weight:800; color:var(--srt-text); margin:0; }
.srt-contact { font-size:9pt; color:var(--srt-muted); margin-top:4px; }
.srt-summary { font-size:10pt; color:var(--srt-text); background:var(--srt-card); padding:12px 16px; border-radius:8px; border-left:3px solid var(--srt-accent); margin:0 0 20px; }
.srt-section { margin-bottom:18px; }
.srt-title { font-size:10pt; font-weight:700; color:var(--srt-accent); margin:0 0 10px; }
.srt-entry { margin-bottom:14px; }
.srt-entry-top { display:flex; justify-content:space-between; align-items:baseline; }
.srt-role { font-size:11pt; font-weight:600; color:var(--srt-text); margin:0; }
.srt-at { font-weight:400; color:var(--srt-accent); }
.srt-dates { font-size:9pt; color:var(--srt-muted); white-space:nowrap; }
.srt-bullets { margin:5px 0 0; padding:0; list-style:none; }
.srt-bullets li { font-size:9.5pt; color:var(--srt-text); margin-bottom:3px; padding-left:14px; position:relative; }
.srt-bullets li::before { content:'▸'; position:absolute; left:0; color:var(--srt-accent); }
.srt-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.srt-tags { display:flex; flex-wrap:wrap; gap:5px; }
.srt-tag { font-size:8.5pt; padding:3px 10px; border-radius:20px; background:var(--srt-card); border:1px solid #fed7aa; color:var(--srt-accent); font-weight:500; }
.srt-edu { font-size:9.5pt; color:var(--srt-text); margin:4px 0; }
@media print { .srt-resume { padding:36px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 3. CONSULTANT PRO
// ─────────────────────────────────────────────
const consultantProHtml = `
<div class="con-resume">
  <header class="con-header">
    <h1 class="con-name">{{firstName}} {{lastName}}</h1>
    <p class="con-sub">{{email}} | {{phone}} | {{location}}</p>
  </header>
  <div class="con-bar"></div>
  <section class="con-section">
    <h2 class="con-title">Executive Summary</h2>
    <p class="con-text">{{summary}}</p>
  </section>
  <section class="con-section">
    <h2 class="con-title">Professional Experience</h2>
    {{#experience}}
    <div class="con-entry">
      <div class="con-row"><h3 class="con-role">{{title}}</h3><span class="con-dates">{{startDate}} – {{endDate}}</span></div>
      <p class="con-company">{{company}} — {{location}}</p>
      <ul class="con-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <div class="con-two-col">
    <section class="con-section">
      <h2 class="con-title">Education</h2>
      {{#education}}<p class="con-edu"><strong>{{degree}}</strong><br/>{{institution}} · {{graduationYear}}</p>{{/education}}
    </section>
    <section class="con-section">
      <h2 class="con-title">Areas of Expertise</h2>
      <div class="con-tags">{{#skills}}<span class="con-tag">{{.}}</span>{{/skills}}</div>
    </section>
  </div>
</div>
`;

const consultantProCss = `
:root { --con-accent:#4338ca; --con-text:#1f2937; --con-muted:#6b7280; --con-bg:#fff; --con-line:#e0e7ff; }
.con-resume { max-width:794px; margin:0 auto; padding:48px 52px; background:var(--con-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; }
.con-header { text-align:center; margin-bottom:6px; }
.con-name { font-size:26pt; font-weight:700; color:var(--con-text); margin:0; letter-spacing:-0.01em; }
.con-sub { font-size:9pt; color:var(--con-muted); margin:6px 0 0; }
.con-bar { height:2px; margin:14px 0 20px; background:linear-gradient(to right,transparent,var(--con-accent),transparent); }
.con-section { margin-bottom:18px; }
.con-title { font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:0.2em; color:var(--con-accent); margin:0 0 10px; }
.con-text { font-size:10pt; color:var(--con-text); margin:0; }
.con-entry { margin-bottom:14px; }
.con-row { display:flex; justify-content:space-between; align-items:baseline; }
.con-role { font-size:11pt; font-weight:600; color:var(--con-text); margin:0; }
.con-dates { font-size:9pt; color:var(--con-muted); white-space:nowrap; }
.con-company { font-size:9pt; color:var(--con-accent); margin:2px 0 0; }
.con-bullets { margin:5px 0 0; padding:0; list-style:none; }
.con-bullets li { font-size:9.5pt; margin-bottom:3px; padding-left:14px; position:relative; color:var(--con-text); }
.con-bullets li::before { content:'■'; position:absolute; left:0; color:var(--con-accent); font-size:5pt; top:5px; }
.con-two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.con-edu { font-size:9.5pt; color:var(--con-text); margin:4px 0; }
.con-tags { display:flex; flex-wrap:wrap; gap:5px; }
.con-tag { font-size:8.5pt; padding:3px 10px; border:1px solid var(--con-line); border-radius:4px; color:var(--con-accent); }
@media print { .con-resume { padding:40px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 4. ACADEMIC FORMAL
// ─────────────────────────────────────────────
const academicFormalHtml = `
<div class="acd-resume">
  <header class="acd-header">
    <h1 class="acd-name">{{firstName}} {{lastName}}</h1>
    <p class="acd-contact">{{email}} · {{phone}} · {{location}}</p>
  </header>
  <hr class="acd-hr"/>
  <section class="acd-section">
    <h2 class="acd-title">Research Interests</h2>
    <p class="acd-text">{{summary}}</p>
  </section>
  <section class="acd-section">
    <h2 class="acd-title">Education</h2>
    {{#education}}
    <div class="acd-row"><strong>{{degree}}</strong> — {{institution}}, {{graduationYear}}{{#gpa}} (GPA: {{gpa}}){{/gpa}}</div>
    {{/education}}
  </section>
  <section class="acd-section">
    <h2 class="acd-title">Professional Experience</h2>
    {{#experience}}
    <div class="acd-entry">
      <div class="acd-entry-top"><h3 class="acd-role">{{title}}, {{company}}</h3><span class="acd-dates">{{startDate}} – {{endDate}}</span></div>
      <ul class="acd-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <section class="acd-section">
    <h2 class="acd-title">Skills & Competencies</h2>
    <p class="acd-text">{{#skills}}{{.}}{{^last}}, {{/last}}{{/skills}}</p>
  </section>
  {{#certifications.length}}
  <section class="acd-section">
    <h2 class="acd-title">Certifications & Awards</h2>
    {{#certifications}}<div class="acd-row">{{name}} — {{issuer}}, {{date}}</div>{{/certifications}}
  </section>
  {{/certifications.length}}
</div>
`;

const academicFormalCss = `
:root { --acd-text:#1a1a1a; --acd-muted:#555; --acd-accent:#166534; --acd-bg:#fff; }
.acd-resume { max-width:794px; margin:0 auto; padding:48px 56px; background:var(--acd-bg); font-family:'Georgia','Times New Roman',serif; font-size:10.5pt; line-height:1.6; box-sizing:border-box; color:var(--acd-text); }
.acd-header { text-align:center; margin-bottom:4px; }
.acd-name { font-size:22pt; font-weight:400; margin:0; }
.acd-contact { font-size:9pt; color:var(--acd-muted); margin:4px 0 0; font-family:'Inter',sans-serif; }
.acd-hr { border:none; border-top:1px solid #ccc; margin:14px 0 18px; }
.acd-section { margin-bottom:16px; }
.acd-title { font-size:11pt; font-weight:700; color:var(--acd-accent); margin:0 0 8px; border-bottom:1px solid #ddd; padding-bottom:3px; }
.acd-text { font-size:10pt; margin:0; font-family:'Inter',sans-serif; }
.acd-row { font-size:10pt; margin:4px 0; }
.acd-entry { margin-bottom:12px; }
.acd-entry-top { display:flex; justify-content:space-between; align-items:baseline; }
.acd-role { font-size:10.5pt; font-weight:600; margin:0; }
.acd-dates { font-size:9pt; color:var(--acd-muted); font-family:'Inter',sans-serif; white-space:nowrap; }
.acd-bullets { margin:4px 0 0 18px; padding:0; }
.acd-bullets li { font-size:9.5pt; margin-bottom:2px; font-family:'Inter',sans-serif; }
@media print { .acd-resume { padding:40px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 5. DATA SCIENCE INSIGHT
// ─────────────────────────────────────────────
const dataScienceHtml = `
<div class="ds-resume">
  <header class="ds-header">
    <h1 class="ds-name">{{firstName}} {{lastName}}</h1>
    <p class="ds-tagline">{{summary}}</p>
    <div class="ds-contact">{{email}} · {{phone}} · {{location}}</div>
  </header>
  <section class="ds-section">
    <h2 class="ds-title">📊 Experience</h2>
    {{#experience}}
    <div class="ds-entry">
      <div class="ds-row"><h3 class="ds-role">{{title}}</h3><span class="ds-dates">{{startDate}} – {{endDate}}</span></div>
      <p class="ds-company">{{company}} · {{location}}</p>
      <ul class="ds-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <section class="ds-section">
    <h2 class="ds-title">🧰 Technical Stack</h2>
    <div class="ds-tags">{{#skills}}<span class="ds-tag">{{.}}</span>{{/skills}}</div>
  </section>
  <div class="ds-grid">
    <section class="ds-section">
      <h2 class="ds-title">🎓 Education</h2>
      {{#education}}<p class="ds-edu"><strong>{{degree}}</strong><br/>{{institution}} · {{graduationYear}}</p>{{/education}}
    </section>
    {{#certifications.length}}
    <section class="ds-section">
      <h2 class="ds-title">📜 Certifications</h2>
      {{#certifications}}<p class="ds-edu">{{name}} — {{issuer}} · {{date}}</p>{{/certifications}}
    </section>
    {{/certifications.length}}
  </div>
</div>
`;

const dataScienceCss = `
:root { --ds-accent:#0e7490; --ds-text:#0f172a; --ds-muted:#64748b; --ds-bg:#fff; --ds-card:#ecfeff; }
.ds-resume { max-width:794px; margin:0 auto; padding:40px 46px; background:var(--ds-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; }
.ds-header { margin-bottom:20px; border-bottom:2px solid var(--ds-accent); padding-bottom:14px; }
.ds-name { font-size:24pt; font-weight:800; color:var(--ds-text); margin:0; }
.ds-tagline { font-size:9.5pt; color:var(--ds-muted); margin:4px 0 0; }
.ds-contact { font-size:9pt; color:var(--ds-muted); margin-top:6px; }
.ds-section { margin-bottom:18px; }
.ds-title { font-size:10pt; font-weight:700; color:var(--ds-accent); margin:0 0 10px; }
.ds-entry { margin-bottom:14px; }
.ds-row { display:flex; justify-content:space-between; align-items:baseline; }
.ds-role { font-size:11pt; font-weight:600; color:var(--ds-text); margin:0; }
.ds-dates { font-size:9pt; color:var(--ds-muted); white-space:nowrap; }
.ds-company { font-size:9pt; color:var(--ds-accent); margin:2px 0 0; }
.ds-bullets { margin:5px 0 0; padding:0; list-style:none; }
.ds-bullets li { font-size:9.5pt; margin-bottom:3px; padding-left:14px; position:relative; color:var(--ds-text); }
.ds-bullets li::before { content:'▹'; position:absolute; left:0; color:var(--ds-accent); }
.ds-tags { display:flex; flex-wrap:wrap; gap:5px; }
.ds-tag { font-size:8.5pt; padding:3px 10px; border-radius:4px; background:var(--ds-card); color:var(--ds-accent); font-weight:600; font-family:'JetBrains Mono',monospace; }
.ds-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.ds-edu { font-size:9.5pt; color:var(--ds-text); margin:4px 0; }
@media print { .ds-resume { padding:36px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 6. DEVOPS INFRA
// ─────────────────────────────────────────────
const devopsHtml = `
<div class="dvo-resume">
  <header class="dvo-header">
    <div class="dvo-prompt">$ whoami</div>
    <h1 class="dvo-name">{{firstName}} {{lastName}}</h1>
    <div class="dvo-contact">{{email}} | {{phone}} | {{location}}</div>
    <p class="dvo-summary">{{summary}}</p>
  </header>
  <section class="dvo-section">
    <h2 class="dvo-title">## deployments (experience)</h2>
    {{#experience}}
    <div class="dvo-entry">
      <div class="dvo-row"><h3 class="dvo-role">{{title}}</h3><span class="dvo-dates">{{startDate}} → {{endDate}}</span></div>
      <p class="dvo-company">{{company}} · {{location}}</p>
      <ul class="dvo-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <section class="dvo-section">
    <h2 class="dvo-title">## toolchain</h2>
    <div class="dvo-tags">{{#skills}}<span class="dvo-tag">{{.}}</span>{{/skills}}</div>
  </section>
  <div class="dvo-grid">
    <section class="dvo-section">
      <h2 class="dvo-title">## education</h2>
      {{#education}}<p class="dvo-edu"><strong>{{degree}}</strong><br/>{{institution}} · {{graduationYear}}</p>{{/education}}
    </section>
    {{#certifications.length}}
    <section class="dvo-section">
      <h2 class="dvo-title">## certifications</h2>
      {{#certifications}}<p class="dvo-edu">{{name}} — {{issuer}} · {{date}}</p>{{/certifications}}
    </section>
    {{/certifications.length}}
  </div>
</div>
`;

const devopsCss = `
:root { --dvo-accent:#059669; --dvo-text:#0f172a; --dvo-muted:#64748b; --dvo-bg:#fff; --dvo-dark:#0f172a; }
.dvo-resume { max-width:794px; margin:0 auto; padding:40px 46px; background:var(--dvo-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; }
.dvo-header { background:var(--dvo-dark); color:#e2e8f0; padding:24px 28px; border-radius:8px; margin-bottom:20px; }
.dvo-prompt { font-family:'JetBrains Mono',monospace; font-size:9pt; color:var(--dvo-accent); margin-bottom:4px; }
.dvo-name { font-size:22pt; font-weight:700; color:#fff; margin:0; font-family:'JetBrains Mono',monospace; }
.dvo-contact { font-size:9pt; color:#94a3b8; margin-top:6px; }
.dvo-summary { font-size:9.5pt; color:#cbd5e1; margin:10px 0 0; line-height:1.5; }
.dvo-section { margin-bottom:18px; }
.dvo-title { font-family:'JetBrains Mono',monospace; font-size:9pt; font-weight:700; color:var(--dvo-accent); margin:0 0 10px; }
.dvo-entry { margin-bottom:14px; border-left:2px solid var(--dvo-accent); padding-left:12px; }
.dvo-row { display:flex; justify-content:space-between; align-items:baseline; }
.dvo-role { font-size:11pt; font-weight:600; color:var(--dvo-text); margin:0; }
.dvo-dates { font-size:9pt; color:var(--dvo-muted); white-space:nowrap; }
.dvo-company { font-size:9pt; color:var(--dvo-accent); margin:2px 0 0; }
.dvo-bullets { margin:5px 0 0; padding:0; list-style:none; }
.dvo-bullets li { font-size:9.5pt; margin-bottom:3px; padding-left:14px; position:relative; color:var(--dvo-text); }
.dvo-bullets li::before { content:'→'; position:absolute; left:0; color:var(--dvo-accent); }
.dvo-tags { display:flex; flex-wrap:wrap; gap:5px; }
.dvo-tag { font-size:8.5pt; padding:3px 10px; border-radius:3px; background:var(--dvo-dark); color:var(--dvo-accent); font-family:'JetBrains Mono',monospace; }
.dvo-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.dvo-edu { font-size:9.5pt; color:var(--dvo-text); margin:4px 0; }
@media print { .dvo-resume { padding:36px; box-shadow:none; } .dvo-header { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

// ─────────────────────────────────────────────
// 7. LEGAL COUNSEL
// ─────────────────────────────────────────────
const legalHtml = `
<div class="leg-resume">
  <header class="leg-header">
    <h1 class="leg-name">{{firstName}} {{lastName}}</h1>
    <div class="leg-bar"></div>
    <p class="leg-contact">{{email}} · {{phone}} · {{location}}</p>
  </header>
  <section class="leg-section">
    <h2 class="leg-title">Professional Profile</h2>
    <p class="leg-text">{{summary}}</p>
  </section>
  <section class="leg-section">
    <h2 class="leg-title">Legal Experience</h2>
    {{#experience}}
    <div class="leg-entry">
      <div class="leg-row"><h3 class="leg-role">{{title}}</h3><span class="leg-dates">{{startDate}} – {{endDate}}</span></div>
      <p class="leg-firm">{{company}}, {{location}}</p>
      <ul class="leg-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <section class="leg-section">
    <h2 class="leg-title">Education</h2>
    {{#education}}<div class="leg-edu"><strong>{{degree}}</strong> — {{institution}}, {{graduationYear}}{{#gpa}} (GPA: {{gpa}}){{/gpa}}</div>{{/education}}
  </section>
  <div class="leg-two-col">
    <section class="leg-section">
      <h2 class="leg-title">Practice Areas</h2>
      <div class="leg-tags">{{#skills}}<span class="leg-tag">{{.}}</span>{{/skills}}</div>
    </section>
    {{#certifications.length}}
    <section class="leg-section">
      <h2 class="leg-title">Bar Admissions & Certifications</h2>
      {{#certifications}}<p class="leg-cert">{{name}} — {{issuer}}, {{date}}</p>{{/certifications}}
    </section>
    {{/certifications.length}}
  </div>
</div>
`;

const legalCss = `
:root { --leg-accent:#3f3f46; --leg-text:#18181b; --leg-muted:#71717a; --leg-bg:#fff; --leg-line:#d4d4d8; }
.leg-resume { max-width:794px; margin:0 auto; padding:48px 56px; background:var(--leg-bg); font-family:'Georgia',serif; font-size:10.5pt; line-height:1.55; box-sizing:border-box; color:var(--leg-text); }
.leg-header { text-align:center; margin-bottom:18px; }
.leg-name { font-size:26pt; font-weight:400; margin:0; letter-spacing:0.03em; }
.leg-bar { width:40px; height:2px; background:var(--leg-accent); margin:10px auto; }
.leg-contact { font-size:9pt; color:var(--leg-muted); font-family:'Inter',sans-serif; margin:0; }
.leg-section { margin-bottom:16px; }
.leg-title { font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:0.2em; color:var(--leg-accent); margin:0 0 8px; font-family:'Inter',sans-serif; border-bottom:1px solid var(--leg-line); padding-bottom:4px; }
.leg-text { font-size:10pt; margin:0; font-family:'Inter',sans-serif; color:var(--leg-text); }
.leg-entry { margin-bottom:14px; }
.leg-row { display:flex; justify-content:space-between; align-items:baseline; }
.leg-role { font-size:11pt; font-weight:700; margin:0; }
.leg-dates { font-size:9pt; color:var(--leg-muted); font-family:'Inter',sans-serif; white-space:nowrap; }
.leg-firm { font-size:9pt; color:var(--leg-muted); margin:2px 0 0; font-family:'Inter',sans-serif; }
.leg-bullets { margin:5px 0 0 16px; padding:0; }
.leg-bullets li { font-size:9.5pt; margin-bottom:3px; font-family:'Inter',sans-serif; }
.leg-edu { font-size:10pt; margin:4px 0; }
.leg-two-col { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.leg-tags { display:flex; flex-wrap:wrap; gap:5px; }
.leg-tag { font-size:8.5pt; padding:3px 10px; border:1px solid var(--leg-line); border-radius:3px; color:var(--leg-accent); font-family:'Inter',sans-serif; }
.leg-cert { font-size:9.5pt; margin:4px 0; font-family:'Inter',sans-serif; }
@media print { .leg-resume { padding:40px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 8. MEDICAL SPECIALIST
// ─────────────────────────────────────────────
const medicalHtml = `
<div class="med-resume">
  <header class="med-header">
    <div class="med-header-bar"></div>
    <h1 class="med-name">{{firstName}} {{lastName}}</h1>
    <p class="med-contact">{{email}} · {{phone}} · {{location}}</p>
  </header>
  <section class="med-section">
    <h2 class="med-title">Professional Summary</h2>
    <p class="med-text">{{summary}}</p>
  </section>
  <section class="med-section">
    <h2 class="med-title">Clinical Experience</h2>
    {{#experience}}
    <div class="med-entry">
      <div class="med-row"><h3 class="med-role">{{title}}</h3><span class="med-dates">{{startDate}} – {{endDate}}</span></div>
      <p class="med-org">{{company}}, {{location}}</p>
      <ul class="med-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <section class="med-section">
    <h2 class="med-title">Education & Training</h2>
    {{#education}}<div class="med-edu"><strong>{{degree}}</strong> — {{institution}}, {{graduationYear}}</div>{{/education}}
  </section>
  <div class="med-grid">
    <section class="med-section">
      <h2 class="med-title">Specializations</h2>
      <div class="med-tags">{{#skills}}<span class="med-tag">{{.}}</span>{{/skills}}</div>
    </section>
    {{#certifications.length}}
    <section class="med-section">
      <h2 class="med-title">Licenses & Certifications</h2>
      {{#certifications}}<p class="med-cert">{{name}} — {{issuer}}, {{date}}</p>{{/certifications}}
    </section>
    {{/certifications.length}}
  </div>
</div>
`;

const medicalCss = `
:root { --med-accent:#0d9488; --med-text:#134e4a; --med-muted:#5eead4; --med-bg:#fff; --med-line:#ccfbf1; }
.med-resume { max-width:794px; margin:0 auto; padding:44px 50px; background:var(--med-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; color:#1f2937; }
.med-header { margin-bottom:20px; }
.med-header-bar { height:4px; width:60px; background:var(--med-accent); border-radius:2px; margin-bottom:12px; }
.med-name { font-size:24pt; font-weight:700; color:var(--med-text); margin:0; }
.med-contact { font-size:9pt; color:#6b7280; margin:6px 0 0; }
.med-section { margin-bottom:18px; }
.med-title { font-size:9pt; font-weight:700; text-transform:uppercase; letter-spacing:0.15em; color:var(--med-accent); margin:0 0 10px; }
.med-text { font-size:10pt; margin:0; color:#374151; }
.med-entry { margin-bottom:14px; }
.med-row { display:flex; justify-content:space-between; align-items:baseline; }
.med-role { font-size:11pt; font-weight:600; color:var(--med-text); margin:0; }
.med-dates { font-size:9pt; color:#6b7280; white-space:nowrap; }
.med-org { font-size:9pt; color:var(--med-accent); margin:2px 0 0; }
.med-bullets { margin:5px 0 0; padding:0; list-style:none; }
.med-bullets li { font-size:9.5pt; margin-bottom:3px; padding-left:14px; position:relative; }
.med-bullets li::before { content:'+'; position:absolute; left:0; color:var(--med-accent); font-weight:700; }
.med-edu { font-size:10pt; margin:4px 0; }
.med-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
.med-tags { display:flex; flex-wrap:wrap; gap:5px; }
.med-tag { font-size:8.5pt; padding:3px 10px; border-radius:20px; background:var(--med-line); color:var(--med-text); font-weight:500; }
.med-cert { font-size:9.5pt; margin:4px 0; }
@media print { .med-resume { padding:36px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 9. BOARDROOM ELITE
// ─────────────────────────────────────────────
const boardroomHtml = `
<div class="brd-resume">
  <header class="brd-header">
    <h1 class="brd-name">{{firstName}} {{lastName}}</h1>
    <div class="brd-gold-bar"></div>
    <p class="brd-headline">{{summary}}</p>
    <div class="brd-contact">{{email}} · {{phone}} · {{location}}</div>
  </header>
  <section class="brd-section">
    <h2 class="brd-title">Leadership Experience</h2>
    {{#experience}}
    <div class="brd-entry">
      <div class="brd-row"><h3 class="brd-role">{{title}}</h3><span class="brd-dates">{{startDate}} – {{endDate}}</span></div>
      <p class="brd-company">{{company}} · {{location}}</p>
      <ul class="brd-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <div class="brd-divider"></div>
  <div class="brd-grid">
    <section class="brd-section">
      <h2 class="brd-title">Education</h2>
      {{#education}}<p class="brd-edu"><strong>{{degree}}</strong><br/>{{institution}} · {{graduationYear}}</p>{{/education}}
    </section>
    <section class="brd-section">
      <h2 class="brd-title">Board Competencies</h2>
      <div class="brd-tags">{{#skills}}<span class="brd-tag">{{.}}</span>{{/skills}}</div>
    </section>
  </div>
  {{#certifications.length}}
  <section class="brd-section">
    <h2 class="brd-title">Affiliations & Certifications</h2>
    {{#certifications}}<p class="brd-cert">{{name}} — {{issuer}} · {{date}}</p>{{/certifications}}
  </section>
  {{/certifications.length}}
</div>
`;

const boardroomCss = `
:root { --brd-gold:#92754c; --brd-dark:#1a1a2e; --brd-text:#374151; --brd-muted:#9ca3af; --brd-bg:#fff; --brd-line:#e5e7eb; }
.brd-resume { max-width:794px; margin:0 auto; padding:52px 56px; background:var(--brd-bg); font-family:'Playfair Display','Georgia',serif; font-size:10.5pt; line-height:1.55; box-sizing:border-box; }
.brd-header { text-align:center; margin-bottom:24px; }
.brd-name { font-size:32pt; font-weight:600; color:var(--brd-dark); margin:0; letter-spacing:0.03em; }
.brd-gold-bar { width:60px; height:2px; background:var(--brd-gold); margin:12px auto; }
.brd-headline { font-size:10pt; font-style:italic; color:var(--brd-text); margin:0 auto; max-width:520px; font-family:'Inter',sans-serif; line-height:1.5; }
.brd-contact { font-size:9pt; color:var(--brd-muted); margin-top:10px; font-family:'Inter',sans-serif; }
.brd-section { margin-bottom:18px; }
.brd-title { font-size:9pt; font-weight:600; text-transform:uppercase; letter-spacing:0.25em; color:var(--brd-gold); text-align:center; margin:0 0 12px; font-family:'Inter',sans-serif; }
.brd-entry { margin-bottom:16px; }
.brd-row { display:flex; justify-content:space-between; align-items:baseline; }
.brd-role { font-size:12pt; font-weight:600; color:var(--brd-dark); margin:0; }
.brd-dates { font-size:9pt; font-style:italic; color:var(--brd-muted); font-family:'Inter',sans-serif; white-space:nowrap; }
.brd-company { font-size:9pt; color:var(--brd-gold); margin:2px 0 0; font-family:'Inter',sans-serif; }
.brd-bullets { margin:6px 0 0 16px; padding:0; list-style:none; font-family:'Inter',sans-serif; }
.brd-bullets li { font-size:9.5pt; margin-bottom:3px; padding-left:14px; position:relative; color:var(--brd-text); }
.brd-bullets li::before { content:'◆'; position:absolute; left:0; color:var(--brd-gold); font-size:6pt; top:4px; }
.brd-divider { height:1px; background:var(--brd-line); margin:20px 0; }
.brd-grid { display:grid; grid-template-columns:1fr 1fr; gap:28px; }
.brd-edu { font-size:10pt; margin:4px 0; text-align:center; font-family:'Inter',sans-serif; }
.brd-tags { display:flex; flex-wrap:wrap; justify-content:center; gap:5px; }
.brd-tag { font-size:8.5pt; padding:3px 12px; border:1px solid var(--brd-line); border-radius:20px; color:var(--brd-text); font-family:'Inter',sans-serif; }
.brd-cert { font-size:9.5pt; text-align:center; margin:4px 0; color:var(--brd-text); font-family:'Inter',sans-serif; }
@media print { .brd-resume { padding:44px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// 10. IMPACT LEDGER
// ─────────────────────────────────────────────
const impactLedgerHtml = `
<div class="imp-resume">
  <header class="imp-header">
    <h1 class="imp-name">{{firstName}} {{lastName}}</h1>
    <div class="imp-contact">{{email}} · {{phone}} · {{location}}</div>
  </header>
  <div class="imp-line"></div>
  <section class="imp-section">
    <h2 class="imp-title">Summary</h2>
    <p class="imp-text">{{summary}}</p>
  </section>
  <section class="imp-section">
    <h2 class="imp-title">Professional Experience</h2>
    {{#experience}}
    <div class="imp-entry">
      <div class="imp-row">
        <div><h3 class="imp-role">{{title}}</h3><p class="imp-company">{{company}} · {{location}}</p></div>
        <span class="imp-dates">{{startDate}} – {{endDate}}</span>
      </div>
      <ul class="imp-bullets">{{#description}}<li>{{.}}</li>{{/description}}</ul>
    </div>
    {{/experience}}
  </section>
  <section class="imp-section">
    <h2 class="imp-title">Education</h2>
    {{#education}}
    <div class="imp-row"><div><strong>{{degree}}</strong><br/><span class="imp-sub">{{institution}}</span></div><span class="imp-dates">{{graduationYear}}</span></div>
    {{/education}}
  </section>
  <section class="imp-section">
    <h2 class="imp-title">Skills</h2>
    <div class="imp-tags">{{#skills}}<span class="imp-tag">{{.}}</span>{{/skills}}</div>
  </section>
  {{#certifications.length}}
  <section class="imp-section">
    <h2 class="imp-title">Certifications</h2>
    {{#certifications}}<div class="imp-row"><span>{{name}} — {{issuer}}</span><span class="imp-dates">{{date}}</span></div>{{/certifications}}
  </section>
  {{/certifications.length}}
</div>
`;

const impactLedgerCss = `
:root { --imp-accent:#1e40af; --imp-text:#111827; --imp-muted:#6b7280; --imp-bg:#fff; --imp-line:#1e40af; }
.imp-resume { max-width:794px; margin:0 auto; padding:44px 50px; background:var(--imp-bg); font-family:'Inter',system-ui,sans-serif; font-size:10pt; line-height:1.55; box-sizing:border-box; color:var(--imp-text); }
.imp-header { margin-bottom:6px; }
.imp-name { font-size:26pt; font-weight:800; margin:0; color:var(--imp-text); }
.imp-contact { font-size:9pt; color:var(--imp-muted); margin-top:4px; }
.imp-line { height:3px; background:var(--imp-line); margin:12px 0 18px; }
.imp-section { margin-bottom:18px; }
.imp-title { font-size:10pt; font-weight:700; color:var(--imp-accent); margin:0 0 8px; text-transform:uppercase; letter-spacing:0.1em; }
.imp-text { font-size:10pt; margin:0; color:var(--imp-text); }
.imp-entry { margin-bottom:14px; }
.imp-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:2px; }
.imp-role { font-size:11pt; font-weight:700; color:var(--imp-text); margin:0; }
.imp-company { font-size:9pt; color:var(--imp-accent); margin:1px 0 0; }
.imp-dates { font-size:9pt; color:var(--imp-muted); white-space:nowrap; }
.imp-sub { font-size:9pt; color:var(--imp-muted); }
.imp-bullets { margin:5px 0 0; padding:0; list-style:none; }
.imp-bullets li { font-size:9.5pt; margin-bottom:3px; padding-left:14px; position:relative; }
.imp-bullets li::before { content:'▪'; position:absolute; left:0; color:var(--imp-accent); }
.imp-tags { display:flex; flex-wrap:wrap; gap:5px; }
.imp-tag { font-size:8.5pt; padding:3px 10px; background:#dbeafe; color:var(--imp-accent); border-radius:4px; font-weight:500; }
@media print { .imp-resume { padding:36px; box-shadow:none; } }
`;

// ─────────────────────────────────────────────
// EXPORT ALL
// ─────────────────────────────────────────────
export const premiumTemplatesBatch2: PremiumTemplate[] = [
  { id: "modern-professional", name: "Modern Professional", description: "Clean and contemporary design perfect for corporate roles.", category: "professional", isPremium: false, htmlContent: modernProfessionalHtml, cssContent: modernProfessionalCss },
  { id: "startup-modern", name: "Startup Modern", description: "Dynamic and modern structure for fast-paced companies.", category: "tech", isPremium: true, htmlContent: startupModernHtml, cssContent: startupModernCss },
  { id: "consultant-pro", name: "Consultant Pro", description: "Structured format for consulting and advisory profiles.", category: "professional", isPremium: true, htmlContent: consultantProHtml, cssContent: consultantProCss },
  { id: "academic-formal", name: "Academic Formal", description: "Traditional format for research and academic careers.", category: "academic", isPremium: false, htmlContent: academicFormalHtml, cssContent: academicFormalCss },
  { id: "data-science-template", name: "Data Science Insight", description: "Metrics-first layout for data science and analytics roles.", category: "tech", isPremium: true, htmlContent: dataScienceHtml, cssContent: dataScienceCss },
  { id: "devops-template", name: "DevOps Infra", description: "Infrastructure-oriented format for SRE and DevOps profiles.", category: "tech", isPremium: true, htmlContent: devopsHtml, cssContent: devopsCss },
  { id: "legal-template", name: "Legal Counsel", description: "Formal legal style for counsel and legal advisor roles.", category: "professional", isPremium: true, htmlContent: legalHtml, cssContent: legalCss },
  { id: "medical-template", name: "Medical Specialist", description: "Clear healthcare-focused layout for medical professionals.", category: "professional", isPremium: true, htmlContent: medicalHtml, cssContent: medicalCss },
  { id: "boardroom-template", name: "Boardroom Elite", description: "High-end executive format with leadership-first storytelling.", category: "executive", isPremium: true, htmlContent: boardroomHtml, cssContent: boardroomCss },
  { id: "impact-template", name: "Impact Ledger", description: "Professional, metrics-focused resume optimized for ATS readability.", category: "professional", isPremium: false, htmlContent: impactLedgerHtml, cssContent: impactLedgerCss },
];
