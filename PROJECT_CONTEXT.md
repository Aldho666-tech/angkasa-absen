# 📌 PROJECT CONTEXT & SYSTEM ARCHITECTURE
> **Tujuan Dokumen Ini**: Referensi teknis permanen dan menyeluruh mengenai aplikasi **Angkasa Absen**. Semua arsitektur, skema basis data, spesifikasi API endpoint, mekanisme sesi, dan alur kerja didokumentasikan di sini agar AI agent maupun developer tidak perlu melakukan analisis ulang dari nol.

---

## 1. Identitas & Ringkasan Proyek
- **Nama Aplikasi**: Angkasa Absen (Kp Rute)
- **Domain Bisnis**: Sistem Presensi Digital & Monitoring Operasional Karyawan dan Armada PT Angkasa Ekspres Indonesia.
- **Port Default**: `3000` (`http://localhost:3000`)
- **File Server Utama**: `server.js` (Express.js)
- **Database Aktif Default**: SQLite lokal (`attendance.db`) menggunakan modul bawaan Node.js `node:sqlite` (`DatabaseSync`). Tidak membutuhkan instalasi MySQL/PostgreSQL terpisah untuk langsung beroperasi.
- **Dukungan Database Relasional**: Skema SQL kompatibel dengan MySQL / MariaDB tersedia di file `attendance_system (1).sql`.

---

## 2. Kredensial & Akun Bawaan (Default Accounts)

| Email / Username | Password Plaintext | Role / Akses | ID Pengguna | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `adminaldo@gmail.com` | `admin123` | `admin` | `1` | Akun Administrator Utama |
| `adminilyas@gmail.com` | `admin123` | `admin` | `5` | Akun Admin Kedua |
| `jaka@gmail.com` | `jaka123` *(atau `123456`)* | `user` | `2` | Karyawan Utama Demo |
| `krisna@gmail.com` | `123456` | `user` | `3` | Karyawan |
| `dafitdisini@gmail.com` | `123456` | `user` | `4` | Karyawan |
| `ilyas@gmail.com` | `123456` | `user` | `6` | Karyawan |
| `bagus@gmail.com` | `123456` | `user` | `7` | Karyawan |

> **Catatan Keamanan di `server.js`:**
> Password dienkripsi menggunakan `bcryptjs` (salt rounds 10). Untuk kemudahan demo dan pengetesan lokal tanpa risiko terkunci, `server.js` mengizinkan bypass jika password input sama dengan `'admin123'` atau `'123456'`.

---

## 3. Skema Basis Data (Database Schema)

Database SQLite disimpan di file `attendance.db`. Tiga tabel utama:

### Tabel 1: `users`
Menyimpan informasi identitas karyawan dan administrator.
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_lengkap TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    telepon TEXT,
    foto_profil TEXT,            -- Data URL base64 atau path gambar
    password_hash TEXT NOT NULL
);
```

### Tabel 2: `attendance`
Menyimpan catatan presensi harian, koordinat, foto selfie, dan status.
```sql
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tanggal TEXT NOT NULL,       -- Format: YYYY-MM-DD
    status TEXT NOT NULL DEFAULT 'Hadir', -- 'Hadir', 'Telat', 'Izin', 'Sakit', 'Cuti'
    waktu_masuk TEXT,            -- Format: HH:MM:SS
    lokasi_masuk TEXT,           -- Koordinat / catatan teks
    foto_masuk TEXT,             -- Data URL foto selfie masuk (base64)
    waktu_pulang TEXT,           -- Format: HH:MM:SS
    lokasi_pulang TEXT,          -- Koordinat / catatan teks pulang
    foto_pulang TEXT,            -- Data URL foto selfie pulang (base64)
    UNIQUE(user_id, tanggal)     -- 1 user hanya memiliki 1 baris per tanggal
);
```

### Tabel 3: `attendance_settings`
Menyimpan batas jam kantor dan titik koordinat geofence GPS kantor pusat.
```sql
CREATE TABLE IF NOT EXISTS attendance_settings (
    id INTEGER PRIMARY KEY,
    jam_masuk TEXT DEFAULT '08:00:00',
    jam_pulang TEXT DEFAULT '17:00:00',
    latitude REAL DEFAULT -6.34395432,
    longitude REAL DEFAULT 106.73780986,
    radius INTEGER DEFAULT 100   -- Toleransi jarak dalam satuan meter
);
```

---

## 4. Alur Autentikasi & Penyimpanan Sesi (Session Management)

1. Pengguna memasukkan kredensial di `index.html`.
2. Form memanggil `POST /api/login`.
3. Server memverifikasi kecocokan email/username dan hash password.
4. Server mengevaluasi email: jika mengandung kata `"admin"`, `role = "admin"`, selain itu `role = "user"`.
5. Frontend menyimpan data sesi ke `sessionStorage`:
   - `sessionStorage.setItem('userData', JSON.stringify(result.userData))`
   - `sessionStorage.setItem('userRole', result.role)`
6. **Pengalihan Halaman**:
   - Jika `role === 'admin'` &rarr; dialihkan ke `admin.html`.
   - Jika `role === 'user'` &rarr; dialihkan ke `dashboard.html`.
7. **Logout**: Memanggil `sessionStorage.clear()` dan redirect ke `index.html`.
8. **Dark Mode**: Disimpan di `localStorage.getItem('darkMode')` (`'true'` / `'false'`).

---

## 5. Katalog Lengkap REST API (`server.js`)

Base URL: `http://localhost:3000/api`

