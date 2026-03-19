import React, { useEffect, useRef } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import type { ActionRuntime } from '../engine/executeActions';
import { VisualEngine } from '../engine/VisualEngine';


interface PreviewCanvasProps {
    /** The kernel store to render from */
    store: KernelStore;
    /** Async widget loader */
    resolveWidget?: (type: string) => Promise<unknown>;
    /**
     * Rendering zoom factor applied to VisualEngine.
     * 1 = natural (CSS transform handles scaling externally).
     * 0.5 = half-size (VisualEngine scales content for scroll modes).
     */
    zoom?: number;
    actionRuntime?: ActionRuntime;
}

/**
 * PreviewCanvas — a clean, headless canvas renderer for preview mode.
 *
 * Unlike the editor's CanvasView, this component:
 * - Renders no artboard shadow, no workspace-bg, no grid
 * - Does NOT manage its own zoom/pan state
 * - Accepts a `zoom` prop and delegates directly to VisualEngine.setViewport
 * - Fills its parent container 100% × 100%
 */
export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
    store,
    resolveWidget,
    zoom = 1,
    actionRuntime,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<VisualEngine | undefined>(undefined);

    // Mount VisualEngine once on store/resolveWidget change
    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new VisualEngine(store, {
            resolveWidget: resolveWidget as any,
            editable: false,
            actionRuntime,
        });
        engineRef.current = engine;
        engine.mount(containerRef.current);
        // Apply initial viewport: zoom only, no offset (ScaleScreen handles positioning)
        engine.setViewport(zoom, 0, 0);

        return () => {
            engine.unmount();
            engineRef.current = undefined;
        };
        // Re-mount only if store or resolveWidget reference changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actionRuntime, store, resolveWidget]);

    // Update VisualEngine viewport when zoom changes (scroll modes)
    useEffect(() => {
        engineRef.current?.setViewport(zoom, 0, 0);
    }, [zoom]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
        />
    );
};
