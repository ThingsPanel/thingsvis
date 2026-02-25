/**
 * i18n Auto-Migration Script v2
 * 
 * Handles ALL patterns:
 * 1. label('中文', 'English') / t('中文', 'English') → t('generated.key')
 * 2. language === 'zh' ? '中文' : 'English' → t('generated.key')
 * 3. Adds `import { useTranslation } from 'react-i18next'` if not present
 * 4. Adds `const { t } = useTranslation('editor')` if not present
 * 5. Generates zh/en locale keys automatically
 * 
 * Usage: node scripts/migrate-i18n-v2.mjs [--dry-run]
 */
import { readFileSync, writeFileSync } from 'fs';
import { basename, relative } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const SRC = 'apps/studio/src';

// Accumulated locale keys
const zhKeys = {};
const enKeys = {};
let keyCounter = 0;

// Map file to namespace prefix
function getPrefix(file) {
    const rel = relative(SRC, file);
    if (rel.includes('DataSourceConfig')) return 'dsConfig';
    if (rel.includes('RightPanel')) return 'rightPanel';
    if (rel.includes('LeftPanel')) return 'leftPanel';
    if (rel.includes('Modals')) return 'modals';
    if (rel.includes('tools')) return 'tools';
    if (rel.includes('commands')) return 'commands';
    if (rel.includes('strategies')) return 'strategies';
    if (rel.includes('contexts')) return 'contexts';
    if (rel.includes('pages')) return 'pages';
    const name = basename(file, '.tsx').replace('.ts', '');
    return name.charAt(0).toLowerCase() + name.slice(1);
}

// Generate a camelCase key from English text
function generateKey(en) {
    let key = en
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('')
        .substring(0, 35);
    if (!key) key = `label${++keyCounter}`;
    return key;
}

// Deduplicate key within a prefix
function resolveKey(prefix, zh, en) {
    const fullPrefix = prefix;
    if (!zhKeys[fullPrefix]) { zhKeys[fullPrefix] = {}; enKeys[fullPrefix] = {}; }

    // Check if this zh string already exists
    for (const [k, v] of Object.entries(zhKeys[fullPrefix])) {
        if (v === zh) return `auto.${fullPrefix}.${k}`;
    }

    let key = generateKey(en);
    if (zhKeys[fullPrefix][key]) {
        let i = 2;
        while (zhKeys[fullPrefix][`${key}${i}`]) i++;
        key = `${key}${i}`;
    }

    zhKeys[fullPrefix][key] = zh;
    enKeys[fullPrefix][key] = en;
    return `auto.${fullPrefix}.${key}`;
}

// Files to process  
const files = [
    // DataSourceConfig
    `${SRC}/widgets/DataSourceConfig/RESTForm.tsx`,
    `${SRC}/widgets/DataSourceConfig/WSForm.tsx`,
    `${SRC}/widgets/DataSourceConfig/TransformationEditor.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/AuthSection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/BodySection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/HeadersSection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/HeartbeatSection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/InitMessagesSection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/ProtocolsSection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/ReconnectSection.tsx`,
    `${SRC}/widgets/DataSourceConfig/sections/TimeoutSection.tsx`,
    // RightPanel
    `${SRC}/components/RightPanel/PropsPanel.tsx`,
    `${SRC}/components/RightPanel/CanvasSettingsPanel.tsx`,
    `${SRC}/components/RightPanel/ControlFieldRow.tsx`,
    `${SRC}/components/RightPanel/DataSourceSelector.tsx`,
    `${SRC}/components/RightPanel/FieldPicker.tsx`,
    `${SRC}/components/RightPanel/ImageSourceInput.tsx`,
    `${SRC}/components/RightPanel/PlatformFieldPicker.tsx`,
    // LeftPanel
    `${SRC}/components/LeftPanel/ComponentsList.tsx`,
    `${SRC}/components/LeftPanel/LayerPanel.tsx`,
    // Other componentsconst
    `${SRC}/components/ProjectDialog.tsx`,
    `${SRC}/components/ProjectSwitcher.tsx`,
    `${SRC}/components/Modals/DataSourceDialog.tsx`,
    `${SRC}/components/tools/ConnectionTool.tsx`,
    `${SRC}/components/tools/LineConnectionTool.tsx`,
    `${SRC}/components/ImageUploader.tsx`,
    `${SRC}/components/ui/AuthSelector.tsx`,
    `${SRC}/components/ui/KeyValueEditor.tsx`,
    // Pages
    `${SRC}/pages/EmbedPage.tsx`,
    `${SRC}/pages/PreviewPage.tsx`,
    // Non-component files (skip useTranslation for these)
    `${SRC}/lib/commands/defaultCommands.ts`,
    `${SRC}/lib/commands/constants.ts`,
    `${SRC}/lib/imageUpload.ts`,
    `${SRC}/contexts/ProjectContext.tsx`,
];

let totalModified = 0;

