/**
 * Branded identity types for ThingsVis domain objects.
 *
 * These types are structurally incompatible at the type level so that
 * backend project container IDs, dashboard IDs, and host project references
 * can never be accidentally swapped.
 */

// ---------------------------------------------------------------------------
// Brand helper
// ---------------------------------------------------------------------------

declare const __brand: unique symbol;

/**
 * Nominal/branded type helper.
 * `Brand<string, 'DashboardId'>` is assignable neither to `string` nor to
 * another `Brand<string, X>`, preventing accidental mix-ups at compile time.
 */
type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ---------------------------------------------------------------------------
// Domain identity types
// ---------------------------------------------------------------------------

/** Backend project *container* identifier (ThingsVis Cloud). */
export type ProjectContainerId = Brand<string, 'ProjectContainerId'>;

/** Individual dashboard / canvas identifier. */
export type DashboardId = Brand<string, 'DashboardId'>;

/**
 * Host-provided project reference when running in embedded mode.
 * The host platform passes its own project ID via embed params;
 * it must never be confused with `ProjectContainerId`.
 */
export type HostProjectRef = Brand<string, 'HostProjectRef'>;

// ---------------------------------------------------------------------------
// Constructor helpers (create from raw strings at system boundaries)
// ---------------------------------------------------------------------------

export function toProjectContainerId(raw: string): ProjectContainerId {
  return raw as ProjectContainerId;
}

export function toDashboardId(raw: string): DashboardId {
  return raw as DashboardId;
}

export function toHostProjectRef(raw: string): HostProjectRef {
  return raw as HostProjectRef;
}
