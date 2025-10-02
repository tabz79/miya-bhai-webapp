SELECT id, total_spent, last_order_at
FROM customers
WHERE COALESCE(total_spent,0) > 0
ORDER BY last_order_at DESC
LIMIT 50;
