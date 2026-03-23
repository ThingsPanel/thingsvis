import { describe, expect, it } from 'vitest';

import { apiClient } from './api/client';
import {
  deriveCanvasBackgroundState,
  normalizeCanvasBackground,
  normalizeCanvasBackgroundImage,
} from './canvasBackground';

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
      image: 'http://localhost:3000/api/v1/uploads/bg.png',
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
        image: 'http://localhost:3000/api/v1/uploads/bg.png',
        size: 'cover',
        repeat: 'no-repeat',
        attachment: 'scroll',
      },
      bgType: 'image',
      bgValue: '#101010',
      bgColor: '#101010',
      bgImage: 'http://localhost:3000/api/v1/uploads/bg.png',
    });
  });

  it('normalizes upload asset paths against the configured api base', () => {
    expect(normalizeCanvasBackgroundImage('/uploads/bg.png')).toBe(
      'http://localhost:3000/api/v1/uploads/bg.png',
    );
    expect(normalizeCanvasBackgroundImage('uploads/bg.png')).toBe(
      'http://localhost:3000/api/v1/uploads/bg.png',
    );
    expect(normalizeCanvasBackgroundImage('/api/v1/uploads/bg.png')).toBe(
      'http://localhost:3000/api/v1/uploads/bg.png',
    );
  });

  it('keeps upload assets on the embed proxy path instead of falling back to host root', () => {
    apiClient.configure({ baseUrl: 'http://localhost:5002/thingsvis-api' });

    expect(normalizeCanvasBackgroundImage('/uploads/bg.png')).toBe(
      'http://localhost:5002/thingsvis-api/uploads/bg.png',
    );
    expect(normalizeCanvasBackgroundImage('/api/v1/uploads/bg.png')).toBe(
      'http://localhost:5002/thingsvis-api/uploads/bg.png',
    );
    expect(normalizeCanvasBackgroundImage('http://localhost:5002/api/v1/uploads/bg.png')).toBe(
      'http://localhost:5002/thingsvis-api/uploads/bg.png',
    );

    apiClient.configure({ baseUrl: 'http://localhost:3000/api/v1' });
  });
});
