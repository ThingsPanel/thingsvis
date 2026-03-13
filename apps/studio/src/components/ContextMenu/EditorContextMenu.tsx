import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { store } from '@/lib/store';
import {
  Copy,
  ClipboardPaste,
  Trash2,
  Lock,
  Unlock,
  BringToFront,
  SendToBack,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface EditorContextMenuProps {
  children: React.ReactNode;
}

export function EditorContextMenu({ children }: EditorContextMenuProps) {
  const { t } = useTranslation('editor');

  // Reactively read selection & node lock state from the kernel store
  const selectedIds = useStore(store, (s) => s.selection.nodeIds);
  const nodesById = useStore(store, (s) => s.nodesById);

  const hasSelection = selectedIds.length > 0;
  const isLocked =
    selectedIds.length > 0 && selectedIds[0] ? (nodesById[selectedIds[0]]?.locked ?? false) : false;

  const handleCopy = () => {
    // Dispatch native copy event so existing keyboard shortcut handler picks it up
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }),
    );
  };

  const handlePaste = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, bubbles: true }),
    );
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    store.getState().removeNodes(selectedIds);
  };

  const handleToggleLock = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      store.getState().setNodeLocked(id, !isLocked);
    });
  };

  const handleLayerAction = (action: 'front' | 'back' | 'forward' | 'backward') => {
    if (selectedIds.length === 0) return;
    const state = store.getState();
    if (action === 'front') state.bringToFront(selectedIds);
    else if (action === 'back') state.sendToBack(selectedIds);
    else if (action === 'forward') state.bringForward(selectedIds);
    else if (action === 'backward') state.sendBackward(selectedIds);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full" asChild>
        <div className="w-full h-full">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleCopy} disabled={!hasSelection}>
          <Copy className="mr-2 h-4 w-4" />
          {t('contextMenu.copy')}
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={handlePaste}>
          <ClipboardPaste className="mr-2 h-4 w-4" />
          {t('contextMenu.paste')}
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={() => handleLayerAction('front')} disabled={!hasSelection}>
          <BringToFront className="mr-2 h-4 w-4" />
          {t('contextMenu.bringToFront')}
        </ContextMenuItem>

        <ContextMenuItem onClick={() => handleLayerAction('forward')} disabled={!hasSelection}>
          <ArrowUp className="mr-2 h-4 w-4" />
          {t('contextMenu.bringForward')}
          <ContextMenuShortcut>Ctrl+]</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => handleLayerAction('backward')} disabled={!hasSelection}>
          <ArrowDown className="mr-2 h-4 w-4" />
          {t('contextMenu.sendBackward')}
          <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem onClick={() => handleLayerAction('back')} disabled={!hasSelection}>
          <SendToBack className="mr-2 h-4 w-4" />
          {t('contextMenu.sendToBack')}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleToggleLock} disabled={!hasSelection}>
          {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
          {t('contextMenu.toggleLock')}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={handleDelete}
          disabled={!hasSelection}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('contextMenu.delete')}
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
