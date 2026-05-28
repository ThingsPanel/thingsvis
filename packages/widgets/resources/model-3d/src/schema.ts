import { z } from 'zod';

export const SceneLabelSchema = z.object({
  anchor: z.string().default('anchor_pv').describe('Anchor node name in GLB'),
  title: z.string().default('').describe('Label title'),
  value: z.string().default('--').describe('Label value'),
  unit: z.string().default('').describe('Label unit'),
  visible: z.boolean().default(true).describe('Label visibility'),
});

export const DEFAULT_SCENE_LABELS: z.infer<typeof SceneLabelSchema>[] = [
  { anchor: 'anchor_pv', title: '光伏系统', value: '--', unit: 'MW', visible: true },
  { anchor: 'anchor_storage', title: '储能系统', value: '--', unit: '%', visible: true },
  { anchor: 'anchor_substation', title: '变配电', value: '--', unit: 'MW', visible: true },
  { anchor: 'anchor_workshop', title: '生产车间', value: '--', unit: 'MW', visible: true },
  { anchor: 'anchor_pump', title: '水泵系统', value: '--', unit: 'MW', visible: true },
];

export const CameraPresetSchema = z.object({
  id: z.string().default('preset-1').describe('Camera preset id'),
  name: z.string().default('').describe('Camera preset name'),
  positionX: z.number().min(-1000).max(1000).default(4).describe('Preset camera X'),
  positionY: z.number().min(-1000).max(1000).default(2).describe('Preset camera Y'),
  positionZ: z.number().min(-1000).max(1000).default(6).describe('Preset camera Z'),
  targetX: z.number().min(-1000).max(1000).default(0).describe('Preset target X'),
  targetY: z.number().min(-1000).max(1000).default(0).describe('Preset target Y'),
  targetZ: z.number().min(-1000).max(1000).default(0).describe('Preset target Z'),
  fov: z.number().min(10).max(120).optional().describe('Preset camera field of view'),
  near: z.number().min(0.001).max(100).optional().describe('Preset near plane'),
  far: z.number().min(1).max(10000).optional().describe('Preset far plane'),
  minDistance: z.number().min(0.001).max(1000).optional().describe('Preset minimum zoom distance'),
  maxDistance: z.number().min(0.1).max(10000).optional().describe('Preset maximum zoom distance'),
});

