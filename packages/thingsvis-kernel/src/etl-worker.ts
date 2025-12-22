import { PageSchema } from "../../thingsvis-schema/src/canvas-schema";

// Minimal ETL worker stub. This file is intended to be usable both as:
// - a Node.js worker (worker_threads), and
// - a browser Web Worker (self.postMessage).
// Some bundlers can't resolve 'worker_threads' at build time, so we load it dynamically.

// Adapter: prefer environment-specific implementation to avoid bundler resolving `worker_threads`.
// Node: use `etl-worker.node.ts` (requires worker_threads)
// Web: use `etl-worker.web.ts` (web worker)

const isNode = typeof process !== "undefined" && !!process.versions?.node;

if (isNode) {
  // Dynamically require the node worker implementation at runtime in Node.
  // Use eval-wrapped require to avoid static analysis by bundlers.
  try {
    // eslint-disable-next-line no-eval
    const req: any = eval("require");
    req("./etl-worker.node");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[etl-worker] failed to load node worker implementation", e);
  }
} else if (typeof self !== "undefined" && typeof (self as any).postMessage === "function") {
  try {
    // eslint-disable-next-line no-eval
    const req: any = eval("require");
    req("./etl-worker.web");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[etl-worker] failed to load web worker implementation", e);
  }
} else {
  // Not running inside a worker; expose a no-op adapter
  // eslint-disable-next-line no-console
  console.warn("[etl-worker] running outside worker context; no-op adapter loaded");
}

export {};


