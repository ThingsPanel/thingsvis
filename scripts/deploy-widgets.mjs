import fs from 'node:fs';
import path from 'node:path';

// SYNC: must match @thingsvis/schema WIDGET_CATEGORIES (packages/thingsvis-schema/src/widget-category.ts)
const categories = ['basic', 'chart', 'interaction', 'media', 'resources', 'data', 'layout', 'indicator', 'geo', 'custom', 'decoration', 'industrial'];

function copyDirectoryRecursive(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  fs.readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    try {
      if (entry.isDirectory()) {
        copyDirectoryRecursive(sourcePath, targetPath);
        return;
      }

      if (entry.isFile()) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    } catch (e) {
      console.error(`Failed to copy ${sourcePath}:`, e);
    }
  });
}

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

    copyDirectoryRecursive(sourceDir, targetDir);
    console.log(`✓ Deployed widget: ${cat}/${widget}`);
  });
});
