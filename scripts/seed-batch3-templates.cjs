#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Seed script: inserts/updates all templates from premiumTemplatesBatch3.ts into the DB.
 * Maps htmlContent → htmlStructure and cssContent → cssStyles to match the Prisma schema.
 *
 * Usage: node scripts/seed-batch3-templates.cjs
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
  const arrayRe = /export const premiumTemplatesBatch3[^=]*=\s*\[([\s\S]*?)\];/m;
  const m = src.match(arrayRe);
  if (!m) throw new Error('Could not find premiumTemplatesBatch3 export array');

  const arrayBlock = m[1];
  const entries = [];

  // Parse each object block and extract fields independently to tolerate formatting differences.
  const objectRe = /\{[\s\S]*?\}/g;
  let block;
  while ((block = objectRe.exec(arrayBlock)) !== null) {
    const obj = block[0];
    const id = obj.match(/id:\s*"([^"]+)"/)?.[1];
    const name = obj.match(/name:\s*"([^"]+)"/)?.[1];
    const description = obj.match(/description:\s*"([^"]+)"/)?.[1];
    const category = obj.match(/category:\s*"([^"]+)"/)?.[1];
    const isPremiumRaw = obj.match(/isPremium:\s*(true|false)/)?.[1];
    const htmlVarName = obj.match(/htmlContent:\s*(\w+)/)?.[1];
    const cssVarName = obj.match(/cssContent:\s*(\w+)/)?.[1];

    if (!id || !name || !description || !category || !isPremiumRaw || !htmlVarName || !cssVarName) {
      continue;
    }

    entries.push({
      id,
      name,
      description,
      category,
      isPremium: isPremiumRaw === 'true',
      htmlVarName,
      cssVarName,
    });
  }
  return entries;
}

function normalizeCategory(value) {
  const v = `${value || ''}`.trim().toLowerCase();
  if (!v) return 'professional';
  if (v.includes('executive')) return 'executive';
  if (v.includes('tech') || v.includes('technology')) return 'tech';
  if (v.includes('design') || v.includes('creative')) return 'creative';
  if (v.includes('academic')) return 'academic';
  if (v.includes('modern')) return 'modern';
  return 'professional';
}

async function run() {
  const srcPath = path.resolve(__dirname, '../lib/premiumTemplatesBatch3.ts');
  if (!fs.existsSync(srcPath)) {
    console.error(`Source file not found: ${srcPath}`);
    process.exit(1);
  }

  const src = fs.readFileSync(srcPath, 'utf8');
  const entries = extractExportArray(src);

  if (!entries.length) {
    console.error('No template entries found in premiumTemplatesBatch3.ts');
    process.exit(1);
  }

  console.log(`Found ${entries.length} templates to upsert...\n`);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const htmlStructure = extractStringVar(src, entry.htmlVarName);
    const cssStyles = extractStringVar(src, entry.cssVarName);
    const normalizedCategory = normalizeCategory(entry.category);

    await prisma.template.upsert({
      where: { id: entry.id },
      update: {
        name: entry.name,
        description: entry.description,
        category: normalizedCategory,
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
        category: normalizedCategory,
        isPremium: entry.isPremium,
        htmlStructure,
        cssStyles,
        thumbnail: '',
        colorScheme: {},
        isActive: true,
        sortOrder: 100 + i,
      },
    });

    console.log(`  [${i + 1}/${entries.length}] ✓ ${entry.name} (${entry.id}) [${normalizedCategory}]`);
  }

  console.log('\nAll templates seeded successfully.');
}

run()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
