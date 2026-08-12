-- Add cached static map URL to locations so every customer view doesn't hit Google Static Maps API.
-- The URL is generated once (when the location is created/updated) and reused by all clients.
ALTER TABLE locations ADD COLUMN IF NOT EXISTS static_map_url TEXT;
