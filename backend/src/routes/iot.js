/**
 * IoT Routes
 * POST /api/iot/telemetry  - Receive LoRaWAN payload data
 * POST /api/iot/control    - Remote management commands
 * GET  /api/iot/telemetry/:asset_id - Fetch historical telemetry
 */
const express       = require('express');
const { body }      = require('express-validator');
const pool          = require('../db/pool');
const { validateRequest } = require('../middleware/errorHandler');
const { broadcastTelemetry } = require('../websocket/wsServer');

const router = express.Router();

// ─── POST /api/iot/telemetry ─────────────────────────────────────────────────
// Receive payload data from LoRaWAN gateways
router.post('/telemetry', [
  body('asset_id').notEmpty().trim(),
  body('voltage_reading').optional().isFloat({ min: 0, max: 400 }),
  body('current_monitoring').optional().isFloat({ min: 0 }),
  body('energy_consumption').optional().isFloat({ min: 0 }),
  body('operational_status').optional()
    .isIn(['online','offline','fault','maintenance','dimmed']),
  body('battery_level').optional().isFloat({ min: 0, max: 100 }),
  body('solar_irradiance').optional().isFloat({ min: 0 }),
  body('temperature_c').optional().isFloat({ min: -50, max: 100 }),
], validateRequest, async (req, res, next) => {
  try {
    const {
      asset_id,
      voltage_reading,
      current_monitoring,
      energy_consumption,
      operational_status = 'online',
      battery_level,
      solar_irradiance,
      temperature_c,
    } = req.body;

    // Verify asset exists
    const { rows: asset } = await pool.query(
      'SELECT asset_id FROM poles_assets WHERE asset_id = $1', [asset_id]
    );
    if (asset.length === 0) {
      return res.status(404).json({ success: false, error: `Asset ${asset_id} not found` });
    }

    const { rows } = await pool.query(`
      INSERT INTO iot_telemetry
        (asset_id, voltage_reading, current_monitoring, energy_consumption,
         operational_status, battery_level, solar_irradiance, temperature_c)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [asset_id, voltage_reading, current_monitoring, energy_consumption,
        operational_status, battery_level, solar_irradiance, temperature_c]);

    const telemetryRecord = rows[0];

    // Broadcast to connected WebSocket clients
    broadcastTelemetry({
      asset_id,
      voltage_reading:    telemetryRecord.voltage_reading,
      current_monitoring: telemetryRecord.current_monitoring,
      energy_consumption: telemetryRecord.energy_consumption,
      operational_status: telemetryRecord.operational_status,
      battery_level:      telemetryRecord.battery_level,
      recorded_at:        telemetryRecord.recorded_at,
    });

    res.status(201).json({ success: true, data: telemetryRecord });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/iot/control ───────────────────────────────────────────────────
// Remote management: group/individual control, mode adjustment (dimming)
router.post('/control', [
  body('command').notEmpty()
    .isIn(['dim','full_on','off','schedule','reboot','group_control','mode_adjustment']),
  body('asset_id').optional().trim(),
  body('group_id').optional().trim(),
  body('parameters').optional().isObject(),
  body('issued_by').optional().trim(),
], validateRequest, async (req, res, next) => {
  try {
    const { command, asset_id, group_id, parameters, issued_by } = req.body;

    if (!asset_id && !group_id) {
      return res.status(400).json({
        success: false,
        error: 'Either asset_id (individual) or group_id (group) must be provided',
      });
    }

    // Validate dim level for dimming commands
    if (command === 'dim' || command === 'mode_adjustment') {
      const dimLevel = parameters?.dim_level;
      if (dimLevel !== undefined && (dimLevel < 0 || dimLevel > 100)) {
        return res.status(400).json({
          success: false,
          error: 'dim_level must be between 0 and 100',
        });
      }
    }

    // If individual, verify asset exists
    if (asset_id) {
      const { rows } = await pool.query(
        'SELECT asset_id FROM poles_assets WHERE asset_id = $1', [asset_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: `Asset ${asset_id} not found` });
      }
    }

    const { rows } = await pool.query(`
      INSERT INTO iot_control_log (asset_id, group_id, command, parameters, issued_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [asset_id || null, group_id || null, command, JSON.stringify(parameters || {}), issued_by || null]);

    res.status(201).json({
      success: true,
      message: `Control command "${command}" issued for ${asset_id ? `asset ${asset_id}` : `group ${group_id}`}`,
      data:    rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/iot/telemetry/:asset_id ────────────────────────────────────────
// Historical telemetry with optional time range
router.get('/telemetry/:asset_id', async (req, res, next) => {
  try {
    const { asset_id } = req.params;
    const { from, to, limit = 100 } = req.query;

    const params = [asset_id, parseInt(limit)];
    let timeFilter = '';

    if (from) {
      params.push(from);
      timeFilter += ` AND recorded_at >= $${params.length}`;
    }
    if (to) {
      params.push(to);
      timeFilter += ` AND recorded_at <= $${params.length}`;
    }

    const { rows } = await pool.query(`
      SELECT
        id, asset_id,
        voltage_reading, current_monitoring, energy_consumption,
        operational_status, battery_level, solar_irradiance, temperature_c,
        recorded_at
      FROM iot_telemetry
      WHERE asset_id = $1 ${timeFilter}
      ORDER BY recorded_at DESC
      LIMIT $2
    `, params);

    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
