import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { setPreviewRegistryUrl } from "@thingsvis/ui";

// If PREVIEW_REGISTRY_URL is set in the environment or injected at runtime, configure the UI loader.
try {
  const envUrl = typeof process !== "undefined" && (process.env as any).PREVIEW_REGISTRY_URL ? (process.env as any).PREVIEW_REGISTRY_URL : undefined;
  if (envUrl) setPreviewRegistryUrl(envUrl);
} catch {}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

