/**
 * OGC-Compliant Web Feature Service (WFS) Routes
 * Serves Road_Segments as LineStrings and Poles_Assets as Points
 * in GeoJSON format (FeatureCollection)
 */
const express = require('express');
const pool    = require('../db/pool');

const router = express.Router();

// ─── GET /api/wfs/road-segments ─────────────────────────────────────────────
// Returns all road segments as GeoJSON FeatureCollection (polylines)
router.get('/road-segments', async (req, res, next) => {
  try {
    const { bbox, road_class } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (road_class) {
      params.push(road_class);
      whereClause += ` AND road_class = $${params.length}`;
    }

    // Optional BBOX filter: minLon,minLat,maxLon,maxLat
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      if ([minLon, minLat, maxLon, maxLat].some(isNaN)) {
        return res.status(400).json({ error: 'Invalid bbox format. Use: minLon,minLat,maxLon,maxLat' });
      }
      params.push(minLon, minLat, maxLon, maxLat);
      whereClause += ` AND ST_Intersects(geom, ST_MakeEnvelope($${params.length-3},$${params.length-2},$${params.length-1},$${params.length}, 4326))`;
    }

    const { rows } = await pool.query(`
      SELECT
        segment_id,
        segment_name,
        length_km,
        start_lat,
        start_lon,
        end_lat,
        end_lon,
        road_class,
        ST_AsGeoJSON(geom)::json AS geometry
      FROM road_segments
      ${whereClause}
      ORDER BY segment_id
    `, params);

    const featureCollection = {
      type: 'FeatureCollection',
      name: 'Road_Segments',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      totalFeatures: rows.length,
      features: rows.map(row => ({
        type: 'Feature',
        id:   `road_segments.${row.segment_id}`,
        properties: {
          segment_id:   row.segment_id,
          segment_name: row.segment_name,
          length_km:    parseFloat(row.length_km),
          start_lat:    parseFloat(row.start_lat),
          start_lon:    parseFloat(row.start_lon),
          end_lat:      parseFloat(row.end_lat),
          end_lon:      parseFloat(row.end_lon),
          road_class:   row.road_class,
        },
        geometry: row.geometry,
      })),
    };

    res.set('Content-Type', 'application/geo+json');
    res.json(featureCollection);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/wfs/poles-assets ───────────────────────────────────────────────
// Returns all poles as GeoJSON FeatureCollection (points) with optional filters
router.get('/poles-assets', async (req, res, next) => {
  try {
    const { segment_id, dpmbm_status, scenario_code, bbox } = req.query;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (segment_id) {
      params.push(segment_id);
      whereClause += ` AND p.segment_id = $${params.length}`;
    }
    if (dpmbm_status) {
      params.push(dpmbm_status);
      whereClause += ` AND p.dpmbm_status = $${params.length}`;
    }
    if (scenario_code) {
      params.push(scenario_code);
      whereClause += ` AND p.scenario_code = $${params.length}`;
    }
    if (bbox) {
      const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
      if ([minLon, minLat, maxLon, maxLat].some(isNaN)) {
        return res.status(400).json({ error: 'Invalid bbox format.' });
      }
      params.push(minLon, minLat, maxLon, maxLat);
      whereClause += ` AND ST_Within(p.coordinates, ST_MakeEnvelope($${params.length-3},$${params.length-2},$${params.length-1},$${params.length}, 4326))`;
    }

    const { rows } = await pool.query(`
      SELECT
        p.asset_id,
        p.segment_id,
        p.pole_height_m,
        p.foundation_code,
        p.luminaire_type,
        p.scenario_code,
        p.dpmbm_status,
        p.installation_date,
        p.notes,
        ST_AsGeoJSON(p.coordinates)::json AS geometry,
        t.voltage_reading,
        t.current_monitoring,
        t.energy_consumption,
        t.operational_status,
        t.battery_level,
        t.solar_irradiance,
        t.temperature_c,
        t.recorded_at AS telemetry_at
      FROM poles_assets p
      LEFT JOIN LATERAL (
        SELECT *
        FROM iot_telemetry
        WHERE asset_id = p.asset_id
        ORDER BY recorded_at DESC
        LIMIT 1
      ) t ON true
      ${whereClause}
      ORDER BY p.asset_id
    `, params);

    const featureCollection = {
      type: 'FeatureCollection',
      name: 'Poles_Assets',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      totalFeatures: rows.length,
      features: rows.map(row => ({
        type: 'Feature',
        id:   `poles_assets.${row.asset_id}`,
        properties: {
          asset_id:          row.asset_id,
          segment_id:        row.segment_id,
          pole_height_m:     parseFloat(row.pole_height_m),
          foundation_code:   row.foundation_code,
          luminaire_type:    row.luminaire_type,
          scenario_code:     row.scenario_code,
          dpmbm_status:      row.dpmbm_status,
          installation_date: row.installation_date,
          notes:             row.notes,
          telemetry: row.voltage_reading !== null ? {
            voltage_reading:    parseFloat(row.voltage_reading),
            current_monitoring: parseFloat(row.current_monitoring),
            energy_consumption: parseFloat(row.energy_consumption),
            operational_status: row.operational_status,
            battery_level:      row.battery_level ? parseFloat(row.battery_level) : null,
            solar_irradiance:   row.solar_irradiance ? parseFloat(row.solar_irradiance) : null,
            temperature_c:      row.temperature_c ? parseFloat(row.temperature_c) : null,
            recorded_at:        row.telemetry_at,
          } : null,
        },
        geometry: row.geometry,
      })),
    };

    res.set('Content-Type', 'application/geo+json');
    res.json(featureCollection);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/wfs/capabilities ───────────────────────────────────────────────
// WFS GetCapabilities response
router.get('/capabilities', (req, res) => {
  res.json({
    service: {
      title:   'Smart Road GIS - Waterberg District WFS',
      version: '2.0.0',
      abstract: 'OGC Web Feature Service for Smart Road infrastructure - ~2500km, 90,000 poles, 3,300 CCTV',
    },
    featureTypes: [
      {
        name:        'Road_Segments',
        title:       'Road Segments',
        abstract:    'Rural (RS-01 to RS-32) and Urban (UIR-01 to UIR-06) road segments',
        keywords:    ['roads', 'infrastructure', 'Waterberg'],
        defaultCRS:  'urn:ogc:def:crs:OGC:1.3:CRS84',
        outputFormats: ['application/json', 'application/geo+json'],
        endpoint:    '/api/wfs/road-segments',
      },
      {
        name:        'Poles_Assets',
        title:       'Smart Solar Street Light Poles',
        abstract:    '90,000 solar street light poles with IoT telemetry',
        keywords:    ['poles', 'solar', 'street lights', 'IoT'],
        defaultCRS:  'urn:ogc:def:crs:OGC:1.3:CRS84',
        outputFormats: ['application/json', 'application/geo+json'],
        endpoint:    '/api/wfs/poles-assets',
      },
    ],
  });
});

module.exports = router;
