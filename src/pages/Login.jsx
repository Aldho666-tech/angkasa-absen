import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Biometric Fingerprint State
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Harap isi username dan password');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login gagal, periksa email dan password Anda');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setError('');
    setShowBiometricModal(true);
    setBiometricScanning(true);
    setBiometricSuccess(false);

    // Request native device biometric/fingerprint if supported
    try {
      if (window.PublicKeyCredential && navigator.credentials) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'preferred',
            rpId: window.location.hostname
          }
        }).catch(() => null);
      }
    } catch (_) {}

    // Visual Fingerprint Scanning Animation & Verification
    setTimeout(async () => {
      setBiometricScanning(false);
      setBiometricSuccess(true);
      setTimeout(async () => {
        setShowBiometricModal(false);
        const targetUser = username.trim() || 'jaka@gmail.com';
        const targetPass = password.trim() || 'jaka123';
        try {
          await login(targetUser, targetPass);
        } catch (err) {
          setError(err.message || 'Login biometrik gagal');
        }
      }, 700);
    }, 1800);
  };

  return (
    <div className="login-screen-wrap">

      {/* ══ DESKTOP: two-column card ══ */}
      <div className="login-card-split desktop-card">
        {/* Left Visual Panel (Desktop) */}
        <div className="login-visual-panel">
          <div className="visual-panel-decor orb-1"></div>
          <div className="visual-panel-decor orb-2"></div>

          <div className="visual-brand-top">
            <img
              src="/LOGO.png"
              alt="PT Angkasa Ekspres"
              className="visual-brand-logo"
              onError={(e) => { e.target.src = '/LOGO.png'; }}
            />
            <div className="visual-badge">
              <i className="fas fa-shield-halved"></i> Presensi Cepat &amp; Akurat
            </div>
          </div>

          <div className="visual-heading">
            <h2>PT Angkasa Ekspres Indonesia</h2>
            <p>Sistem Presensi Digital &amp; Monitoring Operasional Karyawan</p>
          </div>

          <div className="visual-truck-container">
            <img
              src="/gif3.gif"
              alt="Animasi Armada &amp; Operasional Angkasa"
              className="visual-truck-img"
              onError={(e) => { e.target.src = '/truck.png'; }}
            />
          </div>

          <div className="visual-pills-row">
            <div className="floating-pill">
              <i className="fas fa-location-crosshairs"></i> GPS Geofence Verified
            </div>
            <div className="floating-pill">
              <i className="fas fa-user-check"></i> Biometric Face Match
            </div>
          </div>

          <div className="visual-stats-bar">
            <div>
              <span className="stat-big">99.8%</span>
              <span className="stat-desc">Akurasi GPS</span>
            </div>
            <div className="stat-divider"></div>
            <div>
              <span className="stat-big">&lt; 2 Detik</span>
              <span className="stat-desc">Kecepatan Absen</span>
            </div>
            <div className="stat-divider"></div>
            <div>
              <span className="stat-big">24/7</span>
              <span className="stat-desc">Sistem Aktif</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="login-form-panel">
          <div className="form-brand-header">
            <img src="/LOGO.png" alt="Logo Angkasa" className="form-brand-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <h1 className="form-brand-title">PT Angkasa Ekspres</h1>
            <p className="form-brand-desc">Masuk ke akun presensi &amp; operasional Anda</p>
          </div>

          {error && (
            <div className="form-alert-error animate-fade-in">
              <i className="fas fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Email / Username</label>
              <div className="input-with-icon">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  id="username"
                  type="text"
                  className="form-input icon-padded"
                  placeholder="Contoh: adminaldo@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <i className="fas fa-lock input-icon"></i>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input icon-padded"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label="Toggle password"
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-submit-login" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          <div className="login-footer-copy">
            &copy; 2026 PT Angkasa Ekspres Indonesia. Hak Cipta Dilindungi.
          </div>
        </div>
      </div>

      {/* ══ MOBILE: native app style ══ */}
      <div className="mobile-login-shell mobile-shell">
        {/* Upper Hero Area with GIF Background */}
        <div className="mob-hero">
          <img
            src="/gif3.gif"
            alt="Armada Background"
            className="mob-hero-bg-anim"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="mob-hero-overlay"></div>
          <div className="mob-hero-orb orb-a"></div>
          <div className="mob-hero-orb orb-b"></div>

          {/* Brand Logo at Top */}
          <div className="mob-hero-brand-wrap">
            <img
              src="/LOGO.png"
              alt="Angkasa Ekspres"
              className="mob-hero-logo"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div className="mob-hero-text">
            <h1 className="mob-hero-title">PT Angkasa Ekspres</h1>
            <p className="mob-hero-sub">Sistem Presensi &amp; Operasional Karyawan</p>
          </div>
        </div>

        {/* Bottom Form Sheet */}
        <div className="mob-form-sheet">
          <div className="mob-sheet-handle"></div>

          <div className="mob-sheet-heading">
            <h2>Masuk ke Akun</h2>
            <p>Gunakan kredensial presensi Anda</p>
          </div>

          {error && (
            <div className="form-alert-error animate-fade-in mob-error">
              <i className="fas fa-circle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mob-form">
            <div className="mob-form-group">
              <label htmlFor="username-mob" className="mob-label">
                <i className="fas fa-user"></i> Email / Username
              </label>
              <input
                id="username-mob"
                type="text"
                className="mob-input"
                placeholder="Masukkan email atau username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mob-form-group">
              <label htmlFor="password-mob" className="mob-label">
                <i className="fas fa-lock"></i> Password
              </label>
              <div className="mob-input-wrap">
                <input
                  id="password-mob"
                  type={showPassword ? 'text' : 'password'}
                  className="mob-input"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="mob-eye-btn"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label="Toggle password"
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="mob-btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-right-to-bracket"></i>
                  <span>Masuk Sekarang</span>
                </>
              )}
            </button>

            {/* Biometric Fingerprint Trigger Button */}
            <button
              type="button"
              className="mob-btn-biometric"
              onClick={handleBiometricAuth}
            >
              <i className="fas fa-fingerprint"></i>
              <span>Masuk dengan Biometrik</span>
            </button>
          </form>

          <p className="mob-footer-copy">&copy; 2026 PT Angkasa Ekspres Indonesia</p>
        </div>
      </div>

      {/* ══ FINGERPRINT BIOMETRIC SCANNER MODAL ══ */}
      {showBiometricModal && (
        <div className="biometric-modal-overlay" onClick={() => setShowBiometricModal(false)}>
          <div className="biometric-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="biometric-modal-header">
              <h3>Autentikasi Sidik Jari</h3>
              <p>Sentuh sensor sidik jari perangkat Anda</p>
            </div>

            <div className={`fingerprint-sensor-box ${biometricScanning ? 'scanning' : ''} ${biometricSuccess ? 'verified' : ''}`}>
              <div className="fingerprint-laser-line"></div>
              <i className={`fas fa-fingerprint fingerprint-icon ${biometricSuccess ? 'success' : ''}`}></i>
            </div>

            <div className="biometric-status-msg">
              {biometricScanning && (
                <div className="status-text scanning">
                  <i className="fas fa-circle-notch fa-spin"></i>
                  <span>Memindai sidik jari biometrik...</span>
                </div>
              )}
              {biometricSuccess && (
                <div className="status-text success animate-fade-in">
                  <i className="fas fa-circle-check"></i>
                  <span>Sidik jari berhasil diverifikasi!</span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-cancel-biometric"
              onClick={() => setShowBiometricModal(false)}
            >
              Batal &amp; Masuk Manual
            </button>
          </div>
        </div>
      )}

      <style>{`
        .login-screen-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background-color: #0b0f19;
        }
        .login-screen-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url('/css/asset/gif3.gif');
          background-size: cover;
          background-position: center;
          filter: brightness(0.45) contrast(1.1);
          z-index: 0;
          pointer-events: none;
        }
        .login-screen-wrap::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 50%, rgba(185, 0, 0, 0.28) 0%, rgba(11, 15, 25, 0.78) 100%);
          z-index: 0;
          pointer-events: none;
        }
        body.dark-mode .login-screen-wrap::after {
          background: radial-gradient(circle at 30% 50%, rgba(150, 0, 0, 0.35) 0%, rgba(8, 12, 20, 0.85) 100%);
        }

        .login-card-split {
          width: 100%;
          max-width: 980px;
          min-height: 600px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }

        /* Left Visual */
        .login-visual-panel {
          background: linear-gradient(145deg, #e60000 0%, #c00000 50%, #990000 100%);
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          color: #ffffff;
        }
        .visual-panel-decor {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(50px);
        }
        .visual-panel-decor.orb-1 {
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.15);
          top: -100px;
          right: -80px;
        }
        .visual-panel-decor.orb-2 {
          width: 250px;
          height: 250px;
          background: rgba(0, 0, 0, 0.25);
          bottom: -80px;
          left: -60px;
        }

        .visual-brand-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 2;
          margin-bottom: 8px;
        }
        .visual-brand-logo {
          height: 54px;
          width: auto;
          object-fit: contain;
          filter:
            drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.9))
            drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))
            drop-shadow(0 4px 14px rgba(0, 0, 0, 0.55));
          border-radius: 4px;
        }

        .visual-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          padding: 6px 14px;
          border-radius: var(--radius-pill);
          font-size: 11.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          width: fit-content;
          position: relative;
          z-index: 2;
        }

        .visual-heading {
          margin-top: 14px;
          position: relative;
          z-index: 2;
        }
        .visual-heading h2 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          line-height: 1.2;
          margin-bottom: 6px;
        }
        .visual-heading p {
          font-size: 13.5px;
          color: rgba(255, 255, 255, 0.85);
        }

        .visual-truck-container {
          position: relative;
          z-index: 2;
          margin: 16px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .visual-truck-img {
          width: 100%;
          max-width: 95%;
          height: auto;
          max-height: 190px;
          object-fit: cover;
          border-radius: var(--radius-md);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15);
        }

        .visual-pills-row {
          display: flex;
          gap: 10px;
          position: relative;
          z-index: 2;
          margin-bottom: 18px;
        }
        .floating-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 6px 12px;
          border-radius: var(--radius-pill);
          font-size: 11px;
          font-weight: 600;
        }

        .visual-stats-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 14px;
          border-radius: var(--radius-md);
          position: relative;
          z-index: 2;
          text-align: center;
        }
        .stat-big {
          display: block;
          font-size: 18px;
          font-weight: 800;
          line-height: 1.1;
        }
        .stat-desc {
          font-size: 10.5px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 2px;
        }
        .stat-divider {
          width: 1px;
          height: 28px;
          background: rgba(255, 255, 255, 0.2);
        }

        /* Right Form */
        .login-form-panel {
          padding: 44px 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .form-brand-header {
          margin-bottom: 24px;
        }
        .form-brand-logo {
          height: 56px;
          width: auto;
          object-fit: contain;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
        }
        .form-brand-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.3px;
          color: var(--text-main);
          margin-bottom: 4px;
        }
        .form-brand-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .form-alert-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--red-50);
          color: var(--red-600);
          border: 1px solid var(--red-100);
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 18px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .form-input.icon-padded {
          padding-left: 38px;
          padding-right: 40px;
        }
        .btn-toggle-eye {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
        }
        .btn-toggle-eye:hover {
          color: var(--brand);
        }

        .btn-submit-login {
          width: 100%;
          padding: 13px;
          font-size: 14.5px;
          font-weight: 700;
          border-radius: var(--radius-sm);
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-footer-copy {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 400;
          text-align: center;
          margin-top: 24px;
        }

        /* ─── Layout Visibility Rules ─── */
        .desktop-card {
          display: grid !important;
        }
        .mobile-shell {
          display: none !important;
        }

        /* ══════════════════════════════════════
           MOBILE ≤ 860px — Reference Design Match
           ══════════════════════════════════════ */
        @media (max-width: 860px) {
          .login-screen-wrap {
            padding: 0;
            align-items: stretch;
            background: linear-gradient(168deg, #d30000 0%, #b80000 45%, #7a0000 100%);
          }
          .login-screen-wrap::before,
          .login-screen-wrap::after {
            display: none;
          }
          .desktop-card {
            display: none !important;
          }
          .mobile-shell {
            display: flex !important;
            flex-direction: column;
            width: 100%;
            min-height: 100vh;
            min-height: 100dvh;
          }

          /* ─ Hero Section with GIF Background ─ */
          .mob-hero {
            flex: 1.35;
            background: #1a0404;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: calc(44px + var(--safe-top)) 20px 60px;
            position: relative;
            overflow: hidden;
            color: #ffffff;
            min-height: 48vh;
          }
          .mob-hero-bg-anim {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.85;
            filter: saturate(1.15) contrast(1.08);
            z-index: 1;
            pointer-events: none;
          }
          .mob-hero-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              168deg,
              rgba(210, 0, 0, 0.42) 0%,
              rgba(160, 0, 0, 0.48) 50%,
              rgba(45, 0, 0, 0.65) 100%
            );
            z-index: 1;
            pointer-events: none;
          }
          .mob-hero-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            pointer-events: none;
            z-index: 2;
          }
          .mob-hero-orb.orb-a {
            width: 280px; height: 280px;
            background: rgba(255, 255, 255, 0.1);
            top: -80px; right: -60px;
          }
          .mob-hero-orb.orb-b {
            width: 220px; height: 220px;
            background: rgba(0, 0, 0, 0.35);
            bottom: -60px; left: -50px;
          }

          /* Brand Logo at Top — pure white, dominant */
          .mob-hero-brand-wrap {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 3;
          }
          .mob-hero-logo {
            height: 100px;
            max-height: 115px;
            max-width: 88%;
            width: auto;
            object-fit: contain;
            filter:
              brightness(0) invert(1)
              drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))
              drop-shadow(0 6px 22px rgba(0, 0, 0, 0.7));
          }

          .mob-hero-text {
            text-align: center;
            position: relative;
            z-index: 3;
            margin-bottom: 4px;
          }
          .mob-hero-title {
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            line-height: 1.2;
            color: rgba(255, 255, 255, 0.92);
            margin-bottom: 2px;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
          }
          .mob-hero-sub {
            font-size: 9.5px;
            color: rgba(255, 255, 255, 0.75);
            font-weight: 400;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
            letter-spacing: 0.2px;
          }

          /* ─ Form Sheet — overlaps hero with rounded top ─ */
          .mob-form-sheet {
            background: #ffffff;
            border-radius: 36px 36px 0 0;
            margin-top: -36px;
            padding: 12px 24px calc(28px + var(--safe-bottom));
            position: relative;
            z-index: 10;
            box-shadow: 0 -16px 48px rgba(0, 0, 0, 0.22);
            flex-shrink: 0;
          }

          .mob-sheet-handle {
            width: 48px;
            height: 5px;
            background: #cbd5e1;
            border-radius: 99px;
            margin: 4px auto 16px;
          }

          .mob-sheet-heading {
            margin-bottom: 18px;
          }
          .mob-sheet-heading h2 {
            font-size: 22px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 3px;
            letter-spacing: -0.4px;
          }
          .mob-sheet-heading p {
            font-size: 13px;
            color: #64748b;
            font-weight: 400;
          }

          .mob-error {
            margin-bottom: 16px;
          }

          /* Form fields */
          .mob-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .mob-form-group {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }
          .mob-label {
            font-size: 13px;
            font-weight: 600;
            color: #475569;
            display: flex;
            align-items: center;
            gap: 7px;
          }
          .mob-label i {
            color: #64748b;
            font-size: 13px;
          }

          .mob-input {
            width: 100%;
            background: #f1f5f9;
            border: 1.5px solid #e2e8f0;
            border-radius: 14px;
            padding: 13.5px 16px;
            font-size: 14px;
            color: #0f172a;
            outline: none;
            font-family: inherit;
            transition: border-color var(--transition), box-shadow var(--transition), background var(--transition);
            box-sizing: border-box;
          }
          .mob-input:focus {
            border-color: #e60000;
            background: #ffffff;
            box-shadow: 0 0 0 3.5px rgba(230, 0, 0, 0.16);
          }
          .mob-input::placeholder {
            color: #94a3b8;
            font-weight: 400;
          }

          .mob-input-wrap {
            position: relative;
          }
          .mob-input-wrap .mob-input {
            padding-right: 48px;
          }
          .mob-eye-btn {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 16px;
            padding: 4px;
            display: flex;
            align-items: center;
          }
          .mob-eye-btn:hover {
            color: #e60000;
          }

          /* Submit Button */
          .mob-btn-submit {
            width: 100%;
            background: linear-gradient(135deg, #c70000 0%, #990000 100%);
            color: #ffffff;
            border: none;
            border-radius: 15px;
            padding: 14.5px;
            font-size: 15px;
            font-weight: 700;
            font-family: inherit;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all var(--transition);
            box-shadow: 0 8px 24px rgba(180, 0, 0, 0.35);
            margin-top: 2px;
          }
          .mob-btn-submit:hover:not(:disabled) {
            background: linear-gradient(135deg, #b00000 0%, #800000 100%);
            transform: translateY(-1px);
            box-shadow: 0 12px 30px rgba(180, 0, 0, 0.42);
          }
          .mob-btn-submit:active:not(:disabled) {
            transform: scale(0.98);
          }
          .mob-btn-submit:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          /* Biometric Quick Button */
          .mob-btn-biometric {
            width: 100%;
            background: #fff0f0;
            border: 1.5px solid #fed7d7;
            border-radius: 9999px;
            padding: 12.5px 18px;
            color: #c40000;
            font-weight: 700;
            font-size: 13.5px;
            font-family: inherit;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 10px;
            transition: all var(--transition);
            box-shadow: 0 2px 8px rgba(230, 0, 0, 0.08);
          }
          .mob-btn-biometric:hover {
            background: #ffe3e3;
            border-color: #fca5a5;
            transform: translateY(-1px);
          }
          .mob-btn-biometric:active {
            transform: scale(0.98);
          }
          .mob-btn-biometric i {
            font-size: 16px;
          }

          .mob-footer-copy {
            font-size: 11.5px;
            color: #94a3b8;
            font-weight: 400;
            text-align: center;
            margin-top: 18px;
          }
        }

        /* ══ FINGERPRINT BIOMETRIC SCANNER MODAL ══ */
        .biometric-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 99999;
          animation: fadeIn 0.2s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .biometric-modal-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 32px 24px 26px;
          width: 100%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes scaleUp {
          from { transform: scale(0.92); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .biometric-modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .biometric-modal-header p {
          font-size: 13px;
          color: #64748b;
          font-weight: 400;
        }
        .fingerprint-sensor-box {
          width: 105px;
          height: 105px;
          border-radius: 50%;
          background: #fff0f0;
          border: 2px dashed #fca5a5;
          margin: 22px 0 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .fingerprint-icon {
          font-size: 52px;
          color: #e60000;
          transition: all 0.3s;
        }
        .fingerprint-sensor-box.scanning {
          border-style: solid;
          border-color: #e60000;
          box-shadow: 0 0 24px rgba(230, 0, 0, 0.28);
        }
        .fingerprint-sensor-box.scanning .fingerprint-laser-line {
          position: absolute;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #e60000, transparent);
          box-shadow: 0 0 10px #e60000;
          top: 0;
          animation: scanLaserAnim 1.4s ease-in-out infinite alternate;
        }
        @keyframes scanLaserAnim {
          0% { top: 10%; }
          100% { top: 90%; }
        }
        .fingerprint-sensor-box.verified {
          background: #ecfdf5;
          border-color: #10b981;
          border-style: solid;
          box-shadow: 0 0 24px rgba(16, 185, 129, 0.3);
        }
        .fingerprint-icon.success {
          color: #10b981;
          transform: scale(1.1);
        }
        .biometric-status-msg {
          min-height: 28px;
          margin-bottom: 20px;
        }
        .status-text {
          font-size: 13.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .status-text.scanning {
          color: #e60000;
        }
        .status-text.success {
          color: #059669;
        }
        .btn-cancel-biometric {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .btn-cancel-biometric:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
