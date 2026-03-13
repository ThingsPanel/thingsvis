import {
  mergeWithDefaultAggregatePlatformFields,
  normalizePlatformFieldScope,
  type PlatformFieldScope,
} from './default-platform-fields';

export type EditorServiceMode = 'standalone' | 'embedded';
export type IntegrationLevel = 'full' | 'minimal';

export type EditorUiConfig = {
  /** Left panel (component library / layers) */
  showComponentLibrary: boolean;
  /** Right panel (properties) */
  showPropsPanel: boolean;
  /** Top-left region (logo/title/status) */
  showTopLeft: boolean;
  /** Top-center tools */
  showToolbar: boolean;
  /** Top-right region (language/theme/preview/publish) */
  showTopRight: boolean;
  /** Filter for tool ids shown in toolbar */
  toolbarItems?: string[];
};

export type PlatformField = {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'json';
  dataType: 'attribute' | 'telemetry' | 'command' | 'event';
  unit?: string;
  description?: string;
};

export type SaveTarget = 'self' | 'host';

export type EditorServiceConfig = {
  mode: EditorServiceMode;
  integrationLevel: IntegrationLevel;
  ui: EditorUiConfig;
  saveTarget?: SaveTarget;
  platformFieldScope?: PlatformFieldScope;
  platformFields?: PlatformField[];
  warnings: string[];
};

const getHashParams = (): URLSearchParams | null => {
  try {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return null;
    const queryString = hash.slice(queryIndex + 1);
    return new URLSearchParams(queryString);
  } catch (e) {
    return null;
  }
};

const getParam = (key: string): string | null => {
  const hashParams = getHashParams();
  if (hashParams?.has(key)) {
    return hashParams.get(key);
  }
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  } catch (e) {
    return null;
  }
};

const parseBool = (value: string | null | undefined): boolean | undefined => {
  if (value == null) return undefined;
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return undefined;
};

const parseCsv = (value: string | null | undefined): string[] | undefined => {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
};

const defaultStandaloneUi = (): EditorUiConfig => ({
  showComponentLibrary: true,
  showPropsPanel: true,
  showTopLeft: true,
  showToolbar: true,
  showTopRight: true,
});

const defaultEmbeddedUi = (): EditorUiConfig => ({
  // Default to full UI to remain usable if host forgot to configure.
  showComponentLibrary: true,
  showPropsPanel: true,
  showTopLeft: true,
  showToolbar: true,
  showTopRight: true,
});

export function resolveEditorServiceConfig(): EditorServiceConfig {
  const warnings: string[] = [];

  // -------- Mode --------
  const embeddedFlag = parseBool(getParam('embedded'));
  const modeParam = (getParam('mode') || '').trim().toLowerCase();

  let mode: EditorServiceMode = 'standalone';
  if (embeddedFlag === true || modeParam === 'embedded') {
    mode = 'embedded';
  } else if (modeParam && modeParam !== 'standalone') {
    warnings.push(`Invalid mode '${modeParam}', falling back to standalone.`);
  }

  // -------- Integration level --------
  const integrationParam = (getParam('integration') || getParam('integrationLevel') || '')
    .trim()
    .toLowerCase();
  let integrationLevel: IntegrationLevel = mode === 'embedded' ? 'full' : 'full';
  if (integrationParam) {
    if (integrationParam === 'minimal') integrationLevel = 'minimal';
    else if (integrationParam === 'full') integrationLevel = 'full';
    else warnings.push(`Invalid integration level '${integrationParam}', defaulting to 'full'.`);
  }

  // -------- UI config --------
  const baseUi = mode === 'embedded' ? defaultEmbeddedUi() : defaultStandaloneUi();

  const requestedUi: EditorUiConfig = {
    ...baseUi,
    showComponentLibrary:
      parseBool(getParam('showLibrary') ?? getParam('showComponentLibrary')) ??
      baseUi.showComponentLibrary,
    showPropsPanel:
      parseBool(getParam('showProps') ?? getParam('showPropsPanel')) ?? baseUi.showPropsPanel,
    showTopLeft: parseBool(getParam('showTopLeft')) ?? baseUi.showTopLeft,
    showToolbar: parseBool(getParam('showToolbar')) ?? baseUi.showToolbar,
    showTopRight: parseBool(getParam('showTopRight')) ?? baseUi.showTopRight,
    toolbarItems: parseCsv(getParam('toolbarItems')),
  };

  if (mode === 'standalone') {
    // In standalone mode, always show full UI by default; allow overrides for debugging.
    return { mode, integrationLevel: 'full', ui: requestedUi, warnings };
  }

  // -------- Save target --------
  const saveTargetParam = getParam('saveTarget');
  const saveTarget: SaveTarget | undefined =
    saveTargetParam === 'host' || saveTargetParam === 'self'
      ? (saveTargetParam as SaveTarget)
      : undefined;

  const platformFieldScope = normalizePlatformFieldScope(
    getParam('platformFieldScope') || getParam('roleScope') || getParam('role'),
  );

  // -------- Platform fields --------
  // Embedded mode always exposes a small built-in aggregate field set so
  // homepage/dashboard widgets can bind value-card and line-chart data even
  // before the host injects a richer schema.
  let platformFields: PlatformField[] | undefined = mergeWithDefaultAggregatePlatformFields(
    [],
    platformFieldScope,
  ) as PlatformField[];

  try {
    const fieldsParam = getParam('platformFields');
    if (fieldsParam) {
      // URLSearchParams.get() already decodes the parameter, no need to decode again
      const parsed = JSON.parse(fieldsParam) as PlatformField[];
      platformFields = mergeWithDefaultAggregatePlatformFields(
        parsed,
        platformFieldScope,
      ) as PlatformField[];
    }
  } catch (e) {
    warnings.push('Failed to parse platform fields');
  }

  // -------- Integration level handling --------
  if (integrationLevel === 'minimal') {
    if (
      requestedUi.showComponentLibrary !== undefined ||
      requestedUi.showPropsPanel !== undefined ||
      requestedUi.showTopLeft !== undefined ||
      requestedUi.showToolbar !== undefined ||
      requestedUi.showTopRight !== undefined ||
      requestedUi.toolbarItems !== undefined
    ) {
      warnings.push(
        'Minimal integration ignores non-minimal UI flags (library/props/top/toolbar).',
      );
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
      saveTarget,
      platformFieldScope,
      platformFields,
      warnings,
    };
  }

  // Embedded + full
  return {
    mode,
    integrationLevel,
    ui: requestedUi,
    saveTarget,
    platformFieldScope,
    platformFields,
    warnings,
  };
}
