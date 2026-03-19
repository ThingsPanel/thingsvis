/**
 * Authentication Context
 *
 * Splits standalone browser sessions from embed sessions so host tokens
 * cannot leak into the standalone editor.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useLocation } from 'react-router-dom';
import { apiClient } from '../api/client';
import {
  login as apiLogin,
  register as apiRegister,
  getCurrentUser,
  type User,
  type LoginCredentials,
  type RegisterData,
} from '../api/auth';
import { initDataSourceSync } from '../datasource-sync';
import { getConfiguredEmbedToken } from '@/embed/message-router';

export const BROWSER_TOKEN_KEY = 'thingsvis_browser_token';
export const BROWSER_TOKEN_EXPIRY_KEY = 'thingsvis_browser_token_expiry';
export const BROWSER_USER_KEY = 'thingsvis_browser_user';
const GUEST_MODE_KEY = 'thingsvis_guest_mode';

/** @deprecated Use `StorageMode` from `@/runtime/RuntimeContext` instead. */
export type StorageMode = 'local' | 'cloud' | 'embed';
/** @deprecated Use `RuntimeChannel` from `@/runtime/RuntimeContext` instead. */
export type AuthChannel = 'none' | 'browser' | 'embed' | 'guest';

export interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  storageMode: StorageMode;
  authChannel: AuthChannel;
  isGuestMode: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsGuest: () => void;
  setEmbedToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function isIframeEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function isEmbedRoute(pathname: string): boolean {
  if (pathname === '/embed') return true;

  try {
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex < 0) return false;

    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    return params.get('mode') === 'embedded';
  } catch {
    return false;
  }
}

function getEmbedTokenFromLocation(): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const searchToken = searchParams.get('token');
  if (searchToken) return searchToken;

  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex >= 0) {
    const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
    const hashToken = hashParams.get('token');
    if (hashToken) return hashToken;
  }

  return getConfiguredEmbedToken();
}

function clearBrowserSessionStorage() {
  localStorage.removeItem(BROWSER_TOKEN_KEY);
  localStorage.removeItem(BROWSER_TOKEN_EXPIRY_KEY);
  localStorage.removeItem(BROWSER_USER_KEY);
}

