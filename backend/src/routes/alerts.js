/**
 * AI Alerts Webhook Routes
 * POST /api/ai/alerts     - Receive Edge-AI processing triggers
 * GET  /api/ai/alerts     - Fetch alerts with filtering
 * PATCH /api/ai/alerts/:alert_id/acknowledge
 * PATCH /api/ai/alerts/:alert_id/dispatch
 */
const express  = require('express');
const { body } = require('express-validator');
const pool     = require('../db/pool');
const { validateRequest }  = require('../middleware/errorHandler');
const { broadcastAlert }   = require('../websocket/wsServer');

const router = express.Router();

const VALID_ALERT_TYPES = [
  'Vehicle',
  'Pedestrian',
  'Animal',
  'Stopped Vehicle Detection',
  'Debris on Roadway',
  'Illegal Off-ramping',
];

const DISPATCH_SERVICES = ['SAPS', 'Fire', 'Ambulance'];

// ─── POST /api/ai/alerts ─────────────────────────────────────────────────────
// Webhook endpoint for Edge-AI processing triggers
router.post('/', [
  body('alert_type')
    .notEmpty()
    .isIn(VALID_ALERT_TYPES)
    .withMessage(`alert_type must be one of: ${VALID_ALERT_TYPES.join(', ')}`),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('segment_id').optional().trim(),
  body('camera_id').optional().trim(),
  body('confidence').optional().isFloat({ min: 0, max: 1 }),
  body('severity').optional().isIn(['low','medium','high','critical']),
], validateRequest, async (req, res, next) => {
  try {
    const {
      alert_type,
      latitude,
      longitude,
      segment_id,
      camera_id,
      confidence,
      severity = 'medium',
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO ai_alerts
        (alert_type, coordinates, segment_id, camera_id, confidence, severity)
      VALUES
        ($1, ST_SetSRID(ST_MakePoint($3, $2), 4326), $4, $5, $6, $7)
      RETURNING
        alert_id, alert_type, severity, camera_id, confidence, timestamp,
        ST_Y(coordinates) AS latitude,
        ST_X(coordinates) AS longitude,
        segment_id
    `, [alert_type, latitude, longitude, segment_id || null,
        camera_id || null, confidence || null, severity]);

    const alert = rows[0];

    // Broadcast to all connected WebSocket clients (real-time map flash)
    broadcastAlert({
      alert_id:   alert.alert_id,
      alert_type: alert.alert_type,
      severity:   alert.severity,
      latitude:   parseFloat(alert.latitude),
      longitude:  parseFloat(alert.longitude),
      segment_id: alert.segment_id,
      camera_id:  alert.camera_id,
      confidence: alert.confidence ? parseFloat(alert.confidence) : null,
      timestamp:  alert.timestamp,
    });

    res.status(201).json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/ai/alerts ──────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      alert_type, segment_id, severity, acknowledged,
      from, to, limit = 50, page = 1,
    } = req.query;

    const params = [];
    let whereClause = 'WHERE 1=1';

    if (alert_type) {
      params.push(alert_type);
      whereClause += ` AND alert_type = $${params.length}`;
    }
    if (segment_id) {
      params.push(segment_id);
      whereClause += ` AND segment_id = $${params.length}`;
    }
    if (severity) {
      params.push(severity);
      whereClause += ` AND severity = $${params.length}`;
    }
    if (acknowledged !== undefined) {
      params.push(acknowledged === 'true');
      whereClause += ` AND acknowledged = $${params.length}`;
    }
    if (from) {
      params.push(from);
      whereClause += ` AND timestamp >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      whereClause += ` AND timestamp <= $${params.length}`;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(`
      SELECT
        alert_id, alert_type, severity, camera_id, confidence,
        acknowledged, acknowledged_by, acknowledged_at,
        dispatched, timestamp,
        ST_Y(coordinates) AS latitude,
        ST_X(coordinates) AS longitude,
        segment_id
      FROM ai_alerts
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/ai/alerts/:alert_id/acknowledge ──────────────────────────────
router.patch('/:alert_id/acknowledge', [
  body('acknowledged_by').optional().trim(),
], validateRequest, async (req, res, next) => {
  try {
    const { alert_id } = req.params;
    const { acknowledged_by } = req.body;

    const { rows } = await pool.query(`
      UPDATE ai_alerts
      SET acknowledged = true, acknowledged_by = $2, acknowledged_at = NOW()
      WHERE alert_id = $1
      RETURNING alert_id, alert_type, acknowledged, acknowledged_by, acknowledged_at
    `, [alert_id, acknowledged_by || null]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/ai/alerts/:alert_id/dispatch ─────────────────────────────────
// SOP: Dispatch SAPS / Fire / Ambulance
router.patch('/:alert_id/dispatch', [
  body('service').isIn(DISPATCH_SERVICES)
    .withMessage(`service must be one of: ${DISPATCH_SERVICES.join(', ')}`),
  body('dispatched_by').optional().trim(),
], validateRequest, async (req, res, next) => {
  try {
    const { alert_id } = req.params;
    const { service, dispatched_by } = req.body;

    const dispatchEntry = {
      service,
      dispatched_by: dispatched_by || 'operator',
      time: new Date().toISOString(),
    };

    const { rows } = await pool.query(`
      UPDATE ai_alerts
      SET dispatched = dispatched || $2::jsonb
      WHERE alert_id = $1
      RETURNING alert_id, alert_type, dispatched
    `, [alert_id, JSON.stringify([dispatchEntry])]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.json({
      success: true,
      message: `${service} dispatched for alert ${alert_id}`,
      data:    rows[0],
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
