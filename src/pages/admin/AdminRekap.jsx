import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';

export default function AdminRekap() {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [bulan, setBulan] = useState(defaultMonth);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'detail'
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMonthlyRecap(bulan);
      setRecords(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      console.error('Fetch monthly recap err:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [bulan]);

  useEffect(() => { load(); }, [load]);

  // Aggregate stats per employee
  const employeeSummary = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const name = r.nama_lengkap || 'Tanpa Nama';
      if (!map[name]) {
        map[name] = { nama: name, hadir: 0, telat: 0, izin: 0, cuti: 0, total: 0 };
      }
      const st = (r.status || '').toLowerCase();
      if (st === 'hadir') map[name].hadir++;
      else if (st === 'telat' || st === 'terlambat') map[name].telat++;
      else if (st === 'izin' || st === 'sakit') map[name].izin++;
      else if (st === 'cuti') map[name].cuti++;
      map[name].total++;
    });

    return Object.values(map).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [records]);

  const filteredSummary = employeeSummary.filter(e =>
    e.nama.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRecords = records.filter(r =>
    (r.nama_lengkap || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.tanggal || '').includes(search) ||
    (r.status || '').toLowerCase().includes(search.toLowerCase())
  );

  const downloadExcel = () => {
    const url = api.downloadRecapExcelUrl(bulan);
    window.open(url, '_blank');
  };

  const monthLabel = new Date(bulan + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const getStatusBadge = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'hadir') return <span className="rekap-badge green">Hadir</span>;
    if (s === 'telat' || s === 'terlambat') return <span className="rekap-badge yellow">Telat</span>;
    if (s === 'izin' || s === 'sakit') return <span className="rekap-badge purple">{status}</span>;
    if (s === 'cuti') return <span className="rekap-badge blue">Cuti</span>;
    return <span className="rekap-badge red">{status || '–'}</span>;
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Rekap Absensi Bulanan</h1>
          <p className="admin-page-subtitle">Laporan presensi seluruh staf periode {monthLabel}</p>
        </div>

        <div className="header-actions">
          <input
            type="month"
            value={bulan}
            onChange={e => setBulan(e.target.value)}
            className="month-input"
          />
          <button className="btn-download" onClick={downloadExcel} title="Unduh Spreadsheet Excel">
            <i className="fa-solid fa-file-excel"></i>
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          {/* View Mode Toggle */}
          <div className="view-toggle-wrap">
            <button
              className={`view-tab-btn ${viewMode === 'summary' ? 'active' : ''}`}
              onClick={() => setViewMode('summary')}
            >
              <i className="fa-solid fa-users-viewfinder"></i> Ringkasan per Karyawan ({employeeSummary.length})
            </button>
            <button
              className={`view-tab-btn ${viewMode === 'detail' ? 'active' : ''}`}
              onClick={() => setViewMode('detail')}
            >
              <i className="fa-solid fa-list-check"></i> Detail Harian ({records.length})
            </button>
          </div>

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
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center">
              <div className="spinner"></div>
              <span>Mengumpulkan data rekap bulanan...</span>
            </div>
          ) : viewMode === 'summary' ? (
            filteredSummary.length === 0 ? (
              <div className="empty-center">
                <i className="fa-regular fa-folder-open"></i>
                <p>Tidak ada data rekapitulasi kehadiran untuk bulan {monthLabel}</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>No</th>
                    <th>Nama Karyawan</th>
                    <th style={{ textAlign: 'center' }}>Hadir Tepat</th>
                    <th style={{ textAlign: 'center' }}>Terlambat</th>
                    <th style={{ textAlign: 'center' }}>Izin / Sakit</th>
                    <th style={{ textAlign: 'center' }}>Cuti</th>
                    <th style={{ textAlign: 'center' }}>Total Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSummary.map((r, i) => (
                    <tr key={i}>
                      <td className="td-no">{i + 1}</td>
                      <td>
                        <div className="td-name">
                          <div className="td-avatar">{(r.nama || '?')[0].toUpperCase()}</div>
                          <span className="name-bold">{r.nama}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rekap-badge green">{r.hadir}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rekap-badge yellow">{r.telat}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rekap-badge purple">{r.izin}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="rekap-badge blue">{r.cuti}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <strong className="total-badge">{r.total} Hari</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            filteredRecords.length === 0 ? (
              <div className="empty-center">
                <i className="fa-regular fa-folder-open"></i>
                <p>Tidak ada data log absensi untuk bulan {monthLabel}</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 50 }}>No</th>
                    <th>Tanggal</th>
                    <th>Nama Karyawan</th>
                    <th>Status</th>
                    <th>Waktu Masuk</th>
                    <th>Waktu Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((d, i) => {
                    const formattedDate = new Date(d.tanggal).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    });
                    return (
                      <tr key={i}>
                        <td className="td-no">{i + 1}</td>
                        <td className="td-date">{formattedDate}</td>
                        <td>
                          <div className="td-name">
                            <div className="td-avatar">{(d.nama_lengkap || '?')[0].toUpperCase()}</div>
                            <span className="name-bold">{d.nama_lengkap}</span>
                          </div>
                        </td>
                        <td>{getStatusBadge(d.status)}</td>
                        <td className="td-mono">{d.waktu_masuk || '–'}</td>
                        <td className="td-mono">{d.waktu_pulang || '–'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .month-input {
          padding: 9px 14px;
          border: 1.5px solid var(--border-color);
          border-radius: 12px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 13.5px;
          font-family: inherit;
          cursor: pointer;
          outline: none;
        }
        .month-input:focus { border-color: var(--brand); }

        .btn-download {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }
        .btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
        }

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
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          flex-wrap: wrap;
          gap: 14px;
        }

        .view-toggle-wrap {
          display: flex;
          gap: 6px;
          background: var(--bg-page);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
        }
        .view-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border: none;
          border-radius: 9px;
          background: transparent;
          color: var(--text-muted);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .view-tab-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          font-weight: 700;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
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
          min-width: 220px;
        }
        .search-input:focus { border-color: var(--brand); }

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
        .td-date { font-weight: 600; color: var(--text-primary); }

        .rekap-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
        }
        .rekap-badge.green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .rekap-badge.yellow { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .rekap-badge.purple { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
        .rekap-badge.blue { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
        .rekap-badge.red { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

        .total-badge {
          display: inline-block;
          padding: 4px 10px;
          background: var(--bg-page);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          font-size: 12.5px;
          color: var(--text-primary);
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
