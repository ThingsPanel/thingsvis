import React, { useState } from 'react';
import { Plus, Database, Trash2, Settings2, X, Globe, Zap, FileJson, Info, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type KernelStore, type DataSourceType, dataSourceManager } from '@thingsvis/kernel';
import { useDataSourceRegistry } from '@thingsvis/ui';
import { RESTForm } from '../../plugins/DataSourceConfig/RESTForm';
import { WSForm } from '../../plugins/DataSourceConfig/WSForm';
import { TransformationEditor } from '../../plugins/DataSourceConfig/TransformationEditor';

interface DataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: KernelStore;
  language: 'zh' | 'en';
}

export function DataSourceDialog({ open, onOpenChange, store, language }: DataSourceDialogProps) {
  const { states } = useDataSourceRegistry(store);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  const [editingSource, setEditingSource] = useState<{
    id: string;
    type: DataSourceType;
    config: any;
    transformation: string;
  }>({
    id: '',
    type: 'STATIC',
    config: { value: {} },
    transformation: ''
  });

  const label = (zh: string, en: string) => language === 'zh' ? zh : en;

  const handleSave = async () => {
    if (!editingSource.id) return;
    try {
      await dataSourceManager.registerDataSource({
        id: editingSource.id,
        name: editingSource.id,
        type: editingSource.type,
        config: editingSource.config,
        transformation: editingSource.transformation || undefined
      });
      setIsAdding(false);
      setSelectedId(editingSource.id);
    } catch (e) {
      console.error('[DataSourceDialog] Failed to save source', e);
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setSelectedId(null);
    setEditingSource({ id: '', type: 'STATIC', config: { value: {} }, transformation: '' });
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
        transformation: config.transformation || ''
      });
    }
  };

  const deleteSource = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await dataSourceManager.unregisterDataSource(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-none max-w-[1920px] w-[98vw] h-[96vh] p-0 flex flex-col gap-0 overflow-hidden bg-background border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6965db]/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-[#6965db]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">{label('数据源中心', 'Data Source Center')}</DialogTitle>
                <DialogDescription className="text-xs">{label('管理全局数据连接与实时状态', 'Manage global data connections and status')}</DialogDescription>
              </div>
            </div>
            <Button onClick={startAdding} className="bg-[#6965db] hover:bg-[#5851db] gap-2">
              <Plus className="h-4 w-4" />
              {label('新增数据源', 'Add Source')}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-muted/10 flex flex-col shrink-0">
            <div className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label('已配置列表', 'Configured Sources')}</div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {Object.values(states).map((ds) => (
                <div 
                  key={ds.id} 
                  onClick={() => selectSource(ds.id)}
                  className={`px-3 py-2.5 rounded-lg border transition-all cursor-pointer group flex items-center justify-between ${
                    selectedId === ds.id 
                      ? 'bg-[#6965db] text-white border-[#6965db] shadow-md' 
                      : 'border-transparent hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ds.status === 'connected' ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-yellow-400'}`} />
                    <span className="text-xs font-bold truncate">{ds.id}</span>
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
                <div className="py-12 text-center text-muted-foreground/40 text-xs italic">{label('暂无配置', 'Empty')}</div>
              )}
            </div>
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
            {(isAdding || selectedId) ? (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="w-full h-full space-y-8">
                  {/* Basic Info Section */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <div className="w-1 h-4 bg-[#6965db] rounded-full" />
                      {label('1. 基本信息', '1. Basic Information')}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">{label('标识 ID', 'Source ID')}</label>
                        <Input 
                          placeholder="e.g. weather_api"
                          value={editingSource.id}
                          onChange={(e) => setEditingSource({...editingSource, id: e.target.value})}
                          disabled={!!selectedId && !isAdding}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-muted-foreground uppercase">{label('连接协议', 'Protocol')}</label>
                        <div className="flex gap-1 p-1 bg-muted rounded-lg h-10">
                          {[
                            { id: 'STATIC', icon: FileJson, label: 'JSON' },
                            { id: 'REST', icon: Globe, label: 'REST' },
                            { id: 'WS', icon: Zap, label: 'WS' }
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() => setEditingSource({...editingSource, type: t.id as DataSourceType, config: t.id === 'STATIC' ? {value: {}} : {}})}
                              className={`flex-1 flex items-center justify-center gap-2 rounded-md transition-all text-[10px] font-bold ${
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
                  <div className="grid grid-cols-2 gap-10">
                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <div className="w-1 h-4 bg-[#6965db] rounded-full" />
                        {label('2. 协议配置', '2. Protocol Config')}
                      </div>
                      <div className="p-5 rounded-xl border border-border bg-muted/5 min-h-[300px]">
                        {editingSource.type === 'REST' && <RESTForm config={editingSource.config} onChange={(c) => setEditingSource({...editingSource, config: c})} language={language} />}
                        {editingSource.type === 'WS' && <WSForm config={editingSource.config} onChange={(c) => setEditingSource({...editingSource, config: c})} language={language} />}
                        {editingSource.type === 'STATIC' && (
                          <textarea 
                            className="w-full h-[260px] p-3 text-xs font-mono rounded-lg border border-input bg-muted/20 resize-none focus:ring-1 focus:ring-[#6965db]"
                            value={JSON.stringify(editingSource.config.value, null, 2)}
                            placeholder='{ "key": "value" }'
                            onChange={(e) => {
                              try {
                                const val = JSON.parse(e.target.value);
                                setEditingSource({...editingSource, config: { value: val }});
                              } catch {}
                            }}
                          />
                        )}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <div className="w-1 h-4 bg-[#6965db] rounded-full" />
                        {label('3. 数据转换', '3. Transformation')}
                      </div>
                      <TransformationEditor 
                        code={editingSource.transformation} 
                        onChange={(code) => setEditingSource({...editingSource, transformation: code})} 
                        language={language} 
                      />
                    </section>
                  </div>

                  <Separator />

                  {/* Runtime Preview */}
                  <section className="space-y-4 pb-20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Activity className="h-4 w-4 text-[#6965db]" />
                        {label('实时运行预览', 'Live Preview')}
                      </div>
                      {selectedId && states[selectedId] && (
                        <div className="flex items-center gap-4 text-[10px]">
                          <span className="text-muted-foreground italic">Last Update: {new Date(states[selectedId].lastUpdated).toLocaleTimeString()}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold border ${
                            states[selectedId].status === 'connected' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {states[selectedId].status.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-xl border border-border bg-black/[0.02] dark:bg-black/20 p-4 font-mono text-[11px] min-h-[120px] max-h-[200px] overflow-auto shadow-inner">
                      {selectedId && states[selectedId]?.data ? (
                        <pre className="text-muted-foreground whitespace-pre-wrap">{JSON.stringify(states[selectedId].data, null, 2)}</pre>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-2 py-10">
                          <Info className="h-5 w-5" />
                          <p>{label('等待数据推送或轮询...', 'Waiting for data...')}</p>
                        </div>
                      )}
                    </div>
                  </section>
                </div>

                {/* Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-md border-t border-border flex justify-end gap-3">
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-6">{label('取消', 'Cancel')}</Button>
                  <Button 
                    onClick={handleSave} 
                    className="h-10 px-10 bg-[#6965db] hover:bg-[#5851db] font-bold shadow-lg shadow-[#6965db]/20"
                  >
                    {label('保存并连接', 'Save & Connect')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/20">
                <Database className="h-24 w-24 mb-6" />
                <p className="text-sm font-medium">{label('从左侧选择一个数据源开始配置', 'Select a data source to begin')}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
