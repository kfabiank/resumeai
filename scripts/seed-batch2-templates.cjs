#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Seed script: inserts/updates all templates from premiumTemplatesBatch2.ts into the DB.
 * Maps htmlContent → htmlStructure and cssContent → cssStyles to match the Prisma schema.
 *
 * Usage: node scripts/seed-batch2-templates.cjs
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Read and parse the TypeScript source file at runtime using regex extraction.
// This avoids needing ts-node or a build step.
// ---------------------------------------------------------------------------
function extractStringVar(src, varName) {
  // Match: const varName = `...` (template literal, handles newlines)
  const re = new RegExp(
    'const\\s+' + varName + '\\s*=\\s*`([\\s\\S]*?)`\\s*;',
    'm'
  );
  const m = src.match(re);
  if (!m) throw new Error(`Could not extract variable: ${varName}`);
  return m[1];
}

function extractExportArray(src) {
  // Match the export array entries: { id: "...", name: "...", ... }
  const arrayRe = /export const premiumTemplatesBatch2[^=]*=\s*\[([\s\S]*?)\];/m;
  const m = src.match(arrayRe);
  if (!m) throw new Error('Could not find premiumTemplatesBatch2 export array');

  const entries = [];
  // Each entry: { id: "...", name: "...", ..., htmlContent: varName, cssContent: varName }
  const entryRe = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*isPremium:\s*(true|false),\s*htmlContent:\s*(\w+),\s*cssContent:\s*(\w+)\s*\}/g;
  let entry;
  while ((entry = entryRe.exec(m[1])) !== null) {
    entries.push({
      id: entry[1],
      name: entry[2],
      description: entry[3],
      category: entry[4],
      isPremium: entry[5] === 'true',
      htmlVarName: entry[6],
      cssVarName: entry[7],
    });
  }
  return entries;
}

async function run() {
  const srcPath = path.resolve(__dirname, '../lib/premiumTemplatesBatch2.ts');
  if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcPath}`);
    process.exit(1);
  }

  const src = fs.readFileSync(srcPath, 'utf8');
  const entries = extractExportArray(src);

  if (!entries.length) {
    console.error('No template entries found in premiumTemplatesBatch2.ts');
    process.exit(1);
  }

  console.log(`Found ${entries.length} templates to upsert...\n`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const htmlStructure = extractStringVar(src, entry.htmlVarName);
    const cssStyles = extractStringVar(src, entry.cssVarName);

    await prisma.template.upsert({
      where: { id: entry.id },
      update: {
        name: entry.name,
        description: entry.description,
        category: entry.category,
        isPremium: entry.isPremium,
        htmlStructure,
        cssStyles,
        isActive: true,
        sortOrder: 100 + i,
      },
      create: {
        id: entry.id,
        name: entry.name,
        description: entry.description,
        category: entry.category,
        isPremium: entry.isPremium,
        htmlStructure,
        cssStyles,
        thumbnail: '',
        colorScheme: {},
        isActive: true,
        sortOrder: 100 + i,
      },
    });

    console.log(`  [${i + 1}/${entries.length}] ✓ ${entry.name} (${entry.id})`);
  }

  console.log('\nAll templates seeded successfully.');
}

run()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
