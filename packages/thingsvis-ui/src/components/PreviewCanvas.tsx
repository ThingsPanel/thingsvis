import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import type { KernelStore } from '@thingsvis/kernel';
import { validateCanvasTheme } from '@thingsvis/schema';
import type { ActionRuntime } from '../engine/executeActions';
import { VisualEngine } from '../engine/VisualEngine';
import { resolveCanvasBackgroundStyle } from '../utils/canvasBackgroundStyle';


interface PreviewCanvasProps {
    /** The kernel store to render from */
    store: KernelStore;
    /** Async widget loader */
    resolveWidget?: (type: string) => Promise<unknown>;
    locale?: string;
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
    locale,
    zoom = 1,
    actionRuntime,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<VisualEngine | undefined>(undefined);
    const kernelState = useSyncExternalStore(
        useCallback((subscribe) => store.subscribe(subscribe), [store]),
        () => store.getState(),
        () => store.getState()
    );
    const pageConfig = ((kernelState as any)?.page?.config ?? {}) as Record<string, unknown>;
    const normalizedTheme = useMemo(() => validateCanvasTheme(pageConfig.theme), [pageConfig.theme]);
    const backgroundStyle = useMemo(
        () => resolveCanvasBackgroundStyle(pageConfig.background),
        [pageConfig.background]
    );

    // Mount VisualEngine once on store/resolveWidget change
    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new VisualEngine(store, {
            resolveWidget: resolveWidget as any,
            editable: false,
            actionRuntime,
            locale,
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
    }, [actionRuntime, locale, store, resolveWidget]);

    // Update VisualEngine viewport when zoom changes (scroll modes)
    useEffect(() => {
        engineRef.current?.setViewport(zoom, 0, 0);
    }, [zoom]);

    return (
        <div
            ref={containerRef}
            data-canvas-theme={normalizedTheme}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                ...backgroundStyle,
            }}
        />
    );
};
