export type PlatformDataPayload = {
  fieldId?: string;
  value?: unknown;
  fields?: Record<string, unknown>;
  timestamp?: number;
  deviceId?: string;
};

type CachedFieldEntry = {
  value: unknown;
  timestamp: number;
};

export type PlatformDataSnapshot = Record<string, Record<string, CachedFieldEntry>>;

const GLOBAL_SNAPSHOT_KEY = '__global__';

function getSnapshotKey(deviceId?: string): string {
  return deviceId ?? GLOBAL_SNAPSHOT_KEY;
}

export function cachePlatformData(
  snapshot: PlatformDataSnapshot,
  payload: PlatformDataPayload,
): PlatformDataSnapshot {
  if (!payload) return snapshot;

  const timestamp = payload.timestamp ?? Date.now();
  const updates = payload.fields
    ? Object.entries(payload.fields)
    : payload.fieldId !== undefined
      ? ([[payload.fieldId, payload.value]] as const)
      : [];

  if (updates.length === 0) return snapshot;

  const key = getSnapshotKey(payload.deviceId);
  const nextBucket = { ...(snapshot[key] ?? {}) };

  updates.forEach(([fieldId, value]) => {
    nextBucket[fieldId] = {
      value,
      timestamp,
    };
  });

  return {
    ...snapshot,
    [key]: nextBucket,
  };
}

export function buildPlatformReplayPayloads(
  snapshot: PlatformDataSnapshot,
): Array<{ fieldId: string; value: unknown; timestamp: number; deviceId?: string }> {
  return Object.entries(snapshot)
    .flatMap(([snapshotKey, fields]) =>
      Object.entries(fields).map(([fieldId, entry]) => ({
        fieldId,
        value: entry.value,
        timestamp: entry.timestamp,
        deviceId: snapshotKey === GLOBAL_SNAPSHOT_KEY ? undefined : snapshotKey,
      })),
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}
