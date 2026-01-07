/**
 * Default Commands
 * 
 * Registers all built-in commands for the editor.
 * Commands are organized by category: tool, edit, project, view, help.
 */

import type { Command } from './types'
import { COMMAND_IDS, DEFAULT_SHORTCUTS } from './constants'
import { commandRegistry } from './CommandRegistry'

// =============================================================================
// Command Factory Helpers
// =============================================================================

/**
 * Creates a command definition with sensible defaults.
 */
function createCommand(
  id: string,
  label: string,
  category: Command['category'],
  execute: Command['execute'],
  options: Partial<Command> = {}
): Command {
  return {
    id,
    label,
    category,
    shortcut: DEFAULT_SHORTCUTS[id],
    execute,
    ...options,
  }
}

// =============================================================================
// Command Definitions
// =============================================================================

/**
 * Creates the default commands for the editor.
 * Requires dependencies to be passed in for testability and flexibility.
 */
export interface DefaultCommandsDependencies {
  /** Function to save the current project */
  saveProject: () => Promise<void>
  /** Function to open the project dialog */
  openProjectDialog?: () => void
  /** Function to export the current project */
  exportProject?: () => void
  /** Function to open preview */
  openPreview?: () => void
  /** Function to show shortcuts help panel */
  showShortcutsPanel?: () => void
  /** Function to set the current tool */
  setTool?: (tool: string) => void
  /** Function to undo */
  undo?: () => void
  /** Function to redo */
  redo?: () => void
  /** Function to check if undo is available */
  canUndo?: () => boolean
  /** Function to check if redo is available */
  canRedo?: () => boolean
}

/**
 * Creates and returns all default commands.
 */
export function createDefaultCommands(deps: DefaultCommandsDependencies): Command[] {
  const commands: Command[] = []

  // ==========================================================================
  // Project Commands
  // ==========================================================================

  commands.push(
    createCommand(
      COMMAND_IDS.PROJECT_SAVE,
      'Save',
      'project',
      async () => {
        await deps.saveProject()
      },
      { labelZh: '保存' }
    )
  )

  if (deps.openProjectDialog) {
    commands.push(
      createCommand(
        COMMAND_IDS.PROJECT_OPEN,
        'Open',
        'project',
        () => deps.openProjectDialog!(),
        { labelZh: '打开' }
      )
    )
  }

  if (deps.exportProject) {
    commands.push(
      createCommand(
        COMMAND_IDS.PROJECT_EXPORT,
        'Export',
        'project',
        () => deps.exportProject!(),
        { labelZh: '导出' }
      )
    )
  }

  if (deps.openPreview) {
    commands.push(
      createCommand(
        COMMAND_IDS.PROJECT_PREVIEW,
        'Preview',
        'project',
        () => deps.openPreview!(),
        { labelZh: '预览' }
      )
    )
  }

  // ==========================================================================
  // Tool Commands
  // ==========================================================================

  if (deps.setTool) {
    commands.push(
      createCommand(
        COMMAND_IDS.TOOL_SELECT,
        'Select',
        'tool',
        () => deps.setTool!('select'),
        { labelZh: '选择' }
      ),
      createCommand(
        COMMAND_IDS.TOOL_RECTANGLE,
        'Rectangle',
        'tool',
        () => deps.setTool!('rectangle'),
        { labelZh: '矩形' }
      ),
      createCommand(
        COMMAND_IDS.TOOL_TEXT,
        'Text',
        'tool',
        () => deps.setTool!('text'),
        { labelZh: '文本' }
      ),
      createCommand(
        COMMAND_IDS.TOOL_PAN,
        'Pan',
        'tool',
        () => deps.setTool!('pan'),
        { labelZh: '平移' }
      )
    )
  }

  // ==========================================================================
  // Edit Commands
  // ==========================================================================

  if (deps.undo) {
    commands.push(
      createCommand(
        COMMAND_IDS.EDIT_UNDO,
        'Undo',
        'edit',
        () => deps.undo!(),
        {
          labelZh: '撤销',
          when: deps.canUndo,
        }
      )
    )
  }

  if (deps.redo) {
    commands.push(
      createCommand(
        COMMAND_IDS.EDIT_REDO,
        'Redo',
        'edit',
        () => deps.redo!(),
        {
          labelZh: '重做',
          when: deps.canRedo,
        }
      )
    )
  }

  // ==========================================================================
  // Help Commands
  // ==========================================================================

  if (deps.showShortcutsPanel) {
    commands.push(
      createCommand(
        COMMAND_IDS.HELP_SHORTCUTS,
        'Keyboard Shortcuts',
        'help',
        () => deps.showShortcutsPanel!(),
        { labelZh: '键盘快捷键' }
      )
    )
  }

  return commands
}

/**
 * Registers all default commands with the command registry.
 */
export function registerDefaultCommands(deps: DefaultCommandsDependencies): void {
  const commands = createDefaultCommands(deps)
  commandRegistry.registerAll(commands)
}

/**
 * Registers just the save command (for initial MVP).
 */
export function registerSaveCommand(saveProject: () => Promise<void>): void {
  commandRegistry.register(
    createCommand(
      COMMAND_IDS.PROJECT_SAVE,
      'Save',
      'project',
      saveProject,
      { labelZh: '保存' }
    )
  )
}
