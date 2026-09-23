import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

function getStatusConfig(status = '') {
  const s = (status || '').toLowerCase();
  if (s === 'hadir') return { label: 'Hadir', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: 'fa-solid fa-circle-check' };
  if (s === 'telat' || s === 'terlambat') return { label: 'Terlambat', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'fa-solid fa-clock' };
  if (s === 'izin') return { label: 'Izin', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'fa-solid fa-file-circle-check' };
  if (s === 'sakit') return { label: 'Sakit', color: '#ec4899', bg: 'rgba(236,72,153,0.12)', icon: 'fa-solid fa-heart-pulse' };
  if (s === 'cuti') return { label: 'Cuti', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: 'fa-solid fa-umbrella-beach' };
  if (s === 'alpha') return { label: 'Alpha', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: 'fa-solid fa-circle-xmark' };
  return { label: status || '–', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'fa-solid fa-circle-info' };
}

function AttendanceRow({ record }) {
  const cfg = getStatusConfig(record.status);
  const dateObj = new Date(record.tanggal);
  const dayStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  const weekdayStr = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });

  return (
    <div className="history-row">
      <div className="hr-date">
        <div className="hr-day">{dayStr}</div>
        <div className="hr-weekday">{weekdayStr}</div>
      </div>
      <div className="hr-times">
        <div className="hr-in" title="Jam Masuk">
          <i className="fa-solid fa-arrow-down" style={{ color: '#10b981' }}></i>
          <span>{record.waktu_masuk || '–'}</span>
        </div>
        <div className="hr-separator">&rarr;</div>
        <div className="hr-out" title="Jam Pulang">
          <i className="fa-solid fa-arrow-up" style={{ color: '#ef4444' }}></i>
          <span>{record.waktu_pulang || '–'}</span>
        </div>
      </div>
      <div className="hr-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
        <i className={cfg.icon}></i>
        <span>{cfg.label}</span>
      </div>
    </div>
  );
}

export default function Riwayat() {
  const { user } = useAuth();
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [bulan, setBulan] = useState(defaultMonth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ hadir: 0, telat: 0, izin: 0, alpha: 0 });

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await api.getHistory(user.id, bulan);
      const list = Array.isArray(data) ? data : (data?.records || []);
      setRecords(list);

      const s = { hadir: 0, telat: 0, izin: 0, alpha: 0 };
      list.forEach(r => {
        const st = (r.status || '').toLowerCase();
        if (st === 'hadir') s.hadir++;
        else if (st === 'telat' || st === 'terlambat') s.telat++;
        else if (st === 'izin' || st === 'sakit' || st === 'cuti') s.izin++;
        else if (st === 'alpha') s.alpha++;
      });
      setSummary(s);
    } catch (e) {
      console.error('History load error:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, bulan]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const header = ['Tanggal', 'Status', 'Waktu Masuk', 'Waktu Pulang'];
    const rows = records.map(r => [
      r.tanggal,
      r.status,
      r.waktu_masuk || '-',
      r.waktu_pulang || '-'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat_presensi_${user?.namaLengkap || 'karyawan'}_${bulan}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      {/* Header Card */}
      <div className="page-header-card">
        <div>
          <h2 className="page-title-h">
            <i className="fa-solid fa-clock-rotate-left"></i> Riwayat Presensi
          </h2>
          <p className="page-subtitle-h">Pantau rekapan kehadiran bulanan Anda</p>
        </div>
        <div className="header-actions-row">
          <input
            type="month"
            value={bulan}
            onChange={e => setBulan(e.target.value)}
            className="month-input"
          />
          <button className="btn-csv" onClick={handleExportCSV} disabled={records.length === 0} title="Unduh format CSV">
            <i className="fa-solid fa-file-csv"></i> Unduh CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-strip">
        {[
          { key: 'hadir', label: 'Hadir', color: '#10b981', icon: 'fa-solid fa-circle-check', count: summary.hadir },
          { key: 'telat', label: 'Terlambat', color: '#f59e0b', icon: 'fa-solid fa-clock', count: summary.telat },
          { key: 'izin', label: 'Izin / Cuti', color: '#3b82f6', icon: 'fa-solid fa-file-circle-check', count: summary.izin },
          { key: 'alpha', label: 'Alpha', color: '#ef4444', icon: 'fa-solid fa-circle-xmark', count: summary.alpha },
        ].map(s => (
          <div key={s.key} className="sum-chip" style={{ '--chip-color': s.color }}>
            <div className="sum-icon-wrap"><i className={s.icon}></i></div>
            <span className="sum-num">{s.count}</span>
            <span className="sum-lbl">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Records List */}
      <div className="history-list-card">
        <div className="history-list-header">
          <span>Daftar Presensi ({records.length} Hari)</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <span>Memuat riwayat kehadiran...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <i className="fa-regular fa-folder-open"></i>
            <p>Tidak ada catatan presensi pada bulan ini</p>
          </div>
        ) : (
          <div className="rows-wrapper">
            {records.map((r, idx) => (
              <AttendanceRow key={r.id || idx} record={r} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .page-header-card {
          background: var(--bg-card);
          border-radius: 18px;
          padding: 20px 22px;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          box-shadow: var(--shadow-sm);
        }
        .page-title-h {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 4px 0;
        }
        .page-title-h i { color: var(--brand); }
        .page-subtitle-h {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        .header-actions-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .month-input {
          padding: 9px 14px;
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 13.5px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          transition: border-color 0.2s;
        }
        .month-input:focus { border-color: var(--brand); }
        .btn-csv {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 12px;
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-csv:hover:not(:disabled) {
          border-color: var(--brand);
          color: var(--brand);
        }
        .btn-csv:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .summary-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 480px) {
          .summary-strip { grid-template-columns: repeat(2, 1fr); }
        }
        .sum-chip {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          box-shadow: var(--shadow-sm);
        }
        .sum-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--chip-color) 15%, transparent);
          color: var(--chip-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .sum-num { font-size: 22px; font-weight: 800; color: var(--text-primary); line-height: 1; }
        .sum-lbl { font-size: 11px; font-weight: 600; color: var(--text-muted); }

        .history-list-card {
          background: var(--bg-card);
          border-radius: 18px;
          border: 1px solid var(--border-color);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .history-list-header {
          padding: 14px 18px;
          background: var(--bg-hover);
          border-bottom: 1px solid var(--border-color);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .rows-wrapper {
          display: flex;
          flex-direction: column;
        }
        .history-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.15s;
          gap: 12px;
        }
        .history-row:last-child { border-bottom: none; }
        .history-row:hover { background: var(--bg-hover); }

        .hr-date {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 50px;
          flex-shrink: 0;
        }
        .hr-day { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .hr-weekday { font-size: 11px; color: var(--text-muted); font-weight: 500; }

        .hr-times {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: var(--text-primary);
          font-family: monospace;
          font-weight: 600;
        }
        .hr-in, .hr-out {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .hr-separator { color: var(--text-muted); font-size: 12px; }

        .hr-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          border-radius: 9999px;
          font-size: 11.5px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .loading-state, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 44px 20px;
          gap: 12px;
          color: var(--text-muted);
          font-size: 13.5px;
        }
        .empty-state i { font-size: 38px; opacity: 0.35; }
        .spinner {
          width: 28px;
          height: 28px;
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
