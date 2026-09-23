import React from 'react';

export default function BottomNav({ items = [], activeTab, onSelectTab }) {
  return (
    <nav className="mobile-dock-container">
      <div className="mobile-dock-inner">
        {items.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`dock-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
            >
              <div className="dock-icon-wrapper">
                <i className={item.icon}></i>
                {item.badge && <span className="dock-badge-dot"></span>}
              </div>
              <span className="dock-label-text">{item.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .mobile-dock-container {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-color);
          box-shadow: var(--shadow-mobile-dock);
          z-index: 90;
          padding-bottom: env(safe-area-inset-bottom, 6px);
        }

        body.dark-mode .mobile-dock-container {
          background: rgba(21, 31, 50, 0.92);
          border-color: var(--border-color);
        }

        .mobile-dock-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
          height: var(--mobile-dock-h);
          padding: 0 8px;
        }

        .dock-tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          cursor: pointer;
          padding: 6px 0;
          transition: all var(--transition);
          position: relative;
        }

        .dock-icon-wrapper {
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          transition: transform var(--transition);
        }

        .dock-label-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: -0.2px;
          transition: color var(--transition);
        }

        .dock-tab-btn:active .dock-icon-wrapper {
          transform: scale(0.9);
        }

        .dock-tab-btn.active {
          color: var(--brand);
        }

        .dock-tab-btn.active .dock-icon-wrapper {
          transform: translateY(-2px);
        }

        .dock-tab-btn.active .dock-label-text {
          font-weight: 700;
          color: var(--brand);
        }

        .dock-tab-btn.active::after {
          content: '';
          position: absolute;
          top: 0;
          width: 24px;
          height: 3px;
          background: var(--brand);
          border-radius: 0 0 4px 4px;
        }

        .dock-badge-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 7px;
          height: 7px;
          background: var(--brand);
          border-radius: 50%;
        }

        @media (max-width: 768px) {
          .mobile-dock-container {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
}
