/**
 * ColorInput — unified color picker component used across all right-panel sections.
 *
 * Layout: [checkered transparent btn] [native swatch] [free-text input]
 *
 * The wrapper div uses `focus-within:ring-inset` so the focus ring renders inward
 * and is never clipped by ancestor overflow-hidden containers.
 */
import React from 'react';

/** Checkerboard pattern representing a transparent/no-color swatch. */
const CHECKERBOARD_STYLE: React.CSSProperties = {
  background:
    'linear-gradient(45deg, #ccc 25%, transparent 25%), ' +
    'linear-gradient(-45deg, #ccc 25%, transparent 25%), ' +
    'linear-gradient(45deg, transparent 75%, #ccc 75%), ' +
    'linear-gradient(-45deg, transparent 75%, #ccc 75%)',
  backgroundSize: '6px 6px',
  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
};

export interface ColorInputProps {
  /** Current CSS color string: '#rrggbb', 'rgba(...)', 'transparent', or '' */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Derive a safe `#rrggbb` value for the native `<input type="color">` swatch.
 * Native color inputs only accept the `#rrggbb` format; fall back to black otherwise.
 */
function toSwatchHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    // Expand shorthand #rgb → #rrggbb
    const [, r, g, b] = value.match(/^#(.)(.)(.)$/)!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return '#000000';
}

export function ColorInput({ value, onChange, placeholder, className }: ColorInputProps) {
  const isTransparent = value === 'transparent' || value === '';

  return (
    <div
      className={`flex gap-1 items-center bg-background rounded-sm border border-input p-1 focus-within:ring-1 focus-within:ring-inset focus-within:ring-ring ${className ?? ''}`}
    >
      {/* Transparent swatch button */}
      <button
        type="button"
        onClick={() => onChange('transparent')}
        title="Transparent"
        className={`w-5 h-5 rounded-sm overflow-hidden flex-shrink-0 border ${
          isTransparent
            ? 'ring-1 ring-inset ring-ring border-transparent'
            : 'border-transparent hover:border-muted-foreground/30'
        }`}
        style={CHECKERBOARD_STYLE}
      />

      {/* Native color swatch — decorative only for non-hex values */}
      <input
        type="color"
        value={toSwatchHex(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 p-0 border-0 overflow-hidden rounded-sm cursor-pointer flex-shrink-0 appearance-none"
      />

      {/* Free-text input */}
      <input
        value={isTransparent ? '' : (value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'TRANSPARENT/HEX/RGBA'}
        className="flex-1 h-5 text-xs font-mono bg-transparent outline-none px-1 uppercase w-full min-w-10"
      />
    </div>
  );
}
