/**
 * Selecto Adapter
 * Headless placeholder API for marquee / multi-select integration.
 */
export type SelectoOptions = {
  container?: HTMLElement | null;
  selectableTargets?: string[];
};

export function createSelecto(opts: SelectoOptions, handlers: { onSelect?: (ids: string[]) => void }) {
  // placeholder
  return {
    destroy() {},
    select(ids: string[]) {
      handlers.onSelect?.(ids);
    }
  };
}

export default { createSelecto };


