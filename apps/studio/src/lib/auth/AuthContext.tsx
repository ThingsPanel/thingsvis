/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Handles token storage, login/logout, and automatic token refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client';
import { login as apiLogin, register as apiRegister, getCurrentUser, type User, type LoginCredentials, type RegisterData } from '../api/auth';

// Storage keys
const TOKEN_KEY = 'thingsvis_token';
const TOKEN_EXPIRY_KEY = 'thingsvis_token_expiry';
const USER_KEY = 'thingsvis_user';

// Storage mode types
export type StorageMode = 'local' | 'cloud' | 'embed';

export interface AuthContextValue {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  storageMode: StorageMode;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
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

// Get URL parameters for embed mode
function getEmbedToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Configure API client when token changes
  useEffect(() => {
    // Always use localStorage as the source of truth
    // This ensures token is available even during initialization
    const currentToken = localStorage.getItem(TOKEN_KEY);
    
    
    apiClient.configure({
      getToken: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        
        return token;
      },
      onUnauthorized: () => {
        // Token expired or invalid
        
        clearAuth();
      },
    });
  }, [clearAuth]);

  // Initialize from localStorage or embed token
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check for embed token first
        if (isEmbedded()) {
          const embedToken = getEmbedToken();
          
          if (embedToken) {
            setToken(embedToken);
            // Optionally validate the token by fetching user
            apiClient.configure({ getToken: () => embedToken });
            const result = await getCurrentUser();
            if (result.data) {
              setUser(result.data);
            }
          }
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
      
      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      
      
      
      
      
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
  }, [clearAuth]);

  // Set token for embed mode
  const setEmbedToken = useCallback((embedToken: string) => {
    setToken(embedToken);
  }, []);

  const value: AuthContextValue = useMemo(() => ({
    isAuthenticated: !!token && !!user,
    isLoading,
    user,
    token,
    storageMode,
    login,
    register,
    logout,
    setEmbedToken,
  }), [token, user, isLoading, storageMode, login, register, logout, setEmbedToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
