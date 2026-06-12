import { defineWidget, resolveWidgetColors } from '@thingsvis/widget-sdk';
import { PropsSchema, type Props } from './schema';
import { SAMPLE_LIST_ITEMS_JSON } from './sample-data';
import { metadata } from './metadata';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

function resolveColor(value: string | undefined, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : fallback;
}

type ParsedRow = { iconCell: string; left: string; right: string };

function pickKnown(obj: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const v = obj[k];
      if (v !== undefined) return v;
    }
  }
  return undefined;
}

function stringifyField(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v);
}

function rowFromJsonItem(raw: unknown): ParsedRow | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    const left = String(raw).trim();
    return left ? { iconCell: '', left, right: '' } : null;
  }
  if (typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const iconRaw = pickKnown(obj, ['icon', 'leading', 'leadingIcon', 'bullet'] as const);
  const leftRaw = pickKnown(obj, ['left', 'leftText', 'label', 'name', 'title'] as const);
  const rightRaw = pickKnown(obj, ['right', 'rightText', 'value', 'text', 'subtitle'] as const);

  const iconCell = stringifyField(iconRaw).trim();
  const left = stringifyField(leftRaw);
  const right = stringifyField(rightRaw);

  if (!iconCell && !left && !right) return null;
  return { iconCell, left, right };
}

/** 顶层为数组、单行对象、`{ items|rows|data: [...] }`；绑定可把数组序列化为 JSON 传入 */
function parseRowsFromItemsJson(itemsJson: string): ParsedRow[] {
  try {
    let raw: unknown = JSON.parse(itemsJson);

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const nest = pickKnown(raw as Record<string, unknown>, ['items', 'rows', 'data'] as const);
      if (Array.isArray(nest)) raw = nest;
    }

    if (!Array.isArray(raw)) {
      const one = rowFromJsonItem(raw);
      return one ? [one] : [];
    }

    const out: ParsedRow[] = [];
    for (const item of raw) {
      const row = rowFromJsonItem(item);
      if (row) out.push(row);
    }
    return out;
  } catch {
    return [];
  }
}

/* -------- 迁移：TAB 分列旧数据 -------- */

function splitLegacyTabLine(line: string): ParsedRow {
  const parts = line.split('\t');
  if (parts.length === 1) {
    const left = parts[0]!.trim();
    return { iconCell: '', left, right: '' };
  }
  if (parts.length === 2) {
    return { iconCell: '', left: parts[0]!.trim(), right: parts[1]!.trim() };
  }
  const iconCell = parts[0]!.trim();
  const left = parts[1]!.trim();
  const right = parts.slice(2).join('\t').trim();
  return { iconCell, left, right };
}

function rowsFromLegacyTabText(text: string): ParsedRow[] {
  return text
    .split(/\r?\n/)
    .map(splitLegacyTabLine)
    .filter((r) => r.left || r.right || r.iconCell);
}

function tabTextToItemsJson(text: string): string {
  const rows = rowsFromLegacyTabText(text);
  const items = rows.map((r) => ({
    ...(r.iconCell ? { icon: r.iconCell } : { icon: '' }),
    left: r.left,
    right: r.right,
  }));
  return JSON.stringify(items, null, 2);
}

const UNORDERED_GLYPH: Record<Exclude<Props['unorderedMarker'], 'custom'>, string> = {
  disc: '\u2022',
  circle: '\u25cf',
  square: '\u25a0',
  dash: '\u2013',
  check: '\u2713',
};

function unorderedGlyph(props: Props): string {
  if (props.unorderedMarker === 'custom') return props.customBullet || '\u2022';
  return UNORDERED_GLYPH[props.unorderedMarker];
}

function formatOrderedIndex(style: Props['numberStyle'], n: number): string {
  const s = String(n);
  if (style === 'dot') return `${s}.`;
  if (style === 'parenClose') return `${s})`;
  if (style === 'parenAround') return `(${s})`;
  return s;
}

