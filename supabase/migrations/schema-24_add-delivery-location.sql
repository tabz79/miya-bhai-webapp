
ALTER TABLE orders
ADD COLUMN delivery_lat NUMERIC,
ADD COLUMN delivery_lng NUMERIC,
ADD COLUMN delivery_address TEXT;
