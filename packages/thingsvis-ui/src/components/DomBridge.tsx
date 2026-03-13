import React, { useEffect, useRef } from 'react';

interface DomBridgeProps {
  /** The raw DOM element to mount into the React tree */
  element: HTMLElement;
}

/**
 * DomBridge — mounts a raw DOM element into the React tree.
 *
 * This bridges the gap between imperative DOM overlay creation
 * (used by VisualEngine) and React's component model, allowing
 * native overlay elements to be wrapped inside WidgetErrorBoundary.
 */
export const DomBridge: React.FC<DomBridgeProps> = ({ element }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.appendChild(element);
    return () => {
      if (container.contains(element)) {
        container.removeChild(element);
      }
    };
  }, [element]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default DomBridge;
