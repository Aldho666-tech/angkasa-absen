import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const EmployeeApp = lazy(() => import('./pages/employee/EmployeeApp'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp'));

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      gap: '16px',
      background: 'var(--bg-page)'
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        color: '#fff',
        boxShadow: '0 8px 24px rgba(230, 0, 0, 0.35)',
        animation: 'pulse 1.4s ease-in-out infinite'
      }}>
        <i className="fa-solid fa-plane"></i>
      </div>
      <div style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Memuat...</div>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.92); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/employee" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/admin' : '/employee'} replace />
            : <Login />
        }
      />
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute>
            <EmployeeApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requireAdmin>
            <AdminApp />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated
            ? <Navigate to={isAdmin ? '/admin' : '/employee'} replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
