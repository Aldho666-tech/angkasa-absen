import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

const IZIN_TYPES = [
  { value: 'Sakit', label: 'Sakit', icon: 'fa-solid fa-heart-pulse', color: '#ef4444' },
  { value: 'Izin', label: 'Izin Keperluan Pribadi', icon: 'fa-solid fa-house-user', color: '#3b82f6' },
  { value: 'Cuti', label: 'Cuti Terencana', icon: 'fa-solid fa-umbrella-beach', color: '#8b5cf6' },
  { value: 'Dinas', label: 'Tugas Luar / Armada', icon: 'fa-solid fa-truck-fast', color: '#10b981' },
];

export default function Izin() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    tipe: 'Sakit',
    tanggal_mulai: today,
    tanggal_selesai: today,
    keterangan: '',
  });

  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [msg, setMsg] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    let curr = new Date(startDate);
    const end = new Date(endDate);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.keterangan.trim()) {
      setStatus('error');
      setMsg('Keterangan pengajuan wajib diisi.');
      return;
    }

    if (!user?.id) {
      setStatus('error');
      setMsg('Sesi login tidak valid. Silakan login kembali.');
      return;
    }

    setStatus('loading');
    setMsg('');

    try {
      const dates = getDatesInRange(form.tanggal_mulai, form.tanggal_selesai);
      const apiTipe = form.tipe === 'Dinas' ? 'Izin' : form.tipe;
      const fullKeterangan = form.tipe === 'Dinas'
        ? `[Tugas Luar] ${form.keterangan}`
        : form.keterangan;

      // Submit for each day in range
      for (const d of dates) {
        await api.submitIzin({
          userId: user.id,
          tanggal: d,
          tipe: apiTipe,
          keterangan: fullKeterangan,
        });
      }

      setStatus('success');
      setMsg(`Pengajuan ${form.tipe} untuk ${dates.length} hari berhasil dicatat ke sistem!`);
      setForm({
        tipe: 'Sakit',
        tanggal_mulai: today,
        tanggal_selesai: today,
        keterangan: '',
      });
    } catch (err) {
      console.error('Submit izin error:', err);
      setStatus('error');
      setMsg(err.message || 'Gagal mengajukan izin. Pastikan data lengkap.');
    }
  };

  return (
    <div className="page-container">
      <div className="izin-header">
        <div className="izin-icon">
          <i className="fa-solid fa-file-circle-check"></i>
        </div>
        <div>
          <h2 className="izin-title">Pengajuan Izin & Cuti</h2>
          <p className="izin-subtitle">Dispensasi ketidakhadiran resmi karyawan PT Angkasa Ekspres Indonesia</p>
        </div>
      </div>

      {status === 'success' && (
        <div className="alert-success animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
          <div style={{ flex: 1 }}>
            <strong>Berhasil!</strong> {msg}
          </div>
          <button onClick={() => setStatus(null)} className="alert-dismiss">&times;</button>
        </div>
      )}

      {status === 'error' && (
        <div className="alert-error animate-fade-in">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <div style={{ flex: 1 }}>{msg}</div>
          <button onClick={() => setStatus(null)} className="alert-dismiss">&times;</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="izin-form-card">
        {/* Tipe Izin */}
        <div className="form-section">
          <label className="form-label">Kategori Dispensasi</label>
          <div className="izin-type-grid">
            {IZIN_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                className={`izin-type-btn ${form.tipe === t.value ? 'active' : ''}`}
                style={{ '--btn-accent': t.color }}
                onClick={() => handleChange('tipe', t.value)}
              >
                <div className="type-icon-box">
                  <i className={t.icon}></i>
                </div>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tanggal */}
        <div className="form-row-2">
          <div className="form-section">
            <label className="form-label" htmlFor="tgl-mulai">Tanggal Mulai</label>
            <input
              id="tgl-mulai"
              type="date"
              className="form-input"
              value={form.tanggal_mulai}
              onChange={e => handleChange('tanggal_mulai', e.target.value)}
              required
            />
          </div>
          <div className="form-section">
            <label className="form-label" htmlFor="tgl-selesai">Tanggal Selesai</label>
            <input
              id="tgl-selesai"
              type="date"
              className="form-input"
              value={form.tanggal_selesai}
              min={form.tanggal_mulai}
              onChange={e => handleChange('tanggal_selesai', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Keterangan */}
        <div className="form-section">
          <label className="form-label" htmlFor="keterangan">
            Keterangan & Alasan <span className="required-mark">*</span>
          </label>
          <textarea
            id="keterangan"
            className="form-textarea"
            rows={4}
            placeholder="Tuliskan keterangan detail alasan izin / cuti / tugas operasional Anda..."
            value={form.keterangan}
            onChange={e => handleChange('keterangan', e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="submit-btn"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <><span className="btn-spinner"></span> Mengirim Pengajuan...</>
          ) : (
            <><i className="fa-solid fa-paper-plane"></i> Kirim Pengajuan Izin</>
          )}
        </button>
      </form>

      <style>{`
        .izin-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }
        .izin-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 6px 18px rgba(230, 0, 0, 0.25);
        }
        .izin-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 2px 0;
        }
        .izin-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        .alert-success, .alert-error {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 13.5px;
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .alert-error {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .alert-dismiss {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 18px;
          cursor: pointer;
          opacity: 0.7;
        }
        .alert-dismiss:hover { opacity: 1; }

        .izin-form-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .required-mark { color: var(--brand); }

        .izin-type-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        @media (max-width: 600px) {
          .izin-type-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .izin-type-btn {
          background: var(--bg-page);
          border: 1.5px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .izin-type-btn:hover {
          border-color: var(--btn-accent);
          transform: translateY(-2px);
        }
        .izin-type-btn.active {
          border-color: var(--btn-accent);
          background: color-mix(in srgb, var(--btn-accent) 12%, transparent);
        }
        .type-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: color-mix(in srgb, var(--btn-accent) 15%, transparent);
          color: var(--btn-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .izin-type-btn span {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
        }

        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 480px) {
          .form-row-2 { grid-template-columns: 1fr; }
        }

        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 20px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(230, 0, 0, 0.3);
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(230, 0, 0, 0.4);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
