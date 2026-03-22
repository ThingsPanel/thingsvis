import { describe, expect, it } from 'vitest';

import { deriveCanvasBackgroundState, normalizeCanvasBackground } from './canvasBackground';

describe('canvasBackground', () => {
  it('keeps missing background undefined instead of inventing a fallback', () => {
    expect(normalizeCanvasBackground(undefined)).toBeUndefined();
    expect(normalizeCanvasBackground('')).toBeUndefined();
    expect(normalizeCanvasBackground({})).toBeUndefined();
  });

  it('normalizes legacy string backgrounds into explicit color objects', () => {
    expect(normalizeCanvasBackground('#ffffff')).toEqual({
      color: '#ffffff',
      size: 'cover',
      repeat: 'no-repeat',
      attachment: 'scroll',
    });
    expect(normalizeCanvasBackground('transparent')).toEqual({
      color: 'transparent',
      size: 'cover',
      repeat: 'no-repeat',
      attachment: 'scroll',
    });
  });

  it('drops empty fields but preserves explicit image configuration', () => {
    expect(
      normalizeCanvasBackground({
        color: '   ',
        image: '/uploads/bg.png',
        size: 'cover',
        repeat: 'no-repeat',
      }),
    ).toEqual({
      color: 'transparent',
      image: '/uploads/bg.png',
      size: 'cover',
      repeat: 'no-repeat',
      attachment: 'scroll',
    });
  });

  it('derives editor background state fields from explicit background input', () => {
    expect(
      deriveCanvasBackgroundState({
        color: '#101010',
        image: '/uploads/bg.png',
      }),
    ).toEqual({
      background: {
        color: '#101010',
        image: '/uploads/bg.png',
        size: 'cover',
        repeat: 'no-repeat',
        attachment: 'scroll',
      },
      bgType: 'image',
      bgValue: '#101010',
      bgColor: '#101010',
      bgImage: '/uploads/bg.png',
    });
  });
});
