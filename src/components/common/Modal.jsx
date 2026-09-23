import React, { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '520px',
  isBottomSheet = false
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-container ${isBottomSheet ? 'bottom-sheet' : ''}`}
        style={{ maxWidth }}
        onClick={e => e.stopPropagation()}
      >
        {isBottomSheet && <div className="bottom-sheet-drag-handle"></div>}

        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }

        .modal-container {
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--text-main);
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 26px;
          line-height: 1;
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--transition);
        }
        .modal-close-btn:hover {
          color: var(--brand);
        }

        .modal-body {
          padding: 22px 24px;
          overflow-y: auto;
        }

        .bottom-sheet-drag-handle {
          display: none;
          width: 40px;
          height: 4px;
          background: var(--border-color);
          border-radius: 4px;
          margin: 10px auto 4px;
        }

        @media (max-width: 768px) {
          .modal-backdrop {
            padding: 0;
            align-items: flex-end;
          }
          .modal-container.bottom-sheet {
            max-width: 100% !important;
            border-radius: 20px 20px 0 0;
            max-height: 85vh;
            animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            padding-bottom: env(safe-area-inset-bottom, 14px);
          }
          .bottom-sheet-drag-handle {
            display: block;
          }
          .modal-header {
            padding: 14px 20px;
          }
          .modal-body {
            padding: 16px 20px;
          }
        }
      `}</style>
    </div>
  );
}
