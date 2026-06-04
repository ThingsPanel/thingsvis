import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const widgetDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkgRoot = path.dirname(require.resolve('ezuikit-js/package.json'));
const source = path.join(pkgRoot, 'ezuikit_static');
const target = path.join(widgetDir, 'dist', 'ezuikit_static');

if (!fs.existsSync(source)) {
  console.warn('[ezuikit-player] ezuikit_static not found, skip copy');
  process.exit(0);
}

fs.cpSync(source, target, { recursive: true });
console.log(`[ezuikit-player] copied ezuikit_static → ${path.relative(widgetDir, target)}`);
