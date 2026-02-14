#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseJsonFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw);
}

function normalizeTemplates(input) {
  const list = Array.isArray(input)
    ? input
    : Array.isArray(input?.templates)
    ? input.templates
    : [];

  return list.map((item, index) => {
    const name = item.name || `Template ${index + 1}`;
    const id = item.id || toSlug(name);
    const htmlStructure = item.htmlStructure || item.html || item.markup || '';
    const cssStyles = item.cssStyles || item.css || item.styles || '';
    const colorScheme =
      typeof item.colorScheme === 'object' && item.colorScheme !== null
        ? item.colorScheme
        : {};

    return {
      id,
      name,
      description: item.description || null,
      category: item.category || 'modern',
      thumbnail: item.thumbnail || '',
      htmlStructure,
      cssStyles,
      colorScheme,
      isPremium: Boolean(item.isPremium),
      isActive: item.isActive !== false,
      sortOrder: Number.isInteger(item.sortOrder) ? item.sortOrder : index,
    };
  });
}

async function run() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node scripts/import-templates.cjs <templates.json>');
    process.exit(1);
  }

  const parsed = parseJsonFile(inputPath);
  const templates = normalizeTemplates(parsed);

  if (!templates.length) {
    console.error('No templates found. Expected array or { "templates": [...] }');
    process.exit(1);
  }

  for (const template of templates) {
    await prisma.template.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnail: template.thumbnail,
        htmlStructure: template.htmlStructure,
        cssStyles: template.cssStyles,
        colorScheme: template.colorScheme,
        isPremium: template.isPremium,
        isActive: template.isActive,
        sortOrder: template.sortOrder,
      },
      create: template,
    });
  }

  console.log(`Imported ${templates.length} templates successfully.`);
}

run()
  .catch((error) => {
    console.error('Template import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
