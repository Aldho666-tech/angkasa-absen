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
 * Toggle visibilitas password (Show / Hide kata sandi)
 */
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const eyeIcon = document.getElementById('passwordEyeIcon');
  if (!passwordInput || !eyeIcon) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');
  }
}

/**
 * Menangani klik 'Forgot Password'
 */
function handleForgotPassword(event) {
  if (event) event.preventDefault();
  alert('Silakan hubungi Administrator HR / IT Angkasa Ekspres untuk melakukan reset password akun Anda.\n\nKontak Admin: adminaldo@gmail.com');
}

/**
 * Menangani proses login saat form disubmit.
 * Mengirim data ke server, memproses respons, dan redirect ke admin/dashboard.
 */
async function handleLogin(event) {
  if (event) event.preventDefault();

  const loginButton = document.getElementById('loginButton');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  const username = usernameInput ? usernameInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!username || !password) {
    alert('Harap isi username / email dan password terlebih dahulu!');
    if (!username && usernameInput) usernameInput.focus();
    else if (passwordInput) passwordInput.focus();
    return;
  }

  // UI state saat memproses
  if (loginButton) loginButton.disabled = true;
  if (buttonText) buttonText.textContent = 'Memverifikasi...';
  if (loadingSpinner) loadingSpinner.style.display = 'inline-block';

  try {
    const response = await fetch(`${API_BASE_URL}/login`, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Username atau password tidak cocok.');
    }

    // Simpan info sesi
    sessionStorage.setItem('userData', JSON.stringify(result.userData));
    sessionStorage.setItem('userRole', result.role);

    // Redirect sesuai role
    if (result.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }

  } catch (error) {
    alert(`Login Gagal: ${error.message}`);
    
    if (loginButton) loginButton.disabled = false;
    if (buttonText) buttonText.textContent = 'Login';
    if (loadingSpinner) loadingSpinner.style.display = 'none';
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

    // Highlight input briefly
    usernameInput.closest('.field-input-box').style.borderColor = '#4f46e5';
    passwordInput.closest('.field-input-box').style.borderColor = '#4f46e5';
    
    // Auto-focus the login button
    const loginButton = document.getElementById('loginButton');
    if (loginButton) loginButton.focus();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  if (usernameInput && !usernameInput.value) {
    usernameInput.focus();
  }
});