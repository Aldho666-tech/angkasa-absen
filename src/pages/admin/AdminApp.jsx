import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingFallback from '../../components/common/LoadingFallback';
import './admin-app.css';

// Lazy loading admin pages
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const AdminKaryawan = lazy(() => import('./AdminKaryawan'));
const AdminRekap = lazy(() => import('./AdminRekap'));
const AdminPengaturan = lazy(() => import('./AdminPengaturan'));

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Monitoring', icon: 'dashboard', path: '/admin/dashboard' },
  { id: 'karyawan', label: 'Karyawan', icon: 'group', path: '/admin/karyawan' },
  { id: 'rekap', label: 'Rekap', icon: 'assignment', path: '/admin/rekap' },
  { id: 'pengaturan', label: 'Geofence', icon: 'location_on', path: '/admin/pengaturan' },
];

export default function AdminApp() {
  const { user, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const activeTab = location.pathname.split('/')[2] || 'dashboard';

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const userInitial = (user?.namaLengkap || user?.nama || 'A')[0].toUpperCase();

  return (
    <div className={`adm-shell ${darkMode ? 'dark' : ''}`}>
      {/* ── Top Header (Exact Match to References) ── */}
      <header className="adm-header">
        <div className="adm-header-left">
          <button
            type="button"
            className="adm-header-logo-btn"
            onClick={() => navigate('/admin/dashboard')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Ke Dashboard Monitoring"
          >
            <img
              src="/LOGO.png"
              alt="PT Angkasa"
              className="adm-header-logo"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </button>
        </div>

        <div className="adm-header-right">
          <button
            type="button"
            aria-label="Toggle Dark Mode"
            className="adm-header-btn"
            onClick={toggleDarkMode}
            title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button
            type="button"
            aria-label="Logout Admin"
            className="adm-header-btn adm-header-btn-logout"
            onClick={() => setShowLogoutConfirm(true)}
            title="Keluar / Logout"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>

          <button
            type="button"
            className="adm-header-avatar"
            onClick={() => setShowProfileModal(true)}
            title="Profil Administrator"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            {userInitial}
          </button>
        </div>
      </header>

      {/* ── Main Viewport Content with Lazy Loading ── */}
      <main className="adm-main">
        <div className="adm-container">
          <Suspense fallback={<LoadingFallback title="Memuat Portal Admin..." subtitle="Sinkronisasi Sentinel GPS & Database" />}>
            <div className="page-view-enter">
              <Routes>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="karyawan" element={<AdminKaryawan />} />
                <Route path="rekap" element={<AdminRekap />} />
                <Route path="pengaturan" element={<AdminPengaturan />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </div>
          </Suspense>
        </div>
      </main>

      {/* ── Floating Bottom Navigation Dock ── */}
      <div className="adm-bottomnav-wrap">
        <nav className="adm-bottomnav-bar">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`adm-bottomnav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span className="material-symbols-outlined adm-bottomnav-icon">
                  {item.icon}
                </span>
                <span className="adm-bottomnav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Admin Profile Quick Modal ── */}
      {showProfileModal && (
        <div className="adm-modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#b80035' }}>
                  admin_panel_settings
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Profil Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '9999px',
                  background: '#eff4ff',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                &times;
              </button>
            </div>

            <div className="adm-modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, #e11d48 0%, #b80035 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 800,
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                  }}
                >
                  {userInitial}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>
                    {user?.namaLengkap || user?.nama || 'Super Admin'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#545f73' }}>
                    {user?.email || 'admin@angkasa.co.id'}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: '#ffdada',
                      color: '#b80035',
                      fontSize: '11px',
                      fontWeight: 700,
                      marginTop: '4px',
                      width: 'fit-content',
                    }}
                  >
                    Super Administrator
                  </span>
                </div>
              </div>

              <div
                style={{
                  background: '#eff4ff',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#545f73' }}>Hub Operasional:</span>
                  <span style={{ fontWeight: 700 }}>Hub CGK-01 (Tangerang)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#545f73' }}>Status Sentinel:</span>
                  <span style={{ fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#059669' }}></span>
                    Online &amp; Active
                  </span>
                </div>
              </div>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate('/admin/pengaturan');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '9999px',
                  border: '1px solid #ffdada',
                  background: '#eff4ff',
                  color: '#b80035',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Pengaturan Geofence
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setShowLogoutConfirm(true);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="adm-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="adm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#e11d48' }}>
                  logout
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Konfirmasi Keluar</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '9999px',
                  background: '#eff4ff',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                &times;
              </button>
            </div>

            <div className="adm-modal-body">
              <p style={{ margin: 0, fontSize: '13px', color: '#545f73', lineHeight: 1.5 }}>
                Apakah Anda yakin ingin keluar dari sesi Administrator? Anda harus masuk kembali untuk mengelola presensi staf.
              </p>
            </div>

            <div className="adm-modal-footer">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'transparent',
                  color: '#545f73',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.28)',
                  cursor: 'pointer',
                }}
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
