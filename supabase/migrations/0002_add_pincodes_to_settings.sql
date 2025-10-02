
ALTER TABLE settings
ADD COLUMN allowed_pincodes TEXT[] DEFAULT '{}';

UPDATE settings
SET allowed_pincodes = '{"500001", "500002", "500003"}'
WHERE key = 'delivery';
