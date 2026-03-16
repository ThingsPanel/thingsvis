import React, { useEffect, useState } from 'react';
import { Input } from './input';

type NumericMode = 'int' | 'float';

export interface NumericInputProps extends Omit<
  React.ComponentProps<'input'>,
  'defaultValue' | 'inputMode' | 'onChange' | 'type' | 'value'
> {
  allowEmpty?: boolean;
  max?: number;
  min?: number;
  mode?: NumericMode;
  onValueChange: (value: number | undefined) => void;
  value: number | undefined;
}

function formatValue(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) return '';
  return String(value);
}

function isPartialNumber(value: string) {
  return /^[-+]?(?:\d+)?(?:\.\d*)?$/.test(value);
}

function isStableNumber(value: string) {
  return /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value);
}

function clampValue(value: number, min?: number, max?: number) {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

function parseValue(value: string, mode: NumericMode) {
  const parsed = mode === 'int' ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function NumericInput({
  allowEmpty = false,
  max,
  min,
  mode = 'float',
  onBlur,
  onFocus,
  onKeyDown,
  onValueChange,
  value,
  ...props
}: NumericInputProps) {
  const [draft, setDraft] = useState(() => formatValue(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(formatValue(value));
    }
  }, [focused, value]);

  const commitDraft = (rawValue: string) => {
    const trimmed = rawValue.trim();

    if (trimmed === '') {
      if (allowEmpty) {
        onValueChange(undefined);
        setDraft('');
      } else {
        setDraft(formatValue(value));
      }
      return;
    }

    if (!isStableNumber(trimmed)) {
      setDraft(formatValue(value));
      return;
    }

    const parsed = parseValue(trimmed, mode);
    if (parsed === null) {
      setDraft(formatValue(value));
      return;
    }

    const nextValue = clampValue(parsed, min, max);
    onValueChange(nextValue);
    setDraft(String(nextValue));
  };

  return (
    <Input
      {...props}
      type="text"
      inputMode={mode === 'int' ? 'numeric' : 'decimal'}
      value={draft}
      onChange={(e) => {
        const nextDraft = e.target.value;
        if (nextDraft !== '' && !isPartialNumber(nextDraft)) return;

        setDraft(nextDraft);

        if (nextDraft === '') {
          if (allowEmpty) {
            onValueChange(undefined);
          }
          return;
        }

        if (!isStableNumber(nextDraft)) return;

        const parsed = parseValue(nextDraft, mode);
        if (parsed === null) return;

        onValueChange(clampValue(parsed, min, max));
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        commitDraft(e.target.value);
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
    />
  );
}
