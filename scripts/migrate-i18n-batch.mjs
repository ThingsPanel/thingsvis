/**
 * i18n Batch Migration Script
 * 
 * Handles two mechanical patterns:
 * 1. Files with `const t/label = (zh, en) => language === 'zh' ? zh : en`
 *    → Remove the helper, add useTranslation, replace t('中文', 'English') with t('key')
 * 2. Files with `language === 'zh' ? '中文' : 'English'` ternaries
 *    → Add useTranslation, replace ternaries with t('key')
 * 
 * Also removes `language` from Props interfaces and function params.
 * 
 * Usage: node scripts/migrate-i18n-batch.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

// ============================================================
// Files to migrate with their patterns
// ============================================================

const SRC = 'apps/studio/src';

const files = [
    // DataSourceConfig files — Pattern B (local helper)
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
    // RightPanel files
    `${SRC}/components/RightPanel/PropsPanel.tsx`,
    `${SRC}/components/RightPanel/CanvasSettingsPanel.tsx`,
    `${SRC}/components/RightPanel/ControlFieldRow.tsx`,
    `${SRC}/components/RightPanel/DataSourceSelector.tsx`,
    `${SRC}/components/RightPanel/FieldPicker.tsx`,
    `${SRC}/components/RightPanel/ImageSourceInput.tsx`,
    `${SRC}/components/RightPanel/PlatformFieldPicker.tsx`,
    `${SRC}/components/RightPanel/bindingStorage.ts`,
    // LeftPanel files
    `${SRC}/components/LeftPanel/ComponentsList.tsx`,
    `${SRC}/components/LeftPanel/LayerPanel.tsx`,
    // Other components
    `${SRC}/components/ProjectDialog.tsx`,
    `${SRC}/components/ProjectSwitcher.tsx`,
    `${SRC}/components/Modals/DataSourceDialog.tsx`,
    `${SRC}/components/tools/ConnectionTool.tsx`,
    `${SRC}/components/tools/LineConnectionTool.tsx`,
    `${SRC}/components/tools/types.ts`,
    `${SRC}/components/ShortcutHelpPanel.tsx`,
    `${SRC}/components/RecentProjectsList.tsx`,
    `${SRC}/components/ImageUploader.tsx`,
    `${SRC}/components/ui/AuthSelector.tsx`,
    `${SRC}/components/ui/KeyValueEditor.tsx`,
    `${SRC}/components/ProtectedRoute.tsx`,
    `${SRC}/components/EditorTopNav.tsx`,
    // Pages
    `${SRC}/pages/PreviewPage.tsx`,
    `${SRC}/pages/EmbedPage.tsx`,
    // Other
    `${SRC}/lib/commands/defaultCommands.ts`,
    `${SRC}/lib/commands/constants.ts`,
    `${SRC}/lib/imageUpload.ts`,
    `${SRC}/strategies/AppModeStrategy.ts`,
    `${SRC}/strategies/WidgetModeStrategy.ts`,
    `${SRC}/contexts/ProjectContext.tsx`,
    `${SRC}/components/Editor.tsx`,
];

let totalChanges = 0;

for (const file of files) {
    try {
        let content = readFileSync(file, 'utf8');
        const original = content;
        const name = basename(file);
        let changes = [];

        // 1. Remove `language` from Props interface properties
        // Match: language: Language, language?: Language, language: 'zh' | 'en', language?: 'zh' | 'en'
        const langPropPatterns = [
            /\s+language\??\s*:\s*Language\s*;?\s*\n/g,
            /\s+language\??\s*:\s*'zh'\s*\|\s*'en'\s*;?\s*\n/g,
        ];
        for (const pattern of langPropPatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, '\n');
                changes.push('removed language from props interface');
            }
        }

        // 2. Remove language from destructured function params
        // Match: language, in function params (carefully)
        const destructPatterns = [
            /(\{[^}]*),\s*language\s*,\s*([^}]*\})/g,   // middle
            /(\{)\s*language\s*,\s*([^}]*\})/g,            // first
            /(\{[^}]*),\s*language\s*(\})/g,                // last
        ];
        for (const pattern of destructPatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, '$1$2');
                changes.push('removed language from destructured params');
            }
        }

        // 3. Remove `const label/t/labelZh = (zh: string, en: string) => ...` helper
        const helperPatterns = [
            /\s*const\s+(?:t|label|labelZh)\s*=\s*\(zh:\s*string,\s*en:\s*string\)\s*(?::\s*string\s*)?=>\s*(?:\(?\s*)?language\s*===\s*['"]zh['"]\s*\?\s*zh\s*:\s*en\s*\)?\s*;?\s*\n/g,
            /\s*const\s+(?:label)\s*=\s*\(zh:\s*string,\s*en:\s*string\)\s*=>\s*\(?\s*language\s*===\s*['"]zh['"]\s*\?\s*zh\s*:\s*en\s*\)?\s*;?\s*\n/g,
        ];
        for (const pattern of helperPatterns) {
            if (pattern.test(content)) {
                content = content.replace(pattern, '\n');
                changes.push('removed local label/t helper');
            }
        }

        // 4. Remove Language type alias if present
        content = content.replace(/\s*type\s+Language\s*=\s*['"]zh['"]\s*\|\s*['"]en['"]\s*;?\s*\n/g, '\n');

        // 5. Remove language prop from function parameters like: language: Language,
        // or language = 'zh' as Language
        // These are trickier and file-specific

        // 6. Count remaining Chinese characters (non-comment, non-import)
        const chineseLines = content.split('\n').filter(line => {
            const t = line.trim();
            if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/**') || t.startsWith('import') || t.includes('console.')) return false;
            return /[\u4e00-\u9fff]/.test(t);
        });

        if (content !== original) {
            writeFileSync(file, content, 'utf8');
            totalChanges++;
            console.log(`✅ ${name}: ${changes.join(', ')} (${chineseLines.length} Chinese lines remain)`);
        } else if (chineseLines.length > 0) {
            console.log(`⚠️  ${name}: no mechanical changes, ${chineseLines.length} Chinese lines remain`);
        }
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.error(`❌ ${file}: ${e.message}`);
        }
    }
}

console.log(`\nTotal files modified: ${totalChanges}`);
