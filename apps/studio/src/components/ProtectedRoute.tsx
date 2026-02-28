/**
 * Protected Route Component
 * 
 * Wraps routes that require authentication.
 * Redirects to login if user is not authenticated.
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

// 最小显示时间（毫秒），确保用户能看到加载动画
const MIN_LOADING_TIME = 2000;

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, storageMode, isGuestMode } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    // 如果认证检查已完成，计算是否达到最小显示时间
    if (!isLoading) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

      // 如果还没达到最小时间，继续显示加载
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setShowLoading(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowLoading(false);
      }
    }
  }, [isLoading, startTime]);

  // Show loading state while checking authentication
  if (isLoading || showLoading) {
    return <LoadingScreen />;
  }

  // 1. 对于嵌入模式 (Embed / Widget)，无需拦截
  // 2. 对于体验模式 (Guest Mode)，无需拦截
  const shouldSkipAuth = storageMode === 'embed' || isGuestMode;

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated && !shouldSkipAuth) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
