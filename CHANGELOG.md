# 📋 RIWAYAT PENGERJAAN & PERUBAHAN SISTEM (CHANGELOG)
**Proyek:** PT Angkasa Ekspres Indonesia — Sistem Presensi & Monitoring Operasional Digital  
**Design System Source:** Google Stitch MCP — *Theme: Angkasa Velocity (Soft Crimson & Minimalist)*

---

## 🚀 Versi 2.4.2 — Perbaikan Responsivitas Mobile & Website Sesuai Referensi Google Stitch
**Waktu:** 23 September 2026

### 📱 1. Penyelarasan Penuh Tampilan Mobile (Pixel-Perfect dari Screenshot Google Stitch)
1. **Top Bar Header Konsisten**:
   - Di seluruh screen mobile (`EmployeeApp.jsx` & `AdminApp.jsx`):
     - Kiri: Logo resmi `ANGKASA EKSPRES` (`/LOGO.png`).
     - Kanan: Tombol toggle mode gelap (`dark_mode`) dan tombol logout merah (`logout`).
     - Menghapus avatar duplikat yang mengganggu top bar agar ruang header bersih dan rapi.
2. **User — Beranda Presensi (`Dashboard.jsx`)**:
   - Menyelaraskan kartu sambutan: `SELAMAT DATANG` (kecil abu-abu), `Halo, aldho! 👋` (tebal hitam/navy pekat), tanggal hari ini, serta foto profil biometrik dengan indikator online hijau.
   - 3 Bento chip quick stats dalam 1 baris: `Masuk` (08:00 / Tepat Waktu), `Pulang` (16:01 / Selesai Shift), `Total Kerja` (8j 01m / Target 8 jam).
   - Biometric Crimson Hero Card:
     - Header pill: `SHIFT PAGI • GRAHA ANGKASA` (pulse hijau) dan `Radius 45m`.
     - Jam digital besar `WIB` dengan lokasi hub.
     - Wadah sensor biometrik gelap transparan (`bg-black/25`) dengan bracket sudut putih, panduan wajah terdeteksi, tombol putih `Ambil Foto Presensi Wajah`, serta 2 pill status (`Masuk Tervalidasi` & `Pulang Terekam`).
   - Aksi Cepat: 4 ikon grid (`Ajukan Izin`, `Riwayat`, `ID Pegawai`, `Cetak Slip`).
   - Catatan Presensi Hari Ini: Timeline 3 aktivitas harian (Absen Masuk, Durasi Kerja Efektif, Absen Pulang).
3. **Admin — Dashboard Monitoring (`AdminDashboard.jsx`)**:
   - Sesuai Gambar 1: Judul `Dashboard Monitoring`, tanggal operasional, tombol `Segarkan` bergaris merah.
   - 4 Bento KPI Cards 2x2 grid dengan strip aksen vertikal di tepi kiri (Total Karyawan, Hadir Hari Ini 17%, Terlambat Masuk, Cuti Disetujui).
   - Crimson banner: `Geofence Hub Aktif` dengan watermark radar satelit.
   - Wadah `Log Presensi Harian` dengan search bar, filter tanggal & status, serta kartu staf dengan sub-wadah putih jam masuk & pulang.
   - Indikator bawah `GPS Auto-Tracking Aktif`.
4. **Admin — Manajemen Karyawan (`AdminKaryawan.jsx`)**:
   - Sesuai Gambar 2: Header `DATABASE TERPUSAT`, 3 bento stats (Total Staf 6, Hadir 6, Izin 0), tombol merah `+ Tambah Karyawan`, search bar rounded-2xl, filter pill divisi (`Semua Divisi`, `Armada`, `Operasional`), dan tabel daftar staf terpaginasi.
5. **Admin — Rekap Absensi Bulanan (`AdminRekap.jsx`)**:
   - Sesuai Gambar 3: Header rekap dengan kartu filter periode, tombol merah `Export Excel`, tombol soft `Export PDF`, toggle pill `Ringkasan (2)` vs `Detail Harian (4)`, tabel kehadiran per staf, dan kartu hero `Tingkat Kehadiran 92% Analitik`.
6. **Admin — Pengaturan Geofence GPS (`AdminPengaturan.jsx`)**:
   - Sesuai Gambar 5: Pill status `Sistem Geofencing GPS Aktif` & `Haversine v2.4`, 2 quick cards (Total Durasi 9 Jam & Area Tercover 100m Radius), kartu jam operasional standar, kartu titik pusat GPS dengan pratinjau peta radar satelit, input koordinat, slider radius, dan tombol simpan merah.

---

### 💻 2. Penyelarasan Tampilan Website / Desktop
- **Responsivitas Lebar Penuh**:
  - Pada layar lebar (desktop & tablet >= 768px), konten tidak lagi terjepit dalam wadah 380px ponsel.
  - Untuk Portal Karyawan: Menggunakan layout desktop 2-kolom terbagi rapi (`md:grid-cols-12`): kolom kiri untuk hero kamera biometrik dan live clock, kolom kanan untuk statistik, aksi cepat, dan timeline presensi. Navigasi atas otomatis berubah menjadi top bar desktop dengan pill menu, sedangkan bottom dock mobile otomatis disembunyikan (`md:hidden`).
  - Untuk Portal Admin: Menggunakan sidebar vertikal tetap (`w-72`), sticky header lengkap dengan breadcrumbs & live sync, serta grid analitik 12-kolom.
- **Floating Bottom Dock Mobile**:
  - Diberikan safe area bottom inset dan fixed margin (`bottom-4`) sehingga tidak terpotong pada berbagai dimensi emulator maupun smartphone nyata (iPhone 15 Pro, Android).

---

### 🛠️ 3. Status Build & Server
- `bun run build` sukses 100% tanpa peringatan.
- Hot Module Replacement (HMR) aktif di `http://localhost:5173`.
