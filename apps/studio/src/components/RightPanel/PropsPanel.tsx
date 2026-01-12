import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { Plus, Trash2, Database, Link2 } from "lucide-react";
import type { KernelStore, KernelState } from "@thingsvis/kernel";
import type { PluginMainModule } from "@thingsvis/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataSourceRegistry } from "@thingsvis/ui";

import { loadPlugin } from "@/plugins/pluginResolver";
import { getPluginControls } from "@/plugins/getPluginControls";
import ControlFieldRow from "./ControlFieldRow";

type Props = {
  nodeId: string;
  kernelStore: KernelStore;
  language: string;
  onUserEdit?: () => void;
};

export default function PropsPanel({ nodeId, kernelStore, language, onUserEdit }: Props) {
  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  const { states: dataSources } = useDataSourceRegistry(kernelStore);

  const node = state.nodesById[nodeId];
  if (!node) return null;

  const schema = node.schemaRef as any;
  const bindings = schema.data || [];

  const componentType = schema.type as string;
  const [pluginEntry, setPluginEntry] = useState<PluginMainModule | null>(null);
  const [pluginError, setPluginError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPluginEntry(null);
    setPluginError(null);

    (async () => {
      try {
        const loaded = await loadPlugin(componentType);
        if (cancelled) return;
        setPluginEntry(loaded.entry);
      } catch (e) {
        if (cancelled) return;
        setPluginError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [componentType]);

  const controlsParse = useMemo(() => getPluginControls(pluginEntry ?? undefined), [pluginEntry]);
  const controls = controlsParse.controls;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!pluginEntry) return;
    if (controls) return;
    if (!controlsParse.issues?.length) return;

    // eslint-disable-next-line no-console
    console.warn('[PropsPanel] Invalid plugin controls; falling back to legacy panel', {
      pluginId: pluginEntry.id,
      issues: controlsParse.issues
    });
  }, [pluginEntry, controls, controlsParse.issues]);

  function updateNode(changes: any) {
    kernelStore.getState().updateNode(nodeId, changes);
    onUserEdit?.();
  }

  const labelZh = (zh: string, en: string) => language === "zh" ? zh : en;

  const addBinding = () => {
    // 默认绑定到 text 属性
    const newBindings = [...bindings, { targetProp: 'text', expression: '{{ ds.<id>.data.<path> }}' }];
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

  // 判断组件是否支持调整尺寸（resizable: false 的组件不显示宽高设置）
  const isResizable = (pluginEntry as any)?.resizable !== false;

  const renderGeometry = () => (
    <div className="space-y-3 px-1">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
        {labelZh("几何布局", "Geometry")}
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">X</label>
          <Input
            type="number"
            value={schema.position.x}
            onChange={(e) => updateNode({ position: { x: Number(e.target.value) } })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">Y</label>
          <Input
            type="number"
            value={schema.position.y}
            onChange={(e) => updateNode({ position: { y: Number(e.target.value) } })}
            className="h-8 text-sm"
          />
        </div>
      </div>
      {/* 只有 resizable 组件才显示宽高设置 */}
      {isResizable && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
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
            <label className="text-sm font-medium text-muted-foreground">
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
      )}
      {/* 旋转角度 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-muted-foreground">
            {labelZh("旋转", "Rotation")}
          </label>
          <Input
            type="number"
            value={schema.props?._rotation ?? 0}
            onChange={(e) => updateNode({ props: { ...schema.props, _rotation: Number(e.target.value) } })}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );

  // 检查字段是否应该显示（基于 showWhen 条件）
  const shouldShowField = (field: typeof controls.groups[0]['fields'][0]) => {
    if (!field.showWhen) return true;
    const { field: depField, value: depValue } = field.showWhen;
    const currentValue = schema.props?.[depField];
    // 支持简单的相等比较，也支持 > 0 等条件（通过检查 truthy）
    if (depValue === true) return Boolean(currentValue);
    if (depValue === false) return !currentValue;
    return currentValue === depValue;
  };

  const renderControlsPanel = () => {
    if (!controls) return null;

    return (
      <div className="space-y-4">
        {renderGeometry()}
        {controls.groups.map((group) => {
          // 过滤出应该显示的字段
          const visibleFields = group.fields.filter(shouldShowField);
          if (visibleFields.length === 0) return null;

          return (
            <div key={group.id} className="space-y-3 pt-4 border-t border-border px-1">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {group.label ?? group.id}
              </h3>
              <div className="space-y-3">
                {visibleFields.map((field) => (
                  <ControlFieldRow
                    key={field.path}
                    kernelStore={kernelStore}
                    nodeId={nodeId}
                    field={field}
                    propsValue={schema.props?.[field.path]}
                    bindings={schema.data}
                    updateNode={updateNode}
                    language={language}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {pluginError && (
          <p className="text-xs text-muted-foreground">{pluginError}</p>
        )}
      </div>
    );
  };

  const renderLegacyPanel = () => (
    <Tabs defaultValue="style" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="style" className="text-sm">{labelZh("样式", "Style")}</TabsTrigger>
        <TabsTrigger value="data" className="text-sm">{labelZh("数据", "Data")}</TabsTrigger>
      </TabsList>

      <TabsContent value="style" className="space-y-4">
        {process.env.NODE_ENV === 'development' && controlsParse.issues?.length ? (
          <div className="px-1">
            <p className="text-xs text-muted-foreground">
              Controls invalid; using legacy panel.
            </p>
          </div>
        ) : null}
        {renderGeometry()}

        {/* Basic Props */}
        <div className="space-y-3 pt-4 border-t border-border px-1">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {labelZh("文本配置", "Content")}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{labelZh("文本内容", "Text")}</label>
            <textarea
              value={schema.props?.text || ''}
              onChange={(e) => updateNode({ props: { text: e.target.value } })}
              className="w-full h-20 p-2 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none resize-none"
              placeholder={labelZh("输入静态文本", "Enter static text")}
            />
            <p className="text-sm text-muted-foreground italic">
              {labelZh("注：若在'数据'面板配置了绑定，此处的静态值将被覆盖。", "Note: If data binding is set, this static value will be overridden.")}
            </p>
          </div>
        </div>

        {/* Style Section */}
        <div className="space-y-3 pt-4 border-t border-border px-1">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            {labelZh("样式属性", "Style")}
          </h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{labelZh("颜色", "Fill")}</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={schema.props?.fill || '#000000'}
                onChange={(e) => updateNode({ props: { fill: e.target.value } })}
                className="w-8 h-8 p-0 border-0 overflow-hidden rounded-sm cursor-pointer"
              />
              <Input
                type="text"
                value={schema.props?.fill || '#000000'}
                onChange={(e) => updateNode({ props: { fill: e.target.value } })}
                className="h-8 flex-1 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">{labelZh("字号", "Font Size")}</label>
            <Input
              type="number"
              value={schema.props?.fontSize || 16}
              onChange={(e) => updateNode({ props: { fontSize: Number(e.target.value) } })}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="data" className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
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
            <div key={index} className="p-3 glass rounded-sm border border-border/50 space-y-3 relative group/item">
              <button 
                onClick={() => removeBinding(index)}
                className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {labelZh("目标属性", "Target Prop")}
                </label>
                <Input 
                  value={binding.targetProp} 
                  onChange={(e) => updateBinding(index, 'targetProp', e.target.value)}
                  placeholder={labelZh("例如：text / fill / fontSize", "e.g. text / fill / fontSize")}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>{labelZh("表达式", "Expression")}</span>
                  <Database className="h-2.5 w-2.5 opacity-50" />
                </label>
                <textarea 
                  value={binding.expression} 
                  onChange={(e) => updateBinding(index, 'expression', e.target.value)}
                  placeholder="{{ ds.<id>.data.<path> }}"
                  className="w-full h-16 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
                />
              </div>
            </div>
          ))}

          {bindings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground/40 text-sm italic">
              {labelZh("暂无绑定，点击上方 + 号添加", "No bindings yet. Click + to add one.")}
            </div>
          )}
        </div>

        <div className="pt-4 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {labelZh("活跃数据源参考", "Active Data Sources")}
          </h4>
          <div className="grid grid-cols-1 gap-1">
            {Object.keys(dataSources).map(id => (
              <div key={id} className="text-sm font-mono flex items-center gap-2 p-1 hover:bg-accent rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-foreground font-bold">{id}</span>
                <span className="text-muted-foreground opacity-50">ds.{id}.data</span>
              </div>
            ))}
            {Object.keys(dataSources).length === 0 && (
              <span className="text-sm text-muted-foreground italic">
                {labelZh("未检测到活跃数据源", "No active sources detected")}
              </span>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );

  if (controls) {
    return renderControlsPanel();
  }

  return renderLegacyPanel();
}