for (const file of files) {
    try {
        let content = readFileSync(file, 'utf8');
        const original = content;
        const prefix = getPrefix(file);
        let changes = [];

        // Pattern 1: label('中文', 'English') or t('中文', 'English')
        // Match: label('...', '...') where first arg contains Chinese
        const labelCallRegex = /(?:label|t|labelZh)\(\s*'([^']*[\u4e00-\u9fff][^']*)'\s*,\s*'([^']*)'\s*\)/g;
        content = content.replace(labelCallRegex, (match, zh, en) => {
            const key = resolveKey(prefix, zh, en);
            changes.push(`label→t: ${zh.substring(0, 15)}`);
            return `t('${key}')`;
        });

        // Also handle double-quoted variants 
        const labelCallRegex2 = /(?:label|t|labelZh)\(\s*"([^"]*[\u4e00-\u9fff][^"]*)"\s*,\s*"([^"]*)"\s*\)/g;
        content = content.replace(labelCallRegex2, (match, zh, en) => {
            const key = resolveKey(prefix, zh, en);
            changes.push(`label→t: ${zh.substring(0, 15)}`);
            return `t('${key}')`;
        });

        // Pattern 2: language === 'zh' ? '中文' : 'English'
        const ternaryRegex = /language\s*===\s*['"]zh['"]\s*\?\s*(['"`])([^'"`]*[\u4e00-\u9fff][^'"`]*)\1\s*:\s*(['"`])([^'"`]*)\3/g;
        content = content.replace(ternaryRegex, (match, _q1, zh, _q2, en) => {
            const key = resolveKey(prefix, zh, en);
            changes.push(`ternary→t: ${zh.substring(0, 15)}`);
            return `t('${key}')`;
        });

        // Also handle reverse: language !== 'zh' ? 'English' : '中文'
        const reverseTernaryRegex = /language\s*!==\s*['"]zh['"]\s*\?\s*(['"`])([^'"`]*)\1\s*:\s*(['"`])([^'"`]*[\u4e00-\u9fff][^'"`]*)\3/g;
        content = content.replace(reverseTernaryRegex, (match, _q1, en, _q2, zh) => {
            const key = resolveKey(prefix, zh, en);
            changes.push(`reverse-ternary→t: ${zh.substring(0, 15)}`);
            return `t('${key}')`;
        });

        // Pattern 3: i18n.language === 'zh' ? '中文' : 'English'
        const i18nTernaryRegex = /i18n\.language\s*===\s*['"]zh['"]\s*\?\s*(['"`])([^'"`]*[\u4e00-\u9fff][^'"`]*)\1\s*:\s*(['"`])([^'"`]*)\3/g;
        content = content.replace(i18nTernaryRegex, (match, _q1, zh, _q2, en) => {
            const key = resolveKey(prefix, zh, en);
            changes.push(`i18n-ternary→t: ${zh.substring(0, 15)}`);
            return `t('${key}')`;
        });

        if (content !== original) {
            // Check if useTranslation import exists
            const isTsx = file.endsWith('.tsx');
            const needsI18n = !content.includes("useTranslation") && isTsx;

            if (needsI18n) {
                // Add import after last import statement
                const importInsertPos = content.lastIndexOf('\nimport ');
                if (importInsertPos > -1) {
                    const lineEnd = content.indexOf('\n', importInsertPos + 1);
                    content = content.slice(0, lineEnd + 1) +
                        "import { useTranslation } from 'react-i18next'\n" +
                        content.slice(lineEnd + 1);
                }

                // Add const { t } = useTranslation after first { in function body
                // Find the function component — look for "export" followed by "function" or "const"
                const funcMatch = content.match(/(?:export\s+(?:default\s+)?function\s+\w+|export\s+(?:default\s+)?(?:const|function)\s+\w+)\s*[({]/);
                if (funcMatch) {
                    const funcStart = funcMatch.index + funcMatch[0].length;
                    // Find the next line break
                    const nextLine = content.indexOf('\n', funcStart);
                    if (nextLine > -1 && !content.slice(funcStart, funcStart + 200).includes("useTranslation")) {
                        content = content.slice(0, nextLine + 1) +
                            "  const { t } = useTranslation('editor')\n" +
                            content.slice(nextLine + 1);
                    }
                }
                changes.push('added useTranslation');
            }

            if (!DRY_RUN) {
                writeFileSync(file, content, 'utf8');
            }
            totalModified++;
            console.log(`✅ ${basename(file)}: ${changes.length} changes — ${changes.slice(0, 5).join(', ')}${changes.length > 5 ? ` +${changes.length - 5} more` : ''}`);
        } else {
            console.log(`⏭  ${basename(file)}: no pattern matches`);
        }
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.error(`❌ ${file}: ${e.message}`);
        }
    }
}

// Output generated locale keys
console.log('\n=== Generated Locale Keys ===');
console.log('--- ZH ---');
console.log(JSON.stringify({ auto: zhKeys }, null, 2).substring(0, 2000));
console.log('\n--- EN ---');
console.log(JSON.stringify({ auto: enKeys }, null, 2).substring(0, 2000));
console.log(`\nTotal files modified: ${totalModified}`);
console.log(`Total keys generated: ${Object.values(zhKeys).reduce((acc, obj) => acc + Object.keys(obj).length, 0)}`);

// Write locale files
if (!DRY_RUN) {
    const zhPath = `${SRC}/i18n/locales/zh/auto.json`;
    const enPath = `${SRC}/i18n/locales/en/auto.json`;
    writeFileSync(zhPath, JSON.stringify(zhKeys, null, 4), 'utf8');
    writeFileSync(enPath, JSON.stringify(enKeys, null, 4), 'utf8');
    console.log(`\nWrote ${zhPath} and ${enPath}`);
}
