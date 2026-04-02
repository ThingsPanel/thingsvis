import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { defineWidget, resolveLocaleRecord, type WidgetOverlayContext } from '@thingsvis/widget-sdk';
import { controls } from './controls';
import { metadata } from './metadata';
import { PropsSchema, type CameraPreset, type Props } from './schema';
import zh from './locales/zh.json';
import en from './locales/en.json';
import { resolveWidgetApiBaseUrl } from './api-base';

type RuntimeMessages = (typeof zh)['runtime'];
type RequestMode = Props['requestMode'];
type CameraPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  near: number;
  far: number;
  minDistance: number;
  maxDistance: number;
};

const localeCatalog = { zh, en } as const;
const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const POINTER_CLICK_THRESHOLD_PX = 6;

type HelperState = {
  axes: THREE.AxesHelper | null;
  grid: THREE.GridHelper | null;
  box: THREE.BoxHelper | null;
};

function resolveMessages(locale: string | undefined): RuntimeMessages {
  return resolveLocaleRecord(
    {
      zh: zh.runtime,
      en: en.runtime,
    },
    locale,
    'zh',
  );
}

function getCanvasBackgroundColor(value: Props): string {
  return value.canvasBackgroundColor || value.backgroundColor || 'transparent';
}

function normalizeModelUrl(source: string): string {
  const trimmed = source.trim();
  if (
    !trimmed ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('//') ||
    ABSOLUTE_URL_RE.test(trimmed)
  ) {
    return trimmed;
  }

  const base = (() => {
    if (typeof window === 'undefined') return undefined;

    const isEmbedded = typeof window.parent !== 'undefined' && window.parent !== window;
    if (isEmbedded && typeof document !== 'undefined' && document.referrer) {
      try {
        return new URL(document.referrer).origin;
      } catch {
        return window.location.href;
      }
    }

    return window.location.href;
  })();

  if (!base) return trimmed;

  try {
    return new URL(trimmed, base).toString();
  } catch {
    return trimmed;
  }
}

function getResourceBaseUrl(source: string): string {
  try {
    return new URL('./', source).toString();
  } catch {
    return source;
  }
}

function resolveResourceUrl(resourceUrl: string, resourceBaseUrl: string): string {
  try {
    return new URL(resourceUrl, resourceBaseUrl).toString();
  } catch {
    return resourceUrl;
  }
}

function isRemoteHttpUrl(source: string): boolean {
  try {
    const url = new URL(source);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isManagedUploadUrl(source: string): boolean {
  try {
    const url = new URL(source);
    const pathname = url.pathname;
    return (
      pathname.startsWith('/uploads/') ||
      pathname.startsWith('/api/v1/uploads/') ||
      pathname.includes('/thingsvis-api/uploads/')
    );
  } catch {
    return false;
  }
}

function shouldProxyRequest(source: string, requestMode: RequestMode): boolean {
  if (!isRemoteHttpUrl(source)) {
    return false;
  }

  if (isManagedUploadUrl(source)) {
    return false;
  }

  if (requestMode === 'proxy') {
    return true;
  }

  if (requestMode === 'direct') {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return new URL(source).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function buildProxyUrl(source: string): string {
  if (typeof window === 'undefined') {
    return source;
  }

  const apiBaseUrl = resolveWidgetApiBaseUrl().replace(/\/$/, '');
  return `${apiBaseUrl}/public/assets/proxy?url=${encodeURIComponent(source)}`;
}

function getRequestUrl(source: string, requestMode: RequestMode): string {
  return shouldProxyRequest(source, requestMode) ? buildProxyUrl(source) : source;
}

function formatLoadError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return '';
}

async function readErrorResponse(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { error?: string; details?: string };
      return [payload.error, payload.details].filter(Boolean).join(' ');
    }

    const text = await response.text();
    return text.trim().slice(0, 400);
  } catch {
    return '';
  }
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((item) => disposeMaterial(item));
    return;
  }
  material.dispose();
}

function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

