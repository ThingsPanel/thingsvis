import React, { useEffect, useState } from 'react';
import Editor from './components/Editor';
import DataSourcesPage from './pages/DataSourcesPage';
import './index.css';

type Route = 'editor' | 'data-sources';

function getRouteFromHash(): Route {
  const h = (window.location.hash || '').replace(/^#/, '');
  if (h.startsWith('/data-sources')) return 'data-sources';
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
  return <Editor />;
}

