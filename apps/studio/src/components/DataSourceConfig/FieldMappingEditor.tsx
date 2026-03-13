import React, { useState } from 'react';
import type { FieldMappingConfig, FieldMappingRule } from '@thingsvis/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';

interface FieldMappingEditorProps {
  value: FieldMappingConfig;
  onChange: (value: FieldMappingConfig) => void;
  /** Optional: available source field names to hint path completion */
  sourceFields?: string[];
}

const AGGREGATE_OPTIONS: { value: FieldMappingRule['aggregate']; label: string }[] = [
  { value: 'none', label: '保持原样' },
  { value: 'last', label: '最后一个' },
  { value: 'first', label: '第一个' },
  { value: 'sum', label: '求和' },
  { value: 'avg', label: '平均值' },
];

/**
 * FieldMappingEditor — inline editor for JSONPath field mapping rules.
 * Allows adding/editing/removing rules that extract fields from raw adapter data.
 */
export const FieldMappingEditor: React.FC<FieldMappingEditorProps> = ({ value, onChange }) => {
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');

  function addRule() {
    if (!newFrom.trim() || !newTo.trim()) return;
    const rule: FieldMappingRule = {
      from: newFrom.trim(),
      to: newTo.trim(),
      aggregate: 'none',
    };
    onChange({ ...value, rules: [...value.rules, rule] });
    setNewFrom('');
    setNewTo('');
  }

  function removeRule(idx: number) {
    const rules = value.rules.filter((_, i) => i !== idx);
    onChange({ ...value, rules });
  }

  function updateRule(idx: number, patch: Partial<FieldMappingRule>) {
    const rules = value.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange({ ...value, rules });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          字段映射 (JSONPath)
        </Label>
        <span className="text-xs text-muted-foreground">{value.rules.length} 条规则</span>
      </div>

      {/* Existing rules table */}
      {value.rules.length > 0 && (
        <div className="rounded-lg border border-input overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground font-medium">
            <span>来源路径 (JSONPath)</span>
            <span>输出字段名</span>
            <span>聚合方式</span>
            <span />
          </div>
          {/* Rows */}
          {value.rules.map((rule, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[1fr_1fr_100px_32px] gap-2 px-3 py-2 border-t border-input items-center"
            >
              <Input
                value={rule.from}
                onChange={(e) => updateRule(idx, { from: e.target.value })}
                className="h-7 text-xs font-mono"
                placeholder="$.items[*].val"
              />
              <Input
                value={rule.to}
                onChange={(e) => updateRule(idx, { to: e.target.value })}
                className="h-7 text-xs"
                placeholder="outputField"
              />
              <Select
                value={rule.aggregate}
                onValueChange={(v: string) =>
                  updateRule(idx, { aggregate: v as FieldMappingRule['aggregate'] })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGGREGATE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                onClick={() => removeRule(idx)}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new rule */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">来源路径</Label>
          <Input
            value={newFrom}
            onChange={(e) => setNewFrom(e.target.value)}
            placeholder="$.results[*].temperature"
            className="h-8 text-xs font-mono"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addRule();
            }}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">输出字段名</Label>
          <Input
            value={newTo}
            onChange={(e) => setNewTo(e.target.value)}
            placeholder="temperature"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addRule();
            }}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addRule}
          disabled={!newFrom.trim() || !newTo.trim()}
          className="h-8 px-3"
        >
          <Plus size={14} className="mr-1" />
          添加
        </Button>
      </div>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground">
        示例：<code className="text-[11px] bg-muted px-1 rounded">$.data[*].value</code> →
        提取数组中所有元素的 <code className="text-[11px] bg-muted px-1 rounded">value</code> 字段
      </p>
    </div>
  );
};
