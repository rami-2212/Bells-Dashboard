import React, { useState } from 'react';
import { api } from '../services/api';
import './IncidentModal.css';

const ALERT_TYPE_CONFIG = {
  'Vehicle':                  { icon: '🚗', color: '#f97316', sop: 'Assess traffic flow impact; deploy traffic management.' },
  'Pedestrian':               { icon: '🚶', color: '#3b82f6', sop: 'Monitor pedestrian safety; notify municipal services if needed.' },
  'Animal':                   { icon: '🦌', color: '#22c55e', sop: 'Alert motorists; notify wildlife/farm authorities.' },
  'Stopped Vehicle Detection':{ icon: '🚧', color: '#eab308', sop: 'Deploy tow service; assess breakdown hazard; set warning lights.' },
  'Debris on Roadway':        { icon: '⚠️', color: '#ef4444', sop: 'Immediate road closure assessment; dispatch road maintenance.' },
  'Illegal Off-ramping':      { icon: '🚫', color: '#ef4444', sop: 'Alert law enforcement immediately; monitor suspect vehicle.' },
};

const DISPATCH_SERVICES = [
  { id: 'SAPS',      label: 'SAPS',      icon: '👮', color: '#3b82f6', desc: 'South African Police Service' },
  { id: 'Fire',      label: 'Fire',      icon: '🚒', color: '#ef4444', desc: 'Fire & Rescue Services' },
  { id: 'Ambulance', label: 'Ambulance', icon: '🚑', color: '#22c55e', desc: 'Emergency Medical Services' },
];

export default function IncidentModal({ alert, onClose }) {
  const [dispatching, setDispatching] = useState({});
  const [dispatched,  setDispatched]  = useState([]);
  const [acknowledging, setAcknowledging] = useState(false);
  const [acknowledged,  setAcknowledged]  = useState(false);

  if (!alert) return null;

  const config = ALERT_TYPE_CONFIG[alert.alert_type] || {
    icon: '⚠️', color: '#ef4444', sop: 'Assess situation and respond appropriately.'
  };

  const handleDispatch = async (serviceId) => {
    setDispatching(prev => ({ ...prev, [serviceId]: true }));
    try {
      await api.dispatchService(alert.alert_id, {
        service:       serviceId,
        dispatched_by: 'dashboard-operator',
      });
      setDispatched(prev => [...prev, serviceId]);
    } catch (err) {
      alert(`Dispatch failed: ${err.message}`);
    } finally {
      setDispatching(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await api.acknowledgeAlert(alert.alert_id, { acknowledged_by: 'dashboard-operator' });
      setAcknowledged(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      // silent
    } finally {
      setAcknowledging(false);
    }
  };

  const severityLabel = alert.severity || 'medium';
  const timeStr = new Date(alert.timestamp).toLocaleString();

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="incident-modal" style={{ '--alert-accent': config.color }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="alert-type-icon">{config.icon}</span>
            <div>
              <h2 className="modal-title">Incident SOP</h2>
              <div className="modal-alert-type" style={{ color: config.color }}>
                {alert.alert_type}
              </div>
            </div>
          </div>
          <div className="modal-header-right">
            <div className={`severity-badge severity-${severityLabel}`}>
              {severityLabel.toUpperCase()}
            </div>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Alert Details */}
        <div className="alert-details">
          <div className="detail-row">
            <span className="detail-key">Alert ID</span>
            <span className="detail-val mono">{alert.alert_id?.slice(0, 18)}…</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Segment</span>
            <span className="detail-val">{alert.segment_id || 'Unknown'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">Coordinates</span>
            <span className="detail-val mono">
              {parseFloat(alert.latitude).toFixed(5)}, {parseFloat(alert.longitude).toFixed(5)}
            </span>
          </div>
          {alert.camera_id && (
            <div className="detail-row">
              <span className="detail-key">Camera</span>
              <span className="detail-val">{alert.camera_id}</span>
            </div>
          )}
          {alert.confidence && (
            <div className="detail-row">
              <span className="detail-key">Confidence</span>
              <span className="detail-val">{(parseFloat(alert.confidence) * 100).toFixed(1)}%</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-key">Time</span>
            <span className="detail-val">{timeStr}</span>
          </div>
        </div>

        {/* SOP Instructions */}
        <div className="sop-section">
          <div className="sop-label">📋 Standard Operating Procedure</div>
          <p className="sop-text">{config.sop}</p>
        </div>

        {/* Dispatch Services */}
        <div className="dispatch-section">
          <div className="dispatch-label">Dispatch Emergency Services</div>
          <div className="dispatch-grid">
            {DISPATCH_SERVICES.map(({ id, label, icon, color, desc }) => {
              const isDispatched  = dispatched.includes(id);
              const isDispatching = dispatching[id];
              return (
                <button
                  key={id}
                  className={`dispatch-btn ${isDispatched ? 'dispatched' : ''}`}
                  style={{
                    '--svc-color': color,
                    borderColor: isDispatched ? color : undefined,
                  }}
                  onClick={() => !isDispatched && handleDispatch(id)}
                  disabled={isDispatching || isDispatched}
                >
                  <span className="dispatch-icon">{icon}</span>
                  <div className="dispatch-info">
                    <span className="dispatch-name" style={{ color: isDispatched ? color : undefined }}>
                      {isDispatching ? 'Dispatching…' : isDispatched ? `${label} ✓` : label}
                    </span>
                    <span className="dispatch-desc">{desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="modal-actions">
          {acknowledged ? (
            <div className="acknowledged-msg">✅ Alert Acknowledged</div>
          ) : (
            <button
              className="btn btn-success ack-btn"
              onClick={handleAcknowledge}
              disabled={acknowledging}
            >
              {acknowledging ? 'Acknowledging…' : '✓ Acknowledge Alert'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
