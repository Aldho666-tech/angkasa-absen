'use strict';

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // KONFIGURASI DAN STATE APLIKASI
    // =================================================================
    const API_BASE_URL = 'http://93.127.167.168:3000/api';
    let userData = JSON.parse(sessionStorage.getItem('userData'));

    if (!userData || sessionStorage.getItem('userRole') !== 'admin') {
        alert("Akses ditolak. Silakan login sebagai admin.");
        window.location.href = 'index.html';
        return;
    }

    const DOMElements = {
        // Layout
        sidebar: document.getElementById('sidebar'),
        toggleSidebarButton: document.getElementById('toggleSidebar'),
        darkModeButton: document.getElementById('toggleDarkMode'),
        body: document.body,
        mobileOverlay: null, // Akan diinisialisasi nanti jika belum ada di HTML
        // Menu & Konten
        menuItems: document.querySelectorAll('.menu li'),
        tabContents: document.querySelectorAll('.tab-content'),
        logoutButton: document.getElementById('logout-btn'),
        adminNameHeader: document.getElementById('adminName'),
        sidebarProfilePic: document.getElementById('sidebarProfilePic'),
        // Tab Dashboard
        dashboardTotalHadir: document.getElementById('dashboardTotalHadir'),
        dashboardTotalTelat: document.getElementById('dashboardTotalTelat'),
        dashboardTotalCuti: document.getElementById('dashboardTotalCuti'),
        dashboardTotalIzin: document.getElementById('dashboardTotalIzin'),
        dashboardJumlahKaryawan: document.getElementById('dashboardJumlahKaryawan'),
        // Tab Cek Absensi
        tabelAbsensiHarianBody: document.querySelector('#tabelAbsensiHarian tbody'),
        filterTanggalBtn: document.getElementById('filterTanggalBtn'),
        tanggalCekInput: document.getElementById('tanggalCek'),
        // Tab Rekap Absensi
        tabelRekapDetailBody: document.querySelector('#tabelRekapDetail tbody'),
        tampilkanRekapBtn: document.getElementById('tampilkanRekapBtn'),
        downloadRekapBtn: document.getElementById('downloadRekapBtn'),
        bulanRekapInput: document.getElementById('bulanRekap'),
        // Tab Pengaturan Akun
        tabelKaryawanBody: document.querySelector('#tabelKaryawan tbody'),
        tambahKaryawanBtn: document.getElementById('tambahKaryawanBtn'),
        
        // --- [BARU] ELEMEN UNTUK EDIT PROFIL ---
        adminProfileForm: document.getElementById('adminProfileForm'),
        adminMainProfilePic: document.getElementById('adminMainProfilePic'),
        uploadAdminPicInput: document.getElementById('uploadAdminPic'),
        changeAdminPhotoBtn: document.getElementById('changeAdminPhotoBtn'),
        adminNamaLengkapInput: document.getElementById('adminNamaLengkap'),
        adminEmailInput: document.getElementById('adminEmail'),
        adminTeleponInput: document.getElementById('adminTelepon'),
        adminPasswordBaruInput: document.getElementById('adminPasswordBaru'),
        // -----------------------------------------
        
        // Tab Pengaturan Absensi
        formPengaturanAbsensi: document.getElementById('formPengaturanAbsensi'),
        // Modal Karyawan
        userModal: document.getElementById('userModal'),
        closeModalBtn: document.querySelector('#userModal .close-button'),
        userForm: document.getElementById('userForm'),
        modalTitle: document.getElementById('modalTitle'),
        userIdInput: document.getElementById('userId'),
        namaLengkapInput: document.getElementById('namaLengkap'),
        emailInput: document.getElementById('email'),
        teleponInput: document.getElementById('telepon'),
        karyawanPasswordInput: document.getElementById('karyawanPassword'),
        // Modal Foto
        photoModal: document.getElementById('photoModal'),
        modalImage: document.getElementById('modalImage'),
        closePhotoModalBtn: document.querySelector('.close-photo-button'),
    };

    // =================================================================
    // FUNGSI MOBILE SIDEBAR HANDLING
    // =================================================================
    function createMobileOverlay() {
        let existingOverlay = document.getElementById('mobileOverlay') || document.querySelector('.mobile-overlay');
        if (!existingOverlay) {
            const overlay = document.createElement('div');
            overlay.id = 'mobileOverlay';
            overlay.className = 'mobile-overlay';
            document.body.appendChild(overlay);
            DOMElements.mobileOverlay = overlay;
        } else {
            DOMElements.mobileOverlay = existingOverlay;
        }
    }

    function isMobileView() {
        return window.innerWidth <= 1024;
    }

    function toggleSidebar() {
        if (isMobileView()) {
            const isOpen = DOMElements.sidebar.classList.contains('mobile-open');
            DOMElements.sidebar.classList.toggle('mobile-open');
            DOMElements.mobileOverlay?.classList.toggle('active');
            document.body.style.overflow = isOpen ? '' : 'hidden';
        } else {
            DOMElements.sidebar.classList.toggle('collapsed');
        }
    }

    function closeMobileSidebar() {
        if (isMobileView() && DOMElements.sidebar.classList.contains('mobile-open')) {
            DOMElements.sidebar.classList.remove('mobile-open');
            DOMElements.mobileOverlay?.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function handleResize() {
        if (!isMobileView()) {
            closeMobileSidebar();
            // Dihapus agar tidak auto expand saat resize di desktop
            // DOMElements.sidebar.classList.remove('collapsed'); 
        } else {
            DOMElements.sidebar.classList.remove('collapsed');
        }
    }

    // =================================================================
    // FUNGSI API
    // =================================================================
    async function apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Server error: ${response.statusText}` }));
                throw new Error(errorData.message || 'Terjadi kesalahan pada server');
            }
            if (response.headers.get('content-type')?.includes('application/json')) {
                return response.json();
            }
            return response.text();
        } catch (error) {
            console.error(`API Call Error (${endpoint}):`, error);
            alert(`Gagal terhubung ke server: ${error.message}`);
            throw error;
        }
    }

    // =================================================================
    // FUNGSI RENDER UI
    // =================================================================
    function renderAbsensiTable(data) {
        const tabelBody = DOMElements.tabelAbsensiHarianBody;
        tabelBody.innerHTML = '';
        if (!data || data.length === 0) {
            tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px;">Tidak ada data absensi untuk tanggal ini.</td></tr>`;
            return;
        }
        data.forEach(d => {
            const statusClass = d.status ? `status-${d.status.toLowerCase()}` : '';
            const fotoSrc = (d.foto_masuk && d.foto_masuk.startsWith('data:image')) ? d.foto_masuk : 'https://placehold.co/100x100/e60000/white?text=No+Img';
            const row = `
                <tr>
                    <td>${d.nama_lengkap}</td>
                    <td><span class="${statusClass}">${d.status}</span></td>
                    <td>${d.waktu_masuk || '-'}</td>
                    <td>${d.waktu_pulang || '-'}</td>
                    <td>${d.lokasi_masuk || '-'}</td>
                    <td><img src="${fotoSrc}" alt="Foto Absen" class="foto-thumbnail" data-full-src="${fotoSrc}"></td>
                </tr>`;
            tabelBody.insertAdjacentHTML('beforeend', row);
        });
    }

    function renderRekapTable(data) {
        const tabelBody = DOMElements.tabelRekapDetailBody;
        tabelBody.innerHTML = '';
        if (!data || data.length === 0) {
            tabelBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Tidak ada data rekap untuk bulan ini.</td></tr>`;
            return;
        }
        data.forEach(d => {
            const statusClass = d.status ? `status-${d.status.toLowerCase()}` : '';
            const tanggalFormatted = new Date(d.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            const row = `
                <tr>
                    <td>${tanggalFormatted}</td>
                    <td>${d.nama_lengkap}</td>
                    <td><span class="${statusClass}">${d.status}</span></td>
                    <td>${d.waktu_masuk || '-'}</td>
                    <td>${d.waktu_pulang || '-'}</td>
                </tr>`;
            tabelBody.insertAdjacentHTML('beforeend', row);
        });
    }

    function renderKaryawanTable(data) {
        const tabelBody = DOMElements.tabelKaryawanBody;
        tabelBody.innerHTML = '';
        data.forEach(k => {
            const row = `
                <tr>
                    <td>${k.nama_lengkap}</td>
                    <td>${k.email}</td>
                    <td>${k.telepon || '-'}</td>
                    <td class="action-buttons">
                        <button class="btn-edit" data-id="${k.id}" data-nama="${k.nama_lengkap}" data-email="${k.email}" data-telepon="${k.telepon || ''}"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" data-id="${k.id}"><i class="fas fa-trash-alt"></i></button>
                    </td>
                </tr>`;
            tabelBody.insertAdjacentHTML('beforeend', row);
        });
    }

    function renderDashboardSummary(data) {
        DOMElements.dashboardTotalHadir.textContent = data.totalHadir || 0;
        DOMElements.dashboardTotalTelat.textContent = data.totalTelat || 0;
        if (DOMElements.dashboardTotalCuti) DOMElements.dashboardTotalCuti.textContent = data.totalCuti || 0;
        if (DOMElements.dashboardTotalIzin) DOMElements.dashboardTotalIzin.textContent = data.totalIzin || 0;
        DOMElements.dashboardJumlahKaryawan.textContent = data.jumlahKaryawan || 0;
    }

    // =================================================================
    // FUNGSI LOGIKA INTI
    // =================================================================
    async function loadDataForTab(tabId) {
        switch (tabId) {
            case 'dashboard': await loadDashboardSummary(); break;
            case 'cekAbsensi': await loadAbsensiHarian(); break;
            case 'pengaturanAkun': await loadDaftarKaryawan(); break;
            case 'pengaturanAbsensi': await loadPengaturanAbsensi(); break;
            case 'rekapAbsensi': await loadRekapAbsensi(); break;
            case 'editProfile': loadAdminProfile(); break; // <-- [BARU] Logika untuk tab profil
        }
    }

    async function loadDashboardSummary() {
        try {
            const summary = await apiCall('/dashboard/summaryToday'); 
            const totalKaryawan = await apiCall('/karyawan/count'); 
            
            renderDashboardSummary({
                totalHadir: summary.hadir, 
                totalTelat: summary.telat, 
                totalCuti: summary.cuti,
                totalIzin: summary.izin,
                jumlahKaryawan: totalKaryawan.count
            });
        } catch (error) {
            console.error("Gagal memuat ringkasan dashboard:", error);
            DOMElements.dashboardTotalHadir.textContent = '0';
            DOMElements.dashboardTotalTelat.textContent = '0';
            if (DOMElements.dashboardTotalCuti) DOMElements.dashboardTotalCuti.textContent = '0';
            if (DOMElements.dashboardTotalIzin) DOMElements.dashboardTotalIzin.textContent = '0';
            DOMElements.dashboardJumlahKaryawan.textContent = '0';
        }
    }

    async function loadAbsensiHarian(tanggal = new Date().toISOString().split('T')[0]) {
        try {
            renderAbsensiTable(await apiCall(`/absensi/harian?tanggal=${tanggal}`));
        } catch (error) {
            DOMElements.tabelAbsensiHarianBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
        }
    }

    async function loadRekapAbsensi() {
        const bulan = DOMElements.bulanRekapInput.value;
        if (!bulan) return;
        try {
            renderRekapTable(await apiCall(`/rekap/bulanan?bulan=${bulan}`));
        } catch (error) {
            DOMElements.tabelRekapDetailBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data rekap.</td></tr>`;
        }
    }

    async function loadDaftarKaryawan() {
        try {
            renderKaryawanTable(await apiCall('/karyawan'));
        } catch (error) {
            DOMElements.tabelKaryawanBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Gagal memuat data karyawan.</td></tr>`;
        }
    }
    
    // --- [BARU] FUNGSI UNTUK MEMUAT PROFIL ADMIN KE FORM ---
    function loadAdminProfile() {
        if (!userData) return;
        const { adminNamaLengkapInput, adminEmailInput, adminTeleponInput, adminMainProfilePic } = DOMElements;
        adminNamaLengkapInput.value = userData.namaLengkap || '';
        adminEmailInput.value = userData.email || '';
        adminTeleponInput.value = userData.telepon || '';
        adminMainProfilePic.src = userData.foto_profil || 'Admin-Avatar.png';
        DOMElements.adminPasswordBaruInput.value = '';
    }

    async function loadPengaturanAbsensi() {
        try {
            const settings = await apiCall('/settings/attendance');
            if (DOMElements.formPengaturanAbsensi && Object.keys(settings).length > 0) {
                document.getElementById('jamMasuk').value = settings.jam_masuk;
                document.getElementById('jamPulang').value = settings.jam_pulang;
                document.getElementById('latitude').value = settings.latitude;
                document.getElementById('longitude').value = settings.longitude;
                document.getElementById('radius').value = settings.radius;
            }
        } catch (error) {
            console.log("Gagal memuat pengaturan, mungkin belum ada data.");
        }
    }

    // --- Logika Modal ---
    function openUserModal(mode = 'add', karyawan = {}) {
        DOMElements.userForm.reset();
        DOMElements.modalTitle.textContent = mode === 'add' ? 'Tambah Karyawan Baru' : 'Edit Data Karyawan';
        DOMElements.userIdInput.value = karyawan.id || '';
        if (mode === 'edit') {
            DOMElements.namaLengkapInput.value = karyawan.nama;
            DOMElements.emailInput.value = karyawan.email;
            DOMElements.teleponInput.value = karyawan.telepon;
            DOMElements.karyawanPasswordInput.placeholder = 'Biarkan kosong jika tidak ingin mengubah';
            DOMElements.karyawanPasswordInput.required = false;
        } else {
            DOMElements.karyawanPasswordInput.placeholder = 'Password Wajib Diisi';
            DOMElements.karyawanPasswordInput.required = true;
        }
        DOMElements.userModal.style.display = 'block';
    }

    function closeModal() {
        DOMElements.userModal.style.display = 'none';
    }

    function openPhotoModal(imageUrl) {
        DOMElements.modalImage.src = imageUrl;
        DOMElements.photoModal.style.display = 'flex';
    }

    function closePhotoModal() {
        DOMElements.photoModal.style.display = 'none';
    }

    // =================================================================
    // PENGATURAN EVENT LISTENERS
    // =================================================================
    function setupEventListeners() {
        // --- Sidebar & Layout ---
        DOMElements.toggleSidebarButton?.addEventListener('click', toggleSidebar);
        if (DOMElements.mobileOverlay) {
            DOMElements.mobileOverlay.addEventListener('click', closeMobileSidebar);
        }
        window.addEventListener('resize', handleResize);
        
        DOMElements.darkModeButton?.addEventListener('click', () => {
            DOMElements.body.classList.toggle('dark-mode');
            localStorage.setItem('adminDarkMode', DOMElements.body.classList.contains('dark-mode'));
        });
        
        DOMElements.logoutButton?.addEventListener('click', () => {
            if (confirm('Yakin ingin logout?')) { 
                sessionStorage.clear(); 
                window.location.href = 'index.html'; 
            }
        });

        // --- Navigasi Menu ---
        DOMElements.menuItems.forEach(li => {
            li.addEventListener('click', () => {
                const tabId = li.getAttribute('data-tab');
                DOMElements.tabContents.forEach(tab => tab.classList.remove('active'));
                document.getElementById(tabId)?.classList.add('active');
                DOMElements.menuItems.forEach(i => i.classList.remove('active-menu'));
                li.classList.add('active-menu');
                loadDataForTab(tabId);
                closeMobileSidebar();
            });
        });

        // --- Event Listeners untuk Tab Spesifik ---
        DOMElements.filterTanggalBtn?.addEventListener('click', () => loadAbsensiHarian(DOMElements.tanggalCekInput.value));
        DOMElements.tampilkanRekapBtn?.addEventListener('click', loadRekapAbsensi);
        DOMElements.tambahKaryawanBtn?.addEventListener('click', () => openUserModal('add'));
        DOMElements.closeModalBtn?.addEventListener('click', closeModal);
        DOMElements.closePhotoModalBtn?.addEventListener('click', closePhotoModal);
        
        // --- Event Delegation untuk Aksi Tabel dan Modal ---
        document.body.addEventListener('click', (event) => {
            if (event.target.classList.contains('foto-thumbnail')) {
                openPhotoModal(event.target.dataset.fullSrc);
            }
            const editButton = event.target.closest('.btn-edit');
            if (editButton) {
                openUserModal('edit', editButton.dataset);
            }
            const deleteButton = event.target.closest('.btn-delete');
            if (deleteButton && confirm(`Yakin ingin menghapus karyawan ini?`)) {
                apiCall(`/karyawan/${deleteButton.dataset.id}`, { method: 'DELETE' }).then(result => { alert(result.message); loadDaftarKaryawan(); });
            }
        });
        
        window.addEventListener('click', (event) => {
             if (event.target == DOMElements.userModal) closeModal();
             if (event.target == DOMElements.photoModal) closePhotoModal();
        });

        // --- [BARU] EVENT LISTENERS UNTUK EDIT PROFIL ---
        DOMElements.changeAdminPhotoBtn?.addEventListener('click', () => {
            DOMElements.uploadAdminPicInput.click();
        });

        DOMElements.uploadAdminPicInput?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    DOMElements.adminMainProfilePic.src = event.target.result;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });

        DOMElements.adminProfileForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const bodyData = {
                namaLengkap: DOMElements.adminNamaLengkapInput.value,
                email: DOMElements.adminEmailInput.value,
                telepon: DOMElements.adminTeleponInput.value,
            };
            const newPassword = DOMElements.adminPasswordBaruInput.value;
            if (newPassword) {
                bodyData.password = newPassword;
            }
            if (DOMElements.adminMainProfilePic.src.startsWith('data:image')) {
                bodyData.foto_profil = DOMElements.adminMainProfilePic.src;
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
                initAdminUI();
                loadAdminProfile();
            } catch (error) { /* Ditangani di apiCall */ }
        });
        // --------------------------------------------------------

        // --- Event Listeners untuk Form Lainnya ---
        DOMElements.userForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const id = DOMElements.userIdInput.value;
            const isEdit = id !== '';
            const password = DOMElements.karyawanPasswordInput.value;
            if (!isEdit && !password) return alert('Password wajib diisi untuk karyawan baru.');
            const bodyData = {
                namaLengkap: DOMElements.namaLengkapInput.value,
                email: DOMElements.emailInput.value,
                telepon: DOMElements.teleponInput.value
            };
            if (password) bodyData.password = password;
            try {
                const result = await apiCall(isEdit ? `/karyawan/${id}` : '/karyawan', {
                    method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData)
                });
                alert(result.message || 'Data berhasil disimpan!');
                closeModal();
                loadDaftarKaryawan();
            } catch (error) { /* Ditangani di apiCall */ }
        });

        DOMElements.formPengaturanAbsensi?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const bodyData = {
                jam_masuk: document.getElementById('jamMasuk').value,
                jam_pulang: document.getElementById('jamPulang').value,
                latitude: document.getElementById('latitude').value,
                longitude: document.getElementById('longitude').value,
                radius: document.getElementById('radius').value
            };
            if (confirm("Yakin ingin menyimpan pengaturan ini?")) {
                try {
                    const result = await apiCall('/settings/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) });
                    alert(result.message || "Pengaturan berhasil disimpan!");
                } catch (error) { /* Ditangani di apiCall */ }
            }
        });
        
        DOMElements.downloadRekapBtn?.addEventListener('click', () => {
            const bulan = DOMElements.bulanRekapInput.value;
            if (!bulan) return alert('Silakan pilih bulan terlebih dahulu.');
            window.location.href = `${API_BASE_URL}/rekap/download?bulan=${bulan}`;
        });
    }

    // =================================================================
    // INISIALISASI APLIKASI
    // =================================================================
    function initAdminUI() {
        const { adminNameHeader, sidebarProfilePic, tanggalCekInput, bulanRekapInput } = DOMElements;
        adminNameHeader.textContent = userData.namaLengkap || userData.nama || 'Admin';
        sidebarProfilePic.src = userData.foto_profil || 'Admin-Avatar.png';
        if(tanggalCekInput) tanggalCekInput.valueAsDate = new Date();
        if(bulanRekapInput) {
            const now = new Date();
            bulanRekapInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
    }

    async function init() {
        createMobileOverlay();
        if (localStorage.getItem('adminDarkMode') === 'true') {
            DOMElements.body.classList.add('dark-mode');
        }
        setupEventListeners();
        try {
            const fullProfile = await apiCall(`/users/${userData.id}/profile`);
            userData = { ...userData, ...fullProfile };
            sessionStorage.setItem('userData', JSON.stringify(userData));
        } catch (error) {
            console.error("Gagal memuat profil lengkap, menggunakan data sesi dasar.", error);
        }
        initAdminUI();
        document.querySelector('.menu li[data-tab="dashboard"]')?.click();
        handleResize();
    }
    
    init();
});