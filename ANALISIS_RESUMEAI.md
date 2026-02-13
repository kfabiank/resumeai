# ResumeAI - Generador Inteligente de CVs Optimizados para ATS

## 📋 Resumen Ejecutivo

**ResumeAI** es una plataforma SaaS que utiliza IA para generar CVs profesionales optimizados para sistemas ATS (Applicant Tracking Systems). Los usuarios pueden crear CVs personalizados para cada oferta de trabajo, obtener un score ATS en tiempo real, y aumentar significativamente sus posibilidades de ser contactados.

## 🎯 Problema que Resuelve

### El Problema
- **75% de CVs son rechazados** automáticamente por sistemas ATS antes de llegar a reclutadores humanos
- Los job seekers gastan **3-4 horas** creando cada CV
- **90% de los CVs no están optimizados** para keywords ATS
- Difícil personalizar CVs para cada aplicación
- No hay feedback sobre qué tan "ATS-friendly" es un CV

### La Solución
ResumeAI automatiza completamente el proceso:
1. **Analiza la oferta de trabajo** con IA para extraer keywords y requisitos
2. **Genera CV optimizado** automáticamente con tu experiencia
3. **Calcula score ATS** (0-100) en tiempo real
4. **Sugiere mejoras** específicas para aumentar el score
5. **Exporta en formatos ATS-friendly** (PDF, DOCX)

## 💰 Modelo de Negocio

### Planes de Suscripción

#### Free Plan - $0/mes
- 3 CVs generados por mes
- 5 templates básicos
- Export PDF básico
- Score ATS básico
- Retención 30 días

#### Pro Plan - $19/mes
- **CVs ilimitados**
- 20+ templates premium
- Export PDF + DOCX + TXT
- Score ATS avanzado con sugerencias
- Generación de cover letters
- Retención 1 año
- Soporte email 24h

#### Premium Plan - $49/mes
- Todo lo de Pro +
- **LinkedIn Profile Optimizer**
- **Application Tracker** (track tus aplicaciones)
- **Interview Prep IA** (preguntas comunes)
- **Salary Negotiation Coach**
- Templates white-label
- Retención ilimitada
- Soporte prioritario
- Acceso API

### Modelo de Ingresos Adicionales
- **Enterprise**: $299/mes para universidades, career centers
- **Afiliados**: Comisión por referir
- **Job Board Premium**: Destacar perfil en job board integrado

## 🎨 Funcionalidades Core

### 1. Dashboard Principal
- Lista de CVs creados
- Stats: aplicaciones, vistas, score promedio
- Quick actions
- Templates guardados
- Job applications tracking

### 2. Resume Builder (Generador)

**Paso 1: Job Description Analysis**
```
- Pegar URL de oferta o descripción
- IA extrae: skills, keywords, experiencia requerida
- Muestra análisis en tiempo real
```

**Paso 2: Your Information**
```
- Información personal
- Experiencia laboral
- Educación
- Skills
- Certificaciones
- Idiomas
```

**Paso 3: AI Generation**
```
- IA genera bullet points optimizados
- Reformula experiencia con keywords del job
- Ajusta tono según la industria
- Optimiza para ATS
```

**Paso 4: Customize & Export**
```
- Elige template
- Edita en vivo
- Ve score ATS en tiempo real
- Export PDF/DOCX
```

### 3. ATS Score System

**Métricas evaluadas:**
- ✅ Keyword match (40 puntos)
- ✅ Formato ATS-friendly (20 puntos)
- ✅ Secciones completas (15 puntos)
- ✅ Longitud apropiada (10 puntos)
- ✅ Sin errores (10 puntos)
- ✅ Consistencia (5 puntos)

**Score Total: 0-100**
- 90-100: Excelente ✅
- 75-89: Bueno 👍
- 60-74: Mejorable ⚠️
- <60: Necesita trabajo ❌

### 4. Templates System

**Categorías:**
- Modern/Minimal
- Creative
- Professional/Corporate
- Tech/Developer
- Executive/Senior
- Academic/Research
- Healthcare
- Sales/Marketing

**Por cada template:**
- Vista previa en vivo
- Personalización de colores
- Ajuste de espaciado
- Reordenar secciones

### 5. Cover Letter Generator
- Analiza job description
- Genera carta personalizada
- Matching tone
- Export integrado

