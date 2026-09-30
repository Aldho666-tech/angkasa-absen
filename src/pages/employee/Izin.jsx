import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import './izin.css';

const CATEGORIES = [
  {
    id: 'sakit',
    title: 'Sakit Medis',
    desc: 'Surat Dokter',
    icon: 'favorite',
    histIcon: 'medical_services',
    histBg: '#ffdada',
    histColor: '#b80035',
  },
  {
    id: 'pribadi',
    title: 'Izin Keperluan',
    desc: 'Urusan Pribadi',
    icon: 'home',
    histIcon: 'home',
    histBg: '#eff4ff',
    histColor: '#3b82f6',
  },
  {
    id: 'cuti',
    title: 'Cuti Tahunan',
    desc: 'Terencana',
    icon: 'flight',
    histIcon: 'flight_takeoff',
    histBg: '#ecfdf5',
    histColor: '#059669',
  },
  {
    id: 'tugas',
    title: 'Tugas Armada',
    desc: 'Dinas Luar Kota',
    icon: 'local_shipping',
    histIcon: 'local_shipping',
    histBg: '#fffbeb',
    histColor: '#d97706',
  },
];

export default function Izin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form states
  const [selectedCat, setSelectedCat] = useState('sakit');
  const [tanggalMulai, setTanggalMulai] = useState('2026-09-23');
  const [tanggalSelesai, setTanggalSelesai] = useState('2026-09-24');
  const [keterangan, setKeterangan] = useState(
    'Pemeriksaan rawat jalan dokter spesialis lambung dan istirahat pemulihan sesuai surat rekomendasi klinik Pratama Medika.'
  );
  const [uploadedFile, setUploadedFile] = useState({
    name: 'surat_sakit_aldho_23sep.pdf',
    size: '1.2 MB',
  });

  // Submission state: 'idle' | 'loading' | 'success'
  const [submitState, setSubmitState] = useState('idle');

  // Quota
  const [quota, setQuota] = useState({
    sisa: 8,
    terpakai: 4,
    pending: 0,
  });

  // Recent History
  const [recentList, setRecentList] = useState([
    {
      id: 1,
      title: 'Cuti Tahunan (1 Hari)',
      subtitle: '12 Agu 2026 • Mudik Keluarga',
      status: 'Disetujui',
      statusClass: 'green',
      hasDot: true,
      note: 'Oleh RH',
      icon: 'flight_takeoff',
      iconBg: '#ecfdf5',
      iconColor: '#059669',
    },
    {
      id: 2,
      title: 'Izin Sakit Rawat Jalan',
      subtitle: '04 Jul 2026 • Surat RS Port',
      status: 'Selesai',
      statusClass: 'neutral',
      hasDot: false,
      note: 'Arsip HR',
      icon: 'medical_services',
      iconBg: '#ffdada',
      iconColor: '#b80035',
    },
  ]);

  // Sync API if available
  useEffect(() => {
    if (!user?.id) return;
    api.getIzinHistory?.(user.id)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.records || [];
        if (list.length > 0) {
          const mapped = list.map((item, idx) => {
            const cat = CATEGORIES.find((c) => c.id === item.kategori) || CATEGORIES[0];
            const isApproved = item.status === 'Disetujui';
            return {
              id: item.id || idx,
              title: `${cat.title}`,
              subtitle: `${item.tanggalMulai || '-'} • ${item.keterangan || ''}`,
              status: item.status || 'Dalam Tinjauan',
              statusClass: isApproved ? 'green' : 'neutral',
              hasDot: isApproved,
              note: item.penyelia || 'Oleh RH',
              icon: cat.histIcon,
              iconBg: cat.histBg,
              iconColor: cat.histColor,
            };
          });
          setRecentList(mapped);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Compute duration
  const durasiHari = (() => {
    try {
      const d1 = new Date(tanggalMulai);
      const d2 = new Date(tanggalSelesai);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
      return diffDays > 0 ? `${diffDays} Hari Kerja` : '1 Hari Kerja';
    } catch {
      return '1 Hari Kerja';
    }
  })();

  const formatDateLabel = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        day: d.toLocaleDateString('id-ID', { weekday: 'long' }),
      };
    } catch {
      return { date: dateStr, day: '-' };
    }
  };

  const mulaiFormatted = formatDateLabel(tanggalMulai);
  const selesaiFormatted = formatDateLabel(tanggalSelesai);

  // File Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFile({
        name: file.name,
        size: `${sizeMB} MB`,
      });
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!keterangan.trim()) {
      alert('Mohon isi keterangan detail alasan izin.');
      return;
    }

    setSubmitState('loading');

    try {
      if (api.submitIzin && user?.id) {
        await api.submitIzin({
          userId: user.id,
          kategori: selectedCat,
          tanggalMulai,
          tanggalSelesai,
          keterangan,
        });
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }

      setSubmitState('success');

      setQuota((prev) => ({
        ...prev,
        pending: prev.pending + 1,
      }));

      const activeCatObj = CATEGORIES.find((c) => c.id === selectedCat) || CATEGORIES[0];
      setRecentList((prev) => [
        {
          id: Date.now(),
          title: `${activeCatObj.title} (${durasiHari})`,
          subtitle: `${mulaiFormatted.date} • ${keterangan.slice(0, 32)}...`,
          status: 'Dalam Tinjauan',
          statusClass: 'amber',
          hasDot: false,
          note: 'Penyelia RH',
          icon: activeCatObj.histIcon,
          iconBg: activeCatObj.histBg,
          iconColor: activeCatObj.histColor,
        },
        ...prev,
      ]);

      setTimeout(() => {
        setSubmitState('idle');
      }, 2400);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim pengajuan. Coba beberapa saat lagi.');
      setSubmitState('idle');
    }
  };

  return (
    <div className="iz-page">
      <div className="iz-content">

        {/* ── 1. User Identity Card ── */}
        <section className="iz-user-card">
          <div className="iz-user-left">
            <div className="iz-user-avatar-wrap">
              <img
                className="iz-user-avatar"
                src={user?.foto_profil || '/Aldho.jpg'}
                alt={user?.nama || 'Aldho Lega'}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuACDY7tsl6RnCLlg0eC1XufQG9-JcBEpTrJ7-zq1X8BDPK7p5soojuAUr69XBr7M2_T98jpAm_rkrZ8De0fYVKpnJV2HJgEhbWp8Jh2p6lUQe0XrwePARq6Lv5dtp0j7XBZpBhFa-9gTAukU9pgYVoxqWj77ZubLwOhBxmq9j1GmgKRlBjWssULFmTsZ4YWzevCF4Yy-YwSVcuSogL2Zg7NA2rfBrRGJFgP0D29zCm7a8ISexTZGa_9';
                }}
              />
              <span className="iz-user-dot"></span>
            </div>
            <div className="iz-user-meta">
              <div className="iz-user-name-row">
                <h1 className="iz-user-name">{user?.nama || 'Aldho Lega'}</h1>
                <span className="iz-user-badge">Aktif</span>
              </div>
              <p className="iz-user-role">Karyawan Operasional &bull; PT Angkasa Ekspres</p>
              <span className="iz-user-nip">NIP: {user?.nip || '2026-AP-0842'}</span>
            </div>
          </div>
          <button
            type="button"
            className="iz-user-btn"
            aria-label="Lihat Badge"
            onClick={() => alert(`ID Karyawan: ${user?.id || 9}\nNIP: ${user?.nip || '2026-AP-0842'}\nStatus: Aktif`)}
          >
            <span className="material-symbols-outlined">badge</span>
          </button>
        </section>

        {/* ── 2. Hak Cuti Hero Card ── */}
        <section className="iz-hero-card">
          <div className="iz-hero-watermark">
            <span className="material-symbols-outlined">flight_takeoff</span>
          </div>

          <div className="iz-hero-inner">
            <div className="iz-hero-top">
              <div>
                <span className="iz-hero-pill">
                  <span className="material-symbols-outlined">event_available</span>
                  <span>Kuota Periode 2026</span>
                </span>
                <div className="iz-hero-days-row">
                  <span className="iz-hero-days-num">{quota.sisa}</span>
                  <span className="iz-hero-days-txt">Hari Kerja Tersisa</span>
                </div>
                <p className="iz-hero-desc">Tersedia untuk digunakan hingga 31 Des 2026</p>
              </div>
              <div className="iz-hero-icon-box">
                <span className="material-symbols-outlined">beach_access</span>
              </div>
            </div>

            <div className="iz-hero-metrics">
              <div className="iz-hero-metric-box">
                <div className="iz-hero-metric-icon">
                  <span className="material-symbols-outlined">event_busy</span>
                </div>
                <div>
                  <p className="iz-hero-metric-val">{quota.terpakai} Hari</p>
                  <p className="iz-hero-metric-lbl">Terpakai</p>
                </div>
              </div>
              <div className="iz-hero-metric-box">
                <div className="iz-hero-metric-icon">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <div>
                  <p className="iz-hero-metric-val">{quota.pending} Pengajuan</p>
                  <p className="iz-hero-metric-lbl">Dalam Tinjauan</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Main Form Container ── */}
        <section className="iz-form-card">
          <div className="iz-form-header">
            <div>
              <h2 className="iz-form-title">Formulir Dispensasi</h2>
              <p className="iz-form-sub">Isi data ketidakhadiran resmi karyawan</p>
            </div>
            <span className="iz-form-shift">Shift A Operasional</span>
          </div>

          {/* Category Selector */}
          <div className="iz-cat-sec">
            <div className="iz-cat-label-row">
              <label className="iz-label">Pilih Kategori Dispensasi</label>
              <span className="iz-required">*Wajib</span>
            </div>
            <div className="iz-cat-grid">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCat(cat.id)}
                    className={`iz-cat-btn ${isActive ? 'active' : 'inactive'}`}
                  >
                    {isActive && (
                      <span className="iz-cat-check">
                        <span className="material-symbols-outlined">check</span>
                      </span>
                    )}
                    <div className="iz-cat-icon-wrap">
                      <span className="material-symbols-outlined">{cat.icon}</span>
                    </div>
                    <span className="iz-cat-title">{cat.title}</span>
                    <span className="iz-cat-desc">{cat.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Pickers & Duration */}
          <div className="iz-date-sec">
            <div className="iz-cat-label-row">
              <label className="iz-label">Periode Ketidakhadiran</label>
              <span className="iz-durasi-pill">
                <span className="material-symbols-outlined">schedule</span>
                <span>Durasi: {durasiHari}</span>
              </span>
            </div>
            <div className="iz-date-grid">
              <div className="iz-date-col">
                <span className="iz-date-lbl">Tanggal Mulai</span>
                <label className="iz-date-box">
                  <div className="iz-date-box-left">
                    <span className="iz-date-val">{mulaiFormatted.date}</span>
                    <span className="iz-date-day">{mulaiFormatted.day}</span>
                  </div>
                  <span className="material-symbols-outlined">calendar_today</span>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="iz-date-input-hidden"
                  />
                </label>
              </div>

              <div className="iz-date-col">
                <span className="iz-date-lbl">Tanggal Selesai</span>
                <label className="iz-date-box">
                  <div className="iz-date-box-left">
                    <span className="iz-date-val">{selesaiFormatted.date}</span>
                    <span className="iz-date-day">{selesaiFormatted.day}</span>
                  </div>
                  <span className="material-symbols-outlined">event</span>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="iz-date-input-hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="iz-reason-sec">
            <div className="iz-cat-label-row">
              <label className="iz-label">
                Keterangan &amp; Alasan Pengajuan <span style={{ color: '#b80035' }}>*</span>
              </label>
              <span className="iz-date-lbl">Maks 250 kata</span>
            </div>
            <div className="iz-textarea-wrap">
              <textarea
                className="iz-textarea"
                rows={3}
                placeholder="Tuliskan keterangan detail alasan izin / sakit / cuti / tugas operasional Anda..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </div>
          </div>

          {/* Document Upload Box */}
          <div className="iz-upload-sec">
            <div className="iz-cat-label-row">
              <label className="iz-label">Upload Dokumen Bukti</label>
              <span className="iz-date-lbl">PDF / JPG / PNG</span>
            </div>
            <div
              className="iz-upload-box"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="iz-upload-icon-circle">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <p className="iz-upload-title">Ketuk untuk unggah surat atau foto resep</p>
              <p className="iz-upload-desc">Surat Keterangan Dokter atau Surat Tugas (Maks 5MB)</p>

              {uploadedFile && (
                <div className="iz-file-pill">
                  <span className="material-symbols-outlined">attachment</span>
                  <span>{uploadedFile.name} ({uploadedFile.size})</span>
                  <span
                    className="material-symbols-outlined iz-file-close"
                    onClick={handleRemoveFile}
                  >
                    close
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Supervisor Strip */}
          <div className="iz-supervisor-strip">
            <div className="iz-supervisor-left">
              <div className="iz-supervisor-avatar">RH</div>
              <div className="iz-supervisor-text">
                <span className="iz-supervisor-lbl">Penyelia Penerima Notifikasi</span>
                <span className="iz-supervisor-name">Rudi Hartono (Supervisor Shift A)</span>
              </div>
            </div>
            <span className="material-symbols-outlined">verified_user</span>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            id="submitLeaveBtn"
            disabled={submitState === 'loading'}
            onClick={handleSubmit}
            className={`iz-submit-btn ${submitState === 'success' ? 'success' : ''}`}
          >
            {submitState === 'loading' ? (
              <>
                <span className="material-symbols-outlined animate-spin">autorenew</span>
                <span>Memproses...</span>
              </>
            ) : submitState === 'success' ? (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                <span>Terkirim ke Supervisor</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">send</span>
                <span>Kirim Pengajuan Izin</span>
              </>
            )}
          </button>
        </section>

        {/* ── 4. Recent History Section ── */}
        <section className="iz-hist-sec">
          <div className="iz-hist-header">
            <div className="iz-hist-header-left">
              <span className="material-symbols-outlined">history_toggle_off</span>
              <h2 className="iz-hist-title">Riwayat Pengajuan Terakhir</h2>
            </div>
            <button
              type="button"
              className="iz-hist-all-btn"
              onClick={() => navigate('/employee/riwayat')}
            >
              Lihat Semua
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentList.map((item) => (
              <div key={item.id} className="iz-hist-card">
                <div className="iz-hist-card-left">
                  <div
                    className="iz-hist-icon-box"
                    style={{ background: item.iconBg, color: item.iconColor }}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="iz-hist-text">
                    <h3 className="iz-hist-card-title">{item.title}</h3>
                    <span className="iz-hist-card-sub">{item.subtitle}</span>
                  </div>
                </div>
                <div className="iz-hist-card-right">
                  <span className={`iz-hist-status-pill ${item.statusClass}`}>
                    {item.hasDot && <span className="iz-hist-status-dot"></span>}
                    {item.status}
                  </span>
                  <span className="iz-hist-note">{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
