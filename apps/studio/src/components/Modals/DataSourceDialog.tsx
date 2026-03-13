import React, { useMemo, useState } from 'react';
import { Plus, Database, Trash2, Globe, Zap, FileJson, Info, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { type KernelStore, dataSourceManager } from '@thingsvis/kernel';
import type { DataSourceType, RESTConfig, WSConfig } from '@thingsvis/schema';
import {
  DEFAULT_AUTH_CONFIG,
  DEFAULT_RECONNECT_POLICY,
  DEFAULT_HEARTBEAT_CONFIG,
} from '@thingsvis/schema';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { RESTForm } from '../DataSourceConfig/RESTForm';
import { WSForm } from '../DataSourceConfig/WSForm';
import { TransformationEditor } from '../DataSourceConfig/TransformationEditor';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { useTranslation } from 'react-i18next';

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
  reconnectAttempts: 5, // Backward compatibility - deprecated but required
  reconnect: DEFAULT_RECONNECT_POLICY,
  heartbeat: DEFAULT_HEARTBEAT_CONFIG,
  initMessages: [],
};

interface DataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: KernelStore;
}

export function DataSourceDialog({ open, onOpenChange, store }: DataSourceDialogProps) {
  const { t, i18n } = useTranslation('editor');
  const language = i18n.language as string;
  const { states } = useDataSourceRegistry(store);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [staticJsonText, setStaticJsonText] = useState<string>('{}');
  const [staticJsonError, setStaticJsonError] = useState<string | null>(null);

  const [editingSource, setEditingSource] = useState<{
    id: string;
    type: DataSourceType;
    config: any;
    transformation: string;
  }>({
    id: '',
    type: 'STATIC',
    config: { value: {} },
    transformation: '',
  });
  const jsonExtensions = useMemo(() => [json()], []);

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
    if (!editingSource.id || !isValidDataSourceId(editingSource.id)) return;

    if (editingSource.type === 'STATIC') {
      try {
        const parsed = JSON.parse(staticJsonText || '{}');
        setStaticJsonError(null);
        editingSource.config = { value: parsed };
      } catch {
        setStaticJsonError(t('auto.modals.invalidJson'));
        return;
      }
    }

    try {
      await dataSourceManager.registerDataSource({
        id: editingSource.id,
        name: editingSource.id,
        type: editingSource.type,
        config: editingSource.config,
        transformation: editingSource.transformation || undefined,
      });
      setIsAdding(false);
      setSelectedId(editingSource.id);
    } catch (e) {}
  };

  const startAdding = () => {
    setIsAdding(true);
    setSelectedId(null);
    setEditingSource({ id: '', type: 'STATIC', config: { value: {} }, transformation: '' });
    syncStaticJsonTextFromConfig({});
  };

  const selectSource = (id: string) => {
    const config = dataSourceManager.getConfig(id);
    if (config) {
      setIsAdding(false);
      setSelectedId(id);
      setEditingSource({
        id: config.id,
        type: config.type,
        config: config.config,
        transformation: config.transformation || '',
      });
      if (config.type === 'STATIC') {
        // Keep editor editable even with temporarily invalid JSON while typing.
        syncStaticJsonTextFromConfig((config.config as any)?.value);
      } else {
        setStaticJsonError(null);
      }
    }
  };

  const deleteSource = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dataSourceManager.unregisterDataSource(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-[96vw] h-[92vh] p-0 flex flex-col gap-0 overflow-hidden bg-background border-border shadow-2xl rounded-md">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#6965db]/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-[#6965db]" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {t('auto.modals.dataSourceCenter')}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {t('auto.modals.manageGlobalDataConnectionsAndStatu')}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
            <div className="p-3 flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-muted-foreground">
                {t('auto.modals.configuredSources')}
              </div>
              <Button
                onClick={startAdding}
                size="sm"
                className="bg-[#6965db] hover:bg-[#5851db] h-8 text-sm font-medium"
              >
                {t('auto.modals.add')}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
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
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${ds.status === 'connected' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-yellow-400'}`}
                    />
                    <span className="text-sm font-semibold truncate">{ds.id}</span>
                  </div>
                  <button
                    onClick={(e) => deleteSource(e, ds.id)}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${selectedId === ds.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-500/10 text-destructive'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {Object.keys(states).length === 0 && (
                <div className="py-12 text-center text-muted-foreground/40 text-sm italic">
                  {t('auto.modals.empty')}
                </div>
              )}
            </div>
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            {isAdding || selectedId ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="w-full h-full space-y-6">
                  {/* Basic Info Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <div className="w-1 h-4 bg-[#6965db] rounded-full" />
                      {t('auto.modals.1BasicInformation')}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('auto.modals.sourceId')}
                        </label>
                        <Input
                          placeholder="e.g. weather_api"
                          value={editingSource.id}
                          onChange={(e) => {
                            // 只允许输入字母、数字和下划线
                            const sanitized = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                            setEditingSource({ ...editingSource, id: sanitized });
                          }}
                          disabled={!!selectedId && !isAdding}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('auto.modals.protocol')}
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
                              <t.icon className="h-3.5 w-3.5" />
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Configuration Grid */}
                  <div className="grid grid-cols-2 gap-8">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <div className="w-1 h-4 bg-[#6965db] rounded-full" />
                        {t('auto.modals.2ProtocolConfig')}
                      </div>
                      <div className="p-5 rounded-md border border-border bg-muted/5 min-h-[300px]">
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
                                height="260px"
                                extensions={jsonExtensions}
                                className="text-sm [&_.cm-content]:text-sm [&_.cm-line]:text-sm [&_.cm-gutters]:text-sm"
                                onChange={(value) => {
                                  setStaticJsonText(value);
                                  try {
                                    const parsed = JSON.parse(value || '{}');
                                    setEditingSource({
                                      ...editingSource,
                                      config: { value: parsed },
                                    });
                                    setStaticJsonError(null);
                                  } catch {
                                    setStaticJsonError(t('auto.modals.invalidJson'));
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
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <div className="w-1 h-4 bg-[#6965db] rounded-full" />
                        {t('auto.modals.3Transformation')}
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
                  <section className="space-y-4 pb-16">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Activity className="h-4 w-4 text-[#6965db]" />
                        {t('auto.modals.livePreview')}
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
                    <div className="rounded-md border border-border bg-black/[0.02] dark:bg-black/20 p-4 font-mono text-sm min-h-[120px] max-h-[200px] overflow-auto shadow-inner">
                      {selectedId && states[selectedId]?.data ? (
                        <pre className="text-muted-foreground whitespace-pre-wrap">
                          {JSON.stringify(states[selectedId].data, null, 2)}
                        </pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-2 py-10">
                          <Info className="h-5 w-5" />
                          <p>{t('auto.modals.waitingForData')}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="h-9 px-6 rounded-md"
                  >
                    {t('auto.modals.cancel')}
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="h-9 px-10 bg-[#6965db] hover:bg-[#5851db] font-bold shadow-lg shadow-[#6965db]/20 rounded-md"
                  >
                    {t('auto.modals.saveConnect')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40">
                <Database className="h-16 w-16 mb-4" />
                <p className="text-sm font-medium">{t('auto.modals.selectADataSourceToBegin')}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
