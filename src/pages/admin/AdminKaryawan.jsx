import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const EMPTY_FORM = { namaLengkap: '', email: '', telepon: '', password: '' };

function EmployeeModal({ isOpen, onClose, onSave, editData }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (editData) {
      setForm({
        namaLengkap: editData.nama_lengkap || '',
        email: editData.email || '',
        telepon: editData.telepon || '',
        password: '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErr('');
  }, [editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.namaLengkap.trim() || !form.email.trim()) {
      setErr('Nama lengkap dan email wajib diisi');
      return;
    }
    if (!editData && !form.password) {
      setErr('Password wajib diisi untuk karyawan baru');
      return;
    }

    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <i className="fa-solid fa-user-plus" style={{ color: 'var(--brand)' }}></i>
            <h3>{editData ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {err && (
            <div className="modal-err animate-fade-in">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{err}</span>
            </div>
          )}

          <div className="modal-grid">
            <div className="mf-group">
              <label className="mf-label">Nama Lengkap <span className="req">*</span></label>
              <input
                type="text"
                className="mf-input"
                value={form.namaLengkap}
                onChange={e => setForm(p => ({ ...p, namaLengkap: e.target.value }))}
                required
                placeholder="Contoh: Budi Santoso"
              />
            </div>

            <div className="mf-group">
              <label className="mf-label">Alamat Email <span className="req">*</span></label>
              <input
                type="email"
                className="mf-input"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                placeholder="nama@email.com"
              />
            </div>

            <div className="mf-group">
              <label className="mf-label">Nomor Telepon / WhatsApp</label>
              <input
                type="tel"
                className="mf-input"
                value={form.telepon}
                onChange={e => setForm(p => ({ ...p, telepon: e.target.value }))}
                placeholder="08123456789"
              />
            </div>

            <div className="mf-group">
              <label className="mf-label">
                {editData ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password Awal *'}
              </label>
              <input
                type="password"
                className="mf-input"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required={!editData}
                placeholder={editData ? 'Biarkan kosong untuk mempertahankan password lama' : 'Minimal 6 karakter'}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="mf-btn cancel" onClick={onClose}>Batal</button>
            <button type="submit" className="mf-btn save" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminKaryawan() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getEmployees();
      setEmployees(Array.isArray(data) ? data : (data?.data || []));
    } catch (e) {
      console.error('Fetch employees err:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter(e =>
    (e.nama_lengkap || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.telepon || '').includes(search)
  );

  const handleAdd = () => { setEditData(null); setShowModal(true); };
  const handleEdit = (emp) => { setEditData(emp); setShowModal(true); };

  const handleSave = async (formData) => {
    if (editData) {
      await api.updateEmployee(editData.id, formData);
    } else {
      await api.createEmployee(formData);
    }
    load();
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin ingin menghapus karyawan "${nama}"? Semua riwayat absensi terkait juga akan dihapus.`)) return;
    try {
      await api.deleteEmployee(id);
      load();
    } catch (e) {
      alert(e.message || 'Gagal menghapus karyawan');
    }
  };

  return (
    <div className="admin-page-container">
      <EmployeeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        editData={editData}
      />

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Manajemen Karyawan</h1>
          <p className="admin-page-subtitle">{employees.length} staf aktif terdaftar di sistem</p>
        </div>
        <button className="btn-add" onClick={handleAdd}>
          <i className="fa-solid fa-plus"></i>
          <span>Tambah Karyawan</span>
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <div className="admin-card-title">
            <i className="fa-solid fa-users"></i>
            <span>Daftar Karyawan ({filtered.length})</span>
          </div>
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Cari nama, email, telepon..."
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
              <span>Memuat data karyawan...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-center">
              <i className="fa-regular fa-folder-open"></i>
              <p>Tidak ada data karyawan yang cocok</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No</th>
                  <th>Nama Lengkap</th>
                  <th>Email</th>
                  <th>No. Telepon / WhatsApp</th>
                  <th style={{ textAlign: 'center', width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((k, i) => (
                  <tr key={k.id || i}>
                    <td className="td-no">{i + 1}</td>
                    <td>
                      <div className="td-name">
                        <div className="td-avatar">{(k.nama_lengkap || '?')[0].toUpperCase()}</div>
                        <span className="name-bold">{k.nama_lengkap}</span>
                      </div>
                    </td>
                    <td className="td-muted">{k.email}</td>
                    <td className="td-mono">{k.telepon || '–'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="row-actions">
                        <button
                          className="btn-action edit"
                          onClick={() => handleEdit(k)}
                          title="Edit Karyawan"
                        >
                          <i className="fa-solid fa-pencil"></i>
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => handleDelete(k.id, k.nama_lengkap)}
                          title="Hapus Karyawan"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

        .btn-add {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(230, 0, 0, 0.3);
          font-family: inherit;
        }
        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(230, 0, 0, 0.4);
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
        .td-muted { color: var(--text-muted); font-family: monospace; font-size: 12.5px; }
        .td-mono { font-family: monospace; font-weight: 600; color: var(--text-primary); }

        .row-actions {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-action {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid var(--border-color);
          background: var(--bg-page);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-action.edit:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        .btn-action.delete:hover {
          border-color: #ef4444;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
          animation: fadeIn 0.2s ease forwards;
        }
        .modal-box {
          background: var(--bg-card);
          border-radius: 18px;
          max-width: 480px;
          width: 100%;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-title-wrap h3 {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .modal-close {
          background: transparent;
          border: none;
          font-size: 22px;
          color: var(--text-muted);
          cursor: pointer;
        }
        .modal-close:hover { color: var(--text-primary); }

        .modal-form {
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-err {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
          border-radius: 10px;
          font-size: 13px;
        }
        .modal-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .mf-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .mf-label {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .req { color: var(--brand); }
        .mf-input {
          padding: 10px 14px;
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-page);
          color: var(--text-primary);
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
        }
        .mf-input:focus { border-color: var(--brand); }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
        }
        .mf-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          border: none;
          transition: all 0.2s;
        }
        .mf-btn.cancel {
          background: var(--bg-page);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        .mf-btn.save {
          background: var(--brand);
          color: #fff;
        }
        .mf-btn.save:hover:not(:disabled) { background: var(--brand-dark); }
        .mf-btn.save:disabled { opacity: 0.6; cursor: not-allowed; }

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
