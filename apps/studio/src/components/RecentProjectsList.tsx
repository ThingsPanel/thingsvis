/**
 * RecentProjectsList Component
 * 
 * Displays a list of recently accessed projects with thumbnails.
 * Allows selecting or removing projects from the list.
 */

import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, FileText } from 'lucide-react'
import { recentProjects } from '../lib/storage/recentProjects'
import type { RecentProjectEntry } from '../lib/storage/schemas'

// =============================================================================
// Props
// =============================================================================

export interface RecentProjectsListProps {
  /** Callback when a project is selected */
  onSelect: (entry: RecentProjectEntry) => void
  /** Callback when a project should be removed from the list */
  onRemove?: (projectId: string) => void
  /** Whether the list is disabled */
  disabled?: boolean
  /** Language for localization */
  language?: 'zh' | 'en'
  /** Maximum number of items to show */
  maxItems?: number
}

// =============================================================================
// Component
// =============================================================================

export function RecentProjectsList({
  onSelect,
  onRemove,
  disabled = false,
  language = 'en',
  maxItems = 10,
}: RecentProjectsListProps) {
  const projects = useMemo(() => {
    return recentProjects.get().slice(0, maxItems)
  }, [maxItems])

  const t = language === 'zh' ? translations.zh : translations.en

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t.noProjects}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.id}
          className={`
            group flex items-center gap-3 p-2 rounded-md border border-transparent
            hover:bg-muted/50 hover:border-border transition-colors
            ${disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
          onClick={() => !disabled && onSelect(project)}
        >
          {/* Thumbnail */}
          <div className="w-16 h-10 rounded bg-muted flex-shrink-0 overflow-hidden">
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(project.updatedAt, language)}
            </p>
          </div>

          {/* Remove Button */}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(project.id)
              }}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(timestamp: number, language: 'zh' | 'en'): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return language === 'zh' ? '今天' : 'Today'
  } else if (diffDays === 1) {
    return language === 'zh' ? '昨天' : 'Yesterday'
  } else if (diffDays < 7) {
    return language === 'zh' 
      ? `${diffDays} 天前` 
      : `${diffDays} days ago`
  } else {
    return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }
}

// =============================================================================
// Translations
// =============================================================================

const translations = {
  en: {
    noProjects: 'No recent projects',
  },
  zh: {
    noProjects: '暂无最近项目',
  },
}

export default RecentProjectsList
