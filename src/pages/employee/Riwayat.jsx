import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './riwayat.css';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function Riwayat() {
  const { user } = useAuth();

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();

  // State: selected month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`
  );
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  // CSV download state
  const [csvState, setCsvState] = useState('idle'); // 'idle' | 'exporting' | 'saved'

  // PDF modal state
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Selected item modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Show all records toggle
  const [showAll, setShowAll] = useState(false);

  // Attendance Records
  const [records, setRecords] = useState([
    {
      id: 1,
      tanggal: '2026-09-23',
      hari: 'Rabu',
      lokasi: 'Cuti Tahunan',
      status: 'Cuti Terencana',
      statusType: 'cuti',
      masuk: '08:00:00',
      pulang: '16:01:42',
      durasi: '8j 01m',
      metode: 'GPS Terverifikasi',
      icon: 'calendar_today',
      badgeIcon: 'beach_access',
    },
    {
      id: 2,
      tanggal: '2026-09-22',
      hari: 'Selasa',
      lokasi: 'Kantor Pusat HQ',
      status: 'Hadir Tepat',
      statusType: 'hadir',
      masuk: '07:55:10',
      pulang: '17:05:22',
      durasi: '9j 10m',
      metode: 'Biometrik • 9j 10m',
      icon: 'fingerprint',
      badgeIcon: 'check_circle',
    },
    {
      id: 3,
      tanggal: '2026-09-21',
      hari: 'Senin',
      lokasi: 'Kantor Pusat HQ',
      status: 'Hadir Tepat',
      statusType: 'hadir',
      masuk: '07:58:30',
      pulang: '17:02:15',
      durasi: '9j 03m',
      metode: 'Biometrik • 9j 03m',
      icon: 'fingerprint',
      badgeIcon: 'check_circle',
    },
    {
      id: 4,
      tanggal: '2026-09-18',
      hari: 'Jumat',
      lokasi: 'Field Dispatch',
      status: 'Hadir Tepat',
      statusType: 'hadir',
      masuk: '07:50:00',
      pulang: '16:30:00',
      durasi: '8j 40m',
      metode: 'Durasi 8j 40m',
      icon: 'location_on',
      badgeIcon: 'check_circle',
    },
    {
      id: 5,
      tanggal: '2026-09-17',
      hari: 'Kamis',
      lokasi: 'Kantor Pusat HQ',
      status: 'Hadir Tepat',
      statusType: 'hadir',
      masuk: '07:52:14',
      pulang: '17:01:10',
      durasi: '9j 08m',
      metode: 'Biometrik • 9j 08m',
      icon: 'fingerprint',
      badgeIcon: 'check_circle',
    },
  ]);

  // Load from API if user is available
  useEffect(() => {
    if (!user?.id) return;
    api.getHistory?.(user.id, selectedMonth)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.records || [];
        if (list.length > 0) {
          const mapped = list.map((r, i) => {
            const isHadir = r.status === 'Hadir' || !r.status;
            const isCuti = r.status === 'Cuti' || r.status === 'Izin';
            const isTerlambat = r.status === 'Terlambat';
            return {
              id: r.id || i,
              tanggal: r.tanggal,
              hari: new Date(r.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }),
              lokasi: r.lokasi || (isCuti ? 'Cuti Tahunan' : 'Kantor Pusat HQ'),
              status: isCuti ? 'Cuti Terencana' : isTerlambat ? 'Terlambat' : 'Hadir Tepat',
              statusType: isCuti ? 'cuti' : isTerlambat ? 'terlambat' : isHadir ? 'hadir' : 'alpha',
              masuk: r.waktu_masuk || '08:00:00',
              pulang: r.waktu_pulang || '17:00:00',
              durasi: r.durasi || '9j 00m',
              metode: isCuti ? 'GPS Terverifikasi' : 'Biometrik FaceID',
              icon: isCuti ? 'calendar_today' : 'fingerprint',
              badgeIcon: isCuti ? 'beach_access' : isTerlambat ? 'schedule' : 'check_circle',
            };
          });
          setRecords(mapped);
        }
      })
      .catch(() => {});
  }, [user?.id, selectedMonth]);

  // Format month title
  const [selectedYearStr, selectedMonthStr] = selectedMonth.split('-');
  const selectedMonthNum = parseInt(selectedMonthStr, 10);
  const monthLabel = `${MONTH_NAMES[selectedMonthNum - 1]} ${selectedYearStr}`;

  // Month list for selection dropdown
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonthIndex - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return {
      value: `${y}-${m}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${y}`,
    };
  });

  // Calculate statistics
  const stats = {
    hadir: records.filter((r) => r.statusType === 'hadir').length || 21,
    terlambat: records.filter((r) => r.statusType === 'terlambat').length || 0,
    izin: records.filter((r) => r.statusType === 'cuti').length || 1,
    alpha: records.filter((r) => r.statusType === 'alpha').length || 0,
  };
  const totalDays = stats.hadir + stats.terlambat + stats.izin + stats.alpha;
  const hadirPct = totalDays > 0 ? ((stats.hadir / totalDays) * 100).toFixed(1) : '95.4';

  // Handle CSV Download
  const handleDownloadCsv = () => {
    if (csvState !== 'idle') return;
    setCsvState('exporting');

    setTimeout(() => {
      const headers = ['No', 'Tanggal', 'Hari', 'Lokasi', 'Status', 'Masuk', 'Pulang', 'Metode'];
      const rows = records.map((r, idx) => [
        idx + 1,
        r.tanggal,
        r.hari,
        `"${r.lokasi}"`,
        r.status,
        r.masuk,
        r.pulang,
        `"${r.metode}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Presensi_Angkasa_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCsvState('saved');
      setTimeout(() => {
        setCsvState('idle');
      }, 1500);
    }, 1000);
  };

  const formatIndoDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const displayedRecords = showAll ? records : records.slice(0, 4);

  return (
    <div className="rw-page">
      <div className="rw-content">

        {/* ── 1. Top Banner / Filter Module ── */}
        <section className="rw-filter-card">
          <div className="rw-filter-top">
            <div className="rw-filter-title-col">
              <div className="rw-filter-title-row">
                <span className="material-symbols-outlined rw-filter-icon" style={{ fontVariationSettings: "'FILL' 1" }}>
                  history_toggle_off
                </span>
                <h1 className="rw-filter-title">Riwayat Presensi</h1>
              </div>
              <p className="rw-filter-sub">Pantau rekapan kehadiran bulanan Anda</p>
            </div>
            <div className="rw-live-badge">
              <span className="rw-live-dot"></span>
              <span className="rw-live-text">Aktif</span>
            </div>
          </div>

          {/* Controls: month select & CSV */}
          <div className="rw-controls-row">
            <button
              id="monthFilterBtn"
              type="button"
              className="rw-month-btn"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
            >
              <div className="rw-month-btn-left">
                <span className="material-symbols-outlined">calendar_month</span>
                <span className="rw-month-btn-text">{monthLabel}</span>
              </div>
              <span className={`material-symbols-outlined rw-month-chevron ${isMonthPickerOpen ? 'open' : ''}`}>
                expand_more
              </span>
            </button>

            {isMonthPickerOpen && (
              <div className="rw-month-popover">
                {monthOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(opt.value);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`rw-month-item ${selectedMonth === opt.value ? 'active' : ''}`}
                  >
                    <span>{opt.label}</span>
                    {selectedMonth === opt.value && (
                      <span className="material-symbols-outlined">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              id="downloadCsvBtn"
              type="button"
              className="rw-csv-btn"
              onClick={handleDownloadCsv}
              disabled={csvState !== 'idle'}
            >
              {csvState === 'exporting' ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  <span>Mengekspor...</span>
                </>
              ) : csvState === 'saved' ? (
                <>
                  <span className="material-symbols-outlined">check</span>
                  <span>Tersimpan</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">sim_card_download</span>
                  <span>Unduh CSV</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* ── 2. 4-Grid Summary Stat Cards ── */}
        <section className="rw-stats-grid">
          {/* Card 1: Hadir Tepat */}
          <div className="rw-stat-card">
            <div className="rw-stat-top">
              <div className="rw-stat-icon-wrap green">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <span className="rw-stat-pill green">{hadirPct}%</span>
            </div>
            <div>
              <span className="rw-stat-val">{stats.hadir}</span>
              <span className="rw-stat-lbl">Hadir Tepat</span>
            </div>
          </div>

          {/* Card 2: Terlambat */}
          <div className="rw-stat-card">
            <div className="rw-stat-top">
              <div className="rw-stat-icon-wrap amber">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  schedule
                </span>
              </div>
              <span className="rw-stat-pill amber">Disiplin</span>
            </div>
            <div>
              <span className="rw-stat-val">{stats.terlambat}</span>
              <span className="rw-stat-lbl">Terlambat</span>
            </div>
          </div>

          {/* Card 3: Izin / Cuti */}
          <div className="rw-stat-card">
            <div className="rw-stat-top">
              <div className="rw-stat-icon-wrap rose">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  beach_access
                </span>
              </div>
              <span className="rw-stat-pill rose">Sah</span>
            </div>
            <div>
              <span className="rw-stat-val">{stats.izin}</span>
              <span className="rw-stat-lbl">Izin / Cuti</span>
            </div>
          </div>

          {/* Card 4: Alpha */}
          <div className="rw-stat-card">
            <div className="rw-stat-top">
              <div className="rw-stat-icon-wrap slate">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cancel
                </span>
              </div>
              <span className="rw-stat-pill slate">Nihil</span>
            </div>
            <div>
              <span className="rw-stat-val">{stats.alpha}</span>
              <span className="rw-stat-lbl">Tanpa Alasan</span>
            </div>
          </div>
        </section>

        {/* ── 3. Hero Dedikasi Card ── */}
        <section className="rw-hero-card">
          <div className="rw-hero-spark-1"></div>
          <div className="rw-hero-spark-2"></div>
          <div className="rw-hero-inner">
            <div className="rw-hero-left">
              <div className="rw-hero-icon-wrap">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  military_tech
                </span>
              </div>
              <div className="rw-hero-text-col">
                <div className="rw-hero-title-row">
                  <span className="rw-hero-title">Dedikasi Kerja</span>
                  <span className="rw-hero-pct">98%</span>
                </div>
                <p className="rw-hero-sub">Tidak ada keterlambatan tercatat bulan ini.</p>
              </div>
            </div>
            <div className="rw-hero-verified">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
        </section>

        {/* ── 4. Daftar Presensi Section ── */}
        <section className="rw-list-sec">
          <div className="rw-list-header">
            <div className="rw-list-header-left">
              <h2 className="rw-list-title">Presensi Bulan Ini</h2>
              <span className="rw-list-count">22 Hari Kerja</span>
            </div>
            <button
              type="button"
              className="rw-list-toggle"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Tampilkan Sebagian' : 'Lihat Semua'}
            </button>
          </div>

          {displayedRecords.map((item) => {
            const isHadir = item.statusType === 'hadir';
            const isCuti = item.statusType === 'cuti';
            const isTerlambat = item.statusType === 'terlambat';
            const statusColor = isCuti ? 'rose' : isTerlambat ? 'amber' : 'green';

            return (
              <div
                key={item.id}
                className="rw-card"
                onClick={() => setSelectedRecord(item)}
              >
                <div className="rw-card-top">
                  <div className="rw-card-top-left">
                    <div className={`rw-card-avatar ${statusColor}`}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <span className="rw-card-date">{formatIndoDate(item.tanggal)}</span>
                      <span className="rw-card-sub">{item.hari} &bull; {item.lokasi}</span>
                    </div>
                  </div>

                  <span className={`rw-card-status ${statusColor}`}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: isHadir ? "'FILL' 1" : 'normal' }}
                    >
                      {item.badgeIcon}
                    </span>
                    {item.status}
                  </span>
                </div>

                <div className="rw-card-bot">
                  <div className="rw-card-times">
                    <div className="rw-card-time-in">
                      <span className="material-symbols-outlined">south_east</span>
                      <span>{item.masuk}</span>
                    </div>
                    <span className="rw-card-time-dot">&bull;</span>
                    <div className="rw-card-time-out">
                      <span className="material-symbols-outlined">north_east</span>
                      <span>{item.pulang}</span>
                    </div>
                  </div>
                  <div className="rw-card-method">
                    {isCuti ? (
                      <>
                        <span className="material-symbols-outlined green">verified</span>
                        <span>GPS Terverifikasi</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined pink">face</span>
                        <span>{item.metode}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── 5. Bottom HR Sync Card ── */}
        <section className="rw-sync-card">
          <div className="rw-sync-left">
            <div className="rw-sync-icon-wrap">
              <span className="material-symbols-outlined">cloud_sync</span>
            </div>
            <div className="rw-sync-text-col">
              <span className="rw-sync-title">Laporan PDF Terintegrasi</span>
              <span className="rw-sync-sub">Sinkron otomatis HR Angkasa Cloud</span>
            </div>
          </div>
          <button
            id="viewPdfBtn"
            type="button"
            className="rw-sync-btn"
            onClick={() => setShowPdfModal(true)}
          >
            <span>Cetak</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </section>

      </div>

      {/* ── Modal Detail Presensi ── */}
      {selectedRecord && (
        <div className="rw-modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <div className="rw-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="rw-modal-header">
              <div className="rw-modal-header-left">
                <span className="material-symbols-outlined" style={{ color: '#e11d48' }}>assignment</span>
                <h3 className="rw-modal-title">Detail Presensi</h3>
              </div>
              <button type="button" className="rw-modal-close" onClick={() => setSelectedRecord(null)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <div className="rw-modal-row">
                <span className="rw-modal-label">Tanggal</span>
                <span className="rw-modal-val">{formatIndoDate(selectedRecord.tanggal)} ({selectedRecord.hari})</span>
              </div>
              <div className="rw-modal-row">
                <span className="rw-modal-label">Lokasi / Gate</span>
                <span className="rw-modal-val">{selectedRecord.lokasi}</span>
              </div>
              <div className="rw-modal-row">
                <span className="rw-modal-label">Status Kehadiran</span>
                <span className="rw-modal-val rose">{selectedRecord.status}</span>
              </div>
              <div className="rw-modal-row">
                <span className="rw-modal-label">Jam Masuk</span>
                <span className="rw-modal-val green">{selectedRecord.masuk} WIB</span>
              </div>
              <div className="rw-modal-row">
                <span className="rw-modal-label">Jam Pulang</span>
                <span className="rw-modal-val rose">{selectedRecord.pulang} WIB</span>
              </div>
              <div className="rw-modal-row">
                <span className="rw-modal-label">Verifikasi</span>
                <span className="rw-modal-val">{selectedRecord.metode}</span>
              </div>
            </div>

            <button type="button" className="rw-modal-btn-full" onClick={() => setSelectedRecord(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Cetak PDF / Laporan ── */}
      {showPdfModal && (
        <div className="rw-modal-backdrop" onClick={() => setShowPdfModal(false)}>
          <div className="rw-modal-card" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="rw-modal-header">
              <div className="rw-modal-header-left">
                <img src="/LOGO.png" alt="Logo" style={{ height: '24px', width: 'auto' }} />
                <h3 className="rw-modal-title">Rekap Presensi Bulanan</h3>
              </div>
              <button type="button" className="rw-modal-close" onClick={() => setShowPdfModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div style={{ background: 'rgba(239,244,255,0.6)', padding: '12px', borderRadius: '16px', fontSize: '12px', color: '#545f73', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 4px 0' }}><strong>Karyawan:</strong> {user?.nama || 'Aldho Lega Pratama'} (NIP: {user?.nip || '2026-AP-0842'})</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>Periode:</strong> {monthLabel}</p>
              <p style={{ margin: 0 }}><strong>Ringkasan:</strong> Hadir {stats.hadir} hari &bull; Terlambat {stats.terlambat} hari &bull; Izin {stats.izin} hari</p>
            </div>

            <div style={{ border: '1px solid #e5eeff', borderRadius: '16px', overflow: 'hidden', fontSize: '11px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#eff4ff', color: '#545f73', borderBottom: '1px solid #e5eeff' }}>
                    <th style={{ padding: '8px' }}>Tgl</th>
                    <th style={{ padding: '8px' }}>Status</th>
                    <th style={{ padding: '8px' }}>Masuk</th>
                    <th style={{ padding: '8px' }}>Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eff4ff' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{r.tanggal.slice(8)} Sep</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '9999px', fontSize: '10px', fontWeight: 700,
                          background: r.statusType === 'hadir' ? '#d1fae5' : '#ffdada',
                          color: r.statusType === 'hadir' ? '#047857' : '#b80035'
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#047857', fontWeight: 600 }}>{r.masuk}</td>
                      <td style={{ padding: '8px', color: '#e11d48', fontWeight: 600 }}>{r.pulang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                style={{ flex: 1, height: '44px', borderRadius: '9999px', background: '#eff4ff', color: '#545f73', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => { window.print(); setShowPdfModal(false); }}
                style={{ flex: 1, height: '44px', borderRadius: '9999px', background: '#e11d48', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                <span>Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
