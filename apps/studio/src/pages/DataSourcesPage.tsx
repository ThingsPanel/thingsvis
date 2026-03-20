import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Database,
  Trash2,
  Globe,
  Zap,
  FileJson,
  Info,
  Activity,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { DataSourceType, DataSourceMode, RESTConfig, WSConfig } from '@thingsvis/schema';
import {
  DEFAULT_AUTH_CONFIG,
  DEFAULT_RECONNECT_POLICY,
  DEFAULT_HEARTBEAT_CONFIG,
} from '@thingsvis/schema';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { RESTForm } from '../components/DataSourceConfig/RESTForm';
import { WSForm } from '../components/DataSourceConfig/WSForm';
import { TransformationEditor } from '../components/DataSourceConfig/TransformationEditor';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { dataSourceManager, store } from '../lib/store';
import { buildHashRoute } from '../lib/embed/navigation';

// Default configurations for new data sources
const DEFAULT_REST_CONFIG: RESTConfig = {
  url: '',
  method: 'GET',
  headers: {},
  params: {},
  pollingInterval: 0,
  timeout: 30,
  auth: DEFAULT_AUTH_CONFIG,
};

const DEFAULT_WS_CONFIG: WSConfig = {
  url: '',
  protocols: [],
  reconnectAttempts: 5, // Backward compatibility
  reconnect: DEFAULT_RECONNECT_POLICY,
  heartbeat: DEFAULT_HEARTBEAT_CONFIG,
  initMessages: [],
};

