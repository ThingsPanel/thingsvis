const fs = require('fs');
const path = require('path');

const widgets = [
  { id: 'border-corner', name: '四角光标边框', enName: 'Corner Border', port: 3401, icon: 'Maximize2', renderFn: 'renderBorderCorner' },
  { id: 'border-scanline', name: '流光边框', enName: 'Scanline Border', port: 3402, icon: 'ScanLine', renderFn: 'renderBorderScanline' },
  { id: 'border-double', name: '双线边框', enName: 'Double Border', port: 3403, icon: 'Square', renderFn: 'renderBorderDouble' },
  { id: 'border-glow-pulse', name: '呼吸边框', enName: 'Glow Pulse Border', port: 3404, icon: 'Scan', renderFn: 'renderBorderGlowPulse' },
  { id: 'deco-particles', name: '粒子装饰', enName: 'Particle Decoration', port: 3405, icon: 'LayoutGrid', renderFn: 'renderDecoParticles' },
  { id: 'deco-scanbeam', name: '光束扫描装饰', enName: 'Scanbeam Decoration', port: 3406, icon: 'MoveRight', renderFn: 'renderDecoScanbeam' },
  { id: 'deco-title-bar', name: '标题专属装饰', enName: 'Title Bar Decoration', port: 3407, icon: 'Heading1', renderFn: 'renderDecoTitleBar' },
  { id: 'deco-divider', name: '霓虹分割线', enName: 'Neon Divider', port: 3408, icon: 'Minus', renderFn: 'renderDecoDivider' },
];

const basePath = path.join(__dirname, 'packages/widgets/decoration');

const schemaContent = `import { z } from 'zod';

export const PropsSchema = z.object({
  color: z.string().default('#00E5FF').describe('props.color'),
  secondaryColor: z.string().default('#0055AA').describe('props.secondaryColor'),
  animated: z.boolean().default(true).describe('props.animated'),
  animationSpeed: z.number().min(0.5).max(10).default(3).describe('props.animationSpeed'),
  opacity: z.number().min(0.1).max(1).default(1).describe('props.opacity'),
});

export type Props = z.infer<typeof PropsSchema>;
export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
`;

const controlsContent = `import { createControlPanel } from '@thingsvis/widget-sdk';
const W = 'widgets.thingsvis-widget-decoration-[WIDGET_ID]';

export const controls = createControlPanel()
  .addGroup('Style', (b) => {
    b.addColorPicker('color', { label: \`\${W}.color\`, binding: true });
    b.addColorPicker('secondaryColor', { label: \`\${W}.secondaryColor\`, binding: true });
    b.addSlider('opacity', { label: \`\${W}.opacity\`, min: 0.1, max: 1, step: 0.1, default: 1 });
  }, { label: \`\${W}.groupStyle\` })
  .addGroup('Animation', (b) => {
    b.addSwitch('animated', { label: \`\${W}.animated\` });
    b.addSlider('animationSpeed', { label: \`\${W}.animationSpeed\`, min: 0.5, max: 10, step: 0.5, default: 3 });
  }, { label: \`\${W}.groupAnimation\` })
  .build();
`;

