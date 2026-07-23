import { getMergedEditorUrlParams } from './embed/editorUrlParams';

/**
 * Resolve the user-facing share URL.
 *
 * In a host-managed embed, the host owns the public origin, router base and
 * deployment port. ThingsVis only owns the bearer token. Standalone ThingsVis
 * keeps using the URL returned by its own API.
 */
export function resolveShareUrl(options: {
  shareToken: string;
  standaloneShareUrl: string;
  hostPreviewUrl?: string | null;
}): string {
  const configuredHostPreviewUrl =
    options.hostPreviewUrl ?? getMergedEditorUrlParams().get('hostPreviewUrl');

  if (!configuredHostPreviewUrl) {
    return options.standaloneShareUrl;
  }

  try {
    const url = new URL(configuredHostPreviewUrl);
    url.searchParams.set('shareToken', options.shareToken);
    return url.toString();
  } catch {
    return options.standaloneShareUrl;
  }
}
