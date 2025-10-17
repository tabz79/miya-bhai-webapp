-- do tables exist?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles','orders','addresses');

-- check sample record in profiles
SELECT * FROM profiles LIMIT 5;

-- check sample record in orders
SELECT * FROM orders LIMIT 5;
