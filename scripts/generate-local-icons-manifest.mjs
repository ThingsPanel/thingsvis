#!/usr/bin/env node
/**
 * Scan packages/widgets/basic/icon/public/icons and generate:
 * - packages/widgets/basic/icon/src/icons-manifest.json
 * - apps/studio/public/local-icons/manifest.json
 *
 * Also syncs icon files to apps/studio/public/local-icons/icons/
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ICONS_SRC = path.join(ROOT, 'packages/widgets/basic/icon/public/icons');
const WIDGET_MANIFEST = path.join(ROOT, 'packages/widgets/basic/icon/src/icons-manifest.json');
const STUDIO_ICONS_DIR = path.join(ROOT, 'apps/studio/public/local-icons/icons');
const STUDIO_MANIFEST = path.join(ROOT, 'apps/studio/public/local-icons/manifest.json');
const SUPPORTED_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif']);
const EXCLUDED_TOP_LEVEL_CATEGORIES = new Set(['actions', 'arrows']);

function readSvgSize(filePath) {
  const source = fs.readFileSync(filePath, 'utf-8');
  const svgTag = source.match(/<svg\b[^>]*>/i)?.[0] ?? '';
  const width = Number.parseFloat(svgTag.match(/\bwidth=["']?([0-9.]+)/i)?.[1] ?? '');
  const height = Number.parseFloat(svgTag.match(/\bheight=["']?([0-9.]+)/i)?.[1] ?? '');
  if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
    return { width, height };
  }

  const viewBox = svgTag.match(/\bviewBox=["']([^"']+)["']/i)?.[1];
  const parts = viewBox?.trim().split(/[\s,]+/).map(Number) ?? [];
  const viewBoxWidth = parts[2];
  const viewBoxHeight = parts[3];
  if (
    Number.isFinite(viewBoxWidth) &&
    viewBoxWidth > 0 &&
    Number.isFinite(viewBoxHeight) &&
    viewBoxHeight > 0
  ) {
    return { width: viewBoxWidth, height: viewBoxHeight };
  }

  return {};
}

function walkSvgFiles(dir, categoryId, categoryName, icons, categoriesSeen) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subCategoryId = categoryId ? `${categoryId}/${entry.name}` : entry.name;
      const subCategoryName = categoryName ? `${categoryName}/${entry.name}` : entry.name;
      if (!categoryId) {
        categoriesSeen.set(entry.name, entry.name);
      }
      walkSvgFiles(fullPath, subCategoryId, subCategoryName, icons, categoriesSeen);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    const fileBase = entry.name.slice(0, -ext.length);
    const iconId = categoryId ? `${categoryId}/${fileBase}` : fileBase;
    const size = ext === '.svg' ? readSvgSize(fullPath) : {};
    icons.push({
      id: iconId,
      categoryId: categoryId || '_root',
      name: fileBase,
      file: entry.name,
      kind: ext === '.svg' ? 'svg' : 'image',
      ext: ext.slice(1),
      ...size,
    });
  }
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  if (!fs.existsSync(ICONS_SRC)) {
    console.error(`[local-icons] Icons directory not found: ${ICONS_SRC}`);
    process.exit(1);
  }

  const categoriesSeen = new Map();
  const icons = [];

  for (const entry of fs.readdirSync(ICONS_SRC, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_TOP_LEVEL_CATEGORIES.has(entry.name)) continue;
    categoriesSeen.set(entry.name, entry.name);
    walkSvgFiles(path.join(ICONS_SRC, entry.name), entry.name, entry.name, icons, categoriesSeen);
  }

  const categories = Array.from(categoriesSeen.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  icons.sort((a, b) => a.id.localeCompare(b.id, 'zh-CN'));

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    basePath: '/local-icons/icons',
    categories,
    icons,
  };

  const json = JSON.stringify(manifest, null, 2);

  fs.mkdirSync(path.dirname(WIDGET_MANIFEST), { recursive: true });
  fs.writeFileSync(WIDGET_MANIFEST, json, 'utf-8');

  fs.mkdirSync(path.dirname(STUDIO_MANIFEST), { recursive: true });
  fs.writeFileSync(STUDIO_MANIFEST, json, 'utf-8');

  if (fs.existsSync(STUDIO_ICONS_DIR)) {
    fs.rmSync(STUDIO_ICONS_DIR, { recursive: true, force: true });
  }
  copyDirRecursive(ICONS_SRC, STUDIO_ICONS_DIR);

  console.log(
    `[local-icons] Generated manifest: ${categories.length} categories, ${icons.length} icons`,
  );
}

main();
