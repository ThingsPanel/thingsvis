import React, { useEffect, useRef } from "react";
import { VisualEngine } from "./visual-engine/VisualEngine";

export const CanvasView: React.FC<{ pageId: string; className?: string }> = ({ pageId, className }) => {
  const engineRef = useRef<VisualEngine | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    engineRef.current = new VisualEngine(pageId);
    engineRef.current.start();
    return () => {
      engineRef.current?.stop();
    };
  }, [pageId]);

  return <div ref={containerRef} className={className ?? ""} data-page-id={pageId} />;
};

export default CanvasView;


