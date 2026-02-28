import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Database, Link2 } from "lucide-react";
import type { KernelStore, KernelState } from "@thingsvis/kernel";
import type { WidgetMainModule } from "@thingsvis/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataSourceRegistry } from "@thingsvis/ui";
import { resolveEditorServiceConfig } from "@/lib/embedded/service-config";
import { PlatformFieldPicker } from "./PlatformFieldPicker";
import { DataSourceSelector } from "./DataSourceSelector";

import { loadWidget } from "@/lib/registry/componentLoader";
import { getWidgetControls } from "@/lib/registry/getControls";
import ControlFieldRow from "./ControlFieldRow";
import type { I18nLabel } from '@thingsvis/schema';

/**
 * 解析 I18nLabel——支持字符串和多语言 map
 * 字符串: PropsPanel 层优先尝试作为 i18n key，外层由 ControlFieldRow 的 t() 处理
 * Map: 按当前语言取对应字段，找不到则 fallback 到 en，再找不到则取第一个值
 */
export function resolveLabel(label: I18nLabel | undefined, lang: string): string {
  if (!label) return '';
  if (typeof label === 'string') return label;
  return label[lang] ?? label['en'] ?? Object.values(label)[0] ?? '';
}

type Props = {
  nodeId: string;
  kernelStore: KernelStore;
  onUserEdit?: () => void;
};

