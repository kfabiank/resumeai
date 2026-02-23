import type { PremiumTemplate } from "@/lib/premiumTemplates";

// ── 1. Noir Elegance ──
const noirEleganceHtml = `
<div class="noir-resume">
  <header class="noir-header">
    <div class="noir-name-block">
      <h1>{{firstName}} {{lastName}}</h1>
      <div class="noir-divider"></div>
      <p class="noir-title">{{summary}}</p>
    </div>
    <div class="noir-contact">
      <span>{{email}}</span>
      <span class="noir-sep">·</span>
      <span>{{phone}}</span>
      <span class="noir-sep">·</span>
      <span>{{location}}</span>
    </div>
  </header>

  <section class="noir-section">
    <h2>Experience</h2>
    {{#experience}}
    <div class="noir-entry">
      <div class="noir-entry-header">
        <div>
          <h3>{{title}}</h3>
          <p class="noir-company">{{company}} — {{location}}</p>
        </div>
        <span class="noir-dates">{{startDate}} — {{endDate}}</span>
      </div>
      <p class="noir-desc">{{description}}</p>
    </div>
    {{/experience}}
  </section>

  <div class="noir-columns">
    <section class="noir-section noir-col-main">
      <h2>Education</h2>
      {{#education}}
      <div class="noir-edu">
        <h3>{{degree}}</h3>
        <p>{{institution}} · {{graduationYear}}</p>
        {{#gpa}}<p class="noir-gpa">GPA: {{gpa}}</p>{{/gpa}}
      </div>
      {{/education}}
    </section>

    <section class="noir-section noir-col-side">
      <h2>Skills</h2>
      <div class="noir-skills">
        {{#skills}}<span class="noir-skill">{{.}}</span>{{/skills}}
      </div>
      {{#languages.length}}
      <h2 style="margin-top:18px">Languages</h2>
      <div class="noir-skills">
        {{#languages}}<span class="noir-skill">{{.}}</span>{{/languages}}
      </div>
      {{/languages.length}}
      {{#certifications}}
      <h2 style="margin-top:18px">Certifications</h2>
      {{#certifications}}
      <p class="noir-cert">{{name}} · {{issuer}} · {{date}}</p>
      {{/certifications}}
      {{/certifications}}
    </section>
  </div>
</div>`;

const noirEleganceCss = `
:root {
  --noir-bg: #0a0a0a;
  --noir-card: #141414;
  --noir-text: #e8e8e8;
  --noir-muted: #888;
  --noir-accent: #c9a84c;
  --noir-border: #2a2a2a;
}
.noir-resume {
  max-width: 794px;
  margin: 0 auto;
  background: var(--noir-bg);
  color: var(--noir-text);
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 10.5pt;
  line-height: 1.6;
  padding: 48px 44px;
}
.noir-header {
  text-align: center;
  margin-bottom: 36px;
}
.noir-name-block h1 {
  font-size: 28pt;
  font-weight: 400;
  letter-spacing: 6px;
  text-transform: uppercase;
  color: var(--noir-accent);
  margin: 0;
}
.noir-divider {
  width: 60px;
  height: 1px;
  background: var(--noir-accent);
  margin: 16px auto;
}
.noir-title {
  font-size: 10pt;
  color: var(--noir-muted);
  font-style: italic;
  max-width: 500px;
  margin: 0 auto;
}
.noir-contact {
  margin-top: 14px;
  font-size: 9pt;
  color: var(--noir-muted);
}
.noir-sep { margin: 0 8px; }
.noir-section h2 {
  font-size: 10pt;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--noir-accent);
  border-bottom: 1px solid var(--noir-border);
  padding-bottom: 6px;
  margin: 24px 0 14px;
}
.noir-entry { margin-bottom: 18px; }
.noir-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.noir-entry-header h3 {
  font-size: 11pt;
  font-weight: 600;
  margin: 0;
}
.noir-company {
  font-size: 9.5pt;
  color: var(--noir-muted);
  margin: 2px 0 0;
}
.noir-dates {
  font-size: 9pt;
  color: var(--noir-muted);
  white-space: nowrap;
}
.noir-desc {
  margin: 6px 0 0;
  font-size: 10pt;
}
.noir-columns {
  display: flex;
  gap: 32px;
}
.noir-col-main { flex: 1.2; }
.noir-col-side { flex: 1; }
.noir-edu h3 { font-size: 10.5pt; margin: 0; }
.noir-edu p { font-size: 9.5pt; color: var(--noir-muted); margin: 2px 0 10px; }
.noir-gpa { color: var(--noir-accent) !important; }
.noir-skills { display: flex; flex-wrap: wrap; gap: 6px; }
.noir-skill {
  background: var(--noir-card);
  border: 1px solid var(--noir-border);
  padding: 3px 10px;
  font-size: 9pt;
  border-radius: 2px;
}
.noir-cert { font-size: 9pt; color: var(--noir-muted); margin: 4px 0; }
@media print {
  .noir-resume { background: #fff; color: #111; }
  .noir-name-block h1 { color: #111; }
  .noir-section h2 { color: #333; }
  .noir-skill { background: #f5f5f5; border-color: #ddd; }
}`;

