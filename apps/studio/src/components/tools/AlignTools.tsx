import React from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import {
  AlignLeft,
  AlignRight,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignCenter,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  AlignStartHorizontal,
  AlignEndHorizontal,
} from 'lucide-react';
import type { KernelStore } from '@thingsvis/kernel';

export type AlignType =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'center-h'
  | 'center-v'
  | 'canvas-center'
  | 'distribute-h'
  | 'distribute-v';

interface AlignToolsProps {
  kernelStore: KernelStore;
  disabled?: boolean;
  onUserEdit?: () => void;
}

/**
 * AlignTools Component
 *
 * Provides alignment tools for selected nodes in the canvas.
 * Supports 9 types of alignment:
 * - Left, Right, Top, Bottom alignment (based on selection bounding box)
 * - Horizontal center, Vertical center (within selection)
 * - Canvas center (align to canvas center)
 * - Horizontal and vertical distribution
 */
export function AlignTools({ kernelStore, disabled = false, onUserEdit }: AlignToolsProps) {
  const { t } = useTranslation('editor');
  const selectedIds = useStore(kernelStore, (s) => s.selection.nodeIds);
  const canAlign = selectedIds.length > 1 && !disabled;

  const getState = () => kernelStore.getState();

  /**
   * Calculate the bounding box of selected nodes
   */
  const getBoundingBox = () => {
    if (selectedIds.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedIds.forEach((id) => {
      const node = getState().nodesById[id];
      if (!node) return;

      const schema = node.schemaRef as any;
      const x = schema.position?.x ?? 0;
      const y = schema.position?.y ?? 0;
      const width = schema.size?.width ?? 0;
      const height = schema.size?.height ?? 0;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: minX + (maxX - minX) / 2,
      centerY: minY + (maxY - minY) / 2,
    };
  };

  /**
   * Align nodes based on the specified type
   */
  const handleAlign = (type: AlignType) => {
    if (selectedIds.length === 0) return;

    const bbox = getBoundingBox();
    if (!bbox) return;

    const state = getState();
    // Get canvas dimensions for canvas-center alignment
    const canvasWidth = state.canvas?.width ?? 1920;
    const canvasHeight = state.canvas?.height ?? 1080;

    const updates: Record<string, { position: { x: number; y: number } }> = {};

    if (type === 'distribute-h' || type === 'distribute-v') {
      const unLockedNodes = selectedIds
        .map((id) => {
          const node = state.nodesById[id];
          if (!node || node.locked) return null;
          const schema = node.schemaRef as any;
          return {
            id,
            x: schema.position?.x ?? 0,
            y: schema.position?.y ?? 0,
            width: schema.size?.width ?? 0,
            height: schema.size?.height ?? 0,
          };
        })
        .filter(Boolean) as Array<{
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;

      if (unLockedNodes.length > 2) {
        if (type === 'distribute-h') {
          unLockedNodes.sort((a, b) => a.x - b.x);
          const first = unLockedNodes[0]!;
          const last = unLockedNodes[unLockedNodes.length - 1]!;
          const totalSpan = last.x + last.width - first.x;
          const sumWidths = unLockedNodes.reduce((sum, n) => sum + n.width, 0);
          const emptySpace = totalSpan - sumWidths;
          const gap = emptySpace / (unLockedNodes.length - 1);

          let currentX = first.x;
          unLockedNodes.forEach((node) => {
            updates[node.id] = { position: { x: Math.round(currentX), y: Math.round(node.y) } };
            currentX += node.width + gap;
          });
        } else if (type === 'distribute-v') {
          unLockedNodes.sort((a, b) => a.y - b.y);
          const first = unLockedNodes[0]!;
          const last = unLockedNodes[unLockedNodes.length - 1]!;
          const totalSpan = last.y + last.height - first.y;
          const sumHeights = unLockedNodes.reduce((sum, n) => sum + n.height, 0);
          const emptySpace = totalSpan - sumHeights;
          const gap = emptySpace / (unLockedNodes.length - 1);

          let currentY = first.y;
          unLockedNodes.forEach((node) => {
            updates[node.id] = { position: { x: Math.round(node.x), y: Math.round(currentY) } };
            currentY += node.height + gap;
          });
        }
      }
    } else {
      selectedIds.forEach((id) => {
        const node = state.nodesById[id];
        if (!node) return;
        if (node.locked) return; // Skip locked nodes

        const schema = node.schemaRef as any;
        const currentX = schema.position?.x ?? 0;
        const currentY = schema.position?.y ?? 0;
        const width = schema.size?.width ?? 0;
        const height = schema.size?.height ?? 0;

        let newX = currentX;
        let newY = currentY;

        switch (type) {
          case 'left':
            newX = bbox.left;
            break;
          case 'right':
            newX = bbox.right - width;
            break;
          case 'top':
            newY = bbox.top;
            break;
          case 'bottom':
            newY = bbox.bottom - height;
            break;
          case 'center-h':
            newX = bbox.centerX - width / 2;
            break;
          case 'center-v':
            newY = bbox.centerY - height / 2;
            break;
          case 'canvas-center':
            newX = canvasWidth / 2 - width / 2;
            newY = canvasHeight / 2 - height / 2;
            break;
        }

        updates[id] = {
          position: { x: Math.round(newX), y: Math.round(newY) },
        };
      });
    }

    // Batch update all nodes
    Object.entries(updates).forEach(([id, update]) => {
      state.updateNode(id, update);
    });

    // Trigger save
    onUserEdit?.();
  };

  const alignButtons = [
    {
      type: 'left' as AlignType,
      icon: AlignLeft,
      label: t('toolbar.align.left'),
      shortcut: 'Ctrl+Shift+L',
    },
    {
      type: 'center-h' as AlignType,
      icon: AlignCenterVertical,
      label: t('toolbar.align.center-h'),
      shortcut: 'Ctrl+Shift+H',
    },
    {
      type: 'right' as AlignType,
      icon: AlignRight,
      label: t('toolbar.align.right'),
      shortcut: 'Ctrl+Shift+R',
    },
    {
      type: 'distribute-h' as AlignType,
      icon: AlignHorizontalSpaceAround,
      label: t('toolbar.align.distribute-h'),
      shortcut: 'Alt+Shift+H',
    },
    {
      type: 'top' as AlignType,
      icon: AlignStartHorizontal,
      label: t('toolbar.align.top'),
      shortcut: 'Ctrl+Shift+T',
    },
    {
      type: 'center-v' as AlignType,
      icon: AlignCenterHorizontal,
      label: t('toolbar.align.center-v'),
      shortcut: 'Ctrl+Shift+M',
    },
    {
      type: 'bottom' as AlignType,
      icon: AlignEndHorizontal,
      label: t('toolbar.align.bottom'),
      shortcut: 'Ctrl+Shift+B',
    },
    {
      type: 'distribute-v' as AlignType,
      icon: AlignVerticalSpaceAround,
      label: t('toolbar.align.distribute-v'),
      shortcut: 'Alt+Shift+V',
    },
    {
      type: 'canvas-center' as AlignType,
      icon: AlignCenter,
      label: t('toolbar.align.canvas-center'),
      shortcut: 'Ctrl+Shift+C',
    },
  ];

  if (!canAlign) return null;

  return (
    <>
      <div className="border-l border-border h-6 mx-1" />
      <div className="flex items-center gap-0.5">
        {alignButtons.map(({ type, icon: Icon, label, shortcut }) => (
          <Button
            key={type}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:ring-0 focus:outline-none"
            onClick={() => handleAlign(type)}
            title={`${label} (${shortcut})`}
            disabled={disabled}
          >
            <Icon className="h-4.5 w-4.5 stroke-2" />
          </Button>
        ))}
      </div>
    </>
  );
}
