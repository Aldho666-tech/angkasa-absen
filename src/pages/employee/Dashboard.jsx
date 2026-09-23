import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import BiometricScanner from '../../components/employee/BiometricScanner';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveDuration, setLiveDuration] = useState('00:00:00');
  const [monthlyStats, setMonthlyStats] = useState({ hadir: 0, telat: 0, izin: 0, alpha: 0 });

  // Live Digital Clock
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch Attendance Data & Monthly History
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

      const historyList = Array.isArray(historyRes) ? historyRes : (historyRes?.records || []);
      const stats = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
      historyList.forEach(r => {
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

  // Live Work Duration Calculation
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
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      setLiveDuration(`${hrs}:${mins}:${secs}`);
    };

    calcDuration();
    if (!attendance.waktu_pulang) {
      const timer = setInterval(calcDuration, 1000);
      return () => clearInterval(timer);
    }
  }, [attendance?.waktu_masuk, attendance?.waktu_pulang]);

  const formatClock = (date) =>
    date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (date) =>
    date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const getStatusBadge = () => {
    if (!attendance?.status) {
      return <span className="stat-pill gray"><i className="fas fa-clock"></i> Belum Absen</span>;
    }
    const s = attendance.status.toLowerCase();
    if (s === 'hadir') return <span className="stat-pill green"><i className="fas fa-check-circle"></i> Hadir Tepat Waktu</span>;
    if (s === 'telat' || s === 'terlambat') return <span className="stat-pill orange"><i className="fas fa-clock"></i> Terlambat</span>;
    if (s === 'izin' || s === 'sakit') return <span className="stat-pill blue"><i className="fas fa-file-lines"></i> {attendance.status}</span>;
    if (s === 'cuti') return <span className="stat-pill purple"><i className="fas fa-umbrella-beach"></i> Cuti</span>;
    return <span className="stat-pill gray">{attendance.status}</span>;
  };

  return (
    <div className="employee-dashboard-container">
      {/* 1. WELCOME HERO BANNER */}
      <section className="welcome-banner">
        <div className="banner-orb orb-1"></div>
        <div className="banner-orb orb-2"></div>
        <div className="welcome-text-group">
          <div className="welcome-badge">
            <i className="fas fa-shield-alt"></i> Portal Presensi Karyawan
          </div>
          <h1 className="welcome-name">
            Selamat Datang, <span>{user?.namaLengkap || user?.nama || 'Karyawan'}</span>! 👋
          </h1>
          <p className="welcome-meta">
            <i className="fas fa-calendar-day"></i> {formatDate(currentTime)} &bull; PT Angkasa Ekspres Indonesia
          </p>
        </div>

        {/* Floating Monthly Metrics Glass Cards */}
        <div className="welcome-metrics-glass">
          <div className="glass-metric">
            <div className="metric-num text-green">{monthlyStats.hadir}</div>
            <div className="metric-lbl"><i className="fas fa-check-circle"></i> Hadir</div>
          </div>
          <div className="glass-metric">
            <div className="metric-num text-orange">{monthlyStats.telat}</div>
            <div className="metric-lbl"><i className="fas fa-clock"></i> Telat</div>
          </div>
          <div className="glass-metric">
            <div className="metric-num text-blue">{monthlyStats.izin}</div>
            <div className="metric-lbl"><i className="fas fa-file-circle-check"></i> Izin</div>
          </div>
        </div>
      </section>

      {/* 2. 4-CARD BALANCED METRICS STRIP */}
      <section className="metrics-strip-grid">
        {/* Jam Masuk */}
        <div className="metric-strip-card">
          <div className="mstrip-top">
            <div className="mstrip-icon green"><i className="fas fa-arrow-down"></i></div>
            <span className="stat-pill green">Masuk</span>
          </div>
          <div className="mstrip-value">{loading ? '...' : (attendance?.waktu_masuk || '–')}</div>
          <div className="mstrip-desc">Jam Masuk Hari Ini</div>
        </div>

        {/* Jam Pulang */}
        <div className="metric-strip-card">
          <div className="mstrip-top">
            <div className="mstrip-icon red"><i className="fas fa-arrow-up"></i></div>
            <span className="stat-pill red">Pulang</span>
          </div>
          <div className="mstrip-value">{loading ? '...' : (attendance?.waktu_pulang || '–')}</div>
          <div className="mstrip-desc">Jam Pulang Hari Ini</div>
        </div>

        {/* Durasi Kerja Live */}
        <div className="metric-strip-card">
          <div className="mstrip-top">
            <div className="mstrip-icon blue"><i className="fas fa-stopwatch"></i></div>
            <span className="stat-pill blue"><i className="fas fa-bolt"></i> Live Timer</span>
          </div>
          <div className="mstrip-value mono-num">{loading ? '...' : liveDuration}</div>
          <div className="mstrip-desc">Total Durasi Kerja</div>
        </div>

        {/* Status Hari Ini */}
        <div className="metric-strip-card">
          <div className="mstrip-top">
            <div className="mstrip-icon orange"><i className="fas fa-fingerprint"></i></div>
            <span className="stat-pill orange">Status</span>
          </div>
          <div className="mstrip-value" style={{ fontSize: '15px' }}>
            {loading ? '...' : (attendance?.status || 'Belum Absen')}
          </div>
          <div className="mstrip-desc">Status Presensi Hari Ini</div>
        </div>
      </section>

      {/* 3. MAIN TERMINAL & STATUS HUB (2-COLUMN GRID) */}
      <section className="dashboard-main-grid">
        {/* Left Column: Biometric Camera & GPS Geofence Terminal */}
        <div className="dashboard-terminal-col">
          <BiometricScanner
            user={user}
            todayAttendance={attendance}
            onAttendanceUpdated={loadData}
          />
        </div>

        {/* Right Column: Digital Clock Box, Quick Actions, and Today's Journey Details */}
        <div className="dashboard-status-col">
          {/* Digital Clock Box */}
          <div className="digital-clock-box">
            <div className="clock-time-display">{formatClock(currentTime)}</div>
            <div className="clock-date-display">{formatDate(currentTime)}</div>
            <div className="clock-badge-row">
              {getStatusBadge()}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="quick-actions-card">
            <h3 className="section-heading">
              <i className="fas fa-bolt" style={{ color: 'var(--brand)' }}></i> Aksi Cepat
            </h3>
            <div className="quick-buttons-row">
              <button
                className="qbtn"
                onClick={() => navigate('/employee/izin')}
                title="Ajukan Izin / Sakit / Cuti"
              >
                <div className="qbtn-icon blue"><i className="fas fa-file-circle-plus"></i></div>
                <span>Ajukan Izin</span>
              </button>

              <button
                className="qbtn"
                onClick={() => navigate('/employee/riwayat')}
                title="Lihat Riwayat Presensi Bulanan"
              >
                <div className="qbtn-icon orange"><i className="fas fa-clock-rotate-left"></i></div>
                <span>Riwayat</span>
              </button>

              <button
                className="qbtn"
                onClick={() => navigate('/employee/profil')}
                title="Kelola Profil & Sandi"
              >
                <div className="qbtn-icon purple"><i className="fas fa-user-gear"></i></div>
                <span>Profil</span>
              </button>

              <button
                className="qbtn"
                onClick={() => window.print()}
                title="Cetak Bukti Presensi"
              >
                <div className="qbtn-icon green"><i className="fas fa-print"></i></div>
                <span>Cetak Slip</span>
              </button>
            </div>
          </div>

          {/* Today's Journey & Detail Card */}
          <div className="today-journey-card">
            <h3 className="section-heading">
              <i className="fas fa-timeline" style={{ color: 'var(--brand)' }}></i> Catatan Presensi Hari Ini
            </h3>

            {loading ? (
              <div className="loader-box">
                <div className="spinner"></div>
                <span>Memeriksa status kehadiran...</span>
              </div>
            ) : attendance ? (
              <div className="journey-list">
                <div className="journey-item">
                  <div className="journey-dot green"></div>
                  <div className="journey-info">
                    <div className="journey-title">Absen Masuk</div>
                    <div className="journey-val">
                      {attendance.waktu_masuk || '–'}
                      {attendance.lokasi_masuk && <span className="journey-sub"> &bull; {attendance.lokasi_masuk}</span>}
                    </div>
                  </div>
                  {attendance.foto_masuk && (
                    <img src={attendance.foto_masuk} alt="Selfie Masuk" className="journey-thumb" />
                  )}
                </div>

                <div className="journey-item">
                  <div className="journey-dot blue"></div>
                  <div className="journey-info">
                    <div className="journey-title">Durasi Kerja Berjalan</div>
                    <div className="journey-val mono-num">{liveDuration}</div>
                  </div>
                </div>

                <div className="journey-item">
                  <div className={`journey-dot ${attendance.waktu_pulang ? 'red' : 'gray'}`}></div>
                  <div className="journey-info">
                    <div className="journey-title">Absen Pulang</div>
                    <div className="journey-val">
                      {attendance.waktu_pulang ? (
                        <>
                          {attendance.waktu_pulang}
                          {attendance.lokasi_pulang && <span className="journey-sub"> &bull; {attendance.lokasi_pulang}</span>}
                        </>
                      ) : (
                        <span className="text-muted">Belum absen pulang</span>
                      )}
                    </div>
                  </div>
                  {attendance.foto_pulang && (
                    <img src={attendance.foto_pulang} alt="Selfie Pulang" className="journey-thumb" />
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-journey-state">
                <i className="fas fa-calendar-xmark"></i>
                <p>Anda belum melakukan presensi hari ini.</p>
                <span className="hint-text">Gunakan terminal kamera di sebelah kiri untuk absen masuk.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .employee-dashboard-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 16px 40px;
          animation: fadeIn 0.25s ease forwards;
        }

        /* 1. WELCOME BANNER */
        .welcome-banner {
          position: relative;
          background: linear-gradient(135deg, #e60000 0%, #c00000 50%, #990000 100%);
          border-radius: 20px;
          padding: 26px 28px;
          color: #ffffff;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(230, 0, 0, 0.28);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .banner-orb {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          pointer-events: none;
        }
        .orb-1 { width: 220px; height: 220px; top: -80px; right: -50px; }
        .orb-2 { width: 140px; height: 140px; bottom: -50px; left: 30%; }

        .welcome-text-group { position: relative; z-index: 2; }
        .welcome-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
        .welcome-name {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 6px 0;
          line-height: 1.25;
        }
        .welcome-meta {
          font-size: 13px;
          opacity: 0.9;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .welcome-metrics-glass {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          z-index: 2;
        }
        .glass-metric {
          background: rgba(255, 255, 255, 0.16);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 14px;
          padding: 12px 18px;
          text-align: center;
          min-width: 82px;
        }
        .metric-num {
          font-size: 22px;
          font-weight: 800;
          line-height: 1;
          color: #ffffff;
        }
        .metric-lbl {
          font-size: 11px;
          font-weight: 600;
          opacity: 0.95;
          margin-top: 4px;
        }

        /* 2. 4-CARD STRIP */
        .metrics-strip-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .metrics-strip-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .metrics-strip-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        .metric-strip-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .metric-strip-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .mstrip-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .mstrip-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }
        .mstrip-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .mstrip-icon.red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .mstrip-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .mstrip-icon.orange { background: rgba(249, 115, 22, 0.15); color: #f97316; }

        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
        }
        .stat-pill.green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .stat-pill.red { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
        .stat-pill.blue { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .stat-pill.orange { background: rgba(249, 115, 22, 0.12); color: #f97316; }
        .stat-pill.purple { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
        .stat-pill.gray { background: var(--bg-hover); color: var(--text-muted); }

        .mstrip-value {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .mstrip-desc {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .mono-num {
          font-variant-numeric: tabular-nums;
          font-family: monospace;
          letter-spacing: -0.5px;
        }

        /* 3. MAIN 2-COLUMN GRID */
        .dashboard-main-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 20px;
          align-items: flex-start;
        }
        @media (max-width: 900px) {
          .dashboard-main-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-status-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Digital Clock Box */
        .digital-clock-box {
          background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 20px;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }
        .clock-time-display {
          font-size: 38px;
          font-weight: 900;
          color: var(--text-primary);
          font-family: monospace;
          letter-spacing: -1px;
          line-height: 1.1;
        }
        .clock-date-display {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
          font-weight: 500;
        }
        .clock-badge-row {
          margin-top: 12px;
          display: flex;
          justify-content: center;
        }

        /* Quick Actions Card */
        .quick-actions-card, .today-journey-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
        }
        .section-heading {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 14px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .quick-buttons-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 480px) {
          .quick-buttons-row { grid-template-columns: repeat(2, 1fr); }
        }
        .qbtn {
          background: var(--bg-page);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 12px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .qbtn:hover {
          transform: translateY(-2px);
          border-color: var(--brand);
          box-shadow: var(--shadow-sm);
        }
        .qbtn-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
        }
        .qbtn-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .qbtn-icon.orange { background: rgba(249, 115, 22, 0.15); color: #f97316; }
        .qbtn-icon.purple { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
        .qbtn-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .qbtn span {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* Journey List */
        .journey-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .journey-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          background: var(--bg-page);
          border: 1px solid var(--border-color);
          border-radius: 12px;
        }
        .journey-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .journey-dot.green { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
        .journey-dot.blue { background: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.5); }
        .journey-dot.red { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
        .journey-dot.gray { background: var(--text-muted); }

        .journey-info { flex: 1; }
        .journey-title { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
        .journey-val { font-size: 13.5px; font-weight: 700; color: var(--text-primary); margin-top: 2px; }
        .journey-sub { font-size: 11px; color: var(--text-muted); font-weight: 400; }
        .journey-thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid var(--border-color);
        }

        .empty-journey-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 24px 12px;
          color: var(--text-muted);
          text-align: center;
        }
        .empty-journey-state i { font-size: 32px; opacity: 0.4; }
        .empty-journey-state p { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
        .hint-text { font-size: 11px; color: var(--text-muted); }

        .loader-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border-color);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