### A. Autentikasi & Health
| Method | Endpoint | Request Body | Respons Sukses (JSON) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | *-* | `{ status: "OK", database: "sqlite", time: "..." }` | Pengecekan server aktif |
| `POST` | `/login` | `{ username, password }` | `{ success: true, message: "Login berhasil!", role: "user"|"admin", userData: {...} }` | Login user atau admin |

### B. Presensi Karyawan
| Method | Endpoint | Request Body / Query | Respons Sukses (JSON) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/clockin` | `{ userId, time, location, photo }` | `{ message: "Absen masuk berhasil dengan status: Hadir|Telat" }` | Jam > batas kantor = Telat |
| `POST` | `/clockout` | `{ userId, time, location, photo }` | `{ message: "Absen pulang berhasil" }` | Memperbarui baris hari ini |
| `POST` | `/izin` | `{ userId, tanggal, tipe, keterangan }` | `{ message: "Pengajuan [Tipe] berhasil dicatat!" }` | Input Izin, Sakit, atau Cuti |
| `GET` | `/attendance/today/:userId` | Params: `userId` | `{ status: "found"|"not_found", data: {...}|null }` | Status absensi hari ini |
| `GET` | `/attendance/history/:userId` | Query: `?bulan=YYYY-MM` | `[ { tanggal, status, waktu_masuk, waktu_pulang }, ... ]` | Riwayat bulanan user |

### C. Profil Karyawan
| Method | Endpoint | Request Body | Respons Sukses (JSON) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users/:id/profile` | Params: `id` | `{ id, namaLengkap, email, telepon, foto_profil }` | Mengambil data profil |
| `PUT` | `/users/:id/profile` | `{ namaLengkap, email, telepon, foto_profil, password }` | `{ message: "Profil berhasil diperbarui!", updatedUser: {...} }` | Update data / password |

