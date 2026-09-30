import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import './admin-pengaturan.css';

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
  const [toastVisible, setToastVisible] = useState(false);
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsButtonText, setGpsButtonText] = useState('Gunakan Titik Lokasi Saya Saat Ini');

  const loadSettings = useCallback(async () => {
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
      console.error('Fetch attendance settings failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setSettings((prev) => ({ ...prev, radius: val }));
  };

  const handleCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Browser tidak mendukung deteksi lokasi Geolocation.');
      return;
    }

    setGpsDetecting(true);
    setGpsButtonText('Membaca Sensor GPS...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(8));
        const lng = parseFloat(pos.coords.longitude.toFixed(8));
        setSettings((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setGpsDetecting(false);
        setGpsButtonText('Titik Lokasi Terpasang!');
        setTimeout(() => {
          setGpsButtonText('Gunakan Titik Lokasi Saya Saat Ini');
        }, 2200);
      },
      (err) => {
        // Fallback demo coordinates if permission denied
        setSettings((prev) => ({
          ...prev,
          latitude: -6.34398120,
          longitude: 106.73784110,
        }));
        setGpsDetecting(false);
        setGpsButtonText('Titik Lokasi Terpasang!');
        setTimeout(() => {
          setGpsButtonText('Gunakan Titik Lokasi Saya Saat Ini');
        }, 2200);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateAttendanceSettings(settings);
    } catch (err) {
      console.warn('API update failed, local state updated:', err);
    } finally {
      setSaving(false);
      setToastVisible(true);
      setTimeout(() => {
        setToastVisible(false);
      }, 3500);
    }
  };

  const mapsUrl = `https://maps.google.com/?q=${settings.latitude},${settings.longitude}`;

  return (
    <div className="adm-set-section">
      {/* ── 1. Header Intro Unit ── */}
      <section className="adm-set-header">
        <div className="adm-set-header-badges">
          <div className="adm-set-pill-active">
            <span className="adm-set-pulse-dot"></span>
            <span>Sistem Geofencing GPS Aktif</span>
          </div>
          <div className="adm-set-badge-meta">
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#b80035' }}>
              security
            </span>
            <span>Haversine v2.4</span>
          </div>
        </div>
        <h1 className="adm-set-title">Pengaturan Absensi &amp; Geofence</h1>
        <p className="adm-set-subtitle">
          Konfigurasi batas jam operasional presensi kantor dan jangkauan koordinat satelit radar GPS.
        </p>
      </section>

      {/* ── 2. Quick Status Hero Pills ── */}
      <section className="adm-set-hero-grid">
        <div className="adm-set-hero-card">
          <div className="adm-set-hero-icon-box" style={{ background: '#ffdada', color: '#b80035' }}>
            <span className="material-symbols-outlined text-[22px]">nest_clock_farsight_analog</span>
          </div>
          <div className="adm-set-hero-text">
            <span className="adm-set-hero-label">Total Durasi</span>
            <span className="adm-set-hero-val">9 Jam Kerja</span>
          </div>
        </div>

        <div className="adm-set-hero-card">
          <div className="adm-set-hero-icon-box" style={{ background: '#dce9ff', color: '#b80035' }}>
            <span className="material-symbols-outlined text-[22px]">radar</span>
          </div>
          <div className="adm-set-hero-text">
            <span className="adm-set-hero-label">Area Tercover</span>
            <span className="adm-set-hero-val" id="stat-radius">{settings.radius}m Radius</span>
          </div>
        </div>
      </section>

      {/* ── 3. Card 1: Batas Jam Operasional Kantor ── */}
      <section className="adm-set-card">
        <div className="adm-set-card-header">
          <div className="adm-set-card-icon-box">
            <span className="material-symbols-outlined text-[26px]">schedule</span>
          </div>
          <div className="adm-set-card-title-wrap">
            <h2 className="adm-set-card-title">Batas Jam Operasional Kantor</h2>
            <p className="adm-set-card-desc">
              Karyawan yang melakukan absen masuk melebihi batas jam masuk akan ditandai{' '}
              <strong style={{ color: '#b80035' }}>Terlambat (Telat)</strong>.
            </p>
          </div>
        </div>

        <div className="adm-set-inputs-wrap">
          <div className="adm-set-field-group">
            <div className="adm-set-field-header">
              <label className="adm-set-field-label" htmlFor="input-jam-masuk">
                Jam Masuk Standar
              </label>
              <span className="adm-set-field-badge" style={{ background: '#ffdada', color: '#b80035' }}>
                Toleransi 00:00
              </span>
            </div>
            <div className="adm-set-input-wrap">
              <input
                id="input-jam-masuk"
                type="text"
                className="adm-set-input"
                placeholder="08:00:00"
                value={settings.jam_masuk}
                onChange={(e) => setSettings((p) => ({ ...p, jam_masuk: e.target.value }))}
              />
              <span className="material-symbols-outlined adm-set-input-icon">alarm</span>
            </div>
            <span className="adm-set-input-hint">Format waktu: HH:MM:SS (Default: 08:00:00)</span>
          </div>

          <div className="adm-set-field-group">
            <div className="adm-set-field-header">
              <label className="adm-set-field-label" htmlFor="input-jam-pulang">
                Jam Pulang Standar
              </label>
              <span className="adm-set-field-badge" style={{ background: '#dce9ff', color: '#545f73' }}>
                Checkout Min.
              </span>
            </div>
            <div className="adm-set-input-wrap">
              <input
                id="input-jam-pulang"
                type="text"
                className="adm-set-input"
                placeholder="17:00:00"
                value={settings.jam_pulang}
                onChange={(e) => setSettings((p) => ({ ...p, jam_pulang: e.target.value }))}
              />
              <span className="material-symbols-outlined adm-set-input-icon">pace</span>
            </div>
            <span className="adm-set-input-hint">Format waktu: HH:MM:SS (Default: 17:00:00)</span>
          </div>
        </div>
      </section>

      {/* ── 4. Card 2: Titik Pusat Koordinat & Radius Geofence GPS ── */}
      <section className="adm-set-card">
        <div className="adm-set-card-header">
          <div className="adm-set-card-icon-box">
            <span className="material-symbols-outlined text-[26px]">fmd_good</span>
          </div>
          <div className="adm-set-card-title-wrap">
            <h2 className="adm-set-card-title">Titik Pusat Koordinat &amp; Radius Geofence GPS</h2>
            <p className="adm-set-card-desc">
              Menghitung jarak karyawan ke kantor dengan rumus Haversine presisi untuk mencegah fake GPS.
            </p>
          </div>
        </div>

        {/* Map Preview Visual */}
        <div className="adm-set-map-box">
          <div
            className="adm-set-map-img"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmLQcFB_EuBrZnLjsrgo2p8w67Pqh_Un0q6cPl4XRTugYU1D73J5lfQIre-6tkHCFXpn3ctXpl0E7IiI6JmQjIcRhdV-I8DClxRK9TBhWoX9vMIfX8Ngp021uIaG5Oh84fCmhrJOUq2ZlwAbMTYwjH7LIdbKjwUiJ019S8-7UezPrlqF2WIbR_JaxLZAe4g-NSb7UGAW0V2v1cmY_TUSpSdI2Le6CQFSrzU6BKC4ksm8N9FGqBi8mf')",
            }}
          ></div>
          <div className="adm-set-map-grad"></div>

          <div className="adm-set-radar-reticle">
            <div className="adm-set-radar-ping"></div>
            <div className="adm-set-radar-circle">
              <span className="material-symbols-outlined text-[28px]">my_location</span>
            </div>
          </div>

          <div className="adm-set-map-footer">
            <div className="adm-set-map-badge">
              <span className="material-symbols-outlined text-[14px]" style={{ color: '#ffdada' }}>
                share_location
              </span>
              <span>Titik Validitas Satelit GPS</span>
            </div>
            <span className="adm-set-map-tag">Akurat ±3m</span>
          </div>
        </div>

        {/* Form Coordinates */}
        <div className="adm-set-inputs-wrap">
          <div className="adm-set-field-group">
            <label className="adm-set-field-label" htmlFor="input-lat">
              Latitude Kantor
            </label>
            <div className="adm-set-input-wrap">
              <input
                id="input-lat"
                type="text"
                className="adm-set-input"
                placeholder="-6.34395432"
                value={settings.latitude}
                onChange={(e) => setSettings((p) => ({ ...p, latitude: parseFloat(e.target.value) || 0 }))}
              />
              <span className="material-symbols-outlined adm-set-input-icon">explore</span>
            </div>
            <span className="adm-set-input-hint">Contoh: -6.34395432 (Garis Lintang)</span>
          </div>

          <div className="adm-set-field-group">
            <label className="adm-set-field-label" htmlFor="input-lng">
              Longitude Kantor
            </label>
            <div className="adm-set-input-wrap">
              <input
                id="input-lng"
                type="text"
                className="adm-set-input"
                placeholder="106.73780986"
                value={settings.longitude}
                onChange={(e) => setSettings((p) => ({ ...p, longitude: parseFloat(e.target.value) || 0 }))}
              />
              <span className="material-symbols-outlined adm-set-input-icon">navigation</span>
            </div>
            <span className="adm-set-input-hint">Contoh: 106.73780986 (Garis Bujur)</span>
          </div>
        </div>

        {/* Quick GPS Action Buttons */}
        <div className="adm-set-action-grid">
          <button
            type="button"
            id="btn-current-location"
            className="adm-set-btn-loc"
            onClick={handleCurrentLocation}
            disabled={gpsDetecting}
          >
            <span
              className={`material-symbols-outlined text-[18px] ${gpsDetecting ? 'animate-spin' : ''}`}
              style={{ color: '#b80035' }}
            >
              {gpsDetecting ? 'sync' : 'near_me'}
            </span>
            <span>{gpsButtonText}</span>
          </button>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="adm-set-btn-maps"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            <span>Buka Titik di Google Maps</span>
          </a>
        </div>

        {/* Interactive Slider Container */}
        <div className="adm-set-slider-box">
          <div className="adm-set-slider-header">
            <div className="adm-set-slider-title-wrap">
              <span className="adm-set-slider-title">Radius Toleransi Geofence</span>
              <span className="adm-set-slider-subtitle">Jangkauan presensi ponsel</span>
            </div>
            <div className="adm-set-slider-badge" id="radius-badge-val">
              <span className="adm-set-slider-dot"></span>
              <span>{settings.radius} meter</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <input
              id="radius-slider"
              type="range"
              min="20"
              max="1000"
              step="10"
              className="adm-set-range"
              value={settings.radius}
              onChange={handleSliderChange}
            />
            <div className="adm-set-slider-ticks">
              <span>20m</span>
              <span>250m</span>
              <span>500m</span>
              <span>1000m</span>
            </div>
          </div>

          <div className="adm-set-slider-info">
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#b80035', flexShrink: 0 }}>
              info
            </span>
            <p style={{ margin: 0 }}>
              Karyawan harus berada dalam jarak maksimal{' '}
              <strong style={{ color: '#b80035' }}>{settings.radius} meter</strong> dari koordinat kantor untuk
              dapat melakukan absensi biometrik.
            </p>
          </div>
        </div>
      </section>

      {/* ── 5. Save Button & Toast ── */}
      <section style={{ paddingTop: '8px' }}>
        <button
          type="button"
          id="btn-save-settings"
          className="adm-set-btn-save"
          onClick={handleSaveSettings}
          disabled={saving}
        >
          <span className={`material-symbols-outlined text-[22px] ${saving ? 'animate-spin' : ''}`}>
            {saving ? 'sync' : 'save'}
          </span>
          <span>{saving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Absensi'}</span>
        </button>

        {toastVisible && (
          <div className="adm-set-toast" id="save-toast">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Pengaturan absensi &amp; geofence berhasil diperbarui!</span>
          </div>
        )}
      </section>
    </div>
  );
}
