/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Database, Link2 } from 'lucide-react';
import type { KernelStore, KernelState } from '@thingsvis/kernel';
import type { WidgetMainModule } from '@thingsvis/schema';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/NumericInput';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { gridToPixel, pixelToGrid } from '@thingsvis/ui';
import { resolveEditorServiceConfig } from '@/lib/embedded/service-config';
import { PlatformFieldPicker } from './PlatformFieldPicker';
import { DataSourceSelector } from './DataSourceSelector';
import EventsTab from './EventsTab';

import { getResolvedWidget, loadWidget } from '@/lib/registry/componentLoader';
import { getWidgetControls } from '@/lib/registry/getControls';
import {
  ASPECT_RATIO_PROP,
  KEEP_ASPECT_RATIO_PROP,
  getAspectRatioFromSize,
  getStoredAspectRatio,
  isAspectRatioLocked,
  resizeDimensionWithAspectRatio,
} from '@/lib/canvas/aspectRatio';
import { syncShapeStylePatch } from '@/lib/shapeStyleSync';
import { resolveControlText } from '@/lib/i18n/controlText';
import ControlFieldRow from './ControlFieldRow';
import { BaseStylePanel } from './BaseStylePanel';
import { preserveFreePipeLocalRouteOnResize } from '../../../../../packages/widgets/industrial/pipe/src/routeWorld';

function isHostDataSourceId(id: string): boolean {
  return /^__platform_.+__$/.test(id);
}

function hasPipeEndpointBinding(props: Record<string, unknown> | null | undefined): boolean {
  return !!(
    props?.sourceNodeId ||
    props?.targetNodeId ||
    props?.sourcePortId ||
    props?.targetPortId
  );
}

function isFreePipeSchema(
  schema:
    | {
        type?: string;
        props?: Record<string, unknown>;
      }
    | null
    | undefined,
): boolean {
  return schema?.type === 'industrial/pipe' && !hasPipeEndpointBinding(schema?.props);
}

export function buildFreePipePropsPanelSizeProps(
  currentProps: Record<string, unknown> | null | undefined,
  previousSize: { width: number; height: number } | undefined,
  nextSize: { width: number; height: number },
) {
  const route = preserveFreePipeLocalRouteOnResize(
    currentProps?.points as Array<{ x: number; y: number }> | undefined,
    previousSize,
    nextSize,
  );

  return {
    ...(currentProps ?? {}),
    points: route.points,
    waypoints: route.waypoints,
  };
}

type Props = {
  nodeId: string;
  kernelStore: KernelStore;
  onUserEdit?: () => void;
};

