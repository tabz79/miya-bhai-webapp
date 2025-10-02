-- customers with any activity
SELECT id, phone, phone_normalized, total_spent, last_order_at
FROM customers
ORDER BY last_order_at NULLS LAST
LIMIT 50;
