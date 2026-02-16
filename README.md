# ResumeAI

Aplicación para crear y optimizar resumes/CV con IA, templates visuales, autenticación, planes de suscripción, tracker de aplicaciones y exportación PDF.

## Stack / Plataformas

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js App Router + Route Handlers
- **DB:** PostgreSQL (Neon recomendado) + Prisma ORM 5.18
- **Auth:** NextAuth 4.24 (Credentials + Google + LinkedIn + Facebook + Email magic link)
- **Pagos:** Stripe (checkout + portal + webhooks) + PayPal
- **IA:** Anthropic Claude (primary) + OpenAI GPT-3.5 (fallback)
- **UI:** Radix UI, Lucide icons, TipTap rich text
- **Export:** html2canvas + jsPDF (client-side), jsPDF (server-side)
- **Testing:** Vitest

---

## Instalación rápida

```bash
npm install
cp .env.example .env
```

Completa variables en `.env` y luego:

```bash
npx prisma generate
npm run db:push
npm run dev
```

App local: [http://localhost:3000](http://localhost:3000)

---

## SEO + Google Analytics

La app ya incluye:
- Metadata SEO global (title template, canonical, OpenGraph, Twitter, robots)
- Schema.org (`Organization` + `WebSite`)
- `robots.txt` dinámico (`/robots.txt`)
- `sitemap.xml` dinámico (`/sitemap.xml`)
- Google Analytics 4 (`gtag`) si defines `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Variables requeridas en `.env`:

```bash
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
GOOGLE_SITE_VERIFICATION="tu-token-search-console"
BING_SITE_VERIFICATION=""
```

Pasos recomendados para posicionamiento:
1. En producción, usar dominio real en `NEXT_PUBLIC_SITE_URL`.
2. Verificar dominio en Google Search Console con `GOOGLE_SITE_VERIFICATION`.
3. Enviar sitemap: `https://tu-dominio.com/sitemap.xml`.
4. Verificar indexación de `https://tu-dominio.com/robots.txt`.
5. Revisar Core Web Vitals y coverage en Search Console semanalmente.

---

## Lógica de Negocio

### 1. Autenticación y Autorización

#### Providers

| Provider | Condición | Notas |
|---|---|---|
| Credentials | Siempre activo | Solo root admin + usuarios QA |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Fuerza account picker (`prompt: select_account`) |
| LinkedIn OAuth | `LINKEDIN_CLIENT_ID` + `LINKEDIN_CLIENT_SECRET` | OAuth estándar |
| Facebook OAuth | `FACEBOOK_CLIENT_ID` + `FACEBOOK_CLIENT_SECRET` | OAuth estándar |
| Email (Magic Link) | `RESEND_API_KEY` + `EMAIL_FROM` | Token expira en 24 horas, enviado via Resend API |

#### Lógica de Credentials (en orden de prioridad)

1. **Usuarios QA** (solo dev, `NODE_ENV !== 'production'`):
   - `qa-free@resumeai.local` → `planType: free`
   - `qa-pro@resumeai.local` → `planType: pro`
   - `qa-premium@resumeai.local` → `planType: premium`
   - Password: valor de `QA_TEST_PASSWORD`. Auto-upsert en DB.

2. **Root admin**: `ROOT_ADMIN_EMAIL` + `ROOT_ADMIN_PASSWORD` → upsert como `planType: premium`, `name: 'Root Admin'`.

3. Cualquier otra combinación → `null` (rechazado).

#### Roles

- `admin` — se computa en cada creación de JWT: `token.email === ROOT_ADMIN_EMAIL`. NO se almacena en DB.
- `user` — todos los demás.

#### Sesión

Estrategia JWT. El JWT callback almacena: `id`, `name`, `email`, `picture`, `role`. En login con Google OAuth, se actualiza el registro del usuario en DB con datos del perfil de Google (name, email, image).

#### Rutas Protegidas (Middleware)

```
/dashboard/:path*
/builder/:path*
/settings/:path*
/tracker/:path*
/profile/:path*
/admin/:path*
```

Requests no autenticados redirigen a `/login`.

---

### 2. Planes de Suscripción y Entitlements

#### Tiers

| Feature | Free | Pro | Premium |
|---|---|---|---|
| Resumes/mes | 3 | Ilimitado | Ilimitado |
| Templates premium | No | Sí | Sí |
| Cover letters | No | Sí | Sí |
| Exportar DOCX | No | Sí | Sí |
| Límite job tracker | 10 apps | Ilimitado | Ilimitado |
| Custom branding | No | No | Sí |
| LinkedIn optimization | No | No | Sí |
| 1-on-1 resume review | No | No | Sí |
| Interview prep tips | No | No | Sí |
| Salary negotiation guide | No | No | Sí |

#### Precios

- **Pro:** ~$12/mes o ~$108/año (~$9/mes)
- **Premium:** ~$29/mes o ~$288/año (~$24/mes)
- Precios reales se obtienen dinámicamente de Stripe API.

#### Dónde se Aplican las Reglas

| Regla | Dónde se Enforza |
|---|---|
| Límite mensual de resumes (3 free) | Server-side en `POST /api/generate/resume` — cuenta resumes creados desde el 1ro del mes |
| Templates premium | Server-side en `PATCH /api/resume/[id]` (403) + client-side (UI disabled) |
| Límite job tracker (10 free) | **NO se enforza server-side** — solo aparece en pricing UI |
| Acceso cover letters | **NO se enforza aún** — no hay API routes |
| DOCX export | **NO implementado** — listado en features pero sin código |

#### API de Entitlements

`GET /api/entitlements` — retorna `{ plan, limits, features }` para el usuario autenticado.

---

### 3. Sistema de Pagos

#### Stripe

**Checkout flow:**
1. Usuario clic en upgrade → `POST /api/stripe/checkout` con `{ plan, billingPeriod, priceId }`
2. Valida que plan sea `pro` o `premium`
3. Busca o crea Stripe customer (guarda `stripeCustomerId` en DB)
4. Resuelve price ID de env vars (`STRIPE_PRO_MONTHLY_PRICE`, `STRIPE_PRO_ANNUAL_PRICE`, `STRIPE_PREMIUM_MONTHLY_PRICE`, `STRIPE_PREMIUM_ANNUAL_PRICE`)
5. Crea Stripe Checkout session (`mode: subscription`)
6. Retorna `{ sessionId, url }` → redirect a Stripe
7. Success: `/checkout/success?session_id={id}` | Cancel: `/pricing?canceled=true`

**Webhook events** (`POST /api/stripe/webhook`):

| Evento | Acción |
|---|---|
| `checkout.session.completed` | Actualiza `planType`, `stripeSubscriptionId`, `subscriptionStatus`, `currentPeriodEnd`. Log `plan_upgraded` |
| `customer.subscription.updated` | Actualiza `subscriptionStatus`, `currentPeriodEnd`, `planType` |
| `customer.subscription.deleted` | Reset a `planType: free`, `subscriptionStatus: canceled`. Log `plan_downgraded` |
| `invoice.payment_succeeded` | `subscriptionStatus: active`, actualiza `currentPeriodEnd` |
| `invoice.payment_failed` | `subscriptionStatus: past_due` |

**Customer Portal:** `POST /api/stripe/portal` → Stripe Billing Portal. Return URL: `/settings/billing`.

**Plans API:** `GET /api/stripe/plans` → precios reales de Stripe para los 4 price IDs.

#### PayPal

**Flow:**
1. `POST /api/paypal/create-subscription` con `{ plan, billingPeriod }`
2. Resuelve PayPal plan ID de env vars
3. Crea suscripción PayPal
4. Retorna `{ subscriptionId, approvalUrl }` → redirect a PayPal
5. Después de aprobar → `GET /api/paypal/capture-subscription`
6. Verifica userId, confirma subscription `ACTIVE`
7. Actualiza DB (mismos campos que Stripe)
8. Redirect a `/checkout/success?provider=paypal`

**Nota:** PayPal subscription IDs se almacenan en `stripeSubscriptionId` (columna compartida).

#### Máquina de Estados de Suscripción

```
free → (Stripe/PayPal checkout) → pro/premium (active)
  → (invoice.payment_failed) → past_due
  → (subscription.deleted) → free (canceled)
```

**Los resumes NUNCA se eliminan al hacer downgrade.** El usuario conserva los existentes pero no puede crear nuevos más allá del límite mensual.

---

### 4. Resume Builder

#### Flujo de Creación (`/builder/new`) — Wizard de 4 pasos

1. **Job Info:** Job URL (opcional), Job Description (requerido, mín 50 chars)
2. **Personal Info:** Name, Email, Phone (requeridos); Location, LinkedIn, Portfolio, Headline (opcionales)
3. **Experience & Education:**
   - Experiencias laborales (mín 1 con title + company)
   - Educación (mín 1 con degree + institution)
   - Skills (input de texto, almacenado como array)
4. **Generate:** Resumen + botón "Generate My Resume" → `POST /api/generate/resume`

#### Generación con IA (`POST /api/generate/resume`)

1. Valida sesión y campos requeridos
2. **Chequeo de límite mensual:** cuenta resumes creados desde el 1ro del mes. Si plan `free` y count >= 3 → `403` con `{ error: 'Monthly resume limit reached', resumesUsed, resumesLimit }`
3. Llama a `generateOptimizedResume()` (servicio de IA)
4. Guarda resume en DB con: content (JSON), templateId, atsScore, atsFeedback
5. Log `resume_created` en UsageLog
6. Retorna `{ success, resumeId, atsScore }`

#### Edición (`/builder/[id]`)

- **Panel izquierdo:** Selector de template, resumen profesional, bullets de experiencia, editor de skills
- **Panel derecho:** Preview en vivo via `TemplateRenderer`
- **Barra superior:** ATS Score, "Run ATS Scan", Save, Export PDF
- **Save:** `PATCH /api/resume/[id]` — valida ownership, verifica acceso a template premium, actualiza content/title/templateId

#### ATS Scoring

**Server-side (al crear):**

| Categoría | Max Puntos | Cálculo |
|---|---|---|
| Keyword match | 40 | `matchedKeywords / totalKeywords * 40` |
| Secciones completas | 20 | summary(5) + experience(10) + education(3) + skills(2) |
| Cantidad de bullets | 20 | >=9 → 20; >=6 → 15; else 10 |
| Resultados cuantificables | 10 | Algún bullet con dígito → 10; else 5 |
| Action verbs | 10 | Bullets con verbos de acción → 10; else 5 |
| **Total** | **100** | `min(100, round(score))` |

**Client-side (re-scan en editor):**

| Check | Penalización | Severidad |
|---|---|---|
| Summary < 40 palabras | -12 | High |
| Summary > 140 palabras | -6 | Low |
| < 2 experiencias | -10 | High |
| Sin bullets en experiencia | -20 | High |
| < 35% bullets cuantificados | -10 | Medium |
| < 8 skills técnicas | -8 | Medium |
| < 4 soft skills | -4 | Low |
| < 12 keywords únicos | -8 | Medium |
| Falta name/email/phone | -8 | High |

#### Resume CRUD

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/resume` | GET | Lista todos los resumes del usuario (ordenados por updatedAt desc) |
| `/api/resume/[id]` | GET | Resume individual con plan + template (ownership check) |
| `/api/resume/[id]` | PATCH | Actualiza content, title, templateId (verifica template premium) |
| `/api/resume/[id]/export` | POST | Generación PDF server-side (texto plano, sin template visual) |

---

### 5. Templates

#### Catálogo (23 total)

**Free (11):** modern-professional (default), tech-minimal, simple-clean, academic-formal, accountant-template, finance-template, frontend-template, marketing-template, nurse-template, paralegal-template, sales-template, startup-template

**Premium (12, requieren Pro o Premium):** executive-classic, creative-bold, startup-modern, consultant-pro, consultant-template, data-science-template, devops-template, legal-template, medical-template, product-manager-template, ux-designer-template

#### Arquitectura

- Componentes React en `/app/lovable-templates/`
- `TemplateRenderer` mapea templateId → componente
- Categorías: professional, tech, creative, executive, academic, modern
- `ensureTemplateExists()` hace upsert del template en DB antes de guardar resume

#### Enforcement

- **Client-side:** Templates premium disabled en dropdown para free users, lock icon en galería
- **Server-side:** `PATCH /api/resume/[id]` retorna 403 si free user intenta usar template premium

---

### 6. Export

#### PDF Client-side (Método principal)

- `html2canvas` (escala 2x) + `jsPDF` (A4, portrait)
- Captura el DOM del `TemplateRenderer` en vivo
- Soporte multi-página via canvas slicing
- Fallback de rendering si foreignObject produce canvas en blanco
- Disponible para TODOS los usuarios (sin chequeo de plan)

#### PDF Server-side

- `POST /api/resume/[id]/export`
- PDF de texto plano usando jsPDF (sin templates visuales)
- Renderiza: Name, Headline, Contact, Summary, Experience, Education, Skills
- Log `resume_exported` en UsageLog

#### DOCX Export

Listado como feature de Pro/Premium pero **NO implementado**. El campo `docxUrl` existe en el modelo Resume pero nunca se popula.

---

### 7. Job Application Tracker

#### Modelo de Datos

```
JobApplication {
  company       String    (requerido)
  position      String    (requerido)
  location      String?
  jobUrl        String?
  salary        String?
  status        String    default: "applied"
  priority      String    default: "medium"
  appliedDate   DateTime  default: now()
  interviewDate DateTime?
  followUpDate  DateTime?
  notes         String?   (texto largo)
  contacts      Json?     // Array de { name, email, role }
}
```

**Status:** `applied` | `phone_screen` | `interview` | `offer` | `rejected` | `withdrawn`

**Priority:** `low` | `medium` | `high`

#### API Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/tracker` | GET | Lista aplicaciones del usuario (soporta `?status=` y `?search=`) |
| `/api/tracker` | POST | Crea aplicación (requiere company + position) |
| `/api/tracker/[id]` | GET | Aplicación individual (ownership check) |
| `/api/tracker/[id]` | PUT | Actualiza aplicación (ownership check) |
| `/api/tracker/[id]` | DELETE | Elimina aplicación (ownership check) |

#### Features

- Búsqueda por company o position (case-insensitive)
- Filtro por status
- Cambio de status con un clic (persiste en DB)
- Gestión de contactos (agregar/editar/eliminar contactos por aplicación)
- Programación de interview date + follow-up date
- Stats: Total, Active, Interviews, Offers

---

### 8. Integración de IA

#### Prioridad de Providers

```
1. Anthropic Claude (claude-sonnet-4-20250514, max 2500 tokens)
   ↓ en caso de fallo
2. OpenAI GPT-3.5 Turbo (temperature 0.7, JSON mode)
   ↓ si ninguno configurado
3. Error: "No AI provider configured"
```

Se pueden deshabilitar con `USE_ANTHROPIC=false` o `USE_OPENAI=false`.

#### Features de IA

**Optimización de Resume (`generateOptimizedResume`):**
1. Extrae top 20 keywords del job description
2. Envía datos del candidato + job description a la IA
3. IA retorna: resumen profesional optimizado, bullets de experiencia con keywords, skills (técnicas/soft), mejoras sugeridas
4. Calcula ATS score

**Generación de Cover Letter (`generateCoverLetter`):**
- Genera cover letter de 3-4 párrafos basada en job description + datos del candidato
- Max 800 tokens
- **Backend listo pero NO hay API routes ni UI implementados aún**

---

### 9. Perfil de Usuario

#### Datos

**Tabla User:** name, email, image, planType, subscriptionStatus, currentPeriodEnd, stripeCustomerId

**Tabla UserProfile (1:1):**
- phone, location, headline, summary
- linkedinUrl, portfolioUrl, githubUrl
- experiences, education, skills, languages, certifications (arrays JSON — definidos en schema pero NO expuestos en API)

#### API

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/profile` | GET | Retorna datos mergeados de User + UserProfile |
| `/api/profile` | PATCH | Actualiza name, email (User) + campos de perfil (upsert UserProfile). 409 si email duplicado |

---

### 10. Dashboard

#### API (`GET /api/dashboard`)

Fetch en paralelo:
- Todos los resumes del usuario (con info de template)
- Conteo de resumes del mes actual vs límite del plan
- Conteo total de JobApplication
- Conteo de JobApplication donde status = 'interview'
- Promedio de ATS score

#### Stats Cards

1. **Total Resumes** — conteo + uso mensual ("X de 3" o "X de ilimitado")
2. **Avg. ATS Score** — color coded (verde >= 90, azul >= 75, amarillo < 75)
3. **Applications** — conteo total del job tracker
4. **Interviews** — aplicaciones con status interview

---

### 11. Panel Admin (`/admin`)

**Acceso:** Verificación de rol server-side (`role !== 'admin'` → redirect a `/dashboard`).

**Funcionalidad:** Solo QA User Switcher (herramienta de dev/testing).
- Cambiar entre cuentas qa-free, qa-pro, qa-premium
- No hay features de admin para producción (no gestión de usuarios, stats, ni content management)

---

### 12. Modelo de Datos

| Modelo | Propósito |
|---|---|
| `User` | Auth, suscripción, gestión de plan |
| `Account` | Links de OAuth providers (NextAuth) |
| `Session` | Sesiones JWT (NextAuth) |
| `VerificationToken` | Tokens de magic link |
| `UserProfile` | Datos extendidos (phone, location, URLs, etc.) |
| `Resume` | Content (JSON), templateId, atsScore, atsFeedback, job data |
| `Template` | Name, category, isPremium, HTML/CSS |
| `JobApplication` | Company, position, status, priority, dates, contacts, notes |
| `CoverLetter` | Company, position, content (solo schema, sin API) |
| `UsageLog` | Tracking de acciones: resume_created, resume_exported, plan_upgraded, plan_downgraded |

---

### 13. Reglas de Negocio Clave

1. **Plan free:** 3 resumes/mes (enforzado server-side). Se reinicia el 1ro de cada mes.
2. **Templates premium:** Bloqueados para free users client-side Y server-side (403).
3. **Resumes nunca se eliminan al hacer downgrade** — usuarios conservan resumes existentes, solo no pueden crear más allá del límite mensual.
4. **Rol admin:** Un solo email via env var. Se computa en creación de JWT, no se almacena en DB.
5. **Fallback de IA:** Claude → OpenAI → error. Ambos se pueden deshabilitar via env vars.
6. **Ownership checks:** Todo CRUD de resumes y tracker valida `userId === session.user.id`.
7. **Expiración magic link:** 24 horas.
8. **PayPal comparte columna `stripeSubscriptionId`** — no hay campo separado para suscripciones PayPal.
9. **Límite de job tracker (10 apps para free):** Definido en plan features pero NO enforzado en API.

---

### 14. Features No Implementados

| Feature | Estado |
|---|---|
| Cover Letter API + UI | Función de IA lista, modelo DB existe, no hay routes/pages |
| DOCX Export | Listado en plan features, sin implementación |
| Límite job tracker free | No enforzado server-side |
| Compartir resume | Botón en UI existe, sin backend |
| Operaciones bulk del tracker | No implementado |
| Vista calendario del tracker | No implementado |
| Notificaciones/reminders | No implementado |

---

## Variables de Entorno

```env
# Database
DATABASE_URL=""
DIRECT_URL=""

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""

# Admin
ROOT_ADMIN_EMAIL=""
ROOT_ADMIN_PASSWORD=""
QA_TEST_PASSWORD=""

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
LINKEDIN_CLIENT_ID=""
LINKEDIN_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""

# Email (Magic Link)
RESEND_API_KEY=""
EMAIL_FROM=""

# AI Providers
ANTHROPIC_API_KEY=""
OPENAI_API_KEY=""
USE_ANTHROPIC=""      # "false" para deshabilitar
USE_OPENAI=""         # "false" para deshabilitar

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_MONTHLY_PRICE=""
STRIPE_PRO_ANNUAL_PRICE=""
STRIPE_PREMIUM_MONTHLY_PRICE=""
STRIPE_PREMIUM_ANNUAL_PRICE=""

# PayPal
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_PRO_MONTHLY_PLAN=""
PAYPAL_PRO_ANNUAL_PLAN=""
PAYPAL_PREMIUM_MONTHLY_PLAN=""
PAYPAL_PREMIUM_ANNUAL_PLAN=""

# App
NEXT_PUBLIC_APP_URL=""

# Synthetic data seeding (opcional, para QA/automation)
SYNTHETIC_USERS_PER_PLAN="3"
SYNTHETIC_RESUMES_FREE="2"
SYNTHETIC_RESUMES_PRO="4"
SYNTHETIC_RESUMES_PREMIUM="6"
SYNTHETIC_APPS_PER_USER="8"
SYNTHETIC_EMAIL_PREFIX="synthetic"
SYNTHETIC_EMAIL_DOMAIN="synthetic.resumeai.local"
SYNTHETIC_TAG="SYNTH"
```

### LinkedIn OAuth Setup + Import

1. En LinkedIn Developers crea una app y habilita **Sign In with LinkedIn using OpenID Connect**.
2. Configura este redirect URL exacto:
   - `http://localhost:3000/api/auth/callback/linkedin`
3. Copia credenciales a `.env`:
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
4. Reinicia `npm run dev`.
5. En `/login` usa **Continue with LinkedIn**.
6. Luego en `/profile` usa **Import from LinkedIn** para traer datos básicos (name, email, image y linkedinUrl si viene en provider response).

### Resume Import from Word (.docx)

- En `/builder/new` ahora tienes dos caminos:
  - **Upload your Word resume** (`.docx`)
  - **Create from scratch**
- Al subir `.docx`, la app parsea el contenido y crea un resume nuevo usando el template seleccionado.
- Te redirige automáticamente a `/builder/[id]` para editar y cambiar template si quieres.

### Integrating from `resumeai-lovable`

Usa este script para registrar un template de Lovable en este repo:

```bash
npm run template:register -- \
  --source "../resumeai-lovable/src/templates/FrontendTemplate.tsx" \
  --component "FrontEndTemplate" \
  --id "frontend-template-v2" \
  --name "Front-End Craft v2" \
  --description "Modern frontend-focused layout from Lovable." \
  --category "tech" \
  --categoryLabel "Tech" \
  --isPremium false \
  --colors "from-sky-500 to-indigo-700"
```

Qué actualiza automáticamente:
- `app/lovable-templates/<Component>.tsx` (copia el source)
- `app/lovable-templates/TemplateRenderer.tsx` (import + case)
- `lib/template-catalog.ts` (entrada del template)

### Staging UI Migration Script (Lovable -> Next.js)

Para traer el diseño de `resume-ai-connector` sin sobrescribir tu app Next.js:

```bash
npm run ui:migrate:lovable -- --source ../resume-ai-connector --clean
```

Esto copia archivos a:
- `.migration/lovable/src/components`
- `.migration/lovable/src/pages`
- `.migration/lovable/src/hooks`
- `.migration/lovable/src/lib`
- `.migration/lovable/public`
- `.migration/lovable/meta/*` (configs de referencia)

Luego migra manualmente por página desde staging hacia `app/*/page.tsx`.

### LinkedIn Data Export (CSV) para Experience/Education/Skills

El login OAuth de LinkedIn normalmente solo entrega datos básicos.  
Para importar experiencia, educación y skills:

1. Desde LinkedIn, descarga tu export de datos (CSV).
2. En `/builder/new` -> Step 2, usa **Import LinkedIn CSV**.
3. Sube archivos como:
   - `Positions.csv` (experience)
   - `Education.csv` (education)
   - `Skills.csv` (skills)
4. Puedes subirlos uno por uno; cada upload actualiza `user_profile` y precarga el wizard.

---

## Comandos

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run lint             # ESLint
npm run test             # Tests con Vitest
npm run test:coverage    # Tests con coverage
npm run db:push          # Aplica schema.prisma a DB
npm run db:studio        # Abre Prisma Studio
npm run db:seed:synthetic # Crea usuarios/datos sintéticos para QA automation
npm run db:reset:synthetic # Elimina solo los datos sintéticos creados por seed
npm run stripe:listen    # Forwardea webhooks Stripe a localhost
```

---

## Synthetic Data para QA Automation

Estos scripts crean data realista para pruebas E2E/API sin tocar usuarios reales.

- Script de seed: `npm run db:seed:synthetic`
- Script de cleanup: `npm run db:reset:synthetic`
- Patrón de usuarios creados: `synthetic-{free|pro|premium}-{n}@synthetic.resumeai.local`
- Los registros se marcan con `SYNTH` en `name/notes` para trazabilidad.

Notas:
- Los usuarios sintéticos **no** habilitan login por credentials automáticamente.
- El login por credentials sigue limitado a root + QA (`qa-*.local`) según `lib/auth.ts`.

### Cómo Probar (Paso a Paso)

1. Asegúrate de tener DB conectada y schema aplicado:
```bash
npm run db:push
```

2. (Opcional) Ajusta volumen en `.env`:
```env
SYNTHETIC_USERS_PER_PLAN="3"
SYNTHETIC_RESUMES_FREE="2"
SYNTHETIC_RESUMES_PRO="4"
SYNTHETIC_RESUMES_PREMIUM="6"
SYNTHETIC_APPS_PER_USER="8"
```

3. Crea data sintética:
```bash
npm run db:seed:synthetic
```

4. Levanta la app:
```bash
npm run dev
```

5. Valida desde UI con usuarios QA (credentials):
   - Login en `/login` con `qa-free@resumeai.local`, `qa-pro@resumeai.local`, `qa-premium@resumeai.local`
   - Password: valor de `QA_TEST_PASSWORD`
   - Revisa `/dashboard` (resumes y ATS), `/tracker` (applications/reminders/calendario), `/templates` (locks por plan)

6. Ver data sintética en la app (credentials, solo dev):
   - Login en `/login` con un usuario sembrado, por ejemplo:
     - `synthetic-free-1@synthetic.resumeai.local`
     - `synthetic-pro-1@synthetic.resumeai.local`
     - `synthetic-premium-1@synthetic.resumeai.local`
   - Password: el mismo `QA_TEST_PASSWORD`
   - Luego entra a `/dashboard` y `/tracker` para ver sus resumes/aplicaciones.

7. Validación rápida por API:
```bash
curl http://localhost:3000/api/debug/session
curl http://localhost:3000/api/dashboard
curl http://localhost:3000/api/tracker/reminders
```

8. Limpia todo lo sintético al terminar:
```bash
npm run db:reset:synthetic
```

---

## Estructura del Proyecto

```
resumeai/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── auth/force-google/     # Clean Google OAuth redirect
│   │   ├── dashboard/             # Dashboard stats
│   │   ├── entitlements/          # Plan limits & features
│   │   ├── generate/resume/       # Generación de resume con IA
│   │   ├── paypal/                # PayPal subscription flows
│   │   ├── profile/               # User profile CRUD
│   │   ├── resume/                # Resume CRUD + export
│   │   ├── stripe/                # Stripe checkout, webhook, portal, plans
│   │   └── tracker/               # Job application CRUD
│   ├── admin/                     # Panel admin (QA switcher)
│   ├── builder/                   # Resume builder (new + edit)
│   ├── checkout/                  # Página post-pago
│   ├── dashboard/                 # Dashboard del usuario
│   ├── login/                     # Página de autenticación
│   ├── lovable-templates/         # Componentes React de templates
│   ├── pricing/                   # Página de precios
│   ├── profile/                   # Editor de perfil
│   ├── settings/billing/          # Gestión de suscripción
│   ├── templates/                 # Galería de templates
│   └── tracker/                   # Job application tracker
├── lib/
│   ├── auth.ts                    # Configuración NextAuth
│   ├── ai-service.ts              # Integración Claude/OpenAI
│   ├── prisma.ts                  # Cliente de DB
│   ├── stripe.ts                  # Config Stripe + definición de planes
│   ├── paypal.ts                  # Config PayPal
│   ├── template-catalog.ts        # Definiciones de templates
│   └── template-db.ts             # Operaciones de templates en DB
├── prisma/
│   └── schema.prisma              # Modelo de datos
├── types/
│   ├── resume.ts                  # Tipos de datos de resume
│   └── next-auth.d.ts             # Extensiones de tipos NextAuth
├── tests/                         # Tests Vitest
└── middleware.ts                   # Protección de rutas
```

---

## Deploy

Recomendado: **Vercel + Neon + Stripe**.

Checklist:
1. Configura todas las variables en entorno de deploy
2. Ejecuta `npm run db:push` contra DB de producción
3. Configura webhook de Stripe apuntando a `/api/stripe/webhook`
4. Verifica `NEXT_PUBLIC_APP_URL` con tu dominio real
5. Asegúrate que `QA_TEST_PASSWORD` NO esté configurado en producción (la lógica ya limita por `NODE_ENV`)

### Nota para Vercel + Prisma

Si Vercel muestra error de Prisma Client desactualizado, esta app ya ejecuta:
- `postinstall`: `prisma generate`
- `prebuild`: `prisma generate`

Opcionalmente, puedes fijar en Vercel el Build Command como:
```bash
npm run build
```
o explícito:
```bash
prisma generate && npm run build
```

## Seguridad

- No subas `.env` a git
- Rota llaves si se filtraron
- Usa `NEXTAUTH_SECRET` fuerte en producción
- QA test users están limitados a `NODE_ENV !== 'production'`
- Todos los endpoints CRUD validan ownership del recurso
- Webhook de Stripe verifica signature con `STRIPE_WEBHOOK_SECRET`