export default function PropsPanel({ nodeId, kernelStore, onUserEdit }: Props) {
  const { t, i18n } = useTranslation('editor');


  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  const { states: dataSources } = useDataSourceRegistry(kernelStore);

  const node = state.nodesById[nodeId];
  // 在 hooks 之前做 null-safe 解构（hooks 必须无条件调用）
  const schema = node?.schemaRef as any;
  const bindings = schema?.data || [];
  const componentType = (schema?.type ?? '') as string;

  const [widgetEntry, setWidgetEntry] = useState<WidgetMainModule | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!node || !componentType) {
      setWidgetEntry(null);
      setWidgetError(null);
      return;
    }
    let cancelled = false;
    setWidgetEntry(null);
    setWidgetError(null);

    (async () => {
      try {
        const loaded = await loadWidget(componentType);
        if (cancelled) return;
        setWidgetEntry(loaded.entry);
      } catch (e) {
        if (cancelled) return;
        setWidgetError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [componentType, node]);

  const controlsParse = useMemo(() => getWidgetControls(widgetEntry ?? undefined), [widgetEntry]);
  const controls = controlsParse.controls;

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!widgetEntry) return;
    if (controls) return;
    if (!controlsParse.issues?.length) return;

    // eslint-disable-next-line no-console

  }, [widgetEntry, controls, controlsParse.issues]);

  // Early return 必须在所有 Hook 之后（Rules of Hooks）
  if (!node) return null;

  function updateNode(changes: any) {
    kernelStore.getState().updateNode(nodeId, changes);
    onUserEdit?.();
  }
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
  const isResizable = (widgetEntry as any)?.resizable !== false;

  const renderGeometry = () => (
    <div className="space-y-3 px-1">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
        {t('propsPanel.geometryTitle')}
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
              {t('propsPanel.width')}
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
              {t('propsPanel.height')}
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
            {t('propsPanel.rotation')}
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
                {resolveLabel(group.label, i18n.language) || t(group.id, { defaultValue: group.id })}
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
                  />
                ))}
              </div>
            </div>
          );
        })}

        {widgetError && (
          <p className="text-xs text-muted-foreground">{widgetError}</p>
        )}
      </div>
    );
  };

  const renderLegacyPanel = () => {
    const serviceConfig = resolveEditorServiceConfig()
    const hasPlatformFields = (serviceConfig.platformFields || []).length > 0

    // 平台 Tab 只在有平台字段时显示（物模型嵌入场景）
    const showPlatformTab = hasPlatformFields
    const tabCount = showPlatformTab ? 3 : 2

    return (
      <Tabs defaultValue="style" className="w-full">
        <TabsList className={`grid w-full ${tabCount === 3 ? 'grid-cols-3' : 'grid-cols-2'} mb-4`}>
          <TabsTrigger value="style" className="text-sm">{t('propsPanel.style')}</TabsTrigger>
          <TabsTrigger value="data" className="text-sm">{t('propsPanel.data')}</TabsTrigger>
          {showPlatformTab && (
            <TabsTrigger value="platform" className="text-sm">{t('propsPanel.platform')}</TabsTrigger>
          )}
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
              {t('propsPanel.contentTitle')}
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">{t('propsPanel.textContent')}</label>
              <textarea
                value={schema.props?.text || ''}
                onChange={(e) => updateNode({ props: { text: e.target.value } })}
                className="w-full h-20 p-2 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-ring focus:outline-none resize-none"
                placeholder={t('propsPanel.staticTextPlaceholder')}
              />
              <p className="text-sm text-muted-foreground italic">
                {t('propsPanel.dataBindingNote')}
              </p>
            </div>
          </div>

          {/* Style Section */}
          <div className="space-y-3 pt-4 border-t border-border px-1">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('propsPanel.styleTitle')}
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">{t('propsPanel.fillColor')}</label>
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
              <label className="text-sm font-medium text-muted-foreground">{t('propsPanel.fontSize')}</label>
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
              {t('propsPanel.dataBindingsTitle')}
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
                    {t('propsPanel.targetProp')}
                  </label>
                  <Input
                    value={binding.targetProp}
                    onChange={(e) => updateBinding(index, 'targetProp', e.target.value)}
                    placeholder={t('propsPanel.targetPropPlaceholder')}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground">
                    {t('propsPanel.dataSourceTitle')}
                  </label>
                  <DataSourceSelector
                    dataSources={dataSources}
                    platformFields={serviceConfig.platformFields}
                    value={binding.dataSourcePath || ''}
                    onChange={(path) => {
                      // 自动填充表达式
                      const newExpression = `{{ ${path} }}`;
                      const updatedBinding = {
                        ...binding,
                        dataSourcePath: path,
                        expression: newExpression
                      };
                      const newBindings = [...bindings];
                      newBindings[index] = updatedBinding;
                      updateNode({ data: newBindings });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                    <span>{t('propsPanel.expressionTitle')}</span>
                    <Database className="h-2.5 w-2.5 opacity-50" />
                  </label>
                  <textarea
                    value={binding.expression}
                    onChange={(e) => updateBinding(index, 'expression', e.target.value)}
                    placeholder="{{ ds.<id>.data.<path> }}"
                    className="w-full h-16 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-ring focus:outline-none resize-none"
                  />
                  <p className="text-xs text-muted-foreground italic">
                    {t('propsPanel.expressionTip')}
                    <code className="px-1 py-0.5 bg-muted rounded text-[10px]">
                      {`{{ ds.mydata.data.temperature }}`}
                    </code>
                  </p>
                </div>
              </div>
            ))}

            {bindings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground/40 text-sm italic">
                {t('propsPanel.noBindingsHint')}
              </div>
            )}
          </div>

          <div className="pt-4 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              {t('propsPanel.activeDataSources')}
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
                  {t('propsPanel.noActiveSources')}
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        {showPlatformTab && (
          <TabsContent value="platform" className="space-y-4 px-1">
            {(() => {
              const platformFields = serviceConfig.platformFields || []

              if (platformFields.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground/40 text-sm italic">
                    {t('propsPanel.noPlatformFields')}
                  </div>
                )
              }

              return (
                <PlatformFieldPicker
                  platformFields={platformFields}
                  onSelectField={(field) => {
                    // Create a PLATFORM_FIELD data binding
                    const newBindings = [
                      ...bindings,
                      {
                        targetProp: 'text', // default to text, user can change
                        expression: `{{ platform.${field.id} }}`,
                        platformField: field
                      }
                    ]
                    updateNode({ data: newBindings })
                  }}
                />
              )
            })()}
          </TabsContent>
        )}
      </Tabs>
    )
  };

  if (controls) {
    return renderControlsPanel();
  }

  return renderLegacyPanel();
}
