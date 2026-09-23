import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

export default function AdminPengaturan() {
  const [settings, setSettings] = useState({
    jam_masuk: '08:00:00',
    jam_pulang: '17:00:00',
    latitude: -6.34395432,
    longitude: 106.73780986,
    radius: 100,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [msg, setMsg] = useState('');
  const [gpsDetecting, setGpsDetecting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAttendanceSettings();
      if (data && data.id) {
        setSettings({
          jam_masuk: data.jam_masuk || '08:00:00',
          jam_pulang: data.jam_pulang || '17:00:00',
          latitude: typeof data.latitude === 'number' ? data.latitude : -6.34395432,
          longitude: typeof data.longitude === 'number' ? data.longitude : 106.73780986,
          radius: data.radius || 100,
        });
      }
    } catch (e) {
      console.error('Fetch settings err:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setMsg('');
    try {
      await api.updateAttendanceSettings(settings);
      setStatus('success');
      setMsg('Pengaturan jam kerja dan geofence GPS berhasil diperbarui!');
    } catch (e) {
      setStatus('error');
      setMsg(e.message || 'Gagal menyimpan pengaturan absensi');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleDetectGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('Browser Anda tidak mendukung deteksi lokasi Geolocation.');
      return;
    }
    setGpsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(8)),
          longitude: parseFloat(pos.coords.longitude.toFixed(8)),
        }));
        setGpsDetecting(false);
        setStatus('success');
        setMsg(`Koordinat berhasil diperbarui ke lokasi Anda: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        setGpsDetecting(false);
        alert('Gagal mendeteksi lokasi GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleOpenMaps = () => {
    window.open(`https://maps.google.com/?q=${settings.latitude},${settings.longitude}`, '_blank');
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Pengaturan Absensi & Geofence</h1>
          <p className="admin-page-subtitle">Konfigurasi batas jam kerja kantor dan koordinat radius satelit GPS</p>
        </div>
      </div>

      {status === 'success' && (
        <div className="alert-success animate-fade-in">
          <i className="fa-solid fa-circle-check"></i>
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setStatus(null)} className="alert-dismiss">&times;</button>
        </div>
      )}

      {status === 'error' && (
        <div className="alert-error animate-fade-in">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span style={{ flex: 1 }}>{msg}</span>
          <button onClick={() => setStatus(null)} className="alert-dismiss">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="loading-card">
          <div className="spinner"></div>
          <span>Memuat pengaturan absensi...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="settings-form">
          {/* Section 1: Jam Kantor */}
          <div className="settings-card">
            <div className="card-header">
              <i className="fa-solid fa-clock" style={{ color: 'var(--brand)' }}></i>
              <div>
                <h3 className="card-title">Batas Jam Operasional Kantor</h3>
                <p className="card-sub">Karyawan yang melakukan absen masuk melebihi batas jam masuk akan ditandai Terlambat (Telat)</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-item">
                <label className="item-label">Jam Masuk Standar</label>
                <input
                  type="time"
                  step="1"
                  className="item-input"
                  value={settings.jam_masuk}
                  onChange={e => updateSetting('jam_masuk', e.target.value)}
                  required
                />
                <span className="item-hint">Format waktu: HH:MM:SS (Default: 08:00:00)</span>
              </div>

              <div className="form-item">
                <label className="item-label">Jam Pulang Standar</label>
                <input
                  type="time"
                  step="1"
                  className="item-input"
                  value={settings.jam_pulang}
                  onChange={e => updateSetting('jam_pulang', e.target.value)}
                  required
                />
                <span className="item-hint">Format waktu: HH:MM:SS (Default: 17:00:00)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Koordinat Geofence GPS */}
          <div className="settings-card">
            <div className="card-header">
              <i className="fa-solid fa-location-crosshairs" style={{ color: 'var(--brand)' }}></i>
              <div>
                <h3 className="card-title">Titik Pusat Koordinat & Radius Geofence GPS</h3>
                <p className="card-sub">Menghitung jarak karyawan ke kantor dengan rumus Haversine untuk mencegah fake GPS</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-item">
                <label className="item-label">Latitude Kantor</label>
                <input
                  type="number"
                  step="any"
                  className="item-input mono"
                  value={settings.latitude}
                  onChange={e => updateSetting('latitude', parseFloat(e.target.value) || 0)}
                  required
                />
                <span className="item-hint">Contoh: -6.34395432</span>
              </div>

              <div className="form-item">
                <label className="item-label">Longitude Kantor</label>
                <input
                  type="number"
                  step="any"
                  className="item-input mono"
                  value={settings.longitude}
                  onChange={e => updateSetting('longitude', parseFloat(e.target.value) || 0)}
                  required
                />
                <span className="item-hint">Contoh: 106.73780986</span>
              </div>
            </div>

            {/* Quick GPS helper buttons */}
            <div className="gps-helpers-row">
              <button
                type="button"
                className="btn-helper"
                onClick={handleDetectGPS}
                disabled={gpsDetecting}
              >
                <i className={`fa-solid fa-crosshairs ${gpsDetecting ? 'spin' : ''}`}></i>
                <span>{gpsDetecting ? 'Mendeteksi Satelit...' : 'Gunakan Titik Lokasi Saya Saat Ini'}</span>
              </button>

              <button
                type="button"
                className="btn-helper"
                onClick={handleOpenMaps}
              >
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                <span>Buka Titik di Google Maps</span>
              </button>
            </div>

            {/* Radius Slider */}
            <div className="radius-control-block">
              <div className="radius-header">
                <label className="item-label">Radius Toleransi Geofence</label>
                <span className="radius-badge">{settings.radius} meter</span>
              </div>

              <div className="slider-wrapper">
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={settings.radius}
                  onChange={e => updateSetting('radius', parseInt(e.target.value) || 50)}
                  className="radius-range"
                />
                <div className="range-marks">
                  <span>20m</span>
                  <span>250m</span>
                  <span>500m</span>
                  <span>1000m</span>
                </div>
              </div>
              <p className="item-hint" style={{ marginTop: '8px' }}>
                Karyawan harus berada dalam jarak maksimal <strong>{settings.radius} meter</strong> dari koordinat kantor untuk dapat melakukan absensi biometrik.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="settings-footer">
            <button
              type="submit"
              className="btn-save-settings"
              disabled={saving}
            >
              {saving ? (
                <><span className="spinner-btn"></span> Menyimpan Pengaturan...</>
              ) : (
                <><i className="fa-solid fa-floppy-disk"></i> Simpan Pengaturan Absensi</>
              )}
            </button>
          </div>
        </form>
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

        .alert-success, .alert-error {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
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
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .settings-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 24px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        .card-header i { font-size: 24px; margin-top: 2px; }
        .card-title { font-size: 16px; font-weight: 800; color: var(--text-primary); margin: 0; }
        .card-sub { font-size: 12.5px; color: var(--text-muted); margin: 3px 0 0; }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        @media (max-width: 600px) {
          .form-grid-2 { grid-template-columns: 1fr; }
        }

        .form-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .item-label { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
        .item-input {
          padding: 10px 14px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .item-input:focus { border-color: var(--brand); }
        .item-input.mono { font-family: monospace; font-weight: 600; }
        .item-hint { font-size: 11.5px; color: var(--text-muted); }

        .gps-helpers-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .btn-helper {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-hover);
          color: var(--text-primary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-helper:hover:not(:disabled) {
          border-color: var(--brand);
          color: var(--brand);
        }
        .btn-helper:disabled { opacity: 0.6; cursor: not-allowed; }

        .radius-control-block {
          background: var(--bg-page);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .radius-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .radius-badge {
          background: var(--brand-50);
          color: var(--brand);
          border: 1px solid var(--brand-200);
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 800;
          font-family: monospace;
        }
        body.dark-mode .radius-badge {
          background: rgba(230,0,0,0.15);
          border-color: rgba(230,0,0,0.3);
        }

        .slider-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .radius-range {
          width: 100%;
          accent-color: var(--brand);
          cursor: pointer;
          height: 6px;
        }
        .range-marks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
        }

        .settings-footer {
          display: flex;
          justify-content: flex-end;
        }
        .btn-save-settings {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(230, 0, 0, 0.3);
          font-family: inherit;
        }
        .btn-save-settings:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(230, 0, 0, 0.4);
        }
        .btn-save-settings:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner-btn {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: var(--text-muted);
        }
        .spinner {
          width: 32px;
          height: 32px;
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
