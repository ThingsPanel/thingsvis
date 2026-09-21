/**
 * ProjectDialog Component
 *
 * Dialog for opening recent projects and managing project files.
 * Shows dashboards directly across all backend projects. Project ownership stays internal.
 * Supports both local storage (unauthenticated) and cloud storage (authenticated).
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUp, FileDown, Plus, Trash2, Cloud, HardDrive, LayoutDashboard } from 'lucide-react';
import { useStorage } from '@/hooks/useStorage';
import { useProject } from '@/contexts/ProjectContext';
import * as dashboardsApi from '@/lib/api/dashboards';
import type { ProjectFile } from '../lib/storage/schemas';
import type { StorageProjectMeta } from '@/lib/storage/adapter';

// =============================================================================
// Types
// =============================================================================

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
}

// =============================================================================
// Props
// =============================================================================

export interface ProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when a project is selected/loaded */
  onProjectLoad: (project: ProjectFile) => void;
  /** Callback when a new project should be created */
  onNewProject: () => void;
  /** Current project for export */
  currentProject?: ProjectFile | null;
  /** Language for localization */
  language?: string;
}

// =============================================================================
// Component
// =============================================================================

export function ProjectDialog({
  open,
  onClose,
  onProjectLoad,
  onNewProject,
  currentProject,
  language = 'en',
}: ProjectDialogProps) {
  const { currentProject: cloudProject, switchProject } = useProject();

  // We still need useStorage for local mode and import/export
  const storage = useStorage(cloudProject?.id);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // Backend ownership is retained for opening and saving existing dashboards.
  const [cloudDashboards, setCloudDashboards] = useState<
    (StorageProjectMeta & { projectId: string })[]
  >([]);

  // Local mode: flat dashboard list
  const [localDashboards, setLocalDashboards] = useState<StorageProjectMeta[]>([]);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const t = language === 'zh' ? translations.zh : translations.en;

  // Load every page, rather than truncating at a project or a fixed first page.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setListLoading(true);
    setError(null);
    setSearch('');
    const loadData = async () => {
      try {
        if (storage.isCloud) {
          const rows: (StorageProjectMeta & { projectId: string })[] = [];
          let page = 1;
          while (!cancelled) {
            const response = await dashboardsApi.listDashboards({ page, limit: 100 });
            if (response.error || !response.data) throw new Error(response.error || t.loadError);
            rows.push(
              ...response.data.data.map((d) => ({
                id: d.id,
                name: d.name,
                projectId: d.projectId,
                createdAt: new Date(d.createdAt).getTime(),
                updatedAt: new Date(d.updatedAt).getTime(),
              })),
            );
            if (page >= response.data.meta.totalPages) break;
            page++;
          }
          if (!cancelled)
            setCloudDashboards([...new Map(rows.map((row) => [row.id, row])).values()]);
        } else {
          const rows: StorageProjectMeta[] = [];
          while (!cancelled) {
            const result = await storage.list({ limit: 100, offset: rows.length });
            rows.push(...result.data);
            if (!result.hasMore || !result.data.length) break;
          }
          if (!cancelled) setLocalDashboards(rows);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, [open, refreshKey, storage.isCloud]);

  // Handle opening a dashboard (cloud)
  const handleOpenCloudDashboard = useCallback(
    async (meta: StorageProjectMeta, projectId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // Switch project if needed
        if (projectId !== cloudProject?.id) {
          await switchProject(projectId);
        }

        const response = await dashboardsApi.getDashboard(meta.id);
        if (response.error || !response.data) {
          throw new Error(response.error || t.projectNotFound);
        }

        const dashboard = response.data;
        const projectFile: ProjectFile = {
          meta: {
            id: dashboard.id,
            name: dashboard.name,
            version: '1.0.0',
            thumbnail: dashboard.thumbnail,
            createdAt: new Date(dashboard.createdAt).getTime(),
            updatedAt: new Date(dashboard.updatedAt).getTime(),
          },
          canvas: dashboard.canvasConfig as any,
          nodes: (dashboard.nodes as any[]) || [],
          dataSources: (dashboard.dataSources as any[]) || [],
          variables: dashboard.variables || [],
        };

        onProjectLoad(projectFile);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setIsLoading(false);
      }
    },
    [cloudProject?.id, switchProject, onProjectLoad, onClose, t],
  );

  // Handle opening a dashboard (local)
  const handleOpenLocalDashboard = useCallback(
    async (meta: StorageProjectMeta) => {
      setIsLoading(true);
      setError(null);
      try {
        const project = await storage.get(meta.id);
        if (project) {
          const projectFile: ProjectFile = {
            meta: {
              id: project.meta.id,
              name: project.meta.name,
              version: '1.0.0',
              createdAt: project.meta.createdAt,
              updatedAt: project.meta.updatedAt,
            },
            canvas: project.schema.canvas,
            nodes: project.schema.nodes,
            dataSources: project.schema.dataSources || [],
            variables: project.schema.variables || [],
          };
          onProjectLoad(projectFile);
          onClose();
        } else {
          setError(t.projectNotFound);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError);
      } finally {
        setIsLoading(false);
      }
    },
    [storage, onProjectLoad, onClose, t],
  );

  // New dashboards use the server-managed default project.
  const handleNewDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardsApi.createDashboard({
        name: t.newDashboard,
      });

      if (response.error || !response.data) {
        throw new Error(response.error || t.loadError);
      }

      const dashboard = response.data;
      const projectFile: ProjectFile = {
        meta: {
          id: dashboard.id,
          name: dashboard.name,
          version: '1.0.0',
          createdAt: new Date(dashboard.createdAt).getTime(),
          updatedAt: new Date(dashboard.updatedAt).getTime(),
        },
        canvas: dashboard.canvasConfig as any,
        nodes: (dashboard.nodes ?? []) as any,
        dataSources: (dashboard.dataSources ?? []) as any,
        variables: dashboard.variables || [],
      };

      if (dashboard.projectId !== cloudProject?.id) {
        await switchProject(dashboard.projectId);
      }

      onProjectLoad(projectFile);
      setRefreshKey((k) => k + 1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [cloudProject?.id, switchProject, onProjectLoad, onClose, t]);

  // Delete dashboard
  const handleDeleteDashboard = useCallback(
    (dashboardId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConfirmDialog({
        open: true,
        title: t.deleteDashboard,
        description: t.confirmDeleteDashboard,
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          try {
            if (storage.isCloud) {
              const response = await dashboardsApi.deleteDashboard(dashboardId);
              if (response.error) {
                throw new Error(response.error);
              }
            } else {
              await storage.delete(dashboardId);
            }
            setRefreshKey((k) => k + 1);
          } catch (err) {
            setError(err instanceof Error ? err.message : t.deleteDashboardError);
          }
        },
      });
    },
    [storage, t],
  );

  // Import file
  const handleImport = useCallback(async () => {
    if (!storage.importProject) {
      setError('Import not supported in current storage mode');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.thingsvis,.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);
      try {
        await storage.importProject(file);
        setRefreshKey((k) => k + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : t.importError);
      } finally {
        setIsLoading(false);
      }
    };

    input.click();
  }, [storage, t]);

  // Export current dashboard
  const handleExport = useCallback(async () => {
    if (!currentProject || !storage.exportProject) return;

    try {
      const blob = await storage.exportProject(currentProject.meta.id);
      const url = URL.createObjectURL(blob);
      const filename = `${currentProject.meta.name}.thingsvis`;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.exportError);
    }
  }, [currentProject, storage, t]);

  // New project in local mode
  const handleNewLocal = useCallback(() => {
    onNewProject();
    onClose();
  }, [onNewProject, onClose]);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t.title}
              {storage.isCloud && <Cloud className="h-4 w-4 text-blue-500" />}
              {storage.isLocal && <HardDrive className="h-4 w-4 text-gray-500" />}
            </DialogTitle>
            <DialogDescription>
              {t.description}
              {storage.isCloud && ` (${t.cloudMode})`}
              {storage.isLocal && ` (${t.localMode})`}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {storage.isCloud && (
              <>
                <Input
                  placeholder={t.search}
                  aria-label={t.search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div
                  className="max-h-80 overflow-y-auto space-y-1 border rounded-lg p-2"
                  aria-busy={listLoading}
                >
                  {listLoading ? (
                    <p className="p-4 text-sm text-muted-foreground">{t.loading}</p>
                  ) : (
                    cloudDashboards
                      .filter((d) => d.name.toLowerCase().includes(search.trim().toLowerCase()))
                      .map((dashboard) => (
                        <div
                          key={dashboard.id}
                          className="flex items-center gap-2 rounded-md hover:bg-accent"
                        >
                          <button
                            type="button"
                            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left"
                            disabled={isLoading}
                            onClick={() => handleOpenCloudDashboard(dashboard, dashboard.projectId)}
                          >
                            <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate flex-1">{dashboard.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(dashboard.updatedAt).toLocaleDateString(language)}
                            </span>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-destructive"
                            disabled={isLoading}
                            aria-label={t.deleteDashboard}
                            onClick={(e) => handleDeleteDashboard(dashboard.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                  )}
                  {!listLoading &&
                    !error &&
                    !cloudDashboards.some((d) =>
                      d.name.toLowerCase().includes(search.trim().toLowerCase()),
                    ) && (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        {search.trim() ? t.noMatches : t.noDashboards}
                      </p>
                    )}
                </div>
                <Button
                  onClick={() => void handleNewDashboard()}
                  disabled={isLoading || listLoading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t.newDashboard}
                </Button>
                {error && (
                  <Button variant="outline" onClick={() => setRefreshKey((k) => k + 1)}>
                    {t.retry}
                  </Button>
                )}
              </>
            )}

            {/* ============================================================= */}
            {/* LOCAL MODE: Flat dashboard list (unchanged behavior)           */}
            {/* ============================================================= */}
            {storage.isLocal && (
              <>
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5"
                    onClick={handleNewLocal}
                    disabled={isLoading}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">{t.newDashboard}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-1.5"
                    onClick={handleImport}
                    disabled={isLoading || !storage.importProject}
                  >
                    <FileUp className="h-5 w-5" />
                    <span className="text-xs">{t.import}</span>
                  </Button>
                </div>

                {/* Local dashboards list */}
                <div className="border-t pt-3">
                  <h3 className="text-sm font-medium mb-2">{t.recentProjects}</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {localDashboards.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t.noDashboards}
                      </p>
                    ) : (
                      localDashboards.map((dashboard) => (
                        <div
                          key={dashboard.id}
                          className="flex items-center justify-between px-3 py-2 border rounded-md hover:bg-accent cursor-pointer group"
                          onClick={() => handleOpenLocalDashboard(dashboard)}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{dashboard.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(dashboard.updatedAt).toLocaleString(language)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={(e) => handleDeleteDashboard(dashboard.id, e)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ============================================================= */}
            {/* Shared: Import / Export buttons (cloud mode)                   */}
            {/* ============================================================= */}
            {storage.isCloud && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleImport}
                  disabled={isLoading || !storage.importProject}
                >
                  <FileUp className="h-4 w-4 mr-1" />
                  {t.import}
                </Button>
                {currentProject && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleExport}
                    disabled={isLoading || !storage.exportProject}
                  >
                    <FileDown className="h-4 w-4 mr-1" />
                    {t.export}
                  </Button>
                )}
              </div>
            )}

            {/* Local mode export */}
            {storage.isLocal && currentProject && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleExport}
                disabled={isLoading || !storage.exportProject}
              >
                <FileDown className="h-4 w-4 mr-2" />
                {t.export}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog (shadcn/ui AlertDialog) */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(isOpen) => !isOpen && setConfirmDialog((prev) => ({ ...prev, open: false }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDialog.onConfirm}
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// Translations
// =============================================================================

const translations = {
  en: {
    title: 'Open Dashboard',
    search: 'Search dashboards',
    loading: 'Loading dashboards…',
    noMatches: 'No matching dashboards',
    retry: 'Retry',
    description: 'Create a new dashboard, open a recent one, or import from file.',
    newDashboard: 'New Dashboard',
    import: 'Import',
    export: 'Export',
    recentProjects: 'Recent Dashboards',
    noDashboards: 'No dashboards yet',
    projectNotFound: 'Dashboard not found.',
    loadError: 'Failed to load dashboard.',
    importError: 'Failed to import file.',
    exportError: 'Failed to export dashboard.',
    cloudMode: 'Cloud Storage',
    localMode: 'Local Storage',
    deleteDashboard: 'Delete dashboard',
    confirmDeleteDashboard: 'Are you sure you want to delete this dashboard?',
    deleteDashboardError: 'Failed to delete dashboard.',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
  zh: {
    title: '打开看板',
    search: '搜索看板名称',
    loading: '加载看板中…',
    noMatches: '没有匹配的看板',
    retry: '重试',
    description: '创建新看板、打开最近看板或从文件导入。',
    newDashboard: '新建看板',
    import: '导入',
    export: '导出',
    recentProjects: '最近看板',
    noDashboards: '还没有看板',
    projectNotFound: '未找到看板。',
    loadError: '加载看板失败。',
    importError: '导入文件失败。',
    exportError: '导出看板失败。',
    cloudMode: '云端存储',
    localMode: '本地存储',
    deleteDashboard: '删除看板',
    confirmDeleteDashboard: '确定删除此看板吗？',
    deleteDashboardError: '删除看板失败。',
    cancel: '取消',
    confirm: '删除',
  },
};
