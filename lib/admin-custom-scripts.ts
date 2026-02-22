export type AdminCustomScript = {
  script: string;
  command: string;
  title: string;
  description: string;
  category: "templates" | "e2e" | "database" | "migrations" | "payments";
  prerequisites?: string[];
  runAllowed: boolean;
  runNote?: string;
};

export const ADMIN_CUSTOM_SCRIPTS: AdminCustomScript[] = [
  {
    script: "templates:thumbnails",
    command: "npm run templates:thumbnails",
    title: "Generate Template Thumbnails",
    description: "Genera thumbnails de templates para cards y listados de UI.",
    category: "templates",
    runAllowed: true,
  },
  {
    script: "templates:qa-previews",
    command: "npm run templates:qa-previews",
    title: "Generate QA PNG Previews",
    description: "Crea PNG por template para QA visual de diseno.",
    category: "templates",
    runAllowed: true,
  },
  {
    script: "templates:qa-resumes",
    command: "npm run templates:qa-resumes",
    title: "Generate QA Resume Records",
    description: "Crea/actualiza resumes QA para poder exportar PDF y DOCX por template.",
    category: "templates",
    prerequisites: ["ROOT_ADMIN_EMAIL configurado", "Conexion a base de datos activa"],
    runAllowed: true,
  },
  {
    script: "templates:import",
    command: "npm run templates:import",
    title: "Import Templates",
    description: "Importa templates a base de datos.",
    category: "templates",
    runAllowed: true,
  },
  {
    script: "templates:seed-batch2",
    command: "npm run templates:seed-batch2",
    title: "Seed Template Batch 2",
    description: "Inserta el segundo lote de templates en base de datos.",
    category: "templates",
    runAllowed: true,
  },
  {
    script: "test:e2e:synthetic",
    command: "QA_TEST_PASSWORD=\"...\" npm run test:e2e:synthetic",
    title: "Synthetic E2E (All Accounts)",
    description: "Corre flujos sinteticos en cuentas free/pro/premium.",
    category: "e2e",
    prerequisites: ["Playwright instalado", "QA_TEST_PASSWORD definido"],
    runAllowed: true,
  },
  {
    script: "test:e2e:checkout",
    command: "QA_TEST_PASSWORD=\"...\" npm run test:e2e:checkout",
    title: "Synthetic Checkout Flows",
    description: "Valida registro + checkout Stripe en planes/periodos configurados.",
    category: "e2e",
    prerequisites: ["Playwright instalado", "QA_TEST_PASSWORD definido", "Webhook Stripe escuchando"],
    runAllowed: true,
  },
  {
    script: "test:e2e:plans",
    command: "QA_TEST_PASSWORD=\"...\" npm run test:e2e:plans",
    title: "Synthetic Plan Capabilities",
    description: "Verifica acciones disponibles por plan con data sintetica.",
    category: "e2e",
    prerequisites: ["Playwright instalado", "QA_TEST_PASSWORD definido"],
    runAllowed: true,
  },
  {
    script: "test:e2e:part1",
    command: "QA_TEST_PASSWORD=\"...\" npm run test:e2e:part1",
    title: "Automation Part 1",
    description: "Parte 1: login + checkout hasta metodos de pago fake.",
    category: "e2e",
    prerequisites: ["Playwright instalado", "QA_TEST_PASSWORD definido", "Webhook Stripe escuchando"],
    runAllowed: true,
  },
  {
    script: "test:e2e:part2",
    command: "QA_TEST_PASSWORD=\"...\" npm run test:e2e:part2",
    title: "Automation Part 2",
    description: "Parte 2: capacidades de plan (resumes, ATS, covers, etc).",
    category: "e2e",
    prerequisites: ["Playwright instalado", "QA_TEST_PASSWORD definido"],
    runAllowed: true,
  },
  {
    script: "db:seed:test-users",
    command: "npm run db:seed:test-users",
    title: "Seed Test Users",
    description: "Crea usuarios de prueba de QA para escenarios manuales o automacion.",
    category: "database",
    prerequisites: ["Conexion a base de datos activa"],
    runAllowed: true,
  },
  {
    script: "db:seed:synthetic",
    command: "npm run db:seed:synthetic",
    title: "Seed Synthetic Data",
    description: "Inserta data sintetica para pruebas funcionales.",
    category: "database",
    prerequisites: ["Conexion a base de datos activa"],
    runAllowed: true,
  },
  {
    script: "db:reset:qa-user",
    command: "npm run db:reset:qa-user",
    title: "Reset QA User",
    description: "Resetea estado de usuario QA para repetir checkout/upgrade.",
    category: "database",
    prerequisites: ["Conexion a base de datos activa"],
    runAllowed: true,
  },
  {
    script: "db:reset:synthetic",
    command: "npm run db:reset:synthetic",
    title: "Reset Synthetic Data",
    description: "Limpia o reinicia data sintetica para volver a correr E2E.",
    category: "database",
    prerequisites: ["Conexion a base de datos activa"],
    runAllowed: true,
  },
  {
    script: "template:register",
    command: "npm run template:register",
    title: "Register Lovable Template",
    description: "Registra template puntual en sistema (flujo legacy/lovable).",
    category: "migrations",
    runAllowed: true,
  },
  {
    script: "ui:migrate:lovable",
    command: "npm run ui:migrate:lovable",
    title: "Migrate Lovable UI",
    description: "Ejecuta migracion de UI basada en assets/cambios lovable.",
    category: "migrations",
    runAllowed: true,
  },
  {
    script: "stripe:listen",
    command: "npm run stripe:listen",
    title: "Stripe Webhook Listener",
    description: "Escucha eventos Stripe y los forwardea a /api/stripe/webhook.",
    category: "payments",
    runAllowed: false,
    runNote: "Es un proceso de larga duracion. Inicialo en terminal dedicada.",
  },
];

export const ADMIN_RUNNABLE_SCRIPT_SET = new Set(
  ADMIN_CUSTOM_SCRIPTS.filter((item) => item.runAllowed).map((item) => item.script)
);
