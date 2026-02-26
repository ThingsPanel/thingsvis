#!/usr/bin/env node
/**
 * generate-registry.js
 *
 * Scans widgets/ directory and auto-generates apps/studio/public/registry.json
 * from each widget's package.json metadata.
 *
 * Uses the same sanitizeMfName() as rspack-widget.config.js to guarantee
 * the remoteName in registry.json always matches the MF bundle name.
 *
 * Usage:
 *   node scripts/generate-registry.js
 *   pnpm registry:generate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WIDGETS_DIR = path.join(ROOT, 'widgets');
const OUTPUT = path.join(ROOT, 'apps', 'studio', 'public', 'registry.json');

// ─── Shared with rspack-widget.config.js ───────────────────────────
// IMPORTANT: This MUST stay in sync with the function in configs/rspack-widget.config.js
function sanitizeMfName(name) {
    return String(name).replace(/[^a-zA-Z0-9_]/g, '_');
}

// ─── Extract dev port from package.json scripts.dev ────────────────
function extractDevPort(scripts) {
    const devScript = scripts?.dev || '';
    const match = devScript.match(/--port\s+(\d+)/);
    return match ? parseInt(match[1], 10) : null;
}

// ─── Main ──────────────────────────────────────────────────────────
function generate() {
    if (!fs.existsSync(WIDGETS_DIR)) {
        console.error('❌ widgets/ directory not found at', WIDGETS_DIR);
        process.exit(1);
    }

    const components = {};
    const categories = fs.readdirSync(WIDGETS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory());

    for (const category of categories) {
        const categoryPath = path.join(WIDGETS_DIR, category.name);
        const widgets = fs.readdirSync(categoryPath, { withFileTypes: true })
            .filter(d => d.isDirectory());

        for (const widget of widgets) {
            const widgetDir = path.join(categoryPath, widget.name);
            const pkgPath = path.join(widgetDir, 'package.json');

            if (!fs.existsSync(pkgPath)) {
                console.warn(`  ⚠️  Skipping ${category.name}/${widget.name} — no package.json`);
                continue;
            }

            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const meta = pkg.thingsvis || {};
            const componentId = `${category.name}/${widget.name}`;

            // Core: use same sanitization as rspack build → guaranteed match
            const remoteName = sanitizeMfName(pkg.name);
            const devPort = extractDevPort(pkg.scripts);

            components[componentId] = {
                remoteName,
                remoteEntryUrl: devPort
                    ? `http://localhost:${devPort}/remoteEntry.js`
                    : ``,
                staticEntryUrl: `/widgets/${componentId}/dist/remoteEntry.js`,
                debugSource: 'static',
                exposedModule: './Main',
                version: pkg.version || '0.0.1',
                ...(meta.icon && { icon: meta.icon }),
                ...(meta.displayName && { name: meta.displayName }),
                ...(meta.i18n && { i18n: meta.i18n }),
            };

            console.log(`  ✅ ${componentId} → ${remoteName} (port: ${devPort || 'default'})`);
        }
    }

    const registry = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        components,
    };

    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify(registry, null, 2) + '\n', 'utf8');

    const count = Object.keys(components).length;
    console.log(`\n✅ Generated registry.json with ${count} widgets → ${path.relative(ROOT, OUTPUT)}`);
}

generate();