function safeImageSrc(raw: string): string | null {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t) && !/[\s"'<>]/.test(t)) return t;
  if (/^data:image\/(png|jpeg|jpg|gif|webp|bmp|svg\+xml);base64,/i.test(t)) return t;
  return null;
}

function populateLeading(
  cell: HTMLElement,
  row: ParsedRow,
  props: Props,
  index: number,
  colorsPrimary: string,
): void {
  cell.innerHTML = '';
  cell.style.display = 'flex';
  cell.style.alignItems = 'center';
  cell.style.justifyContent = 'center';
  cell.style.flexShrink = '0';

  const leadColor = resolveColor(props.leadingColor, colorsPrimary);
  const size = props.leadingFontSize;

  if (row.iconCell) {
    const src = safeImageSrc(row.iconCell);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      img.style.height = `${Math.max(size, 14)}px`;
      img.style.width = 'auto';
      img.style.maxWidth = `${Math.min(120, Math.max(28, size * 4))}px`;
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      cell.appendChild(img);
      return;
    }

    const t = document.createElement('span');
    t.textContent = row.iconCell;
    t.style.fontSize = `${size}px`;
    t.style.color = leadColor;
    t.style.lineHeight = `1`;
    cell.appendChild(t);
    return;
  }

  if (props.listMode === 'unordered') {
    const t = document.createElement('span');
    t.textContent = unorderedGlyph(props);
    t.style.fontSize = `${size}px`;
    t.style.fontWeight = '700';
    t.style.color = leadColor;
    t.style.lineHeight = `1`;
    cell.appendChild(t);
    return;
  }

  const n = props.orderStart + index;
  const t = document.createElement('span');
  t.textContent = formatOrderedIndex(props.numberStyle, n);
  t.style.fontSize = `${size}px`;
  t.style.fontWeight = '700';
  t.style.fontVariantNumeric = 'tabular-nums';
  t.style.color = leadColor;
  t.style.lineHeight = `1`;
  t.style.whiteSpace = 'nowrap';
  cell.appendChild(t);
}

function renderList(element: HTMLElement, props: Props): void {
  const colors = resolveWidgetColors(element);
  const fg = colors.fg || '#e2e8f0';
  const primary = colors.primary || '#38bdf8';
  const shell = element.firstElementChild as HTMLDivElement | null;
  const body = shell?.querySelector<HTMLDivElement>('[data-list-body]');
  if (!shell || !body) return;

  shell.style.cssText =
    [
      'width:100%',
      'height:100%',
      'box-sizing:border-box',
      'display:flex',
      'flex-direction:column',
      'background:transparent',
      'border:none',
      'margin:0',
      'padding:0',
      'font-family:inherit',
    ].join(';');

  const rows = parseRowsFromItemsJson(props.itemsJson);
  body.innerHTML = '';
  body.style.flex = '1 1 auto';
  body.style.minHeight = '0';
  body.style.overflow = 'auto';
  body.style.display = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap = `${props.rowGap}px`;

  const leftColor = resolveColor(props.leftColor, fg);
  const rightColor = resolveColor(props.rightColor, fg);

  const gridCols = [
    props.showLeading ? 'auto' : null,
    props.showLeftText ? 'minmax(0,1fr)' : null,
    props.showRightText ? 'auto' : null,
  ]
    .filter(Boolean)
    .join(' ');
  const colGapPx = Math.max(Math.round(Math.min(props.leftFontSize, props.rightFontSize) * 0.6), 6);

  const anyColumnVisible = props.showLeading || props.showLeftText || props.showRightText;
  if (!anyColumnVisible) {
    return;
  }

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    const rowEl = document.createElement('div');
    rowEl.style.display = 'grid';
    rowEl.style.alignItems = 'center';
    rowEl.style.columnGap = `${colGapPx}px`;
    rowEl.style.boxSizing = 'border-box';

    const hasLeading = props.showLeading;
    const leftOn = props.showLeftText;
    const rightOn = props.showRightText;

    if (gridCols) rowEl.style.gridTemplateColumns = gridCols;

    if (hasLeading) {
      const lead = document.createElement('div');
      populateLeading(lead, row, props, i, primary);
      rowEl.appendChild(lead);
    }

    if (leftOn) {
      const span = document.createElement('span');
      span.textContent = row.left;
      span.style.fontSize = `${props.leftFontSize}px`;
      span.style.color = leftColor;
      span.style.justifySelf = 'start';
      span.style.alignSelf = 'center';
      span.style.whiteSpace = 'pre-wrap';
      span.style.wordBreak = 'break-word';
      span.style.minWidth = '0';
      rowEl.appendChild(span);
    }

    if (rightOn) {
      const span = document.createElement('span');
      span.textContent = row.right;
      span.style.fontSize = `${props.rightFontSize}px`;
      span.style.fontWeight = '500';
      span.style.color = rightColor;
      span.style.justifySelf = 'end';
      span.style.alignSelf = 'center';
      span.style.whiteSpace = 'pre-wrap';
      span.style.wordBreak = 'break-word';
      span.style.textAlign = 'right';
      rowEl.appendChild(span);
    }

    body.appendChild(rowEl);
  }
}

