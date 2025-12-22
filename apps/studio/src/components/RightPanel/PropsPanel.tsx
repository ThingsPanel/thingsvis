import React from "react";
import type { ComponentPropsSchema } from "@thingsvis/schema";

type Props = {
  propsSchema?: Record<string, any>;
  propsValue?: Record<string, any>;
  onChange?: (next: Record<string, any>) => void;
};

export default function PropsPanel({ propsSchema = {}, propsValue = {}, onChange }: Props) {
  function handleFieldChange(key: string, value: any) {
    onChange?.({ ...propsValue, [key]: value });
  }

  // propsSchema is expected to be a Zod-like description or plain object mapping.
  const entries = Object.keys(propsSchema);

  if (entries.length === 0) {
    return <div className="p-2 text-sm text-muted-foreground">No props available</div>;
  }

  return (
    <div className="space-y-2 p-2">
      {entries.map((key) => {
        const meta = propsSchema[key];
        const val = propsValue[key];
        const type = meta?.type ?? typeof val ?? "string";
        if (type === "boolean") {
          return (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={!!val} onChange={(e) => handleFieldChange(key, e.target.checked)} />
              <span>{key}</span>
            </label>
          );
        }
        return (
          <label key={key} className="flex flex-col">
            <span className="text-xs text-foreground">{key}</span>
            <input value={val ?? ""} onChange={(e) => handleFieldChange(key, e.target.value)} className="border p-1 rounded" />
          </label>
        );
      })}
    </div>
  );
}


