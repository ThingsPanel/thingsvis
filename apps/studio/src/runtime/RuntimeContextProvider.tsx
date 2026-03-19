/**
 * RuntimeContextProvider
 *
 * Derives the canonical RuntimeContext from environment signals and exposes
 * it to the React tree.  Must be rendered *inside* AuthProvider (it reads
 * `isAuthenticated` from useAuth).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { getConfiguredEmbedToken } from '@/embed/message-router';
import { deriveRuntimeContext } from './deriveRuntimeContext';
import type { RuntimeContext } from './RuntimeContext';

const RuntimeCtx = createContext<RuntimeContext | null>(null);

export function useRuntimeContext(): RuntimeContext {
  const ctx = useContext(RuntimeCtx);
  if (!ctx) {
    throw new Error('useRuntimeContext must be used within RuntimeContextProvider');
  }
  return ctx;
}

export function RuntimeContextProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const runtimeContext = useMemo(() => {
    // Collect URL params from hash-router query string or search params
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    const urlParams =
      queryIndex >= 0
        ? new URLSearchParams(hash.slice(queryIndex + 1))
        : new URLSearchParams(window.location.search);

    // Embed token from URL params or message-router config
    const urlToken = urlParams.get('token');
    const embedToken = urlToken || getConfiguredEmbedToken() || undefined;

    let isInIframe = false;
    try {
      isInIframe = window.self !== window.top;
    } catch {
      isInIframe = true;
    }

    return deriveRuntimeContext({ isInIframe, urlParams, isAuthenticated, embedToken });
  }, [isAuthenticated]);

  return <RuntimeCtx.Provider value={runtimeContext}>{children}</RuntimeCtx.Provider>;
}
