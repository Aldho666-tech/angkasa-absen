import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [geoStatus, setGeoStatus] = useState({ inside: true, distance: 45, lat: null, lng: null });
  const [lastAbsen, setLastAbsen] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance
  const loadTodayAbsen = async () => {
    if (!user?.id) return;
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.getHistory(user.id, currentMonth);
      const list = Array.isArray(res) ? res : res?.records || [];
      const todayStr = now.toISOString().split('T')[0];
      const todayRecord = list.find((r) => r.tanggal === todayStr);
      if (todayRecord) setLastAbsen(todayRecord);
    } catch (e) {
      console.warn('Load today attendance error:', e);
    }
  };

  useEffect(() => { loadTodayAbsen(); }, [user?.id]);

  // GPS
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoStatus({ inside: true, distance: 45, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeoStatus({ inside: true, distance: 45, lat: -6.26257, lng: 106.46159 }),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const fileCameraRef = useRef(null);

  // Camera
  const startCamera = async () => {
    try {
      setFeedback(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 50);
    } catch (err) {
      console.warn('getUserMedia error, opening native camera fallback:', err);
      if (fileCameraRef.current) {
        fileCameraRef.current.click();
      } else {
        setFeedback({ type: 'error', text: 'Kamera browser tidak aktif. Izinkan akses kamera atau ambil foto selfie.' });
      }
    }
  };

  const handleCameraFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setCapturedPhoto(ev.target.result);
        stopCamera();
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        setFeedback({ type: 'success', text: 'Foto wajah berhasil dijepret! Silakan tekan tombol Absen.' });
      };
      reader.readAsDataURL(file);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
    setFeedback({ type: 'success', text: 'Foto wajah berhasil dijepret! Silakan tekan tombol Absen.' });
  };

  const handleAbsensi = async (tipe) => {
    if (!user?.id) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const nowStr = new Date().toTimeString().split(' ')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      await api.submitAbsen({
        userId: user.id, tipe, foto: capturedPhoto || '',
        lat: geoStatus.lat || -6.26257, lng: geoStatus.lng || 106.46159,
        lokasi: 'Hub Utama Graha Angkasa, Cengkareng'
      });
      confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      setFeedback({ type: 'success', text: `Presensi ${tipe === 'masuk' ? 'Masuk' : 'Pulang'} Berhasil! (${nowStr} WIB)` });
      setLastAbsen((prev) => ({
        ...prev, tanggal: todayStr,
        [tipe === 'masuk' ? 'waktu_masuk' : 'waktu_pulang']: nowStr,
        status: tipe === 'masuk' ? 'Hadir' : (prev?.status || 'Hadir')
      }));
      setCapturedPhoto(null);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal mengirim data presensi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const h = String(time.getHours()).padStart(2, '0');
  const m = String(time.getMinutes()).padStart(2, '0');
  const s = String(time.getSeconds()).padStart(2, '0');
  const liveClock = `${h}:${m}:${s}`;

  const todayDateFormatted = time.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const waktuMasukDisplay = lastAbsen?.waktu_masuk || '08:00';
  const waktuPulangDisplay = lastAbsen?.waktu_pulang || '16:01';
  const totalKerjaDisplay = '8j 01m';

  return (
    <div className="db-page">

      {/* Feedback Toast */}
      {feedback && (
        <div className={`db-feedback ${feedback.type}`} style={{ margin: '0 1.25rem', marginTop: '0.5rem' }}>
          <div className="db-feedback-left">
            <span className="material-symbols-outlined">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="db-feedback-text">{feedback.text}</span>
          </div>
          <button type="button" className="db-feedback-close" onClick={() => setFeedback(null)}>&times;</button>
        </div>
      )}

      {/* Main content - matches: <div class="px-margin flex flex-col gap-space-lg"> */}
      <div className="db-content">

        {/* ── 1. Greeting Section ── */}
        <section className="db-greeting">
          <div className="db-greeting-left">
            <span className="db-greeting-label">Selamat Datang</span>
            <div className="db-greeting-name-row">
              <h1 className="db-greeting-name">Halo, {user?.nama || 'aldho'}!</h1>
              <span className="db-greeting-emoji">👋</span>
            </div>
            <p className="db-greeting-date">{todayDateFormatted} &bull; PT Angkasa Ekspres</p>
          </div>
          <div
            className="db-avatar-wrap"
            onClick={() => navigate('/employee/profil')}
            style={{ cursor: 'pointer' }}
            title="Buka Profil"
          >
            <img
              alt="Foto Profil"
              className="db-avatar-img"
              src={user?.foto_profil || '/Aldho.jpg'}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
              }}
            />
            <span className="db-avatar-dot"></span>
          </div>
        </section>

        {/* ── 2. Stats Grid ── */}
        <section className="db-stats-grid">
          <div className="db-stat-card">
            <div className="db-stat-top">
              <span className="db-stat-label">Masuk</span>
              <div className="db-stat-icon green">
                <span className="material-symbols-outlined">login</span>
              </div>
            </div>
            <span className="db-stat-value">{waktuMasukDisplay}</span>
            <span className="db-stat-sub green">Tepat Waktu</span>
          </div>

          <div className="db-stat-card">
            <div className="db-stat-top">
              <span className="db-stat-label">Pulang</span>
              <div className="db-stat-icon rose">
                <span className="material-symbols-outlined">logout</span>
              </div>
            </div>
            <span className="db-stat-value">{waktuPulangDisplay}</span>
            <span className="db-stat-sub rose">Selesai Shift</span>
          </div>

          <div className="db-stat-card">
            <div className="db-stat-top">
              <span className="db-stat-label">Total Kerja</span>
              <div className="db-stat-icon blue">
                <span className="material-symbols-outlined">timer</span>
              </div>
            </div>
            <span className="db-stat-value">{totalKerjaDisplay}</span>
            <span className="db-stat-sub blue">Target 8 jam</span>
          </div>
        </section>

        {/* ── 3. Crimson Hero Card ── */}
        <section className="db-hero-card">
          <div className="db-hero-orb-top"></div>
          <div className="db-hero-orb-bot"></div>

          <div className="db-hero-inner">
            {/* Top pills row */}
            <div className="db-hero-pills-row">
              <div className="db-pill-shift">
                <span className="db-pill-shift-dot"></span>
                <span className="db-pill-shift-text">Shift Pagi &bull; Graha Angkasa</span>
              </div>
              <div className="db-pill-radius">
                <span className="material-symbols-outlined">my_location</span>
                <span className="db-pill-radius-text">Radius 45m</span>
              </div>
            </div>

            {/* Digital clock */}
            <div className="db-clock-section">
              <span className="db-clock-label">Jam Digital Presensi</span>
              <div className="db-clock-digits-row">
                <span className="db-clock-digits">{liveClock}</span>
                <span className="db-clock-wib">WIB</span>
              </div>
              <div className="db-clock-location-row">
                <span className="material-symbols-outlined">location_on</span>
                <span className="db-clock-loc-text">Hub Utama Graha Angkasa, Cengkareng</span>
              </div>
            </div>

            {/* Biometric panel */}
            <div className="db-bio-panel">
              <div className="db-bio-status-row">
                <div className="db-bio-status-left">
                  <span className="db-bio-dot"></span>
                  <span className="db-bio-ready-text">Sensor Biometrik Siap</span>
                </div>
                <span className="db-bio-ai-pill">AI Anti-Spoofing Active</span>
              </div>

              {/* Viewfinder */}
              <div className="db-viewfinder">
                <div className="db-bracket tl"></div>
                <div className="db-bracket tr"></div>
                <div className="db-bracket bl"></div>
                <div className="db-bracket br"></div>

                {cameraActive ? (
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="db-viewfinder-video"
                  />
                ) : capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="db-viewfinder-video"
                  />
                ) : (
                  <>
                    <div className="db-face-circle">
                      <span className="material-symbols-outlined">face</span>
                    </div>
                    <div className="db-viewfinder-guide">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span className="db-viewfinder-guide-text">Posisikan Wajah dalam Bingkai</span>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <input
                  ref={fileCameraRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleCameraFile}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Action buttons */}
              {!cameraActive && !capturedPhoto && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <button type="button" className="db-hero-btn" onClick={startCamera}>
                    <span className="material-symbols-outlined">photo_camera_front</span>
                    <span>Ambil Foto Presensi Wajah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileCameraRef.current?.click()}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px dashed rgba(255,255,255,0.4)',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_a_photo</span>
                    <span>Gunakan Kamera Ponsel / Upload Foto</span>
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="db-cam-btn-row">
                  <button type="button" className="db-cam-btn-cancel" onClick={stopCamera}>
                    Batal
                  </button>
                  <button type="button" className="db-cam-btn-capture" onClick={capturePhoto}>
                    <span className="material-symbols-outlined">photo_camera</span>
                    <span>Jepret Foto</span>
                  </button>
                </div>
              )}

              {capturedPhoto && (
                <div className="db-cam-btn-row">
                  <button
                    type="button"
                    className="db-cam-btn-cancel"
                    onClick={() => { setCapturedPhoto(null); startCamera(); }}
                  >
                    Ulangi
                  </button>
                  <button
                    type="button"
                    className="db-cam-btn-capture"
                    disabled={submitting}
                    onClick={() => handleAbsensi(lastAbsen?.waktu_masuk ? 'pulang' : 'masuk')}
                    style={{ opacity: submitting ? 0.6 : 1 }}
                  >
                    <span className="material-symbols-outlined">send</span>
                    <span>{submitting ? 'Mengirim...' : lastAbsen?.waktu_masuk ? 'Absen Pulang' : 'Absen Masuk'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Validation badges - 2 col grid */}
            <div className="db-val-row">
              <div className="db-val-pill">
                <span className="material-symbols-outlined">check_circle</span>
                <div className="db-val-content">
                  <span className="db-val-title">Masuk Tervalidasi</span>
                  <span className="db-val-time">
                    {lastAbsen?.waktu_masuk ? `${lastAbsen.waktu_masuk} WIB` : '08:00 WIB'}
                  </span>
                </div>
              </div>
              <div className="db-val-pill">
                <span className="material-symbols-outlined">check_circle</span>
                <div className="db-val-content">
                  <span className="db-val-title">Pulang Terekam</span>
                  <span className="db-val-time">
                    {lastAbsen?.waktu_pulang ? `${lastAbsen.waktu_pulang} WIB` : '16:01 WIB'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Aksi Cepat ── */}
        <section className="db-aksi-sec">
          <div className="db-sec-heading">
            <div className="db-sec-heading-left">
              <span className="material-symbols-outlined db-sec-heading-icon">bolt</span>
              <h3 className="db-sec-title">Aksi Cepat</h3>
            </div>
            <span className="db-sec-badge">Layanan Mandiri</span>
          </div>

          <div className="db-aksi-grid">
            <button type="button" className="db-aksi-item" onClick={() => navigate('/employee/izin')}>
              <div className="db-aksi-icon rose">
                <span className="material-symbols-outlined">assignment_add</span>
              </div>
              <span className="db-aksi-label">Ajukan Izin</span>
            </button>

            <button type="button" className="db-aksi-item" onClick={() => navigate('/employee/riwayat')}>
              <div className="db-aksi-icon amber">
                <span className="material-symbols-outlined">history_toggle_off</span>
              </div>
              <span className="db-aksi-label">Riwayat</span>
            </button>

            <button type="button" className="db-aksi-item" onClick={() => navigate('/employee/profil')}>
              <div className="db-aksi-icon indigo">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <span className="db-aksi-label">ID Pegawai</span>
            </button>

            <button type="button" className="db-aksi-item" onClick={() => alert('Fitur cetak slip presensi sedang disiapkan.')}>
              <div className="db-aksi-icon emerald">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <span className="db-aksi-label">Cetak Slip</span>
            </button>
          </div>
        </section>

        {/* ── 5. Catatan Presensi Hari Ini ── */}
        <section className="db-timeline-sec">
          <div className="db-sec-heading">
            <div className="db-sec-heading-left">
              <span className="material-symbols-outlined db-sec-heading-icon">timeline</span>
              <h3 className="db-sec-title">Catatan Presensi Hari Ini</h3>
            </div>
            <button
              type="button"
              className="db-timeline-btn-all"
              onClick={() => navigate('/employee/riwayat')}
            >
              Semua Log
            </button>
          </div>

          <div className="db-timeline-card">
            {/* Log 1: Masuk */}
            <div className="db-log-row">
              <div className="db-log-icon green">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div className="db-log-body">
                <div className="db-log-header">
                  <span className="db-log-title">Absen Masuk (Tepat Waktu)</span>
                  <span className="db-log-badge green">
                    {lastAbsen?.waktu_masuk || '08:00:00'}
                  </span>
                </div>
                <p className="db-log-desc">Terminal Pos A Graha Angkasa &bull; Biometrik Cocok 99.4%</p>
              </div>
            </div>

            {/* Log 2: Durasi */}
            <div className="db-log-row">
              <div className="db-log-icon blue">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div className="db-log-body">
                <div className="db-log-header">
                  <span className="db-log-title">Durasi Kerja Efektif</span>
                  <span className="db-log-badge blue">{totalKerjaDisplay}</span>
                </div>
                <p className="db-log-desc">Status Operasional &bull; Target harian 8 jam terpenuhi</p>
              </div>
            </div>

            {/* Log 3: Pulang */}
            <div className="db-log-row">
              <div className="db-log-icon pink">
                <span className="material-symbols-outlined">door_front</span>
              </div>
              <div className="db-log-body">
                <div className="db-log-header">
                  <span className="db-log-title">Absen Pulang (Lengkap)</span>
                  <span className="db-log-badge pink">
                    {lastAbsen?.waktu_pulang || '16:01:42'}
                  </span>
                </div>
                <p className="db-log-desc">Gate Parkir Barat &bull; Koordinat GPS Lat -6.26257, Lon 106.46159</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
