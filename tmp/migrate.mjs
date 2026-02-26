import fs from 'fs';
import path from 'path';

const widgetsDir = 'f:/coding/thingsvis/widgets';
const categories = fs.readdirSync(widgetsDir);

for (const cat of categories) {
    if (Object.is(cat, '.DS_Store') || !fs.statSync(path.join(widgetsDir, cat)).isDirectory()) continue;
    const comps = fs.readdirSync(path.join(widgetsDir, cat));

    for (const comp of comps) {
        if (Object.is(comp, '.DS_Store') || !fs.statSync(path.join(widgetsDir, cat, comp)).isDirectory()) continue;

        const srcDir = path.join(widgetsDir, cat, comp, 'src');
        if (!fs.existsSync(srcDir)) continue;

        const controlsPath = path.join(srcDir, 'controls.ts');
        const indexPath = path.join(srcDir, 'index.ts');

        if (!fs.existsSync(controlsPath) || !fs.existsSync(indexPath)) continue;

        const packageName = `thingsvis-widget-${cat}-${comp}`;

        let controlsContent = fs.readFileSync(controlsPath, 'utf8');
        let indexContent = fs.readFileSync(indexPath, 'utf8');

        // skip if already migrated
        if (indexContent.includes('locales')) {
            continue;
        }

        const zhLocales = {};
        const enLocales = {};

        // Match label: '中文' or label: "中文" or { label: '中文' }
        // Simple generic replacement
        let keyCounter = 1;
        controlsContent = controlsContent.replace(/label:\s*(['"])(.*?)\1/g, (match, q, content) => {
            if (content.startsWith('widgets.')) {
                return match; // already i18n
            }
            const key = `label_${keyCounter++}`;
            const fullKey = `widgets.${packageName}.${key}`;
            zhLocales[key] = content;
            enLocales[key] = '[en] ' + content; // MVP english translation
            return `label: ${q}${fullKey}${q}`;
        });

        // Generate JSON files
        const localesDir = path.join(srcDir, 'locales');
        if (!fs.existsSync(localesDir)) {
            fs.mkdirSync(localesDir);
        }

        const zhFile = { editor: { [`widgets.${packageName}`]: zhLocales } };
        const enFile = { editor: { [`widgets.${packageName}`]: enLocales } };

        fs.writeFileSync(path.join(localesDir, 'zh.json'), JSON.stringify(zhFile, null, 2), 'utf8');
        fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify(enFile, null, 2), 'utf8');

        // Write controls
        fs.writeFileSync(controlsPath, controlsContent, 'utf8');

        // Edit index.ts to import and export locales
        const importLocales = `\nimport zh from './locales/zh.json';\nimport en from './locales/en.json';\n`;
        // insert imports after the last import
        const lastImportIdx = indexContent.lastIndexOf('import ');
        if (lastImportIdx !== -1) {
            const endOfLastImport = indexContent.indexOf(';', lastImportIdx);
            indexContent = indexContent.slice(0, endOfLastImport + 1) + importLocales + indexContent.slice(endOfLastImport + 1);
        } else {
            indexContent = importLocales + indexContent;
        }

        // Add locales to WidgetMainModule
        // Match 'export const Main: WidgetMainModule = {'
        const moduleRegex = /export\s+const\s+Main(?:\s*:\s*WidgetMainModule)?\s*=\s*{/;
        indexContent = indexContent.replace(moduleRegex, (match) => {
            return match + '\n  locales: { zh, en },';
        });

        fs.writeFileSync(indexPath, indexContent, 'utf8');
        console.log(`Migrated widget: ${packageName}`);
    }
}
