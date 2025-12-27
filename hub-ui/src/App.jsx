import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProvidersPage from './pages/ProvidersPage';
import DevicesPage from './pages/DevicesPage';
import StreamViewerPage from './pages/StreamViewerPage';
import UsersPage from './pages/UsersPage';
import FilesPage from './pages/FilesPage';
import SettingsPage from './pages/SettingsPage';
import WorkspacesPage from './pages/WorkspacesPage';
import SecretKeysPage from './pages/SecretKeysPage';
import ClientCredentialsPage from './pages/ClientCredentialsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function Shell() {
  const { user, setToken, setUser } = useAuth();
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <div className="shell">
      <Sidebar />
      <div className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Fortinet Mobile Farm</p>
            <strong>Modern control</strong>
          </div>
          {user && (
            <div className="user-chip">
              <span className="pill pill-dark">{user.role}</span>
              <span>{user.username}</span>
              <button className="text" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </header>
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/providers"
              element={
                <ProtectedRoute>
                  <ProvidersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <DevicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices/:udid/stream"
              element={
                <ProtectedRoute>
                  <StreamViewerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <FilesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspaces"
              element={
                <ProtectedRoute>
                  <WorkspacesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/secret-keys"
              element={
                <ProtectedRoute>
                  <SecretKeysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client-credentials"
              element={
                <ProtectedRoute>
                  <ClientCredentialsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
