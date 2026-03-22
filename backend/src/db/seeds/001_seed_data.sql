-- ============================================================
-- Seed Data: Road Segments - Waterberg District, South Africa
-- Center: approx. Lat -24.18, Lon 28.91
-- ============================================================

-- Rural Road Segments (RS-01 to RS-32)
INSERT INTO road_segments (segment_id, segment_name, length_km, start_lat, start_lon, end_lat, end_lon)
VALUES
  ('RS-01', 'Mokopane - Vaalwater Road N11',        78.5,  -24.19, 28.89, -24.72, 28.44),
  ('RS-02', 'Lephalale - Marken Road',              95.2,  -23.68, 27.97, -24.47, 28.31),
  ('RS-03', 'Bela-Bela - Mokopane R516',            65.8,  -24.89, 28.29, -24.19, 28.89),
  ('RS-04', 'Vaalwater - Melkrivier Road',          42.1,  -24.72, 28.44, -24.51, 28.77),
  ('RS-05', 'Marken - Thabazimbi R510',             88.3,  -24.47, 28.31, -24.59, 27.40),
  ('RS-06', 'Thabazimbi - Northam R510',            54.6,  -24.59, 27.40, -24.93, 27.15),
  ('RS-07', 'Northam - Brits R511',                 97.4,  -24.93, 27.15, -25.63, 27.78),
  ('RS-08', 'Mokopane - Potgietersrus N11 North',   31.2,  -24.19, 28.89, -23.97, 28.98),
  ('RS-09', 'Grobblersdal - Roedtan R33',           72.9,  -25.19, 29.38, -24.68, 29.08),
  ('RS-10', 'Alma - Vaalwater Farm Road',           28.4,  -24.55, 28.52, -24.72, 28.44),
  ('RS-11', 'Settlers - Naboomspruit Road',         61.7,  -24.66, 28.92, -24.89, 28.65),
  ('RS-12', 'Mookgophong - Mokopane R101',          45.3,  -24.57, 28.95, -24.19, 28.89),
  ('RS-13', 'Bochum - Senwabarwana Road',           53.8,  -23.52, 29.14, -23.28, 29.19),
  ('RS-14', 'Ellisras - Lephalale Link',            22.6,  -23.68, 27.97, -23.59, 28.07),
  ('RS-15', 'Witvlei - Wildebeest Road',            38.9,  -24.44, 28.18, -24.59, 27.40),
  ('RS-16', 'Masehlaneng Community Road',           19.2,  -24.31, 28.78, -24.44, 28.89),
  ('RS-17', 'Ga-Mokgophi Rural Access',             33.5,  -24.13, 28.61, -24.28, 28.70),
  ('RS-18', 'Rebone - Mokopane R101',               47.1,  -24.04, 28.82, -24.19, 28.89),
  ('RS-19', 'Waterberg Biosphere Road',             84.3,  -24.35, 27.85, -24.72, 28.44),
  ('RS-20', 'Vaalwater - Alma Road',                29.8,  -24.72, 28.44, -24.55, 28.52),
  ('RS-21', 'Mokopane - Mahwelereng Link',          12.4,  -24.19, 28.89, -24.13, 28.99),
  ('RS-22', 'Thabazimbi - Koedoeskop Road',         66.2,  -24.59, 27.40, -24.82, 27.92),
  ('RS-23', 'Bela-Bela Spa Approach Road',          15.7,  -24.89, 28.29, -24.93, 28.39),
  ('RS-24', 'Limpopo Valley Road R572',             91.6,  -23.28, 29.19, -23.68, 27.97),
  ('RS-25', 'Nylstroom - Bela-Bela N1 Service',     38.1,  -24.69, 28.40, -24.89, 28.29),
  ('RS-26', 'Rooibokfontein Road',                  44.7,  -24.38, 28.10, -24.55, 28.30),
  ('RS-27', 'Marakele Park Access Road',            27.3,  -24.51, 27.55, -24.59, 27.40),
  ('RS-28', 'Mabatlane Community Road',             21.8,  -24.07, 28.67, -24.19, 28.78),
  ('RS-29', 'Ga-Seleka Rural Road',                 35.6,  -24.24, 28.55, -24.35, 28.62),
  ('RS-30', 'Settlers - Roedtan R514',              58.9,  -24.66, 28.92, -24.68, 29.08),
  ('RS-31', 'Mokopane N11 South Link',              41.2,  -24.19, 28.89, -24.37, 28.80),
  ('RS-32', 'Waterval - Rust de Winter Road',       69.4,  -25.12, 28.57, -24.89, 28.65),

