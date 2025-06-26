'use strict';

/**
 * Menangani proses login saat form disubmit.
 * Fungsi ini mengirimkan data ke server, memproses respons,
 * dan mengarahkan pengguna ke halaman yang sesuai.
 * @param {Event} event - Objek event dari form submission.
 */
async function handleLogin(event) {
  event.preventDefault(); // Mencegah form dari reload halaman

  // Mengambil elemen-elemen DOM yang dibutuhkan
  const loginButton = document.getElementById('loginButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const username = usernameInput.value;
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
    const response = await fetch('http://93.127.167.168:3000/api/login', { 
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
    alert(result.message); // Menampilkan pesan "Login berhasil!" dari server
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
 * Menambahkan interaksi UI tambahan pada halaman setelah seluruh konten dimuat.
 */
document.addEventListener('DOMContentLoaded', function() {
  const inputs = document.querySelectorAll('input');
  
  inputs.forEach(input => {
    // Efek visual saat input mendapatkan fokus
    input.addEventListener('focus', function() {
      // Sedikit memperbesar wrapper dari input
      this.closest('.input-wrapper').style.transform = 'scale(1.02)';
    });
    
    // Mengembalikan ke ukuran normal saat fokus hilang
    input.addEventListener('blur', function() {
      this.closest('.input-wrapper').style.transform = 'scale(1)';
    });

    // Memberikan feedback visual validasi secara real-time
    input.addEventListener('input', function() {
      if (this.checkValidity()) {
        // Jika valid (misalnya, required dan sudah diisi), border menjadi hijau
        this.style.borderColor = '#48bb78';
      } else {
        // Kembali ke warna border default
        this.style.borderColor = '#72767d';
      }
    });
  });

  // Interaksi tambahan untuk tombol login
  const loginButton = document.getElementById('loginButton');
  
  loginButton.addEventListener('mouseenter', function() {
    // Efek hover jika tombol tidak dalam keadaan disabled
    if (!this.disabled) {
      this.style.transform = 'translateY(-3px)';
    }
  });

  loginButton.addEventListener('mouseleave', function() {
    // Kembali ke posisi semula saat mouse meninggalkan tombol
    if (!this.disabled) {
      this.style.transform = 'translateY(0)';
    }
  });
});