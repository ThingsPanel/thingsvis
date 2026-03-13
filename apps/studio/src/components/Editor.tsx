import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { store } from '../lib/store';
import type { KernelState, KernelStore } from '@thingsvis/kernel';
import { validateCanvasTheme } from '@thingsvis/schema';

import { EditorTopNav } from './EditorTopNav';
import { HelpDialog } from './HelpDialog';
import { EditorBottomBar } from './EditorBottomBar';
import { ShortcutHelpPanel } from './ShortcutHelpPanel';
import { ProjectDialog } from './ProjectDialog';
import { VariablesPanel } from './Modals/VariablesPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import ComponentsList from './LeftPanel/ComponentsList';
import LayerPanel from './LeftPanel/LayerPanel';
import DeviceLibraryPanel from './LeftPanel/DeviceLibraryPanel';
import { usePlatformDeviceStore } from '@/lib/stores/platformDeviceStore';
import PropsPanel from './RightPanel/PropsPanel';
import { CanvasSettingsPanel } from './RightPanel/CanvasSettingsPanel';
import { WorkspaceEngine, type Tool } from './WorkspaceEngine';
import { ErrorBoundary } from './ErrorBoundary';

import {
  useProjectBootstrap,
  type CanvasConfigSchema,
  generateId,
} from '../hooks/useProjectBootstrap';
import { useEditorStartup } from '../hooks/useEditorStartup';
import { useEditorSync } from '../hooks/useEditorSync';
import { useEditorDragDrop } from '../hooks/useEditorDragDrop';
import { commandRegistry, useKeyboardShortcuts, registerDefaultCommands } from '../lib/commands';

import {
  MousePointer2,
  Square,
  Circle,
  ArrowRight,
  Type,
  ImageIcon,
  Hand,
  Layers,
  Grid3x3,
  X,
  Box,
} from 'lucide-react';
import { initEmbedModeFromUrl } from '../embed/message-router';
import { STORAGE_CONSTANTS } from '../lib/storage/constants';
import EditorStartupOverlay from './LoadingScreen/EditorStartupOverlay';

type Language = string;
function DataPanel(_props: { store: typeof store; language: Language }) {
  return null;
}

export interface EditorProps {
  embedVisibility?: {
    showLibrary: boolean;
    showProps: boolean;
    showTopLeft: boolean;
    showToolbar: boolean;
    showTopRight: boolean;
    hideProjectDialog?: boolean;
  };
  isWidgetMode?: boolean;
  onStrategySave?: () => void;
}

export interface EditorHandle {
  getProjectState: () => any;
  getCanvasConfig: () => CanvasConfigSchema;
}