### 6. Application Tracker (Premium)
```
Track:
- Empresa, puesto, fecha
- Status (Applied, Phone Screen, Interview, Offer, Rejected)
- Score del CV usado
- Notas
- Follow-ups automáticos
```

### 7. LinkedIn Optimizer (Premium)
- Analiza perfil de LinkedIn
- Sugiere mejoras
- Genera "About" section
- Optimiza headline y skills

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **PDF Generation**: react-pdf o jsPDF
- **DOCX Generation**: docx.js
- **Rich Text Editor**: Tiptap o Slate

#### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js o Clerk
- **AI**: OpenAI GPT-4 Turbo
- **File Storage**: Cloudflare R2 o AWS S3
- **Email**: Resend

#### Payments & Billing
- **Stripe**: Suscripciones recurrentes
- **Webhook**: Manejo de eventos
- **Billing Portal**: Self-service

#### Infrastructure
- **Hosting**: Vercel
- **CDN**: Vercel Edge Network
- **Database**: Supabase
- **Monitoring**: Sentry + PostHog
- **Analytics**: Vercel Analytics

### Schema de Base de Datos

```prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  name              String?
  planType          String    @default("free") // free, pro, premium
  stripeCustomerId  String?   @unique
  createdAt         DateTime  @default(now())
  
  resumes           Resume[]
  applications      JobApplication[]
  profile           UserProfile?
}

model UserProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  phone         String?
  location      String?
  headline      String?
  summary       String?
  experiences   Json     // Array de trabajos
  education     Json     // Array de educación
  skills        Json     // Array de skills
  languages     Json     // Array de idiomas
  certifications Json    // Array de certificaciones
  
  user          User     @relation(fields: [userId], references: [id])
}

model Resume {
  id              String    @id @default(cuid())
  userId          String
  title           String
  jobDescription  String?   @db.Text
  content         Json      // Contenido estructurado del CV
  templateId      String
  atsScore        Int?      // 0-100
  customizations  Json?     // Colores, fonts, etc
  pdfUrl          String?
  docxUrl         String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  user            User      @relation(fields: [userId], references: [id])
}

model JobApplication {
  id          String    @id @default(cuid())
  userId      String
  resumeId    String?
  company     String
  position    String
  jobUrl      String?
  status      String    @default("applied") // applied, phone_screen, interview, offer, rejected
  appliedDate DateTime  @default(now())
  notes       String?   @db.Text
  
  user        User      @relation(fields: [userId], references: [id])
}

model Template {
  id          String   @id @default(cuid())
  name        String
  category    String   // modern, creative, professional, etc
  thumbnail   String
  htmlContent String   @db.Text
  cssStyles   String   @db.Text
  isPremium   Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

## 🤖 Integración con IA

### Prompt Engineering

**Resume Optimization Prompt:**
```
You are an expert resume writer and ATS optimization specialist.

Job Description:
{job_description}

Candidate Experience:
{user_experience}

Task:
1. Extract key requirements and keywords from the job description
2. Rewrite the candidate's experience to highlight relevant skills
3. Use action verbs and quantifiable achievements
4. Optimize for ATS scanning while remaining human-readable
5. Match the tone and language of the industry

Format each bullet point with:
- Strong action verb
- Specific achievement or responsibility
- Quantifiable result when possible
- Relevant keywords naturally integrated

Return JSON:
{
  "keywords": ["keyword1", "keyword2", ...],
  "optimized_bullets": [
    {
      "original": "...",
      "optimized": "...",
      "keywords_used": ["..."]
    }
  ],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "ats_score_estimate": 85
}
```

**Cover Letter Prompt:**
```
Write a professional cover letter for this job application.

Job Details:
- Company: {company}
- Position: {position}
- Description: {job_description}

Candidate Profile:
{user_profile}

Requirements:
- Professional yet personable tone
- 3-4 paragraphs
- Highlight 2-3 key qualifications that match the job
- Show enthusiasm and culture fit
- Strong opening and closing

