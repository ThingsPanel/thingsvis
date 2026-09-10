import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize, Minimize, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type PreviewScaleMode = 'fit-min' | 'fit-width' | 'fit-height' | 'stretch' | 'original';

const COLLAPSE_DELAY_MS = 500;

interface PreviewToolbarProps {
  isFullscreen: boolean;
  isGridLayout: boolean;
  scaleMode: PreviewScaleMode;
  refreshDisabled?: boolean;
  onBack?: () => void;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
  onScaleModeChange: (scaleMode: PreviewScaleMode) => void;
}

export function PreviewToolbar({
  isFullscreen,
  isGridLayout,
  scaleMode,
  refreshDisabled = false,
  onBack,
  onRefresh,
  onToggleFullscreen,
  onScaleModeChange,
}: PreviewToolbarProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScaleMenuOpen, setIsScaleMenuOpen] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInsideRef = useRef(false);
  const isFocusInsideRef = useRef(false);
  const isScaleMenuOpenRef = useRef(false);
  const isPointerDownRef = useRef(false);

  const cancelCollapse = useCallback(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  }, []);

  const expand = useCallback(() => {
    cancelCollapse();
    setIsExpanded(true);
  }, [cancelCollapse]);

  const scheduleCollapse = useCallback(() => {
    cancelCollapse();
    collapseTimerRef.current = setTimeout(() => {
      if (!isPointerInsideRef.current && !isFocusInsideRef.current && !isScaleMenuOpenRef.current) {
        setIsExpanded(false);
      }
    }, COLLAPSE_DELAY_MS);
  }, [cancelCollapse]);

  useEffect(() => cancelCollapse, [cancelCollapse]);

  const handleScaleMenuOpenChange = (open: boolean) => {
    isScaleMenuOpenRef.current = open;
    setIsScaleMenuOpen(open);
    if (open) expand();
    else scheduleCollapse();
  };

  return (
    <div
      className="absolute top-4 right-4 z-50"
      onPointerEnter={() => {
        isPointerInsideRef.current = true;
        expand();
      }}
      onPointerLeave={() => {
        isPointerInsideRef.current = false;
        scheduleCollapse();
      }}
      onPointerDownCapture={() => {
        isPointerDownRef.current = true;
        isFocusInsideRef.current = false;
      }}
      onPointerUpCapture={() => {
        isPointerDownRef.current = false;
      }}
      onPointerCancel={() => {
        isPointerDownRef.current = false;
      }}
      onFocusCapture={() => {
        if (!isPointerDownRef.current) isFocusInsideRef.current = true;
        expand();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          isFocusInsideRef.current = false;
          scheduleCollapse();
        }
      }}
    >
      <div className="glass rounded-md shadow-md border border-border flex items-center justify-end gap-1 p-1 text-foreground">
        {isExpanded ? (
          <>
            {onBack ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md"
                onClick={onBack}
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={onRefresh}
              disabled={refreshDisabled}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={onToggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            <div className="w-px h-4 mx-2 bg-neutral-300 dark:bg-neutral-600" />

            {isGridLayout ? (
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground select-none">
                {t('preview.scaleMode.responsive', { ns: 'pages' })}
              </span>
            ) : (
              <Select
                value={scaleMode}
                open={isScaleMenuOpen}
                onOpenChange={handleScaleMenuOpenChange}
                onValueChange={(value) => onScaleModeChange(value as PreviewScaleMode)}
              >
                <SelectTrigger className="w-auto min-w-[140px] px-2 h-8 bg-transparent border-0 ring-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring outline-none shadow-none text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value="fit-min">
                    {t('preview.scaleMode.fitMin', { ns: 'pages' })}
                  </SelectItem>
                  <SelectItem value="fit-width">
                    {t('preview.scaleMode.fitWidth', { ns: 'pages' })}
                  </SelectItem>
                  <SelectItem value="fit-height">
                    {t('preview.scaleMode.fitHeight', { ns: 'pages' })}
                  </SelectItem>
                  <SelectItem value="stretch">
                    {t('preview.scaleMode.stretch', { ns: 'pages' })}
                  </SelectItem>
                  <SelectItem value="original">
                    {t('preview.scaleMode.original', { ns: 'pages' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-md"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse preview controls' : 'Expand preview controls'}
          title={isExpanded ? 'Collapse preview controls' : 'Expand preview controls'}
          onClick={() => {
            cancelCollapse();
            setIsExpanded((expanded) => !expanded);
          }}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