const Editor = React.forwardRef<EditorHandle, EditorProps>(function Editor(props, ref) {
  const { isAuthenticated, user, logout, isLoading: authLoading, storageMode } = useAuth();
  const { currentProject, switchProject } = useProject();

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState<'components' | 'devices' | 'layers'>(
    'components',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const { t, i18n } = useTranslation('editor');
  const language = i18n.language as string;
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [hasSelectedDashboard, setHasSelectedDashboard] = useState(() => {
    try {
      return !!localStorage.getItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY);
    } catch {
      return false;
    }
  });

  const [confirmLayoutSwitch, setConfirmLayoutSwitch] = useState<{
    open: boolean;
    newMode: 'fixed' | 'infinite' | 'grid';
    onConfirm: () => void;
  }>({ open: false, newMode: 'fixed', onConfirm: () => {} });

  const embedVisibility = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const isEmbedded = params.get('mode') === 'embedded' || !!props.embedVisibility;
    return {
      isEmbedded,
      showLibrary: props.embedVisibility?.showLibrary ?? params.get('showLibrary') !== '0',
      showProps: props.embedVisibility?.showProps ?? params.get('showProps') !== '0',
      showTopLeft: props.embedVisibility?.showTopLeft ?? params.get('showTopLeft') !== '0',
      showToolbar: props.embedVisibility?.showToolbar ?? params.get('showToolbar') !== '0',
      showTopRight: props.embedVisibility?.showTopRight ?? params.get('showTopRight') !== '0',
      hideProjectDialog: props.embedVisibility?.hideProjectDialog ?? false,
    };
  }, [props.embedVisibility]);

  const kernelState = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), []),
    () => store.getState() as KernelState,
  );
  const selectedElement = kernelState.selection.nodeIds[0] || null;

  const hasDevices = usePlatformDeviceStore((state) => state.devices.length > 0);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const embedInitializedRef = useRef(false);
  useEffect(() => {
    if (embedVisibility.isEmbedded && !embedInitializedRef.current) {
      embedInitializedRef.current = true;
      initEmbedModeFromUrl(isAuthenticated);
    }
  }, [embedVisibility.isEmbedded, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || embedVisibility.isEmbedded) return;
    if (storageMode === 'cloud' && !hasSelectedDashboard) {
      setShowProjectDialog(true);
    }
  }, [authLoading, isAuthenticated, storageMode, hasSelectedDashboard, embedVisibility.isEmbedded]);

  const [zoom, setZoom] = useState(80);
  const [zoomInput, setZoomInput] = useState('80');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(() => {
    return embedVisibility.showLibrary;
  });

  useEffect(() => {
    setZoomInput(zoom.toString());
  }, [zoom]);

  const handleZoomInputBlur = () => {
    let value = parseInt(zoomInput.replace(/[^0-9]/g, ''), 10);
    if (isNaN(value)) value = 100;
    value = Math.max(10, Math.min(500, value));
    setZoom(value);
    setZoomInput(value.toString());
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleZoomInputBlur();
      e.currentTarget.blur();
    }
  };

  useEffect(() => {
    if (selectedElement) {
      setShowRightPanel(true);
    }
  }, [selectedElement]);

  useEffect(() => {
    if (!embedVisibility.showLibrary) {
      setShowLeftPanel(false);
      return;
    }
    if (!embedVisibility.showTopRight) {
      setShowLeftPanel(true);
    }
  }, [embedVisibility.showLibrary, embedVisibility.showTopRight]);

  const toggleLeftPanel = useCallback(() => setShowLeftPanel((prev) => !prev), []);

  const {
    canvasConfig,
    setCanvasConfig,
    projectId,
    getProjectState,
    isBootstrapping,
    bootstrapSummary,
    bootstrappingRef,
    canvasInitializedRef,
  } = useProjectBootstrap({
    embedVisibility,
    isAuthenticated,
    storageMode,
    hasSelectedDashboard,
    setShowProjectDialog,
    currentProject,
    switchProject,
  });

  const isWidgetMode =
    props.isWidgetMode ??
    (embedVisibility.isEmbedded && (projectId === 'widget' || projectId.startsWith('embed-')));

  const { saveState, markDirty, saveNow } = useEditorSync({
    projectId,
    cloudProjectId: currentProject?.id,
    getProjectState,
    isBootstrapping,
    isWidgetMode,
    setCanvasConfig,
    canvasConfig,
    canvasInitializedRef,
    bootstrappingRef,
  });

  const { startup, isReady: isStartupReady } = useEditorStartup({
    authResolved: !authLoading,
    isBootstrapping,
    projectLoaded: bootstrapSummary.projectLoaded,
    widgetTypes: bootstrapSummary.widgetTypes,
  });

  const { handleAddNode, onDropComponent } = useEditorDragDrop(markDirty);

  useImperativeHandle(
    ref,
    () => ({
      getProjectState,
      getCanvasConfig: () => canvasConfig,
    }),
    [getProjectState, canvasConfig],
  );

  const temporalSnapshot = useSyncExternalStore(
    useCallback((subscribe) => store.temporal.subscribe(subscribe), []),
    () => store.temporal.getState(),
    () => store.temporal.getState(),
  );

  const { canUndo, canRedo } = useMemo(() => {
    const past = temporalSnapshot.pastStates ?? [];
    const future = temporalSnapshot.futureStates ?? [];
    return {
      canUndo: past.length > 0,
      canRedo: future.length > 0,
    };
  }, [temporalSnapshot]);

  const handleUndo = useCallback(() => store.temporal.getState().undo(), []);
  const handleRedo = useCallback(() => store.temporal.getState().redo(), []);

  const openPreview = useCallback(async () => {
    await saveNow();
    if (embedVisibility.isEmbedded) {
      window.location.hash = `#/preview?projectId=${encodeURIComponent(projectId)}&mode=embedded`;
      return;
    }
    const previewHash = `#/preview?projectId=${encodeURIComponent(projectId)}`;
    const previewWindow = window.open('about:blank', '_blank');
    const url = new URL(window.location.href);
    url.hash = previewHash;
    if (previewWindow) {
      previewWindow.location.href = url.toString();
      previewWindow.focus?.();
      return;
    }
    window.location.hash = previewHash;
  }, [projectId, saveNow, embedVisibility.isEmbedded]);

  const openPublish = useCallback(async () => {
    await saveNow();
    // Implementation omitted for brevity
  }, [saveNow]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    registerDefaultCommands({
      saveProject: async () => await saveNow(),
      getKernelState: () => store.getState() as KernelState,
      deleteNodes: (ids) => store.getState().removeNodes(ids),
      undo: () => store.temporal.getState().undo(),
      redo: () => store.temporal.getState().redo(),
      canUndo: () => {
        const past = (store.temporal.getState().pastStates ?? []) as unknown[];
        return past.length > 0;
      },
      canRedo: () => {
        const future = (store.temporal.getState().futureStates ?? []) as unknown[];
        return future.length > 0;
      },
      showShortcutsPanel: () => setShowShortcuts(true),
      setTool: (tool) => setActiveTool(tool as Tool),
      openProjectDialog: () => setShowProjectDialog(true),
      openPreview,
      logout: () => {
        logout();
        window.location.hash = '#/';
      },
      applyNodeInsertAndSelect: (nodes, selectIds) => {
        const kernel = store.getState();
        kernel.addNodes(nodes);
        kernel.selectNodes(selectIds);
      },
    });
  }, [saveNow, projectId, openPreview]);

  useKeyboardShortcuts({ registry: commandRegistry });

  const tools = [
    { id: 'select' as Tool, icon: MousePointer2, label: '选择' },
    { id: 'rectangle' as Tool, icon: Square, label: '矩形' },
    { id: 'circle' as Tool, icon: Circle, label: '圆形' },
    { id: 'line' as Tool, icon: ArrowRight, label: '连线' },
    { id: 'pan' as Tool, icon: Hand, label: '移动' },
    { id: 'image' as Tool, icon: ImageIcon, label: '图片' },
    { id: 'text' as Tool, icon: Type, label: '文本' },
  ];

  return (
    <div
      className={
        isDarkMode
          ? 'dark relative min-h-screen overflow-hidden'
          : 'relative min-h-screen overflow-hidden'
      }
    >
      <div className="absolute inset-0 bg-background" />

      <ErrorBoundary>
        <WorkspaceEngine
          canvasConfig={canvasConfig}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          zoom={zoom}
          setZoom={setZoom}
          embedVisibility={embedVisibility}
          showLeftPanel={showLeftPanel}
          showRightPanel={showRightPanel}
          markDirty={markDirty}
        />
      </ErrorBoundary>
      <EditorStartupOverlay startup={startup} visible={!isStartupReady} />

      <EditorTopNav
        canvasMode={canvasConfig.mode}
        tools={tools}
        activeTool={activeTool}
        isDarkMode={isDarkMode}
        isEmbedded={embedVisibility.isEmbedded}
        showTopLeft={embedVisibility.showTopLeft}
        showToolbar={embedVisibility.showToolbar}
        showTopRight={embedVisibility.showTopRight}
        showRightPanel={showRightPanel}
        showLibrary={embedVisibility.showLibrary}
        isFullscreen={!!document.fullscreenElement}
        saveStatus={saveState.status}
        lastSavedAt={saveState.lastSavedAt}
        saveError={saveState.error}
        isSaving={saveState.status === 'saving'}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        user={user}
        projectName={canvasConfig.name}
        projectId={projectId}
        onToolChange={setActiveTool}
        onProjectNameChange={(name: string) => setCanvasConfig({ ...canvasConfig, name })}
        onSave={() => saveNow()}
        onPreview={openPreview}
        onPublish={openPublish}
        onToggleTheme={toggleTheme}
        onToggleRightPanel={() => setShowRightPanel(true)}
        showLeftPanel={showLeftPanel}
        onToggleLeftPanel={toggleLeftPanel}
        onToggleFullscreen={() => {
          if (!document.fullscreenElement)
            document.documentElement.requestFullscreen().catch(() => {});
          else if (document.exitFullscreen) document.exitFullscreen();
        }}
        onOpenProjectDialog={() => setShowProjectDialog(true)}
        onOpenVariables={() => setShowVariablesPanel(true)}
        onOpenHelp={() => setShowHelpDialog(true)}
        onOpenDataSources={async () => {
          if (embedVisibility.isEmbedded) {
            await saveNow();
            window.location.hash = `#/data-sources?projectId=${encodeURIComponent(projectId)}&mode=embedded`;
          } else {
            window.open('#/data-sources', '_blank');
          }
        }}
        onLogout={() => {
          logout();
          window.location.hash = '#/';
        }}
        onLogin={() => (window.location.hash = '#/login')}
      />

      {embedVisibility.showLibrary && showLeftPanel && (
        <aside
          className={`absolute left-4 ${embedVisibility.isEmbedded ? (embedVisibility.showTopLeft || embedVisibility.showTopRight ? 'top-20' : 'top-4') : 'top-20'} bottom-4 z-40 w-72`}
        >
          <div className="glass rounded-xl shadow-2xl border border-border/50 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-2 py-2 border-b border-border/50">
              <div className="flex flex-1">
                <button
                  onClick={() => setLeftPanelTab('components')}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium transition-all rounded-lg ${leftPanelTab === 'components' ? 'text-foreground bg-accent/80 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                  title={t('leftPanel.library')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                {hasDevices && (
                  <button
                    onClick={() => setLeftPanelTab('devices')}
                    className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium transition-all rounded-lg ${leftPanelTab === 'devices' ? 'text-foreground bg-accent/80 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                    title="Entities"
                  >
                    <Box className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setLeftPanelTab('layers')}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 text-sm font-medium transition-all rounded-lg ${leftPanelTab === 'layers' ? 'text-foreground bg-accent/80 shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'}`}
                  title={t('leftPanel.layers')}
                >
                  <Layers className="h-4 w-4" />
                </button>
              </div>
              {embedVisibility.showTopRight && (
                <button
                  className="p-1.5 ml-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setShowLeftPanel(false)}
                  title={t('common.close')}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {leftPanelTab === 'components' ? (
                <div>
                  <ComponentsList onInsert={handleAddNode} />
                </div>
              ) : leftPanelTab === 'devices' && hasDevices ? (
                <DeviceLibraryPanel />
              ) : leftPanelTab === 'layers' ? (
                <LayerPanel
                  store={store}
                  language={language}
                  searchQuery={searchQuery}
                  onUserEdit={markDirty}
                />
              ) : (
                <DataPanel store={store} language={language} />
              )}
            </div>
          </div>
        </aside>
      )}

      <EditorBottomBar
        zoom={zoom}
        zoomInput={zoomInput}
        canUndo={canUndo}
        canRedo={canRedo}
        showLeftPanel={showLeftPanel}
        showProps={embedVisibility.showProps}
        showRightPanel={showRightPanel}
        canvasWidth={canvasConfig.width}
        canvasHeight={canvasConfig.height}
        onZoomChange={setZoom}
        onZoomInputChange={setZoomInput}
        onZoomInputBlur={handleZoomInputBlur}
        onZoomInputKeyDown={handleZoomInputKeyDown}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {embedVisibility.showProps && showRightPanel && (
        <aside
          className={`absolute right-4 ${embedVisibility.isEmbedded ? (embedVisibility.showTopLeft || embedVisibility.showTopRight ? 'top-20' : 'top-4') : 'top-20'} bottom-4 w-80 z-40`}
        >
          <div className="glass rounded-xl shadow-2xl border border-border/50 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <h2 className="text-sm font-semibold">{t('propsPanel.title')}</h2>
              <button
                className="p-1.5 hover:bg-accent/80 rounded-lg transition-colors"
                onClick={() => {
                  if (selectedElement) store.getState().selectNode(null);
                  else setShowRightPanel(false);
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedElement ? (
                <PropsPanel
                  nodeId={selectedElement}
                  kernelStore={store as unknown as KernelStore}
                  onUserEdit={markDirty}
                />
              ) : (
                <CanvasSettingsPanel
                  canvasConfig={canvasConfig}
                  currentProjectName={currentProject?.name}
                  isEmbedded={embedVisibility.isEmbedded}
                  onConfigChange={setCanvasConfig}
                  onLayoutModeChange={(newMode: 'fixed' | 'infinite' | 'grid') => {
                    const hasNodes = Object.keys(store.getState().nodesById).length > 0;
                    if (embedVisibility.isEmbedded || !hasNodes) {
                      setCanvasConfig((prev) => ({ ...prev, mode: newMode }));
                      return true;
                    }
                    setConfirmLayoutSwitch({
                      open: true,
                      newMode,
                      onConfirm: () => {
                        store.getState().loadPage({
                          id: canvasConfig.id,
                          type: 'page' as const,
                          version: '1.0.0',
                          nodes: [],
                          config: {
                            mode: newMode,
                            width: canvasConfig.width,
                            height: canvasConfig.height,
                            theme: canvasConfig.theme as any,
                          },
                        });
                        setCanvasConfig((prev) => ({ ...prev, mode: newMode }));
                        markDirty();
                      },
                    });
                    return true;
                  }}
                  onClearCanvas={() => {}}
                  onMarkDirty={markDirty}
                  onZoomReset={() => {
                    setTimeout(() => {
                      setZoom(80);
                      setZoomInput('80');
                    }, 50);
                  }}
                />
              )}
            </div>
          </div>
        </aside>
      )}

      <ShortcutHelpPanel open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <Dialog
        open={confirmLayoutSwitch.open}
        onOpenChange={(open) => setConfirmLayoutSwitch((prev) => ({ ...prev, open }))}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('alerts.switchLayoutTitle')}</DialogTitle>
            <DialogDescription>{t('alerts.switchLayoutConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmLayoutSwitch((prev) => ({ ...prev, open: false }))}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmLayoutSwitch.onConfirm();
                setConfirmLayoutSwitch((prev) => ({ ...prev, open: false }));
              }}
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <VariablesPanel
        open={showVariablesPanel}
        onOpenChange={setShowVariablesPanel}
        store={store as unknown as KernelStore}
        onDirty={markDirty}
      />
      <ProjectDialog
        open={showProjectDialog}
        language={language}
        onNewProject={() => {
          setCanvasConfig((prev) => ({ ...prev, id: generateId() }));
          setShowProjectDialog(false);
        }}
        onClose={() => {
          if (isAuthenticated && storageMode === 'cloud' && !hasSelectedDashboard) return;
          setShowProjectDialog(false);
        }}
        onProjectLoad={(project) => {
          setHasSelectedDashboard(true);
          try {
            localStorage.setItem(STORAGE_CONSTANTS.CURRENT_PROJECT_ID_KEY, project.meta.id);
          } catch {}
          store.getState().loadPage({
            id: project.meta.id,
            type: 'page' as const,
            version: project.meta.version,
            nodes: project.nodes,
            config: {
              mode: project.canvas.mode,
              width: project.canvas.width,
              height: project.canvas.height,
              theme: (project.canvas as any).theme || 'dawn',
            },
          });
          try {
            store.temporal.getState().clear?.();
          } catch {}
          setCanvasConfig((prev) => ({
            ...prev,
            id: project.meta.id,
            name: project.meta.name,
            createdAt: project.meta.createdAt,
            mode: project.canvas.mode,
            width: project.canvas.width,
            height: project.canvas.height,
            theme: validateCanvasTheme((project.canvas as any).theme),
            bgValue:
              typeof project.canvas.background === 'string'
                ? project.canvas.background
                : prev.bgValue,
            background:
              typeof project.canvas.background === 'object' && project.canvas.background !== null
                ? project.canvas.background
                : prev.background,
            gridCols: project.canvas.gridCols ?? prev.gridCols,
            gridRowHeight: project.canvas.gridRowHeight ?? prev.gridRowHeight,
            gridGap: project.canvas.gridGap ?? prev.gridGap,
            gridEnabled: project.canvas.gridEnabled ?? prev.gridEnabled,
            gridSize: project.canvas.gridSize ?? prev.gridSize,
            thumbnail: project.meta.thumbnail || '',
          }));
          if (project.variables && Array.isArray(project.variables)) {
            store.getState().setVariableDefinitions(project.variables);
            store.getState().initVariablesFromDefinitions(project.variables);
          }
          setShowProjectDialog(false);
        }}
      />
      <HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />
    </div>
  );
});

Editor.displayName = 'Editor';
export default Editor;