function disposeHelper(helper: THREE.Object3D | null) {
  if (!helper) return;

  const geometryHelper = helper as unknown as { geometry?: THREE.BufferGeometry };
  if (geometryHelper.geometry) {
    geometryHelper.geometry.dispose();
  }

  const materialHelper = helper as unknown as { material?: THREE.Material | THREE.Material[] };
  if (materialHelper.material) {
    disposeMaterial(materialHelper.material);
  }
}

function applyObjectTransform(object: THREE.Object3D, props: Props) {
  object.position.set(props.positionX, props.positionY, props.positionZ);
  object.rotation.set(
    THREE.MathUtils.degToRad(props.rotationX),
    THREE.MathUtils.degToRad(props.rotationY),
    THREE.MathUtils.degToRad(props.rotationZ),
  );
  object.scale.setScalar(props.modelScale);
  object.updateMatrixWorld(true);
}

function applyMaterialOptions(root: THREE.Object3D, props: Props) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;

    const setWireframe = (material: THREE.Material) => {
      const maybeWireframe = material as THREE.Material & { wireframe?: boolean };
      if (typeof maybeWireframe.wireframe === 'boolean') {
        maybeWireframe.wireframe = props.wireframe;
      }
      material.needsUpdate = true;
    };

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => setWireframe(material));
      return;
    }

    setWireframe(mesh.material);
  });
}

function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
  props: Props,
  mainLight: THREE.DirectionalLight,
  fillLight: THREE.DirectionalLight,
) {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1);
  const target = center.clone().add(
    new THREE.Vector3(props.cameraTargetX, props.cameraTargetY, props.cameraTargetZ),
  );

  let pose: CameraPose;
  if (props.autoFitCamera) {
    const fov = THREE.MathUtils.degToRad(props.cameraFov);
    const baseDistance = (maxDim / 2) / Math.tan(fov / 2);
    const distance = Math.max(baseDistance * props.cameraDistanceMultiplier, 0.01);
    const azimuth = THREE.MathUtils.degToRad(props.cameraAzimuth);
    const elevation = THREE.MathUtils.degToRad(props.cameraElevation);
    const planar = Math.cos(elevation);

    pose = {
      position: new THREE.Vector3(
        target.x + distance * Math.sin(azimuth) * planar,
        target.y + distance * Math.sin(elevation),
        target.z + distance * Math.cos(azimuth) * planar,
      ),
      target,
      fov: props.cameraFov,
      near: Math.max(distance / 500, 0.001),
      far: Math.max(distance * 100, 100),
      minDistance: Math.max(distance * 0.1, 0.01),
      maxDistance: Math.max(distance * 20, 0.5),
    };
  } else {
    pose = {
      position: new THREE.Vector3(
        props.cameraPositionX,
        props.cameraPositionY,
        props.cameraPositionZ,
      ),
      target,
      fov: props.cameraFov,
      near: props.cameraNear,
      far: props.cameraFar,
      minDistance: Math.max(props.minZoomDistance, 0.001),
      maxDistance: Math.max(props.maxZoomDistance, props.minZoomDistance + 0.01),
    };
  }

  applyCameraPose(camera, controls, pose, mainLight, fillLight);
}

function applyCameraPose(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  pose: CameraPose,
  mainLight: THREE.DirectionalLight,
  fillLight: THREE.DirectionalLight,
) {
  camera.fov = pose.fov;
  camera.position.copy(pose.position);
  camera.near = pose.near;
  camera.far = pose.far;
  camera.updateProjectionMatrix();

  controls.target.copy(pose.target);
  controls.minDistance = Math.max(pose.minDistance, 0.001);
  controls.maxDistance = Math.max(pose.maxDistance, controls.minDistance + 0.01);
  controls.update();

  const lightDistance = Math.max(camera.position.distanceTo(pose.target), 0.01);
  mainLight.position.set(
    pose.target.x + lightDistance * 0.8,
    pose.target.y + lightDistance * 1.2,
    pose.target.z + lightDistance,
  );
  fillLight.position.set(
    pose.target.x - lightDistance * 0.7,
    pose.target.y + lightDistance * 0.5,
    pose.target.z - lightDistance * 0.8,
  );
}