// ── 2. Swiss Precision ──
const swissPrecisionHtml = `
<div class="swiss-resume">
  <header class="swiss-header">
    <h1>{{firstName}}<br/>{{lastName}}</h1>
    <div class="swiss-meta">
      <p>{{email}}</p>
      <p>{{phone}}</p>
      <p>{{location}}</p>
    </div>
  </header>

  <div class="swiss-summary">
    <p>{{summary}}</p>
  </div>

  <section class="swiss-section">
    <div class="swiss-label">Experience</div>
    <div class="swiss-content">
      {{#experience}}
      <div class="swiss-entry">
        <div class="swiss-date">{{startDate}}<br/>{{endDate}}</div>
        <div class="swiss-detail">
          <h3>{{title}}</h3>
          <p class="swiss-company">{{company}}, {{location}}</p>
          <p>{{description}}</p>
        </div>
      </div>
      {{/experience}}
    </div>
  </section>

  <section class="swiss-section">
    <div class="swiss-label">Education</div>
    <div class="swiss-content">
      {{#education}}
      <div class="swiss-entry">
        <div class="swiss-date">{{graduationYear}}</div>
        <div class="swiss-detail">
          <h3>{{degree}}</h3>
          <p class="swiss-company">{{institution}}</p>
          {{#gpa}}<p>GPA: {{gpa}}</p>{{/gpa}}
        </div>
      </div>
      {{/education}}
    </div>
  </section>

  <section class="swiss-section">
    <div class="swiss-label">Skills</div>
    <div class="swiss-content">
      <div class="swiss-tags">
        {{#skills}}<span>{{.}}</span>{{/skills}}
      </div>
    </div>
  </section>

  {{#languages.length}}
  <section class="swiss-section">
    <div class="swiss-label">Languages</div>
    <div class="swiss-content">
      <div class="swiss-tags">
        {{#languages}}<span>{{.}}</span>{{/languages}}
      </div>
    </div>
  </section>
  {{/languages.length}}

  {{#certifications}}
  <section class="swiss-section">
    <div class="swiss-label">Certifications</div>
    <div class="swiss-content">
      {{#certifications}}
      <p class="swiss-cert">{{name}} — {{issuer}} ({{date}})</p>
      {{/certifications}}
    </div>
  </section>
  {{/certifications}}
</div>`;

