import { useEffect, useMemo, useState } from 'react';
import { preloadComponentTypes } from '@/lib/registry/componentLoader';
import { ensureRegistryLoaded } from '@/lib/registry/registry-store';

export type EditorStartupPhase = 'auth' | 'project' | 'registry' | 'widgets' | 'paint' | 'ready';

export interface EditorStartupState {
  phase: EditorStartupPhase;
  progress: number;
  statusKey: string;
}

export interface UseEditorStartupOptions {
  authResolved: boolean;
  isBootstrapping: boolean;
  projectLoaded: boolean;
  widgetTypes: string[];
}

export interface UseEditorStartupResult {
  startup: EditorStartupState;
  isReady: boolean;
}

const PHASE_CONFIG: Record<
  Exclude<EditorStartupPhase, 'ready'>,
  Omit<EditorStartupState, 'phase'>
> = {
  auth: {
    progress: 18,
    statusKey: 'loadingScreen.starting',
  },
  project: {
    progress: 52,
    statusKey: 'loadingScreen.initEngine',
  },
  registry: {
    progress: 74,
    statusKey: 'loadingScreen.loadingComponents',
  },
  widgets: {
    progress: 88,
    statusKey: 'loadingScreen.loadingComponents',
  },
  paint: {
    progress: 96,
    statusKey: 'loadingScreen.ready',
  },
};

export function useEditorStartup({
  authResolved,
  isBootstrapping,
  projectLoaded,
  widgetTypes,
}: UseEditorStartupOptions): UseEditorStartupResult {
  const [isRegistryReady, setIsRegistryReady] = useState(false);
  const [hasPainted, setHasPainted] = useState(false);

  useEffect(() => {
    if (!authResolved || isBootstrapping || !projectLoaded) {
      setIsRegistryReady(false);
      setHasPainted(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await ensureRegistryLoaded();
      } catch (error) {
        console.error('[useEditorStartup] Failed to load registry:', error);
      } finally {
        if (!cancelled) {
          setIsRegistryReady(true);
        }
      }

      void preloadComponentTypes(widgetTypes).catch((error) => {
        console.error('[useEditorStartup] Failed to preload widgets:', error);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [authResolved, isBootstrapping, projectLoaded, widgetTypes]);

  useEffect(() => {
    if (!authResolved || isBootstrapping || !projectLoaded || !isRegistryReady) {
      setHasPainted(false);
      return;
    }

    let frameId = 0;
    frameId = window.requestAnimationFrame(() => {
      setHasPainted(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [authResolved, isBootstrapping, isRegistryReady, projectLoaded]);

  const startup = useMemo<EditorStartupState>(() => {
    if (!authResolved) {
      return { phase: 'auth', ...PHASE_CONFIG.auth };
    }

    if (isBootstrapping || !projectLoaded) {
      return { phase: 'project', ...PHASE_CONFIG.project };
    }

    if (!isRegistryReady) {
      return { phase: 'registry', ...PHASE_CONFIG.registry };
    }

    if (!hasPainted) {
      return { phase: 'paint', ...PHASE_CONFIG.paint };
    }

    return {
      phase: 'ready',
      progress: 100,
      statusKey: 'loadingScreen.completed',
    };
  }, [authResolved, hasPainted, isBootstrapping, isRegistryReady, projectLoaded]);

  return {
    startup,
    isReady: startup.phase === 'ready',
  };
}
