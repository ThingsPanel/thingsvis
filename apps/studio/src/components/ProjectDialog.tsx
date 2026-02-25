/**
 * ProjectDialog Component
 * 
 * Dialog for opening recent projects and managing project files.
 * Provides open, save, import, and export functionality.
 * Now supports both local storage (unauthenticated) and cloud storage (authenticated).
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderOpen, FileUp, FileDown, Plus, Trash2, Cloud, HardDrive } from 'lucide-react'
import { useStorage } from '@/hooks/useStorage'
import { useProject } from '@/contexts/ProjectContext'
import { useAuth } from '@/lib/auth'
import * as dashboardsApi from '@/lib/api/dashboards'
import * as projectsApi from '@/lib/api/projects'
import type { ProjectFile, RecentProjectEntry } from '../lib/storage/schemas'
import type { StorageProjectMeta } from '@/lib/storage/adapter'

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
  const { isAuthenticated, user, token, storageMode } = useAuth()
  const { currentProject: cloudProject, switchProject } = useProject()

  // 本地选中的项目ID（用于在对话框中选择项目）
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(cloudProject?.id)
  const storage = useStorage(selectedProjectId)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [dashboards, setDashboards] = useState<StorageProjectMeta[]>([])
  const [projects, setProjects] = useState<projectsApi.ProjectListItem[]>([])
  const [projectName, setProjectName] = useState('')

  const t = language === 'zh' ? translations.zh : translations.en

  // Debug: Log auth and storage state
  useEffect(() => {

  }, [isAuthenticated, user, token, storageMode, storage.backend, cloudProject, selectedProjectId])

  // 当 cloudProject 变化时，同步到 selectedProjectId
  useEffect(() => {
    if (cloudProject?.id && !selectedProjectId) {
      setSelectedProjectId(cloudProject.id)
    }
  }, [cloudProject?.id])

  // Load dashboards list when dialog opens or selected project changes
  const lastLoadKey = useRef<string>('')

  useEffect(() => {
    if (!open) return

    // 创建一个唯一的加载 key，防止重复请求
    const loadKey = `${open}-${refreshKey}-${selectedProjectId || 'none'}`
    if (loadKey === lastLoadKey.current) return
    lastLoadKey.current = loadKey

    let cancelled = false

    const loadData = async () => {
      // Load projects (cloud mode only)
      if (storage.isCloud) {
        try {
          const response = await projectsApi.listProjects({ page: 1, limit: 50 })
          if (!cancelled && !response.error) {
            const projectsList = Array.isArray(response.data)
              ? response.data
              : (response.data?.data || [])
            setProjects(projectsList)
          }
        } catch (err) {

        }
      }

      // Load dashboards - 直接调用 API 而不是通过 storage
      try {
        if (storage.isCloud) {
          if (!selectedProjectId) {
            if (!cancelled) setDashboards([])
          } else {
            const response = await dashboardsApi.listDashboards({ projectId: selectedProjectId, limit: 50 })

            if (!cancelled && !response.error) {
              // API 返回格式: { data: [...], meta: {...} }
              // response.data 可能直接是数组，也可能是 { data: [...], meta: {...} }
              const list = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || [])

              setDashboards(list.map((d: any) => ({
                id: d.id,
                name: d.name,
                createdAt: new Date(d.createdAt).getTime(),
                updatedAt: new Date(d.updatedAt).getTime(),
              })))
            }
          }
        } else {
          // Local storage
          const result = await storage.list({ limit: 50 })
          if (!cancelled) setDashboards(result.data)
        }
      } catch (err) {

      }
    }

    loadData()

    return () => { cancelled = true }
  }, [open, refreshKey, selectedProjectId, storage.isCloud])

  // Handle opening a dashboard
  const handleOpenDashboard = useCallback(async (meta: StorageProjectMeta) => {
    setIsLoading(true)
    setError(null)
    try {
      // 云端模式：先同步项目状态，确保后续保存能正确工作
      if (storage.isCloud && selectedProjectId) {
        // 必须先切换项目，否则 Editor 中的 useAutoSave 无法正确保存
        if (selectedProjectId !== cloudProject?.id) {
          await switchProject(selectedProjectId)
        }

        // 直接调用 API 获取画布数据
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
            thumbnail: dashboard.thumbnail, // Pass thumbnail
            createdAt: new Date(dashboard.createdAt).getTime(),
            updatedAt: new Date(dashboard.updatedAt).getTime(),
          },
          canvas: dashboard.canvasConfig as any,
          nodes: (dashboard.nodes as any[]) || [],
          dataSources: (dashboard.dataSources as any[]) || [],
        }

        onProjectLoad(projectFile)
        onClose()
        return
      }

      // 本地模式：使用 storage adapter
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
  }, [storage, selectedProjectId, cloudProject?.id, switchProject, onProjectLoad, onClose, t])

  // Handle importing a file
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
        // Trigger reload by changing refreshKey
        setRefreshKey(k => k + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : t.importError)
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }, [storage, t])

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

      await switchProject(createResponse.data.id)
      setProjectName('')
      setSelectedProjectId(createResponse.data.id)
      setRefreshKey(k => k + 1)

      const dashboardResponse = await dashboardsApi.createDashboard({
        name: t.defaultDashboardName,
        projectId: createResponse.data.id,
      })

      if (dashboardResponse.error || !dashboardResponse.data) {
        throw new Error(dashboardResponse.error || t.loadError)
      }

      const dashboard = dashboardResponse.data
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

      onProjectLoad(projectFile)
      setRefreshKey(k => k + 1)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createProjectError)
    } finally {
      setIsLoading(false)
    }
  }, [projectName, t.projectNameRequired, t.createProjectError, t.defaultDashboardName, t.loadError, switchProject, onProjectLoad, onClose])

  const handleExport = useCallback(async () => {
    if (!currentProject || !storage.exportProject) {
      return
    }

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

  // Handle creating a new project
  const handleNew = useCallback(async () => {
    if (storage.isCloud && !selectedProjectId) {
      setError(t.selectProjectTip)
      return
    }

    if (storage.isCloud && selectedProjectId) {
      setIsLoading(true)
      setError(null)
      try {
        const response = await dashboardsApi.createDashboard({
          name: t.newProject,
          projectId: selectedProjectId,
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

        // 同步选中的项目到全局状态
        if (selectedProjectId !== cloudProject?.id) {
          await switchProject(selectedProjectId)
        }

        onProjectLoad(projectFile)
        setRefreshKey(k => k + 1)
        onClose()
        return
      } catch (err) {
        setError(err instanceof Error ? err.message : t.loadError)
      } finally {
        setIsLoading(false)
      }
    }

    onNewProject()
    onClose()
  }, [storage.isCloud, selectedProjectId, cloudProject?.id, t.newProject, t.selectProjectTip, t.loadError, switchProject, onNewProject, onProjectLoad, onClose])

  // Handle removing a dashboard
  const handleRemoveDashboard = useCallback(async (dashboardId: string) => {
    try {
      await storage.delete(dashboardId)
      setRefreshKey(k => k + 1)
    } catch (error) {

    }
  }, [storage])

  return (
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
          {/* Project Selector - Cloud mode only */}
          {storage.isCloud && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.projects}</label>
              <div className="flex gap-2">
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value || undefined)
                    setError(null)
                  }}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">{t.selectProjectTip}</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                      {project.id === cloudProject?.id ? ` (${t.currentProject})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {/* Create new project */}
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder={t.projectNamePlaceholder}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleCreateProject}
                  disabled={isLoading || !projectName.trim()}
                >
                  {t.createProject}
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleNew}
              disabled={isLoading || (storage.isCloud && !selectedProjectId)}
            >
              <Plus className="h-6 w-6" />
              <span>{t.newProject}</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleImport}
              disabled={isLoading || !storage.importProject || (storage.isCloud && !selectedProjectId)}
            >
              <FileUp className="h-6 w-6" />
              <span>{t.import}</span>
            </Button>
          </div>

          {currentProject && (
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

          {/* Dashboards List */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">
              {storage.isCloud ? t.cloudDashboards : t.recentProjects}
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboards.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  {t.noDashboards}
                </p>
              ) : (
                dashboards.map(dashboard => (
                  <div
                    key={dashboard.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleOpenDashboard(dashboard)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{dashboard.name}</h4>
                      <p className="text-xs text-gray-500">
                        {new Date(dashboard.updatedAt).toLocaleString(language)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveDashboard(dashboard.id)
                      }}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// Translations
// =============================================================================

const translations = {
  en: {
    title: 'Open Dashboard',
    description: 'Create a new dashboard, open a recent one, or import from file.',
    newProject: 'New Dashboard',
    projects: 'Projects',
    noProjects: 'No projects yet',
    projectNamePlaceholder: 'Project name',
    createProject: 'Create',
    projectNameRequired: 'Project name is required.',
    createProjectError: 'Failed to create project.',
    defaultDashboardName: 'Default Dashboard',
    dashboardCount: '{count} dashboards',
    currentProject: 'Current',
    selectProjectTip: 'Select a project first',
    import: 'Import File',
    export: 'Export Current Dashboard',
    recentProjects: 'Recent Dashboards',
    cloudDashboards: 'Cloud Dashboards',
    noDashboards: 'No dashboards yet',
    projectNotFound: 'Dashboard not found.',
    loadError: 'Failed to load dashboard.',
    importError: 'Failed to import file.',
    exportError: 'Failed to export dashboard.',
    cloudMode: 'Cloud Storage',
    localMode: 'Local Storage',
  },
  zh: {
    title: '打开画布',
    description: '创建新画布、打开最近画布或从文件导入。',
    newProject: '新建画布',
    projects: '项目',
    noProjects: '还没有项目',
    projectNamePlaceholder: '输入项目名称',
    createProject: '创建项目',
    projectNameRequired: '请输入项目名称。',
    createProjectError: '创建项目失败。',
    defaultDashboardName: '默认画布',
    dashboardCount: '{count} 个画布',
    currentProject: '当前',
    selectProjectTip: '请先选择项目',
    import: '导入文件',
    export: '导出当前画布',
    recentProjects: '最近画布',
    cloudDashboards: '云端画布',
    noDashboards: '还没有画布',
    projectNotFound: '未找到画布。',
    loadError: '加载画布失败。',
    importError: '导入文件失败。',
    exportError: '导出画布失败。',
    cloudMode: '云端存储',
    localMode: '本地存储',
  },
}
