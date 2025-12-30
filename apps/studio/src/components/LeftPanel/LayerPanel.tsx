import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  FolderPlus,
  Ungroup,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { KernelState, LayerGroup } from '@thingsvis/kernel';

interface LayerPanelProps {
  store: any;
  language: 'zh' | 'en';
  searchQuery?: string;
}

interface LayerItemData {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  groupId?: string;
}

export default function LayerPanel({ store, language, searchQuery = '' }: LayerPanelProps) {
  const state = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState
  );

  const { nodesById, layerOrder, layerGroups, selection } = state;
  const selectedIds = selection.nodeIds;

  // Build layer items from kernel state (reversed for UI: top layer first)
  const layerItems: LayerItemData[] = [...layerOrder].reverse().map((nodeId) => {
    const node = nodesById[nodeId];
    if (!node) return null;
    const schema = node.schemaRef as any;
    return {
      id: nodeId,
      name: schema?.name || schema?.type || nodeId,
      type: schema?.type || 'unknown',
      visible: node.visible,
      locked: node.locked,
      groupId: undefined, // TODO: resolve from layerGroups
    };
  }).filter(Boolean) as LayerItemData[];

  // Filter by search query
  const filteredItems = searchQuery
    ? layerItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : layerItems;

  // Group membership lookup
  const nodeToGroup = new Map<string, string>();
  Object.entries(layerGroups).forEach(([groupId, group]) => {
    group.memberIds.forEach((nodeId) => nodeToGroup.set(nodeId, groupId));
  });

  // Handlers
  const handleSelect = useCallback(
    (nodeId: string, event: React.MouseEvent) => {
      if (event.shiftKey && selectedIds.length > 0) {
        // Range selection: find range between first selected and clicked
        const allIds = layerItems.map((item) => item.id);
        const firstSelected = selectedIds[0];
        if (!firstSelected) return;
        const firstIdx = allIds.indexOf(firstSelected);
        const clickedIdx = allIds.indexOf(nodeId);
        const [start, end] = firstIdx < clickedIdx ? [firstIdx, clickedIdx] : [clickedIdx, firstIdx];
        const rangeIds = allIds.slice(start, end + 1);
        store.getState().selectNodes(rangeIds);
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle selection
        const newSelection = selectedIds.includes(nodeId)
          ? selectedIds.filter((id) => id !== nodeId)
          : [...selectedIds, nodeId];
        store.getState().selectNodes(newSelection);
      } else {
        // Single selection
        store.getState().selectNode(nodeId);
      }
    },
    [store, selectedIds, layerItems]
  );

  const handleToggleVisible = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodesById[nodeId];
      if (node) {
        store.getState().setNodeVisible(nodeId, !node.visible);
      }
    },
    [store, nodesById]
  );

  const handleToggleLock = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodesById[nodeId];
      if (node) {
        store.getState().setNodeLocked(nodeId, !node.locked);
      }
    },
    [store, nodesById]
  );

  const handleBringToFront = useCallback(
    (nodeIds: string[]) => {
      store.getState().bringToFront(nodeIds);
    },
    [store]
  );

  const handleSendToBack = useCallback(
    (nodeIds: string[]) => {
      store.getState().sendToBack(nodeIds);
    },
    [store]
  );

  const handleBringForward = useCallback(
    (nodeIds: string[]) => {
      store.getState().bringForward(nodeIds);
    },
    [store]
  );

  const handleSendBackward = useCallback(
    (nodeIds: string[]) => {
      store.getState().sendBackward(nodeIds);
    },
    [store]
  );

  const handleDelete = useCallback(
    (nodeIds: string[]) => {
      store.getState().removeNodes(nodeIds);
    },
    [store]
  );

  const handleCreateGroup = useCallback(() => {
    if (selectedIds.length > 1) {
      store.getState().createGroup(selectedIds);
    }
  }, [store, selectedIds]);

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((item: LayerItemData) => {
    setEditingId(item.id);
    setEditingName(item.name);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingId && editingName.trim()) {
      store.getState().renameNode(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  }, [store, editingId, editingName]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const t = (zh: string, en: string) => (language === 'zh' ? zh : en);

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Layers className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">{t('暂无图层', 'No layers')}</p>
        <p className="text-xs mt-1">{t('添加组件到画布以查看图层', 'Add components to see layers')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {filteredItems.map((item, index) => {
        const isSelected = selectedIds.includes(item.id);
        const isEditing = editingId === item.id;

        return (
          <div
            key={item.id}
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
              isSelected ? 'bg-accent' : 'hover:bg-accent/50'
            }`}
            onClick={(e) => handleSelect(item.id, e)}
            onDoubleClick={() => handleDoubleClick(item)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer.getData('text/plain');
              if (draggedId && draggedId !== item.id) {
                // Calculate target index (in layerOrder, which is bottom-to-top)
                const targetIndex = layerOrder.length - 1 - index;
                store.getState().reorderLayers(draggedId, targetIndex);
              }
            }}
          >
            {/* Icon */}
            <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />

            {/* Name */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditingName('');
                    }
                  }}
                  className="w-full px-1 py-0 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className={`text-sm truncate block ${!item.visible ? 'opacity-50' : ''}`}>
                  {item.name}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => handleToggleVisible(item.id, e)}
                className="p-1 hover:bg-muted rounded"
                title={item.visible ? t('隐藏', 'Hide') : t('显示', 'Show')}
              >
                {item.visible ? (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={(e) => handleToggleLock(item.id, e)}
                className="p-1 hover:bg-muted rounded"
                title={item.locked ? t('解锁', 'Unlock') : t('锁定', 'Lock')}
              >
                {item.locked ? (
                  <Lock className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {/* Context Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleBringToFront([item.id])}>
                    <ChevronsUp className="h-4 w-4 mr-2" />
                    {t('置于顶层', 'Bring to Front')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBringForward([item.id])}>
                    <ArrowUp className="h-4 w-4 mr-2" />
                    {t('上移一层', 'Bring Forward')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendBackward([item.id])}>
                    <ArrowDown className="h-4 w-4 mr-2" />
                    {t('下移一层', 'Send Backward')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSendToBack([item.id])}>
                    <ChevronsDown className="h-4 w-4 mr-2" />
                    {t('置于底层', 'Send to Back')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {selectedIds.length > 1 && (
                    <DropdownMenuItem onClick={handleCreateGroup}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      {t('成组', 'Group')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete([item.id])}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('删除', 'Delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
