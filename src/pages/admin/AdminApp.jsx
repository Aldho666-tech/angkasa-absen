import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import AdminDashboard from './AdminDashboard';
import AdminKaryawan from './AdminKaryawan';
import AdminRekap from './AdminRekap';
import AdminPengaturan from './AdminPengaturan';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-pie', path: '/admin/dashboard' },
  { id: 'karyawan', label: 'Karyawan', icon: 'fa-solid fa-users', path: '/admin/karyawan' },
  { id: 'rekap', label: 'Rekap', icon: 'fa-solid fa-file-excel', path: '/admin/rekap' },
  { id: 'pengaturan', label: 'Pengaturan', icon: 'fa-solid fa-gear', path: '/admin/pengaturan' },
];

export default function AdminApp() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <i className="fa-solid fa-plane"></i>
          </div>
          <div>
            <div className="sidebar-logo-title">Angkasa Absen</div>
            <div className="sidebar-logo-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {(user?.nama || 'A')[0].toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.nama || 'Admin'}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="sidebar-action-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
              <i className={darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
            </button>
            <button className="sidebar-action-btn danger" onClick={handleLogout} title="Logout">
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="admin-mobile-header">
        <div className="admin-mobile-logo">
          <i className="fa-solid fa-plane"></i>
          <span>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="mobile-icon-btn" onClick={toggleDarkMode}>
            <i className={darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
          </button>
          <button className="mobile-icon-btn danger" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="karyawan" element={<AdminKaryawan />} />
          <Route path="rekap" element={<AdminRekap />} />
          <Route path="pengaturan" element={<AdminPengaturan />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="admin-mobile-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`admin-mobile-nav-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .admin-shell {
          display: flex;
          min-height: 100dvh;
          background: var(--bg-page);
        }
        .admin-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          z-index: 100;
          overflow: hidden;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .sidebar-logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          flex-shrink: 0;
        }
        .sidebar-logo-title { font-size: 15px; font-weight: 800; color: var(--text-primary); }
        .sidebar-logo-sub { font-size: 11px; color: var(--brand); font-weight: 600; }
        .sidebar-nav {
          flex: 1;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }
        .sidebar-nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          text-align: left;
          width: 100%;
        }
        .sidebar-nav-btn i { width: 18px; text-align: center; }
        .sidebar-nav-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .sidebar-nav-btn.active { background: rgba(230,0,0,0.1); color: var(--brand); font-weight: 700; }
        .sidebar-footer {
          padding: 12px 10px;
          border-top: 1px solid var(--border-color);
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 6px;
          margin-bottom: 8px;
        }
        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .sidebar-user-name { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .sidebar-user-role { font-size: 11px; color: var(--text-muted); }
        .sidebar-actions { display: flex; gap: 6px; }
        .sidebar-action-btn {
          flex: 1;
          padding: 8px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-page);
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .sidebar-action-btn:hover { color: var(--text-primary); border-color: var(--text-muted); }
        .sidebar-action-btn.danger:hover { color: var(--brand); border-color: var(--brand); }

        .admin-main {
          flex: 1;
          margin-left: 240px;
          min-height: 100dvh;
          overflow-y: auto;
        }

        .admin-mobile-header, .admin-mobile-nav { display: none; }

        @media (max-width: 768px) {
          .admin-sidebar { display: none; }
          .admin-main { margin-left: 0; padding-bottom: 72px; margin-top: 56px; }
          .admin-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            height: 56px;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border-color);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
          }
          .admin-mobile-logo {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 15px;
            font-weight: 800;
            color: var(--text-primary);
          }
          .admin-mobile-logo i { color: var(--brand); }
          .mobile-icon-btn {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: var(--bg-page);
            color: var(--text-secondary);
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .mobile-icon-btn.danger { color: var(--brand); border-color: rgba(230,0,0,0.2); }
          .admin-mobile-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--bg-card);
            border-top: 1px solid var(--border-color);
            padding-bottom: env(safe-area-inset-bottom, 0);
            z-index: 100;
          }
          .admin-mobile-nav-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 10px 4px;
            border: none;
            background: transparent;
            color: var(--text-muted);
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            font-family: inherit;
            transition: color 0.2s;
          }
          .admin-mobile-nav-btn i { font-size: 18px; }
          .admin-mobile-nav-btn.active { color: var(--brand); }
        }
      `}</style>
    </div>
  );
}
