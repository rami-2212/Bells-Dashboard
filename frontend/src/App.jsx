import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import MapView from './components/MapView';
import PolesSidebar from './components/PolesSidebar';
import IncidentModal from './components/IncidentModal';
import AlertsPanel from './components/AlertsPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './services/api';
import './styles/App.css';

export default function App() {
  const [roadSegments, setRoadSegments]   = useState(null);
  const [polesAssets,  setPolesAssets]    = useState(null);
  const [activeAlerts, setActiveAlerts]   = useState([]);
  const [selectedPole, setSelectedPole]   = useState(null);
  const [selectedAlert,setSelectedAlert]  = useState(null);
  const [flashAlertId, setFlashAlertId]   = useState(null);
  const [loading,      setLoading]        = useState(true);
  const [error,        setError]          = useState(null);
  const flashTimerRef = useRef(null);

  // ─── WebSocket: real-time alerts & telemetry ───────────────────────────────
  const handleAlert = useCallback((alert) => {
    setActiveAlerts(prev => {
      // Avoid duplicates
      const exists = prev.some(a => a.alert_id === alert.alert_id);
      if (exists) return prev;
      return [alert, ...prev];
    });

    // Flash the alert on the map
    setFlashAlertId(alert.alert_id);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashAlertId(null), 6000);

    // Auto-open incident modal for critical/high severity
    if (alert.severity === 'critical' || alert.severity === 'high') {
      setSelectedAlert(alert);
    }
  }, []);

  const handleTelemetry = useCallback((data) => {
    // Update the live telemetry in the poles layer
    setPolesAssets(prev => {
      if (!prev?.features) return prev;
      return {
        ...prev,
        features: prev.features.map(f => {
          if (f.properties.asset_id === data.asset_id) {
            return {
              ...f,
              properties: {
                ...f.properties,
                telemetry: {
                  ...f.properties.telemetry,
                  ...data,
                },
              },
            };
          }
          return f;
        }),
      };
    });
  }, []);

  const { connected } = useWebSocket({ onAlert: handleAlert, onTelemetry: handleTelemetry });

  // ─── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getRoadSegments(),
      api.getPolesAssets(),
      api.getAlerts('?acknowledged=false&limit=50'),
    ])
      .then(([roads, poles, alerts]) => {
        setRoadSegments(roads);
        setPolesAssets(poles);
        setActiveAlerts(alerts.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handlePoleClick = useCallback((poleProps) => {
    setSelectedPole(poleProps);
  }, []);

  const handleAlertClick = useCallback((alert) => {
    setSelectedAlert(alert);
  }, []);

  const handleStatusChanged = useCallback((assetId, newStatus) => {
    // Update the pole in the layers without a full reload
    setPolesAssets(prev => {
      if (!prev?.features) return prev;
      return {
        ...prev,
        features: prev.features.map(f => {
          if (f.properties.asset_id === assetId) {
            return {
              ...f,
              properties: { ...f.properties, dpmbm_status: newStatus },
            };
          }
          return f;
        }),
      };
    });
    // Update selected pole sidebar
    setSelectedPole(prev => {
      if (prev?.asset_id === assetId) {
        return { ...prev, dpmbm_status: newStatus };
      }
      return prev;
    });
  }, []);

  return (
    <div className="app-layout">
      <Header
        connected={connected}
        alertCount={activeAlerts.length}
        polesCount={polesAssets?.totalFeatures ?? 0}
        segmentsCount={roadSegments?.totalFeatures ?? 0}
      />

      <div className="main-content">
        {/* Map area */}
        <div className="map-area">
          {loading && (
            <div className="map-loading">
              <div className="loading-spinner" />
              <span>Loading GIS data…</span>
            </div>
          )}
          {error && (
            <div className="map-error">
              ⚠ Failed to load data: {error}
              <br /><small>Ensure the backend API is running on port 3001</small>
            </div>
          )}
          <MapView
            roadSegments={roadSegments}
            polesAssets={polesAssets}
            activeAlerts={activeAlerts}
            onPoleClick={handlePoleClick}
            onAlertClick={handleAlertClick}
            flashAlertId={flashAlertId}
          />

          {/* Live alerts overlay panel */}
          {activeAlerts.length > 0 && (
            <AlertsPanel
              alerts={activeAlerts}
              onAlertClick={handleAlertClick}
            />
          )}
        </div>

        {/* Poles sidebar */}
        {selectedPole && (
          <PolesSidebar
            selectedPole={selectedPole}
            onClose={() => setSelectedPole(null)}
            onStatusChanged={handleStatusChanged}
          />
        )}
      </div>

      {/* Incident SOP modal */}
      {selectedAlert && (
        <IncidentModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
}
