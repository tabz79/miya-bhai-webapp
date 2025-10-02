-- show a few real customers (copy one id from this output)
SELECT id, name, phone, email, created_at
FROM customers
ORDER BY created_at DESC
LIMIT 10;
