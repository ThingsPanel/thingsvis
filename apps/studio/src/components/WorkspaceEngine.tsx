import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CanvasView from './CanvasView';
import { EditorContextMenu } from './ContextMenu/EditorContextMenu';
import { store } from '../lib/store';
import { openImagePicker } from './tools/imagePicker';
import { uploadFile } from '@/lib/api/uploads';
import { uploadImage as uploadToLocal } from '@/lib/imageUpload';
import { useAuth } from '@/lib/auth';
import type { CanvasConfigSchema } from '../hooks/useProjectBootstrap';
import { loadWidget } from '../lib/registry/componentLoader';

export type Tool = 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'image' | 'pan';

export interface WorkspaceEngineProps {
  canvasConfig: CanvasConfigSchema;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  embedVisibility: any;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  markDirty: () => void;
}

export const WorkspaceEngine: React.FC<WorkspaceEngineProps> = ({
  canvasConfig,
  activeTool,
  setActiveTool,
  zoom,
  setZoom,
  embedVisibility,
  showLeftPanel,
  showRightPanel,
  markDirty,
}) => {
  const { t } = useTranslation('editor');
  const { isAuthenticated } = useAuth();
  const [pendingImageUrl, setPendingImageUrl] = useState<string | undefined>(undefined);

  const handleImagePickerRequest = useCallback(async () => {
    try {
      const file = await openImagePicker();
      if (!file) {
        setActiveTool('select');
        setPendingImageUrl(undefined);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(t('alerts.imageTooLarge'));
        setActiveTool('select');
        setPendingImageUrl(undefined);
        return;
      }

      let url = '';

      if (isAuthenticated) {
        const result = await uploadFile(file);
        if (result.error) throw new Error(result.error);
        if (result.data) url = result.data.url;
      } else {
        url = await uploadToLocal(file);
      }

      if (url) {
        setPendingImageUrl(url);
      } else {
        throw new Error('Failed to get image URL');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      alert(t('alerts.imageUploadFailed'));
      setActiveTool('select');
      setPendingImageUrl(undefined);
    }
  }, [isAuthenticated, t, setActiveTool]);

  const handleImagePickerComplete = useCallback(() => {
    setPendingImageUrl(undefined);
    setActiveTool('select');
  }, [setActiveTool]);

  const handleResetTool = useCallback(() => {
    setActiveTool('select');
    setPendingImageUrl(undefined);
  }, [setActiveTool]);

  const resolveWidget = useCallback(async (type: string) => {
    const { entry } = await loadWidget(type);
    return entry;
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <EditorContextMenu>
        <div className="w-full h-full relative outline-none flex">
          <CanvasView
            pageId={canvasConfig.id}
            store={store as any}
            activeTool={activeTool}
            resolveWidget={resolveWidget as any}
            zoom={zoom / 100}
            theme={canvasConfig.theme}
            onZoomChange={(newZoom) => setZoom(Math.round(newZoom * 100))}
            onUserEdit={markDirty}
            onResetTool={handleResetTool}
            pendingImageUrl={pendingImageUrl}
            onImagePickerRequest={handleImagePickerRequest}
            onImagePickerComplete={handleImagePickerComplete}
            centerPadding={{
              left: embedVisibility.showLibrary && showLeftPanel ? 320 : 0,
              right: embedVisibility.showProps && showRightPanel ? 340 : 0,
            }}
          />
        </div>
      </EditorContextMenu>
    </div>
  );
};
