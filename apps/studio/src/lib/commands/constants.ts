/**
 * Command system constants
 * 
 * Command IDs and default shortcut mappings
 */

import type { ShortcutKey } from './types'

// =============================================================================
// Built-in Command IDs
// =============================================================================

export const COMMAND_IDS = {
  // Tool commands
  TOOL_SELECT: 'tool.select',
  TOOL_RECTANGLE: 'tool.rectangle',
  TOOL_CIRCLE: 'tool.circle',
  TOOL_TEXT: 'tool.text',
  TOOL_IMAGE: 'tool.image',
  TOOL_PAN: 'tool.pan',

  // Edit commands
  EDIT_UNDO: 'edit.undo',
  EDIT_REDO: 'edit.redo',
  EDIT_COPY: 'edit.copy',
  EDIT_PASTE: 'edit.paste',
  EDIT_DUPLICATE: 'edit.duplicate',
  EDIT_DELETE: 'edit.delete',
  EDIT_SELECT_ALL: 'edit.selectAll',
  EDIT_DESELECT: 'edit.deselect',
  EDIT_GROUP: 'edit.group',
  EDIT_UNGROUP: 'edit.ungroup',

  // View commands
  VIEW_ZOOM_IN: 'view.zoomIn',
  VIEW_ZOOM_OUT: 'view.zoomOut',
  VIEW_ZOOM_RESET: 'view.zoomReset',
  VIEW_FIT: 'view.fit',

  // Project commands
  PROJECT_SAVE: 'project.save',
  PROJECT_OPEN: 'project.open',
  PROJECT_EXPORT: 'project.export',
  PROJECT_PREVIEW: 'project.preview',

  // Auth commands
  AUTH_LOGOUT: 'auth.logout',

  // Help commands
  HELP_SHORTCUTS: 'help.shortcuts',
} as const

// =============================================================================
// Default Shortcut Mappings
// =============================================================================

export const DEFAULT_SHORTCUTS: Record<string, ShortcutKey[]> = {
  // Tools (single key)
  [COMMAND_IDS.TOOL_SELECT]: ['v'],
  [COMMAND_IDS.TOOL_RECTANGLE]: ['r'],
  [COMMAND_IDS.TOOL_CIRCLE]: ['o'],
  [COMMAND_IDS.TOOL_TEXT]: ['t'],
  [COMMAND_IDS.TOOL_IMAGE]: ['i'],
  [COMMAND_IDS.TOOL_PAN]: ['h'],

  // Edit (mod + key)
  [COMMAND_IDS.EDIT_UNDO]: ['mod', 'z'],
  [COMMAND_IDS.EDIT_REDO]: ['mod', 'y'],
  [COMMAND_IDS.EDIT_COPY]: ['mod', 'c'],
  [COMMAND_IDS.EDIT_PASTE]: ['mod', 'v'],
  [COMMAND_IDS.EDIT_DUPLICATE]: ['mod', 'd'],
  [COMMAND_IDS.EDIT_DELETE]: ['delete'],
  [COMMAND_IDS.EDIT_SELECT_ALL]: ['mod', 'a'],
  [COMMAND_IDS.EDIT_DESELECT]: ['escape'],

  // View
  [COMMAND_IDS.VIEW_ZOOM_IN]: ['mod', '='],
  [COMMAND_IDS.VIEW_ZOOM_OUT]: ['mod', '-'],
  [COMMAND_IDS.VIEW_ZOOM_RESET]: ['mod', '0'],
  [COMMAND_IDS.VIEW_FIT]: ['mod', '1'],

  // Project
  [COMMAND_IDS.PROJECT_SAVE]: ['mod', 's'],
  [COMMAND_IDS.PROJECT_OPEN]: ['mod', 'o'],
  [COMMAND_IDS.PROJECT_EXPORT]: ['mod', 'e'],
  [COMMAND_IDS.PROJECT_PREVIEW]: ['mod', 'p'],

  // Auth
  [COMMAND_IDS.AUTH_LOGOUT]: ['mod', 'shift', 'l'],

  // Help
  [COMMAND_IDS.HELP_SHORTCUTS]: ['?'],
} as const

// =============================================================================
// Category Labels
// =============================================================================

export const CATEGORY_LABELS = {
  tool: { en: 'Tools', zh: '工具' },
  edit: { en: 'Edit', zh: '编辑' },
  view: { en: 'View', zh: '视图' },
  project: { en: 'Project', zh: '项目' },
  help: { en: 'Help', zh: '帮助' },
} as const
