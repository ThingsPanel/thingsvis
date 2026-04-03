import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { RuntimeContextProvider } from './runtime/RuntimeContextProvider';
import { ProjectProvider } from './contexts/ProjectContext';
import { LoginPage, RegisterPage, DataSourcesPage, PreviewPage, EmbedPage } from './pages';
import ImageUploadSettingsPage from './pages/ImageUploadSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import EditorShell from './components/EditorShell';
import './index.css';

/**
 * Root Application Component
 *
 * Uses HashRouter for compatibility with static hosting and iframe embedding.
 * Routes:
 *   /           - Home page (project list)
 *   /login      - Login page
 *   /register   - Registration page
 *   /editor     - Dashboard editor (protected)
 *   /editor/:id - Edit specific dashboard (protected)
 *   /data-sources - Data sources management (protected)
 *   /settings/image-upload - Image upload settings (protected)
 *   /preview    - Dashboard preview
 *   /preview/:id - Preview specific dashboard
 *   /embed      - Embeddable preview page for iframe
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Embed routes stay outside editor providers to avoid cloud/editor bootstrap. */}
          <Route path="/embed" element={<EmbedPage />} />
          <Route path="/embed/:dashboardId" element={<EmbedPage />} />

          <Route
            element={
              <AuthProvider>
                <RuntimeContextProvider>
                  <ProjectProvider>
                    <Outlet />
                  </ProjectProvider>
                </RuntimeContextProvider>
              </AuthProvider>
            }
          >
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Home page - shows project list */}
            <Route path="/" element={<Navigate to="/editor" replace />} />

            {/* Protected Routes – require authentication */}
            <Route
              path="/editor"
              element={
                <ProtectedRoute>
                  <EditorShell />
                </ProtectedRoute>
              }
            />
            <Route
              path="/editor/:dashboardId"
              element={
                <ProtectedRoute>
                  <EditorShell />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-sources"
              element={
                <ProtectedRoute>
                  <DataSourcesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/image-upload"
              element={
                <ProtectedRoute>
                  <ImageUploadSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Preview Routes – public for sharing */}
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/preview/:dashboardId" element={<PreviewPage />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
