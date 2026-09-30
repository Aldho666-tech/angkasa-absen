'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.protocol.startsWith('http')
        ? (window.location.port === '3000' || !window.location.port ? '/api' : 'http://localhost:3000/api')
        : 'http://localhost:3000/api';

    let userData = JSON.parse(sessionStorage.getItem('userData'));

    if (!userData) {
        alert("Anda harus login terlebih dahulu!");
        window.location.href = 'index.html';
        return;
    }

    const DOMElements = {
        sidebar: document.getElementById('sidebar'),
        toggleSidebarButton: document.getElementById('toggleSidebar'),
        darkModeButton: document.getElementById('toggleDarkMode'),
        body: document.body,
        logoutButton: document.getElementById('logout-btn'),
        menuItems: document.querySelectorAll('.menu li'),
        tabContents: document.querySelectorAll('.tab-content'),
        sidebarUserName: document.getElementById('sidebar-user-name'),
        sidebarProfilePic: document.querySelector('.sidebar .profile-picture img'),
        mainProfilePic: document.getElementById('mainProfilePic'),
        uploadProfilePicInput: document.getElementById('uploadProfilePic'),
        changePhotoBtn: document.getElementById('changePhotoBtn'),
        profileForm: document.getElementById('profileForm'),
        profileNamaInput: document.getElementById('profileNama'),
        profileEmailInput: document.getElementById('profileEmail'),
        profileTeleponInput: document.getElementById('profileTelepon'),
        editProfileBtn: document.getElementById('editProfileBtn'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        cancelProfileBtn: document.getElementById('cancelProfileBtn'),
        realtimeLocation: document.getElementById('realtime-location'),
        video: document.getElementById('video'),
        canvas: document.getElementById('snapshot'),
        toggleCameraButton: document.getElementById('toggleCameraButton'),
        clockInButton: document.getElementById('clockInButton'),
        clockOutButton: document.getElementById('clockOutButton'),
        riwayatContainer: document.getElementById('riwayatContainer'),
        bulanRekapInput: document.getElementById('bulanRekap'),
        tampilkanRekapBtn: document.getElementById('tampilkanRekapBtn'),
        detailRekapList: document.getElementById('detailRekapList'),
        // New UI elements
        topbarClock: document.getElementById('topbar-live-clock'),
        topbarDayLabel: document.getElementById('topbar-day-label'),
        topbarDateLabel: document.getElementById('topbar-date-label'),
        topbarTitle: document.getElementById('topbar-page-title'),
        topbarUserName: document.getElementById('topbar-user-name'),
        topbarUserRole: document.getElementById('topbar-user-role'),
        topbarUserImg: document.getElementById('topbar-user-img'),
        sidebarProfileImgNew: document.getElementById('sidebar-profile-img'),
        bannerName: document.getElementById('banner-name'),
        bannerDate: document.getElementById('banner-date'),
        bannerHadirCount: document.getElementById('banner-hadir-count'),
        bannerTelatCount: document.getElementById('banner-telat-count'),
        bannerAlphaCount: document.getElementById('banner-alpha-count'),
        statJamMasuk: document.getElementById('stat-jam-masuk'),
        statJamPulang: document.getElementById('stat-jam-pulang'),
        statStatusHariIni: document.getElementById('stat-status-hari-ini'),
        cardLiveClock: document.getElementById('card-live-clock'),
        cardLiveDate: document.getElementById('card-live-date'),
        cameraOffOverlay: document.getElementById('cameraOffOverlay'),
        mobileOverlay: document.getElementById('mobileOverlay'),
        profileRoleBadge: document.getElementById('profile-role-badge'),
        dotMasuk: document.getElementById('dot-masuk'),
        dotPulang: document.getElementById('dot-pulang'),
        dotKeseluruhan: document.getElementById('dot-status-keseluruhan'),
        statusTimeMasuk: document.getElementById('status-time-masuk'),
        statusTimePulang: document.getElementById('status-time-pulang'),
        statusKeseluruhanLabel: document.getElementById('status-keseluruhan-label'),
    };

    let cameraStream = null;
    let isCameraOn = false;

    async function apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || result.message || "Terjadi kesalahan pada server");
            return result;
        } catch (error) {
            console.error(`API Call Error (${endpoint}):`, error);
            alert(`Gagal terhubung ke server: ${error.message}`);
            throw error;
        }
    }

    function getLocation(updateUI = false) {
        return new Promise((resolve) => {
            const locationElement = DOMElements.realtimeLocation;
            if (!navigator.geolocation || !locationElement) {
                const defaultLoc = "Lat: -6.34395, Lon: 106.73780 (Lokasi Kantor)";
                if (locationElement) locationElement.textContent = defaultLoc;
                return resolve({ latitude: -6.34395, longitude: 106.73780, locationString: defaultLoc });
            }
            if (updateUI) locationElement.textContent = "Mendeteksi lokasi...";

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const locStr = `Lat: ${position.coords.latitude.toFixed(5)}, Lon: ${position.coords.longitude.toFixed(5)}`;
                    if (updateUI) locationElement.textContent = locStr;
                    resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, locationString: locStr });
                },
                (error) => {
                    console.warn("Geolocation Warning:", error.message);
                    // Fallback lokasi kantor agar absen tidak terhambat jika izin GPS ditolak di browser
                    const defaultLoc = "Lat: -6.34395, Lon: 106.73780 (Lokasi Default)";
                    if (updateUI) locationElement.textContent = defaultLoc;
                    resolve({ latitude: -6.34395, longitude: 106.73780, locationString: defaultLoc });
                }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        });
    }

    async function handleAttendance(type, customPhoto = null) {
        let photoDataUrl = customPhoto;
        const locationData = await getLocation(true);

        if (!photoDataUrl) {
            if (!isCameraOn) {
                await setupCamera();
            }

            const context = DOMElements.canvas.getContext('2d');

            if (isCameraOn && DOMElements.video.videoWidth > 0) {
                DOMElements.canvas.width = DOMElements.video.videoWidth;
                DOMElements.canvas.height = DOMElements.video.videoHeight;
                context.drawImage(DOMElements.video, 0, 0, DOMElements.canvas.width, DOMElements.canvas.height);
                photoDataUrl = DOMElements.canvas.toDataURL('image/jpeg', 0.8);
            } else {
                // Snapshot fallback jika kamera tidak tersedia di perangkat
                DOMElements.canvas.width = 400;
                DOMElements.canvas.height = 300;
                context.fillStyle = '#1e293b';
                context.fillRect(0, 0, 400, 300);
                context.fillStyle = '#ffffff';
                context.font = 'bold 20px Poppins, sans-serif';
                context.textAlign = 'center';
                context.fillText(type === 'clockin' ? 'ABSEN MASUK' : 'ABSEN PULANG', 200, 100);
                context.font = '16px Poppins, sans-serif';
                context.fillText(userData.namaLengkap || userData.nama || 'Karyawan', 200, 140);
                context.font = '14px Poppins, sans-serif';
                context.fillStyle = '#94a3b8';
                context.fillText(new Date().toLocaleString('id-ID'), 200, 180);
                context.fillText(locationData.locationString, 200, 210);
                photoDataUrl = DOMElements.canvas.toDataURL('image/jpeg', 0.8);
            }
        }

        try {
            const endpoint = type === 'clockin' ? '/clockin' : '/clockout';
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const currentTime = `${hours}:${minutes}:${seconds}`;

            const result = await apiCall(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.id,
                    time: currentTime,
                    location: locationData.locationString,
                    photo: photoDataUrl
                })
            });

            playChime(type === 'clockin');
            alert(result.message);
            loadDailyHistory();
            loadBannerStats();
        } catch (error) { /* Ditangani di apiCall */ }
    }

    function updateAttendanceButtonsState(attendanceData) {
        const { clockInButton, clockOutButton } = DOMElements;
        if (!clockInButton || !clockOutButton) return;

        // Default state: enable clock-in, disable clock-out.
        clockInButton.disabled = false;
        clockOutButton.disabled = true;
        
        if (attendanceData) {
            // Jika sudah ada waktu masuk, nonaktifkan tombol Masuk dan aktifkan Pulang
            if (attendanceData.waktu_masuk) {
                clockInButton.disabled = true;
                clockOutButton.disabled = false;
            }
            // Jika sudah ada waktu pulang, nonaktifkan juga tombol Pulang
            if (attendanceData.waktu_pulang) {
                clockOutButton.disabled = true;
            }
        }
    }
    
    // Web Audio API feedback synthesizer
    function playChime(isClockIn = true) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const notes = isClockIn ? [523.25, 659.25, 783.99] : [783.99, 659.25, 523.25];
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
            });
        } catch (e) { /* audio policy safety */ }
    }

    // Live Work Duration Counter
    let workTimerInterval = null;
    function updateWorkDuration(waktuMasuk, waktuPulang) {
        if (workTimerInterval) clearInterval(workTimerInterval);
        const durationEl = document.getElementById('liveWorkDuration');
        const badgeEl = document.getElementById('liveWorkStatusBadge');
        const metricDur = document.getElementById('stat-durasi-display');
        const metricBadge = document.getElementById('stat-durasi-badge');
        if (!durationEl || !badgeEl) return;

        if (!waktuMasuk) {
            durationEl.textContent = '00:00:00';
            badgeEl.textContent = 'Belum Masuk';
            badgeEl.className = 'badge badge-gray';
            if (metricDur) metricDur.textContent = '00:00:00';
            if (metricBadge) {
                metricBadge.innerHTML = '<i class="fas fa-pause"></i> Belum Masuk';
                metricBadge.className = 'stat-pill neutral';
            }
            return;
        }

        if (waktuPulang) {
            const [hM, mM, sM] = waktuMasuk.split(':').map(Number);
            const [hP, mP, sP] = waktuPulang.split(':').map(Number);
            let secDiff = (hP * 3600 + (mM||0) * 60 + (sM || 0)) - (hM * 3600 + (mM||0) * 60 + (sM || 0));
            if (secDiff < 0) secDiff += 86400;
            const hrs = Math.floor(secDiff / 3600);
            const mins = Math.floor((secDiff % 3600) / 60);
            const secs = secDiff % 60;
            const durStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            durationEl.textContent = durStr;
            badgeEl.textContent = 'Selesai Pulang ✅';
            badgeEl.className = 'badge badge-green';
            if (metricDur) metricDur.textContent = durStr;
            if (metricBadge) {
                metricBadge.innerHTML = '<i class="fas fa-check"></i> Selesai';
                metricBadge.className = 'stat-pill green';
            }
            return;
        }

        const [inH, inM, inS] = waktuMasuk.split(':').map(Number);
        const tick = () => {
            const now = new Date();
            const curSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            const inSec = inH * 3600 + (inM||0) * 60 + (inS || 0);
            let diff = curSec - inSec;
            if (diff < 0) diff = 0;
            const hrs = Math.floor(diff / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const secs = diff % 60;
            const durStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            durationEl.textContent = durStr;
            badgeEl.textContent = '🟢 Sedang Bekerja';
            badgeEl.className = 'badge badge-blue';
            const hadirrDur = document.getElementById('hadirrCardDuration');
            if (hadirrDur) hadirrDur.textContent = durStr;
            if (metricDur) metricDur.textContent = durStr;
            if (metricBadge) {
                metricBadge.innerHTML = '<i class="fas fa-bolt"></i> Bekerja';
                metricBadge.className = 'stat-pill blue';
            }
        };
        tick();
        workTimerInterval = setInterval(tick, 1000);
    }
    
    function updateStatusDots(todayAttendance) {
        const setDot = (el, cls) => { if (el) { el.className = 'status-dot ' + cls; } };
        const setText = (el, txt) => { if (el) el.textContent = txt; };

        updateWorkDuration(todayAttendance?.waktu_masuk, todayAttendance?.waktu_pulang);

        // Mobile Hadirr elements sync
        const hadirrStatusText = document.getElementById('hadirrStatusText');
        const hadirrCardSubMasuk = document.getElementById('hadirrCardSubMasuk');
        const hadirrCardSubPulang = document.getElementById('hadirrCardSubPulang');
        const hadirrMiniMasuk = document.getElementById('hadirrMiniMasuk');
        const hadirrMiniPulang = document.getElementById('hadirrMiniPulang');
        const hadirrMiniStatus = document.getElementById('hadirrMiniStatus');
        const hadirrTodayShortDate = document.getElementById('hadirrTodayShortDate');

        if (hadirrTodayShortDate) {
            hadirrTodayShortDate.textContent = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }

        if (!todayAttendance) {
            setDot(DOMElements.dotMasuk, 'pending');
            setDot(DOMElements.dotPulang, 'pending');
            setDot(DOMElements.dotKeseluruhan, 'pending');
            setText(DOMElements.statusTimeMasuk, '–');
            setText(DOMElements.statusTimePulang, '–');
            setText(DOMElements.statusKeseluruhanLabel, 'Belum absen');
            if (DOMElements.statJamMasuk) DOMElements.statJamMasuk.textContent = '–';
            if (DOMElements.statJamPulang) DOMElements.statJamPulang.textContent = '–';
            if (DOMElements.statStatusHariIni) DOMElements.statStatusHariIni.textContent = 'Belum Absen';

            if (hadirrStatusText) hadirrStatusText.textContent = 'Belum Absen Masuk';
            if (hadirrCardSubMasuk) hadirrCardSubMasuk.textContent = 'Belum Absen';
            if (hadirrCardSubPulang) hadirrCardSubPulang.textContent = 'Belum Absen';
            if (hadirrMiniMasuk) hadirrMiniMasuk.textContent = '–';
            if (hadirrMiniPulang) hadirrMiniPulang.textContent = '–';
            if (hadirrMiniStatus) hadirrMiniStatus.textContent = 'Belum Absen';
            return;
        }

        const { waktu_masuk, waktu_pulang, status } = todayAttendance;
        const statusLow = (status || '').toLowerCase();

        setDot(DOMElements.dotMasuk, waktu_masuk ? 'present' : 'pending');
        setText(DOMElements.statusTimeMasuk, waktu_masuk || '–');
        if (DOMElements.statJamMasuk) DOMElements.statJamMasuk.textContent = waktu_masuk || '–';

        setDot(DOMElements.dotPulang, waktu_pulang ? 'present' : (waktu_masuk ? 'pending' : 'absent'));
        setText(DOMElements.statusTimePulang, waktu_pulang || '–');
        if (DOMElements.statJamPulang) DOMElements.statJamPulang.textContent = waktu_pulang || '–';

        const dotClass = statusLow === 'hadir' ? 'present' : statusLow === 'telat' ? 'late' : statusLow === 'absen' ? 'absent' : 'pending';
        setDot(DOMElements.dotKeseluruhan, dotClass);
        setText(DOMElements.statusKeseluruhanLabel, status || 'Hadir');
        if (DOMElements.statStatusHariIni) DOMElements.statStatusHariIni.textContent = status || 'Hadir';

        // Hadirr mobile card states
        if (hadirrMiniMasuk) hadirrMiniMasuk.textContent = waktu_masuk || '–';
        if (hadirrMiniPulang) hadirrMiniPulang.textContent = waktu_pulang || '–';
        if (hadirrMiniStatus) hadirrMiniStatus.textContent = status || 'Hadir';

        if (hadirrCardSubMasuk) hadirrCardSubMasuk.textContent = waktu_masuk ? `${waktu_masuk} ✅` : 'Belum Absen';
        if (hadirrCardSubPulang) hadirrCardSubPulang.textContent = waktu_pulang ? `${waktu_pulang} ✅` : (waktu_masuk ? 'Siap Pulang' : 'Belum Masuk');

        if (hadirrStatusText) {
            if (waktu_pulang) hadirrStatusText.textContent = `Selesai (${status || 'Hadir'})`;
            else if (waktu_masuk) hadirrStatusText.textContent = `Bekerja (${waktu_masuk})`;
            else hadirrStatusText.textContent = 'Belum Absen Masuk';
        }
    }

    async function loadDailyHistory() {
        if (!DOMElements.riwayatContainer) return;
        DOMElements.riwayatContainer.innerHTML = "<p class='no-data-info'>Memuat riwayat...</p>";
        updateAttendanceButtonsState(null);
        updateStatusDots(null);

        try {
            const result = await apiCall(`/attendance/today/${userData.id}`);

            if (result.status === 'found' && result.data) {
                const todayAttendance = result.data;
                const statusClass = (todayAttendance.status || 'Hadir').toLowerCase();
                const card = `
                    <div class="card-kehadiran">
                        <div class="card-icon"><i class="fas fa-calendar-day"></i></div>
                        <div class="card-info">
                            <span class="tgl">Hari Ini — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span class="jam"><i class="fas fa-sign-in-alt" style="margin-right:4px;color:var(--green-500)"></i>Masuk: ${todayAttendance.waktu_masuk || '---'} &nbsp;|&nbsp; <i class="fas fa-sign-out-alt" style="margin-right:4px;color:var(--red-500)"></i>Pulang: ${todayAttendance.waktu_pulang || '---'}</span>
                        </div>
                        <div class="card-status ${statusClass}">${todayAttendance.status || 'Hadir'}</div>
                    </div>`;
                DOMElements.riwayatContainer.innerHTML = card;
                updateAttendanceButtonsState(todayAttendance);
                updateStatusDots(todayAttendance);
            } else {
                DOMElements.riwayatContainer.innerHTML = "<p class='no-data-info'><i class='fas fa-calendar-times' style='margin-right:6px'></i>Belum ada riwayat kehadiran hari ini.</p>";
                updateStatusDots(null);
            }
        } catch (error) {
            console.error('Error loading daily history:', error);
            DOMElements.riwayatContainer.innerHTML = "<p class='no-data-info' style='color:var(--red-500)'>Gagal memuat riwayat.</p>";
            updateAttendanceButtonsState(null);
            updateStatusDots(null);
        }
    }

    let currentRecapData = [];

    async function loadRecapData(bulan) {
        if (!DOMElements.detailRekapList) return;
        DOMElements.detailRekapList.innerHTML = `<li class="no-data-info">Memuat data rekap untuk bulan ${bulan}...</li>`;
        try {
            const data = await apiCall(`/attendance/history/${userData.id}?bulan=${bulan}`);
            currentRecapData = data || [];
            if (data.length === 0) {
                DOMElements.detailRekapList.innerHTML = `<li class="no-data-info">Tidak ada data kehadiran untuk bulan yang dipilih.</li>`;
                return;
            }
            DOMElements.detailRekapList.innerHTML = '';
            data.forEach(item => {
                const statusClass = (item.status || 'Hadir').toLowerCase();
                const li = `
                    <li class="rekap-item card-kehadiran">
                        <div class="card-info">
                            <span class="tgl">${new Date(item.tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                            <span class="jam">Masuk: ${item.waktu_masuk || '-'} | Pulang: ${item.waktu_pulang || '-'}</span>
                        </div>
                        <div class="card-status ${statusClass}">${item.status || 'Hadir'}</div>
                    </li>`;
                DOMElements.detailRekapList.insertAdjacentHTML('beforeend', li);
            });
        } catch (error) {
            DOMElements.detailRekapList.innerHTML = `<li class="no-data-info" style="color: red;">Gagal memuat data.</li>`;
        }
    }

    function exportCsvRekap() {
        if (!currentRecapData || currentRecapData.length === 0) {
            alert('Tidak ada data rekap untuk diunduh. Silakan pilih bulan dan klik Tampilkan terlebih dahulu.');
            return;
        }
        const headers = ['Tanggal', 'Status', 'Jam Masuk', 'Jam Pulang'];
        const rows = currentRecapData.map(d => [
            `"${d.tanggal}"`,
            `"${d.status || 'Hadir'}"`,
            `"${d.waktu_masuk || '-'}"`,
            `"${d.waktu_pulang || '-'}"`
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        const bulan = DOMElements.bulanRekapInput?.value || 'rekap';
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Rekap_Presensi_${userData.namaLengkap || 'Karyawan'}_${bulan}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function cetakSlipPresensi() {
        if (!currentRecapData || currentRecapData.length === 0) {
            alert('Tidak ada data rekap untuk dicetak. Silakan pilih bulan dan klik Tampilkan terlebih dahulu.');
            return;
        }
        const bulan = DOMElements.bulanRekapInput?.value || 'Bulan Ini';
        const namaKaryawan = userData.namaLengkap || userData.nama || 'Karyawan';
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Slip Rekapitulasi Presensi - ${namaKaryawan}</title>
                <style>
                    body { font-family: 'Inter', Arial, sans-serif; padding: 32px; color: #1e293b; background: #fff; }
                    .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                    .company-name { font-size: 20px; font-weight: 800; color: #1e293b; }
                    .company-sub { font-size: 13px; color: #64748b; margin-top: 3px; }
                    .meta-block { text-align: right; font-size: 13px; color: #475569; }
                    .emp-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border: 1px solid #cbd5e1; padding: 10px 12px; font-size: 12.5px; text-align: left; }
                    th { background-color: #f1f5f9; font-weight: 700; color: #334155; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
                    .badge-hadir { background: #dcfce7; color: #166534; }
                    .badge-telat { background: #fef9c3; color: #854d0e; }
                    .badge-izin { background: #e0e7ff; color: #3730a3; }
                    .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px; }
                    .sig-box { width: 220px; text-align: center; }
                    .sig-line { margin-top: 60px; border-top: 1px solid #334155; padding-top: 4px; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="company-name">PT ANGKASA EKSPRES INDONESIA</div>
                        <div class="company-sub">Sistem Presensi & Monitoring Karyawan Rute</div>
                    </div>
                    <div class="meta-block">
                        <div><strong>Periode:</strong> ${bulan}</div>
                        <div>Dicetak: ${new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
                <div class="emp-card">
                    <div><strong>Nama:</strong> ${namaKaryawan}</div>
                    <div><strong>Email:</strong> ${userData.email || '-'}</div>
                    <div><strong>No. Telp:</strong> ${userData.telepon || '-'}</div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:40px;text-align:center">No</th>
                            <th>Tanggal</th>
                            <th>Status</th>
                            <th>Waktu Masuk</th>
                            <th>Waktu Pulang</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentRecapData.map((row, idx) => `
                            <tr>
                                <td style="text-align:center">${idx + 1}</td>
                                <td>${row.tanggal}</td>
                                <td><span class="badge badge-${(row.status || 'hadir').toLowerCase()}">${row.status || 'Hadir'}</span></td>
                                <td>${row.waktu_masuk || '-'}</td>
                                <td>${row.waktu_pulang || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div class="footer-sig">
                    <div class="sig-box">
                        <div>Karyawan Bersangkutan</div>
                        <div class="sig-line">${namaKaryawan}</div>
                    </div>
                    <div class="sig-box">
                        <div>Disahkan HRD / Manajer</div>
                        <div class="sig-line">PT Angkasa Ekspres</div>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    // Global handler for Pengajuan Izin
    window.handlePengajuanIzin = async function(event) {
        if (event) event.preventDefault();
        const tipe = document.getElementById('tipeIzin')?.value;
        const tanggal = document.getElementById('tanggalIzin')?.value;
        const keterangan = document.getElementById('alasanIzin')?.value?.trim();

        if (!tanggal || !keterangan) {
            alert('Harap lengkapi tanggal dan alasan permohonan!');
            return;
        }

        const submitBtn = document.getElementById('btnSubmitIzin');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        }

        try {
            const res = await apiCall('/izin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userData.id,
                    tanggal,
                    tipe,
                    keterangan
                })
            });
            playChime(true);
            alert(res.message || 'Pengajuan izin berhasil dicatat!');
            document.getElementById('formPengajuanIzin')?.reset();
            const tabKehadiran = document.querySelector('.menu li[data-tab="kehadiran"]');
            if (tabKehadiran) tabKehadiran.click();
            loadDailyHistory();
            loadBannerStats();
        } catch (err) {
            alert('Gagal mengirim pengajuan: ' + err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Pengajuan';
            }
        }
    };

    function toggleProfileEditMode(isEditing) {
        DOMElements.profileNamaInput.readOnly = !isEditing;
        DOMElements.profileEmailInput.readOnly = !isEditing;
        DOMElements.profileTeleponInput.readOnly = !isEditing;
        DOMElements.saveProfileBtn.style.display = isEditing ? 'inline-block' : 'none';
        DOMElements.cancelProfileBtn.style.display = isEditing ? 'inline-block' : 'none';
        DOMElements.editProfileBtn.style.display = isEditing ? 'none' : 'inline-block';
        DOMElements.changePhotoBtn.style.display = isEditing ? 'inline-block' : 'none';
    }

    function initProfileUI() {
        const displayName = userData.namaLengkap || userData.nama || 'Pengguna';
        const role = userData.role || 'Karyawan';
        const photoSrc = userData.foto_profil || 'Admin-Avatar.png';

        // Sidebar
        if (DOMElements.sidebarUserName) DOMElements.sidebarUserName.textContent = displayName;
        if (DOMElements.sidebarProfilePic) DOMElements.sidebarProfilePic.src = photoSrc;
        if (DOMElements.sidebarProfileImgNew) DOMElements.sidebarProfileImgNew.src = photoSrc;

        // Profile tab
        if (DOMElements.profileNamaInput) DOMElements.profileNamaInput.value = displayName;
        if (DOMElements.profileEmailInput) DOMElements.profileEmailInput.value = userData.email || '';
        if (DOMElements.profileTeleponInput) DOMElements.profileTeleponInput.value = userData.telepon || '';
        if (DOMElements.mainProfilePic) DOMElements.mainProfilePic.src = photoSrc;
        if (DOMElements.profileRoleBadge) DOMElements.profileRoleBadge.textContent = role.charAt(0).toUpperCase() + role.slice(1);

        // Topbar user chip
        if (DOMElements.topbarUserName) DOMElements.topbarUserName.textContent = displayName;
        if (DOMElements.topbarUserRole) DOMElements.topbarUserRole.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        if (DOMElements.topbarUserImg) DOMElements.topbarUserImg.src = photoSrc;

        // Banner
        if (DOMElements.bannerName) DOMElements.bannerName.textContent = displayName.split(' ')[0];
    }

    async function setupCamera() {
        if (!navigator.mediaDevices?.getUserMedia) {
            console.warn("Kamera tidak didukung oleh browser ini.");
            return;
        }
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            DOMElements.video.srcObject = cameraStream;
            await DOMElements.video.play();
            isCameraOn = true;
            DOMElements.video.classList.remove('camera-off');
            if (DOMElements.cameraOffOverlay) DOMElements.cameraOffOverlay.style.display = 'none';
        } catch (error) {
            console.warn("Kamera tidak dapat diakses:", error.message);
            isCameraOn = false;
        }
        updateCameraButtonState();
    }

    function stopCamera() {
        if (!cameraStream) return;
        cameraStream.getTracks().forEach(track => track.stop());
        DOMElements.video.srcObject = null;
        isCameraOn = false;
        DOMElements.video.classList.add('camera-off');
        if (DOMElements.cameraOffOverlay) DOMElements.cameraOffOverlay.style.display = 'flex';
        updateCameraButtonState();
    }

    function updateCameraButtonState() {
        if (!DOMElements.toggleCameraButton) return;
        DOMElements.toggleCameraButton.innerHTML = isCameraOn
            ? `<i class="fas fa-video-slash"></i> <span>Matikan Kamera</span>`
            : `<i class="fas fa-video"></i> <span>Nyalakan Kamera</span>`;
    }

    // Tab title mapping
    const tabTitles = {
        kehadiran: 'Kehadiran',
        rekapAbsensi: 'Rekap Absensi',
        pengajuanIzin: 'Pengajuan Izin',
        profile: 'Profil Saya',
        password: 'Ubah Password'
    };

    function setupEventListeners() {
        // Sidebar toggle - mobile vs desktop
        DOMElements.toggleSidebarButton?.addEventListener('click', () => {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                DOMElements.sidebar.classList.toggle('mobile-open');
                DOMElements.mobileOverlay?.classList.toggle('active');
            } else {
                DOMElements.sidebar.classList.toggle('collapsed');
            }
        });

        // Close sidebar on mobile overlay click
        DOMElements.mobileOverlay?.addEventListener('click', () => {
            DOMElements.sidebar.classList.remove('mobile-open');
            DOMElements.mobileOverlay.classList.remove('active');
        });

        // Dark mode toggle
        DOMElements.darkModeButton?.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('darkMode', isDark);
            const icon = DOMElements.darkModeButton.querySelector('i');
            if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        });

        DOMElements.logoutButton?.addEventListener('click', () => {
            if (confirm('Yakin mau logout?')) {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        });

        DOMElements.menuItems.forEach(li => {
            const tabId = li.getAttribute('data-tab');
            if (tabId) li.addEventListener('click', () => {
                DOMElements.tabContents.forEach(tab => tab.classList.remove('active'));
                document.getElementById(tabId)?.classList.add('active');
                DOMElements.menuItems.forEach(item => item.classList.remove('active-menu'));
                li.classList.add('active-menu');
                if (DOMElements.topbarTitle) DOMElements.topbarTitle.textContent = tabTitles[tabId] || tabId;
                // Close mobile sidebar after nav
                if (window.innerWidth <= 768) {
                    DOMElements.sidebar.classList.remove('mobile-open');
                    DOMElements.mobileOverlay?.classList.remove('active');
                }
                if (tabId === 'kehadiran') {
                    loadDailyHistory();
                    if (!isCameraOn) setupCamera();
                } else {
                    if (isCameraOn) stopCamera();
                }
            });
        });

        DOMElements.editProfileBtn?.addEventListener('click', () => toggleProfileEditMode(true));
        DOMElements.cancelProfileBtn?.addEventListener('click', () => {
            initProfileUI();
            toggleProfileEditMode(false);
        });

        DOMElements.profileForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const bodyData = {
                namaLengkap: DOMElements.profileNamaInput.value,
                email: DOMElements.profileEmailInput.value,
                telepon: DOMElements.profileTeleponInput.value,
            };
            if (DOMElements.mainProfilePic.src.startsWith('data:image')) {
                bodyData.foto_profil = DOMElements.mainProfilePic.src;
            }
            try {
                const result = await apiCall(`/users/${userData.id}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyData)
                });
                alert(result.message);
                const updatedUser = { ...userData, ...result.updatedUser };
                sessionStorage.setItem('userData', JSON.stringify(updatedUser));
                userData = updatedUser;
                initProfileUI();
                toggleProfileEditMode(false);
            } catch (error) { /* Ditangani di apiCall */ }
        });

        DOMElements.changePhotoBtn?.addEventListener('click', () => DOMElements.uploadProfilePicInput.click());
        DOMElements.uploadProfilePicInput?.addEventListener('change', e => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => { DOMElements.mainProfilePic.src = event.target.result; };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        // Form Ubah Password
        const passwordForm = document.querySelector('.password-form');
        passwordForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmNewPassword').value;

            if (newPass !== confirmPass) {
                alert('Konfirmasi password baru tidak cocok!');
                return;
            }
            if (newPass.length < 4) {
                alert('Password minimal 4 karakter!');
                return;
            }

            try {
                const result = await apiCall(`/users/${userData.id}/profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        namaLengkap: userData.namaLengkap || userData.nama,
                        email: userData.email,
                        telepon: userData.telepon,
                        password: newPass
                    })
                });
                alert('Password berhasil diperbarui!');
                passwordForm.reset();
            } catch (err) { /* Ditangani di apiCall */ }
        });

        DOMElements.toggleCameraButton?.addEventListener('click', () => isCameraOn ? stopCamera() : setupCamera());
        DOMElements.clockInButton?.addEventListener('click', () => handleAttendance('clockin'));
        DOMElements.clockOutButton?.addEventListener('click', () => handleAttendance('clockout'));

        DOMElements.tampilkanRekapBtn?.addEventListener('click', () => {
            const bulan = DOMElements.bulanRekapInput.value;
            if (!bulan) {
                alert('Silakan pilih bulan terlebih dahulu.');
                return;
            }
            loadRecapData(bulan);
        });

        document.getElementById('cetakSlipBtn')?.addEventListener('click', cetakSlipPresensi);
        document.getElementById('exportCsvBtn')?.addEventListener('click', exportCsvRekap);

        // Click on location to open Google Maps
        DOMElements.realtimeLocation?.addEventListener('click', () => {
            const txt = DOMElements.realtimeLocation.textContent;
            const match = txt.match(/Lat:\s*([-\d.]+),\s*Lon:\s*([-\d.]+)/);
            if (match) {
                window.open(`https://maps.google.com/?q=${match[1]},${match[2]}`, '_blank');
            }
        });
    }

    // Live clock tick
    function startLiveClock() {
        const DAYS_ID = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
        const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

        function tick() {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2,'0');
            const mm = String(now.getMinutes()).padStart(2,'0');
            const ss = String(now.getSeconds()).padStart(2,'0');
            const timeStr = `${hh}:${mm}:${ss}`;
            const dayName = DAYS_ID[now.getDay()];
            const dateStr = `${dayName}, ${now.getDate()} ${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`;

            if (DOMElements.topbarClock) DOMElements.topbarClock.textContent = timeStr;
            if (DOMElements.topbarDayLabel) DOMElements.topbarDayLabel.textContent = dayName;
            if (DOMElements.topbarDateLabel) DOMElements.topbarDateLabel.textContent = dateStr;
            if (DOMElements.cardLiveClock) DOMElements.cardLiveClock.textContent = timeStr;
            if (DOMElements.cardLiveDate) DOMElements.cardLiveDate.textContent = dateStr;
            if (DOMElements.bannerDate) DOMElements.bannerDate.textContent = dateStr;

            // Update Hadirr mobile live clocks & greeting
            const hadirrClock = document.getElementById('hadirrLiveClock');
            if (hadirrClock) hadirrClock.textContent = timeStr;
            const modalClock = document.getElementById('modalLiveClock');
            if (modalClock) modalClock.textContent = timeStr;

            const hr = now.getHours();
            let greeting = 'Good Morning';
            if (hr >= 4 && hr < 11) greeting = 'Selamat Pagi';
            else if (hr >= 11 && hr < 15) greeting = 'Selamat Siang';
            else if (hr >= 15 && hr < 18) greeting = 'Selamat Sore';
            else greeting = 'Selamat Malam';
            const greetingEl = document.getElementById('hadirrGreetingTitle');
            if (greetingEl) greetingEl.textContent = greeting;
        }
        tick();
        setInterval(tick, 1000);
    }

    async function loadBannerStats() {
        const now = new Date();
        const bulan = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        try {
            const data = await apiCall(`/attendance/history/${userData.id}?bulan=${bulan}`);
            let hadir = 0, telat = 0, alpha = 0;
            data.forEach(item => {
                const s = (item.status||'').toLowerCase();
                if (s === 'hadir') hadir++;
                else if (s === 'telat') telat++;
                else if (s === 'absen' || s === 'tidak hadir') alpha++;
            });
            if (DOMElements.bannerHadirCount) DOMElements.bannerHadirCount.textContent = hadir;
            if (DOMElements.bannerTelatCount) DOMElements.bannerTelatCount.textContent = telat;
            if (DOMElements.bannerAlphaCount) DOMElements.bannerAlphaCount.textContent = alpha;
        } catch(e) {
            console.warn('Banner stats error', e);
        }
    }

    async function init() {
        // Dark mode
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            const icon = DOMElements.darkModeButton?.querySelector('i');
            if (icon) icon.className = 'fas fa-sun';
        }

        // Default month rekap
        if (DOMElements.bulanRekapInput) {
            const now = new Date();
            DOMElements.bulanRekapInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        // Start live clock
        startLiveClock();

        try {
            const fullProfile = await apiCall(`/users/${userData.id}/profile`);
            userData = { ...userData, ...fullProfile };
            sessionStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.warn('Menggunakan data sesi lokal.', error);
        }

        initProfileUI();
        setupEventListeners();

        // Load banner stats
        loadBannerStats();

        const kehadiranTab = document.querySelector('.menu li[data-tab="kehadiran"]');
        if (kehadiranTab) {
            kehadiranTab.click();
        } else {
            loadDailyHistory();
            if (!isCameraOn) setupCamera();
        }
        getLocation(true);
    }

    // =================================================================
    // HADIRR-STYLE MOBILE INTERACTIONS
    // =================================================================
    let mobileCameraStream = null;
    let currentMobileAction = 'clockin';

    async function openMobileCameraModal(actionType = 'clockin') {
        currentMobileAction = actionType;
        const modal = document.getElementById('mobileCameraModal');
        const title = document.getElementById('mobileModalActionTitle');
        const btn = document.getElementById('modalConfirmAbsenBtn');
        const video = document.getElementById('modalVideo');

        if (title) {
            title.innerHTML = actionType === 'clockin'
                ? '<i class="fas fa-camera" style="color:#f59e0b;margin-right:8px;"></i>Absen Masuk'
                : '<i class="fas fa-camera" style="color:#ef4444;margin-right:8px;"></i>Absen Pulang';
        }
        if (btn) {
            btn.innerHTML = actionType === 'clockin'
                ? '<i class="fas fa-camera"></i> Ambil Foto & Absen Masuk'
                : '<i class="fas fa-sign-out-alt"></i> Ambil Foto & Absen Pulang';
            btn.className = actionType === 'clockin' ? 'btn btn-primary btn-block btn-lg' : 'btn btn-danger btn-block btn-lg';
        }

        if (modal) modal.style.display = 'flex';

        // Start camera stream on modal video
        if (navigator.mediaDevices?.getUserMedia && video) {
            try {
                mobileCameraStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
                });
                video.srcObject = mobileCameraStream;
                await video.play();
            } catch (err) {
                console.warn('Mobile camera error:', err);
            }
        }

        // Update modal location
        const modalLoc = document.getElementById('modal-realtime-location');
        if (modalLoc && DOMElements.realtimeLocation) {
            modalLoc.textContent = DOMElements.realtimeLocation.textContent;
        }
    }

    function closeMobileCameraModal() {
        const modal = document.getElementById('mobileCameraModal');
        if (modal) modal.style.display = 'none';
        if (mobileCameraStream) {
            mobileCameraStream.getTracks().forEach(t => t.stop());
            mobileCameraStream = null;
        }
        const video = document.getElementById('modalVideo');
        if (video) video.srcObject = null;
    }

    async function confirmMobileAttendance() {
        const btn = document.getElementById('modalConfirmAbsenBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim Absensi...';
        }

        const video = document.getElementById('modalVideo');
        let photoDataUrl = null;
        if (video && video.videoWidth > 0 && DOMElements.canvas) {
            const canvas = DOMElements.canvas;
            canvas.width = video.videoWidth || 400;
            canvas.height = video.videoHeight || 300;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            // Stempel Watermark
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.fillRect(0, canvas.height - 44, canvas.width, 44);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(`${userData.namaLengkap || userData.nama || 'Karyawan'} • ${new Date().toLocaleTimeString('id-ID')}`, 12, canvas.height - 24);
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = '#cbd5e1';
            ctx.fillText(DOMElements.realtimeLocation ? DOMElements.realtimeLocation.textContent : 'GPS Valid', 12, canvas.height - 8);
            photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        }

        try {
            await handleAttendance(currentMobileAction, photoDataUrl);
            closeMobileCameraModal();
        } catch (e) {
            console.error(e);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    function switchMobileTab(tabId) {
        const li = document.querySelector(`.menu li[data-tab="${tabId}"]`);
        if (li) li.click();

        document.querySelectorAll('.mobile-bottom-dock .dock-item').forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Topbar handling
        const topbar = document.querySelector('.topbar');
        if (topbar) {
            if (tabId === 'kehadiran') {
                topbar.style.display = '';
            } else {
                topbar.style.display = 'flex';
            }
        }
    }

    function openOfficeMapLocation() {
        const txt = DOMElements.realtimeLocation ? DOMElements.realtimeLocation.textContent : '';
        const match = txt.match(/Lat:\s*([-\d.]+),\s*Lon:\s*([-\d.]+)/);
        if (match) {
            window.open(`https://maps.google.com/?q=${match[1]},${match[2]}`, '_blank');
        } else {
            window.open('https://maps.google.com/?q=-6.34395432,106.73780986', '_blank');
        }
    }

    // Expose global mobile handlers
    window.openMobileCameraModal = openMobileCameraModal;
    window.closeMobileCameraModal = closeMobileCameraModal;
    window.confirmMobileAttendance = confirmMobileAttendance;
    window.switchMobileTab = switchMobileTab;
    window.openOfficeMapLocation = openOfficeMapLocation;

    init();
});