const swissPrecisionCss = `
:root {
  --sw-accent: #e63946;
  --sw-text: #1d1d1d;
  --sw-muted: #666;
  --sw-bg: #fafafa;
  --sw-line: #e0e0e0;
}
.swiss-resume {
  max-width: 794px;
  margin: 0 auto;
  background: var(--sw-bg);
  color: var(--sw-text);
  font-family: 'Helvetica Neue', 'Arial', sans-serif;
  font-size: 10pt;
  line-height: 1.55;
  padding: 50px 48px;
}
.swiss-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 4px solid var(--sw-accent);
  padding-bottom: 20px;
  margin-bottom: 24px;
}
.swiss-header h1 {
  font-size: 32pt;
  font-weight: 700;
  line-height: 1.05;
  margin: 0;
  letter-spacing: -1px;
}
.swiss-meta {
  text-align: right;
  font-size: 9pt;
  color: var(--sw-muted);
}
.swiss-meta p { margin: 2px 0; }
.swiss-summary {
  font-size: 10.5pt;
  color: var(--sw-muted);
  border-left: 3px solid var(--sw-accent);
  padding-left: 16px;
  margin-bottom: 28px;
}
.swiss-summary p { margin: 0; }
.swiss-section {
  display: flex;
  gap: 0;
  margin-bottom: 22px;
}
.swiss-label {
  width: 148px;
  flex-shrink: 0;
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 700;
  color: var(--sw-accent);
  padding-top: 2px;
  padding-right: 12px;
}
.swiss-content { flex: 1; min-width: 0; }
.swiss-entry {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.swiss-date {
  width: 70px;
  flex-shrink: 0;
  font-size: 8.5pt;
  color: var(--sw-muted);
  padding-top: 2px;
}
.swiss-detail h3 { font-size: 11pt; margin: 0; font-weight: 600; }
.swiss-company { font-size: 9.5pt; color: var(--sw-muted); margin: 1px 0 4px; }
.swiss-detail p { margin: 0 0 2px; font-size: 10pt; }
.swiss-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.swiss-tags span {
  background: var(--sw-accent);
  color: #fff;
  padding: 2px 10px;
  font-size: 8.5pt;
  font-weight: 600;
  letter-spacing: 0.5px;
}
.swiss-cert { font-size: 9.5pt; margin: 4px 0; }
@media print {
  .swiss-resume { padding: 40px; }
}`;

// ── 3. Architect Blueprint ──
const architectHtml = `
<div class="arch-resume">
  <div class="arch-grid">
    <aside class="arch-sidebar">
      <div class="arch-initials">{{firstName}} {{lastName}}</div>
      <div class="arch-contact">
        <p>{{email}}</p>
        <p>{{phone}}</p>
        <p>{{location}}</p>
      </div>

      <div class="arch-side-section">
        <h2>Skills</h2>
        {{#skills}}<div class="arch-skill-item">{{.}}</div>{{/skills}}
      </div>
      {{#languages.length}}
      <div class="arch-side-section">
        <h2>Languages</h2>
        {{#languages}}<div class="arch-skill-item">{{.}}</div>{{/languages}}
      </div>
      {{/languages.length}}

      {{#certifications}}
      <div class="arch-side-section">
        <h2>Certifications</h2>
        {{#certifications}}
        <div class="arch-cert">
          <strong>{{name}}</strong>
          <span>{{issuer}} · {{date}}</span>
        </div>
        {{/certifications}}
      </div>
      {{/certifications}}

      <div class="arch-side-section">
        <h2>Education</h2>
        {{#education}}
        <div class="arch-cert">
          <strong>{{degree}}</strong>
          <span>{{institution}} · {{graduationYear}}</span>
          {{#gpa}}<span>GPA: {{gpa}}</span>{{/gpa}}
        </div>
        {{/education}}
      </div>
    </aside>

    <main class="arch-main">
      <div class="arch-summary">
        <p>{{summary}}</p>
      </div>

      <section>
        <h2>Experience</h2>
        {{#experience}}
        <div class="arch-exp">
          <div class="arch-exp-head">
            <h3>{{title}}</h3>
            <span>{{startDate}} — {{endDate}}</span>
          </div>
          <p class="arch-exp-co">{{company}}, {{location}}</p>
          <p>{{description}}</p>
        </div>
        {{/experience}}
      </section>
    </main>
  </div>
</div>`;

