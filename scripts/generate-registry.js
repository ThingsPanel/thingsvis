#!/usr/bin/env node
/**
 * generate-registry.js
 *
 * Scans widgets/ directory and auto-generates apps/studio/public/registry.json
 * from each widget's package.json and metadata.ts.
 *
 * Uses the same sanitizeMfName() as rspack-widget.config.js to guarantee
 * the remoteName in registry.json always matches the MF bundle name.
 *
 * Priority for fields:
 *   - icon: metadata.ts > package.json thingsvis.icon
 *   - name: metadata.ts (if not i18n key) > package.json thingsvis.displayName
 *   - i18n: package.json thingsvis.i18n
 *
 * Usage:
 *   node scripts/generate-registry.js
 *   pnpm registry:generate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WIDGETS_DIR = path.join(ROOT, 'packages', 'widgets');
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

// ─── Read metadata.ts ──────────────────────────────────────────────
function readMetadataTs(widgetDir) {
    const metadataPath = path.join(widgetDir, 'src', 'metadata.ts');
    if (!fs.existsSync(metadataPath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(metadataPath, 'utf8');

        // Extract metadata object using regex (with or without 'as const')
        const match = content.match(/export\s+const\s+metadata\s*=\s*(\{[\s\S]*?\})(?:\s*as\s+const)?\s*;?\s*$/m);
        if (!match) return null;

        const metadataStr = match[1];

        // Extract string properties
        const extractString = (key) => {
            const m = metadataStr.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`));
            return m?.[1];
        };

        // Extract numeric properties
        const extractNumber = (key) => {
            const m = metadataStr.match(new RegExp(`${key}:\\s*(\\d+)`));
            return m ? parseInt(m[1], 10) : undefined;
        };

        // Extract string array properties
        const extractStringArray = (key) => {
            const m = metadataStr.match(new RegExp(`${key}:\\s*\\[([^\\]]*)]`));
            if (!m) return undefined;
            const items = m[1].match(/['"]([^'"]+)['"]/g);
            return items ? items.map(s => s.replace(/['"]/g, '')) : undefined;
        };

        const icon = extractString('icon');
        const name = extractString('name');
        const id = extractString('id');
        const description = extractString('description');
        const tags = extractStringArray('tags');

        // Extract defaultSize: { width: N, height: N }
        let defaultSize;
        const sizeMatch = metadataStr.match(/defaultSize\s*:\s*\{\s*width\s*:\s*(\d+)\s*,\s*height\s*:\s*(\d+)\s*\}/);
        if (sizeMatch) {
            defaultSize = { width: parseInt(sizeMatch[1], 10), height: parseInt(sizeMatch[2], 10) };
        }

        // Extract constraints: { minWidth?, minHeight?, maxWidth?, maxHeight? }
        let constraints;
        const constraintsMatch = metadataStr.match(/constraints\s*:\s*\{([^}]*)\}/);
        if (constraintsMatch) {
            const cStr = constraintsMatch[1];
            const minWidth = extractNumber('minWidth');
            const minHeight = extractNumber('minHeight');
            const maxWidth = extractNumber('maxWidth');
            const maxHeight = extractNumber('maxHeight');
            if (minWidth || minHeight || maxWidth || maxHeight) {
                constraints = {};
                if (minWidth) constraints.minWidth = minWidth;
                if (minHeight) constraints.minHeight = minHeight;
                if (maxWidth) constraints.maxWidth = maxWidth;
                if (maxHeight) constraints.maxHeight = maxHeight;
            }
        }

        // Extract order (for component sorting)
        const order = extractNumber('order');

        return { icon, name, id, description, tags, defaultSize, constraints, order };
    } catch (err) {
        console.warn(`  ⚠️  Failed to parse metadata.ts: ${err.message}`);
        return null;
    }
}

// ─── Main ──────────────────────────────────────────────────────────
function generateRegistryData() {
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
            const metadata = readMetadataTs(widgetDir) || {};
            const componentId = `${category.name}/${widget.name}`;

            // Core: use same sanitization as rspack build → guaranteed match
            const remoteName = sanitizeMfName(pkg.name);
            const devPort = extractDevPort(pkg.scripts);

            // Determine fields with priority
            // icon: metadata.ts > package.json thingsvis.icon
            const icon = metadata.icon || meta.icon;

            // name: metadata.ts (if not i18n key) > package.json thingsvis.displayName > widget name
            let displayName;
            if (metadata.name && !/^(widget|widgets)\./.test(metadata.name)) {
                displayName = metadata.name;
            } else if (meta.displayName) {
                displayName = meta.displayName;
            } else {
                displayName = widget.name;
            }

            components[componentId] = {
                remoteName,
                remoteEntryUrl: devPort
                    ? `http://localhost:${devPort}/remoteEntry.js`
                    : ``,
                staticEntryUrl: `/widgets/${componentId}/dist/remoteEntry.js`,
                debugSource: 'static',
                exposedModule: './Main',
                version: pkg.version || '0.0.1',
                ...(icon && { icon }),
                name: displayName,
                ...(meta.i18n && { i18n: meta.i18n }),
                // Enhanced metadata (Phase 0)
                category: category.name,
                ...(meta.description || metadata.description ? { description: metadata.description || meta.description } : {}),
                ...(meta.author || pkg.author ? { author: meta.author || pkg.author } : {}),
                ...(metadata.tags || meta.tags ? { tags: metadata.tags || meta.tags } : {}),
                ...(meta.thumbnailUrl ? { thumbnailUrl: meta.thumbnailUrl } : {}),
                ...(metadata.defaultSize || meta.defaultSize ? { defaultSize: metadata.defaultSize || meta.defaultSize } : {}),
                ...(metadata.constraints || meta.constraints ? { constraints: metadata.constraints || meta.constraints } : {}),
                ...(metadata.order !== undefined ? { order: metadata.order } : {}),
            };

            console.log(`  ✅ ${componentId} → ${remoteName} (port: ${devPort || 'default'})`);
        }
    }

    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        components,
    };
}

function writeRegistryFile(output = OUTPUT) {
    const registry = generateRegistryData();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(registry, null, 2) + '\n', 'utf8');
    const count = Object.keys(registry.components).length;
    console.log(`\n✅ Generated registry.json with ${count} widgets → ${path.relative(ROOT, output)}`);
    return registry;
}

module.exports = {
    ROOT,
    WIDGETS_DIR,
    OUTPUT,
    generateRegistryData,
    writeRegistryFile,
};

if (require.main === module) {
    writeRegistryFile();
}
