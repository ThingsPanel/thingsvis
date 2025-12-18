import React, { useEffect, useRef } from 'react';
import { App, Group, Rect, Text } from 'leafer-ui';

function formatTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Visual Spec: custom/cyber-clock
 * - “AI generated example” proof-of-concept component
 */
export const Spec: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const app = new App({ view: ref.current, tree: {} });
    const root = new Group();

    const panel = new Rect({
      x: 20,
      y: 20,
      width: 260,
      height: 110,
      fill: '#0b1020',
      cornerRadius: 14,
      stroke: '#00e5ff',
      strokeWidth: 2,
      shadow: {
        color: '#00e5ff',
        blur: 14,
        x: 0,
        y: 0
      } as any
    });

    const title = new Text({
      x: 34,
      y: 34,
      text: 'CYBER CLOCK',
      fontSize: 14,
      fontWeight: 700,
      fill: '#7df9ff'
    });

    const clock = new Text({
      x: 34,
      y: 58,
      text: formatTime(new Date()),
      fontSize: 34,
      fontWeight: 800,
      fill: '#00e5ff'
    });

    (root as any).add(panel);
    (root as any).add(title);
    (root as any).add(clock);
    (app.tree as any).add(root);

    const timer = window.setInterval(() => {
      clock.set?.({ text: formatTime(new Date()) });
    }, 1000);

    return () => {
      window.clearInterval(timer);
      app.destroy?.();
    };
  }, []);

  return <div ref={ref} style={{ width: 340, height: 200, border: '1px solid #ddd' }} />;
};


