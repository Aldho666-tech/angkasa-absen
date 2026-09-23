import React, { useState, useEffect, useRef } from 'react';

export default function Navbar({ user, darkMode, onToggleDark, onLogout, navItems = [], activeTab, onSelectTab }) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour12: false }));
      setCurrentDate(now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <header className="nav-bar">
        {/* Left: Logo */}
        <div className="nav-left">
          <div className="nav-logo-wrap">
            <div className="nav-logo-icon">
              <i className="fa-solid fa-plane"></i>
            </div>
            <div className="nav-logo-text">
              <span className="nav-logo-title">Angkasa Absen</span>
            </div>
          </div>

          {/* Desktop nav items */}
          {navItems.length > 0 && (
            <nav className="nav-desktop-links">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`nav-desktop-link ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => onSelectTab(item.id)}
                >
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Right: Clock + Actions */}
        <div className="nav-right">
          <div className="nav-clock-chip">
            <span className="nav-pulse-dot"></span>
            <span className="nav-clock-time">{currentTime}</span>
            <span className="nav-clock-sep">|</span>
            <span className="nav-clock-date">{currentDate}</span>
          </div>

          <button className="nav-icon-btn" onClick={onToggleDark} title="Toggle Dark Mode">
            <i className={darkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
          </button>

          {/* Avatar dropdown */}
          <div className="nav-avatar-wrap" ref={menuRef}>
            <button
              className="nav-avatar-btn"
              onClick={() => setShowMenu(prev => !prev)}
            >
              <div className="nav-avatar">
                {user?.foto_profil
                  ? <img src={`/api/foto/${user.foto_profil}`} alt="Avatar" />
                  : <span>{(user?.nama || 'U')[0].toUpperCase()}</span>
                }
              </div>
              <div className="nav-user-text">
                <div className="nav-user-name">{user?.nama || 'User'}</div>
                <div className="nav-user-role">{user?.jabatan || 'Karyawan'}</div>
              </div>
              <i className="fa-solid fa-chevron-down nav-chevron"></i>
            </button>

            {showMenu && (
              <div className="nav-dropdown">
                <div className="nav-dropdown-header">
                  <div className="nd-name">{user?.nama}</div>
                  <div className="nd-role">{user?.jabatan || 'Karyawan'}</div>
                </div>
                <button className="nav-dropdown-item" onClick={() => { onSelectTab('profil'); setShowMenu(false); }}>
                  <i className="fa-solid fa-user"></i> Profil Saya
                </button>
                <button className="nav-dropdown-item danger" onClick={onLogout}>
                  <i className="fa-solid fa-right-from-bracket"></i> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <style>{`
        .nav-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--topbar-h);
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }
        .nav-left { display: flex; align-items: center; gap: 24px; }
        .nav-logo-wrap { display: flex; align-items: center; gap: 10px; }
        .nav-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
          flex-shrink: 0;
        }
        .nav-logo-title { font-size: 15px; font-weight: 800; color: var(--text-primary); }
        .nav-desktop-links { display: flex; align-items: center; gap: 4px; }
        .nav-desktop-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .nav-desktop-link:hover { background: var(--bg-hover); color: var(--text-primary); }
        .nav-desktop-link.active { background: rgba(230,0,0,0.08); color: var(--brand); font-weight: 700; }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .nav-clock-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-hover);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 13px;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .nav-pulse-dot {
          width: 7px;
          height: 7px;
          background: #10b981;
          border-radius: 50%;
          animation: navPulse 2s infinite;
          flex-shrink: 0;
        }
        @keyframes navPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .nav-clock-time { font-weight: 700; color: var(--text-primary); }
        .nav-clock-sep { color: var(--border-color); }
        .nav-clock-date { color: var(--text-muted); }
        .nav-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .nav-icon-btn:hover { color: var(--text-primary); border-color: var(--text-muted); }
        .nav-avatar-wrap { position: relative; }
        .nav-avatar-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border-color);
          border-radius: 22px;
          padding: 4px 12px 4px 4px;
          background: var(--bg-card);
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-avatar-btn:hover { border-color: var(--text-muted); background: var(--bg-hover); }
        .nav-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand), var(--brand-dark));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          overflow: hidden;
          flex-shrink: 0;
        }
        .nav-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .nav-user-text { display: flex; flex-direction: column; }
        .nav-user-name { font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.1; }
        .nav-user-role { font-size: 11px; color: var(--text-muted); }
        .nav-chevron { font-size: 10px; color: var(--text-muted); }
        .nav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 200px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          z-index: 200;
          animation: fadeIn 0.15s ease;
        }
        .nav-dropdown-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-hover);
        }
        .nd-name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .nd-role { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          font-size: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .nav-dropdown-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .nav-dropdown-item.danger { color: var(--brand); }
        .nav-dropdown-item.danger:hover { background: rgba(230,0,0,0.06); }

        /* Hide desktop nav on mobile */
        @media (max-width: 768px) {
          .nav-bar { display: none; }
        }
      `}</style>
    </>
  );
}
