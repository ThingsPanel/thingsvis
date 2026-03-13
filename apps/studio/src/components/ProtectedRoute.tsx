/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Redirects to login if user is not authenticated.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/auth';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { t } = useTranslation('common');
  const { isAuthenticated, isLoading, storageMode, isGuestMode } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen progress={16} statusText={t('loadingScreen.starting')} />;
  }

  const shouldSkipAuth = storageMode === 'embed' || isGuestMode;

  if (requireAuth && !isAuthenticated && !shouldSkipAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
