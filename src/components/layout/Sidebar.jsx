import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({
  menuItems = [],
  activeTab,
  onSelectTab,
  isOpen = false,
  onClose
}) {
  const { user, logout } = useAuth();
  const avatarSrc = user?.foto_profil || '/Admin-Avatar.png';

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar-shell ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-logo-badge">
            <img src="/css/asset/LOGO.png" alt="Angkasa Logo" className="brand-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="brand-text-block">
              <span className="brand-company-title">Angkasa Absen</span>
              <span className="brand-portal-sub">SISTEM PRESENSI RESMI</span>
            </div>
          </div>
        </div>

        {/* User Mini Card */}
        <div className="sidebar-user-card">
          <div className="user-avatar-wrap">
            <img src={avatarSrc} alt={user?.namaLengkap || 'User'} className="sidebar-avatar" />
            <span className="avatar-status-online"></span>
          </div>
          <div className="user-text-info">
            <span className="user-name-title">{user?.namaLengkap || 'Pengguna'}</span>
            <span className="user-role-badge">{user?.email || 'karyawan@angkasa.co.id'}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu-list">
            {menuItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onClose) onClose();
                    }}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                    {item.badge && <span className="nav-item-badge">{item.badge}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Bottom Button */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={logout}>
            <i className="fas fa-arrow-right-from-bracket"></i>
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      <style>{`
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          z-index: 95;
          animation: fadeIn 0.2s ease;
        }

        .sidebar-shell {
          width: var(--sidebar-w);
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color var(--transition);
        }

        .sidebar-brand-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .brand-logo-badge {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-logo-img {
          height: 38px;
          width: auto;
          object-fit: contain;
        }
        .brand-text-block {
          display: flex;
          flex-direction: column;
        }
        .brand-company-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--brand);
          letter-spacing: -0.3px;
        }
        .brand-portal-sub {
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.6px;
          color: var(--text-muted);
        }

        .sidebar-user-card {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--border-subtle);
          margin: 14px 14px 8px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        body.dark-mode .sidebar-user-card {
          background: rgba(255, 255, 255, 0.04);
        }
        .user-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .sidebar-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--brand);
        }
        .avatar-status-online {
          width: 10px;
          height: 10px;
          background: #10b981;
          border: 2px solid var(--bg-card);
          border-radius: 50%;
          position: absolute;
          bottom: 0;
          right: 0;
        }
        .user-text-info {
          overflow: hidden;
        }
        .user-name-title {
          display: block;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .user-role-badge {
          display: block;
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-nav {
          flex: 1;
          padding: 10px 14px;
          overflow-y: auto;
        }
        .sidebar-menu-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13.5px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all var(--transition);
          text-align: left;
        }
        .sidebar-nav-item i {
          width: 20px;
          font-size: 16px;
          text-align: center;
          flex-shrink: 0;
        }
        .sidebar-nav-item:hover {
          background: var(--brand-50);
          color: var(--brand);
        }
        body.dark-mode .sidebar-nav-item:hover {
          background: rgba(230, 0, 0, 0.12);
        }
        .sidebar-nav-item.active {
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px var(--brand-glow);
        }
        .nav-item-badge {
          margin-left: auto;
          background: var(--brand-100);
          color: var(--brand-dark);
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: var(--radius-pill);
        }

        .sidebar-footer {
          padding: 14px;
          border-top: 1px solid var(--border-color);
        }
        .sidebar-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1.5px solid var(--border-color);
          background: transparent;
          color: var(--brand);
          font-size: 13px;
          font-weight: 700;
          font-family: inherit;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition);
        }
        .sidebar-logout-btn:hover {
          background: var(--brand-50);
          border-color: var(--brand);
        }
        body.dark-mode .sidebar-logout-btn:hover {
          background: rgba(230, 0, 0, 0.15);
        }

        @media (max-width: 1024px) {
          .sidebar-shell {
            transform: translateX(-100%);
          }
          .sidebar-shell.mobile-open {
            transform: translateX(0);
            box-shadow: 8px 0 30px rgba(0, 0, 0, 0.25);
          }
        }
      `}</style>
    </>
  );
}
