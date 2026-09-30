import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../services/api';
import './admin-karyawan.css';

const EMPTY_FORM = {
  namaLengkap: '',
  email: '',
  telepon: '',
  password: '',
  role: 'karyawan',
  divisi: 'Armada',
};

const ITEMS_PER_PAGE = 10;

export default function AdminKaryawan() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Form state
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      const list = Array.isArray(data) ? data : data?.data || [];
      // If DB is fresh or empty, populate with reference list
      setEmployees(
        list.length > 0
          ? list
          : [
              { id: 1, nama_lengkap: 'aldho', email: 'aldolega34@gmail.com', divisi: 'Armada', status: 'Aktif' },
              { id: 2, nama_lengkap: 'bagus', email: 'bagus@gmail.com', divisi: 'Operasional', status: 'Aktif' },
              { id: 3, nama_lengkap: 'dafitgaming', email: 'dafitdisini@gmail.com', divisi: 'Armada', status: 'Aktif' },
              { id: 4, nama_lengkap: 'ilyasawa', email: 'ilyas@gmail.com', divisi: 'Operasional', status: 'Aktif' },
              { id: 5, nama_lengkap: 'jaka', email: 'jaka@gmail.com', divisi: 'Logistik', status: 'Aktif' },
              { id: 6, nama_lengkap: 'krisna', email: 'krisna@gmail.com', divisi: 'Armada', status: 'Aktif' },
            ]
      );
    } catch (e) {
      console.error('Failed to load employees:', e);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Close row menu on document click
  useEffect(() => {
    const handleDocClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleDocClick);
    return () => window.removeEventListener('click', handleDocClick);
  }, []);

  const openAddModal = () => {
    setEditEmployee(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditEmployee(emp);
    setForm({
      namaLengkap: emp.nama_lengkap || emp.nama || '',
      email: emp.email || '',
      telepon: emp.telepon || '',
      password: '',
      role: emp.role || 'karyawan',
      divisi: emp.divisi || 'Armada',
    });
    setFormErr('');
    setModalOpen(true);
    setActiveMenuId(null);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!form.namaLengkap.trim() || !form.email.trim()) {
      setFormErr('Nama lengkap dan email wajib diisi.');
      return;
    }
    if (!editEmployee && !form.password) {
      setFormErr('Password wajib diisi untuk karyawan baru.');
      return;
    }

    setSaving(true);
    setFormErr('');
    try {
      if (editEmployee) {
        await api.updateEmployee(editEmployee.id, form);
      } else {
        await api.createEmployee(form);
      }
      setModalOpen(false);
      await loadEmployees();
    } catch (err) {
      setFormErr(err.message || 'Gagal menyimpan data karyawan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (emp) => {
    setActiveMenuId(null);
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus data "${emp.nama_lengkap || emp.nama}"?`);
    if (!confirmed) return;

    try {
      await api.deleteEmployee(emp.id);
      await loadEmployees();
    } catch (e) {
      alert('Gagal menghapus karyawan: ' + (e.message || 'Terjadi kesalahan'));
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const name = (emp.nama_lengkap || emp.nama || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const phone = (emp.telepon || '').toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || phone.includes(q);
      if (!matchesSearch) return false;

      if (selectedDept === 'all') return true;
      const dept = (emp.divisi || '').toLowerCase();
      return dept.includes(selectedDept.toLowerCase());
    });
  }, [employees, search, selectedDept]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE));
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  // Color cycles for avatar circles matching reference
  const avatarColors = [
    { bg: '#ffdada', text: '#b80035' }, // Pink/Rose
    { bg: '#d8e3fb', text: '#111c2d' }, // Blue
    { bg: '#dac0c2', text: '#544244' }, // Slate/Grey
    { bg: '#ffdada', text: '#b80035' }, // Pink
    { bg: '#d8e3fb', text: '#111c2d' }, // Blue
    { bg: '#f7dcde', text: '#544244' }, // Soft Rose
  ];

  return (
    <div className="adm-kar-section">
      {/* ── 1. Overview & Quick Action Header ── */}
      <section className="adm-kar-header">
        <div className="adm-kar-header-left">
          <div className="adm-kar-tag">
            <span className="adm-kar-tag-dot"></span>
            <span>Database Terpusat</span>
          </div>
          <h1 className="adm-kar-title">Manajemen Karyawan</h1>
          <p className="adm-kar-subtitle">
            {employees.length} staf aktif terdaftar di sistem operasional
          </p>
        </div>
        <div className="adm-kar-header-icon-box">
          <span className="material-symbols-outlined text-[26px]">badge</span>
        </div>
      </section>

      {/* ── 2. Quick Stats Bento Strip ── */}
      <section className="adm-kar-stats-grid">
        <div className="adm-kar-stat-card">
          <span className="adm-kar-stat-label">Total Staf</span>
          <span className="adm-kar-stat-num">{employees.length}</span>
          <span className="adm-kar-stat-meta" style={{ color: '#b80035' }}>
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
            <span>100%</span>
          </span>
        </div>

        <div className="adm-kar-stat-card">
          <span className="adm-kar-stat-label">Hadir Hari Ini</span>
          <span className="adm-kar-stat-num">{employees.length}</span>
          <span className="adm-kar-stat-meta" style={{ color: '#545f73' }}>
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>Lengkap</span>
          </span>
        </div>

        <div className="adm-kar-stat-card">
          <span className="adm-kar-stat-label">Izin / Cuti</span>
          <span className="adm-kar-stat-num">0</span>
          <span className="adm-kar-stat-meta" style={{ color: '#545f73' }}>
            <span className="material-symbols-outlined text-[14px]">event_available</span>
            <span>Nihil</span>
          </span>
        </div>
      </section>

      {/* ── 3. Primary CTA Button ── */}
      <button
        type="button"
        className="adm-kar-btn-primary"
        onClick={openAddModal}
      >
        <span className="material-symbols-outlined text-[22px]">person_add</span>
        <span>Tambah Karyawan</span>
      </button>

      {/* ── 4. Search & Division Filter Chips ── */}
      <section className="adm-kar-filter-section">
        <div className="adm-kar-search-wrap">
          <span className="material-symbols-outlined adm-kar-search-icon">search</span>
          <input
            type="search"
            id="karyawan-search"
            className="adm-kar-search-input"
            placeholder="Cari nama, email, telepon..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="adm-kar-chips-bar" id="filter-chips">
          <button
            type="button"
            className={`adm-kar-chip ${selectedDept === 'all' ? 'active' : ''}`}
            onClick={() => { setSelectedDept('all'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined text-[14px]">grid_view</span>
            <span>Semua Divisi</span>
          </button>
          <button
            type="button"
            className={`adm-kar-chip ${selectedDept === 'armada' ? 'active' : ''}`}
            onClick={() => { setSelectedDept('armada'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
            <span>Armada</span>
          </button>
          <button
            type="button"
            className={`adm-kar-chip ${selectedDept === 'operasional' ? 'active' : ''}`}
            onClick={() => { setSelectedDept('operasional'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined text-[14px]">hub</span>
            <span>Operasional</span>
          </button>
          <button
            type="button"
            className={`adm-kar-chip ${selectedDept === 'logistik' ? 'active' : ''}`}
            onClick={() => { setSelectedDept('logistik'); setCurrentPage(1); }}
          >
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            <span>Logistik</span>
          </button>
        </div>
      </section>

      {/* ── 5. Roster Card Section ── */}
      <section className="adm-kar-roster-card">
        {/* Table Meta Heading */}
        <div className="adm-kar-roster-heading">
          <div className="adm-kar-roster-left">
            <div className="adm-kar-roster-icon-wrap">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
            <div className="adm-kar-roster-text">
              <h2 className="adm-kar-roster-title">Daftar Karyawan</h2>
              <span className="adm-kar-roster-sub">Terakhir disinkronkan 10m lalu</span>
            </div>
          </div>
          <span className="adm-kar-roster-badge">{filteredEmployees.length} Personel</span>
        </div>

        {/* Table Header */}
        <div className="adm-kar-table-header">
          <div style={{ textAlign: 'center' }}>NO</div>
          <div style={{ paddingLeft: '4px' }}>NAMA LENGKAP & EMAIL</div>
          <div style={{ textAlign: 'center' }}>STATUS</div>
          <div style={{ textAlign: 'right', paddingRight: '4px' }}>AKSI</div>
        </div>

        {/* Staff Rows List */}
        <div className="adm-kar-rows-list" id="employee-list">
          {paginatedList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#545f73', fontSize: '13px' }}>
              Tidak ada data karyawan yang cocok.
            </div>
          ) : (
            paginatedList.map((emp, idx) => {
              const rowNo = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
              const initial = (emp.nama_lengkap || emp.nama || '?')[0].toUpperCase();
              const colors = avatarColors[idx % avatarColors.length];

              return (
                <div key={emp.id || idx} className="adm-kar-row employee-card">
                  <div className="adm-kar-col-no">{rowNo}</div>

                  <div className="adm-kar-col-profile">
                    <div
                      className="adm-kar-row-avatar"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {initial}
                    </div>
                    <div className="adm-kar-row-info">
                      <span className="adm-kar-row-name">
                        {emp.nama_lengkap || emp.nama}
                      </span>
                      <span className="adm-kar-row-email">
                        {emp.email || `${(emp.nama_lengkap || emp.nama).toLowerCase()}@angkasa.co.id`}
                      </span>
                    </div>
                  </div>

                  <div className="adm-kar-col-status">
                    <span className="adm-kar-status-pill">
                      <span className="adm-kar-status-dot"></span>
                      <span>{emp.status || 'Aktif'}</span>
                    </span>
                  </div>

                  <div className="adm-kar-col-action">
                    <button
                      type="button"
                      aria-label="Detail Menu"
                      className="adm-kar-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === emp.id ? null : emp.id);
                      }}
                    >
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === emp.id && (
                      <div className="adm-kar-menu-dropdown" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="adm-kar-menu-item"
                          onClick={() => openEditModal(emp)}
                        >
                          <span className="material-symbols-outlined text-[16px] text-blue-600">edit</span>
                          <span>Edit Data</span>
                        </button>
                        <button
                          type="button"
                          className="adm-kar-menu-item adm-kar-menu-item-del"
                          onClick={() => handleDeleteEmployee(emp)}
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Hapus Staf</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Records & Pagination Footer */}
        <div className="adm-kar-pagination">
          <span className="adm-kar-page-info">
            Menampilkan <strong>{paginatedList.length}</strong> dari <strong>{filteredEmployees.length}</strong> karyawan
          </span>
          <div className="adm-kar-page-ctrls">
            <button
              type="button"
              className="adm-kar-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <span className="adm-kar-page-btn active">{currentPage}</span>
            <button
              type="button"
              className="adm-kar-page-btn"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Halaman berikutnya"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 6. Operational Notice Card ── */}
      <section className="adm-kar-notice-card">
        <div className="adm-kar-notice-left">
          <div className="adm-kar-notice-icon">
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
          </div>
          <div className="adm-kar-notice-text">
            <span className="adm-kar-notice-title">Semua Shift Terisi Penuh</span>
            <span className="adm-kar-notice-desc">Presensi presisi geofence 100m aktif</span>
          </div>
        </div>
        <span className="material-symbols-outlined text-[18px]" style={{ color: '#545f73' }}>
          arrow_forward
        </span>
      </section>

      {/* ── 7. Add / Edit Employee Modal ── */}
      {modalOpen && (
        <div className="adm-kar-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="adm-kar-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-kar-modal-header">
              <div className="adm-kar-modal-title-wrap">
                <span className="material-symbols-outlined text-[22px]" style={{ color: '#e11d48' }}>
                  {editEmployee ? 'edit_square' : 'person_add'}
                </span>
                <h3 className="adm-kar-modal-title">
                  {editEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
              </div>
              <button
                type="button"
                className="adm-kar-modal-close"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="adm-kar-modal-form">
              {formErr && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#ffe4e6',
                    color: '#b80035',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {formErr}
                </div>
              )}

              <div className="adm-kar-input-group">
                <label className="adm-kar-input-label">
                  Nama Lengkap <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <input
                  type="text"
                  className="adm-kar-modal-input"
                  placeholder="Contoh: Aldho"
                  value={form.namaLengkap}
                  onChange={(e) => setForm((p) => ({ ...p, namaLengkap: e.target.value }))}
                  required
                />
              </div>

              <div className="adm-kar-input-group">
                <label className="adm-kar-input-label">
                  Alamat Email <span style={{ color: '#e11d48' }}>*</span>
                </label>
                <input
                  type="email"
                  className="adm-kar-modal-input"
                  placeholder="nama@angkasa.co.id"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>

              <div className="adm-kar-input-group">
                <label className="adm-kar-input-label">Nomor Telepon</label>
                <input
                  type="tel"
                  className="adm-kar-modal-input"
                  placeholder="08123456789"
                  value={form.telepon}
                  onChange={(e) => setForm((p) => ({ ...p, telepon: e.target.value }))}
                />
              </div>

              <div className="adm-kar-input-group">
                <label className="adm-kar-input-label">Divisi</label>
                <select
                  className="adm-kar-modal-input"
                  style={{ cursor: 'pointer' }}
                  value={form.divisi}
                  onChange={(e) => setForm((p) => ({ ...p, divisi: e.target.value }))}
                >
                  <option value="Armada">Armada Pengiriman</option>
                  <option value="Operasional">Operasional Hub</option>
                  <option value="Logistik">Logistik & Gudang</option>
                </select>
              </div>

              <div className="adm-kar-input-group">
                <label className="adm-kar-input-label">
                  {editEmployee ? 'Kata Sandi Baru (Kosongkan jika tetap)' : 'Kata Sandi Awal *'}
                </label>
                <input
                  type="password"
                  className="adm-kar-modal-input"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required={!editEmployee}
                />
              </div>

              <div className="adm-kar-modal-footer">
                <button
                  type="button"
                  className="adm-kar-btn-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="adm-kar-btn-submit"
                >
                  {saving ? 'Menyimpan...' : editEmployee ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
