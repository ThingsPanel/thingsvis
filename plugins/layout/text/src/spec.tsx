import React, { useEffect, useRef } from 'react';
import { App, Text } from 'leafer-ui';

/**
 * Visual Spec: layout/text
 */
export const Spec: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const app = new App({ view: ref.current, tree: {} });
    const text = new Text({ x: 20, y: 20, text: 'Hello ThingsVis', fontSize: 28, fill: '#fff' });
    (app.tree as any).add(text);
    return () => {
      app.destroy?.();
    };
  }, []);

  return <div ref={ref} style={{ width: 320, height: 180, border: '1px solid #fff' }} />;
};