### D. Panel Manajemen Admin
| Method | Endpoint | Request Body / Query | Respons Sukses (JSON) | Keterangan |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/summaryToday` | *-* | `{ hadir: N, telat: N, cuti: N, izin: N }` | Angka ringkasan live hari ini |
| `GET` | `/absensi/harian` | Query: `?tanggal=YYYY-MM-DD` | `[ { nama_lengkap, status, waktu_masuk, waktu_pulang, lokasi_masuk, foto_masuk }, ... ]` | Detail absensi seluruh staf |
| `GET` | `/karyawan` | *-* | `[ { id, nama_lengkap, email, telepon }, ... ]` | Daftar seluruh non-admin |
| `GET` | `/karyawan/count` | *-* | `{ count: N }` | Jumlah total karyawan |
| `POST` | `/karyawan` | `{ namaLengkap, email, telepon, password }` | `{ message: "Karyawan baru berhasil ditambahkan" }` (201) | Tambah staf baru |
| `PUT` | `/karyawan/:id` | `{ namaLengkap, email, telepon, password }` | `{ message: "Data berhasil diperbarui" }` | Ubah data staf |
| `DELETE` | `/karyawan/:id` | Params: `id` | `{ message: "Karyawan berhasil dihapus" }` | Hapus staf & absensinya |
| `GET` | `/settings/attendance` | *-* | `{ id, jam_masuk, jam_pulang, latitude, longitude, radius }` | Ambil pengaturan absensi |
| `PUT` | `/settings/attendance` | `{ jam_masuk, jam_pulang, latitude, longitude, radius }` | `{ message: "Pengaturan absensi berhasil disimpan!" }` | Update pengaturan kantor |
| `GET` | `/rekap/bulanan` | Query: `?bulan=YYYY-MM` | `[ { nama_lengkap, tanggal, status, waktu_masuk, waktu_pulang }, ... ]` | Rekap absensi bulanan |
| `GET` | `/rekap/download` | Query: `?bulan=YYYY-MM` | Binary Excel stream (`.xlsx`) | Download file rekap absensi |

---

## 6. Arsitektur Frontend & Pemetaan File

### 1. `index.html` (Halaman Login)
- **CSS**: `css/style.css`
- **JS**: `js/login.js`
- **Tampilan**: *Split-Card Layout* modern berestetika tinggi (terinspirasi dari Pinterest/SaaS modern).
  - Kolom Kiri: Panel visual bergradien merah Angkasa (`linear-gradient(145deg, #e60000, #c00000, #990000)`) dengan badge fitur ("Presensi Cepat & Akurat"), showcase gambar armada truk logistik Angkasa (`css/asset/truck.png`), floating pills ("GPS Geofence Verified", "Face Biometric Capture"), dan statistik akurasi 99.8%.
  - Kolom Kanan: Form masuk elegan dengan logo PT Angkasa Ekspres Indonesia (`css/asset/LOGO.png`), input floating/outline, toggle view password, dan tombol **Quick Login Demo** instan (`👑 Admin Panel` & `👤 Karyawan (Jaka)`).
  - Responsif: Berubah otomatis menjadi single-column card pada layar mobile (≤ 768px).

### 2. `dashboard.html` (Portal Karyawan)
- **CSS**: `css/dashboard.css`
- **JS**: `js/dashboard.js`
- **Tampilan & Tema**: Palet warna Merah Angkasa (`#e60000`) dengan sidebar drawer pada layar mobile (≤ 1024px), topbar sticky dengan live clock & dark mode toggle, serta antarmuka mobile ringkas bergaya Hadirr.
- **Fitur Frontend Unggulan**:
  - **Live Work Duration Timer**: Menghitung durasi kerja secara live sejak klik absen masuk (`updateWorkDuration`).
  - **Umpan Balik Audio Web Audio API**: Sintesis nada C5-E5-G5 saat masuk dan nada menurun saat pulang tanpa file eksternal.
  - **Kamera & Watermark Canvas**: Capture video webcam/kamera HP dengan stempel nama, timestamp detik, dan koordinat GPS.
  - **Cetak Slip Presensi**: Jendela pop-up siap cetak (`window.print()`) dengan kop surat PT Angkasa Ekspres Indonesia.
  - **Export CSV**: Mengunduh riwayat presensi bulanan ke format CSV.
  - **Formulir Pengajuan Izin**: Mengirim izin, sakit, cuti langsung ke backend `/api/izin`.
  - **Peta GPS Interaktif**: Mengklik badge lokasi langsung membuka titik koordinat Google Maps.
  - **Quick Mobile Actions**: 2-kolom grid tombol ringkas di tampilan mobile (< 640px) untuk navigasi cepat.

### 3. `admin.html` (Panel Kontrol Manajemen)
- **CSS**: `css/admin.css`
- **JS**: `js/admin.js`
- **Tampilan & Tema**: Mengadopsi arsitektur desain yang sepenuhnya selaras dengan portal karyawan (`dashboard.html`):
  - Sidebar: Gradien merah Angkasa (`linear-gradient(160deg, #e60000 0%, #990000 100%)`) dengan avatar admin, drawer sidebar pada mobile (≤ 1024px) dengan backdrop overlay.
  - Topbar: Sticky topbar dengan hamburger toggle sidebar, logo teks Angkasa Admin, dan toggle dark mode.
  - Kartu Metrik: `.admin-stat-grid` dengan 4 kartu ringkasan harian (Hadir [hijau], Telat [oranye], Izin/Sakit [biru], Cuti [ungu]).
  - Tabel Data: Thead bergradien merah Angkasa, hover baris bertingkat, badge status terstandarisasi, dan foto thumbnail presensi yang bisa diperbesar lewat modal.
  - Modal Modern: Form dialog terpusat dengan tombol tutup dan aksi simpan bertema brand merah.
- **Fitur Utama**:
  - Ringkasan statistik real-time harian.
  - Tabel monitoring absensi harian dan preview foto selfie.
  - Unduh rekap bulanan ke berkas Excel asli (`.xlsx`) via endpoint `/api/rekap/download`.
  - Manajemen karyawan (CRUD: Tambah, Ubah, Hapus).
  - Edit profil admin & ganti avatar / password.
  - Pengaturan absensi (jam masuk, jam pulang, titik koordinat GPS kantor, radius geofence).

---

## 7. Algoritma Kunci yang Diimplementasikan

### A. Rumus Haversine (Validasi Radius Geofencing)
Menghitung jarak terpendek melengkung di permukaan bumi antara lokasi pengguna `(lat1, lon1)` dan kantor `(lat2, lon2)`:
$$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta\text{lon}}{2}\right)}\right)$$
Di mana radius bumi $R = 6.371.000\text{ meter}$. Jika $d \le \text{radiusSetting}$, presensi diizinkan. Jika ditolak browser, otomatis menggunakan koordinat default kantor agar pengetesan lokal tidak terganggu.

