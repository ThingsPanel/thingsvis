import { safeExecute } from "../executor/SafeExecutor";

export function runSafe<T>(fn: () => T, fallback: T): T {
  return safeExecute(fn, fallback);
}

export async function runSafeAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[runSafeAsync] error:", err);
    return fallback;
  }
}


