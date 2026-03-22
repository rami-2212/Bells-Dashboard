/**
 * Poles Assets CRUD Routes + DPMBM State Machine
 */
const express        = require('express');
const { body, param } = require('express-validator');
const pool           = require('../db/pool');
const { assertTransition } = require('../services/dpmbmStateMachine');
const { validateRequest }  = require('../middleware/errorHandler');

const router = express.Router();

// ─── GET /api/poles ──────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { segment_id, dpmbm_status, page = 1, limit = 100 } = req.query;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (segment_id) {
      params.push(segment_id);
      whereClause += ` AND segment_id = $${params.length}`;
    }
    if (dpmbm_status) {
      params.push(dpmbm_status);
      whereClause += ` AND dpmbm_status = $${params.length}`;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(`
      SELECT
        asset_id, segment_id,
        ST_Y(coordinates) AS latitude,
        ST_X(coordinates) AS longitude,
        pole_height_m, foundation_code, luminaire_type,
        scenario_code, dpmbm_status, installation_date, notes,
        created_at, updated_at
      FROM poles_assets
      ${whereClause}
      ORDER BY asset_id
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM poles_assets ${whereClause}`, countParams
    );

    res.json({
      success: true,
      total:   parseInt(countRows[0].count),
      page:    parseInt(page),
      limit:   parseInt(limit),
      data:    rows,
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/poles/:asset_id ────────────────────────────────────────────────
router.get('/:asset_id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.asset_id, p.segment_id,
        ST_Y(p.coordinates) AS latitude,
        ST_X(p.coordinates) AS longitude,
        p.pole_height_m, p.foundation_code, p.luminaire_type,
        p.scenario_code, p.dpmbm_status, p.installation_date, p.notes,
        p.created_at, p.updated_at,
        json_agg(
          json_build_object(
            'voltage_reading',    t.voltage_reading,
            'current_monitoring', t.current_monitoring,
            'energy_consumption', t.energy_consumption,
            'operational_status', t.operational_status,
            'battery_level',      t.battery_level,
            'solar_irradiance',   t.solar_irradiance,
            'temperature_c',      t.temperature_c,
            'recorded_at',        t.recorded_at
          ) ORDER BY t.recorded_at DESC
        ) FILTER (WHERE t.id IS NOT NULL) AS telemetry_history
      FROM poles_assets p
      LEFT JOIN iot_telemetry t ON t.asset_id = p.asset_id
      WHERE p.asset_id = $1
      GROUP BY p.id
    `, [req.params.asset_id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pole asset not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/poles ─────────────────────────────────────────────────────────
const poleValidation = [
  body('asset_id').notEmpty().trim(),
  body('segment_id').notEmpty().trim(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('pole_height_m').isIn([6, 8, 10, 11.5]).toFloat(),
  body('foundation_code').isIn(['FC6','FC7','FC8','FC9','FC10','FC11','FH150','FH175','FH200','FH225','FH250']),
  body('luminaire_type').isIn(['EDEN 80W','EDEN 90W','EDEN 100W','AURA 40W','AURA 50W','AURA 60W']),
  body('scenario_code').isIn(['SL2','SL4','SX2','ST4','P-URB','SS8','SS5','SL4S','PED-X','SS4','SS7','SS3']),
];

router.post('/', poleValidation, validateRequest, async (req, res, next) => {
  try {
    const {
      asset_id, segment_id, latitude, longitude,
      pole_height_m, foundation_code, luminaire_type,
      scenario_code, notes, installation_date,
    } = req.body;

    const { rows } = await pool.query(`
      INSERT INTO poles_assets
        (asset_id, segment_id, coordinates, pole_height_m,
         foundation_code, luminaire_type, scenario_code, notes, installation_date)
      VALUES
        ($1, $2, ST_SetSRID(ST_MakePoint($4, $3), 4326), $5, $6, $7, $8, $9, $10)
      RETURNING asset_id, segment_id, dpmbm_status, created_at
    `, [asset_id, segment_id, latitude, longitude,
        pole_height_m, foundation_code, luminaire_type,
        scenario_code, notes || null, installation_date || null]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/poles/:asset_id ────────────────────────────────────────────────
router.put('/:asset_id', [
  body('pole_height_m').optional().isIn([6, 8, 10, 11.5]).toFloat(),
  body('foundation_code').optional().isIn(['FC6','FC7','FC8','FC9','FC10','FC11','FH150','FH175','FH200','FH225','FH250']),
  body('luminaire_type').optional().isIn(['EDEN 80W','EDEN 90W','EDEN 100W','AURA 40W','AURA 50W','AURA 60W']),
  body('scenario_code').optional().isIn(['SL2','SL4','SX2','ST4','P-URB','SS8','SS5','SL4S','PED-X','SS4','SS7','SS3']),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
], validateRequest, async (req, res, next) => {
  try {
    const { asset_id } = req.params;
    const {
      latitude, longitude, pole_height_m, foundation_code,
      luminaire_type, scenario_code, notes, installation_date,
    } = req.body;

    // Build dynamic SET clause
    const setClauses = [];
    const params     = [asset_id];

    if (latitude !== undefined && longitude !== undefined) {
      params.push(longitude, latitude);
      setClauses.push(`coordinates = ST_SetSRID(ST_MakePoint($${params.length-1}, $${params.length}), 4326)`);
    }
    const simpleFields = { pole_height_m, foundation_code, luminaire_type, scenario_code, notes, installation_date };
    for (const [key, val] of Object.entries(simpleFields)) {
      if (val !== undefined) {
        params.push(val);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields provided for update' });
    }

    const { rows } = await pool.query(`
      UPDATE poles_assets
      SET ${setClauses.join(', ')}
      WHERE asset_id = $1
      RETURNING asset_id, segment_id, dpmbm_status, updated_at
    `, params);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pole asset not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/poles/:asset_id/status ──────────────────────────────────────
// DPMBM State Machine transition
router.patch('/:asset_id/status', [
  body('status').notEmpty().isIn(['Design','Plan','Manage','Build','Maintain']),
  body('transitioned_by').optional().trim(),
  body('notes').optional().trim(),
], validateRequest, async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { asset_id } = req.params;
    const { status: toStatus, transitioned_by, notes } = req.body;

    // Fetch current status
    const { rows } = await client.query(
      'SELECT asset_id, dpmbm_status FROM poles_assets WHERE asset_id = $1 FOR UPDATE',
      [asset_id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Pole asset not found' });
    }

    const fromStatus = rows[0].dpmbm_status;
    assertTransition(fromStatus, toStatus); // throws if invalid

    // Apply transition
    await client.query(
      'UPDATE poles_assets SET dpmbm_status = $1 WHERE asset_id = $2',
      [toStatus, asset_id]
    );

    // Audit log
    await client.query(`
      INSERT INTO dpmbm_transitions (asset_id, from_status, to_status, transitioned_by, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [asset_id, fromStatus, toStatus, transitioned_by || null, notes || null]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Transitioned from "${fromStatus}" → "${toStatus}"`,
      data:    { asset_id, from_status: fromStatus, to_status: toStatus },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message.includes('Invalid transition')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
});

// ─── DELETE /api/poles/:asset_id ─────────────────────────────────────────────
router.delete('/:asset_id', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM poles_assets WHERE asset_id = $1 RETURNING asset_id',
      [req.params.asset_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Pole asset not found' });
    }
    res.json({ success: true, message: `Deleted pole ${rows[0].asset_id}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
