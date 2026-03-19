/**
 * SavePlan — the single computed decision of "how and where to persist".
 *
 * Derived from RuntimeContext + identity information.
 * Replaces the ad-hoc decision logic currently spread across
 * SaveStrategy, useStorage, and cloudAdapter.
 */

import type { StorageMode, SaveTarget } from '../runtime/RuntimeContext';
import type { ProjectContainerId, DashboardId, HostProjectRef } from './ids';

// ---------------------------------------------------------------------------
// SavePlan
// ---------------------------------------------------------------------------

export interface SavePlan {
  /** Where the data will be written */
  readonly storageMode: StorageMode;
  /** Who initiates the persist action */
  readonly saveTarget: SaveTarget;
  /** ThingsVis Cloud project container (present when storageMode = 'cloud') */
  readonly projectContainerId?: ProjectContainerId;
  /** Dashboard within the project container */
  readonly dashboardId?: DashboardId;
  /** Host-provided project reference (present when saveTarget = 'host') */
  readonly hostProjectRef?: HostProjectRef;
}
