const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const excel = require('exceljs');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from dist (production build) if exists, and project root
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}
app.use(express.static(__dirname));

// Legacy HTML routes for backward compatibility
app.get('/legacy-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/legacy-admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Helper: Get local date string YYYY-MM-DD
function getLocalDateString(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper: Get local time string HH:MM:SS
function getLocalTimeString(d = new Date()) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// =================================================================
// DATABASE ADAPTER (Local SQLite with fallback/optional MySQL)
// =================================================================
let dbDriver = 'sqlite';
let sqliteDb = null;
let mysqlPool = null;

function initSqliteDatabase() {
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = path.join(__dirname, 'attendance.db');
    sqliteDb = new DatabaseSync(dbPath);

    // Create tables
    sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS attendance_settings (
            id INTEGER PRIMARY KEY,
            jam_masuk TEXT DEFAULT '08:00:00',
            jam_pulang TEXT DEFAULT '17:00:00',
            latitude REAL DEFAULT -6.34395432,
            longitude REAL DEFAULT 106.73780986,
            radius INTEGER DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama_lengkap TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            telepon TEXT,
            foto_profil TEXT,
            password_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tanggal TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Hadir',
            waktu_masuk TEXT,
            lokasi_masuk TEXT,
            foto_masuk TEXT,
            waktu_pulang TEXT,
            lokasi_pulang TEXT,
            foto_pulang TEXT,
            UNIQUE(user_id, tanggal)
        );
    `);

    // Check if initial users exist
    const userCount = sqliteDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
        console.log('Menginisialisasi data awal database...');
        const adminHash = bcrypt.hashSync('admin123', 10);
        const jakaHash = bcrypt.hashSync('jaka123', 10);
        const defHash = bcrypt.hashSync('123456', 10);

        // Load avatar if available
        let avatarBase64 = null;
        try {
            const avatarPath = path.join(__dirname, 'Admin-Avatar.png');
            if (fs.existsSync(avatarPath)) {
                avatarBase64 = 'data:image/png;base64,' + fs.readFileSync(avatarPath).toString('base64');
            }
        } catch (err) {
            console.error('Error loading avatar:', err);
        }

        const insertUser = sqliteDb.prepare(`
            INSERT INTO users (id, nama_lengkap, email, telepon, foto_profil, password_hash)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertUser.run(1, 'Administrator', 'adminaldo@gmail.com', '0800111222', avatarBase64, adminHash);
        insertUser.run(2, 'jaka', 'jaka@gmail.com', '085714230010', null, jakaHash);
        insertUser.run(3, 'krisna', 'krisna@gmail.com', '08517123112', null, defHash);
        insertUser.run(4, 'dafitgaming', 'dafitdisini@gmail.com', '082131231', null, defHash);
        insertUser.run(5, 'ilyas', 'adminilyas@gmail.com', '081203821903', null, adminHash);
        insertUser.run(6, 'ilyasawa', 'ilyas@gmail.com', '086412131', null, defHash);
        insertUser.run(7, 'bagus', 'bagus@gmail.com', '08291389128321', null, defHash);

        // Seed settings
        sqliteDb.prepare(`
            INSERT OR REPLACE INTO attendance_settings (id, jam_masuk, jam_pulang, latitude, longitude, radius)
            VALUES (1, '08:00:00', '17:00:00', -6.34395432, 106.73780986, 100)
        `).run();

        // Seed demo attendance history
        const insertAtt = sqliteDb.prepare(`
            INSERT INTO attendance (user_id, tanggal, status, waktu_masuk, lokasi_masuk, waktu_pulang, lokasi_pulang)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const today = getLocalDateString();
        insertAtt.run(2, today, 'Hadir', '07:48:10', 'Lat: -6.34395, Lon: 106.73780', null, null);
        insertAtt.run(3, today, 'Telat', '08:15:22', 'Lat: -6.34395, Lon: 106.73780', null, null);

        console.log('Database lokal berhasil diinisialisasi.');
    }
}

// Generic database query runner
async function dbQuery(sql, params = []) {
    if (dbDriver === 'mysql' && mysqlPool) {
        const [rows] = await mysqlPool.execute(sql, params);
        return rows;
    } else {
        // SQLite query
        const trimmedSql = sql.trim();
        const isSelect = trimmedSql.toUpperCase().startsWith('SELECT');
        const stmt = sqliteDb.prepare(sql);
        if (isSelect) {
            return stmt.all(...params);
        } else {
            const info = stmt.run(...params);
            return {
                affectedRows: info.changes,
                insertId: info.lastInsertRowid
            };
        }
    }
}

// Inisialisasi Database
initSqliteDatabase();

// =================================================================
// API ENDPOINTS
// =================================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: dbDriver,
        time: new Date().toISOString()
    });
});

// === 1. API LOGIN ===
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password harus diisi.' });
    }

    try {
        // Cari berdasarkan email ATAU nama_lengkap (case-insensitive)
        const cleanUser = username.trim().toLowerCase();
        const rows = await dbQuery(
            'SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(nama_lengkap) = ?',
            [cleanUser, cleanUser]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        const user = rows[0];
        // Bandingkan password hash
        const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
        
        // Kemudahan testing lokal: jika password cocok ATAU 'admin123' / '123456'
        const isDemoMatch = (password === 'admin123' || password === '123456');

        if (!isPasswordMatch && !isDemoMatch) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        const role = user.email.toLowerCase().includes('admin') ? 'admin' : 'user';

        res.json({
            success: true,
            message: 'Login berhasil!',
            role: role,
            userData: {
                id: user.id,
                namaLengkap: user.nama_lengkap,
                nama: user.nama_lengkap,
                email: user.email,
                telepon: user.telepon,
                foto_profil: user.foto_profil
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server: ' + error.message });
    }
});

// === 2. API ABSENSI (CLOCK-IN) ===
app.post('/api/clockin', async (req, res) => {
    const { userId, time, location, photo } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID diperlukan' });

    try {
        const today = getLocalDateString();
        const currentTime = time || getLocalTimeString();

        // Ambil jam masuk dari pengaturan
        const settings = await dbQuery('SELECT jam_masuk FROM attendance_settings WHERE id = 1');
        const jamMasukKantor = settings.length > 0 && settings[0].jam_masuk ? settings[0].jam_masuk : '08:00:00';
        const status = currentTime > jamMasukKantor ? 'Telat' : 'Hadir';

        // Cek apakah sudah ada absen hari ini
        const existing = await dbQuery('SELECT id FROM attendance WHERE user_id = ? AND tanggal = ?', [userId, today]);

        if (existing.length > 0) {
            await dbQuery(
                'UPDATE attendance SET status = ?, waktu_masuk = ?, lokasi_masuk = ?, foto_masuk = ? WHERE user_id = ? AND tanggal = ?',
                [status, currentTime, location || '-', photo || null, userId, today]
            );
        } else {
            await dbQuery(
                'INSERT INTO attendance (user_id, tanggal, status, waktu_masuk, lokasi_masuk, foto_masuk) VALUES (?, ?, ?, ?, ?, ?)',
                [userId, today, status, currentTime, location || '-', photo || null]
            );
        }

        res.status(200).json({ message: `Absen masuk berhasil dengan status: ${status}` });
    } catch (error) {
        console.error('Clockin error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 3. API ABSENSI (CLOCK-OUT) ===
app.post('/api/clockout', async (req, res) => {
    const { userId, time, location, photo } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID diperlukan' });

    try {
        const today = getLocalDateString();
        const currentTime = time || getLocalTimeString();

        const existing = await dbQuery('SELECT id FROM attendance WHERE user_id = ? AND tanggal = ?', [userId, today]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Gagal: Tidak ditemukan data absen masuk untuk hari ini. Silakan absen masuk terlebih dahulu.' });
        }

        await dbQuery(
            'UPDATE attendance SET waktu_pulang = ?, lokasi_pulang = ?, foto_pulang = ? WHERE user_id = ? AND tanggal = ?',
            [currentTime, location || '-', photo || null, userId, today]
        );

        res.status(200).json({ message: 'Absen pulang berhasil' });
    } catch (error) {
        console.error('Clockout error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 3.5 API PENGAJUAN IZIN / CUTI / SAKIT ===
app.post('/api/izin', async (req, res) => {
    const { userId, tanggal, tipe, keterangan } = req.body;
    if (!userId || !tipe || !keterangan) {
        return res.status(400).json({ error: 'Data pengajuan izin tidak lengkap' });
    }

    try {
        const targetDate = tanggal || getLocalDateString();
        const status = ['Izin', 'Sakit', 'Cuti'].includes(tipe) ? tipe : 'Izin';
        const info = `[${status}] ${keterangan}`;

        const existing = await dbQuery('SELECT id FROM attendance WHERE user_id = ? AND tanggal = ?', [userId, targetDate]);
        if (existing.length > 0) {
            await dbQuery(
                'UPDATE attendance SET status = ?, lokasi_masuk = ? WHERE user_id = ? AND tanggal = ?',
                [status, info, userId, targetDate]
            );
        } else {
            await dbQuery(
                'INSERT INTO attendance (user_id, tanggal, status, waktu_masuk, lokasi_masuk) VALUES (?, ?, ?, ?, ?)',
                [userId, targetDate, status, '08:00:00', info]
            );
        }

        res.status(200).json({ message: `Pengajuan ${status} berhasil dicatat!` });
    } catch (error) {
        console.error('Izin error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 4. API STATUS ABSENSI HARI INI ===
app.get('/api/attendance/today/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const today = getLocalDateString();
        const rows = await dbQuery('SELECT * FROM attendance WHERE user_id = ? AND tanggal = ?', [userId, today]);

        if (rows.length > 0) {
            res.json({ status: 'found', data: rows[0] });
        } else {
            res.json({ status: 'not_found', data: null });
        }
    } catch (error) {
        console.error("Error fetching today's attendance:", error);
        res.status(500).json({ error: 'Gagal mengambil data absensi hari ini' });
    }
});

// === 5. API RIWAYAT ABSENSI USER (BULANAN) ===
app.get('/api/attendance/history/:userId', async (req, res) => {
    const { userId } = req.params;
    const { bulan } = req.query; // format: YYYY-MM
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan diperlukan' });

    try {
        const rows = await dbQuery(`
            SELECT tanggal, status, waktu_masuk, waktu_pulang
            FROM attendance
            WHERE user_id = ? AND tanggal LIKE ?
            ORDER BY tanggal DESC
        `, [userId, `${bulan}-%`]);

        res.json(rows);
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 6. API PROFIL USER ===
app.get('/api/users/:id/profile', async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await dbQuery('SELECT id, nama_lengkap as namaLengkap, email, telepon, foto_profil FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'User tidak ditemukan' });
        }
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.put('/api/users/:id/profile', async (req, res) => {
    const { id } = req.params;
    const { namaLengkap, email, telepon, foto_profil, password } = req.body;

    try {
        const updates = ['nama_lengkap = ?', 'email = ?', 'telepon = ?'];
        const values = [namaLengkap, email, telepon];

        if (foto_profil) {
            updates.push('foto_profil = ?');
            values.push(foto_profil);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password_hash = ?');
            values.push(hashedPassword);
        }

        values.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
        await dbQuery(query, values);

        const updatedRows = await dbQuery('SELECT id, nama_lengkap as namaLengkap, email, telepon, foto_profil FROM users WHERE id = ?', [id]);
        res.json({ message: 'Profil berhasil diperbarui!', updatedUser: updatedRows[0] });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 7. API PANEL ADMIN: ABSENSI HARIAN ===
app.get('/api/absensi/harian', async (req, res) => {
    const { tanggal } = req.query;
    if (!tanggal) return res.status(400).json({ error: 'Parameter tanggal diperlukan' });

    try {
        const rows = await dbQuery(`
            SELECT u.nama_lengkap, a.status, a.waktu_masuk, a.waktu_pulang, a.lokasi_masuk, a.foto_masuk
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.tanggal = ?
            ORDER BY u.nama_lengkap
        `, [tanggal]);

        res.json(rows);
    } catch (error) {
        console.error('Absensi harian error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 8. API PANEL ADMIN: KARYAWAN ===
app.get('/api/karyawan', async (req, res) => {
    try {
        const rows = await dbQuery(`
            SELECT id, nama_lengkap, email, telepon
            FROM users
            WHERE email NOT LIKE '%admin%'
            ORDER BY nama_lengkap
        `);
        res.json(rows);
    } catch (error) {
        console.error('Karyawan error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.get('/api/karyawan/count', async (req, res) => {
    try {
        const rows = await dbQuery("SELECT COUNT(id) as count FROM users WHERE email NOT LIKE '%admin%'");
        res.json({ count: rows[0].count });
    } catch (error) {
        console.error('Karyawan count error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.post('/api/karyawan', async (req, res) => {
    const { namaLengkap, email, telepon, password } = req.body;
    if (!namaLengkap || !email || !password) {
        return res.status(400).json({ error: 'Nama, email, dan password harus diisi.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await dbQuery(
            'INSERT INTO users (nama_lengkap, email, telepon, password_hash) VALUES (?, ?, ?, ?)',
            [namaLengkap, email, telepon || null, hashedPassword]
        );
        res.status(201).json({ message: 'Karyawan baru berhasil ditambahkan' });
    } catch (error) {
        console.error('Create karyawan error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.put('/api/karyawan/:id', async (req, res) => {
    const { id } = req.params;
    const { namaLengkap, email, telepon, password } = req.body;

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await dbQuery(
                'UPDATE users SET nama_lengkap = ?, email = ?, telepon = ?, password_hash = ? WHERE id = ?',
                [namaLengkap, email, telepon || null, hashedPassword, id]
            );
        } else {
            await dbQuery(
                'UPDATE users SET nama_lengkap = ?, email = ?, telepon = ? WHERE id = ?',
                [namaLengkap, email, telepon || null, id]
            );
        }
        res.json({ message: 'Data berhasil diperbarui' });
    } catch (error) {
        console.error('Update karyawan error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.delete('/api/karyawan/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Hapus juga riwayat absensi terkait
        await dbQuery('DELETE FROM attendance WHERE user_id = ?', [id]);
        await dbQuery('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Karyawan berhasil dihapus' });
    } catch (error) {
        console.error('Delete karyawan error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 9. API PANEL ADMIN: PENGATURAN ABSENSI ===
app.get('/api/settings/attendance', async (req, res) => {
    try {
        const rows = await dbQuery('SELECT * FROM attendance_settings WHERE id = 1');
        res.json(rows.length > 0 ? rows[0] : {});
    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.put('/api/settings/attendance', async (req, res) => {
    const { jam_masuk, jam_pulang, latitude, longitude, radius } = req.body;
    try {
        const existing = await dbQuery('SELECT id FROM attendance_settings WHERE id = 1');
        if (existing.length > 0) {
            await dbQuery(`
                UPDATE attendance_settings
                SET jam_masuk = ?, jam_pulang = ?, latitude = ?, longitude = ?, radius = ?
                WHERE id = 1
            `, [jam_masuk, jam_pulang, latitude, longitude, radius]);
        } else {
            await dbQuery(`
                INSERT INTO attendance_settings (id, jam_masuk, jam_pulang, latitude, longitude, radius)
                VALUES (1, ?, ?, ?, ?, ?)
            `, [jam_masuk, jam_pulang, latitude, longitude, radius]);
        }
        res.json({ message: 'Pengaturan absensi berhasil disimpan!' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 10. API PANEL ADMIN: DASHBOARD SUMMARY TODAY ===
app.get('/api/dashboard/summaryToday', async (req, res) => {
    const today = getLocalDateString();
    try {
        const hadirRows = await dbQuery(`
            SELECT COUNT(id) as count FROM attendance
            WHERE tanggal = ? AND (status = 'Hadir' OR status = 'Telat')
        `, [today]);

        const telatRows = await dbQuery(`
            SELECT COUNT(id) as count FROM attendance
            WHERE tanggal = ? AND status = 'Telat'
        `, [today]);

        const izinRows = await dbQuery(`
            SELECT COUNT(id) as count FROM attendance
            WHERE tanggal = ? AND (status = 'Izin' OR status = 'Sakit')
        `, [today]);

        const cutiRows = await dbQuery(`
            SELECT COUNT(id) as count FROM attendance
            WHERE tanggal = ? AND status = 'Cuti'
        `, [today]);

        res.json({
            hadir: hadirRows[0] ? hadirRows[0].count : 0,
            telat: telatRows[0] ? telatRows[0].count : 0,
            cuti: cutiRows[0] ? cutiRows[0].count : 0,
            izin: izinRows[0] ? izinRows[0].count : 0
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// === 11. API PANEL ADMIN: REKAP BULANAN & DOWNLOAD EXCEL ===
app.get('/api/rekap/bulanan', async (req, res) => {
    const { bulan } = req.query;
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan diperlukan' });

    try {
        const rows = await dbQuery(`
            SELECT u.nama_lengkap, a.tanggal, a.status, a.waktu_masuk, a.waktu_pulang
            FROM attendance a
            JOIN users u ON u.id = a.user_id
            WHERE a.tanggal LIKE ?
            ORDER BY a.tanggal, u.nama_lengkap
        `, [`${bulan}-%`]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching monthly recap:', error);
        res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

app.get('/api/rekap/download', async (req, res) => {
    const { bulan } = req.query;
    if (!bulan) return res.status(400).json({ error: 'Parameter bulan diperlukan' });

    try {
        const rows = await dbQuery(`
            SELECT u.nama_lengkap, a.tanggal, a.status, a.waktu_masuk, a.waktu_pulang
            FROM attendance a
            JOIN users u ON u.id = a.user_id
            WHERE a.tanggal LIKE ?
            ORDER BY u.nama_lengkap, a.tanggal
        `, [`${bulan}-%`]);

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet(`Rekap Absensi ${bulan}`);

        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 15 },
            { header: 'Nama Karyawan', key: 'nama', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Jam Masuk', key: 'masuk', width: 15 },
            { header: 'Jam Pulang', key: 'pulang', width: 15 }
        ];

        // Format header
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDC2626' } // Red
        };

        rows.forEach(row => {
            worksheet.addRow({
                tanggal: row.tanggal,
                nama: row.nama_lengkap,
                status: row.status,
                masuk: row.waktu_masuk || '-',
                pulang: row.waktu_pulang || '-'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="rekap-absensi-${bulan}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Download rekap error:', error);
        res.status(500).send('Gagal membuat file rekap: ' + error.message);
    }
});

// SPA Fallback: redirect all unmatched non-API routes to index.html (Express 5 compatible)
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint API tidak ditemukan' });
    }
    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Jalankan Server
app.listen(port, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Server Angkasa Absen berjalan di: http://localhost:${port}`);
    console.log(`📱 Akses dari iOS (WiFi sama): http://192.168.1.46:${port}`);
    console.log(`📁 Database: SQLite aktif (attendance.db)`);
    console.log(`🔑 Login Admin: adminaldo@gmail.com / admin123`);
    console.log(`👤 Login Karyawan: jaka@gmail.com / jaka123`);
    console.log(`====================================================`);
});


module.exports = app;

