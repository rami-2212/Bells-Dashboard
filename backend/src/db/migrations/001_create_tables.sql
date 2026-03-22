-- ============================================================
-- Smart Road Infrastructure GIS Database
-- Waterberg District, South Africa
-- Migration: 001 - Create Core Tables
-- ============================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: road_segments
-- Represents ~2,500 km of road infrastructure
-- RS-01 to RS-32: Rural segments
-- UIR-01 to UIR-06: Urban Intersection Roads
-- ============================================================
CREATE TABLE IF NOT EXISTS road_segments (
    id              SERIAL PRIMARY KEY,
    segment_id      VARCHAR(20) UNIQUE NOT NULL
                    CHECK (segment_id ~ '^(RS-0[1-9]|RS-[12][0-9]|RS-3[0-2]|UIR-0[1-6])$'),
    segment_name    VARCHAR(255) NOT NULL,
    length_km       NUMERIC(8, 3) NOT NULL CHECK (length_km > 0),
    start_lat       NUMERIC(10, 7) NOT NULL,
    start_lon       NUMERIC(10, 7) NOT NULL,
    end_lat         NUMERIC(10, 7) NOT NULL,
    end_lon         NUMERIC(10, 7) NOT NULL,
    geom            GEOMETRY(LINESTRING, 4326),
    road_class      VARCHAR(50) DEFAULT 'rural' CHECK (road_class IN ('rural', 'urban')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-populate geometry from coordinates
CREATE OR REPLACE FUNCTION update_road_segment_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(
        ST_MakeLine(
            ST_MakePoint(NEW.start_lon, NEW.start_lat),
            ST_MakePoint(NEW.end_lon, NEW.end_lat)
        ), 4326
    );
    NEW.road_class := CASE
        WHEN NEW.segment_id LIKE 'UIR-%' THEN 'urban'
        ELSE 'rural'
    END;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_road_segment_geom
BEFORE INSERT OR UPDATE ON road_segments
FOR EACH ROW EXECUTE FUNCTION update_road_segment_geom();

CREATE INDEX idx_road_segments_geom ON road_segments USING GIST(geom);
CREATE INDEX idx_road_segments_segment_id ON road_segments(segment_id);

-- ============================================================
-- TABLE: poles_assets
-- 90,000 smart solar street light poles
-- ============================================================
CREATE TABLE IF NOT EXISTS poles_assets (
    id              SERIAL PRIMARY KEY,
    asset_id        VARCHAR(50) UNIQUE NOT NULL,
    segment_id      VARCHAR(20) NOT NULL REFERENCES road_segments(segment_id) ON DELETE RESTRICT,
    coordinates     GEOMETRY(POINT, 4326) NOT NULL,
    latitude        NUMERIC(10, 7) GENERATED ALWAYS AS (ST_Y(coordinates)) STORED,
    longitude       NUMERIC(10, 7) GENERATED ALWAYS AS (ST_X(coordinates)) STORED,
    pole_height_m   NUMERIC(4, 1) NOT NULL
                    CHECK (pole_height_m IN (6.0, 8.0, 10.0, 11.5)),
    foundation_code VARCHAR(10) NOT NULL
                    CHECK (foundation_code IN ('FC6','FC7','FC8','FC9','FC10','FC11',
                                               'FH150','FH175','FH200','FH225','FH250')),
    luminaire_type  VARCHAR(20) NOT NULL
                    CHECK (luminaire_type IN ('EDEN 80W','EDEN 90W','EDEN 100W',
                                              'AURA 40W','AURA 50W','AURA 60W')),
    scenario_code   VARCHAR(10) NOT NULL
                    CHECK (scenario_code IN ('SL2','SL4','SX2','ST4','P-URB',
                                             'SS8','SS5','SL4S','PED-X','SS4','SS7','SS3')),
    dpmbm_status    VARCHAR(20) NOT NULL DEFAULT 'Design'
                    CHECK (dpmbm_status IN ('Design','Plan','Manage','Build','Maintain')),
    installation_date DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_poles_assets_coordinates ON poles_assets USING GIST(coordinates);
CREATE INDEX idx_poles_assets_segment_id  ON poles_assets(segment_id);
CREATE INDEX idx_poles_assets_dpmbm       ON poles_assets(dpmbm_status);
CREATE INDEX idx_poles_assets_asset_id    ON poles_assets(asset_id);

-- ============================================================
-- TABLE: dpmbm_transitions
-- Audit log for DPMBM state machine transitions
-- ============================================================
CREATE TABLE IF NOT EXISTS dpmbm_transitions (
    id              SERIAL PRIMARY KEY,
    asset_id        VARCHAR(50) NOT NULL REFERENCES poles_assets(asset_id),
    from_status     VARCHAR(20),
    to_status       VARCHAR(20) NOT NULL,
    transitioned_by VARCHAR(100),
    notes           TEXT,
    transitioned_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: iot_telemetry
-- Real-time IoT data from LoRaWAN gateways
-- ============================================================
CREATE TABLE IF NOT EXISTS iot_telemetry (
    id                  SERIAL PRIMARY KEY,
    asset_id            VARCHAR(50) NOT NULL REFERENCES poles_assets(asset_id),
    voltage_reading     NUMERIC(7, 3),       -- Volts
    current_monitoring  NUMERIC(7, 4),       -- Amperes
    energy_consumption  NUMERIC(10, 4),      -- kWh
    operational_status  VARCHAR(30) NOT NULL DEFAULT 'online'
                        CHECK (operational_status IN ('online','offline','fault','maintenance','dimmed')),
    battery_level       NUMERIC(5, 2),       -- Percentage 0-100
    solar_irradiance    NUMERIC(7, 2),       -- W/m²
    temperature_c       NUMERIC(5, 2),       -- Celsius
    recorded_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_iot_telemetry_asset_id    ON iot_telemetry(asset_id);
CREATE INDEX idx_iot_telemetry_recorded_at ON iot_telemetry(recorded_at DESC);
CREATE INDEX idx_iot_telemetry_status      ON iot_telemetry(operational_status);

-- ============================================================
-- TABLE: ai_alerts
-- Edge-AI CCTV camera alerts (3,300 AI-enabled cameras)
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_alerts (
    id              SERIAL PRIMARY KEY,
    alert_id        UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    segment_id      VARCHAR(20) REFERENCES road_segments(segment_id),
    coordinates     GEOMETRY(POINT, 4326) NOT NULL,
    alert_type      VARCHAR(50) NOT NULL
                    CHECK (alert_type IN (
                        'Vehicle',
                        'Pedestrian',
                        'Animal',
                        'Stopped Vehicle Detection',
                        'Debris on Roadway',
                        'Illegal Off-ramping'
                    )),
    severity        VARCHAR(20) DEFAULT 'medium'
                    CHECK (severity IN ('low','medium','high','critical')),
    camera_id       VARCHAR(50),
    confidence      NUMERIC(5, 4) CHECK (confidence BETWEEN 0 AND 1),
    acknowledged    BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMPTZ,
    dispatched      JSONB DEFAULT '[]'::jsonb,  -- [{service: 'SAPS', time: ...}, ...]
    timestamp       TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_alerts_coordinates ON ai_alerts USING GIST(coordinates);
CREATE INDEX idx_ai_alerts_segment_id  ON ai_alerts(segment_id);
CREATE INDEX idx_ai_alerts_alert_type  ON ai_alerts(alert_type);
CREATE INDEX idx_ai_alerts_timestamp   ON ai_alerts(timestamp DESC);
CREATE INDEX idx_ai_alerts_alert_id    ON ai_alerts(alert_id);

-- ============================================================
-- TABLE: iot_control_log
-- Audit log for remote control commands
-- ============================================================
CREATE TABLE IF NOT EXISTS iot_control_log (
    id          SERIAL PRIMARY KEY,
    asset_id    VARCHAR(50),          -- NULL = group command
    group_id    VARCHAR(50),
    command     VARCHAR(50) NOT NULL
                CHECK (command IN ('dim','full_on','off','schedule','reboot','group_control','mode_adjustment')),
    parameters  JSONB,
    issued_by   VARCHAR(100),
    status      VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending','sent','acknowledged','failed')),
    issued_at   TIMESTAMPTZ DEFAULT NOW(),
    ack_at      TIMESTAMPTZ
);

-- ============================================================
-- Updated_at trigger function (shared)
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_poles_updated_at
BEFORE UPDATE ON poles_assets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
