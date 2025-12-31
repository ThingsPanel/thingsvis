/**
 * JsonEditor: Code editor for JSON with syntax highlighting and validation
 * 
 * A reusable component for editing JSON content with real-time syntax
 * highlighting and validation error display.
 * 
 * @feature 009-datasource-form-config
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface JsonEditorProps {
  /** Current JSON string value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Minimum height of the editor */
  minHeight?: string;
  /** Additional className */
  className?: string;
  /** Whether to validate JSON on change (default: true) */
  validateOnChange?: boolean;
}

export interface JsonValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string): JsonValidationResult {
  if (!jsonString || jsonString.trim() === '') {
    return { valid: true }; // Empty is valid (no body)
  }
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Format/prettify JSON string
 */
export function formatJson(jsonString: string): string {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString; // Return as-is if invalid
  }
}

export function JsonEditor({
  value,
  onChange,
  placeholder = '{\n  "key": "value"\n}',
  disabled = false,
  minHeight = '120px',
  className,
  validateOnChange = true,
}: JsonEditorProps) {
  const [error, setError] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (validateOnChange) {
      const result = validateJson(value);
      setError(result.error);
    }
  }, [value, validateOnChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleFormat = () => {
    if (!disabled && value.trim()) {
      const formatted = formatJson(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key inserts 2 spaces instead of changing focus
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      // Set cursor position after inserted spaces
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{ minHeight }}
          className={cn(
            'w-full font-mono text-sm p-3 rounded-sm border bg-background',
            'resize-y focus:outline-none focus:ring-2 focus:ring-ring',
            error ? 'border-destructive focus:ring-destructive' : 'border-input',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        
        {/* Format button */}
        {value.trim() && !disabled && (
          <button
            type="button"
            onClick={handleFormat}
            className={cn(
              'absolute top-2 right-2 px-2 py-1 text-xs rounded',
              'bg-muted hover:bg-accent text-muted-foreground',
              'transition-colors'
            )}
          >
            Format
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-start gap-1">
          <span className="shrink-0">⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