Format: Professional business letter format.
```

### ATS Score Calculation

```typescript
function calculateATSScore(resume: Resume, jobDescription: string): number {
  let score = 0;
  
  // 1. Keyword Match (40 points)
  const jobKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resume.content);
  const matchRate = calculateMatchRate(jobKeywords, resumeKeywords);
  score += matchRate * 40;
  
  // 2. Format Check (20 points)
  score += checkFormat(resume) ? 20 : 0;
  
  // 3. Complete Sections (15 points)
  score += calculateCompletenessScore(resume);
  
  // 4. Length (10 points)
  const wordCount = countWords(resume);
  if (wordCount >= 400 && wordCount <= 800) score += 10;
  else if (wordCount >= 300 && wordCount <= 1000) score += 7;
  else score += 3;
  
  // 5. No Errors (10 points)
  const errors = checkGrammar(resume);
  score += Math.max(0, 10 - errors.length);
  
  // 6. Consistency (5 points)
  score += checkConsistency(resume) ? 5 : 0;
  
  return Math.round(score);
}
```

## 📤 Export System

### PDF Generation
```typescript
// Usando react-pdf
import { PDFDocument } from 'pdf-lib';

async function generatePDF(resume: Resume, template: Template) {
  // 1. Render template with resume data
  const html = renderTemplate(template, resume);
  
  // 2. Convert to PDF
  const pdf = await htmlToPDF(html);
  
  // 3. Upload to storage
  const url = await uploadToStorage(pdf);
  
  return url;
}
```

### DOCX Generation
```typescript
// Usando docx.js
import { Document, Packer, Paragraph } from 'docx';

function generateDOCX(resume: Resume) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: resume.content.name,
          heading: HeadingLevel.HEADING_1,
        }),
        // ... more content
      ],
    }],
  });
  
  return Packer.toBlob(doc);
}
```

## 💳 Sistema de Pagos

### Stripe Integration

**Pricing IDs:**
```typescript
const STRIPE_PLANS = {
  pro: {
    monthly: 'price_pro_monthly_xxx',
    annual: 'price_pro_annual_xxx', // $15/mes pagado anual
  },
  premium: {
    monthly: 'price_premium_monthly_xxx',
    annual: 'price_premium_annual_xxx', // $39/mes pagado anual
  },
};
```

**Subscription Flow:**
```typescript
// 1. User clicks upgrade
POST /api/stripe/create-checkout-session
{
  planType: 'pro',
  billingCycle: 'monthly'
}

// 2. Redirect to Stripe Checkout

// 3. Webhook handles success
POST /api/stripe/webhook
{
  type: 'checkout.session.completed',
  data: { customer, subscription }
}

// 4. Update user plan in database
```

**Features by Plan:**
```typescript
const PLAN_LIMITS = {
  free: {
    resumesPerMonth: 3,
    templates: 5,
    atsScoring: 'basic',
    coverLetters: 0,
    tracking: false,
    linkedinOptimizer: false,
  },
  pro: {
    resumesPerMonth: -1, // unlimited
    templates: 20,
    atsScoring: 'advanced',
    coverLetters: -1,
    tracking: false,
    linkedinOptimizer: false,
  },
  premium: {
    resumesPerMonth: -1,
    templates: -1,
    atsScoring: 'advanced',
    coverLetters: -1,
    tracking: true,
    linkedinOptimizer: true,
  },
};
```

## 🎨 Páginas del Sitio

### 1. Landing Page (/)
- Hero con demo interactivo
- How it works (4 pasos)
- Benefits (vs traditional resume builders)
- Templates showcase
- Pricing comparison
- Testimonials
- FAQ
- CTA: "Create Your Resume Free"

### 2. Dashboard (/dashboard)
- My Resumes (grid view)
- Quick stats
- Recent applications
- Quick actions
- Upgrade prompt (if free)

### 3. Resume Builder (/builder/new)
- Multi-step wizard
- Live preview
- ATS score indicator
- Save drafts

### 4. Resume Editor (/builder/[id])
- Visual editor
- Template switcher
- Real-time ATS score
- Export options

### 5. Templates (/templates)
- Filter by category
- Preview modal
- "Use Template" CTA

### 6. Pricing (/pricing)
- 3-tier comparison
- Annual discount badge
- FAQ
- Money-back guarantee

### 7. Application Tracker (/tracker) [Premium]
- Kanban board
- List view
- Stats dashboard
- Calendar view

## 📊 Métricas de Éxito

### KPIs
- **Free to Paid Conversion**: 5-10% (industria: 2-7%)
- **Monthly Churn**: <5%
- **Average Resume Score**: 75+
- **Time to First Resume**: <10 min
- **Resumes per User**: 3.5 promedio

### Analytics a Trackear
- Signup source
- Template usage
- Feature usage por plan
- Export format preference
- ATS score distribution
- Upgrade triggers

## 💰 Proyección de Ingresos

### Año 1
```
Usuarios:
- Month 1-3: 100 signups/mes
- Month 4-6: 300 signups/mes
- Month 7-12: 500 signups/mes

