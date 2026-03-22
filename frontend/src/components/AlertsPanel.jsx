import React from 'react';
import './AlertsPanel.css';

const ALERT_ICONS = {
  'Vehicle':                   '🚗',
  'Pedestrian':                '🚶',
  'Animal':                    '🦌',
  'Stopped Vehicle Detection': '🚧',
  'Debris on Roadway':         '⚠️',
  'Illegal Off-ramping':       '🚫',
};

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
};

export default function AlertsPanel({ alerts, onAlertClick }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alerts-panel">
      <div className="alerts-panel-header">
        <span className="alerts-panel-title">⚠ Live Alerts</span>
        <span className="alerts-count">{alerts.length}</span>
      </div>
      <div className="alerts-list">
        {alerts.slice(0, 8).map((alert) => {
          const color = SEVERITY_COLORS[alert.severity] || '#ef4444';
          const icon  = ALERT_ICONS[alert.alert_type]  || '⚠️';
          return (
            <div
              key={alert.alert_id}
              className="alert-item"
              style={{ '--a-color': color }}
              onClick={() => onAlertClick && onAlertClick(alert)}
            >
              <span className="alert-item-icon">{icon}</span>
              <div className="alert-item-body">
                <span className="alert-item-type">{alert.alert_type}</span>
                <span className="alert-item-time">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                  {alert.segment_id && ` · ${alert.segment_id}`}
                </span>
              </div>
              <div className="alert-item-severity" style={{ color }}>
                {alert.severity}
              </div>
            </div>
          );
        })}
        {alerts.length > 8 && (
          <div className="alerts-more">+{alerts.length - 8} more alerts</div>
        )}
      </div>
    </div>
  );
}