-- Urban Intersection Roads (UIR-01 to UIR-06)
  ('UIR-01', 'Mokopane CBD - Mandela Drive',         8.3, -24.19,  28.89, -24.21, 28.87),
  ('UIR-02', 'Lephalale Urban Centre Circuit',       6.7, -23.68,  27.97, -23.71, 28.01),
  ('UIR-03', 'Thabazimbi Town Ring Road',            9.1, -24.59,  27.40, -24.61, 27.44),
  ('UIR-04', 'Bela-Bela Urban District Route',      11.2, -24.89,  28.29, -24.87, 28.33),
  ('UIR-05', 'Vaalwater Main Street Circuit',        5.4, -24.72,  28.44, -24.74, 28.47),
  ('UIR-06', 'Mookgophong Urban Road Network',       7.8, -24.57,  28.95, -24.55, 28.92)
ON CONFLICT (segment_id) DO NOTHING;

-- ============================================================
-- Seed sample poles (subset for demonstration)
-- Full production would have 90,000 records
-- ============================================================
INSERT INTO poles_assets (asset_id, segment_id, coordinates, pole_height_m, foundation_code, luminaire_type, scenario_code, dpmbm_status)
VALUES
  ('PA-RS01-0001', 'RS-01', ST_SetSRID(ST_MakePoint(28.89, -24.19), 4326),  10.0, 'FC9',   'EDEN 100W', 'SL4',   'Maintain'),
  ('PA-RS01-0002', 'RS-01', ST_SetSRID(ST_MakePoint(28.88, -24.21), 4326),  10.0, 'FC9',   'EDEN 100W', 'SL4',   'Maintain'),
  ('PA-RS01-0003', 'RS-01', ST_SetSRID(ST_MakePoint(28.87, -24.23), 4326),  10.0, 'FC9',   'EDEN 100W', 'SL4',   'Build'),
  ('PA-RS01-0004', 'RS-01', ST_SetSRID(ST_MakePoint(28.86, -24.25), 4326),  10.0, 'FC9',   'EDEN 90W',  'SL4',   'Build'),
  ('PA-RS01-0005', 'RS-01', ST_SetSRID(ST_MakePoint(28.85, -24.27), 4326),  10.0, 'FC9',   'EDEN 90W',  'SL4',   'Manage'),
  ('PA-RS02-0001', 'RS-02', ST_SetSRID(ST_MakePoint(27.97, -23.68), 4326),  11.5, 'FC11',  'EDEN 100W', 'SS8',   'Plan'),
  ('PA-RS02-0002', 'RS-02', ST_SetSRID(ST_MakePoint(27.99, -23.72), 4326),  11.5, 'FC11',  'EDEN 100W', 'SS8',   'Plan'),
  ('PA-RS02-0003', 'RS-02', ST_SetSRID(ST_MakePoint(28.01, -23.76), 4326),  11.5, 'FH200', 'EDEN 100W', 'SS8',   'Design'),
  ('PA-RS03-0001', 'RS-03', ST_SetSRID(ST_MakePoint(28.29, -24.89), 4326),   8.0, 'FC8',   'EDEN 80W',  'SL2',   'Maintain'),
  ('PA-RS03-0002', 'RS-03', ST_SetSRID(ST_MakePoint(28.35, -24.78), 4326),   8.0, 'FC8',   'EDEN 80W',  'SL2',   'Maintain'),
  ('PA-RS05-0001', 'RS-05', ST_SetSRID(ST_MakePoint(28.31, -24.47), 4326),  10.0, 'FH175', 'EDEN 100W', 'SX2',   'Maintain'),
  ('PA-RS05-0002', 'RS-05', ST_SetSRID(ST_MakePoint(28.20, -24.51), 4326),  10.0, 'FH175', 'EDEN 100W', 'SX2',   'Build'),
  ('PA-RS07-0001', 'RS-07', ST_SetSRID(ST_MakePoint(27.15, -24.93), 4326),   8.0, 'FC7',   'EDEN 80W',  'SL4S',  'Manage'),
  ('PA-RS07-0002', 'RS-07', ST_SetSRID(ST_MakePoint(27.25, -25.01), 4326),   8.0, 'FC7',   'EDEN 80W',  'SL4S',  'Design'),
  ('PA-RS19-0001', 'RS-19', ST_SetSRID(ST_MakePoint(27.85, -24.35), 4326),  11.5, 'FH250', 'EDEN 100W', 'ST4',   'Plan'),
  ('PA-RS24-0001', 'RS-24', ST_SetSRID(ST_MakePoint(29.19, -23.28), 4326),  10.0, 'FC10',  'EDEN 90W',  'SL4',   'Plan'),
  ('PA-UIR01-001', 'UIR-01', ST_SetSRID(ST_MakePoint(28.89, -24.19), 4326),  6.0, 'FC6',   'AURA 60W',  'P-URB', 'Maintain'),
  ('PA-UIR01-002', 'UIR-01', ST_SetSRID(ST_MakePoint(28.88, -24.20), 4326),  6.0, 'FC6',   'AURA 60W',  'P-URB', 'Maintain'),
  ('PA-UIR01-003', 'UIR-01', ST_SetSRID(ST_MakePoint(28.87, -24.20), 4326),  6.0, 'FC6',   'AURA 50W',  'PED-X', 'Maintain'),
  ('PA-UIR01-004', 'UIR-01', ST_SetSRID(ST_MakePoint(28.87, -24.21), 4326),  6.0, 'FC6',   'AURA 40W',  'PED-X', 'Build'),
  ('PA-UIR02-001', 'UIR-02', ST_SetSRID(ST_MakePoint(27.97, -23.68), 4326),  8.0, 'FC8',   'AURA 60W',  'SS5',   'Maintain'),
  ('PA-UIR02-002', 'UIR-02', ST_SetSRID(ST_MakePoint(27.99, -23.69), 4326),  8.0, 'FC8',   'AURA 60W',  'SS5',   'Maintain'),
  ('PA-UIR03-001', 'UIR-03', ST_SetSRID(ST_MakePoint(27.40, -24.59), 4326),  6.0, 'FC6',   'AURA 50W',  'SS4',   'Manage'),
  ('PA-UIR04-001', 'UIR-04', ST_SetSRID(ST_MakePoint(28.29, -24.89), 4326),  8.0, 'FC8',   'AURA 60W',  'SS7',   'Plan'),
  ('PA-UIR05-001', 'UIR-05', ST_SetSRID(ST_MakePoint(28.44, -24.72), 4326),  6.0, 'FC6',   'AURA 40W',  'SS3',   'Design'),
  ('PA-UIR06-001', 'UIR-06', ST_SetSRID(ST_MakePoint(28.95, -24.57), 4326),  6.0, 'FC6',   'AURA 50W',  'P-URB', 'Maintain')
