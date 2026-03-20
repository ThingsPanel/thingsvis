import type { ProjectFile } from '../storage/schemas';

export type EmbedSessionSnapshotSource = 'host-init' | 'host-save';

export interface EmbedSessionSnapshot {
  projectId: string;
  project: ProjectFile;
  source: EmbedSessionSnapshotSource;
  updatedAt: number;
}

let latestSnapshot: EmbedSessionSnapshot | null = null;

export function setEmbedSessionSnapshot(
  projectId: string,
  project: ProjectFile,
  source: EmbedSessionSnapshotSource,
): void {
  latestSnapshot = {
    projectId,
    project,
    source,
    updatedAt: Date.now(),
  };
}

export function getEmbedSessionSnapshot(projectId?: string): EmbedSessionSnapshot | null {
  if (!latestSnapshot) return null;
  if (!projectId || projectId === 'embed-host') return latestSnapshot;
  return latestSnapshot.projectId === projectId ? latestSnapshot : null;
}

export function clearEmbedSessionSnapshot(): void {
  latestSnapshot = null;
}
