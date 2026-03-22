-- Migration 002: Allow explicit geometry on road_segments
-- Modify trigger so it only auto-generates geom when not explicitly provided

CREATE OR REPLACE FUNCTION update_road_segment_geom()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-generate straight-line geom if none provided
    IF NEW.geom IS NULL THEN
        NEW.geom := ST_SetSRID(
            ST_MakeLine(
                ST_MakePoint(NEW.start_lon, NEW.start_lat),
                ST_MakePoint(NEW.end_lon,   NEW.end_lat)
            ), 4326
        );
    END IF;
    NEW.road_class := CASE
        WHEN NEW.segment_id LIKE 'UIR-%' THEN 'urban'
        ELSE 'rural'
    END;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
