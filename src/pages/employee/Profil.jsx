import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './profil.css';

export default function Profil() {
  const { user, logout, darkMode, toggleDarkMode, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active Tab: 'profil' | 'sandi' | 'tampilan'
  const [activeTab, setActiveTab] = useState('profil');

  // Profile data & edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    nama: user?.nama || 'Aldho Lega Pratama',
    email: user?.email || 'aldolega34@gmail.com',
    noHp: user?.no_hp || '+62 828-0218-30123',
    divisi: 'Operasional Armada • Hub Bandara Soetta',
    avatar:
      user?.foto_profil ||
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD8PYGuT9bahWBtxUDooDPVdk-FvnX_N3dCFd_iUtKW_nS4-DlBjRMJPPJy31fll4qMXMyZc53zfyamkRne7cRXvbkL0rZRVd6lnCu_PJhvnDb123WXK3p4h5ofIu9v1ICv818LKJKM-8K9qQ3b0OA0F-ADfjQEZ-6FTbqIZO6J1a4XXQkezRFXk2ZcrC-Cpo6UkHd7eHyqRpSBG39fc-GQBgSWX9TR5uJOqJcysusF7j390rUAW_gL',
  });

  // Password tab state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passFeedback, setPassFeedback] = useState(null);
  const [isPassLoading, setIsPassLoading] = useState(false);

  // Settings switches
  const [settings, setSettings] = useState({
    reminderShift: true,
    biometric: true,
    bahasa: 'id',
  });

  // Avatar upload handler
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImg = event.target?.result;
        setProfileData((prev) => ({ ...prev, avatar: newImg }));
        if (updateUser) {
          updateUser({ foto_profil: newImg });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile updates
  const handleSaveProfile = () => {
    setIsEditing(false);
    if (updateUser) {
      updateUser({ nama: profileData.nama, no_hp: profileData.noHp });
    }
    alert('Profil berhasil diperbarui!');
  };

  // Password change handler
  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (!oldPass || !newPass || !confirmPass) {
      setPassFeedback({ type: 'error', text: 'Semua kolom kata sandi wajib diisi.' });
      return;
    }
    if (newPass.length < 6) {
      setPassFeedback({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassFeedback({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setIsPassLoading(true);
    setTimeout(() => {
      setIsPassLoading(false);
      setPassFeedback({ type: 'success', text: 'Kata sandi Anda berhasil diubah.' });
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setPassFeedback(null), 3000);
    }, 1000);
  };

  // Logout handler
  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari aplikasi Angkasa Absen?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="pf-page">
      <div className="pf-content">

        {/* ── 1. Profile Hero Bento Card ── */}
        <section className="pf-hero-card">
          <div className="pf-hero-orb-1"></div>
          <div className="pf-hero-orb-2"></div>

          <div className="pf-hero-inner">
            <div className="pf-hero-top">
              <div className="pf-hero-avatar-wrap">
                <div className="pf-hero-avatar-circle">
                  <img
                    className="pf-hero-avatar-img"
                    src={profileData.avatar}
                    alt={profileData.nama}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuD8PYGuT9bahWBtxUDooDPVdk-FvnX_N3dCFd_iUtKW_nS4-DlBjRMJPPJy31fll4qMXMyZc53zfyamkRne7cRXvbkL0rZRVd6lnCu_PJhvnDb123WXK3p4h5ofIu9v1ICv818LKJKM-8K9qQ3b0OA0F-ADfjQEZ-6FTbqIZO6J1a4XXQkezRFXk2ZcrC-Cpo6UkHd7eHyqRpSBG39fc-GQBgSWX9TR5uJOqJcysusF7j390rUAW_gL';
                    }}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Ganti Foto Profil"
                  className="pf-hero-cam-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined">photo_camera</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="pf-hero-info">
                <div className="pf-hero-name-row">
                  <h1 className="pf-hero-name">{profileData.nama}</h1>
                  <span className="pf-hero-id-badge">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    ID: #{user?.id || '9'}
                  </span>
                </div>
                <p className="pf-hero-sub">
                  <span className="material-symbols-outlined">badge</span>
                  <span>Karyawan Operasional &bull; PT Angkasa Ekspres</span>
                </p>
                <p className="pf-hero-email">{profileData.email}</p>
              </div>
            </div>

            {/* 3 Quick Metrics */}
            <div className="pf-hero-metrics">
              <div className="pf-hero-metric-box">
                <span className="pf-hero-metric-val">98.4%</span>
                <span className="pf-hero-metric-lbl">Kehadiran</span>
              </div>
              <div className="pf-hero-metric-box">
                <span className="pf-hero-metric-val">142</span>
                <span className="pf-hero-metric-lbl">Hari Kerja</span>
              </div>
              <div className="pf-hero-metric-box">
                <span className="pf-hero-metric-val">8 Hari</span>
                <span className="pf-hero-metric-lbl">Sisa Cuti</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Segmented Navigation Tabs ── */}
        <section className="pf-tab-bar">
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`pf-tab-btn ${activeTab === 'profil' ? 'active' : 'inactive'}`}
          >
            <span className="material-symbols-outlined">person</span>
            <span>Profil Saya</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sandi')}
            className={`pf-tab-btn ${activeTab === 'sandi' ? 'active' : 'inactive'}`}
          >
            <span className="material-symbols-outlined">lock</span>
            <span>Kata Sandi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tampilan')}
            className={`pf-tab-btn ${activeTab === 'tampilan' ? 'active' : 'inactive'}`}
          >
            <span className="material-symbols-outlined">tune</span>
            <span>Tampilan</span>
          </button>
        </section>

        {/* ── 3. Tab: Profil Saya Content ── */}
        {activeTab === 'profil' && (
          <>
            <section className="pf-card">
              <div className="pf-card-header">
                <div>
                  <h2 className="pf-card-title">Informasi Pribadi</h2>
                  <p className="pf-card-sub">Data kontak &amp; penugasan akun aktif Anda</p>
                </div>
                <button
                  type="button"
                  className="pf-edit-btn"
                  onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                >
                  <span className="material-symbols-outlined">{isEditing ? 'check' : 'edit'}</span>
                  <span>{isEditing ? 'Simpan' : 'Edit'}</span>
                </button>
              </div>

              <div className="pf-fields-col">
                {/* Nama Lengkap */}
                <div className="pf-field">
                  <div className="pf-field-icon">
                    <span className="material-symbols-outlined">badge</span>
                  </div>
                  <div className="pf-field-body">
                    <span className="pf-field-lbl">Nama Lengkap</span>
                    {isEditing ? (
                      <input
                        type="text"
                        className="pf-field-input"
                        value={profileData.nama}
                        onChange={(e) => setProfileData({ ...profileData, nama: e.target.value })}
                      />
                    ) : (
                      <span className="pf-field-val">{profileData.nama}</span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="pf-field">
                  <div className="pf-field-icon">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div className="pf-field-body">
                    <span className="pf-field-lbl">Alamat Email</span>
                    <span className="pf-field-val">{profileData.email}</span>
                  </div>
                  <span className="pf-verified-badge">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <span>Terverifikasi</span>
                  </span>
                </div>

                {/* Nomor Telepon */}
                <div className="pf-field">
                  <div className="pf-field-icon">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div className="pf-field-body">
                    <span className="pf-field-lbl">Nomor WhatsApp / Telepon</span>
                    {isEditing ? (
                      <input
                        type="text"
                        className="pf-field-input"
                        value={profileData.noHp}
                        onChange={(e) => setProfileData({ ...profileData, noHp: e.target.value })}
                      />
                    ) : (
                      <span className="pf-field-val">{profileData.noHp}</span>
                    )}
                  </div>
                </div>

                {/* Divisi & Hub */}
                <div className="pf-field">
                  <div className="pf-field-icon rose">
                    <span className="material-symbols-outlined">local_shipping</span>
                  </div>
                  <div className="pf-field-body">
                    <span className="pf-field-lbl">Divisi &amp; Hub Operasional</span>
                    <span className="pf-field-val">{profileData.divisi}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* GPS Radius Visual Card */}
            <section className="pf-map-sec">
              <div className="pf-map-header">
                <div className="pf-map-title-row">
                  <span className="material-symbols-outlined">location_on</span>
                  <h3 className="pf-map-title">Zona Radius Presensi Aktif</h3>
                </div>
                <span className="pf-map-radius">Radius 50m</span>
              </div>

              <div
                className="pf-map-box"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA4TEU2B0f6aVqM3poz5xNmj-otnDxP-HLlZUV853gh6zJIq1Z6PIAETrHQYp6fGyPdiym4KhFAGQWOAoA3_05tKzZQAbQc4mqXUjeoffxqWnfl_99InCo-z_OczvZMp07SV2n7ZDADEDNUTvpNHQj_r1ag-T1TP17QDrgxFxxOLu8SaXyz1alPQBSy_5QRvM7hTWx02HDoRpk2LehVZvUGMbJKn1J5jJt3ft5LVqcS1Jw29XxARvLC')",
                  backgroundColor: '#1e293b',
                }}
              >
                <div className="pf-map-overlay"></div>
                <div className="pf-map-content">
                  <div className="pf-map-loc-row">
                    <span className="material-symbols-outlined">share_location</span>
                    <span className="pf-map-loc-text">Terminal Kargo 1B &bull; Terhubung GPS</span>
                  </div>
                  <span className="pf-map-badge">Tepat Lokasi</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── 4. Tab: Kata Sandi Content ── */}
        {activeTab === 'sandi' && (
          <form className="pf-card" onSubmit={handleUpdatePassword}>
            <div className="pf-card-header">
              <div>
                <h2 className="pf-card-title">Ubah Kata Sandi</h2>
                <p className="pf-card-sub">Perbarui kata sandi akun Angkasa Absen Anda</p>
              </div>
            </div>

            {passFeedback && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: passFeedback.type === 'success' ? '#ecfdf5' : '#fff1f2',
                  color: passFeedback.type === 'success' ? '#047857' : '#b80035',
                  border: `1px solid ${passFeedback.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {passFeedback.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{passFeedback.text}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#545f73' }}>Kata Sandi Lama</label>
                <input
                  type="password"
                  className="pf-pass-input"
                  placeholder="Masukkan kata sandi saat ini"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#545f73' }}>Kata Sandi Baru</label>
                <input
                  type="password"
                  className="pf-pass-input"
                  placeholder="Minimal 6 karakter kombinasi"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#545f73' }}>Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  className="pf-pass-input"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={isPassLoading} className="pf-pass-btn">
              {isPassLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">autorenew</span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">lock_reset</span>
                  <span>Perbarui Kata Sandi</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── 5. Tab: Tampilan Content ── */}
        {activeTab === 'tampilan' && (
          <section className="pf-card">
            <div className="pf-card-header">
              <div>
                <h2 className="pf-card-title">Tampilan &amp; Preferensi</h2>
                <p className="pf-card-sub">Kustomisasi sistem dan notifikasi</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Dark Mode */}
              <div className="pf-switch-row">
                <div className="pf-switch-left">
                  <div className="pf-field-icon">
                    <span className="material-symbols-outlined">dark_mode</span>
                  </div>
                  <div>
                    <span className="pf-setting-title">Mode Gelap (Dark)</span>
                    <span className="pf-setting-sub">Sesuaikan kontras tampilan</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`pf-toggle ${darkMode ? 'on' : 'off'}`}
                  onClick={toggleDarkMode}
                >
                  <div className="pf-toggle-knob"></div>
                </button>
              </div>

              {/* Shift Reminder */}
              <div className="pf-switch-row">
                <div className="pf-switch-left">
                  <div className="pf-field-icon">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div>
                    <span className="pf-setting-title">Pengingat Shift</span>
                    <span className="pf-setting-sub">07:45 WIB &bull; 15 menit sebelum masuk</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`pf-toggle ${settings.reminderShift ? 'on' : 'off'}`}
                  onClick={() => setSettings((p) => ({ ...p, reminderShift: !p.reminderShift }))}
                >
                  <div className="pf-toggle-knob"></div>
                </button>
              </div>

              {/* Biometrics */}
              <div className="pf-switch-row">
                <div className="pf-switch-left">
                  <div className="pf-field-icon">
                    <span className="material-symbols-outlined">fingerprint</span>
                  </div>
                  <div>
                    <span className="pf-setting-title">Biometrik &amp; FaceID</span>
                    <span className="pf-setting-sub">Verifikasi kamera presensi aktif</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`pf-toggle ${settings.biometric ? 'on' : 'off'}`}
                  onClick={() => setSettings((p) => ({ ...p, biometric: !p.biometric }))}
                >
                  <div className="pf-toggle-knob"></div>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── 6. Keamanan & Akun Section ── */}
        <section className="pf-card">
          <h2 className="pf-card-title">Keamanan &amp; Akun</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="pf-setting-item"
              onClick={() => setActiveTab('sandi')}
            >
              <div className="pf-setting-left">
                <div className="pf-setting-icon">
                  <span className="material-symbols-outlined">lock_reset</span>
                </div>
                <div>
                  <span className="pf-setting-title">Ubah Kata Sandi</span>
                  <span className="pf-setting-sub">Terakhir diperbarui 2 bulan lalu</span>
                </div>
              </div>
              <span className="material-symbols-outlined pf-setting-chevron">chevron_right</span>
            </button>

            <button
              type="button"
              className="pf-setting-item"
              onClick={() => setActiveTab('tampilan')}
            >
              <div className="pf-setting-left">
                <div className="pf-setting-icon">
                  <span className="material-symbols-outlined">fingerprint</span>
                </div>
                <div>
                  <span className="pf-setting-title">Presensi Biometrik &amp; Wajah</span>
                  <span className="pf-setting-sub">Terkoneksi FaceID &bull; Sensor Aktif</span>
                </div>
              </div>
              <span className="material-symbols-outlined pf-setting-chevron">chevron_right</span>
            </button>

            <button
              type="button"
              className="pf-setting-item"
              onClick={() => setActiveTab('tampilan')}
            >
              <div className="pf-setting-left">
                <div className="pf-setting-icon">
                  <span className="material-symbols-outlined">notifications_active</span>
                </div>
                <div>
                  <span className="pf-setting-title">Pengingat Jam Shift Kerja</span>
                  <span className="pf-setting-sub">07:45 WIB &bull; 15 menit sebelum masuk</span>
                </div>
              </div>
              <span className="material-symbols-outlined pf-setting-chevron">chevron_right</span>
            </button>
          </div>

          <div style={{ paddingTop: '8px' }}>
            <button
              id="btn-logout"
              type="button"
              className="pf-logout-btn"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </section>

        {/* ── 7. Subtle App Version Footer ── */}
        <div className="pf-version-sec">
          <span className="pf-version-title">Angkasa Absen Mobile &bull; v2.4.1 (Build 890)</span>
          <span className="pf-version-copy">&copy; 2025 PT Angkasa Ekspres Logistik Indonesia</span>
        </div>

      </div>
    </div>
  );
}
