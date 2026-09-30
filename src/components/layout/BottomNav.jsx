import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './bottomnav.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Beranda',  icon: 'home',                 path: '/employee/dashboard' },
  { id: 'riwayat',   label: 'Riwayat',  icon: 'history',              path: '/employee/riwayat'   },
  { id: 'izin',      label: 'Izin',     icon: 'assignment_turned_in', path: '/employee/izin'      },
  { id: 'profil',    label: 'Profil',   icon: 'account_circle',        path: '/employee/profil'    },
];

export default function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const currentPath = location.pathname.toLowerCase();
  
  const activeTab = (() => {
    if (currentPath.includes('riwayat')) return 'riwayat';
    if (currentPath.includes('izin')) return 'izin';
    if (currentPath.includes('profil')) return 'profil';
    return 'dashboard';
  })();

  return (
    <div className="bnav-dock">
      <nav className="bnav-pill">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              data-path={item.id}
              onClick={() => navigate(item.path)}
              className={`bnav-item ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined bnav-icon">
                {item.icon}
              </span>
              <span className="bnav-label">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