widgets.forEach(w => {
  const dir = path.join(basePath, w.id);
  const srcDir = path.join(dir, 'src');
  const localesDir = path.join(srcDir, 'locales');
  
  fs.mkdirSync(localesDir, { recursive: true });

  // package.json (Overwrite if exists)
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: `thingsvis-widget-decoration-${w.id}`,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: `rspack serve --port ${w.port}`,
      build: "rspack build",
      typecheck: "tsc -p tsconfig.json --noEmit"
    },
    dependencies: {
      "@thingsvis/widget-sdk": "workspace:*",
      "@thingsvis/schema": "workspace:*",
      "zod": "^3.22.4"
    },
    peerDependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "leafer-ui": "^1.0.0"
    },
    devDependencies: {
      "@rspack/cli": "^1.0.0",
      "@rspack/core": "^1.0.0",
      "typescript": "^5.3.3",
      "ts-loader": "^9.5.1",
      "@types/react": "^18.2.41",
      "@types/react-dom": "^18.2.17",
      "@thingsvis/widget-config": "workspace:*"
    },
    thingsvis: {
      displayName: w.enName,
      icon: w.icon,
      i18n: { zh: w.name, en: w.enName }
    }
  }, null, 2));

  // rspack.config.js
  fs.writeFileSync(path.join(dir, 'rspack.config.js'), `const { createWidgetConfig } = require('@thingsvis/widget-config');
module.exports = createWidgetConfig(__dirname, { port: ${w.port}, exposes: { './Main': './src/index.ts' } });
`);

  // tsconfig.json
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), `{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src/**/*"]
}`);

  // src/metadata.ts
  fs.writeFileSync(path.join(srcDir, 'metadata.ts'), `export const metadata = {
  id: 'decoration-${w.id}',
  name: '${w.name}',
  category: 'decoration',
  icon: '${w.icon}',
  version: '1.0.0',
  order: 1,
  resizable: true,
  defaultSize: { width: 300, height: 200 },
  constraints: { minWidth: 20, minHeight: 20 },
} as const;
`);

  // src/schema.ts
  fs.writeFileSync(path.join(srcDir, 'schema.ts'), schemaContent);

  // src/controls.ts
  fs.writeFileSync(path.join(srcDir, 'controls.ts'), controlsContent.replace(/\[WIDGET_ID\]/g, w.id));

  // src/locales/zh.json & en.json
  const zhKey = `thingsvis-widget-decoration-${w.id}`;
  fs.writeFileSync(path.join(localesDir, 'zh.json'), JSON.stringify({
    widgets: { [zhKey]: {
      groupStyle: "样式", color: "主发光色", secondaryColor: "辅助色", opacity: "不透明度",
      groupAnimation: "动画", animated: "启用动画", animationSpeed: "动画速度(s)"
    }}
  }, null, 2));
  
  fs.writeFileSync(path.join(localesDir, 'en.json'), JSON.stringify({
    widgets: { [zhKey]: {
      groupStyle: "Style", color: "Glow Color", secondaryColor: "Secondary Color", opacity: "Opacity",
      groupAnimation: "Animation", animated: "Enable Animation", animationSpeed: "Speed (s)"
    }}
  }, null, 2));

  // src/index.ts (Placeholder, will be implemented specifically)
  fs.writeFileSync(path.join(srcDir, 'index.ts'), `import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import { defineWidget, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import zh from './locales/zh.json';
import en from './locales/en.json';

function generateId() { return Math.random().toString(36).slice(2, 9); }

function ${w.renderFn}(props: Props, uuid: string): string {
  return \`
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position: absolute; top: 0; left: 0; pointer-events: none;">
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="\${props.color}" stroke-width="2" />
      <text x="50" y="50" font-size="10" fill="\${props.color}" text-anchor="middle" dominant-baseline="middle">${w.name}</text>
    </svg>
  \`;
}

export const Main = defineWidget({
  ...metadata,
  locales: { zh, en },
  schema: PropsSchema,
  controls,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    element.style.width = '100%';
    element.style.height = '100%';
    element.dataset.thingsvisOverlay = metadata.id;
    
    // Create container
    let container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.position = 'relative';
    container.style.boxSizing = 'border-box';
    element.appendChild(container);
    
    const uuid = generateId();
    container.innerHTML = ${w.renderFn}(props, uuid);
    container.style.opacity = props.opacity.toString();
    
    return {
      update: (nextProps: Props) => {
        container.innerHTML = ${w.renderFn}(nextProps, uuid);
        container.style.opacity = nextProps.opacity.toString();
      },
      destroy: () => { element.innerHTML = ''; },
    };
  },
});

export default Main;
`);
});

console.log('Successfully bootstrapped 8 widgets!');
