/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles token storage, login/logout, and automatic token refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client';
import { login as apiLogin, register as apiRegister, getCurrentUser, type User, type LoginCredentials, type RegisterData } from '../api/auth';
import { initDataSourceSync } from '../datasource-sync';

// Storage keys
const TOKEN_KEY = 'thingsvis_token';
const TOKEN_EXPIRY_KEY = 'thingsvis_token_expiry';
const USER_KEY = 'thingsvis_user';
const GUEST_MODE_KEY = 'thingsvis_guest_mode';

// Storage mode types
export type StorageMode = 'local' | 'cloud' | 'embed';

export interface AuthContextValue {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  storageMode: StorageMode;
  isGuestMode: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithToken: (token: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loginAsGuest: () => void;

  // For embed mode
  setEmbedToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Check if running in iframe (embed mode)
function isEmbedded(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true; // Cross-origin iframe
  }
}

// Get URL parameters for embed mode (check both search and hash)
function getEmbedToken(): string | null {
  // 1. 首先检查 search params (?token=xxx)
  const searchParams = new URLSearchParams(window.location.search);
  const searchToken = searchParams.get('token');
  if (searchToken) return searchToken;

  // 2. 然后检查 hash params (#/editor?token=xxx)
  const hash = window.location.hash || '';
  const queryIndex = hash.indexOf('?');
  if (queryIndex >= 0) {
    const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
    const hashToken = hashParams.get('token');
    if (hashToken) {

      return hashToken;
    }
  }

  // 3. 最后检查 message-router 中设置的 token
  try {
    const { getEmbedToken: getInitToken } = require('../../embed/message-router');
    const initToken = getInitToken();
    if (initToken) {

      return initToken;
    }
  } catch (e) {
    // ignore
  }

  return null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem(GUEST_MODE_KEY) === 'true';
  });

  // Determine storage mode
  const storageMode: StorageMode = useMemo(() => {
    if (isEmbedded()) return 'embed';
    if (token && user) return 'cloud';
    return 'local';
  }, [token, user]);

  // Clear authentication state
  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsGuestMode(false);

    // In embed mode, NEVER wipe out localStorage, as it might destroy the user's standalone session
    if (!isEmbedded()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(GUEST_MODE_KEY);
    }
  }, []);

  // Configure API client when token changes
  useEffect(() => {
    // 在嵌入模式下，优先使用 embed token
    const embedToken = getEmbedToken();
    const localToken = localStorage.getItem(TOKEN_KEY);



    apiClient.configure({
      getToken: () => {
        // 优先使用 embed token（嵌入模式）
        const embed = getEmbedToken();
        if (embed) return embed;

        // 否则使用 localStorage 中的 token
        return localStorage.getItem(TOKEN_KEY);
      },
      onUnauthorized: () => {
        // Token expired or invalid
        // 在嵌入模式下不清除认证，因为 token 是外部传入的
        if (!isEmbedded()) {
          clearAuth();
        }
      },
    });
  }, [clearAuth]);

  // Initialize from localStorage or URL token (SSO)
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      try {
        // Check for SSO token in URL first (both embed and standalone)
        const urlToken = getEmbedToken();

        if (urlToken) {


          // Store token and validate
          apiClient.configure({ getToken: () => urlToken });
          const result = await getCurrentUser();

          if (result.data) {


            // Calculate expiry (assume 2 hours for SSO tokens)
            const expiresAt = Date.now() + (2 * 60 * 60 * 1000);

            // Store in localStorage ONLY for standalone persistent session
            if (!isEmbedded()) {
              localStorage.setItem(TOKEN_KEY, urlToken);
              localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
              localStorage.setItem(USER_KEY, JSON.stringify(result.data));
            }

            setToken(urlToken);
            setUser(result.data);

            // Redirect to editor after SSO login IF it's not already on editor/embed
            const currentHash = window.location.hash;
            if (!currentHash.includes('/editor') && !currentHash.includes('/embed') && !currentHash.includes('/preview')) {
              setTimeout(() => {
                window.location.hash = '#/editor';
              }, 100);
            }
          } else {
            console.error('❌ [Auth] SSO token invalid');
          }

          setIsLoading(false);
          return;
        }

        // For embedded mode without token, just set loading to false
        if (isEmbedded()) {
          setIsLoading(false);
          return;
        }

        // Check localStorage for existing session
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
        const storedUser = localStorage.getItem(USER_KEY);



        if (storedToken && storedExpiry) {
          const expiry = parseInt(storedExpiry, 10);

          // Check if token is expired
          if (Date.now() < expiry) {

            setToken(storedToken);

            if (storedUser) {
              try {
                setUser(JSON.parse(storedUser));
              } catch {
                // Invalid stored user, will be refreshed
              }
            }

            // Validate token by fetching current user
            // Note: apiClient already configured to use localStorage
            const result = await getCurrentUser();


            if (result.data) {
              setUser(result.data);
              localStorage.setItem(USER_KEY, JSON.stringify(result.data));
            } else {
              // Token is invalid

              clearAuth();
            }
          } else {
            // Token expired

            clearAuth();
          }
        } else {

        }
      } catch (error) {

        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [clearAuth]);

  // Login with JWT token (for SSO)
  const loginWithToken = useCallback(async (jwtToken: string): Promise<{ success: boolean; error?: string }> => {
    try {


      // Validate token by fetching user
      apiClient.configure({ getToken: () => jwtToken });
      const result = await getCurrentUser();

      if (!result.data) {
        return { success: false, error: 'Invalid token' };
      }

      const newUser: User = result.data;
      const expiresAt = Date.now() + (2 * 60 * 60 * 1000); // 2 hours



      setToken(jwtToken);
      setUser(newUser);

      // Persist to localStorage ONLY for standalone session
      if (!isEmbedded()) {
        localStorage.setItem(TOKEN_KEY, jwtToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      }

      return { success: true };
    } catch (error) {
      console.error('❌ [Auth] Token login failed:', error);
      return { success: false, error: 'Token validation failed' };
    }
  }, []);

  // Login handler
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {

      const result = await apiLogin(credentials);



      if (result.error) {
        return { success: false, error: result.error };
      }

      // Handle both response formats:
      // 1. Backend returns: { token, user, expiresAt }
      // 2. API wrapper returns: { data: { token, user, expiresAt } }
      const authData: any = result.data || result;
      const newToken: string = authData.token;
      const newUser: User = authData.user;
      const expiresAt: number = authData.expiresAt;



      if (!newToken || !newUser || !expiresAt) {

        return { success: false, error: 'Invalid response format' };
      }


      setToken(newToken);
      setUser(newUser);

      // Persist to localStorage ONLY for standalone session
      if (!isEmbedded()) {
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      }





      // Important: Don't trigger re-initialization after login
      // The state update will handle authentication status

      return { success: true };
    } catch (error) {

      return { success: false, error: 'Network error' };
    }
  }, []);

  // Register handler
  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await apiRegister(data);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        // Registration successful, but user needs to login
        return { success: true };
      }

      return { success: false, error: 'Invalid response' };
    } catch (error) {

      return { success: false, error: 'Network error' };
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {

    clearAuth();
    initDataSourceSync(false);
  }, [clearAuth]);

  // Set token for embed mode
  const setEmbedToken = useCallback((embedToken: string) => {
    setToken(embedToken);
  }, []);

  // Login as guest
  const loginAsGuest = useCallback(() => {
    setIsGuestMode(true);
    if (!isEmbedded()) {
      localStorage.setItem(GUEST_MODE_KEY, 'true');
    }
  }, []);

  const value: AuthContextValue = useMemo(() => ({
    isAuthenticated: !!token && !!user,
    isLoading,
    user,
    token,
    storageMode,
    isGuestMode,
    login,
    loginWithToken,
    register,
    logout,
    loginAsGuest,
    setEmbedToken,
  }), [token, user, isLoading, storageMode, isGuestMode, login, loginWithToken, register, logout, loginAsGuest, setEmbedToken]);

  // Initialize data source sync when authentication state changes
  useEffect(() => {
    if (!isLoading) {
      initDataSourceSync(!!token && !!user);
    }
  }, [token, user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
