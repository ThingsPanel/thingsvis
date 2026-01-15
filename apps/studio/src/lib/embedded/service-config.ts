export type EditorServiceMode = 'standalone' | 'embedded'
export type IntegrationLevel = 'full' | 'minimal'

export type EditorUiConfig = {
  /** Left panel (component library / layers) */
  showComponentLibrary: boolean
  /** Right panel (properties) */
  showPropsPanel: boolean
  /** Top-left region (logo/title/status) */
  showTopLeft: boolean
  /** Top-center tools */
  showToolbar: boolean
  /** Top-right region (language/theme/preview/publish) */
  showTopRight: boolean
  /** Filter for tool ids shown in toolbar */
  toolbarItems?: string[]
}

export type EditorServiceConfig = {
  mode: EditorServiceMode
  integrationLevel: IntegrationLevel
  ui: EditorUiConfig
  warnings: string[]
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

const parseBool = (value: string | null | undefined): boolean | undefined => {
  if (value == null) return undefined
  const v = value.trim().toLowerCase()
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false
  return undefined
}

const parseCsv = (value: string | null | undefined): string[] | undefined => {
  if (!value) return undefined
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return items.length ? items : undefined
}

const defaultStandaloneUi = (): EditorUiConfig => ({
  showComponentLibrary: true,
  showPropsPanel: true,
  showTopLeft: true,
  showToolbar: true,
  showTopRight: true,
})

const defaultEmbeddedUi = (): EditorUiConfig => ({
  // Default to full UI to remain usable if host forgot to configure.
  showComponentLibrary: true,
  showPropsPanel: true,
  showTopLeft: true,
  showToolbar: true,
  showTopRight: true,
})

export function resolveEditorServiceConfig(): EditorServiceConfig {
  const warnings: string[] = []

  // -------- Mode --------
  const embeddedFlag = parseBool(getParam('embedded'))
  const modeParam = (getParam('mode') || '').trim().toLowerCase()

  let mode: EditorServiceMode = 'standalone'
  if (embeddedFlag === true || modeParam === 'embedded') {
    mode = 'embedded'
  } else if (modeParam && modeParam !== 'standalone') {
    warnings.push(`Invalid mode '${modeParam}', falling back to standalone.`)
  }

  // -------- Integration level --------
  const integrationParam = (getParam('integration') || getParam('integrationLevel') || '').trim().toLowerCase()
  let integrationLevel: IntegrationLevel = mode === 'embedded' ? 'full' : 'full'
  if (integrationParam) {
    if (integrationParam === 'minimal') integrationLevel = 'minimal'
    else if (integrationParam === 'full') integrationLevel = 'full'
    else warnings.push(`Invalid integration level '${integrationParam}', defaulting to 'full'.`)
  }

  // -------- UI config --------
  const baseUi = mode === 'embedded' ? defaultEmbeddedUi() : defaultStandaloneUi()

  const requestedUi: EditorUiConfig = {
    ...baseUi,
    showComponentLibrary: parseBool(getParam('showLibrary') ?? getParam('showComponentLibrary')) ?? baseUi.showComponentLibrary,
    showPropsPanel: parseBool(getParam('showProps') ?? getParam('showPropsPanel')) ?? baseUi.showPropsPanel,
    showTopLeft: parseBool(getParam('showTopLeft')) ?? baseUi.showTopLeft,
    showToolbar: parseBool(getParam('showToolbar')) ?? baseUi.showToolbar,
    showTopRight: parseBool(getParam('showTopRight')) ?? baseUi.showTopRight,
    toolbarItems: parseCsv(getParam('toolbarItems')),
  }

  if (mode === 'standalone') {
    // In standalone mode, always show full UI by default; allow overrides for debugging.
    return { mode, integrationLevel: 'full', ui: requestedUi, warnings }
  }

  if (integrationLevel === 'minimal') {
    const anyNonMinimalRequested =
      requestedUi.showComponentLibrary ||
      requestedUi.showPropsPanel ||
      requestedUi.showTopLeft ||
      requestedUi.showToolbar ||
      requestedUi.showTopRight

    if (anyNonMinimalRequested) {
      warnings.push('Minimal integration ignores non-minimal UI flags (library/props/top/toolbar).')
    }

    return {
      mode,
      integrationLevel,
      ui: {
        showComponentLibrary: false,
        showPropsPanel: false,
        showTopLeft: false,
        showToolbar: false,
        showTopRight: false,
        toolbarItems: undefined,
      },
      warnings,
    }
  }

  // Embedded + full
  return { mode, integrationLevel, ui: requestedUi, warnings }
}