ON CONFLICT (asset_id) DO NOTHING;

-- Seed IoT Telemetry (latest readings per pole)
INSERT INTO iot_telemetry (asset_id, voltage_reading, current_monitoring, energy_consumption, operational_status, battery_level, solar_irradiance, temperature_c)
VALUES
  ('PA-RS01-0001', 230.4,  0.4348, 0.1000, 'online',       91.5, 820.0, 28.3),
  ('PA-RS01-0002', 228.8,  0.3934, 0.0900, 'online',       88.2, 815.0, 29.1),
  ('PA-RS01-0003', 231.1,  0.4329, 0.1000, 'maintenance',  75.4, 790.0, 30.2),
  ('PA-RS01-0004', 229.5,  0.3921, 0.0900, 'dimmed',       82.7, 805.0, 28.9),
  ('PA-RS01-0005', 225.0,  0.4000, 0.0900, 'online',       70.1, 760.0, 31.4),
  ('PA-RS02-0001', 233.0,  0.4292, 0.1000, 'online',       95.0, 845.0, 26.7),
  ('PA-RS02-0002', 231.7,  0.4317, 0.1000, 'online',       93.8, 838.0, 27.3),
  ('PA-RS02-0003', 0.0,    0.0,    0.0,    'offline',       0.0,   0.0, 35.8),
  ('PA-RS03-0001', 229.1,  0.3492, 0.0800, 'online',       89.3, 810.0, 29.8),
  ('PA-RS03-0002', 227.6,  0.3508, 0.0800, 'online',       87.1, 800.0, 30.5),
  ('PA-UIR01-001', 231.5,  0.2597, 0.0600, 'online',       92.4, 825.0, 27.9),
  ('PA-UIR01-002', 230.9,  0.2165, 0.0500, 'online',       90.8, 820.0, 28.1),
  ('PA-UIR01-003', 229.3,  0.2187, 0.0500, 'online',       88.5, 812.0, 28.7),
  ('PA-UIR01-004', 228.1,  0.1754, 0.0400, 'dimmed',       71.2, 780.0, 31.0),
  ('PA-UIR02-001', 232.4,  0.2586, 0.0600, 'online',       94.1, 840.0, 27.0),
  ('PA-UIR02-002', 231.8,  0.2591, 0.0600, 'online',       93.2, 835.0, 27.4),
  ('PA-UIR03-001', 229.7,  0.2179, 0.0500, 'fault',        45.3, 720.0, 32.6),
  ('PA-UIR04-001', 230.2,  0.2609, 0.0600, 'online',       86.7, 808.0, 29.4),
  ('PA-UIR05-001', 227.9,  0.1756, 0.0400, 'online',       79.5, 792.0, 30.8),
  ('PA-UIR06-001', 231.0,  0.2174, 0.0500, 'online',       91.0, 821.0, 28.5)
ON CONFLICT DO NOTHING;
