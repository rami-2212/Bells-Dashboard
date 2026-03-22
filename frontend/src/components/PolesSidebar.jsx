import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';
import './PolesSidebar.css';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
);

const DPMBM_COLORS = {
  Design:   '#9ca3af',
  Plan:     '#3b82f6',
  Manage:   '#eab308',
  Build:    '#f97316',
  Maintain: '#22c55e',
};

const NEXT_STATUS = {
  Design:   'Plan',
  Plan:     'Manage',
  Manage:   'Build',
  Build:    'Maintain',
  Maintain: 'Manage',
};

const STATUS_ICONS = {
  Design:   '📐',
  Plan:     '📋',
  Manage:   '🔧',
  Build:    '🏗️',
  Maintain: '✅',
};

const OP_STATUS_COLORS = {
  online:      '#22c55e',
  offline:     '#ef4444',
  fault:       '#ef4444',
  maintenance: '#eab308',
  dimmed:      '#3b82f6',
};

function chartOptions(label) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: label,
        color: '#8b949e',
        font: { size: 11 },
      },
      tooltip: {
        backgroundColor: '#1c2333',
        borderColor: '#30363d',
        borderWidth: 1,
        titleColor: '#e6edf3',
        bodyColor: '#8b949e',
      },
    },
    scales: {
      x: {
        ticks: { color: '#6e7681', font: { size: 9 }, maxTicksLimit: 6 },
        grid:  { color: 'rgba(48,54,61,0.5)' },
      },
      y: {
        ticks: { color: '#6e7681', font: { size: 9 } },
        grid:  { color: 'rgba(48,54,61,0.5)' },
      },
    },
  };
}

