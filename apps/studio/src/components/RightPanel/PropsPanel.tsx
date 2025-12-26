import React, { useCallback, useState } from "react";
import { useSyncExternalStore } from "react";
import { Plus, Trash2, Database, Link2 } from "lucide-react";
import type { KernelStore, KernelState } from "@thingsvis/kernel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataSourceRegistry } from "@thingsvis/ui";

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

  const { states: dataSources } = useDataSourceRegistry(kernelStore);

  const node = state.nodesById[nodeId];
  if (!node) return null;

  const schema = node.schemaRef as any;
  const bindings = schema.data || [];

  function updateNode(changes: any) {
    kernelStore.getState().updateNode(nodeId, changes);
  }

  const labelZh = (zh: string, en: string) => language === "zh" ? zh : en;

  const addBinding = () => {
    // 默认绑定到 text 属性
    const newBindings = [...bindings, { targetProp: 'text', expression: '{{ ds. }}' }];
    updateNode({ data: newBindings });
  };

  const removeBinding = (index: number) => {
    const newBindings = bindings.filter((_: any, i: number) => i !== index);
    updateNode({ data: newBindings });
  };

  const updateBinding = (index: number, field: string, value: string) => {
    const newBindings = [...bindings];
    newBindings[index] = { ...newBindings[index], [field]: value };
    updateNode({ data: newBindings });
  };

  return (
    <Tabs defaultValue="style" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="style" className="text-xs">{labelZh("样式", "Style")}</TabsTrigger>
        <TabsTrigger value="data" className="text-xs">{labelZh("数据", "Data")}</TabsTrigger>
      </TabsList>

      <TabsContent value="style" className="space-y-4">
        {/* Position */}
        <div className="space-y-3 px-1">
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
        <div className="space-y-3 pt-4 border-t border-border px-1">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {labelZh("文本配置", "Content")}
          </h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">{labelZh("文本内容", "Text")}</label>
            <textarea
              value={schema.props?.text || ''}
              onChange={(e) => updateNode({ props: { text: e.target.value } })}
              className="w-full h-20 p-2 text-xs rounded-md border border-input bg-background focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none resize-none"
              placeholder={labelZh("输入静态文本", "Enter static text")}
            />
            <p className="text-[9px] text-muted-foreground italic">
              {labelZh("注：若在'数据'面板配置了绑定，此处的静态值将被覆盖。", "Note: If data binding is set, this static value will be overridden.")}
            </p>
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-3 pt-4 border-t border-border px-1">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {labelZh("样式属性", "Style")}
          </h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">{labelZh("颜色", "Fill")}</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={schema.props?.fill || '#000000'}
                onChange={(e) => updateNode({ props: { fill: e.target.value } })}
                className="w-8 h-8 p-0 border-0 overflow-hidden rounded-full cursor-pointer"
              />
              <Input
                type="text"
                value={schema.props?.fill || '#000000'}
                onChange={(e) => updateNode({ props: { fill: e.target.value } })}
                className="h-8 flex-1 text-xs"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-muted-foreground uppercase">{labelZh("字号", "Font Size")}</label>
            <Input
              type="number"
              value={schema.props?.fontSize || 16}
              onChange={(e) => updateNode({ props: { fontSize: Number(e.target.value) } })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="data" className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Link2 className="h-3 w-3 text-[#6965db]" />
            {labelZh("数据绑定", "Data Bindings")}
          </h3>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addBinding}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Separator className="opacity-50" />

        <div className="space-y-4">
          {bindings.map((binding: any, index: number) => (
            <div key={index} className="p-3 glass rounded-lg border border-border/50 space-y-3 relative group/item">
              <button 
                onClick={() => removeBinding(index)}
                className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  {labelZh("目标属性", "Target Prop")}
                </label>
                <Input 
                  value={binding.targetProp} 
                  onChange={(e) => updateBinding(index, 'targetProp', e.target.value)}
                  placeholder="e.content, fill..."
                  className="h-7 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#6965db] uppercase flex items-center justify-between">
                  <span>{labelZh("表达式", "Expression")}</span>
                  <Database className="h-2.5 w-2.5 opacity-50" />
                </label>
                <textarea 
                  value={binding.expression} 
                  onChange={(e) => updateBinding(index, 'expression', e.target.value)}
                  placeholder="{{ ds.id.data }}"
                  className="w-full h-16 p-2 text-[11px] font-mono rounded-md border border-input bg-muted/20 focus:ring-1 focus:ring-[#6965db] focus:border-[#6965db] focus:outline-none resize-none"
                />
              </div>
            </div>
          ))}

          {bindings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40 text-[11px] italic">
              {labelZh("暂无绑定，点击上方 + 号添加", "No bindings yet. Click + to add one.")}
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase">
            {labelZh("活跃数据源参考", "Active Data Sources")}
          </h4>
          <div className="grid grid-cols-1 gap-1">
            {Object.keys(dataSources).map(id => (
              <div key={id} className="text-[9px] font-mono flex items-center gap-2 p-1 hover:bg-accent rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-foreground font-bold">{id}</span>
                <span className="text-muted-foreground opacity-50">ds.{id}.data</span>
              </div>
            ))}
            {Object.keys(dataSources).length === 0 && (
              <span className="text-[9px] text-muted-foreground italic">
                {labelZh("未检测到活跃数据源", "No active sources detected")}
              </span>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
