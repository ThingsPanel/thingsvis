import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Initialize i18next before React renders
import './index.css';
import { configureDynamicLoader } from '@thingsvis/ui';
import { configureEmbedApiClient } from './embed/message-router';
import { eventBus } from './lib/store';

// If PREVIEW_REGISTRY_URL is set in the environment or injected at runtime, configure the UI loader.
try {
  const envUrl =
    typeof process !== 'undefined' && (process.env as any).PREVIEW_REGISTRY_URL
      ? (process.env as any).PREVIEW_REGISTRY_URL
      : undefined;
  configureDynamicLoader({
    eventBus,
    previewRegistryUrl: envUrl,
  });
} catch {}

// 🔑 在 React 渲染之前，从 URL 读取嵌入模式的 token 并配置 API client
// 这样可以避免竞争条件：API 请求在 token 配置之前就发出
function initEmbedTokenFromUrl(): void {
  try {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');

    if (queryIndex >= 0) {
      const params = new URLSearchParams(hash.slice(queryIndex + 1));
      const mode = params.get('mode');
      const token = params.get('token');

      if (mode === 'embedded' && token) {
        configureEmbedApiClient(token);
      }
    }
  } catch (e) {
    console.error('[main.tsx] 初始化嵌入 token 失败:', e);
  }
}

// 在 React 渲染之前就配置 token
initEmbedTokenFromUrl();

// Global safety net: log unhandled promise rejections from widgets or async code
// so they are never silently swallowed. Does NOT call preventDefault() — DevTools
// will still show the default "Uncaught (in promise)" warning.
window.addEventListener('unhandledrejection', (event) => {
  console.error('[ThingsVis] Unhandled promise rejection:', event.reason);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
