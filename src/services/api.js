// Central API Service Client for Angkasa Absen

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorMsg = 'Terjadi kesalahan sistem';
      try {
        const errJson = await res.json();
        errorMsg = errJson.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return res;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  login: (username, password) =>
    request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  // Attendance
  getTodayAttendance: (userId) =>
    request(`/attendance/today/${userId}`),

  clockIn: (data) =>
    request('/clockin', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  clockOut: (data) =>
    request('/clockout', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  submitIzin: (data) =>
    request('/izin', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getHistory: (userId, bulan) =>
    request(`/attendance/history/${userId}?bulan=${bulan}`),

  // Profile
  getProfile: (userId) =>
    request(`/users/${userId}/profile`),

  updateProfile: (userId, data) =>
    request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Admin APIs
  getDashboardSummary: () =>
    request('/dashboard/summaryToday'),

  getDailyAttendance: (tanggal) =>
    request(`/absensi/harian?tanggal=${tanggal}`),

  getEmployees: () =>
    request('/karyawan'),

  getEmployeeCount: () =>
    request('/karyawan/count'),

  createEmployee: (data) =>
    request('/karyawan', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateEmployee: (id, data) =>
    request(`/karyawan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteEmployee: (id) =>
    request(`/karyawan/${id}`, {
      method: 'DELETE'
    }),

  getAttendanceSettings: () =>
    request('/settings/attendance'),

  updateAttendanceSettings: (settings) =>
    request('/settings/attendance', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  getMonthlyRecap: (bulan) =>
    request(`/rekap/bulanan?bulan=${bulan}`),

  downloadRecapExcelUrl: (bulan) =>
    `/api/rekap/download?bulan=${bulan}`
};
