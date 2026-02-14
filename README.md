# ResumeAI

Aplicación para crear y optimizar resumes/CV con IA, templates visuales, autenticación, planes de suscripción y exportación PDF.

## Stack / Plataformas
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Next.js App Router + Route Handlers
- DB: PostgreSQL (Neon recomendado) + Prisma
- Auth: NextAuth (Credentials + Google + LinkedIn + Facebook + Email magic link)
- Pagos: Stripe (checkout + portal + webhooks)
- IA: Anthropic y/o OpenAI
- Export: html2canvas + jsPDF

## Requisitos
- Node.js 18+
- npm 9+
- Cuenta de Neon (o PostgreSQL compatible)
- Cuenta de Stripe (si usas planes pagos)
- (Opcional) Resend para magic links por email

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

## Variables de entorno
Archivo principal: `.env`.

Variables clave:

- DB
  - `DATABASE_URL` (pooled)
  - `DIRECT_URL` (direct)
- Auth
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `ROOT_ADMIN_EMAIL`
  - `ROOT_ADMIN_PASSWORD`
  - `QA_TEST_PASSWORD` (solo desarrollo)
- OAuth
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
  - `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`
- Email
  - `RESEND_API_KEY`
  - `EMAIL_FROM` y/o `FROM_EMAIL`
- IA
  - `USE_ANTHROPIC`, `ANTHROPIC_API_KEY`
  - `USE_OPENAI`, `OPENAI_API_KEY`
- Stripe
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRO_MONTHLY_PRICE`
  - `STRIPE_PRO_ANNUAL_PRICE`
  - `STRIPE_PREMIUM_MONTHLY_PRICE`
  - `STRIPE_PREMIUM_ANNUAL_PRICE`
- App
  - `NEXT_PUBLIC_APP_URL`

## Neon / Base de datos
1. Crea proyecto en [Neon Console](https://console.neon.tech/)
2. Copia conexión pooled a `DATABASE_URL`
3. Copia conexión direct a `DIRECT_URL`
4. Sincroniza esquema:
```bash
npm run db:push
```

### Comandos DB
```bash
npm run db:push         # aplica schema.prisma
npm run db:studio       # abre Prisma Studio
npm run db:seed:test-users
```

## Stripe: mapping de productos/precios
La app usa `priceId` reales para checkout y sincronización de plan.

Mapea tus 4 precios de Stripe así:
- `STRIPE_PRO_MONTHLY_PRICE` -> precio mensual del plan Pro
- `STRIPE_PRO_ANNUAL_PRICE` -> precio anual del plan Pro
- `STRIPE_PREMIUM_MONTHLY_PRICE` -> precio mensual del plan Premium
- `STRIPE_PREMIUM_ANNUAL_PRICE` -> precio anual del plan Premium

### Flujo Stripe implementado
- `POST /api/stripe/checkout` crea sesión checkout
- `POST /api/stripe/webhook` actualiza `planType`, estado y periodo
- `POST /api/stripe/portal` abre billing portal
- `GET /api/stripe/plans` retorna precios/productos reales para UI

### Probar webhooks local
```bash
npm run stripe:listen
```
Esto forwardea a `http://localhost:3000/api/stripe/webhook`.

## Planes y permisos
Centralizados en `lib/stripe.ts`:
- `PLAN_LIMITS`
- `PLAN_FEATURES`

Endpoint de permisos:
- `GET /api/entitlements`

Reglas activas:
- Free: límite mensual, templates premium bloqueados
- Pro/Premium: sin límite mensual, templates premium habilitados

## Usuarios de prueba (QA)
Script:
```bash
npm run db:seed:test-users
```

Crea/actualiza:
- `qa-free@resumeai.local` (plan `free`)
- `qa-pro@resumeai.local` (plan `pro`)
- `qa-premium@resumeai.local` (plan `premium`)

Login QA por password (solo `NODE_ENV != production`):
- password = `QA_TEST_PASSWORD`

## Testing
```bash
npm run test
npm run test:coverage
```

Nota: `next lint` puede pedir configuración interactiva de ESLint si no está inicializada.

## Export PDF
En el builder, el PDF se genera desde el render visual del template (no plain text), con paginado multipágina.

## Estructura principal
- `app/` rutas y UI
- `app/api/` endpoints
- `lib/` integraciones y reglas de negocio
- `prisma/schema.prisma` modelo de datos
- `scripts/` utilidades (templates, users QA)
- `tests/` pruebas unitarias

## Deploy
Recomendado: Vercel + Neon + Stripe.

Checklist:
1. Configura todas las variables en entorno de deploy
2. Ejecuta `npm run db:push` contra DB de producción
3. Configura webhook de Stripe a `/api/stripe/webhook`
4. Verifica `NEXT_PUBLIC_APP_URL` con tu dominio real

## Seguridad
- No subas `.env` a git
- Rota llaves si se filtraron
- Usa `NEXTAUTH_SECRET` fuerte en producción
- Desactiva QA password en producción (la lógica ya está limitada por `NODE_ENV`)
