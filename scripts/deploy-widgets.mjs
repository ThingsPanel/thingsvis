import fs from 'node:fs';
import path from 'node:path';

// SYNC: must match @thingsvis/schema WIDGET_CATEGORIES (packages/thingsvis-schema/src/widget-category.ts)
const categories = ['basic', 'chart', 'interaction', 'media', 'resources', 'data', 'layout', 'indicator', 'geo', 'custom'];

categories.forEach((cat) => {
    const directory = `packages/widgets/${cat}`;
    if (!fs.existsSync(directory)) return;

    fs.readdirSync(directory).forEach((widget) => {
        const sourceDir = `packages/widgets/${cat}/${widget}/dist`;
        const targetDir = `apps/studio/public/widgets/${cat}/${widget}/dist`;

        if (!fs.existsSync(sourceDir)) return;

        if (fs.existsSync(targetDir) && !fs.statSync(targetDir).isDirectory()) {
            fs.unlinkSync(targetDir);
        }

        fs.mkdirSync(targetDir, { recursive: true });

        fs.readdirSync(sourceDir).forEach((file) => {
            const sourceFile = path.join(sourceDir, file);
            const targetFile = path.join(targetDir, file);

            try {
                if (fs.statSync(sourceFile).isFile()) {
                    fs.copyFileSync(sourceFile, targetFile);
                }
            } catch (e) {
                console.error(`Failed to copy ${sourceFile}:`, e);
            }
        });
        console.log(`✓ Deployed widget: ${cat}/${widget}`);
    });
});
