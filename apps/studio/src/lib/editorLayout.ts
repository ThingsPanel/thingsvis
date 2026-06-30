/** Shared editor chrome dimensions — keep canvas centering and panel offsets in sync. */

export const EDITOR_PANEL_GUTTER = 16; // Tailwind left-4 / right-4
export const EDITOR_LEFT_PANEL_WIDTH = 288; // w-72
export const EDITOR_RIGHT_PANEL_WIDTH = 320; // w-80
export const EDITOR_TOP_CHROME = 80; // top-20 toolbar zone
export const EDITOR_BOTTOM_CHROME = 56; // bottom bar + gutter

export type EditorCenterPadding = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
};

export function getEditorCenterPadding(options: {
  showLeftPanel: boolean;
  showRightPanel: boolean;
  showLibrary: boolean;
  showProps: boolean;
}): EditorCenterPadding {
  return {
    left:
      options.showLibrary && options.showLeftPanel
        ? EDITOR_PANEL_GUTTER + EDITOR_LEFT_PANEL_WIDTH
        : 0,
    right:
      options.showProps && options.showRightPanel
        ? EDITOR_PANEL_GUTTER + EDITOR_RIGHT_PANEL_WIDTH
        : 0,
    top: EDITOR_TOP_CHROME,
    bottom: EDITOR_BOTTOM_CHROME,
  };
}

export function getEditorBottomBarLeft(showLeftPanel: boolean): number {
  return showLeftPanel
    ? EDITOR_PANEL_GUTTER + EDITOR_LEFT_PANEL_WIDTH + EDITOR_PANEL_GUTTER
    : EDITOR_PANEL_GUTTER;
}
