import fs from 'fs-extra';
import path from 'node:path';

export type TemplateVars = Record<string, string | number>;

function render(content: string, vars: TemplateVars): string {
  let out = content;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, String(v));
  }
  return out;
}

export async function copyTemplateDir(templateDir: string, targetDir: string, vars: TemplateVars): Promise<void> {
  const files = await fs.readdir(templateDir);
  await fs.ensureDir(targetDir);

  for (const name of files) {
    const src = path.join(templateDir, name);
    const dst = path.join(targetDir, name);
    const stat = await fs.stat(src);
    if (stat.isDirectory()) {
      await copyTemplateDir(src, dst, vars);
      continue;
    }

    const buf = await fs.readFile(src);
    const text = buf.toString('utf-8');
    const rendered = render(text, vars);
    await fs.ensureDir(path.dirname(dst));
    await fs.writeFile(dst, rendered, 'utf-8');
  }
}


