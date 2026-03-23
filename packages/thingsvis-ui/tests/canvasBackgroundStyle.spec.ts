import { describe, expect, it } from 'vitest';
import {
  normalizeCanvasBackgroundImageSource,
  resolveCanvasBackgroundStyle,
} from '../src/utils/canvasBackgroundStyle';

describe('canvasBackgroundStyle', () => {
  it('treats transparent as an empty theme fallback color', () => {
    expect(
      resolveCanvasBackgroundStyle({
        color: 'transparent',
      }),
    ).toMatchObject({
      backgroundColor: 'var(--w-bg, hsl(var(--w-canvas-bg, 0 0% 100%)))',
      backgroundImage: 'var(--w-artboard-gradient, none)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll',
    });
  });

  it('preserves explicit background colors', () => {
    expect(
      resolveCanvasBackgroundStyle({
        color: '#112233',
        repeat: 'repeat-x',
      }),
    ).toMatchObject({
      backgroundColor: '#112233',
      backgroundImage: 'var(--w-artboard-gradient, none)',
      backgroundRepeat: 'repeat-x',
    });
  });

  it('normalizes relative image urls and keeps theme gradient as the fallback layer', () => {
    expect(normalizeCanvasBackgroundImageSource('/uploads/demo.png')).toBe(
      'http://localhost:3000/uploads/demo.png',
    );
    expect(
      resolveCanvasBackgroundStyle({
        image: '/uploads/demo.png',
      }),
    ).toMatchObject({
      backgroundColor: 'var(--w-bg, hsl(var(--w-canvas-bg, 0 0% 100%)))',
      backgroundImage: 'url(http://localhost:3000/uploads/demo.png), var(--w-artboard-gradient, none)',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll',
    });
  });
});
