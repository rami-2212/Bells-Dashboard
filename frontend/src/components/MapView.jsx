import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

// DPMBM status → color mapping
const DPMBM_COLORS = {
  Design:   '#9ca3af',
  Plan:     '#3b82f6',
  Manage:   '#eab308',
  Build:    '#f97316',
  Maintain: '#22c55e',
};

// Alert severity → color
const ALERT_COLORS = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
};

function createPoleIcon(dpmbmStatus) {
  const color = DPMBM_COLORS[dpmbmStatus] || '#9ca3af';
  return L.divIcon({
    className: '',
    html: `
      <div class="pole-marker" style="--pole-color: ${color};">
        <div class="pole-inner"></div>
      </div>
    `,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
}

function createAlertIcon(severity, isNew = false) {
  const color = ALERT_COLORS[severity] || '#ef4444';
  return L.divIcon({
    className: '',
    html: `
      <div class="alert-marker ${isNew ? 'alert-flash' : ''}" style="--alert-color: ${color};">
        <div class="alert-pulse-ring"></div>
        <div class="alert-inner">⚠</div>
      </div>
    `,
    iconSize:   [28, 28],
    iconAnchor: [14, 14],
  });
}

// Waterberg District bounds
const WATERBERG_CENTER  = [-24.18, 28.91];
const WATERBERG_ZOOM    = 8;

export default function MapView({
  roadSegments,
  polesAssets,
  activeAlerts,
  onPoleClick,
  onAlertClick,
  flashAlertId,
}) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const roadsLayerRef  = useRef(null);
  const polesLayerRef  = useRef(null);
  const alertsLayerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center:   WATERBERG_CENTER,
      zoom:     WATERBERG_ZOOM,
      zoomControl: true,
    });

    // Base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Waterberg boundary hint
    const waterbergBounds = L.latLngBounds(
      [-25.8, 26.8],
      [-23.0, 30.2]
    );
    L.rectangle(waterbergBounds, {
      color: '#58a6ff',
      weight: 1.5,
      fill: false,
      dashArray: '6 4',
      opacity: 0.4,
    }).addTo(map);

    // Layer groups
    roadsLayerRef.current  = L.layerGroup().addTo(map);
    polesLayerRef.current  = L.layerGroup().addTo(map);
    alertsLayerRef.current = L.layerGroup().addTo(map);

    // Layer control
    L.control.layers(null, {
      'Road Segments': roadsLayerRef.current,
      'Pole Assets':   polesLayerRef.current,
      'AI Alerts':     alertsLayerRef.current,
    }, { collapsed: false, position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;
  }, []);

  // Render road segments as polylines
  useEffect(() => {
    const layer = roadsLayerRef.current;
    if (!layer || !roadSegments?.features) return;

    layer.clearLayers();
    roadSegments.features.forEach((feature) => {
      if (!feature.geometry) return;
      const { segment_id, segment_name, length_km, road_class } = feature.properties;
      const color  = road_class === 'urban' ? '#f97316' : '#58a6ff';
      const weight = road_class === 'urban' ? 4 : 2.5;

      const coords = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      const line = L.polyline(coords, {
        color,
        weight,
        opacity: 0.75,
      });

      line.bindTooltip(
        `<div class="map-tooltip">
          <strong>${segment_id}</strong><br/>
          ${segment_name}<br/>
          <span>${length_km} km · ${road_class}</span>
        </div>`,
        { sticky: true, className: 'custom-tooltip' }
      );

      layer.addLayer(line);
    });
  }, [roadSegments]);

  // Render poles as colored markers
  useEffect(() => {
    const layer = polesLayerRef.current;
    if (!layer || !polesAssets?.features) return;

    layer.clearLayers();
    polesAssets.features.forEach((feature) => {
      if (!feature.geometry) return;
      const props = feature.properties;
      const [lon, lat] = feature.geometry.coordinates;

      const marker = L.marker([lat, lon], {
        icon: createPoleIcon(props.dpmbm_status),
      });

      marker.bindTooltip(
        `<div class="map-tooltip">
          <strong>${props.asset_id}</strong><br/>
          ${props.dpmbm_status} · ${props.luminaire_type}<br/>
          <span>${props.scenario_code} · ${props.pole_height_m}m pole</span>
        </div>`,
        { sticky: true, className: 'custom-tooltip' }
      );

      marker.on('click', () => onPoleClick && onPoleClick(props));
      layer.addLayer(marker);
    });
  }, [polesAssets, onPoleClick]);

  // Render AI alerts
  useEffect(() => {
    const layer = alertsLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    activeAlerts.forEach((alert) => {
      if (alert.latitude == null || alert.longitude == null) return;

      const isNew = alert.alert_id === flashAlertId;
      const marker = L.marker([alert.latitude, alert.longitude], {
        icon: createAlertIcon(alert.severity, isNew),
        zIndexOffset: 1000,
      });

      marker.bindTooltip(
        `<div class="map-tooltip alert-tooltip">
          <strong>⚠ ${alert.alert_type}</strong><br/>
          Severity: ${alert.severity || 'medium'}<br/>
          <span>${new Date(alert.timestamp).toLocaleTimeString()}</span>
        </div>`,
        { sticky: true, className: 'custom-tooltip' }
      );

      marker.on('click', () => onAlertClick && onAlertClick(alert));
      layer.addLayer(marker);
    });
  }, [activeAlerts, flashAlertId, onAlertClick]);

  // Flash map to new alert location
  const prevFlashRef = useRef(null);
  useEffect(() => {
    if (!flashAlertId || !mapInstanceRef.current) return;
    if (flashAlertId === prevFlashRef.current) return;
    prevFlashRef.current = flashAlertId;

    const alert = activeAlerts.find(a => a.alert_id === flashAlertId);
    if (!alert) return;

    mapInstanceRef.current.flyTo([alert.latitude, alert.longitude], 13, {
      animate: true,
      duration: 1.2,
    });
  }, [flashAlertId, activeAlerts]);

  return <div ref={mapRef} className="map-container" />;
}
