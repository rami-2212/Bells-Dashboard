import React from 'react';
import './Header.css';

const DPMBM_LEGEND = [
  { status: 'Design',   color: '#9ca3af', label: 'Design'   },
  { status: 'Plan',     color: '#3b82f6', label: 'Plan'     },
  { status: 'Manage',   color: '#eab308', label: 'Manage'   },
  { status: 'Build',    color: '#f97316', label: 'Build'    },
  { status: 'Maintain', color: '#22c55e', label: 'Maintain' },
];

export default function Header({ connected, alertCount, polesCount, segmentsCount }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo">
          <span className="logo-icon">⚡</span>
          <div>
            <h1>Smart Road GIS</h1>
            <span className="header-subtitle">Waterberg District · South Africa</span>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <span className="stat-icon">🛣️</span>
            <span>~2,500 km</span>
          </div>
          <div className="stat-chip">
            <span className="stat-icon">💡</span>
            <span>90,000 Poles</span>
          </div>
          <div className="stat-chip">
            <span className="stat-icon">📷</span>
            <span>3,300 CCTV</span>
          </div>
          {segmentsCount > 0 && (
            <div className="stat-chip loaded">
              <span>{segmentsCount} Segments</span>
            </div>
          )}
          {polesCount > 0 && (
            <div className="stat-chip loaded">
              <span>{polesCount} Assets</span>
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        {/* DPMBM Legend */}
        <div className="dpmbm-legend">
          <span className="legend-label">DPMBM:</span>
          {DPMBM_LEGEND.map(({ status, color, label }) => (
            <div key={status} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* WebSocket status */}
        <div className={`ws-status ${connected ? 'ws-online' : 'ws-offline'}`}>
          <span className="ws-dot" />
          <span>{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Alert badge */}
        {alertCount > 0 && (
          <div className="alert-badge">
            <span>⚠️ {alertCount} Alert{alertCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </header>
  );
}