export default function PolesSidebar({ selectedPole, onClose, onStatusChanged }) {
  const [telemetry,    setTelemetry]    = useState([]);
  const [transitioning, setTransitioning] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);

  useEffect(() => {
    if (!selectedPole?.asset_id) return;
    setLoading(true);
    setError(null);

    api.getTelemetry(selectedPole.asset_id, '?limit=24')
      .then(res => setTelemetry(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedPole?.asset_id]);

  if (!selectedPole) return null;

  const {
    asset_id, segment_id, dpmbm_status,
    luminaire_type, foundation_code, scenario_code,
    pole_height_m, telemetry: latestTelemetry,
  } = selectedPole;

  // Prepare chart data (reverse: oldest first)
  const chartData = [...telemetry].reverse();
  const timeLabels = chartData.map(t =>
    new Date(t.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const energyChartData = {
    labels: timeLabels,
    datasets: [{
      label:           'Energy (kWh)',
      data:            chartData.map(t => parseFloat(t.energy_consumption) || 0),
      borderColor:     '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.12)',
      fill:            true,
      tension:         0.4,
      pointRadius:     2,
    }],
  };

  const voltageChartData = {
    labels: timeLabels,
    datasets: [{
      label:           'Voltage (V)',
      data:            chartData.map(t => parseFloat(t.voltage_reading) || 0),
      borderColor:     '#58a6ff',
      backgroundColor: 'rgba(88,166,255,0.12)',
      fill:            true,
      tension:         0.4,
      pointRadius:     2,
    }],
  };

  const handleTransition = async () => {
    const nextStatus = NEXT_STATUS[dpmbm_status];
    if (!nextStatus) return;
    setTransitioning(true);
    try {
      await api.transitionStatus(asset_id, {
        status:           nextStatus,
        transitioned_by: 'dashboard-user',
      });
      onStatusChanged && onStatusChanged(asset_id, nextStatus);
    } catch (err) {
      alert(`Transition failed: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  const statusColor = DPMBM_COLORS[dpmbm_status] || '#9ca3af';
  const nextStatus  = NEXT_STATUS[dpmbm_status];

  return (
    <aside className="poles-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="asset-icon">💡</span>
          <div>
            <h2>{asset_id}</h2>
            <span className="segment-badge">Segment: {segment_id}</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose} title="Close">✕</button>
      </div>

      {/* DPMBM Status */}
      <div className="dpmbm-section">
        <div className="section-label">DPMBM Status</div>
        <div className="dpmbm-status-display">
          <div className="dpmbm-badge" style={{ background: `${statusColor}22`, border: `1px solid ${statusColor}55`, color: statusColor }}>
            <span>{STATUS_ICONS[dpmbm_status]}</span>
            <span>{dpmbm_status}</span>
          </div>
          <div className="dpmbm-flow">
            {['Design','Plan','Manage','Build','Maintain'].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`flow-step ${s === dpmbm_status ? 'active' : ''}`}
                  style={{ '--step-color': DPMBM_COLORS[s] }}
                >
                  {s}
                </div>
                {i < 4 && <span className="flow-arrow">→</span>}
              </React.Fragment>
            ))}
          </div>
          {nextStatus && (
            <button
              className="transition-btn"
              onClick={handleTransition}
              disabled={transitioning}
              style={{ borderColor: DPMBM_COLORS[nextStatus], color: DPMBM_COLORS[nextStatus] }}
            >
              {transitioning ? 'Updating…' : `→ Move to ${nextStatus}`}
            </button>
          )}
        </div>
      </div>

      {/* Pole Specifications */}
      <div className="spec-section">
        <div className="section-label">Lighting Specifications</div>
        <div className="spec-grid">
          <div className="spec-item">
            <span className="spec-key">Scenario</span>
            <span className="spec-val spec-highlight">{scenario_code}</span>
          </div>
          <div className="spec-item">
            <span className="spec-key">Luminaire</span>
            <span className="spec-val">{luminaire_type}</span>
          </div>
          <div className="spec-item">
            <span className="spec-key">Foundation</span>
            <span className="spec-val">{foundation_code}</span>
          </div>
          <div className="spec-item">
            <span className="spec-key">Pole Height</span>
            <span className="spec-val">{pole_height_m}m</span>
          </div>
        </div>
      </div>

      {/* Latest Telemetry */}
      {latestTelemetry && (
        <div className="telemetry-live-section">
          <div className="section-label">
            Live Telemetry
            <span
              className="op-status-badge"
              style={{ color: OP_STATUS_COLORS[latestTelemetry.operational_status] }}
            >
              ● {latestTelemetry.operational_status}
            </span>
          </div>
          <div className="telemetry-grid">
            <div className="tel-metric">
              <span className="tel-val">{latestTelemetry.voltage_reading?.toFixed(1) ?? '—'}V</span>
              <span className="tel-key">Voltage</span>
            </div>
            <div className="tel-metric">
              <span className="tel-val">{latestTelemetry.current_monitoring?.toFixed(3) ?? '—'}A</span>
              <span className="tel-key">Current</span>
            </div>
            <div className="tel-metric">
              <span className="tel-val">{latestTelemetry.energy_consumption?.toFixed(4) ?? '—'}</span>
              <span className="tel-key">Energy (kWh)</span>
            </div>
            <div className="tel-metric">
              <span className="tel-val">{latestTelemetry.battery_level?.toFixed(1) ?? '—'}%</span>
              <span className="tel-key">Battery</span>
            </div>
            {latestTelemetry.solar_irradiance != null && (
              <div className="tel-metric">
                <span className="tel-val">{latestTelemetry.solar_irradiance?.toFixed(0)} W/m²</span>
                <span className="tel-key">Solar</span>
              </div>
            )}
            {latestTelemetry.temperature_c != null && (
              <div className="tel-metric">
                <span className="tel-val">{latestTelemetry.temperature_c?.toFixed(1)}°C</span>
                <span className="tel-key">Temp</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* IoT Charts */}
      <div className="charts-section">
        <div className="section-label">IoT History (Last 24 readings)</div>
        {loading && <div className="loading-text">Loading telemetry…</div>}
        {error   && <div className="error-text">Failed: {error}</div>}
        {!loading && telemetry.length > 0 && (
          <>
            <div className="chart-wrapper">
              <Line data={energyChartData} options={chartOptions('Energy Consumption (kWh)')} />
            </div>
            <div className="chart-wrapper">
              <Line data={voltageChartData} options={chartOptions('Voltage (V)')} />
            </div>
          </>
        )}
        {!loading && telemetry.length === 0 && !error && (
          <div className="no-data">No telemetry history available</div>
        )}
      </div>
    </aside>
  );
}
