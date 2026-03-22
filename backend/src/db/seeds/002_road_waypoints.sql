-- Seed 002: Update road segments with multi-point geometries
-- Each road now follows approximate real paths through Waterberg District

UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.89 -24.19, 28.83 -24.28, 28.72 -24.38, 28.60 -24.48, 28.52 -24.55, 28.47 -24.63, 28.44 -24.72)'), 4326) WHERE segment_id = 'RS-01';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.97 -23.68, 28.02 -23.80, 28.08 -23.95, 28.15 -24.10, 28.22 -24.25, 28.31 -24.47)'), 4326) WHERE segment_id = 'RS-02';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.29 -24.89, 28.42 -24.78, 28.55 -24.65, 28.68 -24.50, 28.78 -24.35, 28.89 -24.19)'), 4326) WHERE segment_id = 'RS-03';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.44 -24.72, 28.52 -24.66, 28.61 -24.59, 28.70 -24.54, 28.77 -24.51)'), 4326) WHERE segment_id = 'RS-04';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.31 -24.47, 28.12 -24.49, 27.95 -24.51, 27.75 -24.53, 27.55 -24.56, 27.40 -24.59)'), 4326) WHERE segment_id = 'RS-05';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.40 -24.59, 27.32 -24.68, 27.25 -24.78, 27.18 -24.86, 27.15 -24.93)'), 4326) WHERE segment_id = 'RS-06';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.15 -24.93, 27.22 -25.05, 27.32 -25.18, 27.44 -25.30, 27.58 -25.43, 27.68 -25.53, 27.78 -25.63)'), 4326) WHERE segment_id = 'RS-07';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.89 -24.19, 28.92 -24.10, 28.95 -24.03, 28.98 -23.97)'), 4326) WHERE segment_id = 'RS-08';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(29.38 -25.19, 29.30 -25.08, 29.22 -24.95, 29.14 -24.82, 29.08 -24.68)'), 4326) WHERE segment_id = 'RS-09';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.52 -24.55, 28.49 -24.61, 28.47 -24.66, 28.44 -24.72)'), 4326) WHERE segment_id = 'RS-10';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.92 -24.66, 28.85 -24.72, 28.78 -24.78, 28.72 -24.84, 28.65 -24.89)'), 4326) WHERE segment_id = 'RS-11';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.95 -24.57, 28.93 -24.47, 28.91 -24.37, 28.90 -24.27, 28.89 -24.19)'), 4326) WHERE segment_id = 'RS-12';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(29.14 -23.52, 29.16 -23.45, 29.18 -23.37, 29.19 -23.28)'), 4326) WHERE segment_id = 'RS-13';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.97 -23.68, 28.01 -23.64, 28.07 -23.59)'), 4326) WHERE segment_id = 'RS-14';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.18 -24.44, 28.02 -24.48, 27.82 -24.52, 27.62 -24.55, 27.40 -24.59)'), 4326) WHERE segment_id = 'RS-15';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.78 -24.31, 28.82 -24.37, 28.86 -24.42, 28.89 -24.44)'), 4326) WHERE segment_id = 'RS-16';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.61 -24.13, 28.64 -24.19, 28.67 -24.24, 28.70 -24.28)'), 4326) WHERE segment_id = 'RS-17';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.82 -24.04, 28.83 -24.09, 28.85 -24.14, 28.87 -24.17, 28.89 -24.19)'), 4326) WHERE segment_id = 'RS-18';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.85 -24.35, 27.98 -24.38, 28.10 -24.41, 28.22 -24.42, 28.33 -24.44, 28.44 -24.44, 28.44 -24.55, 28.44 -24.72)'), 4326) WHERE segment_id = 'RS-19';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.44 -24.72, 28.47 -24.66, 28.50 -24.60, 28.52 -24.55)'), 4326) WHERE segment_id = 'RS-20';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.89 -24.19, 28.93 -24.16, 28.96 -24.14, 28.99 -24.13)'), 4326) WHERE segment_id = 'RS-21';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.40 -24.59, 27.55 -24.65, 27.68 -24.71, 27.80 -24.77, 27.92 -24.82)'), 4326) WHERE segment_id = 'RS-22';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.29 -24.89, 28.33 -24.91, 28.37 -24.92, 28.39 -24.93)'), 4326) WHERE segment_id = 'RS-23';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(29.19 -23.28, 29.08 -23.35, 28.92 -23.44, 28.72 -23.54, 28.52 -23.62, 27.97 -23.68)'), 4326) WHERE segment_id = 'RS-24';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.40 -24.69, 28.37 -24.76, 28.34 -24.82, 28.29 -24.89)'), 4326) WHERE segment_id = 'RS-25';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.10 -24.38, 28.16 -24.43, 28.22 -24.48, 28.27 -24.52, 28.30 -24.55)'), 4326) WHERE segment_id = 'RS-26';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.55 -24.51, 27.50 -24.54, 27.45 -24.57, 27.40 -24.59)'), 4326) WHERE segment_id = 'RS-27';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.67 -24.07, 28.71 -24.12, 28.75 -24.16, 28.78 -24.19)'), 4326) WHERE segment_id = 'RS-28';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.55 -24.24, 28.58 -24.29, 28.60 -24.33, 28.62 -24.35)'), 4326) WHERE segment_id = 'RS-29';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.92 -24.66, 28.96 -24.67, 29.01 -24.68, 29.05 -24.68, 29.08 -24.68)'), 4326) WHERE segment_id = 'RS-30';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.89 -24.19, 28.87 -24.25, 28.84 -24.31, 28.82 -24.37, 28.80 -24.37)'), 4326) WHERE segment_id = 'RS-31';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.57 -25.12, 28.59 -25.05, 28.61 -24.98, 28.63 -24.92, 28.65 -24.89)'), 4326) WHERE segment_id = 'RS-32';

-- Urban segments (shorter, denser waypoints)
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.89 -24.19, 28.885 -24.195, 28.878 -24.202, 28.870 -24.210)'), 4326) WHERE segment_id = 'UIR-01';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.97 -23.68, 27.978 -23.693, 27.990 -23.702, 28.010 -23.710)'), 4326) WHERE segment_id = 'UIR-02';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(27.40 -24.59, 27.415 -24.598, 27.428 -24.606, 27.440 -24.610)'), 4326) WHERE segment_id = 'UIR-03';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.29 -24.89, 28.305 -24.882, 28.318 -24.876, 28.330 -24.870)'), 4326) WHERE segment_id = 'UIR-04';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.44 -24.72, 28.450 -24.728, 28.460 -24.735, 28.470 -24.740)'), 4326) WHERE segment_id = 'UIR-05';
UPDATE road_segments SET geom = ST_SetSRID(ST_GeomFromText('LINESTRING(28.95 -24.57, 28.938 -24.563, 28.928 -24.556, 28.920 -24.550)'), 4326) WHERE segment_id = 'UIR-06';