function migrateListProps(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...src };

  if (typeof src.bulletStyle === 'string') {
    const b = src.bulletStyle;
    if (b === 'number') {
      out.listMode = 'ordered';
      out.numberStyle = out.numberStyle ?? 'dot';
    } else {
      out.listMode = 'unordered';
      if (b === 'check') out.unorderedMarker = 'check';
      else out.unorderedMarker = out.unorderedMarker ?? 'disc';
    }
    delete out.bulletStyle;
  }

  /** itemsText（TAB）→ itemsJson */
  if (typeof src.itemsText === 'string') {
    const legacy = src.itemsText;
    const legacyTrim = legacy.trim();
    const existingJsonStr = typeof out.itemsJson === 'string' ? String(out.itemsJson).trim() : '';
    const hasExistingJson =
      !!existingJsonStr &&
      (() => {
        try {
          const v = JSON.parse(existingJsonStr);
          return Array.isArray(v) || (typeof v === 'object' && v !== null);
        } catch {
          return true;
        }
      })();

    if (legacyTrim && !hasExistingJson) {
      try {
        out.itemsJson = tabTextToItemsJson(legacy);
      } catch {
        out.itemsJson = '[]';
      }
    }
    delete out.itemsText;
  }

  if (typeof out.itemsJson !== 'string') {
    out.itemsJson = '[]';
  }

  if (typeof src.accentColor === 'string' && (out.leadingColor === '' || out.leadingColor === undefined)) {
    out.leadingColor = src.accentColor;
  }

  if (typeof src.fontSize === 'number') {
    if (out.leftFontSize === undefined) out.leftFontSize = src.fontSize;
    if (out.rightFontSize === undefined) out.rightFontSize = src.fontSize;
    if (out.leadingFontSize === undefined) out.leadingFontSize = src.fontSize;
  }

  if (typeof src.textColor === 'string') {
    const tc = src.textColor;
    if (!out.leftColor) out.leftColor = tc;
    if (!out.rightColor) out.rightColor = tc;
  }

  delete out.accentColor;
  delete out.fontSize;
  delete out.textColor;
  delete out.backgroundColor;
  delete out.borderColor;
  delete out.borderWidth;
  delete out.cornerRadius;
  delete out.paddingSize;

  return out;
}

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  sampleData: { itemsJson: SAMPLE_LIST_ITEMS_JSON },
  standaloneDefaults: { itemsJson: SAMPLE_LIST_ITEMS_JSON },
  previewDefaults: { itemsJson: SAMPLE_LIST_ITEMS_JSON },
  migrate: migrateListProps,
  render: (element: HTMLElement, props: Props) => {
    let currentProps = props;
    const shell = document.createElement('div');
    const body = document.createElement('div');
    body.dataset.listBody = 'true';
    shell.append(body);
    element.appendChild(shell);
    renderList(element, currentProps);

    return {
      update: (nextProps: Props) => {
        currentProps = nextProps;
        renderList(element, currentProps);
      },
      destroy: () => {
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
