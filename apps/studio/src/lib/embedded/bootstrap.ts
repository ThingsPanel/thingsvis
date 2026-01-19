import { ProjectFileSchema, type ProjectFile } from '../storage/schemas'

export type EmbeddedBootstrapResult = {
  project?: ProjectFile
  error?: string
}

type HostBootstrapGlobals = {
  defaultProject?: unknown
}

type HostWindow = Window & {
  __THINGSVIS_EMBEDDED__?: HostBootstrapGlobals
  thingsvisEmbedded?: HostBootstrapGlobals
  hostDefaultProject?: unknown
}

const getHashParams = (): URLSearchParams | null => {
  try {
    const hash = window.location.hash || ''
    const queryIndex = hash.indexOf('?')
    if (queryIndex === -1) return null
    return new URLSearchParams(hash.slice(queryIndex + 1))
  } catch {
    return null
  }
}

const getParam = (key: string): string | null => {
  const hashParams = getHashParams()
  if (hashParams?.has(key)) return hashParams.get(key)
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get(key)
  } catch {
    return null
  }
}

const decodeBase64Url = (value: string): string => {
  // base64url -> base64
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  // pad
  const pad = normalized.length % 4
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized
  return atob(padded)
}

const tryParseProject = (value: unknown): EmbeddedBootstrapResult => {
  try {
    const parsed = ProjectFileSchema.parse(value)
    return { project: parsed }
  } catch (e: any) {
    const message = e?.message ? String(e.message) : 'Invalid project payload'
    return { error: message }
  }
}

/**
 * Resolve an optional default project payload for embedded mode.
 *
 * Supported inputs:
 * - URL param: `defaultProject` as base64url-encoded JSON of ProjectFile
 * - Window globals: `__THINGSVIS_EMBEDDED__.defaultProject`, `thingsvisEmbedded.defaultProject`, `hostDefaultProject`
 */
export function resolveEmbeddedDefaultProject(): EmbeddedBootstrapResult {
  // 1) URL param
  const encoded = getParam('defaultProject')
  if (encoded) {
    try {
      const json = decodeBase64Url(encoded)
      const value = JSON.parse(json)
      return tryParseProject(value)
    } catch (e: any) {
      return { error: e?.message ? String(e.message) : 'Failed to decode defaultProject' }
    }
  }

  // 2) window globals
  try {
    const host = window as HostWindow
    const value =
      host.__THINGSVIS_EMBEDDED__?.defaultProject ??
      host.thingsvisEmbedded?.defaultProject ??
      host.hostDefaultProject

    if (value !== undefined) return tryParseProject(value)
  } catch {
    // ignore
  }

  return {}
}
