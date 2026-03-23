import { z } from 'zod';

export const PropsSchema = z.object({
  modelUrl: z.string().default('').describe('Remote GLB/GLTF URL'),
  requestMode: z.enum(['auto', 'direct', 'proxy']).default('auto').describe('Model request mode'),
  backgroundColor: z.string().default('transparent').describe('Canvas background color'),
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
  cameraFov: z.number().min(10).max(120).default(45).describe('Camera field of view'),
  cameraTargetX: z.number().min(-1000).max(1000).default(0).describe('Camera target X offset'),
  cameraTargetY: z.number().min(-1000).max(1000).default(0).describe('Camera target Y offset'),
  cameraTargetZ: z.number().min(-1000).max(1000).default(0).describe('Camera target Z offset'),
  cameraPositionX: z.number().min(-1000).max(1000).default(4).describe('Manual camera X'),
  cameraPositionY: z.number().min(-1000).max(1000).default(2).describe('Manual camera Y'),
  cameraPositionZ: z.number().min(-1000).max(1000).default(6).describe('Manual camera Z'),
  cameraNear: z.number().min(0.001).max(100).default(0.01).describe('Manual camera near plane'),
  cameraFar: z.number().min(1).max(10000).default(1000).describe('Manual camera far plane'),
  minZoomDistance: z.number().min(0.001).max(1000).default(0.05).describe('Minimum zoom distance'),
  maxZoomDistance: z.number().min(0.1).max(10000).default(100).describe('Maximum zoom distance'),
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
});

export type Props = z.infer<typeof PropsSchema>;

export function getDefaultProps(): Props {
  return PropsSchema.parse({});
}
