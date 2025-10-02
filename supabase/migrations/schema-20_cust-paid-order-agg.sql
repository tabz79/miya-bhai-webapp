-- 1) Replace aggregate function to count only paid orders
CREATE OR REPLACE FUNCTION refresh_customer_aggregates_for(cust_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  sum_total numeric;
  max_created timestamptz;
BEGIN
  SELECT COALESCE(SUM(COALESCE(total,0)),0), MAX(created_at)
  INTO sum_total, max_created
  FROM orders
  WHERE customer_id = cust_id
    AND (payment_status = 'PAID');   -- only count paid orders

  UPDATE customers
  SET total_spent = sum_total,
      last_order_at = max_created
  WHERE id = cust_id;
END;
$$;

-- 2) Backfill all customers using the same paid-only rule
UPDATE customers c
SET
  total_spent = COALESCE(sq.sum_total, 0),
  last_order_at = sq.max_created_at
FROM (
  SELECT
    o.customer_id,
    SUM(COALESCE(o.total,0)) AS sum_total,
    MAX(o.created_at) AS max_created_at
  FROM orders o
  WHERE o.customer_id IS NOT NULL
    AND o.payment_status = 'PAID'
  GROUP BY o.customer_id
) AS sq
WHERE c.id = sq.customer_id
  AND (c.total_spent IS DISTINCT FROM sq.sum_total OR c.last_order_at IS DISTINCT FROM sq.max_created_at);
