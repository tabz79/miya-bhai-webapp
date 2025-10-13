-- sample subtotal
WITH c AS (SELECT * FROM coupons WHERE UPPER(code) = 'MIYABHAI10' LIMIT 1)
SELECT c.id, c.code, c.type, c.value,
       (100.00 * c.value) / 100.0 AS discount_amount_on_100
FROM c;
