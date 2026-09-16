'use strict';

/**
 * Base URL API yang fleksibel untuk berbagai environment:
 * - Localhost port 3000: '/api'
 * - Web server lain (live server dsb): 'http://localhost:3000/api'
 */
const API_BASE_URL = window.location.protocol.startsWith('http')
  ? (window.location.port === '3000' || !window.location.port ? '/api' : 'http://localhost:3000/api')
  : 'http://localhost:3000/api';

/**
 * Menangani proses login saat form disubmit.
 * Fungsi ini mengirimkan data ke server, memproses respons,
 * dan mengarahkan pengguna ke halaman yang sesuai.
 * @param {Event} event - Objek event dari form submission.
 */
async function handleLogin(event) {
  if (event) event.preventDefault(); // Mencegah form dari reload halaman

  // Mengambil elemen-elemen DOM yang dibutuhkan
  const loginButton = document.getElementById('loginButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Validasi input dasar
  if (!username || !password) {
    alert('Username dan password harus diisi!');
    return;
  }

  // Menonaktifkan tombol dan menampilkan loading spinner
  loginButton.disabled = true;
  buttonText.textContent = 'Memproses...';
  loadingSpinner.style.display = 'inline-block';

  try {
    // Mengirim data login ke server menggunakan API Fetch
    const response = await fetch(`${API_BASE_URL}/login`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    // Jika server merespons dengan status error atau login gagal
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Username atau password salah.');
    }

    // Jika login berhasil, simpan data pengguna ke sessionStorage
    sessionStorage.setItem('userData', JSON.stringify(result.userData));
    sessionStorage.setItem('userRole', result.role);

    // Mengarahkan ke halaman yang sesuai berdasarkan peran (role)
    if (result.role === 'admin') {
      window.location.href = 'admin.html'; // Arahkan ke halaman admin
    } else {
      window.location.href = 'dashboard.html'; // Arahkan ke halaman user biasa
    }

  } catch (error) {
    // Menangani jika terjadi error (koneksi gagal, password salah, dll)
    alert(`Login Gagal: ${error.message}`);
    
    // Mengembalikan tombol ke keadaan semula jika terjadi error
    loginButton.disabled = false;
    buttonText.textContent = 'LOGIN';
    loadingSpinner.style.display = 'none';
  }
}

/**
 * Fungsi pembantu untuk mengisi akun demo secara cepat
 */
function quickLogin(username, password) {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  if (usernameInput && passwordInput) {
    usernameInput.value = username;
    passwordInput.value = password;
    usernameInput.dispatchEvent(new Event('input'));
    passwordInput.dispatchEvent(new Event('input'));
  }
}

/**
 * Menambahkan interaksi UI tambahan pada halaman setelah seluruh konten dimuat.
 */
document.addEventListener('DOMContentLoaded', function() {
  const inputs = document.querySelectorAll('input');
  
  inputs.forEach(input => {
    // Efek visual saat input mendapatkan fokus
    input.addEventListener('focus', function() {
      const wrapper = this.closest('.input-wrapper');
      if (wrapper) wrapper.style.transform = 'scale(1.02)';
    });
    
    // Mengembalikan ke ukuran normal saat fokus hilang
    input.addEventListener('blur', function() {
      const wrapper = this.closest('.input-wrapper');
      if (wrapper) wrapper.style.transform = 'scale(1)';
    });

    // Memberikan feedback visual validasi secara real-time
    input.addEventListener('input', function() {
      if (this.checkValidity()) {
        this.style.borderColor = '#48bb78';
      } else {
        this.style.borderColor = '#72767d';
      }
    });
  });

  // Interaksi tambahan untuk tombol login
  const loginButton = document.getElementById('loginButton');
  if (loginButton) {
    loginButton.addEventListener('mouseenter', function() {
      if (!this.disabled) {
        this.style.transform = 'translateY(-3px)';
      }
    });

    loginButton.addEventListener('mouseleave', function() {
      if (!this.disabled) {
        this.style.transform = 'translateY(0)';
      }
    });
  }
});