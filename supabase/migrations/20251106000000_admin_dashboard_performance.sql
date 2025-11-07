
-- supabase/migrations/20251106000000_admin_dashboard_performance.sql

-- 1. Create a function to get the admin summary
CREATE OR REPLACE FUNCTION get_admin_summary()
RETURNS TABLE (total_revenue numeric, total_orders bigint, pending_orders bigint, completed_orders bigint)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(total) AS total_revenue,
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE status IN ('NEW', 'PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY')) AS pending_orders,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed_orders
  FROM orders;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to get orders over time
CREATE OR REPLACE FUNCTION get_orders_over_time(from_date text, to_date text, interval_type text)
RETURNS TABLE (period text, orders bigint)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(created_at, 
      CASE 
        WHEN interval_type = 'month' THEN 'YYYY-MM'
        WHEN interval_type = 'week' THEN 'YYYY-WW'
        ELSE 'YYYY-MM-DD'
      END
    ) AS period,
    COUNT(*) AS orders
  FROM orders
  WHERE created_at >= from_date::date
    AND created_at <= to_date::date
  GROUP BY period
  ORDER BY period;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to get payment methods
CREATE OR REPLACE FUNCTION get_payment_methods()
RETURNS TABLE (name text, value bigint)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(payment_method, 'Unknown') AS name,
    COUNT(*) AS value
  FROM orders
  GROUP BY name;
END;
$$ LANGUAGE plpgsql;

-- 4. Add indexes to the orders table
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);
