import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('userData');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  const [role, setRole] = useState(() => {
    return sessionStorage.getItem('userRole') || null;
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res.success && res.userData) {
      setUser(res.userData);
      setRole(res.role);
      sessionStorage.setItem('userData', JSON.stringify(res.userData));
      sessionStorage.setItem('userRole', res.role);
      return res;
    }
    throw new Error(res.message || 'Login gagal');
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('userRole');
  };

  const updateLocalUser = (updatedData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedData };
      sessionStorage.setItem('userData', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        darkMode,
        toggleDarkMode,
        login,
        logout,
        updateLocalUser,
        isAuthenticated: !!user,
        isAdmin: role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
