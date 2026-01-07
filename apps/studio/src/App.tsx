import React, { useEffect, useState } from 'react';
import Editor from './components/Editor';
import DataSourcesPage from './pages/DataSourcesPage';
import PreviewPage from './pages/PreviewPage';
import './index.css';

type Route = 'editor' | 'data-sources' | 'preview';

function getRouteFromHash(): Route {
  const h = (window.location.hash || '').replace(/^#/, '');
  if (h.startsWith('/data-sources')) return 'data-sources';
  if (h.startsWith('/preview')) return 'preview';
  return 'editor';
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => getRouteFromHash());

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (route === 'data-sources') return <DataSourcesPage />;
  if (route === 'preview') return <PreviewPage />;
  return <Editor />;
}

