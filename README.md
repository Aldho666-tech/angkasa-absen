# ✈️ Angkasa Absen — Sistem Presensi & Monitoring Karyawan Rute

Aplikasi web presensi digital modern yang dirancang untuk **PT Angkasa Ekspres Indonesia (Kp Rute)**. Sistem ini memungkinkan karyawan armada dan kantor melakukan absensi masuk & pulang dengan verifikasi kamera (selfie), validasi radius geofence GPS anti-fake GPS, timer durasi kerja berjalan, pengajuan izin/cuti online, serta rekapitulasi kehadiran lengkap bagi manajemen dan HRD.

---

## 🌟 Fitur Utama

### 1. 👤 Portal Karyawan (`dashboard.html`)
- **Desain Modern & Responsif**: Tampilan antarmuka profesional berbasis CSS Variables dengan dukungan mode gelap (Dark Mode).
- **Absensi Masuk & Pulang**: Dilengkapi verifikasi kamera langsung (webcam/kamera HP) dengan watermark otomatis nama, waktu, dan koordinat.
- **Validasi Geofencing GPS**: Menghitung jarak pengguna ke titik kantor menggunakan rumus *Haversine*, memastikan karyawan berada dalam radius aman yang ditentukan.
- **⏱️ Jam Kerja Berjalan (Live Work Timer)**: Menghitung secara real-time jam, menit, dan detik durasi kerja sejak absen masuk hingga pulang.
- **🔊 Umpan Balik Audio (Web Audio API)**: Suara chime sintetis saat absen berhasil tanpa dependensi file audio eksternal.
- **📑 Pengajuan Izin / Cuti / Sakit Online**: Formulir pengajuan izin langsung tersimpan ke sistem absensi dan langsung terpantau oleh admin.
- **🖨️ Cetak Slip Presensi & Unduh CSV**: Karyawan dapat langsung mencetak bukti kehadiran resmi dengan kop perusahaan atau mengekspornya ke format `.csv`.
- **Profil & Ubah Password**: Kemudahan memperbarui data kontak, foto profil, dan kata sandi mandiri.

### 2. 👑 Panel Manajemen / HRD (`admin.html`)
- **Dashboard Ringkasan Hari Ini**: Statistik live jumlah kehadiran (Hadir, Telat, Izin/Sakit, Cuti) dan total karyawan aktif.
- **Monitoring Harian Real-Time**: Cek absensi seluruh staf per tanggal lengkap dengan foto selfie, jam masuk/pulang, dan catatan lokasi.
- **Rekapitulasi Bulanan & Ekspor Excel**: Filter absensi per bulan dan unduh laporan resmi berformat `.xlsx` yang rapi dan siap cetak.
- **Manajemen Akun Karyawan (CRUD)**: Tambah karyawan baru, perbarui profil/telepon/password, dan hapus akun.
- **Konfigurasi Pengaturan Absensi**: Atur toleransi jam masuk kantor, jam pulang, titik koordinat latitude/longitude kantor, serta radius toleransi (meter).

### 3. 🔐 Desain Login Split-Card (`index.html`)
- Desain *split-card layout* elegan terinspirasi dari referensi modern.
- Dilengkapi ilustrasi armada Angkasa Ekspres, toggle show/hide password, link bantuan lupa sandi, dan tombol **Quick Login Demo** (sekali klik langsung isi akun admin / karyawan).

---

## 🛠️ Teknologi yang Digunakan

- **Backend**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**:
  - **SQLite** bawaan (`node:sqlite` DatabaseSync) — file `attendance.db` (tidak memerlukan install server database tambahan, langsung jalan *out-of-the-box*).
  - Skema kompatibel penuh dengan **MySQL / MariaDB** (tersedia file dump `attendance_system (1).sql`).
- **Frontend Modern**: **React 19**, **Vite**, **React Router v7**, Vanilla CSS3 Design System (Glassmorphism, Micro-animations, Mobile App Shell Dock), Lucide Icons & Font Awesome 6.
- **Pustaka Tambahan**:
  - `bcryptjs`: Enkripsi hash password.
  - `exceljs`: Generator file Excel laporan absensi.
  - `cors`: Cross-Origin Resource Sharing.
  - `canvas-confetti`: Efek perayaan visual saat presensi berhasil.

---

## 🚀 Panduan Menjalankan Aplikasi

### Persyaratan Sistem
- Node.js versi **18.x** atau yang lebih baru (disarankan Node.js 20+).
- Web browser modern (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari).

### Opsi 1: Mode Produksi / Fullstack Server (Direkomendasikan)
1. **Instal Dependensi**:
   ```bash
   npm install
   ```
2. **Build Bundle Frontend**:
   ```bash
   npm run build
   ```
3. **Jalankan Server Backend Express**:
   ```bash
   npm start
   # atau: node server.js
   ```
4. Buka di browser: `http://localhost:3000`

### Opsi 2: Mode Pengembangan (Vite HMR + Backend)
1. **Jalankan Backend Server** (Terminal 1):
   ```bash
   node server.js
   ```
2. **Jalankan Vite Dev Server** (Terminal 2):
   ```bash
   npm run dev
   ```
3. Buka di browser: `http://localhost:5173` (Vite otomatis mem-proxy request `/api` ke `localhost:3000`).

---

## 🔑 Akun Login Bawaan (Default Demo)

| Role | Email / Username | Password | Deskripsi |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `adminaldo@gmail.com` | `admin123` | Akses penuh ke panel admin & manajemen data |
| **👤 Karyawan** | `jaka@gmail.com` | `jaka123` | Akses ke dashboard absensi staf |
| **👤 Karyawan 2** | `krisna@gmail.com` | `123456` | Karyawan alternatif |
| **👤 Karyawan 3** | `dafitdisini@gmail.com` | `123456` | Karyawan alternatif |

> **Tips:** Di halaman login terdapat tombol **Quick Login** (`👑 Admin Panel` dan `👤 Karyawan (Jaka)`). Klik tombol tersebut untuk mengisi form secara otomatis.

---

## 📁 Struktur Direktori Proyek

```text
angkasa-absen/
├── Admin-Avatar.png            # Asset gambar armada / avatar admin
├── admin.html                  # Halaman portal admin
├── attendance.db               # Database SQLite lokal aktif
├── attendance_system (1).sql   # Script SQL skema tabel untuk MySQL
├── css/
│   ├── admin.css               # Styling halaman admin
│   ├── dashboard.css           # Styling dashboard karyawan
│   ├── style.css               # Styling halaman login (Pinterest-inspired)
│   └── asset/
│       ├── LOGO.png            # Logo resmi Angkasa Ekspres
│       └── truck.png           # Gambar armada truk logistik
├── dashboard.html              # Halaman portal karyawan
├── index.html                  # Halaman login utama
├── js/
│   ├── admin.js                # Logika frontend admin
│   ├── dashboard.js            # Logika frontend absensi & kamera karyawan
│   └── login.js                # Logika frontend otentikasi login
├── package.json                # Manifest dependensi & script node
├── server.js                   # Server backend Express & API endpoint
├── PROJECT_CONTEXT.md          # Dokumen arsitektur lengkap & konteks AI
└── README.md                   # Dokumentasi umum proyek ini
```

---

## 📄 Lisensi & Hak Cipta
Hak Cipta &copy; 2025 **PT Angkasa Ekspres Indonesia** &bull; Kp Rute. Dikembangkan untuk efisiensi dan transparansi operasional tim.