function resolveActiveCameraPreset(props: Props): CameraPreset | null {
  if (!props.activeCameraPresetId) {
    return null;
  }

  return props.cameraPresets.find((preset) => preset.id === props.activeCameraPresetId) ?? null;
}

function toCameraPose(props: Props, preset: CameraPreset): CameraPose {
  return {
    position: new THREE.Vector3(preset.positionX, preset.positionY, preset.positionZ),
    target: new THREE.Vector3(preset.targetX, preset.targetY, preset.targetZ),
    fov: preset.fov ?? props.cameraFov,
    near: preset.near ?? props.cameraNear,
    far: preset.far ?? props.cameraFar,
    minDistance: Math.max(preset.minDistance ?? props.minZoomDistance, 0.001),
    maxDistance: Math.max(
      preset.maxDistance ?? props.maxZoomDistance,
      (preset.minDistance ?? props.minZoomDistance) + 0.01,
    ),
  };
}

function emitWidgetEvent(
  element: HTMLElement,
  event: string,
  data: Record<string, unknown>,
) {
  element.dispatchEvent(
    new CustomEvent('widget:emit', {
      detail: { event, data },
      bubbles: true,
    }),
  );
}

function resolveSceneNodeId(object: THREE.Object3D): string {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name?.trim()) {
      return current.name.trim();
    }
    current = current.parent;
  }

  return object.uuid;
}

function createManualCameraPose(props: Props): CameraPose {
  return {
    position: new THREE.Vector3(
      props.cameraPositionX,
      props.cameraPositionY,
      props.cameraPositionZ,
    ),
    target: new THREE.Vector3(props.cameraTargetX, props.cameraTargetY, props.cameraTargetZ),
    fov: props.cameraFov,
    near: props.cameraNear,
    far: props.cameraFar,
    minDistance: Math.max(props.minZoomDistance, 0.001),
    maxDistance: Math.max(props.maxZoomDistance, props.minZoomDistance + 0.01),
  };
}

function createObjectClickPayload(object: THREE.Object3D, assetId: string) {
  return {
    sceneNodeId: resolveSceneNodeId(object),
    objectId: object.uuid,
    objectName: object.name || '',
    objectType: object.type,
    assetId,
  };
}

function isPointerClick(startX: number, startY: number, endX: number, endY: number) {
  return Math.hypot(endX - startX, endY - startY) <= POINTER_CLICK_THRESHOLD_PX;
}

function syncHelpers(
  scene: THREE.Scene,
  model: THREE.Object3D | null,
  props: Props,
  helperState: HelperState,
) {
  if (helperState.axes) {
    scene.remove(helperState.axes);
    disposeHelper(helperState.axes);
    helperState.axes = null;
  }
  if (helperState.grid) {
    scene.remove(helperState.grid);
    disposeHelper(helperState.grid);
    helperState.grid = null;
  }
  if (helperState.box) {
    scene.remove(helperState.box);
    disposeHelper(helperState.box);
    helperState.box = null;
  }

  if (props.showAxes) {
    helperState.axes = new THREE.AxesHelper(props.axesSize);
    scene.add(helperState.axes);
  }

  if (props.showGrid) {
    helperState.grid = new THREE.GridHelper(props.gridSize, props.gridDivisions, 0x94a3b8, 0xcbd5e1);
    helperState.grid.position.y = props.cameraTargetY;
    scene.add(helperState.grid);
  }

  if (props.showBoundingBox && model) {
    helperState.box = new THREE.BoxHelper(model, 0x38bdf8);
    scene.add(helperState.box);
  }
}

