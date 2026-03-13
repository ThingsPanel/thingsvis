/**
 * usePlatformData Hook
 *
 * @deprecated Platform data is now accessed exclusively via the ds.__platform__
 * data source in the kernel store. This hook is kept as a no-op stub to avoid
 * breaking any downstream widget code that might import it.
 *
 * Returns an empty object — widgets should use {{ ds.__platform__.data.xxx }}
 * expressions instead of {{ platform.xxx }}.
 */

/**
 * @deprecated Returns an empty object. Platform data flows through ds.__platform__ now.
 */
export function usePlatformData(): Record<string, any> {
    return {};
}
