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
        riwayatContainer: document.getElementById("riwayatContainer"),
        bulanRekapInput: document.getElementById('bulanRekap'),
        tampilkanRekapBtn: document.getElementById('tampilkanRekapBtn'),
        detailRekapList: document.getElementById('detailRekapList')
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

    async function handleAttendance(type) {
        if (!isCameraOn) {
            await setupCamera();
        }

        const locationData = await getLocation(true);
        const context = DOMElements.canvas.getContext('2d');

        let photoDataUrl = null;
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

            alert(result.message);
            loadDailyHistory(); // Refresh tampilan setelah absen
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
    
    async function loadDailyHistory() {
        if (!DOMElements.riwayatContainer) return;
        
        DOMElements.riwayatContainer.innerHTML = "<p class='no-data-info'>Memuat riwayat...</p>";
        updateAttendanceButtonsState(null);

        try {
            const result = await apiCall(`/attendance/today/${userData.id}`);
            
            if (result.status === 'found' && result.data) {
                const todayAttendance = result.data;
                const statusClass = (todayAttendance.status || 'Hadir').toLowerCase();

                const card = `
                    <div class="card-kehadiran">
                        <div class="card-info">
                            <span class="tgl">Hari Ini - ${new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
                            <span class="jam">Masuk: ${todayAttendance.waktu_masuk || '---'} | Pulang: ${todayAttendance.waktu_pulang || '---'}</span>
                        </div>
                        <div class="card-status ${statusClass}">${todayAttendance.status || 'Hadir'}</div>
                    </div>`;
                DOMElements.riwayatContainer.innerHTML = card;
                updateAttendanceButtonsState(todayAttendance);
            } else {
                DOMElements.riwayatContainer.innerHTML = "<p class='no-data-info'>Belum ada riwayat kehadiran hari ini.</p>";
            }
        } catch (error) {
            console.error("Error loading daily history:", error);
            DOMElements.riwayatContainer.innerHTML = "<p class='no-data-info' style='color:red;'>Gagal memuat riwayat.</p>";
            updateAttendanceButtonsState(null);
        }
    }

    async function loadRecapData(bulan) {
        if (!DOMElements.detailRekapList) return;
        DOMElements.detailRekapList.innerHTML = `<li class="no-data-info">Memuat data rekap untuk bulan ${bulan}...</li>`;
        try {
            const data = await apiCall(`/attendance/history/${userData.id}?bulan=${bulan}`);
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
        DOMElements.sidebarUserName.textContent = displayName;
        DOMElements.profileNamaInput.value = displayName;
        DOMElements.profileEmailInput.value = userData.email || '';
        DOMElements.profileTeleponInput.value = userData.telepon || '';
        if (userData.foto_profil) {
            DOMElements.mainProfilePic.src = userData.foto_profil;
            DOMElements.sidebarProfilePic.src = userData.foto_profil;
        } else {
            DOMElements.mainProfilePic.src = 'Admin-Avatar.png';
            DOMElements.sidebarProfilePic.src = 'Admin-Avatar.png';
        }
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
        updateCameraButtonState();
    }

    function updateCameraButtonState() {
        if (!DOMElements.toggleCameraButton) return;
        DOMElements.toggleCameraButton.innerHTML = isCameraOn
            ? `<i class="fas fa-video-slash"></i> <span>Matikan Kamera</span>`
            : `<i class="fas fa-video"></i> <span>Nyalakan Kamera</span>`;
    }

    function setupEventListeners() {
        DOMElements.toggleSidebarButton?.addEventListener('click', () => DOMElements.sidebar.classList.toggle('collapsed'));
        DOMElements.darkModeButton?.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
        DOMElements.logoutButton?.addEventListener('click', () => {
            if (confirm('Yakin mau logout?')) {
                sessionStorage.clear();
                window.location.href = "index.html";
            }
        });

        DOMElements.menuItems.forEach(li => {
            const tabId = li.getAttribute('data-tab');
            if (tabId) li.addEventListener('click', () => {
                DOMElements.tabContents.forEach(tab => tab.classList.remove('active'));
                document.getElementById(tabId)?.classList.add('active');
                DOMElements.menuItems.forEach(item => item.classList.remove('active-menu'));
                li.classList.add('active-menu');
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
    }

    async function init() {
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }

        // Set default month untuk rekap absensi
        if (DOMElements.bulanRekapInput) {
            const now = new Date();
            DOMElements.bulanRekapInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        try {
            const fullProfile = await apiCall(`/users/${userData.id}/profile`);
            userData = { ...userData, ...fullProfile };
            sessionStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.warn("Menggunakan data sesi lokal.", error);
        }

        initProfileUI();
        setupEventListeners();

        const kehadiranTab = document.querySelector('.menu li[data-tab="kehadiran"]');
        if (kehadiranTab) {
            kehadiranTab.click();
        } else {
            loadDailyHistory();
            if (!isCameraOn) setupCamera();
        }
        getLocation(true);
    }

    init();
});
