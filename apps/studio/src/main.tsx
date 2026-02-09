import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setPreviewRegistryUrl } from "@thingsvis/ui";
import { configureEmbedApiClient } from './embed/embed-init';

// If PREVIEW_REGISTRY_URL is set in the environment or injected at runtime, configure the UI loader.
try {
  const envUrl = typeof process !== "undefined" && (process.env as any).PREVIEW_REGISTRY_URL ? (process.env as any).PREVIEW_REGISTRY_URL : undefined;
  if (envUrl) setPreviewRegistryUrl(envUrl);
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
        console.log('[main.tsx] 🔑 检测到嵌入模式，提前配置 API token');
        configureEmbedApiClient(token);
      }
    }
  } catch (e) {
    console.error('[main.tsx] 初始化嵌入 token 失败:', e);
  }
}

// 在 React 渲染之前就配置 token
initEmbedTokenFromUrl();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

