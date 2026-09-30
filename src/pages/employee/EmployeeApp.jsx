import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BottomNav from '../../components/layout/BottomNav';
import LoadingFallback from '../../components/common/LoadingFallback';
import './employee-app.css';

// Lazy loading employee pages
const Dashboard = lazy(() => import('./Dashboard'));
const Riwayat = lazy(() => import('./Riwayat'));
const Izin = lazy(() => import('./Izin'));
const Profil = lazy(() => import('./Profil'));

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Presensi Masuk Terverifikasi',
    desc: 'Absensi masuk biometric wajah berhasil dicatat pada 07:55:12 WIB.',
    time: '15 menit lalu',
    unread: true,
    icon: 'verified',
    color: '#059669',
    bg: '#d1fae5',
  },
  {
    id: 2,
    title: 'Pengajuan Cuti Disetujui',
    desc: 'Pengajuan cuti operasional Anda telah disetujui oleh Supervisor.',
    time: '2 jam lalu',
    unread: true,
    icon: 'event_available',
    color: '#2563eb',
    bg: '#dbeafe',
  },
  {
    id: 3,
    title: 'Pengingat Jam Checkout',
    desc: 'Batas toleransi jam pulang standar adalah 17:00:00 WIB. Jangan lupa presensi.',
    time: 'Hari Ini',
    unread: false,
    icon: 'alarm',
    color: '#e11d48',
    bg: '#ffe4e6',
  },
];

export default function EmployeeApp() {
  const { user, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotifModal, setShowNotifModal] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const clearAllNotifs = () => {
    setNotifications([]);
  };

  const userInitial = (user?.namaLengkap || user?.nama || 'A')[0].toUpperCase();

  return (
    <div className={`emp-shell ${darkMode ? 'dark' : ''}`}>
      {/* ── Fixed Top Header Bar ── */}
      <header className="emp-header">
        <div className="emp-header-inner">
          {/* Logo Brand */}
          <button
            type="button"
            className="emp-logo-wrap"
            onClick={() => navigate('/employee/dashboard')}
            title="Ke Beranda"
          >
            <img
              src="/LOGO.png"
              alt="PT Angkasa Ekspres"
              className="emp-logo-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </button>

          {/* Right Action Icons */}
          <div className="emp-actions-row">
            <button
              type="button"
              aria-label="Toggle Dark Mode"
              onClick={toggleDarkMode}
              className="emp-action-btn"
              title={darkMode ? 'Mode Terang' : 'Mode Gelap'}
            >
              <span className="material-symbols-outlined">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button
              type="button"
              aria-label="Notifikasi"
              onClick={() => setShowNotifModal(true)}
              className="emp-action-btn"
              title="Pusat Notifikasi"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                notifications
              </span>
              {unreadCount > 0 && <span className="emp-notif-dot">{unreadCount}</span>}
            </button>

            <button
              type="button"
              aria-label="Profil Akun"
              onClick={() => navigate('/employee/profil')}
              className="emp-profile-btn"
              title={user?.namaLengkap || user?.nama || 'Profil'}
            >
              {userInitial}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Viewport Container with Lazy Loading & Suspense ── */}
      <main className="emp-viewport">
        <Suspense fallback={<LoadingFallback title="Memuat Halaman Karyawan..." subtitle="Menyiapkan data profil & presensi" />}>
          <div className="page-view-enter">
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="riwayat" element={<Riwayat />} />
              <Route path="izin" element={<Izin />} />
              <Route path="profil" element={<Profil />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </div>
        </Suspense>
      </main>

      {/* ── Interactive Notification Center Modal ── */}
      {showNotifModal && (
        <div className="emp-modal-overlay" onClick={() => setShowNotifModal(false)}>
          <div className="emp-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <div className="emp-modal-title-box">
                <span className="material-symbols-outlined text-[20px]" style={{ color: '#e11d48' }}>
                  notifications_active
                </span>
                <h3 className="emp-modal-title">Pusat Notifikasi</h3>
              </div>
              <button
                type="button"
                className="emp-modal-close-btn"
                onClick={() => setShowNotifModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="emp-modal-body">
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#545f73', fontSize: '13px' }}>
                  <span className="material-symbols-outlined text-[32px] text-gray-400 mb-1">
                    notifications_off
                  </span>
                  <p>Tidak ada notifikasi saat ini.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="emp-notif-item"
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
                      );
                    }}
                  >
                    <div
                      className="emp-notif-icon-box"
                      style={{ background: notif.bg, color: notif.color }}
                    >
                      <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                    </div>
                    <div className="emp-notif-text-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span className="emp-notif-item-title">{notif.title}</span>
                        {notif.unread && (
                          <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#e11d48' }}></span>
                        )}
                      </div>
                      <span className="emp-notif-item-desc">{notif.desc}</span>
                      <span className="emp-notif-item-time">{notif.time}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="emp-modal-footer">
              <button
                type="button"
                className="emp-modal-action-btn"
                style={{ color: '#545f73' }}
                onClick={clearAllNotifs}
              >
                Hapus Semua
              </button>
              <button
                type="button"
                className="emp-modal-action-btn"
                style={{ color: '#e11d48' }}
                onClick={markAllRead}
              >
                Tandai Sudah Dibaca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Floating Bottom Navigation Dock ── */}
      <BottomNav />
    </div>
  );
}