function persistBrowserSession(token: string, user: User, expiresAt: number) {
  localStorage.setItem(BROWSER_TOKEN_KEY, token);
  localStorage.setItem(BROWSER_TOKEN_EXPIRY_KEY, expiresAt.toString());
  localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(user));
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const location = useLocation();
  const embedContext = isIframeEmbedded() || isEmbedRoute(location.pathname);

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authChannel, setAuthChannel] = useState<AuthChannel>('none');
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem(GUEST_MODE_KEY) === 'true';
  });

  const tokenRef = useRef<string | null>(null);
  const authChannelRef = useRef<AuthChannel>('none');

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    authChannelRef.current = authChannel;
  }, [authChannel]);

  const clearBrowserAuth = useCallback(() => {
    clearBrowserSessionStorage();
    localStorage.removeItem(GUEST_MODE_KEY);
    setToken(null);
    setUser(null);
    setIsGuestMode(false);
    setAuthChannel('none');
  }, []);

  const clearEmbedAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthChannel('none');
  }, []);

  useEffect(() => {
    apiClient.configure({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        if (authChannelRef.current === 'embed') {
          clearEmbedAuth();
          return;
        }

        if (authChannelRef.current === 'browser') {
          clearBrowserAuth();
        }
      },
    });
  }, [clearBrowserAuth, clearEmbedAuth]);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      setIsLoading(true);

      try {
        if (embedContext) {
          const embedToken = getEmbedTokenFromLocation();

          if (!embedToken) {
            if (!cancelled) {
              setToken(null);
              setUser(null);
              setAuthChannel('none');
              setIsLoading(false);
            }
            return;
          }

          try {
            apiClient.configure({ getToken: () => embedToken });
            const result = await getCurrentUser();

            if (!cancelled && result.data) {
              setToken(embedToken);
              setUser(result.data);
              setAuthChannel('embed');
            } else if (!cancelled) {
              setToken(null);
              setUser(null);
              setAuthChannel('none');
            }
          } catch (error) {
            if (!cancelled) {
              console.warn('[Auth] Embed auth error, continuing without auth:', error);
              setToken(null);
              setUser(null);
              setAuthChannel('none');
            }
          } finally {
            if (!cancelled) {
              setIsLoading(false);
            }
          }

          return;
        }

        const storedToken = localStorage.getItem(BROWSER_TOKEN_KEY);
        const storedExpiry = localStorage.getItem(BROWSER_TOKEN_EXPIRY_KEY);
        const storedUser = localStorage.getItem(BROWSER_USER_KEY);

        if (!storedToken || !storedExpiry) {
          if (!cancelled) {
            setToken(null);
            setUser(null);
            setAuthChannel(isGuestMode ? 'guest' : 'none');
            setIsLoading(false);
          }
          return;
        }

        const expiry = Number.parseInt(storedExpiry, 10);
        if (!Number.isFinite(expiry) || Date.now() >= expiry) {
          clearBrowserSessionStorage();
          if (!cancelled) {
            setToken(null);
            setUser(null);
            setAuthChannel(isGuestMode ? 'guest' : 'none');
            setIsLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setToken(storedToken);
          setAuthChannel('browser');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser) as User);
            } catch {
              setUser(null);
            }
          }
        }

        apiClient.configure({ getToken: () => storedToken });
        const result = await getCurrentUser();

        if (!result.data) {
          clearBrowserSessionStorage();
          if (!cancelled) {
            setToken(null);
            setUser(null);
            setAuthChannel(isGuestMode ? 'guest' : 'none');
          }
        } else if (!cancelled) {
          setUser(result.data);
          setAuthChannel('browser');
          localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(result.data));
        }
      } catch (error) {
        if (!cancelled) {
          clearBrowserAuth();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      cancelled = true;
    };
  }, [clearBrowserAuth, embedContext, isGuestMode]);

  const loginWithToken = useCallback(
    async (jwtToken: string): Promise<{ success: boolean; error?: string }> => {
      try {
        apiClient.configure({ getToken: () => jwtToken });
        const result = await getCurrentUser();

        if (!result.data) {
          return { success: false, error: 'Invalid token' };
        }

        setToken(jwtToken);
        setUser(result.data);

        if (embedContext) {
          setAuthChannel('embed');
        } else {
          const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
          persistBrowserSession(jwtToken, result.data, expiresAt);
          setAuthChannel('browser');
        }

        return { success: true };
      } catch (error) {
        console.error('[Auth] Token login failed:', error);
        return { success: false, error: 'Token validation failed' };
      }
    },
    [embedContext],
  );

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await apiLogin(credentials);
        if (result.error) {
          return { success: false, error: result.error };
        }

        const authData: any = result.data || result;
        const newToken: string = authData.token;
        const newUser: User = authData.user;
        const expiresAt: number = authData.expiresAt;

        if (!newToken || !newUser || !expiresAt) {
          return { success: false, error: 'Invalid response format' };
        }

        setToken(newToken);
        setUser(newUser);
        setAuthChannel('browser');
        setIsGuestMode(false);
        localStorage.removeItem(GUEST_MODE_KEY);
        persistBrowserSession(newToken, newUser, expiresAt);

        return { success: true };
      } catch {
        return { success: false, error: 'Network error' };
      }
    },
    [],
  );

  const register = useCallback(
    async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await apiRegister(data);

        if (result.error) {
          return { success: false, error: result.error };
        }

        if (result.data) {
          return { success: true };
        }

        return { success: false, error: 'Invalid response' };
      } catch {
        return { success: false, error: 'Network error' };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    if (authChannelRef.current === 'embed') {
      clearEmbedAuth();
    } else {
      clearBrowserAuth();
    }
    initDataSourceSync(false);
  }, [clearBrowserAuth, clearEmbedAuth]);

  const setEmbedToken = useCallback(
    (embedToken: string | null) => {
      if (!embedContext) return;
      setToken(embedToken);
      setAuthChannel(embedToken ? 'embed' : 'none');
      if (!embedToken) {
        setUser(null);
      }
    },
    [embedContext],
  );

  const loginAsGuest = useCallback(() => {
    if (embedContext) return;
    setIsGuestMode(true);
    setToken(null);
    setUser(null);
    setAuthChannel('guest');
    localStorage.setItem(GUEST_MODE_KEY, 'true');
  }, [embedContext]);

  const storageMode: StorageMode = useMemo(() => {
    if (embedContext || authChannel === 'embed') return 'embed';
    if (authChannel === 'browser' && token && user) return 'cloud';
    return 'local';
  }, [authChannel, embedContext, token, user]);

  const value: AuthContextValue = useMemo(
    () => ({
      isAuthenticated: !!token && !!user,
      isLoading,
      user,
      token,
      storageMode,
      authChannel,
      isGuestMode,
      login,
      loginWithToken,
      register,
      logout,
      loginAsGuest,
      setEmbedToken,
    }),
    [
      token,
      user,
      isLoading,
      storageMode,
      authChannel,
      isGuestMode,
      login,
      loginWithToken,
      register,
      logout,
      loginAsGuest,
      setEmbedToken,
    ],
  );

  useEffect(() => {
    if (!isLoading) {
      initDataSourceSync(!!token && !!user);
    }
  }, [token, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