export default function PropsPanel({ nodeId, kernelStore, onUserEdit }: Props) {
  const { t, i18n } = useTranslation('editor');
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const serviceConfig = useMemo(() => resolveEditorServiceConfig(), []);
  const showEmbeddedHostUi = serviceConfig.mode === 'embedded';

  const state = useSyncExternalStore(
    useCallback((subscribe) => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState,
  );

  const { states: dataSources } = useDataSourceRegistry(kernelStore);
  const visibleDataSourceIds = useMemo(
    () => Object.keys(dataSources).filter((id) => showEmbeddedHostUi || !isHostDataSourceId(id)),
    [dataSources, showEmbeddedHostUi],
  );

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

    const cachedWidget = getResolvedWidget(componentType);
    if (cachedWidget) {
      setWidgetEntry(cachedWidget);
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

  // Early return ????????Hook ?????ules of Hooks??
  if (!node) return null;

  function updateNode(changes: any) {
    if (changes?.baseStyle || changes?.props) {
      changes = syncShapeStylePatch(
        componentType,
        changes,
        (schema?.props ?? {}) as Record<string, unknown>,
      );
    }

    // Auto-resize svg-symbol to fit the selected icon tightly
    if (
      componentType === 'industrial/svg-symbol' &&
      changes.props?.selectedIconId &&
      changes.props?.selectedIconId !== schema?.props?.selectedIconId
    ) {
      const registry = (widgetEntry as any)?.iconsRegistry as
        | Record<string, { defaultSize: { width: number; height: number } }>
        | undefined;
      const iconEntry = registry?.[changes.props.selectedIconId];
      if (iconEntry?.defaultSize) {
        const { width, height } = iconEntry.defaultSize;
        const currentSize = schema?.size ?? { width: 100, height: 60 };
        const currentPos = schema?.position ?? { x: 0, y: 0 };
        const nextSize = { width, height };
        const nextPos = {
          x: currentPos.x + (currentSize.width - width) / 2,
          y: currentPos.y + (currentSize.height - height) / 2,
        };

        const isGridMode = state.canvas.mode === 'grid';
        const gridSettings = state.gridState.settings;
        const containerWidth = state.gridState.containerWidth;

        if (isGridMode && gridSettings && containerWidth > 0) {
          const gridSize = pixelToGrid(
            { x: 0, y: 0, width: nextSize.width, height: nextSize.height },
            gridSettings,
            containerWidth,
          );
          const gridPos = pixelToGrid({ x: nextPos.x, y: nextPos.y }, gridSettings, containerWidth);
          kernelStore.getState().resizeGridItem(nodeId, {
            w: gridSize.w ?? 1,
            h: gridSize.h ?? 1,
          });
          kernelStore.getState().moveGridItem(nodeId, {
            x: gridPos.x,
            y: gridPos.y,
          });
        } else {
          changes.size = nextSize;
          changes.position = nextPos;
        }
      }
    }

    kernelStore.getState().updateNode(nodeId, changes);
    onUserEdit?.();
  }

  const addBinding = () => {
    const newBindings = [
      ...bindings,
      { targetProp: 'text', expression: '{{ ds.<id>.data.<path> }}' },
    ];
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

  const isFreePipe = isFreePipeSchema(schema);
  const isResizable = (widgetEntry as any)?.resizable !== false;
  const showSizeInputs = componentType === 'industrial/pipe' ? isFreePipe : isResizable;
  const widgetConstraints = ((widgetEntry as any)?.constraints ?? {}) as {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
  };

  const renderGeometry = () => {
    // In grid mode, schema.grid is the sole position/size authority.
    // schema.position / schema.size are NOT updated by grid operations.
    const isGridMode = state.canvas.mode === 'grid';
    const gridSettings = state.gridState.settings;
    const containerWidth = state.gridState.containerWidth;
    const nodeGrid = (schema.grid ?? { x: 0, y: 0, w: 4, h: 2 }) as {
      x: number;
      y: number;
      w: number;
      h: number;
    };

    let displayX: number;
    let displayY: number;
    let displayW: number;
    let displayH: number;

    if (isGridMode && gridSettings && containerWidth > 0) {
      const pixelRect = gridToPixel(nodeGrid, gridSettings, containerWidth);
      displayX = Math.round(pixelRect.x);
      displayY = Math.round(pixelRect.y);
      displayW = Math.round(pixelRect.width);
      displayH = Math.round(pixelRect.height);
    } else {
      displayX = schema.position?.x ?? 0;
      displayY = schema.position?.y ?? 0;
      displayW = schema.size?.width ?? 0;
      displayH = schema.size?.height ?? 0;
    }

    const currentProps = (schema.props ?? {}) as Record<string, unknown>;
    const widgetAspectRatio =
      typeof widgetConstraints.aspectRatio === 'number' && widgetConstraints.aspectRatio > 0
        ? widgetConstraints.aspectRatio
        : undefined;
    const storedAspectRatio = getStoredAspectRatio(currentProps);
    const editableAspectRatio = storedAspectRatio ?? getAspectRatioFromSize(displayW, displayH);
    const dynamicAspectRatioLocked = isAspectRatioLocked(currentProps);
    const aspectRatioLocked = widgetAspectRatio != null || dynamicAspectRatioLocked;

    const handlePositionChange = (axis: 'x' | 'y', value: number) => {
      if (isGridMode && gridSettings && containerWidth > 0) {
        const newX = axis === 'x' ? value : displayX;
        const newY = axis === 'y' ? value : displayY;
        const gridPos = pixelToGrid({ x: newX, y: newY }, gridSettings, containerWidth);
        kernelStore.getState().moveGridItem(nodeId, { x: gridPos.x, y: gridPos.y });
        onUserEdit?.();
      } else {
        updateNode({ position: { [axis]: value } });
      }
    };

    const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
      const nextSize =
        aspectRatioLocked && (widgetAspectRatio ?? editableAspectRatio) != null
          ? resizeDimensionWithAspectRatio(
              dimension,
              value,
              widgetAspectRatio ?? editableAspectRatio!,
              widgetConstraints,
            )
          : {
              width: dimension === 'width' ? value : displayW,
              height: dimension === 'height' ? value : displayH,
            };

      if (isGridMode && gridSettings && containerWidth > 0) {
        const gridSize = pixelToGrid(
          { x: 0, y: 0, width: nextSize.width, height: nextSize.height },
          gridSettings,
          containerWidth,
        );
        kernelStore.getState().resizeGridItem(nodeId, {
          w: gridSize.w ?? 1,
          h: gridSize.h ?? 1,
        });
        onUserEdit?.();
      } else {
        if (isFreePipe) {
          updateNode({
            size: nextSize,
            props: buildFreePipePropsPanelSizeProps(currentProps, schema?.size, nextSize),
          });
        } else {
          updateNode({ size: nextSize });
        }
      }
    };

    const handleAspectRatioToggle = () => {
      if (widgetAspectRatio != null) {
        return;
      }

      const nextAspectRatio = editableAspectRatio ?? getAspectRatioFromSize(displayW, displayH);
      if (!nextAspectRatio) {
        return;
      }

      updateNode({
        props: {
          ...currentProps,
          [KEEP_ASPECT_RATIO_PROP]: !dynamicAspectRatioLocked,
          [ASPECT_RATIO_PROP]: !dynamicAspectRatioLocked ? nextAspectRatio : undefined,
        },
      });
    };

    return (
      <div className="space-y-3 px-1">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          {t('propsPanel.geometryTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">X</label>
            <NumericInput
              value={displayX}
              onValueChange={(nextValue) => {
                if (nextValue === undefined) return;
                handlePositionChange('x', nextValue);
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Y</label>
            <NumericInput
              value={displayY}
              onValueChange={(nextValue) => {
                if (nextValue === undefined) return;
                handlePositionChange('y', nextValue);
              }}
              className="h-8 text-sm"
            />
          </div>
        </div>
        {/* 只有 resizable 组件才显示宽高设置 */}
        {showSizeInputs && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('propsPanel.width')}
                </label>
                <NumericInput
                  value={displayW}
                  onValueChange={(nextValue) => {
                    if (nextValue === undefined) return;
                    handleSizeChange('width', nextValue);
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-muted-foreground">
                  {t('propsPanel.height')}
                </label>
                <NumericInput
                  value={displayH}
                  onValueChange={(nextValue) => {
                    if (nextValue === undefined) return;
                    handleSizeChange('height', nextValue);
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={aspectRatioLocked}
                onChange={handleAspectRatioToggle}
                disabled={widgetAspectRatio != null}
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-0"
              />
              <span>{t('propsPanel.lockAspectRatio', '\u9501\u5b9a\u6bd4\u4f8b')}</span>
            </label>
          </div>
        )}
        {/* 旋转角度 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              {t('propsPanel.rotation')}
            </label>
            <NumericInput
              value={schema.props?._rotation ?? 0}
              onValueChange={(nextValue) =>
                updateNode({ props: { ...schema.props, _rotation: nextValue ?? 0 } })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    );
  };

  // 检查字段是否应该显示（基于 showWhen 条件）
  const shouldShowField = (field: any) => {
    if (!field.showWhen) return true;
    const { field: depField, value: depValue } = field.showWhen;
    const currentValue = schema.props?.[depField];
    // 支持简单的相等比较，也支持 > 0 等条件（通过检查 truthy）
    if (depValue === true) return Boolean(currentValue);
    if (depValue === false) return !currentValue;
    return currentValue === depValue;
  };

  const shouldShowGroup = (group: any) => {
    if (!group.showWhen) return true;
    const { field: depField, value: depValue } = group.showWhen;
    const currentValue = schema.props?.[depField];
    if (depValue === true) return Boolean(currentValue);
    if (depValue === false) return !currentValue;
    return currentValue === depValue;
  };

  const renderControlsPanel = () => {
    if (!controls) return null;

    const defaultOpenGroups = controls.groups
      .filter((group) => group.expanded !== false)
      .map((group) => group.id);

    return (
      <Tabs defaultValue="style" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="style" className="text-sm">
            {t('propsPanel.style')}
          </TabsTrigger>
          <TabsTrigger value="events" className="text-sm">
            {t('propsPanel.events')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-4">
          {renderGeometry()}

          <BaseStylePanel
            baseStyle={schema.baseStyle || {}}
            onChange={(baseStyle) => updateNode({ baseStyle })}
          />

          <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full">
            {controls.groups.map((group) => {
              if (!shouldShowGroup(group)) return null;
              // 过滤出应该显示的字段
              const visibleFields = group.fields.filter(shouldShowField);
              if (visibleFields.length === 0) return null;

              return (
                <AccordionItem key={group.id} value={group.id} className="border-b px-1">
                  <AccordionTrigger className="text-sm font-semibold uppercase tracking-wider py-3 hover:no-underline">
                    {resolveControlText(group.label ?? group.id, locale, t)}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-4 pt-1">
                    {visibleFields.map((field) => (
                      <ControlFieldRow
                        key={field.path}
                        kernelStore={kernelStore}
                        nodeId={nodeId}
                        componentType={componentType}
                        field={field}
                        propsValue={schema.props?.[field.path]}
                        bindings={schema.data}
                        updateNode={updateNode}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {widgetError && <p className="text-xs text-muted-foreground px-1">{widgetError}</p>}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <EventsTab nodeId={nodeId} kernelStore={kernelStore} onUserEdit={onUserEdit} />
        </TabsContent>
      </Tabs>
    );
  };

  const renderLegacyPanel = () => {
    const hasPlatformFields = (serviceConfig.platformFields || []).length > 0;
    const showPlatformTab = showEmbeddedHostUi && hasPlatformFields;

    return (
      <Tabs defaultValue="style" className="w-full">
        <TabsList className={`grid w-full ${showPlatformTab ? 'grid-cols-4' : 'grid-cols-3'} mb-4`}>
          <TabsTrigger value="style" className="text-sm">
            {t('propsPanel.style')}
          </TabsTrigger>
          <TabsTrigger value="data" className="text-sm">
            {t('propsPanel.data')}
          </TabsTrigger>
          <TabsTrigger value="events" className="text-sm">
            {t('propsPanel.events')}
          </TabsTrigger>
          {showPlatformTab && (
            <TabsTrigger value="platform" className="text-sm">
              {t('propsPanel.platform')}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="style" className="space-y-4">
          {process.env.NODE_ENV === 'development' && controlsParse.issues?.length ? (
            <div className="px-1">
              <p className="text-xs text-muted-foreground">Controls invalid; using legacy panel.</p>
            </div>
          ) : null}
          {renderGeometry()}

          <BaseStylePanel
            baseStyle={schema.baseStyle || {}}
            onChange={(baseStyle) => updateNode({ baseStyle })}
          />

          {/* Basic Props */}
          <div className="space-y-3 pt-4 border-t border-border px-1">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {t('propsPanel.contentTitle')}
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.textContent')}
              </label>
              <textarea
                value={schema.props?.text || ''}
                onChange={(e) => updateNode({ props: { text: e.target.value } })}
                className="w-full h-20 p-2 text-sm rounded-sm border border-input bg-background focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-none"
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
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.fillColor')}
              </label>
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
              <label className="text-sm font-medium text-muted-foreground">
                {t('propsPanel.fontSize')}
              </label>
              <NumericInput
                value={schema.props?.fontSize || 16}
                onValueChange={(nextValue) => updateNode({ props: { fontSize: nextValue ?? 16 } })}
                className="h-8 text-sm"
                min={1}
                mode="int"
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
              <div
                key={index}
                className="p-3 glass rounded-sm border border-border/50 space-y-3 relative group/item"
              >
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
                    platformFields={showEmbeddedHostUi ? serviceConfig.platformFields : undefined}
                    value={binding.dataSourcePath || ''}
                    onChange={(path) => {
                      // 自动填充表达式
                      const newExpression = `{{ ${path} }}`;
                      const updatedBinding = {
                        ...binding,
                        dataSourcePath: path,
                        expression: newExpression,
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
                    className="w-full h-16 p-2 text-sm font-mono rounded-sm border border-input bg-muted/20 focus:ring-1 focus:ring-inset focus:ring-ring focus:ring-inset focus:outline-none resize-none"
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
              {visibleDataSourceIds.map((id) => (
                <div
                  key={id}
                  className="text-sm font-mono flex items-center gap-2 p-1 hover:bg-accent rounded"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-foreground font-bold">{id}</span>
                  <span className="text-muted-foreground opacity-50">ds.{id}.data</span>
                </div>
              ))}
              {visibleDataSourceIds.length === 0 && (
                <span className="text-sm text-muted-foreground italic">
                  {t('propsPanel.noActiveSources')}
                </span>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <EventsTab nodeId={nodeId} kernelStore={kernelStore} onUserEdit={onUserEdit} />
        </TabsContent>

        {showPlatformTab && (
          <TabsContent value="platform" className="space-y-4 px-1">
            {(() => {
              const platformFields = serviceConfig.platformFields || [];

              if (platformFields.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground/40 text-sm italic">
                    {t('propsPanel.noPlatformFields')}
                  </div>
                );
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
                        platformField: field,
                      },
                    ];
                    updateNode({ data: newBindings });
                  }}
                />
              );
            })()}
          </TabsContent>
        )}
      </Tabs>
    );
  };

  if (controls) {
    return renderControlsPanel();
  }

  return renderLegacyPanel();
}
