export type SafeResult<T> = {
  ok: boolean;
  value?: T;
  error?: unknown;
};

export function safeExecute<T>(fn: () => T): SafeResult<T> {
  try {
    const value = fn();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error };
  }
}


