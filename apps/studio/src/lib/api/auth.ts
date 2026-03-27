/**
 * Authentication API endpoints
 */

import { apiClient, ApiResponse } from './client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  authType?: string;
  loginSource?: string;
  tenantId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  tenantId?: string;
  role?: 'SUPER_ADMIN' | 'TENANT_ADMIN';
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: number;
  authType?: string;
  loginSource?: string;
}

/**
 * Login with email and password
 */
export async function login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
  return apiClient.post<AuthResponse>('/auth/login', credentials);
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<ApiResponse<User>> {
  return apiClient.post<User>('/auth/register', data);
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiClient.get<User>('/auth/me');
}

/**
 * Logout (invalidate token on server)
 */
export async function logout(): Promise<ApiResponse<void>> {
  return apiClient.post<void>('/auth/logout');
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<ApiResponse<{ token: string; expiresAt: number }>> {
  return apiClient.post<{ token: string; expiresAt: number }>('/auth/refresh');
}
