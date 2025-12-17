import React, { useEffect, useRef } from 'react';
import { App, Rect } from 'leafer-ui';

/**
 * Visual Spec: basic/rect
 * - 独立渲染验证：不依赖 host 业务逻辑
 */
export const Spec: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const app = new App({ view: ref.current, tree: {} });
    const rect = new Rect({ x: 20, y: 20, width: 120, height: 80, fill: '#1677ff' });
    (app.tree as any).add(rect);
    return () => {
      app.destroy?.();
    };
  }, []);

  return <div ref={ref} style={{ width: 260, height: 180, border: '1px solid #ddd' }} />;
};


