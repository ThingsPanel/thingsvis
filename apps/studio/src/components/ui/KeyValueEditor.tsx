/**
 * KeyValueEditor: Dynamic key-value pair editor
 * 
 * A reusable component for editing key-value pairs like HTTP headers,
 * query parameters, etc. Supports add, edit, and remove operations.
 * 
 * @feature 009-datasource-form-config
 */

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface KeyValueEditorProps {
  /** Current key-value pairs */
  value: Record<string, string>;
  /** Callback when pairs change */
  onChange: (value: Record<string, string>) => void;
  /** Placeholder for key input (default: "Key") */
  keyPlaceholder?: string;
  /** Placeholder for value input (default: "Value") */
  valuePlaceholder?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** Keys that should show a warning (e.g., when conflicting with auth) */
  warningKeys?: string[];
  /** Warning message to show for conflicting keys */
  warningMessage?: string;
}

export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  disabled = false,
  className,
  warningKeys = [],
  warningMessage,
}: KeyValueEditorProps) {
  // Convert record to array for easier manipulation
  const pairs: KeyValuePair[] = React.useMemo(() => {
    return Object.entries(value).map(([key, val]) => ({ key, value: val }));
  }, [value]);

  const updatePairs = (newPairs: KeyValuePair[]) => {
    const newValue: Record<string, string> = {};
    for (const pair of newPairs) {
      // Allow empty keys to be added to the record so the UI updates
      // Note: Duplicate keys will overwrite each other, which is a limitation of Record<string, string>
      newValue[pair.key] = pair.value;
    }
    onChange(newValue);
  };

  const handleAdd = () => {
    updatePairs([...pairs, { key: '', value: '' }]);
  };

  const handleRemove = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    updatePairs(newPairs);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const newPairs = [...pairs];
    const currentPair = newPairs[index];
    if (currentPair) {
      newPairs[index] = { key: newKey, value: currentPair.value };
      updatePairs(newPairs);
    }
  };

  const handleValueChange = (index: number, newValue: string) => {
    const newPairs = [...pairs];
    const currentPair = newPairs[index];
    if (currentPair) {
      newPairs[index] = { key: currentPair.key, value: newValue };
      updatePairs(newPairs);
    }
  };

  const hasWarning = (key: string): boolean => {
    return warningKeys.some(
      (wk) => wk.toLowerCase() === key.toLowerCase()
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {pairs.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          暂无条目。点击“添加”按钮创建一个。
        </p>
      )}
      
      {pairs.map((pair, index) => (
        <div key={index} className="flex gap-2 items-start">
          <div className="flex-1 space-y-1">
            <Input
              value={pair.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder={keyPlaceholder}
              disabled={disabled}
              className={cn(
                hasWarning(pair.key) && 'border-amber-500 focus-visible:ring-amber-500'
              )}
            />
            {hasWarning(pair.key) && warningMessage && (
              <p className="text-xs text-amber-600">{warningMessage}</p>
            )}
          </div>
          <div className="flex-1">
            <Input
              value={pair.value}
              onChange={(e) => handleValueChange(index, e.target.value)}
              placeholder={valuePlaceholder}
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => handleRemove(index)}
            disabled={disabled}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        添加
      </Button>
    </div>
  );
}
