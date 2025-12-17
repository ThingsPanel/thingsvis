/**
 * Plugin remote module shape for Module Federation.
 *
 * IMPORTANT:
 * - `packages/thingsvis-schema` must remain React-free. We therefore avoid React types here.
 * - Hosts can treat `Spec` as "unknown" and render it if it matches their runner expectations.
 */

export type PluginComponentId = string; // e.g. "basic/rect"

export type PluginMainModule = {
  componentId: PluginComponentId;
  /**
   * Create a Leafer-compatible renderer instance (usually a Leafer UI node).
   * The host is responsible for mounting/updating/destroying it.
   */
  create: () => unknown;
  /**
   * Visual test entry for isolation rendering.
   * Kept as unknown to avoid React types in schema package.
   */
  Spec?: unknown;
};


