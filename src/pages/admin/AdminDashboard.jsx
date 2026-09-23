import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

function MetricCard({ icon, label, value, color, subtitle }) {
  return (
    <div className="metric-card" style={{ '--mc': color }}>
      <div className="mc-icon"><i className={icon}></i></div>
      <div className="mc-body">
        <div className="mc-value">{value ?? '0'}</div>
        <div className="mc-label">{label}</div>
        {subtitle && <div className="mc-sub">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ hadir: 0, telat: 0, cuti: 0, izin: 0 });
  const [totalKaryawan, setTotalKaryawan] = useState(0);
  const [absensiList, setAbsensiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [absenDate, setAbsenDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, countRes, absenRes] = await Promise.all([
        api.getDashboardSummary().catch(() => ({ hadir: 0, telat: 0, cuti: 0, izin: 0 })),
        api.getEmployeeCount().catch(() => ({ count: 0 })),
        api.getDailyAttendance(absenDate).catch(() => []),
      ]);

      if (sumRes) setSummary(sumRes);
      if (countRes && typeof countRes.count === 'number') setTotalKaryawan(countRes.count);
      setAbsensiList(Array.isArray(absenRes) ? absenRes : (absenRes?.data || []));
    } catch (e) {
      console.error('Failed to load admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [absenDate]);

  useEffect(() => { loadData(); }, [loadData]);

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const filteredAbsensi = absensiList.filter(row =>
    (row.nama_lengkap || '').toLowerCase().includes(search.toLowerCase()) ||
    (row.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'hadir') return <span className="status-pill status-hadir"><i className="fa-solid fa-check"></i> Hadir</span>;
    if (s === 'telat' || s === 'terlambat') return <span className="status-pill status-terlambat"><i className="fa-solid fa-clock"></i> Telat</span>;
    if (s === 'izin' || s === 'sakit') return <span className="status-pill status-izin"><i className="fa-solid fa-file-lines"></i> {status}</span>;
    if (s === 'cuti') return <span className="status-pill status-cuti"><i className="fa-solid fa-umbrella-beach"></i> Cuti</span>;
    return <span className="status-pill status-alpha">{status || '–'}</span>;
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard Monitoring</h1>
          <p className="admin-page-subtitle">{todayFormatted} &bull; PT Angkasa Ekspres Indonesia</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-refresh" onClick={loadData} disabled={loading}>
            <i className={`fa-solid fa-arrows-rotate ${loading ? 'spin' : ''}`}></i>
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <MetricCard
          icon="fa-solid fa-users"
          label="Total Karyawan"
          value={totalKaryawan}
          color="#3b82f6"
        />
        <MetricCard
          icon="fa-solid fa-circle-check"
          label="Hadir Hari Ini"
          value={summary.hadir}
          color="#10b981"
          subtitle={totalKaryawan > 0 ? `${Math.round((summary.hadir / totalKaryawan) * 100)}% kehadiran` : ''}
        />
        <MetricCard
          icon="fa-solid fa-clock"
          label="Terlambat"
          value={summary.telat}
          color="#f97316"
        />
        <MetricCard
          icon="fa-solid fa-file-signature"
          label="Izin & Cuti"
          value={(summary.izin || 0) + (summary.cuti || 0)}
          color="#8b5cf6"
          subtitle={`Izin: ${summary.izin || 0} | Cuti: ${summary.cuti || 0}`}
        />
      </div>

      {/* Daily Attendance Table Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <i className="fa-solid fa-table-list"></i>
            <span>Log Presensi Harian ({filteredAbsensi.length} Data)</span>
          </div>

          <div className="filter-controls-row">
            <div className="search-box">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Cari nama karyawan..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <input
              type="date"
              value={absenDate}
              onChange={e => setAbsenDate(e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center">
              <div className="spinner"></div>
              <span>Memuat data absensi harian...</span>
            </div>
          ) : filteredAbsensi.length === 0 ? (
            <div className="empty-center">
              <i className="fa-regular fa-folder-open"></i>
              <p>Tidak ada data absensi untuk tanggal {absenDate}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Karyawan</th>
                  <th>Status</th>
                  <th>Jam Masuk</th>
                  <th>Jam Pulang</th>
                  <th>Lokasi GPS</th>
                  <th style={{ textAlign: 'center' }}>Foto Selfie</th>
                </tr>
              </thead>
              <tbody>
                {filteredAbsensi.map((row, i) => (
                  <tr key={i}>
                    <td className="td-no">{i + 1}</td>
                    <td>
                      <div className="td-name">
                        <div className="td-avatar">{(row.nama_lengkap || '?')[0].toUpperCase()}</div>
                        <span className="name-bold">{row.nama_lengkap}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(row.status)}</td>
                    <td className="td-mono">{row.waktu_masuk || '–'}</td>
                    <td className="td-mono">{row.waktu_pulang || '–'}</td>
                    <td className="td-location" title={row.lokasi_masuk || '-'}>
                      {row.lokasi_masuk ? (
                        <span className="location-pill">
                          <i className="fa-solid fa-location-dot"></i> {row.lokasi_masuk}
                        </span>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.foto_masuk ? (
                        <img
                          src={row.foto_masuk}
                          alt="Selfie"
                          className="table-photo-thumb"
                          onClick={() => setPreviewPhoto({
                            img: row.foto_masuk,
                            name: row.nama_lengkap,
                            time: row.waktu_masuk,
                            location: row.lokasi_masuk
                          })}
                          title="Klik untuk perbesar foto"
                        />
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Selfie Photo Preview Modal */}
      {previewPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <div className="modal-photo-box" onClick={e => e.stopPropagation()}>
            <div className="modal-photo-header">
              <div>
                <h3 className="modal-photo-title">{previewPhoto.name}</h3>
                <p className="modal-photo-sub">
                  Masuk: {previewPhoto.time || '–'} &bull; {previewPhoto.location || 'Lokasi kantor'}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setPreviewPhoto(null)}>&times;</button>
            </div>
            <div className="modal-photo-body">
              <img src={previewPhoto.img} alt="Foto Selfie Presensi" className="modal-full-img" />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-page-container {
          padding: 24px 28px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          animation: fadeIn 0.25s ease forwards;
        }

        .admin-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }
        .admin-page-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .admin-page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin: 4px 0 0;
        }

        .btn-refresh {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-refresh:hover:not(:disabled) {
          border-color: var(--brand);
          color: var(--brand);
        }
        .spin { animation: spin 0.8s linear infinite; }

        /* Metrics */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .metrics-grid { grid-template-columns: 1fr; }
        }
        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
          border-left: 4px solid var(--mc);
        }
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .mc-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--mc) 15%, transparent);
          color: var(--mc);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .mc-value {
          font-size: 26px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
        }
        .mc-label {
          font-size: 12.5px;
          color: var(--text-muted);
          font-weight: 600;
          margin-top: 2px;
        }
        .mc-sub {
          font-size: 11px;
          color: var(--mc);
          font-weight: 700;
          margin-top: 3px;
        }

        /* Table Card */
        .admin-card {
          background: var(--bg-card);
          border-radius: 18px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .admin-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 14px;
        }
        .admin-card-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-card-title i { color: var(--brand); }

        .filter-controls-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-box i {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .search-input {
          padding: 8px 14px 8px 34px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          min-width: 200px;
        }
        .search-input:focus { border-color: var(--brand); }
        .date-input {
          padding: 8px 12px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 13px;
          font-family: inherit;
          outline: none;
          cursor: pointer;
        }
        .date-input:focus { border-color: var(--brand); }

        .table-wrapper { overflow-x: auto; }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .data-table th {
          text-align: left;
          padding: 13px 18px;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: var(--bg-hover);
          white-space: nowrap;
        }
        .data-table td {
          padding: 13px 18px;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .data-table tr:hover td { background: var(--bg-hover); }

        .td-no { color: var(--text-muted); font-size: 12.5px; font-weight: 600; }
        .td-name { display: flex; align-items: center; gap: 10px; }
        .name-bold { font-weight: 700; color: var(--text-primary); }
        .td-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(230, 0, 0, 0.12);
          color: var(--brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .td-mono { font-family: monospace; font-weight: 600; color: var(--text-primary); }
        .location-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--text-muted);
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .table-photo-thumb {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          object-fit: cover;
          cursor: pointer;
          border: 1.5px solid var(--border-color);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .table-photo-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 700;
        }
        .status-hadir { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .status-terlambat { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .status-izin { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .status-cuti { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
        .status-alpha { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

        /* Photo Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
          animation: fadeIn 0.2s ease forwards;
        }
        .modal-photo-box {
          background: var(--bg-card);
          border-radius: 18px;
          max-width: 520px;
          width: 100%;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          border: 1px solid var(--border-color);
        }
        .modal-photo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-photo-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .modal-photo-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin: 3px 0 0;
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 22px;
          color: var(--text-muted);
          cursor: pointer;
        }
        .modal-close-btn:hover { color: var(--text-primary); }
        .modal-photo-body {
          padding: 12px;
          background: #000;
          display: flex;
          justify-content: center;
        }
        .modal-full-img {
          width: 100%;
          max-height: 440px;
          object-fit: contain;
          border-radius: 8px;
        }

        .loading-center, .empty-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px;
          gap: 12px;
          color: var(--text-muted);
          font-size: 14px;
        }
        .empty-center i { font-size: 38px; opacity: 0.35; }
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid var(--border-color);
          border-top-color: var(--brand);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
