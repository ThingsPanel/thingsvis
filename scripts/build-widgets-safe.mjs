/**
 * build-widgets-safe.mjs
 *
 * Fault-tolerant widget build script.
 *
 * - Builds ALL thingsvis-widget-* packages in parallel
 * - A single widget failure does NOT abort the whole process
 * - Exits with code 0 so `dev:full` can always proceed to start the dev server
 * - Prints a clear summary: N succeeded, M failed (with details)
 *
 * Use this for local development (dev:full).
 * For CI / release, use the strict `build:widgets` which hard-fails on any error.
 */

import { execSync, spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'));
const WIDGETS_DIR = join(ROOT, 'packages', 'widgets');

// SYNC with deploy-widgets.mjs
const CATEGORIES = ['basic', 'chart', 'interaction', 'media', 'data', 'layout', 'indicator', 'geo', 'custom'];

/**
 * Collect all widget package directories.
 */
function getWidgetDirs() {
  const dirs = [];
  for (const cat of CATEGORIES) {
    const catPath = join(WIDGETS_DIR, cat);
    if (!existsSync(catPath)) continue;
    for (const widget of readdirSync(catPath, { withFileTypes: true })) {
      if (!widget.isDirectory()) continue;
      const widgetPath = join(catPath, widget.name);
      const pkgPath = join(widgetPath, 'package.json');
      if (!existsSync(pkgPath)) continue;
      dirs.push({ id: `${cat}/${widget.name}`, path: widgetPath });
    }
  }
  return dirs;
}

/**
 * Build a single widget directory.
 * Resolves with { id, success, duration, stderr }.
 */
function buildWidget(widget) {
  return new Promise((resolve) => {
    const start = Date.now();
    const proc = spawn('pnpm', ['run', 'build'], {
      cwd: widget.path,
      shell: true,
      stdio: ['ignore', 'ignore', 'pipe'],
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      resolve({
        id: widget.id,
        success: code === 0,
        duration: Date.now() - start,
        stderr: stderr.trim(),
      });
    });
  });
}

async function main() {
  const widgets = getWidgetDirs();
  if (widgets.length === 0) {
    console.log('[build:widgets:safe] No widgets found. Skipping.');
    process.exit(0);
  }

  console.log(`[build:widgets:safe] Building ${widgets.length} widgets in parallel...`);
  const start = Date.now();

  const results = await Promise.all(widgets.map(buildWidget));

  const succeeded = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n[build:widgets:safe] ────────────────────────────────`);
  console.log(`  ✅ Succeeded: ${succeeded.length}`);
  for (const r of succeeded) {
    console.log(`     ${r.id} (${(r.duration / 1000).toFixed(1)}s)`);
  }

  if (failed.length > 0) {
    console.warn(`\n  ⚠️  Failed: ${failed.length}`);
    for (const r of failed) {
      console.warn(`     ${r.id} (${(r.duration / 1000).toFixed(1)}s)`);
      if (r.stderr) {
        const preview = r.stderr.split('\n').slice(0, 5).join('\n         ');
        console.warn(`         ${preview}`);
      }
    }
    console.warn(`\n  Failed widgets will show as error placeholders in Studio.\n`);
  }

  const total = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[build:widgets:safe] Done in ${total}s — proceeding to deploy.\n`);

  // Always deploy (skip widgets without dist/)
  try {
    execSync('node scripts/deploy-widgets.mjs', { cwd: ROOT, stdio: 'inherit' });
  } catch (e) {
    console.warn('[build:widgets:safe] deploy-widgets failed:', e.message);
  }

  // Always exit 0: failures are warnings, not blockers for dev server startup
  process.exit(0);
}

main().catch((err) => {
  console.error('[build:widgets:safe] Unexpected error:', err);
  process.exit(0); // Still exit 0 to not block dev server
});
