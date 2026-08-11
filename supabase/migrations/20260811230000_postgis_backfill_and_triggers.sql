-- Backfill existing locations coordinates into the PostGIS geo_point column
-- and add triggers to keep geo_point in sync with the JSONB coordinates column.
-- Also extend saved_addresses with the same coordinates/geo_point support.

-- Backfill locations.geo_point from existing coordinates JSONB.
UPDATE locations
SET geo_point = ST_SetSRID(
  ST_MakePoint(
    (coordinates ->> 'longitude')::double precision,
    (coordinates ->> 'latitude')::double precision
  ),
  4326
)::geography
WHERE geo_point IS NULL
  AND coordinates IS NOT NULL
  AND coordinates ? 'latitude'
  AND coordinates ? 'longitude'
  AND jsonb_typeof(coordinates -> 'latitude') = 'number'
  AND jsonb_typeof(coordinates -> 'longitude') = 'number';

-- Add coordinates/geo_point support to saved_addresses.
ALTER TABLE saved_addresses
ADD COLUMN IF NOT EXISTS coordinates JSONB;

ALTER TABLE saved_addresses
ADD COLUMN IF NOT EXISTS geo_point GEOGRAPHY(POINT, 4326);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_geo_point
ON saved_addresses USING GIST (geo_point);

-- Trigger function: sync locations.geo_point from coordinates JSONB.
CREATE OR REPLACE FUNCTION sync_location_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coordinates IS NULL
     OR NOT (NEW.coordinates ? 'latitude' AND NEW.coordinates ? 'longitude')
     OR jsonb_typeof(NEW.coordinates -> 'latitude') != 'number'
     OR jsonb_typeof(NEW.coordinates -> 'longitude') != 'number'
  THEN
    NEW.geo_point := NULL;
  ELSE
    NEW.geo_point := ST_SetSRID(
      ST_MakePoint(
        (NEW.coordinates ->> 'longitude')::double precision,
        (NEW.coordinates ->> 'latitude')::double precision
      ),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_location_geo_point ON locations;
CREATE TRIGGER trg_sync_location_geo_point
BEFORE INSERT OR UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION sync_location_geo_point();

-- Trigger function: sync saved_addresses.geo_point from coordinates JSONB.
CREATE OR REPLACE FUNCTION sync_saved_address_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coordinates IS NULL
     OR NOT (NEW.coordinates ? 'latitude' AND NEW.coordinates ? 'longitude')
     OR jsonb_typeof(NEW.coordinates -> 'latitude') != 'number'
     OR jsonb_typeof(NEW.coordinates -> 'longitude') != 'number'
  THEN
    NEW.geo_point := NULL;
  ELSE
    NEW.geo_point := ST_SetSRID(
      ST_MakePoint(
        (NEW.coordinates ->> 'longitude')::double precision,
        (NEW.coordinates ->> 'latitude')::double precision
      ),
      4326
    )::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_saved_address_geo_point ON saved_addresses;
CREATE TRIGGER trg_sync_saved_address_geo_point
BEFORE INSERT OR UPDATE ON saved_addresses
FOR EACH ROW
EXECUTE FUNCTION sync_saved_address_geo_point();