### B. Watermarking Foto Presensi
Mengambil frame video webcam, menggambarnya ke `<canvas>`, menambahkan baris teks nama staf, timestamp detik lokal, dan koordinat GPS, lalu dikonversi ke Base64 JPEG dengan kompresi kualitas 80%.

---

## 8. Panduan Cepat Penanganan Masalah (Troubleshooting)

1. **Ingin Me-reset Database ke Kondisi Awal?**
   ```bash
   rm attendance.db
   # Restart server, server.js otomatis menginisialisasi ulang tabel & akun demo:
   node server.js
   ```

2. **Ingin Menguji Login Cepat via Terminal?**
   ```bash
   curl -X POST http://localhost:3000/api/login \
     -H "Content-Type: application/json" \
     -d '{"username":"jaka@gmail.com","password":"jaka123"}'
   ```

3. **Ingin Menguji Pengajuan Izin via Terminal?**
   ```bash
   curl -X POST http://localhost:3000/api/izin \
     -H "Content-Type: application/json" \
     -d '{"userId":2,"tipe":"Izin","keterangan":"Keperluan keluarga"}'
   ```


---

## 9. Sistem Desain & Identitas Visual (Design System)

### A. Palet Warna Utama (Angkasa Brand Red Theme)
Semua halaman (`index.html`, `dashboard.html`, `admin.html`) telah diselaraskan menggunakan identitas warna merah resmi Angkasa Ekspres:

| Nama Variabel CSS | Nilai Warna Hex | Penggunaan Utama |
| :--- | :--- | :--- |
| `--brand` / `--primary` | `#e60000` | Warna brand utama, tombol primer, active state menu, banner header, fokus input |
| `--brand-dark` / `--primary-hover` | `#990000` | Hover state tombol primer, gradien sidebar bawah, border aktif |
| `--brand-light` | `#ff5c5c` | Aksen terang, highlight gradien, pill badge |
| `--brand-50` | `#fff1f1` | Background badge halus, hover baris tabel |
| `--brand-100` | `#ffe4e4` | Background alert info, card subtle background |
| `--brand-200` | `#fecaca` | Border aksen ringan |

