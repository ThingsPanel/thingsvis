/**
 * ProjectDialog Component
 * 
 * Dialog for opening recent projects and managing project files.
 * Provides open, save, import, and export functionality.
 */

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderOpen, FileUp, FileDown, Plus, Trash2 } from 'lucide-react'
import { RecentProjectsList } from './RecentProjectsList'
import { projectStorage } from '../lib/storage/projectStorage'
import { recentProjects } from '../lib/storage/recentProjects'
import type { ProjectFile, RecentProjectEntry } from '../lib/storage/schemas'

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const t = language === 'zh' ? translations.zh : translations.en

  // Handle opening a recent project
  const handleOpenRecent = useCallback(async (entry: RecentProjectEntry) => {
    setIsLoading(true)
    setError(null)
    try {
      const project = await projectStorage.load(entry.id)
      if (project) {
        onProjectLoad(project)
        onClose()
      } else {
        setError(t.projectNotFound)
        // Remove from recent list if not found
        recentProjects.remove(entry.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadError)
    } finally {
      setIsLoading(false)
    }
  }, [onProjectLoad, onClose, t])

  // Handle importing a file
  const handleImport = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.thingsvis,.json'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setIsLoading(true)
      setError(null)
      try {
        const project = await projectStorage.importFromFile(file)
        // Save to IndexedDB
        await projectStorage.save(project)
        onProjectLoad(project)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : t.importError)
      } finally {
        setIsLoading(false)
      }
    }

    input.click()
  }, [onProjectLoad, onClose, t])

  // Handle exporting the current project
  const handleExport = useCallback(() => {
    if (currentProject) {
      projectStorage.download(currentProject)
    }
  }, [currentProject])

  // Handle creating a new project
  const handleNew = useCallback(() => {
    onNewProject()
    onClose()
  }, [onNewProject, onClose])

  // Handle removing a project from recents
  const handleRemoveRecent = useCallback((projectId: string) => {
    recentProjects.remove(projectId)
  }, [])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleNew}
              disabled={isLoading}
            >
              <Plus className="h-6 w-6" />
              <span>{t.newProject}</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleImport}
              disabled={isLoading}
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
              disabled={isLoading}
            >
              <FileDown className="h-4 w-4 mr-2" />
              {t.export}
            </Button>
          )}

          {/* Recent Projects */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">{t.recentProjects}</h3>
            <RecentProjectsList
              onSelect={handleOpenRecent}
              onRemove={handleRemoveRecent}
              language={language}
              disabled={isLoading}
            />
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
    title: 'Open Project',
    description: 'Create a new project, open a recent one, or import from file.',
    newProject: 'New Project',
    import: 'Import File',
    export: 'Export Current Project',
    recentProjects: 'Recent Projects',
    projectNotFound: 'Project not found in storage.',
    loadError: 'Failed to load project.',
    importError: 'Failed to import file.',
  },
  zh: {
    title: '打开项目',
    description: '创建新项目、打开最近项目或从文件导入。',
    newProject: '新建项目',
    import: '导入文件',
    export: '导出当前项目',
    recentProjects: '最近项目',
    projectNotFound: '未找到该项目。',
    loadError: '加载项目失败。',
    importError: '导入文件失败。',
  },
}

export default ProjectDialog