Conversión a paid: 5%
Churn mensual: 5%

MRR Proyectado (Month 12):
- Pro users (~80): $1,520
- Premium users (~20): $980
- Total MRR: ~$2,500
- ARR: ~$30,000

Con growth continuo: $50-80K ARR realista
```

### Costos Operativos Mensuales

**Escala Inicial (<500 usuarios):**
- Vercel Pro: $20
- Supabase Pro: $25
- OpenAI API: $100-300 (variable)
- Stripe fees: 2.9% + $0.30
- Cloudflare R2: $10
- Email (Resend): $20
- **Total: ~$175-375/mes**

**Escala Media (1000-5000 usuarios):**
- Vercel Enterprise: $150
- Database: $100
- OpenAI API: $500-1500
- Storage: $50
- Tools: $100
- **Total: ~$900-1900/mes**

### Break-even
Con $175 costos fijos:
- Necesitas ~9 Pro users o 4 Premium users
- Alcanzable en 2-3 meses

## 🚀 Plan de Lanzamiento

### Pre-Launch (Semana 1-2)
- [ ] Landing page lista
- [ ] 3 templates funcionando
- [ ] Resume builder MVP
- [ ] Export PDF básico
- [ ] Stripe test mode

### Soft Launch (Semana 3-4)
- [ ] Beta privada (50 usuarios)
- [ ] Recoger feedback
- [ ] Ajustar pricing
- [ ] Pulir UX

### Public Launch (Semana 5-6)
- [ ] Product Hunt launch
- [ ] Reddit (r/resumes, r/jobs)
- [ ] LinkedIn posts
- [ ] Cold email a career coaches
- [ ] Partnerships con bootcamps

### Growth (Mes 2-3)
- [ ] SEO optimization
- [ ] Content marketing (blog)
- [ ] YouTube tutorials
- [ ] Afiliados program
- [ ] Paid ads ($500 budget)

## 🎯 Diferenciadores Clave

vs **Zety, Resume.io, Novoresume:**
1. ✅ **IA más avanzada** - GPT-4 vs templates estáticos
2. ✅ **Job-specific optimization** - Personaliza por oferta
3. ✅ **Real ATS scoring** - Feedback concreto
4. ✅ **Application tracking** - Todo en un lugar
5. ✅ **Mejor pricing** - $19 vs $29+ competitors

## ⚠️ Riesgos y Mitigación

### Riesgo 1: Costos de IA altos
**Mitigación:** 
- Cache de generaciones similares
- Límites por plan
- Usar GPT-3.5 para tareas simples

### Riesgo 2: Baja conversión
**Mitigación:**
- Trial extendido (7 días premium)
- Onboarding excelente
- Email nurture sequence

### Riesgo 3: Competencia
**Mitigación:**
- Innovar rápido
- Nicho específico (tech, remote)
- Mejor customer service

## 📚 Recursos Técnicos

### APIs Útiles
- **OpenAI**: Generación de contenido
- **LanguageTool**: Grammar checking
- **Hunter.io**: Email verification
- **Clearbit**: Company data enrichment

### Libraries
- `pdf-lib`: PDF manipulation
- `docx`: DOCX generation
- `react-pdf`: PDF rendering
- `recharts`: Charts y stats
- `framer-motion`: Animations

---

## 🎉 Resumen

ResumeAI es una oportunidad clara en un mercado de **$2B+** (resume services) con:

✅ **Problema real**: 75% de CVs son rechazados por ATS
✅ **Solución única**: IA + ATS optimization
✅ **Market masivo**: 150M+ job seekers/año
✅ **Monetización clara**: $19-49/mes SaaS
✅ **MVP viable**: 4-6 semanas
✅ **Competencia**: Existe pero hay espacio para mejorar

**ROI Proyectado:** $30-50K ARR en año 1 con esfuerzo part-time.
