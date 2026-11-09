import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { configureDynamicLoader } from '@thingsvis/ui';
import { configureEmbedApiClient } from './embed/message-router';
import { eventBus } from './lib/store';
import EmbedPage from './pages/EmbedPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import './i18n';
import './index.css';

// A viewer-only entry keeps editor pages out of the mini-program's initial download.
configureDynamicLoader({
  eventBus,
  previewRegistryUrl:
    typeof process !== 'undefined' ? process.env.PREVIEW_REGISTRY_URL : undefined,
});
const hash = window.location.hash;
const query = new URLSearchParams(hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '');
const token = query.get('token');
if (query.get('mode') === 'embedded' && token) configureEmbedApiClient(token);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ErrorBoundary>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <EmbedPage />
    </HashRouter>
  </ErrorBoundary>,
);
