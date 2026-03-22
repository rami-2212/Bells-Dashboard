const BASE_URL = process.env.REACT_APP_API_URL || 'https://bells-dashboard.onrender.com';

async function fetchJSON(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // WFS - GeoJSON layers
  getRoadSegments:  (params = '') => fetchJSON(`/api/wfs/road-segments${params}`),
  getPolesAssets:   (params = '') => fetchJSON(`/api/wfs/poles-assets${params}`),

  // Poles CRUD
  getPoles:         (qs = '')      => fetchJSON(`/api/poles${qs}`),
  getPole:          (id)           => fetchJSON(`/api/poles/${id}`),
  createPole:       (data)         => fetchJSON('/api/poles', { method: 'POST', body: JSON.stringify(data) }),
  updatePole:       (id, data)     => fetchJSON(`/api/poles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  transitionStatus: (id, data)     => fetchJSON(`/api/poles/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePole:       (id)           => fetchJSON(`/api/poles/${id}`, { method: 'DELETE' }),

  // IoT
  getTelemetry:     (assetId, qs='') => fetchJSON(`/api/iot/telemetry/${assetId}${qs}`),
  postTelemetry:    (data)           => fetchJSON('/api/iot/telemetry', { method: 'POST', body: JSON.stringify(data) }),
  postControl:      (data)           => fetchJSON('/api/iot/control', { method: 'POST', body: JSON.stringify(data) }),

  // Alerts
  getAlerts:        (qs = '')      => fetchJSON(`/api/ai/alerts${qs}`),
  postAlert:        (data)         => fetchJSON('/api/ai/alerts', { method: 'POST', body: JSON.stringify(data) }),
  acknowledgeAlert: (id, data)     => fetchJSON(`/api/ai/alerts/${id}/acknowledge`, { method: 'PATCH', body: JSON.stringify(data) }),
  dispatchService:  (id, data)     => fetchJSON(`/api/ai/alerts/${id}/dispatch`, { method: 'PATCH', body: JSON.stringify(data) }),
};
