export class SafeExecutor {
  run<T>(fn: () => T, onError?: (err: unknown) => void): T | undefined {
    try {
      return fn();
    } catch (err) {
      if (onError) onError(err);
      // swallow to avoid crashing kernel; upstream should log
      return undefined;
    }
  }
}


