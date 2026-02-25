/**
 * i18n Migration Script
 * 
 * Migrates all files from hardcoded Chinese/English patterns to useTranslation.
 * Run with: node scripts/migrate-i18n.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative, basename } from 'path';

const SRC = 'apps/studio/src';

// ============================================================
// Step 1: Collect all files that need migration
// ============================================================
function walkDir(dir, ext = ['.tsx', '.ts']) {
    const results = [];
    for (const f of readdirSync(dir)) {
        const full = join(dir, f);
        if (statSync(full).isDirectory()) {
            if (!f.includes('locales') && !f.includes('node_modules')) {
                results.push(...walkDir(full, ext));
            }
        } else if (ext.some(e => f.endsWith(e))) {
            results.push(full);
        }
    }
    return results;
}

// ============================================================
// Step 2: Pattern-based replacements
// ============================================================

/**
 * Pattern A: Replace `language === 'zh' ? '中文' : 'English'` 
 * and `language === "zh" ? "中文" : "English"` with t('key')
 */
function replaceLanguageTernaries(content, keyMap) {
    // Pattern: language === 'zh' ? '...' : '...'
    // Also handles: language === "zh" ? "..." : "..."
    const ternaryRegex = /language\s*===\s*['"]zh['"]\s*\?\s*(['"`])([^'"`]+)\1\s*:\s*(['"`])([^'"`]+)\3/g;

    return content.replace(ternaryRegex, (match, _q1, zh, _q2, en) => {
        const key = findOrCreateKey(keyMap, zh, en);
        return `t('${key}')`;
    });
}

/**
 * Pattern B: Replace local helper functions
 * const t/label = (zh, en) => language === 'zh' ? zh : en
 */
function replaceLocalHelpers(content) {
    // Remove: const t = (zh: string, en: string) => (language === 'zh' ? zh : en);
    content = content.replace(
        /\s*const\s+(?:t|label|labelZh)\s*=\s*\(zh:\s*string,\s*en:\s*string\)\s*=>\s*\(?\s*language\s*===\s*['"]zh['"]\s*\?\s*zh\s*:\s*en\s*\)?;?\s*\n/g,
        '\n'
    );
    // Remove: const label = (zh: string, en: string) => language === 'zh' ? zh : en;
    content = content.replace(
        /\s*const\s+(?:label)\s*=\s*\(zh:\s*string,\s*en:\s*string\)\s*=>\s*language\s*===\s*['"]zh['"]\s*\?\s*zh\s*:\s*en;?\s*\n/g,
        '\n'
    );
    return content;
}

/**
 * Find or create an i18n key for a zh/en string pair
 */
const keyCounter = {};
function findOrCreateKey(keyMap, zh, en) {
    // Check if this zh/en pair already exists
    for (const [key, val] of Object.entries(keyMap.zh)) {
        if (typeof val === 'string' && val === zh) return key;
    }

    // Generate a key from the English text
    let key = en
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30)
        .replace(/_+$/, '');

    if (!key) key = 'label';

    // Deduplicate
    if (keyMap.zh[key] !== undefined) {
        if (keyMap.zh[key] === zh) return key;
        const base = key;
        let i = 2;
        while (keyMap.zh[`${base}_${i}`] !== undefined) i++;
        key = `${base}_${i}`;
    }

    keyMap.zh[key] = zh;
    keyMap.en[key] = en;
    return key;
}

// ============================================================
// Step 3: Run migration dry-run (analysis only)
// ============================================================
const files = walkDir(SRC);
const stats = { files: 0, lines: 0 };

for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const rel = relative('.', file);

    // Count Chinese characters in non-comment, non-import lines
    const lines = content.split('\n');
    let chineseLines = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/**') ||
            trimmed.startsWith('import') || trimmed.includes('console.')) continue;
        if (/[\u4e00-\u9fff]/.test(trimmed)) chineseLines++;
    }

    if (chineseLines > 0) {
        stats.files++;
        stats.lines += chineseLines;
        console.log(`${String(chineseLines).padStart(4)} | ${rel}`);
    }
}

console.log(`\nTotal: ${stats.files} files, ${stats.lines} lines with Chinese`);
console.log('\n--- Analysis complete. To perform migration, uncomment the migration section below. ---');
