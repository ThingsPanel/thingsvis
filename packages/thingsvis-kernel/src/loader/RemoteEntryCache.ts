import { createStore, get, set } from 'idb-keyval';

export type CachedRemoteEntry = {
  remoteEntryUrl: string;
  version: string;
  sourceText: string;
  storedAt: string; // ISO
};

const store = createStore('thingsvis-plugin-cache', 'remote-entries');

function cacheKey(remoteEntryUrl: string) {
  return `remoteEntry:${remoteEntryUrl}`;
}

/**
 * 读取缓存的 remoteEntry.js
 * - 关键路径：必须稳定、可容错（IndexedDB 可能不可用/被禁用）
 */
export async function getCachedRemoteEntry(remoteEntryUrl: string): Promise<CachedRemoteEntry | undefined> {
  try {
    const v = (await get(cacheKey(remoteEntryUrl), store)) as CachedRemoteEntry | undefined;
    return v;
  } catch {
    // IndexedDB 不可用时直接降级为“无缓存”
    return undefined;
  }
}

/**
 * 写入缓存的 remoteEntry.js
 * - 关键路径：写失败不应影响主流程（只影响离线能力）
 */
export async function setCachedRemoteEntry(entry: CachedRemoteEntry): Promise<void> {
  try {
    await set(cacheKey(entry.remoteEntryUrl), entry, store);
  } catch {
    // swallow: storage quota/permission errors should not crash host
  }
}


