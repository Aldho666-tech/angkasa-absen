import React from 'react';
import './loading-fallback.css';

export default function LoadingFallback({ title = 'Memuat Halaman...', subtitle = 'Menyinkronkan data presensi' }) {
  return (
    <div className="page-loader-wrap">
      <div className="page-loader-pulse-box">
        <div className="page-loader-glow"></div>
        <div className="page-loader-ring"></div>
        <div className="page-loader-core">
          <span className="material-symbols-outlined">radar</span>
        </div>
      </div>

      <div className="page-loader-text-box">
        <span className="page-loader-title">{title}</span>
        <span className="page-loader-sub">{subtitle}</span>
      </div>

      <div className="page-loader-skeleton-wrap">
        <div className="page-loader-skeleton-bar" style={{ width: '85%' }}></div>
        <div className="page-loader-skeleton-bar" style={{ width: '100%' }}></div>
        <div className="page-loader-skeleton-bar" style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}
