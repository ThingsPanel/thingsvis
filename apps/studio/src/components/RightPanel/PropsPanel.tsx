import React, { useCallback } from "react";
import { useSyncExternalStore } from "react";
import type { KernelStore, KernelState } from "@thingsvis/kernel";
import { Input } from "@/components/ui/input";

type Props = {
  nodeId: string;
  kernelStore: KernelStore;
  language: string;
};

export default function PropsPanel({ nodeId, kernelStore, language }: Props) {
  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  const node = state.nodesById[nodeId];
  if (!node) return null;

  const schema = node.schemaRef as any;

  function updateNode(changes: any) {
    kernelStore.getState().updateNode(nodeId, changes);
  }

  const labelZh = (zh: string, en: string) => language === "zh" ? zh : en;

  return (
    <div className="space-y-4">
      {/* Position */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {labelZh("几何布局", "Geometry")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">X</label>
            <Input
              type="number"
              value={schema.position.x}
              onChange={(e) => updateNode({ position: { x: Number(e.target.value) } })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">Y</label>
            <Input
              type="number"
              value={schema.position.y}
              onChange={(e) => updateNode({ position: { x: Number(e.target.value) } })}
              className="h-8 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              {labelZh("宽度", "Width")}
            </label>
            <Input
              type="number"
              value={schema.size?.width ?? 0}
              onChange={(e) => updateNode({ size: { width: Number(e.target.value) } })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">
              {labelZh("高度", "Height")}
            </label>
            <Input
              type="number"
              value={schema.size?.height ?? 0}
              onChange={(e) => updateNode({ size: { height: Number(e.target.value) } })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Basic Props */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {labelZh("核心属性", "Properties")}
        </h3>
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">ID</label>
          <Input value={node.id} readOnly className="h-8 text-sm bg-muted" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-medium text-muted-foreground uppercase">
            {labelZh("类型", "Type")}
          </label>
          <Input value={schema.type} readOnly className="h-8 text-sm bg-muted" />
        </div>
      </div>
    </div>
  );
}
