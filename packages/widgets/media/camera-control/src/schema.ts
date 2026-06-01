import { z } from 'zod';

export const PropsSchema = z.object({
  title: z.string().default('Camera').describe('props.title'),
  showTitle: z.boolean().default(false).describe('props.showTitle'),
  mode: z.enum(['live', 'playback']).default('live').describe('props.mode'),
  streamUrl: z.string().default('').describe('props.streamUrl'),
  playbackUrl: z.string().default('').describe('props.playbackUrl'),
  streamMode: z.string().default('hls').describe('props.streamMode'),
  autoplay: z.boolean().default(true).describe('props.autoplay'),
  objectFit: z
    .enum(['contain', 'cover', 'fill', 'none'])
    .default('contain')
    .describe('props.objectFit'),
  visibilityThreshold: z.number().min(0).max(1).default(0).describe('props.visibilityThreshold'),

  showStatusBar: z.boolean().default(true).describe('props.showStatusBar'),
  onlineStatus: z.string().default('').describe('props.onlineStatus'),
  recordingStatus: z.string().default('').describe('props.recordingStatus'),
  showPtz: z.boolean().default(false).describe('props.showPtz'),
  showSnapshot: z.boolean().default(true).describe('props.showSnapshot'),
  showFullscreen: z.boolean().default(true).describe('props.showFullscreen'),
  showZoomControls: z.boolean().default(false).describe('props.showZoomControls'),
  showFocusControls: z.boolean().default(false).describe('props.showFocusControls'),
  showPresetControl: z.boolean().default(false).describe('props.showPresetControl'),
  showPlaybackControls: z.boolean().default(true).describe('props.showPlaybackControls'),
  ptzSpeed: z.number().min(1).max(10).default(3).describe('props.ptzSpeed'),
  presetId: z.string().default('1').describe('props.presetId'),
  playbackStart: z.string().default('').describe('props.playbackStart'),
  playbackEnd: z.string().default('').describe('props.playbackEnd'),

  ptzMoveCommand: z.string().default('ptz_move').describe('props.ptzMoveCommand'),
  ptzStopCommand: z.string().default('ptz_stop').describe('props.ptzStopCommand'),
  ptzZoomCommand: z.string().default('ptz_zoom').describe('props.ptzZoomCommand'),
  ptzFocusCommand: z.string().default('ptz_focus').describe('props.ptzFocusCommand'),
  presetGotoCommand: z.string().default('preset_goto').describe('props.presetGotoCommand'),
  snapshotCommand: z.string().default('snapshot').describe('props.snapshotCommand'),
  playbackOpenCommand: z.string().default('playback_open').describe('props.playbackOpenCommand'),

  borderRadius: z.number().min(0).max(48).default(6).describe('props.borderRadius'),
  borderWidth: z.number().min(0).max(12).default(0).describe('props.borderWidth'),
  borderColor: z.string().default('#111827').describe('props.borderColor'),
  panelOpacity: z.number().min(0).max(1).default(0.78).describe('props.panelOpacity'),
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