export default function DataSourcesPage() {
  const { states } = useDataSourceRegistry(store);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useTranslation('pages');

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
    type?: 'success' | 'error';
  }>({
    message: '',
    visible: false,
    type: 'success',
  });

  // Alert Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<string | null>(null);
  const [sourceNameToDelete, setSourceNameToDelete] = useState<string>('');

  const [staticJsonText, setStaticJsonText] = useState<string>('{}');
  const [staticJsonError, setStaticJsonError] = useState<string | null>(null);

  const [editingSource, setEditingSource] = useState<{
    id: string;
    name: string;
    type: DataSourceType;
    config: any;
    transformation: string;
    mode: DataSourceMode;
  }>({
    id: '',
    name: '',
    type: 'STATIC',
    config: { value: {} },
    transformation: '',
    mode: 'auto',
  });

  const jsonExtensions = useMemo(() => [json()], []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
  };

  const syncStaticJsonTextFromConfig = (configValue: unknown) => {
    try {
      setStaticJsonText(JSON.stringify(configValue ?? {}, null, 2));
      setStaticJsonError(null);
    } catch {
      setStaticJsonText('{}');
      setStaticJsonError(null);
    }
  };

  // 验证数据源 ID 格式（只允许字母、数字和下划线）
  const isValidDataSourceId = (id: string) => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id);

  const handleSave = async () => {
    if (!editingSource.id) {
      showToast(t('dataSources.enterSourceId'), 'error');
      return;
    }

    if (!isValidDataSourceId(editingSource.id)) {
      showToast(t('dataSources.invalidSourceId'), 'error');
      return;
    }

    if (editingSource.type === 'STATIC') {
      try {
        const parsed = JSON.parse(staticJsonText || '{}');
        setStaticJsonError(null);
        editingSource.config = { value: parsed };
      } catch {
        setStaticJsonError(t('dataSources.invalidJson'));
        return;
      }
    }

    try {
      await dataSourceManager.registerDataSource({
        id: editingSource.id,
        name: editingSource.name || editingSource.id,
        type: editingSource.type,
        config: editingSource.config,
        transformation: editingSource.transformation || undefined,
        mode: editingSource.mode,
      });
      setIsAdding(false);
      setSelectedId(editingSource.id);
      showToast(t('dataSources.saveSuccess'), 'success');
    } catch (e) {
      showToast(t('dataSources.saveFailed') + String(e), 'error');
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setSelectedId(null);
    setEditingSource({
      id: '',
      name: '',
      type: 'STATIC',
      config: { value: {} },
      transformation: '',
      mode: 'auto',
    });
    syncStaticJsonTextFromConfig({});
  };

  const selectSource = (id: string) => {
    const config = dataSourceManager.getConfig(id);
    if (config) {
      setIsAdding(false);
      setSelectedId(id);
      setEditingSource({
        id: config.id,
        name: config.name || '',
        type: config.type,
        config: config.config,
        transformation: config.transformation || '',
        mode: dataSourceManager.getResolvedMode(id),
      });
      if (config.type === 'STATIC') {
        syncStaticJsonTextFromConfig((config.config as any)?.value);
      } else {
        setStaticJsonError(null);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    // Find name for confirmation
    const config = dataSourceManager.getConfig(id);
    setSourceToDelete(id);
    setSourceNameToDelete(config?.name || id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!sourceToDelete) return;

    try {
      await dataSourceManager.unregisterDataSource(sourceToDelete);
      if (selectedId === sourceToDelete) setSelectedId(null);

      showToast(t('dataSources.deleted'), 'success');
    } catch (error) {
      console.error('Failed to delete data source:', error);
      showToast(t('dataSources.deleteFailed'), 'error');
    } finally {
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
    }
  };

  const goBack = () => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const isEmbedded = params.get('mode') === 'embedded';
    const projectId = params.get('projectId');

    if (projectId) {
      if (isEmbedded) {
        window.location.hash = buildHashRoute(`#/editor/${projectId}`, {
          preserveCurrentParams: true,
          params: { projectId: null, resumeSession: '1' },
        });
      } else {
        window.location.hash = `#/editor/${projectId}`;
      }
    } else {
      window.location.hash = '#/';
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-card text-foreground">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border ${
            toast.type === 'error'
              ? 'bg-destructive/10 border-destructive text-destructive bg-white dark:bg-zinc-900'
              : 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400 bg-white dark:bg-zinc-900'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="ml-2 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dataSources.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dataSources.confirmDeleteDesc', { name: sourceNameToDelete })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dataSources.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dataSources.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="p-4 border-b border-border bg-muted/30 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={goBack} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[#6965db]/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-[#6965db]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{t('dataSources.centerTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('dataSources.centerSubtitle')}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-border bg-muted/10 flex flex-col shrink-0">
          <div className="p-4 flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-muted-foreground">
              {t('dataSources.configuredSources')}
            </div>
            <Button
              onClick={startAdding}
              size="sm"
              className="bg-[#6965db] hover:bg-[#5851db] h-8 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {t('dataSources.addNew')}
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {Object.values(states).map((ds) => (
              <div
                key={ds.id}
                onClick={() => selectSource(ds.id)}
                className={`px-3 py-2.5 rounded-md border transition-all cursor-pointer group flex items-center justify-between ${
                  selectedId === ds.id
                    ? 'bg-[#6965db] text-white border-[#6965db] shadow-md'
                    : 'border-transparent hover:bg-accent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${ds.status === 'connected' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-yellow-400'}`}
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-semibold truncate">
                      {(() => {
                        const cfg = dataSourceManager.getConfig(ds.id);
                        return cfg?.name || ds.id;
                      })()}
                    </span>
                    {(() => {
                      const cfg = dataSourceManager.getConfig(ds.id);
                      return cfg?.name ? (
                        <span
                          className={`text-[10px] truncate ${selectedId === ds.id ? 'text-white/60' : 'text-muted-foreground'}`}
                        >
                          {ds.id}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {(() => {
                    const mode = dataSourceManager.getResolvedMode(ds.id);
                    return (
                      <span
                        className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                          mode === 'manual'
                            ? selectedId === ds.id
                              ? 'bg-white/20 text-white'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : selectedId === ds.id
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {mode === 'manual'
                          ? t('dataSources.modeManualShort')
                          : t('dataSources.modeAutoShort')}
                      </span>
                    );
                  })()}
                </div>
                <button
                  onClick={(e) => handleDeleteClick(e, ds.id)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${selectedId === ds.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-500/10 text-destructive'}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {Object.keys(states).length === 0 && !isAdding && (
              <div className="py-16 text-center text-muted-foreground/40 text-sm italic">
                {t('dataSources.empty')}
              </div>
            )}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col bg-card relative overflow-hidden">
          {isAdding || selectedId ? (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-5xl mx-auto space-y-8">
                {/* Basic Info Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <div className="w-1 h-5 bg-[#6965db] rounded-full" />
                    {t('dataSources.basicInfo')}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('dataSources.sourceId')}
                      </label>
                      <Input
                        placeholder={t('dataSources.sourceIdPlaceholder')}
                        value={editingSource.id}
                        onChange={(e) => {
                          // 只允许输入字母、数字和下划线
                          const sanitized = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                          setEditingSource({ ...editingSource, id: sanitized });
                        }}
                        disabled={!!selectedId && !isAdding}
                        className="font-mono text-sm h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('dataSources.sourceIdHint')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('dataSources.sourceName')}
                      </label>
                      <Input
                        placeholder={t('dataSources.sourceNamePlaceholder')}
                        value={editingSource.name || ''}
                        onChange={(e) =>
                          setEditingSource({ ...editingSource, name: e.target.value })
                        }
                        className="text-sm h-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('dataSources.protocol')}
                      </label>
                      <div className="flex gap-1 p-1 bg-muted rounded-md h-10">
                        {[
                          { id: 'STATIC', icon: FileJson, label: 'JSON' },
                          { id: 'REST', icon: Globe, label: 'REST' },
                          { id: 'WS', icon: Zap, label: 'WS' },
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              let newConfig: any;
                              if (t.id === 'STATIC') {
                                newConfig = { value: {} };
                                syncStaticJsonTextFromConfig({});
                              } else if (t.id === 'REST') {
                                newConfig = { ...DEFAULT_REST_CONFIG };
                                setStaticJsonError(null);
                              } else if (t.id === 'WS') {
                                newConfig = { ...DEFAULT_WS_CONFIG };
                                setStaticJsonError(null);
                              } else {
                                newConfig = {};
                                setStaticJsonError(null);
                              }
                              setEditingSource({
                                ...editingSource,
                                type: t.id as DataSourceType,
                                config: newConfig,
                              });
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md transition-all text-sm font-semibold ${
                              editingSource.type === t.id
                                ? 'bg-background text-[#6965db] shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <t.icon className="h-4 w-4" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('dataSources.triggerMode')}
                      </label>
                      <div className="flex gap-1 p-1 bg-muted rounded-md h-10">
                        {[
                          { id: 'auto' as const, label: t('dataSources.modeAuto') },
                          { id: 'manual' as const, label: t('dataSources.modeManual') },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setEditingSource({ ...editingSource, mode: m.id })}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-md transition-all text-sm font-semibold ${
                              editingSource.mode === m.id
                                ? 'bg-background text-[#6965db] shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {editingSource.mode === 'auto'
                          ? t('dataSources.modeAutoHint')
                          : t('dataSources.modeManualHint')}
                      </p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Configuration Grid */}
                <div className="grid grid-cols-2 gap-10">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <div className="w-1 h-5 bg-[#6965db] rounded-full" />
                      {t('dataSources.protocolConfig')}
                    </div>
                    <div className="p-5 rounded-md border border-border bg-muted/5 min-h-[320px]">
                      {editingSource.type === 'REST' && (
                        <RESTForm
                          config={editingSource.config}
                          onChange={(c) => setEditingSource({ ...editingSource, config: c })}
                        />
                      )}
                      {editingSource.type === 'WS' && (
                        <WSForm
                          config={editingSource.config}
                          onChange={(c) => setEditingSource({ ...editingSource, config: c })}
                        />
                      )}
                      {editingSource.type === 'STATIC' && (
                        <div className="space-y-2">
                          <div className="rounded-md border border-input overflow-hidden bg-muted/20">
                            <CodeMirror
                              value={staticJsonText}
                              height="280px"
                              extensions={jsonExtensions}
                              className="text-sm font-mono [&_.cm-content]:font-mono [&_.cm-content]:text-sm [&_.cm-line]:text-sm [&_.cm-gutters]:text-sm [&_.cm-gutters]:font-mono"
                              onChange={(value) => {
                                setStaticJsonText(value);
                                try {
                                  const parsed = JSON.parse(value || '{}');
                                  setEditingSource({ ...editingSource, config: { value: parsed } });
                                  setStaticJsonError(null);
                                } catch {
                                  setStaticJsonError(t('dataSources.invalidJson'));
                                }
                              }}
                            />
                          </div>
                          {staticJsonError && (
                            <div className="text-sm text-destructive">{staticJsonError}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <div className="w-1 h-5 bg-[#6965db] rounded-full" />
                      {t('dataSources.transformation')}
                    </div>
                    <TransformationEditor
                      code={editingSource.transformation}
                      onChange={(code) =>
                        setEditingSource({ ...editingSource, transformation: code })
                      }
                    />
                  </section>
                </div>

                <Separator />

                {/* Runtime Preview */}
                <section className="space-y-4 pb-24">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                      <Activity className="h-5 w-5 text-[#6965db]" />
                      {t('dataSources.livePreview')}
                    </div>
                    {selectedId && states[selectedId] && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground italic">
                          Last Update:{' '}
                          {new Date(states[selectedId].lastUpdated).toLocaleTimeString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold border ${
                            states[selectedId].status === 'connected'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {states[selectedId].status.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-md border border-border bg-black/[0.02] dark:bg-black/20 p-4 font-mono text-sm min-h-[140px] max-h-[240px] overflow-auto shadow-inner">
                    {selectedId && states[selectedId]?.data ? (
                      <pre className="text-muted-foreground whitespace-pre-wrap">
                        {JSON.stringify(states[selectedId].data, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-2 py-12">
                        <Info className="h-6 w-6" />
                        <p>{t('dataSources.waitingForData')}</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Footer Actions */}
              <div className="fixed bottom-0 left-72 right-0 p-4 bg-card/90 backdrop-blur-md border-t border-border flex justify-end gap-3">
                <Button variant="outline" onClick={goBack} className="h-10 px-6 rounded-md">
                  {t('dataSources.backToEditor')}
                </Button>
                <Button
                  onClick={handleSave}
                  className="h-10 px-10 bg-[#6965db] hover:bg-[#5851db] font-bold shadow-lg shadow-[#6965db]/20 rounded-md"
                >
                  {t('dataSources.saveAndConnect')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
              <Database className="h-20 w-20 mb-6" />
              <p className="text-base font-medium">{t('dataSources.selectToBegin')}</p>
              <p className="text-sm mt-2">{t('dataSources.orClickAdd')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
