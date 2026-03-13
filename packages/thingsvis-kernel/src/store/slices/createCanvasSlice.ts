import type { StateCreator } from 'zustand/vanilla';
import type { KernelState, KernelActions, CanvasState } from '../types';

export type CanvasSliceState = {
  canvas: CanvasState;
};

export type CanvasSliceActions = Pick<KernelActions, 'updateCanvas'>;

export type CanvasSlice = CanvasSliceState & CanvasSliceActions;

export const defaultCanvas: CanvasState = {
  mode: 'infinite',
  width: 1920,
  height: 1080,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export const createCanvasSlice: StateCreator<
  KernelState & KernelActions,
  [['zustand/immer', never]],
  [],
  CanvasSlice
> = (set) => ({
  canvas: defaultCanvas,
  updateCanvas: (changes) => {
    set((state) => {
      state.canvas = {
        ...state.canvas,
        ...changes,
      };
    });
  },
});
