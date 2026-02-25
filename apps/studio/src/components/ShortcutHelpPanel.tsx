/**
 * ShortcutHelpPanel Component
 * 
 * Modal dialog showing all available keyboard shortcuts.
 * Categorizes shortcuts by type (tool, edit, project, etc.)
 */

import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { commandRegistry } from '../lib/commands/CommandRegistry'
import { formatShortcut } from '../lib/commands/shortcutDisplay'
import { CATEGORY_LABELS } from '../lib/commands/constants'
import type { Command, CommandCategory } from '../lib/commands/types'

// =============================================================================
// Props
// =============================================================================

export interface ShortcutHelpPanelProps {
  /** Whether the panel is open */
  open: boolean
  /** Callback when panel should close */
  onClose: () => void
}

// =============================================================================
// Component
// =============================================================================

export function ShortcutHelpPanel({
  open,
  onClose,
}: ShortcutHelpPanelProps) {
  const { t, i18n } = useTranslation('editor')
  const language = i18n.language as 'zh' | 'en'

  // Get all commands grouped by category
  const commandsByCategory = useMemo(() => {
    const commands = commandRegistry.getAll()
    const grouped = new Map<CommandCategory, Command[]>()

    // Define category order
    const categoryOrder: CommandCategory[] = ['tool', 'edit', 'project', 'view', 'help']

    for (const category of categoryOrder) {
      grouped.set(category, [])
    }

    for (const command of commands) {
      if (!command.shortcut) continue

      const list = grouped.get(command.category)
      if (list) {
        list.push(command)
      }
    }

    // Filter out empty categories
    return Array.from(grouped.entries()).filter(([_, cmds]) => cmds.length > 0)
  }, [])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('shortcuts.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {commandsByCategory.map(([category, commands]) => (
            <ShortcutCategory
              key={category}
              category={category}
              commands={commands}
              language={language}
            />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground text-center">
          {language === 'zh'
            ? '按 ? 或 Esc 关闭此面板'
            : 'Press ? or Esc to close this panel'}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// ShortcutCategory Component
// =============================================================================

interface ShortcutCategoryProps {
  category: CommandCategory
  commands: Command[]
  language: 'zh' | 'en'
}

function ShortcutCategory({ category, commands, language }: ShortcutCategoryProps) {
  const label = language === 'zh'
    ? CATEGORY_LABELS[category]?.zh
    : CATEGORY_LABELS[category]?.en

  return (
    <div>
      <h3 className="text-sm font-semibold mb-2 text-foreground">
        {label || category}
      </h3>
      <div className="space-y-1">
        {commands.map((command) => (
          <ShortcutRow key={command.id} command={command} language={language} />
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// ShortcutRow Component
// =============================================================================

interface ShortcutRowProps {
  command: Command
  language: 'zh' | 'en'
}

function ShortcutRow({ command, language }: ShortcutRowProps) {
  const label = language === 'zh' && command.labelZh
    ? command.labelZh
    : command.label

  const shortcutText = command.shortcut
    ? formatShortcut(command.shortcut)
    : ''

  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50">
      <span className="text-sm">{label}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
        {shortcutText}
      </kbd>
    </div>
  )
}

export default ShortcutHelpPanel
