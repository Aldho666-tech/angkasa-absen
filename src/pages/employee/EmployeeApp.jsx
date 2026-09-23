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
          <div className="emp-mobile-logo-icon">
            <i className="fa-solid fa-plane"></i>
          </div>
          <span>Angkasa Absen</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="emp-mobile-icon-btn" onClick={toggleDarkMode}>
            <i className={darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
          </button>
          <button className="emp-mobile-icon-btn danger" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
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
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }
        .emp-mobile-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--brand), var(--brand-dark));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 14px;
        }
        .emp-mobile-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1px solid var(--border-color);
          background: var(--bg-page);
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .emp-mobile-icon-btn.danger { color: var(--brand); border-color: rgba(230,0,0,0.2); }
        @media (max-width: 768px) {
          .emp-mobile-header { display: flex; }
          .app-main { padding-top: 54px !important; }
        }
      `}</style>
    </div>
  );
}
