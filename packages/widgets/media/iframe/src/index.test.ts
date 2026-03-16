import { describe, expect, it } from 'vitest';
import Main, { STANDALONE_DEFAULT_SRC } from './index';
import type { WidgetOverlayContext } from '@thingsvis/widget-sdk';

function createContext(overrides: Partial<WidgetOverlayContext> = {}): WidgetOverlayContext {
    return {
        mode: 'view',
        props: {},
        ...overrides,
    };
}

describe('media/iframe widget', () => {
    it('exposes standalone default url', () => {
        expect(Main.standaloneDefaults).toEqual({ src: STANDALONE_DEFAULT_SRC });
    });

    it('loads iframe in edit mode but keeps interaction disabled', () => {
        const instance = Main.createOverlay(createContext({
            mode: 'edit',
            props: { src: STANDALONE_DEFAULT_SRC },
        }));

        const iframe = instance.element.querySelector('iframe');
        expect(iframe).not.toBeNull();
        expect(iframe?.getAttribute('src')).toBe(STANDALONE_DEFAULT_SRC);
        expect(iframe?.style.pointerEvents).toBe('none');

        instance.destroy?.();
    });

    it('enables iframe interaction in view mode', () => {
        const instance = Main.createOverlay(createContext({
            mode: 'edit',
            props: { src: STANDALONE_DEFAULT_SRC },
        }));

        instance.update?.(createContext({
            mode: 'view',
            props: { src: STANDALONE_DEFAULT_SRC },
        }));

        const iframe = instance.element.querySelector('iframe');
        expect(iframe?.getAttribute('src')).toBe(STANDALONE_DEFAULT_SRC);
        expect(iframe?.style.pointerEvents).toBe('auto');

        instance.destroy?.();
    });
});
