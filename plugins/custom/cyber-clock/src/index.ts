import type { PluginMainModule } from '@thingsvis/schema';
import { Group, Rect, Text } from 'leafer-ui';
import { Spec } from './spec';

export const componentId = 'custom/cyber-clock';

/**
 * AI-generated style example: a neon/cyber digital clock.
 * Returns a Leafer Group containing a background panel and a text node.
 */
export function create() {
  const root = new Group();
  const panel = new Rect({
    x: 0,
    y: 0,
    width: 220,
    height: 90,
    fill: '#0b1020',
    cornerRadius: 12,
    stroke: '#00e5ff',
    strokeWidth: 2,
    shadow: {
      color: '#00e5ff',
      blur: 12,
      x: 0,
      y: 0
    } as any
  });

  const label = new Text({
    x: 18,
    y: 22,
    text: '--:--:--',
    fontSize: 32,
    fontWeight: 700,
    fill: '#00e5ff'
  });

  const updateTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    label.text = `${h}:${m}:${s}`;
  };

  updateTime();
  const timer = setInterval(updateTime, 1000);

  (root as any).add(panel);
  (root as any).add(label);

  // Clean up timer when the node is destroyed/removed
  root.on('remove', () => {
    clearInterval(timer);
  });

  // Store the text node so the host can update via .set({ ...props }) if desired.
  (root as any).__clockText = label;

  return root as any;
}

export const Main: PluginMainModule = {
  componentId,
  create,
  Spec,
  // AI 示例插件的 Schema，用于验证 CLI 生成的结构是否能被 Host 正确消费
  schema: {
    props: {
      fontSize: {
        type: 'number',
        default: 32,
        description: '时间文本字号'
      },
      color: {
        type: 'string',
        default: '#00e5ff',
        description: '时间文本颜色'
      }
    }
  }
};

export default Main;