const architectCss = `
:root {
  --arch-bg: #f7f5f0;
  --arch-sidebar: #2c3e50;
  --arch-accent: #e67e22;
  --arch-text: #2c2c2c;
  --arch-light: #ecf0f1;
}
.arch-resume {
  max-width: 794px;
  margin: 0 auto;
  background: var(--arch-bg);
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 10pt;
  line-height: 1.55;
}
.arch-grid {
  display: flex;
  min-height: 1122px;
}
.arch-sidebar {
  width: 240px;
  background: var(--arch-sidebar);
  color: var(--arch-light);
  padding: 40px 24px;
  flex-shrink: 0;
}
.arch-initials {
  font-size: 18pt;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--arch-accent);
  margin-bottom: 20px;
  line-height: 1.2;
}
.arch-contact p {
  font-size: 8.5pt;
  margin: 3px 0;
  opacity: 0.8;
}
.arch-side-section {
  margin-top: 28px;
}
.arch-side-section h2 {
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  color: var(--arch-accent);
  border-bottom: 1px solid rgba(255,255,255,0.15);
  padding-bottom: 6px;
  margin: 0 0 10px;
}
.arch-skill-item {
  font-size: 9pt;
  padding: 3px 0;
  border-left: 2px solid var(--arch-accent);
  padding-left: 8px;
  margin-bottom: 4px;
}
.arch-cert {
  margin-bottom: 10px;
}
.arch-cert strong {
  display: block;
  font-size: 9.5pt;
}
.arch-cert span {
  font-size: 8.5pt;
  opacity: 0.7;
  display: block;
}
.arch-main {
  flex: 1;
  padding: 40px 36px;
  color: var(--arch-text);
}
.arch-summary {
  border-left: 3px solid var(--arch-accent);
  padding-left: 14px;
  margin-bottom: 28px;
  font-size: 10.5pt;
  color: #555;
}
.arch-summary p { margin: 0; }
.arch-main h2 {
  font-size: 10pt;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--arch-sidebar);
  margin: 24px 0 14px;
  border-bottom: 2px solid var(--arch-accent);
  padding-bottom: 5px;
}
.arch-exp { margin-bottom: 18px; }
.arch-exp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.arch-exp-head h3 { font-size: 11pt; margin: 0; font-weight: 600; }
.arch-exp-head span { font-size: 9pt; color: #888; }
.arch-exp-co { font-size: 9.5pt; color: #777; margin: 2px 0 6px; }
.arch-exp p { margin: 0; font-size: 10pt; }
@media print {
  .arch-sidebar { background: #333 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

// ── 4. Vogue Editorial ──
const vogueHtml = `
<div class="vogue-resume">
  <header class="vogue-header">
    <div class="vogue-line"></div>
    <h1>{{firstName}} {{lastName}}</h1>
    <p class="vogue-subtitle">{{summary}}</p>
    <div class="vogue-contact">
      {{email}} &nbsp;|&nbsp; {{phone}} &nbsp;|&nbsp; {{location}}
    </div>
    <div class="vogue-line"></div>
  </header>

  <section class="vogue-section">
    <h2>Experience</h2>
    {{#experience}}
    <div class="vogue-entry">
      <div class="vogue-role">
        <h3>{{title}}</h3>
        <span class="vogue-period">{{startDate}} – {{endDate}}</span>
      </div>
      <p class="vogue-place">{{company}} · {{location}}</p>
      <p class="vogue-desc">{{description}}</p>
    </div>
    {{/experience}}
  </section>

  <div class="vogue-two-col">
    <section class="vogue-section">
      <h2>Education</h2>
      {{#education}}
      <div class="vogue-edu">
        <strong>{{degree}}</strong>
        <p>{{institution}} · {{graduationYear}}</p>
        {{#gpa}}<p class="vogue-gpa">GPA {{gpa}}</p>{{/gpa}}
      </div>
      {{/education}}
    </section>

    <section class="vogue-section">
      <h2>Expertise</h2>
      <div class="vogue-pills">
        {{#skills}}<span>{{.}}</span>{{/skills}}
      </div>
      {{#languages.length}}
      <h2 style="margin-top:16px">Languages</h2>
      <div class="vogue-pills">
        {{#languages}}<span>{{.}}</span>{{/languages}}
      </div>
      {{/languages.length}}
      {{#certifications}}
      <h2 style="margin-top:16px">Credentials</h2>
      {{#certifications}}
      <p class="vogue-cred">{{name}} — {{issuer}}, {{date}}</p>
      {{/certifications}}
      {{/certifications}}
    </section>
  </div>
</div>`;

const vogueCss = `
:root {
  --vg-bg: #fefdfb;
  --vg-text: #1a1a1a;
  --vg-accent: #8b5e3c;
  --vg-muted: #7a7a7a;
  --vg-line: #d4c5b3;
}
.vogue-resume {
  max-width: 794px;
  margin: 0 auto;
  background: var(--vg-bg);
  color: var(--vg-text);
  font-family: 'Playfair Display', 'Georgia', serif;
  font-size: 10.5pt;
  line-height: 1.6;
  padding: 52px 50px;
}
.vogue-header { text-align: center; margin-bottom: 32px; }
.vogue-line {
  height: 1px;
  background: var(--vg-line);
  margin: 16px 0;
}
.vogue-header h1 {
  font-size: 36pt;
  font-weight: 400;
  letter-spacing: 8px;
  text-transform: uppercase;
  margin: 12px 0 8px;
}
.vogue-subtitle {
  font-size: 10pt;
  font-style: italic;
  color: var(--vg-muted);
  max-width: 480px;
  margin: 0 auto 8px;
}
.vogue-contact {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 8.5pt;
  letter-spacing: 1px;
  color: var(--vg-muted);
}
.vogue-section h2 {
  font-size: 9pt;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: var(--vg-accent);
  margin: 28px 0 12px;
}
.vogue-entry { margin-bottom: 18px; }
.vogue-role {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.vogue-role h3 {
  font-size: 12pt;
  font-weight: 600;
  margin: 0;
  font-family: 'Helvetica Neue', sans-serif;
}
.vogue-period {
  font-size: 8.5pt;
  color: var(--vg-muted);
  font-family: 'Helvetica Neue', sans-serif;
}
.vogue-place {
  font-size: 9.5pt;
  color: var(--vg-accent);
  margin: 2px 0 6px;
}
.vogue-desc {
  font-family: 'Helvetica Neue', sans-serif;
  font-size: 10pt;
  margin: 0;
}
.vogue-two-col {
  display: flex;
  gap: 40px;
  margin-top: 8px;
}
.vogue-two-col > section { flex: 1; }
.vogue-edu { margin-bottom: 12px; }
.vogue-edu strong { font-size: 10.5pt; }
.vogue-edu p { font-size: 9pt; color: var(--vg-muted); margin: 2px 0; font-family: 'Helvetica Neue', sans-serif; }
.vogue-gpa { color: var(--vg-accent) !important; font-weight: 600; }
.vogue-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.vogue-pills span {
  border: 1px solid var(--vg-line);
  padding: 3px 12px;
  font-size: 8.5pt;
  font-family: 'Helvetica Neue', sans-serif;
  letter-spacing: 0.5px;
}
.vogue-cred {
  font-size: 9pt;
  font-family: 'Helvetica Neue', sans-serif;
  color: var(--vg-muted);
  margin: 4px 0;
}
@media print {
  .vogue-resume { padding: 40px; }
}`;

// ── 5. Carbon Terminal ──
const carbonHtml = `
<div class="carbon-resume">
  <header class="carbon-header">
    <div class="carbon-prompt">
      <span class="carbon-user">{{firstName | lowercase}}@resuify</span>
      <span class="carbon-tilde">~</span>
      <span class="carbon-dollar">$</span>
      <span class="carbon-cmd">cat resume.json</span>
    </div>
    <div class="carbon-output">
      <div class="carbon-json-key">"name"</div>: <span class="carbon-json-str">"{{firstName}} {{lastName}}"</span>,
      <div class="carbon-json-key">"title"</div>: <span class="carbon-json-str">"{{summary}}"</span>,
      <div class="carbon-json-key">"contact"</div>: {
        <span class="carbon-json-str">"{{email}}"</span>,
        <span class="carbon-json-str">"{{phone}}"</span>,
        <span class="carbon-json-str">"{{location}}"</span>
      }
    </div>
  </header>

  <section class="carbon-section">
    <div class="carbon-prompt">
      <span class="carbon-dollar">$</span>
      <span class="carbon-cmd">ls experience/</span>
    </div>
    {{#experience}}
    <div class="carbon-block">
      <div class="carbon-block-head">
        <span class="carbon-fn">{{title}}</span>
        <span class="carbon-comment">// {{company}} · {{startDate}}–{{endDate}}</span>
      </div>
      <p class="carbon-body">{{description}}</p>
    </div>
    {{/experience}}
  </section>

  <div class="carbon-cols">
    <section class="carbon-section carbon-col">
      <div class="carbon-prompt">
        <span class="carbon-dollar">$</span>
        <span class="carbon-cmd">cat skills.txt</span>
      </div>
      <div class="carbon-tag-list">
        {{#skills}}<span class="carbon-tag">{{.}}</span>{{/skills}}
      </div>
      {{#languages.length}}
      <div class="carbon-prompt" style="margin-top:12px;">
        <span class="carbon-dollar">$</span>
        <span class="carbon-cmd">cat languages.txt</span>
      </div>
      <div class="carbon-tag-list">
        {{#languages}}<span class="carbon-tag">{{.}}</span>{{/languages}}
      </div>
      {{/languages.length}}
    </section>

    <section class="carbon-section carbon-col">
      <div class="carbon-prompt">
        <span class="carbon-dollar">$</span>
        <span class="carbon-cmd">cat education.log</span>
      </div>
      {{#education}}
      <div class="carbon-edu">
        <strong>{{degree}}</strong>
        <p>{{institution}} · {{graduationYear}}</p>
      </div>
      {{/education}}
    </section>
  </div>

  {{#certifications}}
  <section class="carbon-section">
    <div class="carbon-prompt">
      <span class="carbon-dollar">$</span>
      <span class="carbon-cmd">cat certs.md</span>
    </div>
    {{#certifications}}
    <p class="carbon-cert">▸ {{name}} — {{issuer}} ({{date}})</p>
    {{/certifications}}
  </section>
  {{/certifications}}

  <div class="carbon-cursor">█</div>
</div>`;

const carbonCss = `
:root {
  --cb-bg: #1e1e2e;
  --cb-surface: #252535;
  --cb-text: #cdd6f4;
  --cb-green: #a6e3a1;
  --cb-blue: #89b4fa;
  --cb-mauve: #cba6f7;
  --cb-peach: #fab387;
  --cb-muted: #6c7086;
  --cb-overlay: #313244;
}
.carbon-resume {
  max-width: 794px;
  margin: 0 auto;
  background: var(--cb-bg);
  color: var(--cb-text);
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 9.5pt;
  line-height: 1.6;
  padding: 36px 32px;
}
.carbon-prompt {
  background: var(--cb-surface);
  padding: 8px 14px;
  border-radius: 6px 6px 0 0;
  border: 1px solid var(--cb-overlay);
  margin-bottom: 0;
  font-size: 9pt;
}
.carbon-user { color: var(--cb-green); }
.carbon-tilde { color: var(--cb-blue); margin: 0 4px; }
.carbon-dollar { color: var(--cb-mauve); margin-right: 6px; }
.carbon-cmd { color: var(--cb-text); }
.carbon-output {
  background: var(--cb-surface);
  border: 1px solid var(--cb-overlay);
  border-top: none;
  border-radius: 0 0 6px 6px;
  padding: 12px 14px;
  margin-bottom: 20px;
  font-size: 9pt;
}
.carbon-json-key { display: inline; color: var(--cb-blue); }
.carbon-json-str { color: var(--cb-peach); }
.carbon-section { margin-bottom: 20px; }
.carbon-section .carbon-prompt {
  border-radius: 6px;
  margin-bottom: 12px;
}
.carbon-block {
  background: var(--cb-surface);
  border-left: 3px solid var(--cb-green);
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 0 4px 4px 0;
}
.carbon-block-head {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.carbon-fn { color: var(--cb-blue); font-weight: 600; font-size: 10pt; }
.carbon-comment { color: var(--cb-muted); font-size: 8.5pt; }
.carbon-body { margin: 6px 0 0; font-size: 9.5pt; }
.carbon-cols { display: flex; gap: 20px; }
.carbon-col { flex: 1; }
.carbon-tag-list { display: flex; flex-wrap: wrap; gap: 5px; }
.carbon-tag {
  background: var(--cb-overlay);
  color: var(--cb-green);
  padding: 2px 10px;
  border-radius: 3px;
  font-size: 8.5pt;
}
.carbon-edu { margin-bottom: 10px; }
.carbon-edu strong { font-size: 9.5pt; color: var(--cb-blue); }
.carbon-edu p { font-size: 8.5pt; color: var(--cb-muted); margin: 2px 0; }
.carbon-cert { color: var(--cb-peach); font-size: 9pt; margin: 4px 0; }
.carbon-cursor {
  color: var(--cb-green);
  font-size: 14pt;
  animation: blink 1s step-end infinite;
  margin-top: 12px;
}
@keyframes blink { 50% { opacity: 0; } }
@media print {
  .carbon-resume { background: #fff; color: #111; }
  .carbon-prompt, .carbon-output, .carbon-block, .carbon-tag { background: #f5f5f5; }
  .carbon-cursor { display: none; }
}`;

export const premiumTemplatesBatch3: PremiumTemplate[] = [
  {
    id: "noir-elegance",
    name: "Noir Elegance",
    description: "Dark luxury aesthetic with gold accents and serif typography for senior executives.",
    category: "executive",
    isPremium: true,
    htmlContent: noirEleganceHtml,
    cssContent: noirEleganceCss,
  },
  {
    id: "swiss-precision",
    name: "Swiss Precision",
    description: "International typographic style with bold red accents and grid-based layout.",
    category: "creative",
    isPremium: true,
    htmlContent: swissPrecisionHtml,
    cssContent: swissPrecisionCss,
  },
  {
    id: "architect-blueprint",
    name: "Architect Blueprint",
    description: "Structured sidebar layout with warm tones inspired by architectural drawings.",
    category: "professional",
    isPremium: true,
    htmlContent: architectHtml,
    cssContent: architectCss,
  },
  {
    id: "vogue-editorial",
    name: "Vogue Editorial",
    description: "High-fashion editorial aesthetic with elegant Playfair Display typography.",
    category: "creative",
    isPremium: true,
    htmlContent: vogueHtml,
    cssContent: vogueCss,
  },
  {
    id: "carbon-terminal",
    name: "Carbon Terminal",
    description: "Catppuccin-themed terminal UI with syntax-highlighted resume as code.",
    category: "tech",
    isPremium: true,
    htmlContent: carbonHtml,
    cssContent: carbonCss,
  },
];
