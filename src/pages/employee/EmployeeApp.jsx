import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/layout/BottomNav';
import Navbar from '../../components/layout/Navbar';
import Dashboard from './Dashboard';
import Riwayat from './Riwayat';
import Izin from './Izin';
import Profil from './Profil';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Beranda', icon: 'fa-solid fa-house', path: '/employee/dashboard' },
  { id: 'riwayat', label: 'Riwayat', icon: 'fa-solid fa-clock-rotate-left', path: '/employee/riwayat' },
  { id: 'izin', label: 'Izin', icon: 'fa-solid fa-file-circle-check', path: '/employee/izin' },
  { id: 'profil', label: 'Profil', icon: 'fa-solid fa-user', path: '/employee/profil' },
];

export default function EmployeeApp() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  const handleTabSelect = (tabId) => {
    navigate(`/employee/${tabId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Desktop Top Navbar */}
      <Navbar
        user={user}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
        onLogout={handleLogout}
        navItems={NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
      />

      {/* Mobile Top Header */}
      <header className="emp-mobile-header">
        <div className="emp-mobile-logo">
          <img src="/LOGO.png" alt="Logo" className="emp-logo-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="emp-logo-text-group">
            <span className="emp-logo-title">Angkasa</span>
            <span className="emp-logo-badge">Absen</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="emp-mobile-icon-btn" onClick={toggleDarkMode} title="Ganti Tema">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button className="emp-mobile-icon-btn danger" onClick={handleLogout} title="Keluar">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              logout
            </span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="riwayat" element={<Riwayat />} />
          <Route path="izin" element={<Izin />} />
          <Route path="profil" element={<Profil />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav
        items={NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={handleTabSelect}
      />

      <style>{`
        .emp-mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 54px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }
        .emp-mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .emp-logo-img {
          height: 32px;
          width: auto;
          object-fit: contain;
        }
        .emp-logo-text-group {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }
        .emp-logo-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }
        .emp-logo-badge {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #e11d48;
          margin-top: 1px;
        }
        .emp-mobile-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--border-color);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .emp-mobile-icon-btn:hover {
          background: var(--bg-hover);
        }
        .emp-mobile-icon-btn.danger { color: #e11d48; border-color: rgba(225, 29, 72, 0.2); }
        @media (max-width: 768px) {
          .emp-mobile-header { display: flex; }
          .app-main { padding-top: 54px !important; }
        }
      `}</style>
    </div>
  );
}
