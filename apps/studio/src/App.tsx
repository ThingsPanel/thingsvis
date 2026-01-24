import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { ProjectProvider } from './contexts/ProjectContext';
import { LoginPage, RegisterPage, HomePage, DataSourcesPage, PreviewPage, EmbedPage } from './pages';
import ImageUploadSettingsPage from './pages/ImageUploadSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Editor from './components/Editor';
import './index.css';

/**
 * Root Application Component
 * 
 * Uses HashRouter for compatibility with static hosting and iframe embedding.
 * Routes:
 *   /           - Home page (project list)
 *   /login      - Login page
 *   /register   - Registration page
 *   /editor     - Dashboard editor
 *   /editor/:id - Edit specific dashboard
 *   /data-sources - Data sources management
 *   /settings/image-upload - Image upload settings
 *   /preview    - Dashboard preview
 *   /preview/:id - Preview specific dashboard
 *   /embed      - Embeddable preview page for iframe
 */
export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Home page - shows project list */}
            <Route path="/" element={<HomePage />} />
            
            {/* Editor Routes */}
            <Route path="/editor" element={<Editor />} />
            <Route path="/editor/:dashboardId" element={<Editor />} />
            
            {/* Data Sources */}
            <Route path="/data-sources" element={<DataSourcesPage />} />
            
            {/* Settings */}
            <Route path="/settings/image-upload" element={<ImageUploadSettingsPage />} />
            
            {/* Preview Routes */}
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/preview/:dashboardId" element={<PreviewPage />} />
            
            {/* Embed Route - for iframe embedding */}
            <Route path="/embed" element={<EmbedPage />} />
            <Route path="/embed/:dashboardId" element={<EmbedPage />} />
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}

