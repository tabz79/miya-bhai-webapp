-- 1) Add columns safely (idempotent)
ALTER TABLE IF EXISTS customers
  ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20),
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_order_at TIMESTAMPTZ;

-- 2) Indexes
CREATE INDEX IF NOT EXISTS idx_customers_phone_norm ON customers (phone_normalized);
CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON customers (lower(email));

-- 3) Backfill phone_normalized for existing rows
UPDATE customers
SET phone_normalized = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL AND (phone_normalized IS NULL OR phone_normalized = '');

-- 4) Backfill total_spent and last_order_at from orders (assumes orders.customer_id, orders.total, orders.created_at)
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
  GROUP BY o.customer_id
) AS sq
WHERE c.id = sq.customer_id
  AND (c.total_spent IS DISTINCT FROM sq.sum_total OR c.last_order_at IS DISTINCT FROM sq.max_created_at);

-- 5) Trigger: normalize phone on insert/update
CREATE OR REPLACE FUNCTION customers_set_phone_normalized()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    NEW.phone_normalized := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  ELSE
    NEW.phone_normalized := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customers_phone_norm ON customers;
CREATE TRIGGER trg_customers_phone_norm
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION customers_set_phone_normalized();

-- 6) Trigger function to refresh customer aggregates when orders change
CREATE OR REPLACE FUNCTION refresh_customer_aggregates_on_order_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  affected_customer uuid;
BEGIN
  -- Determine which customer(s) need updating (handle INSERT, UPDATE, DELETE)
  IF TG_OP = 'INSERT' THEN
    affected_customer := NEW.customer_id;
  ELSIF TG_OP = 'DELETE' THEN
    affected_customer := OLD.customer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- update might change customer_id, so update both old and new (if different)
    IF NEW.customer_id IS DISTINCT FROM OLD.customer_id THEN
      PERFORM refresh_customer_aggregates_for(OLD.customer_id);
    END IF;
    affected_customer := NEW.customer_id;
  END IF;

  IF affected_customer IS NOT NULL THEN
    PERFORM refresh_customer_aggregates_for(affected_customer);
  END IF;

  RETURN NULL;
END;
$$;

-- Helper function used above to recompute aggregates for a single customer id
CREATE OR REPLACE FUNCTION refresh_customer_aggregates_for(cust_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  sum_total numeric;
  max_created timestamptz;
BEGIN
  SELECT COALESCE(SUM(COALESCE(total,0)),0), MAX(created_at)
  INTO sum_total, max_created
  FROM orders
  WHERE customer_id = cust_id;

  UPDATE customers
  SET total_spent = sum_total,
      last_order_at = max_created
  WHERE id = cust_id;
END;
$$;

-- Create/replace trigger on orders to keep customers totals in sync
DROP TRIGGER IF EXISTS trg_orders_refresh_customer ON orders;
CREATE TRIGGER trg_orders_refresh_customer
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION refresh_customer_aggregates_on_order_change();
