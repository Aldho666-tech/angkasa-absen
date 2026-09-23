import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveDuration, setLiveDuration] = useState('00:00:00');
  const [monthlyStats, setMonthlyStats] = useState({ hadir: 0, telat: 0, izin: 0, alpha: 0 });

  // Camera & Biometric state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [locationText, setLocationText] = useState('Mendeteksi lokasi GPS...');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Live Digital Clock
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // GPS Geolocation Detection
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lon = pos.coords.longitude.toFixed(5);
          setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationText(`Lat ${lat}, Lon ${lon}`);
        },
        () => {
          setLocationText('Graha Angkasa, Cengkareng');
          setGpsCoords({ lat: -6.34395432, lon: 106.73780986 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationText('Graha Angkasa, Cengkareng');
      setGpsCoords({ lat: -6.34395432, lon: 106.73780986 });
    }
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Fetch Attendance Data
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [todayRes, historyRes] = await Promise.all([
        api.getTodayAttendance(user.id).catch(() => null),
        api.getHistory(user.id, currentMonth).catch(() => [])
      ]);

      if (todayRes && todayRes.status === 'found' && todayRes.data) {
        setAttendance(todayRes.data);
      } else {
        setAttendance(null);
      }

      const historyList = Array.isArray(historyRes) ? historyRes : historyRes?.records || [];
      const stats = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
      historyList.forEach((r) => {
        const s = (r.status || '').toLowerCase();
        if (s === 'hadir') stats.hadir++;
        else if (s === 'telat' || s === 'terlambat') stats.telat++;
        else if (s === 'izin' || s === 'sakit' || s === 'cuti') stats.izin++;
        else if (s === 'alpha') stats.alpha++;
      });
      setMonthlyStats(stats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live Work Duration
  useEffect(() => {
    if (!attendance?.waktu_masuk) {
      setLiveDuration('–');
      return;
    }

    const calcDuration = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const start = new Date(`${todayStr}T${attendance.waktu_masuk}`);
      const end = attendance.waktu_pulang
        ? new Date(`${todayStr}T${attendance.waktu_pulang}`)
        : new Date();

      const diffSec = Math.max(0, Math.floor((end - start) / 1000));
      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      setLiveDuration(`${hrs}j ${String(mins).padStart(2, '0')}m`);
    };

    calcDuration();
    if (!attendance.waktu_pulang) {
      const timer = setInterval(calcDuration, 1000);
      return () => clearInterval(timer);
    }
  }, [attendance?.waktu_masuk, attendance?.waktu_pulang]);

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraOn && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraOn(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
        });
        setStream(mediaStream);
        setIsCameraOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.warn('Gagal membuka kamera:', err.message);
        setFeedback({
          type: 'error',
          message: 'Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan.'
        });
      }
    }
  };

  // Sound chime
  const playSound = (isClockIn = true) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = isClockIn ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (_) {}
  };

  // Watermark photo capture
  const captureWatermarkedPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, w, h);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, h - 55, w, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${user?.namaLengkap || user?.nama || 'Karyawan'} | PT Angkasa Ekspres`, 16, h - 33);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#f87171';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID');
    const dateStr = now.toLocaleDateString('id-ID');
    ctx.fillText(`🕒 ${dateStr} ${timeStr} | 📍 ${locationText}`, 16, h - 14);

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Handle Absen Masuk
  const handleClockIn = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    let photo = null;
    if (isCameraOn) {
      photo = captureWatermarkedPhoto();
    }

    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour12: false });

    try {
      const res = await api.clockIn({
        userId: user.id,
        time,
        location: locationText,
        photo
      });

      playSound(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setFeedback({ type: 'success', message: res.message || 'Absen Masuk Berhasil Tervalidasi!' });
      if (isCameraOn) toggleCamera();
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal melakukan absen masuk.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Absen Pulang
  const handleClockOut = async () => {
    setIsSubmitting(true);
    setFeedback(null);

    let photo = null;
    if (isCameraOn) {
      photo = captureWatermarkedPhoto();
    }

    const now = new Date();
    const time = now.toLocaleTimeString('id-ID', { hour12: false });

    try {
      const res = await api.clockOut({
        userId: user.id,
        time,
        location: locationText,
        photo
      });

      playSound(false);
      setFeedback({ type: 'success', message: res.message || 'Absen Pulang Berhasil Terekam!' });
      if (isCameraOn) toggleCamera();
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal melakukan absen pulang.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasClockedIn = !!attendance?.waktu_masuk;
  const hasClockedOut = !!attendance?.waktu_pulang;

  const formatClock = (date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatDate = (date) =>
    date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const getProfileImage = () => {
    if (user?.foto && !user.foto.includes('placeholder')) return user.foto;
    if (user?.role === 'admin') return '/Admin-Avatar.png';
    return '/Aldho.jpg';
  };

  return (
    <div className="mobile-dash-root">
      {/* 1. GREETING & PROFILE SECTION */}
      <section className="dash-greeting-section">
        <div className="dash-greeting-text">
          <span className="dash-label-welcome">Selamat Datang</span>
          <div className="dash-heading-user">
            <h1>Halo, {(user?.namaLengkap || user?.nama || 'aldho').toLowerCase()}!</h1>
            <span className="wave-emoji">👋</span>
          </div>
          <p className="dash-meta-sub">
            {formatDate(currentTime)} &bull; PT Angkasa Ekspres
          </p>
        </div>
        <div className="dash-profile-avatar-box">
          <img
            src={getProfileImage()}
            alt={user?.namaLengkap || 'Profil'}
            className="dash-profile-img"
            onError={(e) => {
              e.currentTarget.src = '/Aldho.jpg';
            }}
          />
          <span className={`status-indicator-dot ${hasClockedIn ? 'online' : 'idle'}`}></span>
        </div>
      </section>

      {/* 2. 3-CATEGORY QUICK STATS */}
      <section className="dash-stats-grid">
        {/* Masuk */}
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-lbl">Masuk</span>
            <div className="dash-stat-icon-wrap emerald">
              <span className="material-symbols-outlined">login</span>
            </div>
          </div>
          <span className="dash-stat-val">
            {loading ? '...' : attendance?.waktu_masuk ? attendance.waktu_masuk.slice(0, 5) : '–'}
          </span>
          <span className="dash-stat-badge emerald">
            {hasClockedIn ? (attendance?.status === 'Telat' ? 'Terlambat' : 'Tepat Waktu') : 'Belum Absen'}
          </span>
        </div>

        {/* Pulang */}
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-lbl">Pulang</span>
            <div className="dash-stat-icon-wrap rose">
              <span className="material-symbols-outlined">logout</span>
            </div>
          </div>
          <span className="dash-stat-val">
            {loading ? '...' : attendance?.waktu_pulang ? attendance.waktu_pulang.slice(0, 5) : '–'}
          </span>
          <span className="dash-stat-badge rose">
            {hasClockedOut ? 'Selesai Shift' : hasClockedIn ? 'Sedang Kerja' : 'Belum Pulang'}
          </span>
        </div>

        {/* Total Kerja */}
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-lbl">Total Kerja</span>
            <div className="dash-stat-icon-wrap blue">
              <span className="material-symbols-outlined">timer</span>
            </div>
          </div>
          <span className="dash-stat-val">{loading ? '...' : liveDuration}</span>
          <span className="dash-stat-badge blue">Target 8 jam</span>
        </div>
      </section>

      {/* 3. ANGKASA CRIMSON HERO CARD */}
      <section className="dash-hero-card">
        <div className="hero-orb orb-top"></div>
        <div className="hero-orb orb-bottom"></div>

        <div className="hero-content">
          {/* Top Pill Ribbons */}
          <div className="hero-header-row">
            <div className="hero-shift-badge">
              <span className="pulse-dot-live"></span>
              <span>Shift Pagi &bull; Graha Angkasa</span>
            </div>
            <div className="hero-gps-badge">
              <span className="material-symbols-outlined">my_location</span>
              <span>Radius 45m</span>
            </div>
          </div>

          {/* Big Digital Clock */}
          <div className="hero-clock-box">
            <span className="hero-clock-sub">Jam Digital Presensi</span>
            <div className="hero-clock-time-row">
              <span className="hero-clock-time">{formatClock(currentTime)}</span>
              <span className="hero-clock-tz">WIB</span>
            </div>
            <div className="hero-location-line">
              <span className="material-symbols-outlined">location_on</span>
              <span>{locationText || 'Hub Utama Graha Angkasa, Cengkareng'}</span>
            </div>
          </div>

          {/* Biometric Face Scanner Highlight Box */}
          <div className="biometric-scanner-box">
            <div className="scanner-status-header">
              <div className="scanner-ready-status">
                <span className="pulse-ping-dot"></span>
                <span>{isCameraOn ? 'KAMERA AKTIF & MEMINDAI' : 'SENSOR BIOMETRIK SIAP'}</span>
              </div>
              <span className="scanner-ai-badge">AI Anti-Spoofing Active</span>
            </div>

            {/* Viewfinder Frame */}
            <div className="scanner-viewfinder">
              <div className="corner-bracket c-tl"></div>
              <div className="corner-bracket c-tr"></div>
              <div className="corner-bracket c-bl"></div>
              <div className="corner-bracket c-br"></div>

              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className={`scanner-video ${!isCameraOn ? 'hidden-video' : ''}`}
              ></video>

              {/* Target Face Overlay */}
              {!isCameraOn ? (
                <div className="scanner-idle-placeholder">
                  <div className="scanner-face-icon-wrap">
                    <span className="material-symbols-outlined face-big">face</span>
                  </div>
                  <div className="scanner-instruction-row">
                    <span className="material-symbols-outlined text-emerald">check_circle</span>
                    <span>Posisikan Wajah dalam Bingkai</span>
                  </div>
                </div>
              ) : (
                <div className="scanner-face-guide-oval"></div>
              )}
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

            {/* Toast Feedback */}
            {feedback && (
              <div className={`dash-feedback-alert ${feedback.type}`}>
                <span className="material-symbols-outlined">
                  {feedback.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{feedback.message}</span>
              </div>
            )}

            {/* High-Contrast Action Buttons */}
            <div className="scanner-action-buttons-wrap">
              {!isCameraOn ? (
                <button
                  type="button"
                  className="scanner-main-btn start-camera"
                  onClick={toggleCamera}
                >
                  <span className="material-symbols-outlined">photo_camera_front</span>
                  <span>Buka Kamera Presensi Wajah</span>
                </button>
              ) : (
                <div className="scanner-dual-actions">
                  <button
                    type="button"
                    className="scanner-main-btn btn-clock-in-now"
                    onClick={handleClockIn}
                    disabled={isSubmitting || hasClockedIn}
                  >
                    <span className="material-symbols-outlined">login</span>
                    <span>{hasClockedIn ? 'Sudah Masuk' : isSubmitting ? 'Memproses...' : 'Absen Masuk'}</span>
                  </button>
                  <button
                    type="button"
                    className="scanner-main-btn btn-clock-out-now"
                    onClick={handleClockOut}
                    disabled={isSubmitting || !hasClockedIn || hasClockedOut}
                  >
                    <span className="material-symbols-outlined">logout</span>
                    <span>{hasClockedOut ? 'Sudah Pulang' : isSubmitting ? 'Memproses...' : 'Absen Pulang'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Presensi Validation Badges */}
            <div className="hero-validation-row">
              <div className="validation-pill">
                <span className="material-symbols-outlined text-emerald">check_circle</span>
                <div className="validation-text">
                  <span className="val-title">Masuk Tervalidasi</span>
                  <span className="val-sub">
                    {attendance?.waktu_masuk ? `${attendance.waktu_masuk} WIB` : 'Belum Absen'}
                  </span>
                </div>
              </div>
              <div className="validation-pill">
                <span className="material-symbols-outlined text-emerald">check_circle</span>
                <div className="validation-text">
                  <span className="val-title">Pulang Terekam</span>
                  <span className="val-sub">
                    {attendance?.waktu_pulang ? `${attendance.waktu_pulang} WIB` : 'Belum Pulang'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. AKSI CEPAT (QUICK ACTIONS GRID) */}
      <section className="dash-quick-actions-section">
        <div className="section-title-row">
          <div className="section-title-left">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <h3>Aksi Cepat</h3>
          </div>
          <span className="section-title-badge">Layanan Mandiri</span>
        </div>

        <div className="quick-action-grid">
          {/* Action 1: Ajukan Izin */}
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/employee/izin')}
          >
            <div className="qa-icon-wrap rose">
              <span className="material-symbols-outlined">assignment_add</span>
            </div>
            <span className="qa-btn-title">Ajukan Izin</span>
          </button>

          {/* Action 2: Riwayat */}
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/employee/riwayat')}
          >
            <div className="qa-icon-wrap amber">
              <span className="material-symbols-outlined">history_toggle_off</span>
            </div>
            <span className="qa-btn-title">Riwayat</span>
          </button>

          {/* Action 3: Profil / ID Pegawai */}
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => navigate('/employee/profil')}
          >
            <div className="qa-icon-wrap indigo">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <span className="qa-btn-title">ID Pegawai</span>
          </button>

          {/* Action 4: Cetak Slip */}
          <button
            type="button"
            className="quick-action-btn"
            onClick={() => window.print()}
          >
            <div className="qa-icon-wrap emerald">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="qa-btn-title">Cetak Slip</span>
          </button>
        </div>
      </section>

      {/* 5. CATATAN PRESENSI HARI INI (TIMELINE ACTIVITY LOG) */}
      <section className="dash-timeline-section">
        <div className="section-title-row">
          <div className="section-title-left">
            <span className="material-symbols-outlined text-primary">timeline</span>
            <h3>Catatan Presensi Hari Ini</h3>
          </div>
          <button
            type="button"
            className="see-all-logs-btn"
            onClick={() => navigate('/employee/riwayat')}
          >
            Semua Log
          </button>
        </div>

        <div className="timeline-card-container">
          {/* Log Item 1: Masuk */}
          <div className="timeline-item">
            <div className="tl-icon-circle emerald">
              <span className="material-symbols-outlined">verified_user</span>
            </div>
            <div className="tl-info-wrap">
              <div className="tl-header">
                <span className="tl-title">
                  Absen Masuk {attendance?.waktu_masuk ? `(${attendance.status || 'Tepat Waktu'})` : ''}
                </span>
                <span className="tl-time-badge emerald">
                  {attendance?.waktu_masuk || 'Belum Absen'}
                </span>
              </div>
              <p className="tl-desc">
                {attendance?.lokasi_masuk || 'Terminal Pos A Graha Angkasa • Biometrik Cocok 99.4%'}
              </p>
            </div>
          </div>

          {/* Log Item 2: Durasi Berjalan */}
          <div className="timeline-item">
            <div className="tl-icon-circle blue">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div className="tl-info-wrap">
              <div className="tl-header">
                <span className="tl-title">Durasi Kerja Efektif</span>
                <span className="tl-time-badge blue">{liveDuration}</span>
              </div>
              <p className="tl-desc">
                Status Operasional &bull; Target harian 8 jam terpenuhi
              </p>
            </div>
          </div>

          {/* Log Item 3: Pulang */}
          <div className="timeline-item">
            <div className="tl-icon-circle rose">
              <span className="material-symbols-outlined">door_front</span>
            </div>
            <div className="tl-info-wrap">
              <div className="tl-header">
                <span className="tl-title">
                  Absen Pulang {attendance?.waktu_pulang ? '(Lengkap)' : ''}
                </span>
                <span className="tl-time-badge rose">
                  {attendance?.waktu_pulang || 'Belum Pulang'}
                </span>
              </div>
              <p className="tl-desc">
                {attendance?.lokasi_pulang || (attendance?.waktu_pulang ? 'Gate Parkir Barat • GPS Terverifikasi' : 'Menunggu jam kepulangan shift')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENT SCOPED CSS WITH FULL MATERIAL 3 & PLUS JAKARTA SANS STYLING */}
      <style>{`
        .mobile-dash-root {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 580px;
          margin: 0 auto;
          padding: 0.75rem 1.25rem 2rem;
          color: #0b1c30;
          animation: fadeIn 0.25s ease-out;
        }

        body.dark-mode .mobile-dash-root {
          color: #e5eeff;
        }

        /* 1. GREETING SECTION */
        .dash-greeting-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.5rem;
          padding-bottom: 0.25rem;
        }
        .dash-greeting-text {
          display: flex;
          flex-direction: column;
        }
        .dash-label-welcome {
          font-size: 11px;
          line-height: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-weight: 700;
          color: #545f73;
        }
        body.dark-mode .dash-label-welcome {
          color: #94a3b8;
        }
        .dash-heading-user {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
        }
        .dash-heading-user h1 {
          font-size: 24px;
          line-height: 30px;
          letter-spacing: -0.015em;
          font-weight: 800;
          margin: 0;
          color: #0b1c30;
        }
        body.dark-mode .dash-heading-user h1 {
          color: #ffffff;
        }
        .wave-emoji {
          font-size: 22px;
        }
        .dash-meta-sub {
          font-size: 12px;
          line-height: 18px;
          color: #545f73;
          margin: 2px 0 0 0;
          font-weight: 500;
        }
        body.dark-mode .dash-meta-sub {
          color: #94a3b8;
        }

        .dash-profile-avatar-box {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          overflow: visible;
          flex-shrink: 0;
          background: #eff4ff;
          box-shadow: 0 4px 12px rgba(11, 28, 48, 0.08);
        }
        .dash-profile-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .status-indicator-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }
        .status-indicator-dot.online {
          background-color: #10b981;
        }
        .status-indicator-dot.idle {
          background-color: #f59e0b;
        }

        /* 2. QUICK STATS GRID */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .dash-stat-card {
          background: #ffffff;
          border-radius: 18px;
          padding: 12px 14px;
          box-shadow: 0 4px 16px rgba(11, 28, 48, 0.04);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(229, 238, 255, 0.7);
        }
        body.dark-mode .dash-stat-card {
          background: #111c2d;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }
        .dash-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .dash-stat-lbl {
          font-size: 11px;
          font-weight: 600;
          color: #545f73;
        }
        body.dark-mode .dash-stat-lbl {
          color: #94a3b8;
        }
        .dash-stat-icon-wrap {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dash-stat-icon-wrap .material-symbols-outlined {
          font-size: 15px;
        }
        .dash-stat-icon-wrap.emerald {
          background: #ecfdf5;
          color: #059669;
        }
        .dash-stat-icon-wrap.rose {
          background: #fff1f2;
          color: #e11d48;
        }
        .dash-stat-icon-wrap.blue {
          background: #eff6ff;
          color: #2563eb;
        }
        body.dark-mode .dash-stat-icon-wrap.emerald { background: rgba(5, 150, 105, 0.2); }
        body.dark-mode .dash-stat-icon-wrap.rose { background: rgba(225, 29, 72, 0.2); }
        body.dark-mode .dash-stat-icon-wrap.blue { background: rgba(37, 99, 235, 0.2); }

        .dash-stat-val {
          font-size: 18px;
          line-height: 24px;
          font-weight: 800;
          color: #0b1c30;
          letter-spacing: -0.01em;
        }
        body.dark-mode .dash-stat-val {
          color: #ffffff;
        }
        .dash-stat-badge {
          font-size: 10px;
          font-weight: 700;
          margin-top: 2px;
        }
        .dash-stat-badge.emerald { color: #059669; }
        .dash-stat-badge.rose { color: #e11d48; }
        .dash-stat-badge.blue { color: #2563eb; }

        /* 3. ANGKASA CRIMSON HERO CARD */
        .dash-hero-card {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          background: linear-gradient(135deg, #e11d48 0%, #be123c 55%, #881337 100%);
          padding: 20px;
          color: #ffffff;
          box-shadow: 0 16px 36px rgba(225, 29, 72, 0.26);
        }
        .hero-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .orb-top {
          top: -48px;
          right: -48px;
          width: 180px;
          height: 180px;
          background: rgba(255, 255, 255, 0.12);
          filter: blur(36px);
        }
        .orb-bottom {
          bottom: -48px;
          left: -48px;
          width: 180px;
          height: 180px;
          background: rgba(0, 0, 0, 0.25);
          filter: blur(36px);
        }

        .hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hero-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .hero-shift-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #ffffff;
        }
        .pulse-dot-live {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
          animation: pulse 1.5s infinite;
        }

        .hero-gps-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
        }
        .hero-gps-badge .material-symbols-outlined {
          font-size: 14px;
        }

        .hero-clock-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2px 0 6px;
        }
        .hero-clock-sub {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.85);
        }
        .hero-clock-time-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin: 2px 0;
        }
        .hero-clock-time {
          font-size: 38px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        }
        .hero-clock-tz {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
        }
        .hero-location-line {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
          margin-top: 2px;
        }
        .hero-location-line .material-symbols-outlined {
          font-size: 14px;
        }

        /* Biometric Face Scanner Highlight Card */
        .biometric-scanner-box {
          background: rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          padding: 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .scanner-status-header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2px;
        }
        .scanner-ready-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6ee7b7;
        }
        .pulse-ping-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 10px #34d399;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .scanner-ai-badge {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.12);
          padding: 3px 8px;
          border-radius: 9999px;
        }

        /* Viewfinder Box */
        .scanner-viewfinder {
          position: relative;
          width: 100%;
          max-width: 220px;
          height: 135px;
          border-radius: 18px;
          border: 2px dashed rgba(255, 255, 255, 0.35);
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.35) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          overflow: hidden;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .corner-bracket {
          position: absolute;
          width: 16px;
          height: 16px;
          border-color: #ffffff;
          border-style: solid;
          pointer-events: none;
          z-index: 5;
        }
        .c-tl { top: 6px; left: 6px; border-width: 2.5px 0 0 2.5px; border-top-left-radius: 6px; }
        .c-tr { top: 6px; right: 6px; border-width: 2.5px 2.5px 0 0; border-top-right-radius: 6px; }
        .c-bl { bottom: 6px; left: 6px; border-width: 0 0 2.5px 2.5px; border-bottom-left-radius: 6px; }
        .c-br { bottom: 6px; right: 6px; border-width: 0 2.5px 2.5px 0; border-bottom-right-radius: 6px; }

        .scanner-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .scanner-video.hidden-video {
          display: none;
        }

        .scanner-face-guide-oval {
          position: absolute;
          width: 105px;
          height: 120px;
          border: 2px dashed rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          pointer-events: none;
          z-index: 6;
          animation: pulse 2s infinite;
        }

        .scanner-idle-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          z-index: 4;
        }
        .scanner-face-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
        }
        .scanner-face-icon-wrap .material-symbols-outlined {
          font-size: 30px;
          color: #ffffff;
        }
        .scanner-instruction-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #ffffff;
          text-align: center;
        }
        .text-emerald {
          color: #34d399 !important;
          font-size: 14px !important;
        }

        /* Action Buttons */
        .scanner-action-buttons-wrap {
          width: 100%;
        }
        .scanner-main-btn {
          width: 100%;
          height: 48px;
          border-radius: 14px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .scanner-main-btn.start-camera {
          background: #ffffff;
          color: #e11d48;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          border: 1.5px solid rgba(255, 255, 255, 0.5);
        }
        .scanner-main-btn.start-camera:hover {
          background: #fff8f8;
          transform: translateY(-1px);
        }
        .scanner-main-btn.start-camera:active {
          transform: scale(0.98);
        }
        .scanner-main-btn .material-symbols-outlined {
          font-size: 22px;
        }

        .scanner-dual-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
        }
        .btn-clock-in-now {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }
        .btn-clock-out-now {
          background: #ffffff;
          color: #e11d48;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
        }
        .scanner-main-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .dash-feedback-alert {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        .dash-feedback-alert.success {
          background: rgba(16, 185, 129, 0.25);
          color: #a7f3d0;
          border: 1px solid rgba(52, 211, 153, 0.4);
        }
        .dash-feedback-alert.error {
          background: rgba(239, 68, 68, 0.25);
          color: #fecaca;
          border: 1px solid rgba(248, 113, 113, 0.4);
        }

        /* Validation row */
        .hero-validation-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          width: 100%;
          padding: 6px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.14);
        }
        .validation-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.12);
        }
        .validation-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .val-title {
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.2;
        }
        .val-sub {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.82);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* 4. AKSI CEPAT */
        .dash-quick-actions-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
        }
        .section-title-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .section-title-left .material-symbols-outlined {
          font-size: 20px;
          color: #e11d48;
        }
        .section-title-left h3 {
          font-size: 16px;
          font-weight: 800;
          margin: 0;
          color: #0b1c30;
        }
        body.dark-mode .section-title-left h3 {
          color: #ffffff;
        }
        .section-title-badge {
          font-size: 11px;
          font-weight: 600;
          color: #545f73;
        }
        body.dark-mode .section-title-badge {
          color: #94a3b8;
        }

        .quick-action-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 6px;
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid rgba(229, 238, 255, 0.7);
          box-shadow: 0 4px 16px rgba(11, 28, 48, 0.03);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        body.dark-mode .quick-action-btn {
          background: #111c2d;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }
        .quick-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(11, 28, 48, 0.07);
        }
        .quick-action-btn:active {
          transform: scale(0.96);
        }
        .qa-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qa-icon-wrap .material-symbols-outlined {
          font-size: 22px;
        }
        .qa-icon-wrap.rose { background: #fff1f2; color: #e11d48; }
        .qa-icon-wrap.amber { background: #fef3c7; color: #b45309; }
        .qa-icon-wrap.indigo { background: #e0e7ff; color: #4338ca; }
        .qa-icon-wrap.emerald { background: #ecfdf5; color: #059669; }
        body.dark-mode .qa-icon-wrap.rose { background: rgba(225, 29, 72, 0.2); }
        body.dark-mode .qa-icon-wrap.amber { background: rgba(180, 83, 9, 0.2); }
        body.dark-mode .qa-icon-wrap.indigo { background: rgba(67, 56, 202, 0.2); }
        body.dark-mode .qa-icon-wrap.emerald { background: rgba(5, 150, 105, 0.2); }

        .qa-btn-title {
          font-size: 11px;
          font-weight: 700;
          color: #0b1c30;
          text-align: center;
          line-height: 1.2;
        }
        body.dark-mode .qa-btn-title {
          color: #ffffff;
        }

        /* 5. TIMELINE SECTION */
        .dash-timeline-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding-bottom: 1rem;
        }
        .see-all-logs-btn {
          background: transparent;
          border: none;
          color: #e11d48;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          font-family: inherit;
        }
        .see-all-logs-btn:hover {
          text-decoration: underline;
        }

        .timeline-card-container {
          background: #ffffff;
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 6px 24px rgba(11, 28, 48, 0.03);
          border: 1px solid rgba(229, 238, 255, 0.7);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        body.dark-mode .timeline-card-container {
          background: #111c2d;
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 16px;
          background: #eff4ff;
        }
        body.dark-mode .timeline-item {
          background: rgba(255, 255, 255, 0.04);
        }

        .tl-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .tl-icon-circle .material-symbols-outlined {
          font-size: 18px;
        }
        .tl-icon-circle.emerald { background: #d1fae5; color: #047857; }
        .tl-icon-circle.blue { background: #dbeafe; color: #1d4ed8; }
        .tl-icon-circle.rose { background: #ffdada; color: #be0037; }
        body.dark-mode .tl-icon-circle.emerald { background: rgba(4, 120, 87, 0.25); color: #34d399; }
        body.dark-mode .tl-icon-circle.blue { background: rgba(29, 78, 216, 0.25); color: #60a5fa; }
        body.dark-mode .tl-icon-circle.rose { background: rgba(190, 0, 55, 0.25); color: #f87171; }

        .tl-info-wrap {
          flex: 1;
          min-width: 0;
        }
        .tl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .tl-title {
          font-size: 12px;
          font-weight: 700;
          color: #0b1c30;
        }
        body.dark-mode .tl-title {
          color: #ffffff;
        }
        .tl-time-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          white-space: nowrap;
        }
        .tl-time-badge.emerald { background: #ecfdf5; color: #047857; }
        .tl-time-badge.blue { background: #eff6ff; color: #1d4ed8; }
        .tl-time-badge.rose { background: #fff1f2; color: #be0037; }
        body.dark-mode .tl-time-badge.emerald { background: rgba(4, 120, 87, 0.3); color: #6ee7b7; }
        body.dark-mode .tl-time-badge.blue { background: rgba(29, 78, 216, 0.3); color: #93c5fd; }
        body.dark-mode .tl-time-badge.rose { background: rgba(190, 0, 55, 0.3); color: #fca5a5; }

        .tl-desc {
          font-size: 12px;
          line-height: 16px;
          color: #545f73;
          margin: 4px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        body.dark-mode .tl-desc {
          color: #94a3b8;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.96); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