export const PropsSchema = z.object({
  modelUrl: z.string().default('').describe('Remote GLB/GLTF URL'),
  requestMode: z.enum(['auto', 'direct', 'proxy']).default('auto').describe('Model request mode'),
  canvasBackgroundColor: z.string().default('transparent').describe('Canvas background color'),
  backgroundColor: z.string().optional().describe('Legacy canvas background color'),
  modelScale: z.number().min(0.01).max(20).default(1).describe('Model scale'),
  positionX: z.number().min(-1000).max(1000).default(0).describe('Model position X'),
  positionY: z.number().min(-1000).max(1000).default(0).describe('Model position Y'),
  positionZ: z.number().min(-1000).max(1000).default(0).describe('Model position Z'),
  rotationX: z.number().min(-180).max(180).default(0).describe('Model rotation X'),
  rotationY: z.number().min(-180).max(180).default(0).describe('Model rotation Y'),
  rotationZ: z.number().min(-180).max(180).default(0).describe('Model rotation Z'),
  wireframe: z.boolean().default(false).describe('Render model in wireframe'),
  autoFitCamera: z.boolean().default(true).describe('Auto fit camera to model bounds'),
  cameraDistanceMultiplier: z.number().min(0.02).max(20).default(1).describe('Camera fit multiplier'),
  cameraAzimuth: z.number().min(-180).max(180).default(35).describe('Auto-fit camera azimuth'),
  cameraElevation: z.number().min(-85).max(85).default(22).describe('Auto-fit camera elevation'),
  limitCameraAngle: z.boolean().default(true).describe('Limit orbit rotation range'),
  minCameraElevation: z.number().min(-85).max(85).default(12).describe('Minimum camera elevation in degrees'),
  maxCameraElevation: z.number().min(-85).max(85).default(34).describe('Maximum camera elevation in degrees'),
  minCameraAzimuth: z.number().min(-180).max(180).default(5).describe('Minimum camera azimuth in degrees'),
  maxCameraAzimuth: z.number().min(-180).max(180).default(75).describe('Maximum camera azimuth in degrees'),
  fitAnchorY: z.number().min(0).max(1).default(0.38).describe('Vertical anchor ratio inside model bounds'),
  cameraTargetX: z.number().min(-1000).max(1000).default(0).describe('Camera target X offset'),
  cameraTargetY: z.number().min(-1000).max(1000).default(0).describe('Camera target Y offset'),
  cameraTargetZ: z.number().min(-1000).max(1000).default(0).describe('Camera target Z offset'),
  cameraFov: z.number().min(10).max(120).default(45).describe('Camera field of view'),
  cameraPositionX: z.number().min(-1000).max(1000).default(4).describe('Manual camera X'),
  cameraPositionY: z.number().min(-1000).max(1000).default(2).describe('Manual camera Y'),
  cameraPositionZ: z.number().min(-1000).max(1000).default(6).describe('Manual camera Z'),
  cameraNear: z.number().min(0.001).max(100).default(0.01).describe('Manual camera near plane'),
  cameraFar: z.number().min(1).max(10000).default(1000).describe('Manual camera far plane'),
  minZoomDistance: z.number().min(0.001).max(1000).default(0.05).describe('Minimum zoom distance'),
  maxZoomDistance: z.number().min(0.1).max(10000).default(100).describe('Maximum zoom distance'),
  cameraPresets: z.array(CameraPresetSchema).default([]).describe('Camera presets'),
  activeCameraPresetId: z.string().default('').describe('Active camera preset id'),
  ambientLightIntensity: z.number().min(0).max(10).default(1.2).describe('Ambient light intensity'),
  directionalLightIntensity: z.number().min(0).max(10).default(2.4).describe('Directional light intensity'),
  fillLightIntensity: z.number().min(0).max(10).default(0.8).describe('Fill light intensity'),
  exposure: z.number().min(0.1).max(5).default(1.05).describe('Tone mapping exposure'),
  enableInteraction: z.boolean().default(true).describe('Enable orbit controls in preview'),
  autoRotate: z.boolean().default(false).describe('Auto rotate model'),
  rotationSpeed: z.number().min(0.1).max(10).default(1.2).describe('Auto rotation speed'),
  playAnimations: z.boolean().default(true).describe('Play model animations'),
  animationSpeed: z.number().min(0.1).max(5).default(1).describe('Animation speed'),
  showAxes: z.boolean().default(false).describe('Show axes helper'),
  axesSize: z.number().min(0.1).max(1000).default(5).describe('Axes helper size'),
  showGrid: z.boolean().default(false).describe('Show grid helper'),
  gridSize: z.number().min(1).max(1000).default(20).describe('Grid helper size'),
  gridDivisions: z.number().min(1).max(200).default(20).describe('Grid helper divisions'),
  showBoundingBox: z.boolean().default(false).describe('Show bounding box helper'),
  showSceneLabels: z.boolean().default(true).describe('Show labels on anchor nodes'),
  labelAnchorPrefix: z.string().default('anchor_').describe('Anchor node name prefix'),
  labelOffsetY: z.number().min(-50).max(50).default(0.3).describe('Label offset above anchor'),
  labelValue_pv: z.union([z.string(), z.number()]).default('').describe('PV label value'),
  labelValue_storage: z.union([z.string(), z.number()]).default('').describe('Storage label value'),
  labelValue_substation: z.union([z.string(), z.number()]).default('').describe('Substation label value'),
  labelValue_workshop: z.union([z.string(), z.number()]).default('').describe('Workshop label value'),
  labelValue_pump: z.union([z.string(), z.number()]).default('').describe('Pump label value'),
  sceneLabels: z.array(SceneLabelSchema).default(() => DEFAULT_SCENE_LABELS.map((item) => ({ ...item }))).describe('Scene label configs'),
  showPipeFlow: z.boolean().default(true).describe('Animate energy pipe flow in viewer'),
  pipeNamePrefix: z.string().default('能量线_').describe('Pipe mesh name prefix'),
  pipeFlowSpeed: z.number().min(0.1).max(10).default(1.8).describe('Pipe flow animation speed'),
});

export type Props = z.infer<typeof PropsSchema>;
export type CameraPreset = z.infer<typeof CameraPresetSchema>;
export type SceneLabel = z.infer<typeof SceneLabelSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
