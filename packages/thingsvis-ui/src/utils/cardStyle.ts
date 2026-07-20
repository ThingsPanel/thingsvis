import type { IBaseStyle, ICardStyle } from '@thingsvis/schema';

export const CARD_STYLE_DEFAULTS: Required<
  Pick<IBaseStyle, 'background' | 'border' | 'shadow' | 'padding'>
> = {
  background: { color: '#ffffff', opacity: 1 },
  border: { width: 1, color: 'rgba(148, 163, 184, 0.3)', style: 'solid', radius: 10 },
  shadow: { offsetX: 0, offsetY: 2, blur: 8, color: 'rgba(15, 23, 42, 0.08)' },
  padding: 12,
};

export function isCardModeEnabled(baseStyle?: Partial<IBaseStyle> | null): boolean {
  return baseStyle?.card?.enabled === true;
}

export function resolveCardTitle(card: ICardStyle | undefined, nodeName?: string): string {
  const explicit = card?.title?.trim();
  if (explicit) return explicit;
  return nodeName?.trim() || '';
}

export function shouldShowCardHeader(card: ICardStyle | undefined, nodeName?: string): boolean {
  if (!card?.enabled) return false;
  if (resolveCardTitle(card, nodeName)) return true;
  if (card.showSubtitle && card.subtitle?.trim()) return true;
  return false;
}

export function applyCardStyleDefaults(baseStyle: Partial<IBaseStyle> = {}): Partial<IBaseStyle> {
  const next: Partial<IBaseStyle> = { ...baseStyle };
  if (!next.background?.color && !next.background?.image) {
    next.background = { ...(next.background ?? {}), ...CARD_STYLE_DEFAULTS.background };
  }
  if (next.border?.width == null && !next.border?.color && next.border?.radius == null) {
    next.border = { ...(next.border ?? {}), ...CARD_STYLE_DEFAULTS.border };
  }
  if (next.shadow?.blur == null && !next.shadow?.color) {
    next.shadow = { ...(next.shadow ?? {}), ...CARD_STYLE_DEFAULTS.shadow };
  }
  if (next.padding == null) {
    next.padding = CARD_STYLE_DEFAULTS.padding;
  }
  return next;
}

export function removeCardStyleDefaults(baseStyle: Partial<IBaseStyle> = {}): Partial<IBaseStyle> {
  const next: Partial<IBaseStyle> = { ...baseStyle };
  const background = next.background;
  const border = next.border;
  const shadow = next.shadow;

  if (
    background &&
    background.color === CARD_STYLE_DEFAULTS.background.color &&
    !background.image &&
    (background.opacity ?? CARD_STYLE_DEFAULTS.background.opacity) ===
      CARD_STYLE_DEFAULTS.background.opacity
  ) {
    delete next.background;
  }

  if (
    border &&
    border.width === CARD_STYLE_DEFAULTS.border.width &&
    border.color === CARD_STYLE_DEFAULTS.border.color &&
    (border.style ?? CARD_STYLE_DEFAULTS.border.style) === CARD_STYLE_DEFAULTS.border.style &&
    border.radius === CARD_STYLE_DEFAULTS.border.radius
  ) {
    delete next.border;
  }

  if (
    shadow &&
    shadow.offsetX === CARD_STYLE_DEFAULTS.shadow.offsetX &&
    shadow.offsetY === CARD_STYLE_DEFAULTS.shadow.offsetY &&
    shadow.blur === CARD_STYLE_DEFAULTS.shadow.blur &&
    shadow.color === CARD_STYLE_DEFAULTS.shadow.color
  ) {
    delete next.shadow;
  }

  if (next.padding === CARD_STYLE_DEFAULTS.padding) {
    delete next.padding;
  }

  return next;
}

export function syncCardHeaderElement(
  headerEl: HTMLElement,
  card: ICardStyle | undefined,
  nodeName?: string,
  titleColor = '#0f172a',
  subtitleColor = 'rgba(100, 116, 139, 0.9)',
): void {
  const showHeader = shouldShowCardHeader(card, nodeName);
  headerEl.style.display = showHeader ? 'block' : 'none';
  if (!showHeader || !card) return;

  const title = resolveCardTitle(card, nodeName);
  const titleEl = headerEl.querySelector<HTMLElement>('[data-card-shell-title]');
  const subtitleEl = headerEl.querySelector<HTMLElement>('[data-card-shell-subtitle]');

  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.display = title ? 'block' : 'none';
    titleEl.style.fontSize = `${card.titleFontSize ?? 16}px`;
    titleEl.style.fontWeight = '600';
    titleEl.style.lineHeight = '1.2';
    titleEl.style.color = titleColor;
    titleEl.style.fontFamily = 'Inter, "Noto Sans SC", "Noto Sans", sans-serif';
  }

  if (subtitleEl) {
    const subtitle = card.subtitle?.trim() ?? '';
    const showSubtitle = card.showSubtitle === true && !!subtitle;
    subtitleEl.style.display = showSubtitle ? 'block' : 'none';
    subtitleEl.textContent = subtitle;
    subtitleEl.style.marginTop = '6px';
    subtitleEl.style.fontSize = '12px';
    subtitleEl.style.lineHeight = '1.4';
    subtitleEl.style.color = subtitleColor;
    subtitleEl.style.fontFamily = 'Inter, "Noto Sans SC", "Noto Sans", sans-serif';
  }
}

export function createCardHeaderElement(): HTMLDivElement {
  const headerEl = document.createElement('div');
  headerEl.dataset.cardShellHeader = 'true';
  headerEl.style.flex = '0 0 auto';
  headerEl.style.marginBottom = '12px';

  const titleEl = document.createElement('div');
  titleEl.dataset.cardShellTitle = 'true';

  const subtitleEl = document.createElement('div');
  subtitleEl.dataset.cardShellSubtitle = 'true';

  headerEl.append(titleEl, subtitleEl);
  return headerEl;
}
