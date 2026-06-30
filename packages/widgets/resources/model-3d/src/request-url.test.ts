import { describe, expect, it } from 'vitest';
import { resolveModelRequestUrl } from './request-url';

const API_BASE_URL = 'http://c.thingspanel.cn/thingsvis-api';

describe('resolveModelRequestUrl', () => {
  it.each([
    'http://c.thingspanel.cn/uploads/model.glb',
    'http://c.thingspanel.cn/api/v1/uploads/model.glb',
    'http://c.thingspanel.cn/thingsvis-api/uploads/model.gltf',
  ])('直接加载平台上传资源：%s', (source) => {
    expect(resolveModelRequestUrl(source, API_BASE_URL)).toBe(source);
  });

  it.each([
    'http://localhost:3000/widgets/resources/model-3d/dist/draco/draco_wasm_wrapper.js',
    'https://studio.example.com/widgets/resources/model-3d/dist/draco/draco_decoder.wasm',
  ])('直接加载组件自身静态资源：%s', (source) => {
    expect(resolveModelRequestUrl(source, API_BASE_URL)).toBe(source);
  });

  it('通过服务端代理加载外部模型', () => {
    const source = 'https://assets.example.com/models/factory.glb?version=2';

    expect(resolveModelRequestUrl(source, `${API_BASE_URL}/`)).toBe(
      `${API_BASE_URL}/public/assets/proxy?url=${encodeURIComponent(source)}`,
    );
  });

  it('通过服务端代理加载外部 GLTF 依赖资源', () => {
    const source = 'https://assets.example.com/models/textures/albedo.png';

    expect(resolveModelRequestUrl(source, API_BASE_URL)).toBe(
      `${API_BASE_URL}/public/assets/proxy?url=${encodeURIComponent(source)}`,
    );
  });

  it.each([
    '/relative/model.glb',
    'blob:http://localhost/model-id',
    'data:model/gltf-binary;base64,AAAA',
  ])('非 HTTP(S) 地址保持原样：%s', (source) => {
    expect(resolveModelRequestUrl(source, API_BASE_URL)).toBe(source);
  });
});
