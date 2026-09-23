import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';

export default function BiometricScanner({
  user,
  todayAttendance,
  onAttendanceUpdated
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState(null);
  const [locationText, setLocationText] = useState('Mendeteksi lokasi GPS...');
  const [gpsCoords, setGpsCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Detect GPS
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lon = pos.coords.longitude.toFixed(5);
          setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setLocationText(`Lat: ${lat}, Lon: ${lon}`);
        },
        () => {
          // Default office location fallback
          setLocationText('Lat: -6.34395, Lon: 106.73781 (Kantor Pusat)');
          setGpsCoords({ lat: -6.34395432, lon: 106.73780986 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationText('Lat: -6.34395, Lon: 106.73781 (Kantor Pusat)');
      setGpsCoords({ lat: -6.34395432, lon: 106.73780986 });
    }
  }, []);

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const toggleCamera = async () => {
    if (isCameraOn && stream) {
      stream.getTracks().forEach(track => track.stop());
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
          message: 'Kamera tidak dapat diakses. Pastikan izin kamera aktif.'
        });
      }
    }
  };

  // Synthesize Web Audio feedback chime
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

  // Capture frame with watermark
  const captureWatermarkedPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Draw video frame
    ctx.drawImage(video, 0, 0, w, h);

    // Watermark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, h - 55, w, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`${user?.namaLengkap || 'Karyawan'} | PT Angkasa Ekspres Indonesia`, 16, h - 33);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#f87171';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID');
    const dateStr = now.toLocaleDateString('id-ID');
    ctx.fillText(`🕒 ${dateStr} ${timeStr} | 📍 ${locationText}`, 16, h - 14);

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleClockIn = async () => {
    setIsLoading(true);
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

      setFeedback({ type: 'success', message: res.message || 'Absen Masuk Berhasil!' });
      if (onAttendanceUpdated) onAttendanceUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal absen masuk.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsLoading(true);
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
      setFeedback({ type: 'success', message: res.message || 'Absen Pulang Berhasil!' });
      if (onAttendanceUpdated) onAttendanceUpdated();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal absen pulang.' });
    } finally {
      setIsLoading(false);
    }
  };

  const hasClockedIn = !!todayAttendance?.waktu_masuk;
  const hasClockedOut = !!todayAttendance?.waktu_pulang;

  const openGoogleMaps = () => {
    if (gpsCoords) {
      window.open(`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lon}`, '_blank');
    } else {
      window.open('https://maps.google.com/?q=-6.34395432,106.73780986', '_blank');
    }
  };

  return (
    <div className="biometric-terminal-card">
      <div className="terminal-header">
        <div>
          <h2 className="terminal-title">
            <i className="fas fa-camera"></i> Terminal Presensi Biometrik
          </h2>
          <span className="terminal-sub">Verifikasi kamera wajah & koordinat satelit GPS</span>
        </div>
        <div className="terminal-live-badge">
          <span className="pulse-dot"></span>
          <span>{isCameraOn ? 'LIVE SCAN' : 'TERMINAL SIAP'}</span>
        </div>
      </div>

      {/* Location Ribbon */}
      <div className="location-ribbon" onClick={openGoogleMaps} title="Klik untuk membuka titik GPS di Google Maps">
        <div className="location-ribbon-left">
          <i className="fas fa-location-dot"></i>
          <span>{locationText}</span>
        </div>
        <button className="location-maps-btn" type="button">
          <i className="fas fa-up-right-from-square"></i> Buka Maps
        </button>
      </div>

      {/* Camera Viewfinder */}
      <div className="viewfinder-frame">
        <div className="corner-accent top-left"></div>
        <div className="corner-accent top-right"></div>
        <div className="corner-accent bottom-left"></div>
        <div className="corner-accent bottom-right"></div>

        {isCameraOn && <div className="face-target-oval"></div>}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`viewfinder-video ${!isCameraOn ? 'video-off' : ''}`}
        ></video>

        {!isCameraOn && (
          <div className="viewfinder-off-overlay">
            <div className="off-icon-circle">
              <i className="fas fa-video-slash"></i>
            </div>
            <span className="off-title">Kamera Belum Aktif</span>
            <span className="off-desc">Ketuk tombol di bawah untuk menyalakan kamera biometrik</span>
          </div>
        )}

        <div className="viewfinder-controls">
          <button
            className={`btn-camera-toggle ${isCameraOn ? 'camera-active' : ''}`}
            onClick={toggleCamera}
            type="button"
          >
            <i className={isCameraOn ? 'fas fa-video-slash' : 'fas fa-video'}></i>
            <span>{isCameraOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}</span>
          </button>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div className={`feedback-banner ${feedback.type}`}>
          <i className={feedback.type === 'success' ? 'fas fa-circle-check' : 'fas fa-circle-exclamation'}></i>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Action Buttons: Absen Masuk & Absen Pulang */}
      <div className="terminal-actions-grid">
        <button
          className="btn-clock-action btn-clock-in"
          onClick={handleClockIn}
          disabled={isLoading || hasClockedIn}
        >
          <div className="action-icon-circle in">
            <i className="fas fa-sign-in-alt"></i>
          </div>
          <div className="action-label-group">
            <span className="action-main-title">Absen Masuk</span>
            <span className="action-sub-text">
              {hasClockedIn ? `Sudah (${todayAttendance?.waktu_masuk})` : 'Klik untuk masuk'}
            </span>
          </div>
        </button>

        <button
          className="btn-clock-action btn-clock-out"
          onClick={handleClockOut}
          disabled={isLoading || !hasClockedIn || hasClockedOut}
        >
          <div className="action-icon-circle out">
            <i className="fas fa-sign-out-alt"></i>
          </div>
          <div className="action-label-group">
            <span className="action-main-title">Absen Pulang</span>
            <span className="action-sub-text">
              {hasClockedOut ? `Selesai (${todayAttendance?.waktu_pulang})` : hasClockedIn ? 'Klik untuk pulang' : 'Belum absen masuk'}
            </span>
          </div>
        </button>
      </div>

      <style>{`
        .biometric-terminal-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 22px;
          box-shadow: var(--shadow-card);
        }

        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .terminal-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .terminal-title i {
          color: var(--brand);
        }
        .terminal-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 2px;
          display: block;
        }

        .terminal-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
          background: var(--green-50);
          color: var(--green-600);
          border: 1px solid var(--green-100);
          font-size: 11px;
          font-weight: 700;
        }
        body.dark-mode .terminal-live-badge {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.3);
          color: #34d399;
        }

        .location-ribbon {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 14px;
          background: var(--border-subtle);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          margin-bottom: 16px;
          cursor: pointer;
          transition: all var(--transition);
        }
        .location-ribbon:hover {
          border-color: var(--brand-200);
          background: var(--brand-50);
        }
        body.dark-mode .location-ribbon:hover {
          background: rgba(230, 0, 0, 0.1);
        }
        .location-ribbon-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .location-ribbon-left i {
          color: var(--brand);
          font-size: 13px;
        }
        .location-maps-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 3px 9px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--brand);
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .viewfinder-frame {
          position: relative;
          background: #090d16;
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16/10;
          max-height: 270px;
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
        }

        .viewfinder-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .viewfinder-video.video-off {
          visibility: hidden;
        }

        .corner-accent {
          position: absolute;
          width: 22px;
          height: 22px;
          border-color: var(--brand);
          border-style: solid;
          pointer-events: none;
          z-index: 5;
        }
        .corner-accent.top-left { top: 12px; left: 12px; border-width: 3.5px 0 0 3.5px; border-top-left-radius: 6px; }
        .corner-accent.top-right { top: 12px; right: 12px; border-width: 3.5px 3.5px 0 0; border-top-right-radius: 6px; }
        .corner-accent.bottom-left { bottom: 12px; left: 12px; border-width: 0 0 3.5px 3.5px; border-bottom-left-radius: 6px; }
        .corner-accent.bottom-right { bottom: 12px; right: 12px; border-width: 0 3.5px 3.5px 0; border-bottom-right-radius: 6px; }

        .face-target-oval {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 140px;
          height: 180px;
          border: 2px dashed rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          pointer-events: none;
          z-index: 4;
        }

        .viewfinder-off-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #94a3b8;
          background: #0b1120;
          padding: 20px;
          text-align: center;
        }
        .off-icon-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .off-title {
          font-size: 14px;
          font-weight: 700;
          color: #f1f5f9;
        }
        .off-desc {
          font-size: 11.5px;
          color: #64748b;
          max-width: 250px;
        }

        .viewfinder-controls {
          position: absolute;
          bottom: 12px;
          right: 12px;
          z-index: 8;
        }
        .btn-camera-toggle {
          background: rgba(15, 23, 42, 0.78);
          color: #ffffff;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.22);
          padding: 8px 14px;
          border-radius: var(--radius-pill);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all var(--transition);
        }
        .btn-camera-toggle:hover, .btn-camera-toggle.camera-active {
          background: var(--brand);
          border-color: var(--brand);
        }

        .feedback-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 14px;
          animation: fadeIn 0.2s ease;
        }
        .feedback-banner.success {
          background: var(--green-50);
          color: var(--green-600);
          border: 1px solid var(--green-100);
        }
        .feedback-banner.error {
          background: var(--red-50);
          color: var(--red-600);
          border: 1px solid var(--red-100);
        }

        .terminal-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .btn-clock-action {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          border: none;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all var(--transition);
        }
        .btn-clock-action:active {
          transform: scale(0.98);
        }
        .btn-clock-action:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        .btn-clock-in {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        }
        .btn-clock-in:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }

        .btn-clock-out {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        }
        .btn-clock-out:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.45);
        }

        .action-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .action-label-group {
          display: flex;
          flex-direction: column;
        }
        .action-main-title {
          font-size: 14px;
          font-weight: 800;
          line-height: 1.2;
        }
        .action-sub-text {
          font-size: 11px;
          opacity: 0.85;
          font-weight: 500;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}
