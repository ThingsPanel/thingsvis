import type { ComponentRegistryEntry } from "../../../specs/004-load-registry-components/data-model";

// Lightweight cross-package event bridge:
// - If kernel has injected a global event bus (`globalThis.__thingsvis_kernel_eventbus__`), use it.
// - Otherwise dispatch DOM CustomEvents for apps to observe.
function emitPluginEvent(eventName: string, payload: any) {
  try {
    const globalBus = (globalThis as any).__thingsvis_kernel_eventbus__;
    if (globalBus && typeof globalBus.emit === "function") {
      globalBus.emit(eventName, payload);
      return;
    }
  } catch (e) {
    // ignore
  }

  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new CustomEvent(eventName, { detail: payload }));
      return;
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Dynamic Loader
 *
 * Provides:
 * - getRegistryEntries(url?)
 * - loadPlugin(remoteEntryUrl, exposedModule)
 *
 * NOTE: MF2 runtime integration and sandbox wrapping will be implemented in following tasks.
 */

export async function getRegistryEntries(url?: string): Promise<ComponentRegistryEntry[]> {
  // resolution order:
  // 1) explicit `url` param
  // 2) runtime global `globalThis.__PREVIEW_REGISTRY_URL__`
  // 3) environment var `process.env.PREVIEW_REGISTRY_URL` (build-time)
  // 4) fallback to relative `/registry.json`
  const runtimeUrl = typeof (globalThis as any).__PREVIEW_REGISTRY_URL__ === "string" ? (globalThis as any).__PREVIEW_REGISTRY_URL__ : undefined;
  const envUrl = typeof process !== "undefined" && (process.env as any).PREVIEW_REGISTRY_URL ? (process.env as any).PREVIEW_REGISTRY_URL : undefined;
  const registryUrl = url ?? runtimeUrl ?? envUrl ?? "/registry.json";
  try {
    const res = await fetch(registryUrl);
    if (res.ok) {
      const body = await res.json();
      // Basic validation left to caller (Zod in packages/thingsvis-schema)
      return Object.keys(body.components || {}).map((key) => {
        const entry = body.components[key];
        return {
          remoteName: entry.remoteName,
          remoteEntryUrl: entry.remoteEntryUrl,
          exposedModule: entry.exposedModule,
          version: entry.version,
          displayName: key,
          iconUrl: entry.iconUrl
        } as ComponentRegistryEntry;
      });
    } else {
      // fallback to bundled fixture
      // eslint-disable-next-line no-console
      console.warn(`[dynamicLoader] registry fetch failed (${res.status}); falling back to built-in fixture`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[dynamicLoader] registry fetch error; falling back to built-in fixture", e);
  }

  // Load built-in fixture as last resort (works during dev when preview public isn't mounted)
  try {
    // require the JSON fixture synchronously
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fixture = require("../fixtures/registry.json");
    const body = fixture;
    return Object.keys(body.components || {}).map((key) => {
      const entry = body.components[key];
      return {
        remoteName: entry.remoteName,
        remoteEntryUrl: entry.remoteEntryUrl,
        exposedModule: entry.exposedModule,
        version: entry.version,
        displayName: key,
        iconUrl: entry.iconUrl
      } as ComponentRegistryEntry;
    });
  } catch (e) {
    throw new Error("Failed to load registry (network + fixture)");
  }
}

export function setPreviewRegistryUrl(url: string | undefined) {
  try {
    if (typeof globalThis !== "undefined") {
      (globalThis as any).__PREVIEW_REGISTRY_URL__ = url;
    }
  } catch (e) {
    // ignore
  }
}

export async function loadPlugin(remoteEntryUrl: string, exposedModule: string): Promise<any> {
  // Emit start event
  try {
    emitPluginEvent("plugin.load.start", { remoteName: exposedModule, remoteEntryUrl });
  } catch (e) {}

  // Placeholder loader:
  // 1) Try MF2 runtime (to be implemented)
  // 2) Fallback: dynamic import from blob (dev only)
  // For now return a simple stub module to allow integration tests to proceed.
  // eslint-disable-next-line no-console
  console.log("[dynamicLoader] loadPlugin", remoteEntryUrl, exposedModule);
  const module = {
    create: (opts: any) => {
      // plugin factory stub
      return {
        renderSpec: { type: "placeholder", props: {} },
        propsSchema: {}
      };
    }
  };

  try {
    emitPluginEvent("plugin.load.success", { remoteName: exposedModule, moduleInfo: { stub: true } });
  } catch (e) {
    try {
      emitPluginEvent("plugin.load.failure", { remoteName: exposedModule, error: e });
    } catch {}
  }

  return module;
}