### B. Warna Semantik Status (Dipertahankan untuk Kejelasan Informasi)
| Status | Warna Utama | Background Badge | Keterangan |
| :--- | :--- | :--- | :--- |
| **Hadir / Tepat Waktu** | `#16a34a` (Hijau) | `#dcfce7` | Datang sebelum/pada jam kantor |
| **Terlambat (Telat)** | `#f97316` (Oranye) | `#ffedd5` | Datang setelah jam kantor |
| **Izin / Sakit** | `#2563eb` (Biru) | `#dbeafe` | Dispensasi presensi staf |
| **Cuti** | `#8b5cf6` (Ungu) | `#ede9fe` | Pengajuan cuti terencana |
| **Alpha / Belum Masuk** | `#dc2626` (Merah Tua) | `#fee2e2` | Tidak hadir tanpa keterangan |

### C. Pola Responsif & Breakpoints
1. **Desktop (> 1024px)**:
   - Sidebar statis dengan lebar tetap 260px.
   - Konten utama memiliki padding luas (28px) dengan multi-column grid layout.
2. **Tablet & Layar Sedang (768px – 1024px)**:
   - Sidebar beralih ke mode off-canvas / drawer (`transform: translateX(-100%)`).
   - Tombol hamburger di topbar memicu kelas `.sidebar.mobile-open` dengan backdrop gelap `.mobile-overlay`.
3. **Mobile Smartphone (< 768px)**:
   - Single-column linear layout.
   - Tombol aksi cepat dan kartu ringkasan beradaptasi menjadi 2-kolom ringkas (gaya Hadirr).
   - Tabel dilengkapi pembungkus horizontal scroll (`overflow-x: auto`) yang halus.

---

## 10. Riwayat Pembaruan & Log Perubahan (Changelog)

- **v2.5.0 — Modern Attendance Dashboard Overhaul**:
  - `dashboard.html` & `css/dashboard.css`: Desain ulang layout portal karyawan menjadi ultra-modern:
    - **Hero Welcome Banner**: Mengadopsi gradien halus merah Angkasa, floating glass cards untuk metrik bulanan (Hadir, Telat, Alpha) dengan backdrop-filter blur dan efek hover.
    - **4-Card Metrics Strip**: Menggantikan 3 kartu lama yang asimetris dengan 4 metrik seimbang (Jam Masuk, Jam Pulang, Durasi Kerja Live, Status Presensi).
    - **Biometric Terminal Viewfinder**: Desain scanner futuristik dengan 4 sudut bingkai (scanner corners), ribbon status GPS lengkap dengan link Google Maps, serta perbaikan bug overlay "Kamera Belum Aktif" yang sebelumnya menghalangi wajah.
    - **Attendance Journey Hub**: Menata ulang kartu kanan menjadi hub status modern yang memadukan jam digital digital-clock-box dengan tracker linimasa presensi (Absen Masuk &rarr; Durasi Kerja Live &rarr; Absen Pulang &rarr; Status Keseluruhan).
    - **Sticky Glassmorphic Topbar**: Menjamin topbar tetap menempel rapi saat scroll di layar desktop dengan dukungan `backdrop-filter: blur(16px)` dan perbaikan `overflow-x: clip`.
  - `js/dashboard.js`: Sinkronisasi otomatis nilai durasi kerja aktif ke strip metrik 4-kolom (`stat-durasi-display` & `stat-durasi-badge`) serta penanganan show/hide overlay kamera saat stream video aktif/nonaktif.

- **v2.4.0 — Red Brand Theming & Admin Panel Redesign**:
  - `css/admin.css` & `admin.html`: Ditulis ulang total agar arsitektur layout, sidebar drawer mobile, topbar, dan kartu metrik seragam 1:1 dengan portal karyawan.
  - Warna Brand Red (`#e60000` / `#990000`): Diterapkan konsisten pada login (`css/style.css`), portal karyawan (`css/dashboard.css` + `dashboard.html`), dan panel admin (`css/admin.css` + `admin.html`).
  - Mobile Drawer Sidebar & Overlay: Menggantikan toggle squeeze lama pada admin dengan sistem drawer modern yang ramah sentuhan (touch-friendly).
  - Penghapusan ketergantungan warna indigo/biru pada elemen chrome aplikasi menjadi merah Angkasa, menjaga warna hijau/oranye/biru hanya untuk arti semantik data.

---
*Dokumen ini dikelola secara berkala sebagai panduan baku sistem Angkasa Absen.*

