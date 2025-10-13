ALTER TABLE settings
ADD COLUMN IF NOT EXISTS allowed_pincodes TEXT[] DEFAULT '{}';
