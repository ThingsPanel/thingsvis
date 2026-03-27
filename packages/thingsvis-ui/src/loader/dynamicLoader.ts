import type { ComponentRegistryEntry } from "@thingsvis/schema";

type LoaderEventBus = {
  emit: (eventName: string, payload: unknown) => void;
};

export type DynamicLoaderRuntime = {
  eventBus?: LoaderEventBus;
  previewRegistryUrl?: string;
};

const runtimeConfig: DynamicLoaderRuntime = {};

function mapRegistryEntry(key: string, entry: any): ComponentRegistryEntry {
  const mapped = {
    remoteName: entry.remoteName,
    remoteEntryUrl: entry.remoteEntryUrl,
    localEntryUrl: entry.localEntryUrl,
    staticEntryUrl: entry.staticEntryUrl,
    debugSource: entry.debugSource,
    exposedModule: entry.exposedModule,
    version: entry.version,
    name: entry.name,
    displayName: entry.name ?? key,
    iconUrl: entry.iconUrl,
    icon: entry.icon,
    i18n: entry.i18n,
    category: entry.category,
    description: entry.description,
    author: entry.author,
    tags: entry.tags,
    thumbnailUrl: entry.thumbnailUrl,
    order: entry.order,
    defaultSize: entry.defaultSize,
    constraints: entry.constraints,
  } as ComponentRegistryEntry;
  (mapped as any).componentId = key;
  return mapped;
}

function mapRegistryEntries(body: any): ComponentRegistryEntry[] {
  return Object.keys(body.components || {}).map((key) => mapRegistryEntry(key, body.components[key]));
}

function shouldReadRegistryFromFs(url: string): boolean {
  if (!url) return false;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) return false;
  if (url.startsWith("/")) return false;
  return true;
}

async function readRegistryFromFs(url: string): Promise<any> {
  const [{ readFile }, { resolve }] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const filePath = resolve(url);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

// Lightweight cross-package event bridge:
// - Prefer the explicitly configured runtime bus.
// - Otherwise dispatch DOM CustomEvents for apps to observe.
function emitWidgetEvent(eventName: string, payload: any, eventBus?: LoaderEventBus) {
  if (eventBus && typeof eventBus.emit === "function") {
    eventBus.emit(eventName, payload);
    return;
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

export function configureDynamicLoader(runtime: DynamicLoaderRuntime): void {
  if ('eventBus' in runtime) {
    runtimeConfig.eventBus = runtime.eventBus;
  }
  if ('previewRegistryUrl' in runtime) {
    runtimeConfig.previewRegistryUrl = runtime.previewRegistryUrl;
  }
}

/**
 * Dynamic Loader
 *
 * Provides:
 * - getRegistryEntries(url?)
 * - loadWidget(remoteEntryUrl, exposedModule)
 *
 * NOTE: MF2 runtime integration and sandbox wrapping will be implemented in following tasks.
 */

export async function getRegistryEntries(
  url?: string,
  runtime?: DynamicLoaderRuntime,
): Promise<ComponentRegistryEntry[]> {
  // resolution order:
  // 1) explicit `url` param
  // 2) explicitly configured runtime previewRegistryUrl
  // 3) environment var `process.env.PREVIEW_REGISTRY_URL` (build-time)
  // 4) fallback to relative `/registry.json`
  const runtimeUrl = runtime?.previewRegistryUrl ?? runtimeConfig.previewRegistryUrl;
  const envUrl = typeof process !== "undefined" && (process.env as any).PREVIEW_REGISTRY_URL ? (process.env as any).PREVIEW_REGISTRY_URL : undefined;
  const registryUrl = url ?? runtimeUrl ?? envUrl ?? "/registry.json";
  try {
    if (shouldReadRegistryFromFs(registryUrl)) {
      const body = await readRegistryFromFs(registryUrl);
      return mapRegistryEntries(body);
    }

    const res = await fetch(registryUrl, { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      // Basic validation left to caller (Zod in packages/thingsvis-schema)
      return mapRegistryEntries(body);
    } else {
      // fallback to bundled fixture
      // eslint-disable-next-line no-console
      console.warn(`[dynamicLoader] Registry fetch returned ${res.status} from ${registryUrl}, falling back to fixture`);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[dynamicLoader] Registry fetch failed, falling back to fixture:', e);
  }

  // Load built-in fixture as last resort (works during dev when preview public isn't mounted)
  try {
    // require the JSON fixture synchronously
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fixture = require("../fixtures/registry.json");
    return mapRegistryEntries(fixture);
  } catch (e) {
    throw new Error("Failed to load registry (network + fixture)");
  }
}

export function setPreviewRegistryUrl(url: string | undefined) {
  configureDynamicLoader({ previewRegistryUrl: url });
}

/**
 * @deprecated This stub loader will be replaced by the canonical widget loader
 * after Task 06 (runtime de-singleton) is completed. Do not add new consumers.
 * See: issues/07-widget-contract-registry-runtime-fragmentation-architecture-debt.md
 */
export async function loadWidget(
  remoteEntryUrl: string,
  exposedModule: string,
  runtime?: DynamicLoaderRuntime,
): Promise<any> {
  const eventBus = runtime?.eventBus ?? runtimeConfig.eventBus;
  // Emit start event
  try {
    emitWidgetEvent("widget.load.start", { remoteName: exposedModule, remoteEntryUrl }, eventBus);
  } catch (e) {
    console.warn('[dynamicLoader] Failed to emit widget.load.start event:', e);
  }

  // Placeholder loader:
  // 1) Try MF2 runtime (to be implemented)
  // 2) Fallback: dynamic import from blob (dev only)
  // For now return a simple stub module to allow integration tests to proceed.
  // eslint-disable-next-line no-console
  console.warn(`[dynamicLoader] loadWidget(${exposedModule}) returning stub module — MF2 runtime not yet integrated`);

  const module = {
    create: (opts: any) => {
      // widget factory stub
      return {
        renderSpec: { type: "placeholder", props: {} },
        propsSchema: {}
      };
    }
  };

  try {
    emitWidgetEvent(
      "widget.load.success",
      { remoteName: exposedModule, moduleInfo: { stub: true } },
      eventBus,
    );
  } catch (e) {
    console.warn('[dynamicLoader] Failed to emit widget.load.success event:', e);
    try {
      emitWidgetEvent("widget.load.failure", { remoteName: exposedModule, error: e }, eventBus);
    } catch (innerErr) {
      console.error('[dynamicLoader] Failed to emit widget.load.failure event:', innerErr);
    }
  }

  return module;
}
