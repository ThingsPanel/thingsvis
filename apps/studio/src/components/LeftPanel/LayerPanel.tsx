import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Folder,
  FolderOpen,
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
import type { KernelState } from '@thingsvis/kernel';

interface LayerPanelProps {
  store: any;
  language?: string;
  searchQuery?: string;
  onUserEdit?: () => void;
}

interface LayerItemData {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  groupId?: string;
}

interface GroupData {
  id: string;
  name: string;
  expanded: boolean;
  visible: boolean;
  locked: boolean;
  members: LayerItemData[];
}

// Union type for rendering: either a group or an ungrouped item
type LayerListEntry = { kind: 'group'; data: GroupData } | { kind: 'item'; data: LayerItemData };

export default function LayerPanel({ store, searchQuery = '', onUserEdit }: LayerPanelProps) {
  const { t } = useTranslation('editor');
  const state = useSyncExternalStore(
    useCallback((subscribe) => store.subscribe(subscribe), [store]),
    () => store.getState() as KernelState,
  );

  const { nodesById, layerOrder, layerGroups, selection } = state;
  const selectedIds = selection.nodeIds;

  // Group membership lookup
  const nodeToGroup = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(layerGroups).forEach(([groupId, group]) => {
      group.memberIds.forEach((nodeId) => map.set(nodeId, groupId));
    });
    return map;
  }, [layerGroups]);

  // Build structured layer list with groups
  const layerListEntries: LayerListEntry[] = useMemo(() => {
    const entries: LayerListEntry[] = [];
    const processedGroups = new Set<string>();

    // Iterate in reverse order (top layer first in UI)
    const reversedOrder = [...layerOrder].reverse();

    for (const nodeId of reversedOrder) {
      const node = nodesById[nodeId];
      if (!node) continue;

      const groupId = nodeToGroup.get(nodeId);
      const schema = node.schemaRef as any;
      const itemData: LayerItemData = {
        id: nodeId,
        name: schema?.name || schema?.type || nodeId,
        type: schema?.type || 'unknown',
        visible: node.visible,
        locked: node.locked,
        groupId,
      };

      if (groupId && !processedGroups.has(groupId)) {
        // This is the first member of a group we encounter
        const group = layerGroups[groupId];
        if (group) {
          processedGroups.add(groupId);
          // Build group members in layer order
          const members: LayerItemData[] = [];
          for (const memberId of reversedOrder) {
            if (nodeToGroup.get(memberId) === groupId) {
              const memberNode = nodesById[memberId];
              if (memberNode) {
                const memberSchema = memberNode.schemaRef as any;
                members.push({
                  id: memberId,
                  name: memberSchema?.name || memberSchema?.type || memberId,
                  type: memberSchema?.type || 'unknown',
                  visible: memberNode.visible,
                  locked: memberNode.locked,
                  groupId,
                });
              }
            }
          }
          entries.push({
            kind: 'group',
            data: {
              id: groupId,
              name: group.name,
              expanded: group.expanded,
              visible: group.visible,
              locked: group.locked,
              members,
            },
          });
        }
      } else if (!groupId) {
        // Ungrouped item
        entries.push({ kind: 'item', data: itemData });
      }
      // If groupId exists but already processed, skip (it's inside the group)
    }

    return entries;
  }, [layerOrder, nodesById, layerGroups, nodeToGroup]);

  // Filter by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return layerListEntries;

    const query = searchQuery.toLowerCase();
    return layerListEntries.filter((entry) => {
      if (entry.kind === 'item') {
        return (
          entry.data.name.toLowerCase().includes(query) ||
          entry.data.type.toLowerCase().includes(query)
        );
      } else {
        // For groups, include if group name matches or any member matches
        if (entry.data.name.toLowerCase().includes(query)) return true;
        return entry.data.members.some(
          (m) => m.name.toLowerCase().includes(query) || m.type.toLowerCase().includes(query),
        );
      }
    });
  }, [layerListEntries, searchQuery]);

  // Handlers
  const handleSelect = useCallback(
    (nodeId: string, event: React.MouseEvent) => {
      // Get all node IDs in flat order for range selection
      const getAllNodeIds = () => {
        const ids: string[] = [];
        for (const entry of filteredEntries) {
          if (entry.kind === 'item') {
            ids.push(entry.data.id);
          } else {
            ids.push(...entry.data.members.map((m) => m.id));
          }
        }
        return ids;
      };

      if (event.shiftKey && selectedIds.length > 0) {
        const allIds = getAllNodeIds();
        const firstSelected = selectedIds[0];
        if (!firstSelected) return;
        const firstIdx = allIds.indexOf(firstSelected);
        const clickedIdx = allIds.indexOf(nodeId);
        const [start, end] =
          firstIdx < clickedIdx ? [firstIdx, clickedIdx] : [clickedIdx, firstIdx];
        const rangeIds = allIds.slice(start, end + 1);
        store.getState().selectNodes(rangeIds);
      } else if (event.ctrlKey || event.metaKey) {
        const newSelection = selectedIds.includes(nodeId)
          ? selectedIds.filter((id) => id !== nodeId)
          : [...selectedIds, nodeId];
        store.getState().selectNodes(newSelection);
      } else {
        store.getState().selectNode(nodeId);
      }
    },
    [store, selectedIds, filteredEntries],
  );

  const handleSelectGroup = useCallback(
    (groupId: string, event: React.MouseEvent) => {
      const group = layerGroups[groupId];
      if (!group) return;
      if (event.ctrlKey || event.metaKey) {
        // Toggle all members
        const allSelected = group.memberIds.every((id) => selectedIds.includes(id));
        if (allSelected) {
          store.getState().selectNodes(selectedIds.filter((id) => !group.memberIds.includes(id)));
        } else {
          const newSelection = [...new Set([...selectedIds, ...group.memberIds])];
          store.getState().selectNodes(newSelection);
        }
      } else {
        // Select all members
        store.getState().selectNodes(group.memberIds);
      }
    },
    [store, selectedIds, layerGroups],
  );

  const handleToggleVisible = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodesById[nodeId];
      if (node) {
        store.getState().setNodeVisible(nodeId, !node.visible);
      }
    },
    [store, nodesById],
  );

  const handleToggleLock = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const node = nodesById[nodeId];
      if (node) {
        store.getState().setNodeLocked(nodeId, !node.locked);
      }
    },
    [store, nodesById],
  );

  const handleBringToFront = useCallback(
    (nodeIds: string[]) => {
      store.getState().bringToFront(nodeIds);
    },
    [store],
  );

  const handleSendToBack = useCallback(
    (nodeIds: string[]) => {
      store.getState().sendToBack(nodeIds);
    },
    [store],
  );

  const handleBringForward = useCallback(
    (nodeIds: string[]) => {
      store.getState().bringForward(nodeIds);
    },
    [store],
  );

  const handleSendBackward = useCallback(
    (nodeIds: string[]) => {
      store.getState().sendBackward(nodeIds);
    },
    [store],
  );

  const handleDelete = useCallback(
    (nodeIds: string[]) => {
      store.getState().removeNodes(nodeIds);
    },
    [store],
  );

  const handleCreateGroup = useCallback(() => {
    if (selectedIds.length > 1) {
      store.getState().createGroup(selectedIds);
    }
  }, [store, selectedIds]);

  const handleUngroup = useCallback(
    (groupId: string) => {
      store.getState().ungroup(groupId);
    },
    [store],
  );

  const handleToggleGroupExpanded = useCallback(
    (groupId: string) => {
      store.getState().toggleGroupExpanded(groupId);
    },
    [store],
  );

  const handleToggleGroupVisible = useCallback(
    (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const group = layerGroups[groupId];
      if (group) {
        store.getState().setGroupVisible(groupId, !group.visible);
      }
    },
    [store, layerGroups],
  );

  const handleToggleGroupLock = useCallback(
    (groupId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const group = layerGroups[groupId];
      if (group) {
        store.getState().setGroupLocked(groupId, !group.locked);
      }
    },
    [store, layerGroups],
  );

  // Rename state (for both nodes and groups)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'node' | 'group'>('node');
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback((item: LayerItemData) => {
    setEditingId(item.id);
    setEditingType('node');
    setEditingName(item.name);
  }, []);

  const handleGroupDoubleClick = useCallback((group: GroupData) => {
    setEditingId(group.id);
    setEditingType('group');
    setEditingName(group.name);
  }, []);

  const handleRenameSubmit = useCallback(() => {
    if (editingId && editingName.trim()) {
      if (editingType === 'node') {
        store.getState().renameNode(editingId, editingName.trim());
        onUserEdit?.();
      } else {
        store.getState().renameGroup(editingId, editingName.trim());
      }
    }
    setEditingId(null);
    setEditingName('');
  }, [store, editingId, editingName, editingType, onUserEdit]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);
  if (filteredEntries.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-muted-foreground"
        data-testid="layer-panel"
      >
        <Layers className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">{t('layersPanel.empty')}</p>
        <p className="text-xs mt-1">{t('layersPanel.addHint')}</p>
      </div>
    );
  }

  // Render a single layer item
  const renderLayerItem = (item: LayerItemData, indent: boolean = false) => {
    const isSelected = selectedIds.includes(item.id);
    const isEditing = editingId === item.id && editingType === 'node';

    return (
      <div
        key={item.id}
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
        } ${indent ? 'ml-4' : ''}`}
        data-testid="layer-item"
        data-layer-id={item.id}
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
            const targetIndex = layerOrder.indexOf(item.id);
            if (targetIndex >= 0) {
              store.getState().reorderLayers(draggedId, targetIndex);
            }
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
            title={item.visible ? t('common.hide') : t('common.show')}
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
            title={item.locked ? t('common.unlock') : t('common.lock')}
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
              <button onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-muted rounded">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleBringToFront([item.id])}>
                <ChevronsUp className="h-4 w-4 mr-2" />
                {t('layersPanel.bringToFront')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBringForward([item.id])}>
                <ArrowUp className="h-4 w-4 mr-2" />
                {t('layersPanel.bringForward')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendBackward([item.id])}>
                <ArrowDown className="h-4 w-4 mr-2" />
                {t('layersPanel.sendBackward')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSendToBack([item.id])}>
                <ChevronsDown className="h-4 w-4 mr-2" />
                {t('layersPanel.sendToBack')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {selectedIds.length > 1 && (
                <DropdownMenuItem onClick={handleCreateGroup}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {t('layersPanel.group')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete([item.id])}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  // Render a group
  const renderGroup = (group: GroupData) => {
    const isGroupEditing = editingId === group.id && editingType === 'group';
    const allMembersSelected = group.members.every((m) => selectedIds.includes(m.id));

    return (
      <div key={group.id} className="space-y-0.5">
        {/* Group Header */}
        <div
          className={`group flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
            allMembersSelected ? 'bg-accent' : 'hover:bg-accent/50'
          }`}
          data-testid="layer-group"
          data-layer-group-id={group.id}
          onClick={(e) => handleSelectGroup(group.id, e)}
          onDoubleClick={() => handleGroupDoubleClick(group)}
        >
          {/* Expand/Collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleGroupExpanded(group.id);
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {group.expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          {/* Folder Icon */}
          {group.expanded ? (
            <FolderOpen className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          )}

          {/* Name */}
          <div className="flex-1 min-w-0">
            {isGroupEditing ? (
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
              <span
                className={`text-sm truncate block font-medium ${!group.visible ? 'opacity-50' : ''}`}
              >
                {group.name}
                <span className="ml-1 text-xs text-muted-foreground font-normal">
                  ({group.members.length})
                </span>
              </span>
            )}
          </div>

          {/* Group Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleToggleGroupVisible(group.id, e)}
              className="p-1 hover:bg-muted rounded"
              title={group.visible ? t('layersPanel.hideGroup') : t('layersPanel.showGroup')}
            >
              {group.visible ? (
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={(e) => handleToggleGroupLock(group.id, e)}
              className="p-1 hover:bg-muted rounded"
              title={group.locked ? t('layersPanel.unlockGroup') : t('layersPanel.lockGroup')}
            >
              {group.locked ? (
                <Lock className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {/* Group Context Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-muted rounded">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleBringToFront(group.members.map((m) => m.id))}
                >
                  <ChevronsUp className="h-4 w-4 mr-2" />
                  {t('layersPanel.bringToFront')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSendToBack(group.members.map((m) => m.id))}>
                  <ChevronsDown className="h-4 w-4 mr-2" />
                  {t('layersPanel.sendToBack')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleUngroup(group.id)}>
                  <Ungroup className="h-4 w-4 mr-2" />
                  {t('layersPanel.ungroup')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(group.members.map((m) => m.id))}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('layersPanel.deleteGroup')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Group Members (when expanded) */}
        {group.expanded && (
          <div className="border-l-2 border-muted ml-3 pl-1">
            {group.members.map((member) => renderLayerItem(member, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-0.5" data-testid="layer-panel">
      {filteredEntries.map((entry) => {
        if (entry.kind === 'group') {
          return renderGroup(entry.data);
        } else {
          return renderLayerItem(entry.data, false);
        }
      })}
    </div>
  );
}
