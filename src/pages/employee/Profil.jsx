import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Profil() {
  const { user, logout, updateLocalUser, darkMode, toggleDarkMode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    namaLengkap: user?.namaLengkap || user?.nama || '',
    telepon: user?.telepon || '',
    email: user?.email || '',
  });
  const [avatar, setAvatar] = useState(user?.foto_profil || null);
  const [pwForm, setPwForm] = useState({ newPw: '', confirm: '' });
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [msg, setMsg] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const fileRef = useRef(null);

  // Load fresh profile on mount
  useEffect(() => {
    if (!user?.id) return;
    api.getProfile(user.id)
      .then(data => {
        if (data) {
          setForm({
            namaLengkap: data.namaLengkap || '',
            telepon: data.telepon || '',
            email: data.email || ''
          });
          if (data.foto_profil) setAvatar(data.foto_profil);
        }
      })
      .catch(err => console.error('Fetch profile err:', err));
  }, [user?.id]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 DataURL
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      setAvatar(base64);
      try {
        const res = await api.updateProfile(user.id, {
          namaLengkap: form.namaLengkap,
          email: form.email,
          telepon: form.telepon,
          foto_profil: base64
        });
        updateLocalUser({ foto_profil: base64 });
        setStatus('success');
        setMsg('Foto profil berhasil diperbarui!');
      } catch (err) {
        setStatus('error');
        setMsg(err.message || 'Gagal mengunggah foto profil');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setStatus('loading');
    setMsg('');
    try {
      const res = await api.updateProfile(user.id, {
        namaLengkap: form.namaLengkap,
        email: form.email,
        telepon: form.telepon,
      });
      updateLocalUser({
        namaLengkap: form.namaLengkap,
        nama: form.namaLengkap,
        email: form.email,
        telepon: form.telepon
      });
      setStatus('success');
      setMsg('Data profil berhasil diperbarui!');
      setEditing(false);
    } catch (e) {
      setStatus('error');
      setMsg(e.message || 'Gagal menyimpan profil');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.newPw) {
      setStatus('error');
      setMsg('Password baru harus diisi');
      return;
    }
    if (pwForm.newPw.length < 6) {
      setStatus('error');
      setMsg('Password baru minimal 6 karakter');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      setStatus('error');
      setMsg('Konfirmasi password tidak cocok');
      return;
    }

    setStatus('loading');
    setMsg('');
    try {
      await api.updateProfile(user.id, {
        namaLengkap: form.namaLengkap,
        email: form.email,
        telepon: form.telepon,
        password: pwForm.newPw
      });
      setStatus('success');
      setMsg('Kata sandi berhasil diperbarui!');
      setPwForm({ newPw: '', confirm: '' });
    } catch (e) {
      setStatus('error');
      setMsg(e.message || 'Gagal memperbarui kata sandi');
    }
  };

  return (
    <div className="page-container">
      {/* Profile Hero Card */}
      <div className="profile-hero">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {avatar ? (
              <img src={avatar} alt="Foto Profil" />
            ) : (
              <span>{(form.namaLengkap || user?.nama || 'K')[0].toUpperCase()}</span>
            )}
          </div>
          <button
            className="avatar-edit-btn"
            onClick={() => fileRef.current?.click()}
            title="Ubah Foto Profil"
          >
            <i className="fa-solid fa-camera"></i>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">{form.namaLengkap || user?.nama || 'Karyawan'}</h2>
          <p className="profile-role">
            <i className="fa-solid fa-id-badge"></i> Karyawan Operasional &bull; PT Angkasa Ekspres
          </p>
          <p className="profile-email">{form.email || user?.email}</p>
        </div>
        <div className="profile-id-badge">ID: #{user?.id || '–'}</div>
      </div>

      {/* Section Tabs */}
      <div className="profile-tabs">
        {[
          { id: 'profile', label: 'Profil Saya', icon: 'fa-solid fa-user' },
          { id: 'security', label: 'Kata Sandi', icon: 'fa-solid fa-lock' },
          { id: 'settings', label: 'Pengaturan Tampilan', icon: 'fa-solid fa-sliders' },
        ].map(t => (
          <button
            key={t.id}
            className={`profile-tab ${activeSection === t.id ? 'active' : ''}`}
            onClick={() => { setActiveSection(t.id); setStatus(null); setMsg(''); }}
          >
            <i className={t.icon}></i>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Alerts */}
      {status === 'success' && (
        <div className="alert-success animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setStatus(null)} className="alert-dismiss">&times;</button>
        </div>
      )}
      {status === 'error' && (
        <div className="alert-error animate-fade-in">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setStatus(null)} className="alert-dismiss">&times;</button>
        </div>
      )}

      {/* Tab: Profile */}
      {activeSection === 'profile' && (
        <div className="form-card">
          <div className="form-card-header">
            <div>
              <div className="fcard-title">Informasi Pribadi</div>
              <div className="fcard-sub">Data kontak dan identitas akun Anda</div>
            </div>
            {!editing ? (
              <button className="btn-edit" onClick={() => setEditing(true)}>
                <i className="fa-solid fa-pencil"></i> Edit Profil
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-cancel"
                  onClick={() => { setEditing(false); setStatus(null); }}
                >
                  Batal
                </button>
                <button
                  className="btn-save"
                  onClick={handleSaveProfile}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            )}
          </div>

          <div className="form-fields">
            <div className="field-group">
              <label className="field-label">Nama Lengkap</label>
              {editing ? (
                <input
                  className="field-input"
                  value={form.namaLengkap}
                  onChange={e => setForm(p => ({ ...p, namaLengkap: e.target.value }))}
                />
              ) : (
                <div className="field-value">{form.namaLengkap || '–'}</div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">Alamat Email</label>
              {editing ? (
                <input
                  className="field-input"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              ) : (
                <div className="field-value">{form.email || '–'}</div>
              )}
            </div>

            <div className="field-group">
              <label className="field-label">Nomor Telepon / WhatsApp</label>
              {editing ? (
                <input
                  className="field-input"
                  type="tel"
                  value={form.telepon}
                  placeholder="08123456789"
                  onChange={e => setForm(p => ({ ...p, telepon: e.target.value }))}
                />
              ) : (
                <div className="field-value">{form.telepon || '–'}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {activeSection === 'security' && (
        <form onSubmit={handleChangePassword} className="form-card">
          <div className="form-card-header">
            <div>
              <div className="fcard-title">Ganti Kata Sandi</div>
              <div className="fcard-sub">Perbarui kata sandi untuk keamanan akun presensi</div>
            </div>
          </div>

          <div className="form-fields">
            <div className="field-group">
              <label className="field-label">Kata Sandi Baru</label>
              <input
                className="field-input"
                type="password"
                placeholder="Minimal 6 karakter"
                value={pwForm.newPw}
                onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label">Konfirmasi Kata Sandi Baru</label>
              <input
                className="field-input"
                type="password"
                placeholder="Ketik ulang kata sandi baru"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-save"
              style={{ alignSelf: 'flex-start', marginTop: '10px' }}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      )}

      {/* Tab: Settings */}
      {activeSection === 'settings' && (
        <div className="form-card">
          <div className="form-card-header">
            <div>
              <div className="fcard-title">Preferensi & Tampilan</div>
              <div className="fcard-sub">Sesuaikan tema aplikasi</div>
            </div>
          </div>

          <div className="form-fields">
            <div className="setting-toggle-row">
              <div>
                <div className="setting-toggle-title">Mode Gelap (Dark Mode)</div>
                <div className="setting-toggle-desc">Mengubah tema tampilan menjadi kontras gelap</div>
              </div>
              <button
                type="button"
                className={`theme-toggle-switch ${darkMode ? 'on' : ''}`}
                onClick={toggleDarkMode}
              >
                <span className="switch-thumb"></span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .profile-hero {
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          border-radius: 20px;
          padding: 24px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 20px;
          position: relative;
          box-shadow: 0 10px 25px rgba(230, 0, 0, 0.28);
          flex-wrap: wrap;
        }
        .profile-avatar-wrap {
          position: relative;
        }
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          color: #fff;
          overflow: hidden;
          border: 3px solid rgba(255, 255, 255, 0.6);
        }
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-edit-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #ffffff;
          color: var(--brand);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        .avatar-edit-btn:hover { transform: scale(1.1); }

        .profile-info { flex: 1; }
        .profile-name { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; }
        .profile-role { font-size: 13px; opacity: 0.9; margin: 0 0 2px 0; }
        .profile-email { font-size: 12px; opacity: 0.75; margin: 0; font-family: monospace; }
        .profile-id-badge {
          background: rgba(255, 255, 255, 0.18);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .profile-tabs {
          display: flex;
          gap: 8px;
          background: var(--bg-card);
          padding: 6px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
        }
        .profile-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 14px;
          border: none;
          border-radius: 10px;
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .profile-tab:hover { color: var(--text-primary); }
        .profile-tab.active {
          background: var(--brand-50);
          color: var(--brand);
          font-weight: 700;
        }
        body.dark-mode .profile-tab.active {
          background: rgba(230, 0, 0, 0.15);
        }

        .alert-success, .alert-error {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13.5px;
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .alert-dismiss {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 18px;
          cursor: pointer;
        }

        .form-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
        }
        .form-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 10px;
        }
        .fcard-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
        .fcard-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

        .btn-edit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-edit:hover { border-color: var(--brand); color: var(--brand); }

        .btn-save {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          background: var(--brand);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-save:hover:not(:disabled) { background: var(--brand-dark); }
        .btn-cancel {
          padding: 8px 14px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: transparent;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
        }

        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .field-value {
          font-size: 14.5px;
          font-weight: 600;
          color: var(--text-primary);
          padding: 8px 0;
        }
        .field-input {
          padding: 10px 14px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
        }
        .field-input:focus { border-color: var(--brand); }

        .setting-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }
        .setting-toggle-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .setting-toggle-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

        .theme-toggle-switch {
          width: 50px;
          height: 28px;
          border-radius: 14px;
          background: var(--border-color);
          border: none;
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
        }
        .theme-toggle-switch.on { background: var(--brand); }
        .switch-thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
        }
        .theme-toggle-switch.on .switch-thumb {
          transform: translateX(22px);
        }
      `}</style>
    </div>
  );
}
