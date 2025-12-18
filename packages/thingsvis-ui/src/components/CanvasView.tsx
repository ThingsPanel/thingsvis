import React, { useEffect, useRef } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { VisualEngine } from '../engine/VisualEngine';

type Props = {
  store: KernelStore;
  resolvePlugin?: (type: string) => Promise<any>;
};

export const CanvasView: React.FC<Props> = ({ store, resolvePlugin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VisualEngine>();

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new VisualEngine(store, { resolvePlugin });
    engineRef.current = engine;
    engine.mount(containerRef.current);
    return () => {
      engine.unmount();
    };
  }, [store, resolvePlugin]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};


