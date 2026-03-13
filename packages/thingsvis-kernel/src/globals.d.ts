declare global {
  // eslint-disable-next-line no-var
  var __thingsvis_kernel_eventbus__: import('./event-bus').EventBus | undefined;
  // eslint-disable-next-line no-var
  var __thingsvis_subscribeToPatches__:
    | ((cb: (patches: unknown[]) => void) => () => void)
    | undefined;
  // eslint-disable-next-line no-var
  var __PREVIEW_REGISTRY_URL__: string | undefined;
}
export {};
