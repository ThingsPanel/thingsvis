import React, { useEffect, useRef } from 'react';
import { App, Image } from 'leafer-ui';

/**
 * Visual Spec: media/image
 */
export const Spec: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const app = new App({ view: ref.current, tree: {} });
    const img = new Image({
      x: 10,
      y: 10,
      url: 'https://picsum.photos/240/140',
      width: 240,
      height: 140
    });
    (app.tree as any).add(img);
    return () => {
      app.destroy?.();
    };
  }, []);

  return <div ref={ref} style={{ width: 320, height: 200, border: '1px solid #ddd' }} />;
};