export const Main = defineWidget({
  id: metadata.id,
  name: metadata.name,
  category: metadata.category as any,
  icon: metadata.icon,
  version: metadata.version,
  defaultSize: metadata.defaultSize,
  resizable: metadata.resizable,
  constraints: metadata.constraints,
  schema: PropsSchema,
  controls,
  locales: localeCatalog,
  render: (element: HTMLElement, props: Props, ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let currentMode = ctx.mode ?? 'edit';
    let currentLocale = ctx.locale;
    let currentUrl = normalizeModelUrl(props.modelUrl);
    let currentModel: THREE.Object3D | null = null;
    let currentAnimations: THREE.AnimationClip[] = [];
    let currentMixer: THREE.AnimationMixer | null = null;
    let currentErrorMessage = '';
    let activeResourceBaseUrl = '';
    let frameId = 0;
    let destroyed = false;
    let resizeObserver: ResizeObserver | null = null;
    let loadRequestId = 0;

    const clock = new THREE.Clock();
    const helperState: HelperState = { axes: null, grid: null, box: null };
    const loadingManager = new THREE.LoadingManager();
    loadingManager.setURLModifier((resourceUrl: string) => {
      const absoluteUrl = activeResourceBaseUrl
        ? resolveResourceUrl(resourceUrl, activeResourceBaseUrl)
        : resourceUrl;
      return getRequestUrl(absoluteUrl, currentProps.requestMode);
    });

    const loader = new GLTFLoader(loadingManager);
    loader.setCrossOrigin('anonymous');

    const messages = () => resolveMessages(currentLocale);

    element.style.width = '100%';
    element.style.height = '100%';
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.style.background = getCanvasBackgroundColor(currentProps);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(element.clientWidth || 1, element.clientHeight || 1, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    element.appendChild(renderer.domElement);

    const placeholder = document.createElement('div');
    placeholder.style.position = 'absolute';
    placeholder.style.inset = '0';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.padding = '16px';
    placeholder.style.boxSizing = 'border-box';
    placeholder.style.pointerEvents = 'none';
    placeholder.style.background = 'linear-gradient(135deg, rgba(15,23,42,0.08), rgba(15,23,42,0.02))';
    element.appendChild(placeholder);

    const placeholderCard = document.createElement('div');
    placeholderCard.style.maxWidth = '320px';
    placeholderCard.style.display = 'flex';
    placeholderCard.style.flexDirection = 'column';
    placeholderCard.style.gap = '6px';
    placeholderCard.style.padding = '14px 16px';
    placeholderCard.style.borderRadius = '12px';
    placeholderCard.style.background = 'rgba(255,255,255,0.88)';
    placeholderCard.style.backdropFilter = 'blur(8px)';
    placeholderCard.style.color = '#0f172a';
    placeholderCard.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.12)';
    placeholder.appendChild(placeholderCard);

    const placeholderTitle = document.createElement('div');
    placeholderTitle.style.fontSize = '14px';
    placeholderTitle.style.fontWeight = '600';
    placeholderCard.appendChild(placeholderTitle);

    const placeholderDescription = document.createElement('div');
    placeholderDescription.style.fontSize = '12px';
    placeholderDescription.style.lineHeight = '1.5';
    placeholderDescription.style.opacity = '0.78';
    placeholderCard.appendChild(placeholderDescription);

    const placeholderUrl = document.createElement('div');
    placeholderUrl.style.fontSize = '11px';
    placeholderUrl.style.lineHeight = '1.4';
    placeholderUrl.style.opacity = '0.66';
    placeholderUrl.style.wordBreak = 'break-all';
    placeholderCard.appendChild(placeholderUrl);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(currentProps.cameraFov, 1, 0.01, 1000);
    const ambientLight = new THREE.AmbientLight(0xffffff, currentProps.ambientLightIntensity);
    const mainLight = new THREE.DirectionalLight(0xffffff, currentProps.directionalLightIntensity);
    const fillLight = new THREE.DirectionalLight(0xdbeafe, currentProps.fillLightIntensity);

    scene.add(ambientLight, mainLight, fillLight);

    const controls3d = new OrbitControls(camera, renderer.domElement);
    controls3d.enableDamping = true;
    controls3d.enablePan = false;
    controls3d.dampingFactor = 0.08;
    controls3d.rotateSpeed = 0.7;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownX = 0;
    let pointerDownY = 0;

    const stopAnimations = () => {
      currentMixer?.stopAllAction();
      currentMixer = null;
    };

    const clearModel = () => {
      stopAnimations();
      currentAnimations = [];
      if (currentModel) {
        scene.remove(currentModel);
        disposeObject3D(currentModel);
        currentModel = null;
      }
      syncHelpers(scene, currentModel, currentProps, helperState);
    };

    const syncAnimations = () => {
      stopAnimations();
      if (!currentModel || currentAnimations.length === 0 || !currentProps.playAnimations) {
        return;
      }

      currentMixer = new THREE.AnimationMixer(currentModel);
      currentMixer.timeScale = currentProps.animationSpeed;
      currentAnimations.forEach((clip) => {
        currentMixer?.clipAction(clip).reset().play();
      });
    };

    const updatePlaceholder = (state: 'empty' | 'loading' | 'error' | 'ready') => {
      if (state === 'ready') {
        placeholder.style.display = 'none';
        return;
      }

      placeholder.style.display = 'flex';
      placeholderUrl.textContent = currentUrl;
      placeholderUrl.style.display = currentUrl ? 'block' : 'none';

      if (state === 'empty') {
        placeholderTitle.textContent = messages().emptyTitle;
        placeholderDescription.textContent = messages().emptyDescription;
        return;
      }

      if (state === 'loading') {
        placeholderTitle.textContent = messages().loadingTitle;
        placeholderDescription.textContent = messages().loadingDescription;
        return;
      }

      placeholderTitle.textContent = messages().errorTitle;
      placeholderDescription.textContent = currentErrorMessage || messages().errorDescription;
    };

    const syncSceneSettings = () => {
      element.style.background = getCanvasBackgroundColor(currentProps);
      ambientLight.intensity = currentProps.ambientLightIntensity;
      mainLight.intensity = currentProps.directionalLightIntensity;
      fillLight.intensity = currentProps.fillLightIntensity;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = currentProps.exposure;
      controls3d.autoRotate = currentProps.autoRotate && currentMode !== 'edit';
      controls3d.autoRotateSpeed = currentProps.rotationSpeed;
      controls3d.enabled = currentProps.enableInteraction && currentMode !== 'edit';
      renderer.domElement.style.pointerEvents = currentMode === 'edit' ? 'none' : 'auto';

      if (currentModel) {
        applyObjectTransform(currentModel, currentProps);
        applyMaterialOptions(currentModel, currentProps);
        const activePreset = resolveActiveCameraPreset(currentProps);
        if (activePreset) {
          applyCameraPose(camera, controls3d, toCameraPose(currentProps, activePreset), mainLight, fillLight);
        } else {
          fitCameraToObject(camera, controls3d, currentModel, currentProps, mainLight, fillLight);
        }
      } else {
        const activePreset = resolveActiveCameraPreset(currentProps);
        const pose = activePreset
          ? toCameraPose(currentProps, activePreset)
          : createManualCameraPose(currentProps);
        applyCameraPose(camera, controls3d, pose, mainLight, fillLight);
      }

      if (currentMixer) {
        currentMixer.timeScale = currentProps.animationSpeed;
      }
      syncHelpers(scene, currentModel, currentProps, helperState);
    };

    const resizeRenderer = () => {
      const width = Math.max(element.clientWidth, 1);
      const height = Math.max(element.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const pickObjectAt = (clientX: number, clientY: number) => {
      if (!currentModel) {
        return null;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      return raycaster.intersectObject(currentModel, true)[0] ?? null;
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (currentMode === 'edit' || !currentModel) {
        return;
      }

      if (!isPointerClick(pointerDownX, pointerDownY, event.clientX, event.clientY)) {
        return;
      }

      const hit = pickObjectAt(event.clientX, event.clientY);
      if (!hit?.object) {
        return;
      }

      emitWidgetEvent(element, 'objectClick', createObjectClickPayload(hit.object, currentUrl));
    };

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const delta = clock.getDelta();
      currentMixer?.update(delta);
      controls3d.update();
      if (helperState.box) {
        helperState.box.update();
      }
      renderer.render(scene, camera);
    };

    const loadModel = (source: string) => {
      currentUrl = normalizeModelUrl(source);
      currentErrorMessage = '';

      if (!currentUrl) {
        loadRequestId += 1;
        clearModel();
        updatePlaceholder('empty');
        return;
      }

      const requestId = ++loadRequestId;
      const resourceBaseUrl = getResourceBaseUrl(currentUrl);
      const requestUrl = getRequestUrl(currentUrl, currentProps.requestMode);
      clearModel();
      updatePlaceholder('loading');
      activeResourceBaseUrl = resourceBaseUrl;

      fetch(requestUrl, { mode: 'cors', credentials: 'same-origin' })
        .then(async (response) => {
          if (!response.ok) {
            const details = await readErrorResponse(response);
            throw new Error(
              [`Request failed with ${response.status} ${response.statusText}`.trim(), details]
                .filter(Boolean)
                .join(': '),
            );
          }

          return response.arrayBuffer();
        })
        .then(
          (buffer) =>
            new Promise<void>((resolve, reject) => {
              loader.parse(
                buffer,
                resourceBaseUrl,
                (gltf) => {
                  if (destroyed || requestId !== loadRequestId) {
                    disposeObject3D(gltf.scene);
                    resolve();
                    return;
                  }

                  currentModel = gltf.scene;
                  currentAnimations = gltf.animations ?? [];
                  scene.add(currentModel);
                  applyMaterialOptions(currentModel, currentProps);
                  syncAnimations();
                  syncSceneSettings();
                  resizeRenderer();
                  updatePlaceholder('ready');
                  resolve();
                },
                (error: unknown) => {
                  reject(error);
                },
              );
            }),
        )
        .catch((error) => {
          if (destroyed || requestId !== loadRequestId) {
            return;
          }

          currentErrorMessage = formatLoadError(error);
          clearModel();
          updatePlaceholder('error');
        });
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    resizeRenderer();
    animate();
    updatePlaceholder('empty');
    loadModel(currentProps.modelUrl);

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => resizeRenderer());
      resizeObserver.observe(element);
    }

    return {
      update: (newProps: Props, newCtx: WidgetOverlayContext) => {
        const nextUrl = normalizeModelUrl(newProps.modelUrl);
        const urlChanged = nextUrl !== currentUrl;
        const requestModeChanged = newProps.requestMode !== currentProps.requestMode;
        const playAnimationsChanged = newProps.playAnimations !== currentProps.playAnimations;

        currentProps = newProps;
        currentMode = newCtx.mode ?? currentMode;
        currentLocale = newCtx.locale;

        if (urlChanged || requestModeChanged) {
          loadModel(currentProps.modelUrl);
          return;
        }

        if (playAnimationsChanged) {
          syncAnimations();
        }

        syncSceneSettings();
        resizeRenderer();

        if (!currentModel) {
          updatePlaceholder(currentUrl ? 'error' : 'empty');
        }
      },
      destroy: () => {
        destroyed = true;
        loadRequestId += 1;
        window.cancelAnimationFrame(frameId);
        resizeObserver?.disconnect();
        renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
        renderer.domElement.removeEventListener('pointerup', handlePointerUp);
        clearModel();
        if (helperState.axes) {
          scene.remove(helperState.axes);
          disposeHelper(helperState.axes);
        }
        if (helperState.grid) {
          scene.remove(helperState.grid);
          disposeHelper(helperState.grid);
        }
        if (helperState.box) {
          scene.remove(helperState.box);
          disposeHelper(helperState.box);
        }
        controls3d.dispose();
        renderer.dispose();
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
