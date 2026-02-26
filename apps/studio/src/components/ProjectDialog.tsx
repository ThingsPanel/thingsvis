/**
 * ProjectDialog Component
 * 
 * Dialog for opening recent projects and managing project files.
 * Uses a tree-view grouped layout: projects as collapsible group headers,
 * dashboards as child items. All projects and dashboards are loaded at once.
 * Supports both local storage (unauthenticated) and cloud storage (authenticated).
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileUp,
  FileDown,
  Plus,
  Trash2,
  Cloud,
  HardDrive,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
} from 'lucide-react'
import { useStorage } from '@/hooks/useStorage'
import { useProject } from '@/contexts/ProjectContext'
import { useAuth } from '@/lib/auth'
import * as dashboardsApi from '@/lib/api/dashboards'
import * as projectsApi from '@/lib/api/projects'
import type { ProjectFile } from '../lib/storage/schemas'
import type { StorageProjectMeta } from '@/lib/storage/adapter'

// =============================================================================
// Types
// =============================================================================

interface ProjectGroup {
  project: projectsApi.ProjectListItem
  dashboards: StorageProjectMeta[]
}

interface ConfirmDialogState {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
}

// =============================================================================
// Props
// =============================================================================

export interface ProjectDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** Callback when a project is selected/loaded */
  onProjectLoad: (project: ProjectFile) => void
  /** Callback when a new project should be created */
  onNewProject: () => void
  /** Current project for export */
  currentProject?: ProjectFile | null
  /** Language for localization */
  language?: 'zh' | 'en'
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
  const { isAuthenticated, storageMode } = useAuth()
  const { currentProject: cloudProject, switchProject } = useProject()

  // We still need useStorage for local mode and import/export
  const storage = useStorage(cloudProject?.id)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [projectName, setProjectName] = useState('')

  // Cloud mode: grouped data (projects + dashboards)
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([])
  // Track which projects are expanded
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Local mode: flat dashboard list
  const [localDashboards, setLocalDashboards] = useState<StorageProjectMeta[]>([])

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false, title: '', description: '', onConfirm: () => { },
  })

  const t = language === 'zh' ? translations.zh : translations.en

  // Load all data when dialog opens
  const lastLoadKey = useRef<string>('')

  useEffect(() => {
    if (!open) return

    const loadKey = `${open}-${refreshKey}`
    if (loadKey === lastLoadKey.current) return
    lastLoadKey.current = loadKey

    let cancelled = false

    const loadData = async () => {
      if (storage.isCloud) {
        try {
          // 1. Load all projects
          const projectsResponse = await projectsApi.listProjects({ page: 1, limit: 50 })
          if (cancelled) return
          if (projectsResponse.error) return

          const projectsList = Array.isArray(projectsResponse.data)
            ? projectsResponse.data
            : (projectsResponse.data?.data || [])

          // 2. Load dashboards for ALL projects in parallel
          const groups: ProjectGroup[] = await Promise.all(
            projectsList.map(async (project: projectsApi.ProjectListItem) => {
              try {
                const response = await dashboardsApi.listDashboards({
                  projectId: project.id,
                  limit: 50,
                })
                const list = !response.error
                  ? (Array.isArray(response.data) ? response.data : (response.data?.data || []))
                  : []

                return {
                  project,
                  dashboards: list.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    createdAt: new Date(d.createdAt).getTime(),
                    updatedAt: new Date(d.updatedAt).getTime(),
                  })),
                }
              } catch {
                return { project, dashboards: [] }
              }
            })
          )

          if (!cancelled) {
            setProjectGroups(groups)
            // Auto-expand the current project, collapse others
            const initialExpanded = new Set<string>()
            if (cloudProject?.id) {
              initialExpanded.add(cloudProject.id)
            } else if (groups.length > 0) {
              initialExpanded.add(groups[0].project.id)
            }
            setExpandedProjects(initialExpanded)
          }
        } catch {
          // ignore
        }
      } else {
        // Local storage: flat list
        try {
          const result = await storage.list({ limit: 50 })
          if (!cancelled) setLocalDashboards(result.data)
        } catch {
          // ignore
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [open, refreshKey, storage.isCloud])

  // Toggle project expand/collapse
  const toggleProject = useCallback((projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }, [])

  // Handle opening a dashboard (cloud)
  const handleOpenCloudDashboard = useCallback(async (
    meta: StorageProjectMeta,
    projectId: string
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      // Switch project if needed
      if (projectId !== cloudProject?.id) {
        await switchProject(projectId)
      }

      const response = await dashboardsApi.getDashboard(meta.id)
      if (response.error || !response.data) {
        throw new Error(response.error || t.projectNotFound)
      }

      const dashboard = response.data
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
      }

      onProjectLoad(projectFile)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError)
    } finally {
      setIsLoading(false)
    }
  }, [cloudProject?.id, switchProject, onProjectLoad, onClose, t])

  // Handle opening a dashboard (local)
  const handleOpenLocalDashboard = useCallback(async (meta: StorageProjectMeta) => {
    setIsLoading(true)
    setError(null)
    try {
      const project = await storage.get(meta.id)
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
        }
        onProjectLoad(projectFile)
        onClose()
      } else {
        setError(t.projectNotFound)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError)
    } finally {
      setIsLoading(false)
    }
  }, [storage, onProjectLoad, onClose, t])

  // Create new dashboard under a specific project (cloud)
  const handleNewDashboard = useCallback(async (projectId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await dashboardsApi.createDashboard({
        name: t.newDashboard,
        projectId,
      })

      if (response.error || !response.data) {
        throw new Error(response.error || t.loadError)
      }

      const dashboard = response.data
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
      }

      if (projectId !== cloudProject?.id) {
        await switchProject(projectId)
      }

      onProjectLoad(projectFile)
      setRefreshKey(k => k + 1)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError)
    } finally {
      setIsLoading(false)
    }
  }, [cloudProject?.id, switchProject, onProjectLoad, onClose, t])

  // Create new project (cloud)
  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) {
      setError(t.projectNameRequired)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const createResponse = await projectsApi.createProject({
        name: projectName.trim(),
      })

      if (createResponse.error || !createResponse.data) {
        throw new Error(createResponse.error || t.createProjectError)
      }

      setProjectName('')
      setRefreshKey(k => k + 1)
      // Auto-expand the new project
      setExpandedProjects(prev => new Set(prev).add(createResponse.data!.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createProjectError)
    } finally {
      setIsLoading(false)
    }
  }, [projectName, t])

  // Delete project (only when it has no dashboards)
  const handleDeleteProject = useCallback((projectId: string) => {
    setConfirmDialog({
      open: true,
      title: t.deleteProject,
      description: t.confirmDeleteProject,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }))
        setIsLoading(true)
        setError(null)
        try {
          const response = await projectsApi.deleteProject(projectId)
          if (response.error) {
            throw new Error(response.error)
          }
          setRefreshKey(k => k + 1)
        } catch (err) {
          setError(err instanceof Error ? err.message : t.deleteProjectError)
        } finally {
          setIsLoading(false)
        }
      },
    })
  }, [t])

  // Delete dashboard
  const handleDeleteDashboard = useCallback((dashboardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConfirmDialog({
      open: true,
      title: t.deleteDashboard,
      description: t.confirmDeleteDashboard,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, open: false }))
        try {
          if (storage.isCloud) {
            const response = await dashboardsApi.deleteDashboard(dashboardId)
            if (response.error) {
              throw new Error(response.error)
            }
          } else {
            await storage.delete(dashboardId)
          }
          setRefreshKey(k => k + 1)
        } catch (err) {
          setError(err instanceof Error ? err.message : t.deleteDashboardError)
        }
      },
    })
  }, [storage, t])

  // Import file
  const handleImport = useCallback(async () => {
    if (!storage.importProject) {
      setError('Import not supported in current storage mode')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.thingsvis,.json'

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsLoading(true)
      setError(null)
      try {
        await storage.importProject(file)
        setRefreshKey(k => k + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : t.importError)
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }, [storage, t])

  // Export current dashboard
  const handleExport = useCallback(async () => {
    if (!currentProject || !storage.exportProject) return

    try {
      const blob = await storage.exportProject(currentProject.meta.id)
      const url = URL.createObjectURL(blob)
      const filename = `${currentProject.meta.name}.thingsvis`

      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.exportError)
    }
  }, [currentProject, storage, t])

  // New project in local mode
  const handleNewLocal = useCallback(() => {
    onNewProject()
    onClose()
  }, [onNewProject, onClose])

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
            {/* ============================================================= */}
            {/* CLOUD MODE: Tree-view grouped by project                      */}
            {/* ============================================================= */}
            {storage.isCloud && (
              <>
                {/* Project tree */}
                <div className="max-h-80 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {projectGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {t.noProjects}
                    </p>
                  ) : (
                    projectGroups.map(({ project, dashboards }) => {
                      const isExpanded = expandedProjects.has(project.id)
                      const isCurrent = project.id === cloudProject?.id
                      const hasDashboards = dashboards.length > 0
                      const canDelete = !hasDashboards && !isCurrent

                      return (
                        <div key={project.id}>
                          {/* Project group header */}
                          <div
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer select-none group transition-colors
                            ${isCurrent
                                ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                : 'hover:bg-accent'
                              }`}
                            onClick={() => toggleProject(project.id)}
                          >
                            {/* Chevron */}
                            {isExpanded
                              ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                              : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            }
                            {/* Folder icon */}
                            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {/* Project name */}
                            <span className="text-sm font-medium truncate flex-1">
                              {project.name}
                            </span>
                            {/* Current badge */}
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 shrink-0">
                                {t.currentProject}
                              </span>
                            )}
                            {/* Dashboard count */}
                            <span className="text-xs text-muted-foreground shrink-0">
                              {dashboards.length}
                            </span>
                            {/* Action buttons (visible on hover) */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {/* New dashboard under this project */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNewDashboard(project.id)
                                }}
                                disabled={isLoading}
                                title={t.newDashboard}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              {/* Delete project (only if empty and not current) */}
                              {canDelete && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteProject(project.id)
                                  }}
                                  disabled={isLoading}
                                  title={hasDashboards ? t.cannotDeleteProject : t.deleteProject}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Dashboard children (expanded) */}
                          {isExpanded && (
                            <div className="ml-5 mt-0.5 space-y-0.5">
                              {dashboards.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2 pl-5">
                                  {t.noDashboards}
                                </p>
                              ) : (
                                dashboards.map(dashboard => (
                                  <div
                                    key={dashboard.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group/dash transition-colors"
                                    onClick={() => handleOpenCloudDashboard(dashboard, project.id)}
                                  >
                                    <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="text-sm truncate flex-1">
                                      {dashboard.name}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground shrink-0">
                                      {new Date(dashboard.updatedAt).toLocaleDateString(language)}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover/dash:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
                                      onClick={(e) => handleDeleteDashboard(dashboard.id, e)}
                                      disabled={isLoading}
                                      title={t.deleteDashboard}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Create new project */}
                <div className="flex gap-2">
                  <Input
                    placeholder={t.projectNamePlaceholder}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateProject}
                    disabled={isLoading || !projectName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t.createProject}
                  </Button>
                </div>
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
                      localDashboards.map(dashboard => (
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
        onOpenChange={(isOpen) => !isOpen && setConfirmDialog(prev => ({ ...prev, open: false }))}
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
  )
}

// =============================================================================
// Translations
// =============================================================================

const translations = {
  en: {
    title: 'Open Dashboard',
    description: 'Create a new dashboard, open a recent one, or import from file.',
    newDashboard: 'New Dashboard',
    projects: 'Projects',
    noProjects: 'No projects yet. Create one below.',
    projectNamePlaceholder: 'New project name...',
    createProject: 'Create Project',
    projectNameRequired: 'Project name is required.',
    createProjectError: 'Failed to create project.',
    defaultDashboardName: 'Default Dashboard',
    currentProject: 'Current',
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
    deleteProject: 'Delete project',
    confirmDeleteProject: 'Are you sure you want to delete this empty project?',
    deleteProjectError: 'Failed to delete project.',
    cannotDeleteProject: 'Cannot delete project with dashboards. Delete all dashboards first.',
    deleteDashboard: 'Delete dashboard',
    confirmDeleteDashboard: 'Are you sure you want to delete this dashboard?',
    deleteDashboardError: 'Failed to delete dashboard.',
    cancel: 'Cancel',
    confirm: 'Delete',
  },
  zh: {
    title: '打开画布',
    description: '创建新画布、打开最近画布或从文件导入。',
    newDashboard: '新建画布',
    projects: '项目',
    noProjects: '还没有项目，请在下方创建。',
    projectNamePlaceholder: '新项目名称...',
    createProject: '创建项目',
    projectNameRequired: '请输入项目名称。',
    createProjectError: '创建项目失败。',
    defaultDashboardName: '默认画布',
    currentProject: '当前',
    import: '导入',
    export: '导出',
    recentProjects: '最近画布',
    noDashboards: '还没有画布',
    projectNotFound: '未找到画布。',
    loadError: '加载画布失败。',
    importError: '导入文件失败。',
    exportError: '导出画布失败。',
    cloudMode: '云端存储',
    localMode: '本地存储',
    deleteProject: '删除项目',
    confirmDeleteProject: '确定删除此空项目吗？',
    deleteProjectError: '删除项目失败。',
    cannotDeleteProject: '该项目下有画布，无法删除。请先删除所有画布。',
    deleteDashboard: '删除画布',
    confirmDeleteDashboard: '确定删除此画布吗？',
    deleteDashboardError: '删除画布失败。',
    cancel: '取消',
    confirm: 'common.delete',
  },
}
