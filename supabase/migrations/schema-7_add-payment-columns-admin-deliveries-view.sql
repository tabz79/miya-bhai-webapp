BEGIN;

-- 1) Add normalized columns to orders if missing (non-destructive)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount NUMERIC;

-- 2) Backfill order_number where missing
UPDATE public.orders
SET order_number = 'MB-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || SUBSTRING(REPLACE(id::text, '-', ''), 1, 8)
WHERE order_number IS NULL;

-- 3) Conditionally backfill payment_status and payment_amount from meta if meta column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'meta'
  ) THEN
    -- backfill payment_status from meta->>'payment_status' where available
    UPDATE public.orders
    SET payment_status = COALESCE(payment_status, meta->>'payment_status')
    WHERE payment_status IS NULL
      AND meta->>'payment_status' IS NOT NULL;

    -- backfill payment_amount from meta->>'payment_amount' or meta->>'total' where available
    UPDATE public.orders
    SET payment_amount = COALESCE(payment_amount,
                                  CASE
                                    WHEN (meta->>'payment_amount') IS NOT NULL THEN (meta->>'payment_amount')::numeric
                                    WHEN (meta->>'total') IS NOT NULL THEN (meta->>'total')::numeric
                                    ELSE NULL
                                  END)
    WHERE payment_amount IS NULL
      AND (
        (meta->>'payment_amount') IS NOT NULL
        OR (meta->>'total') IS NOT NULL
      );
  ELSE
    RAISE NOTICE 'orders.meta column not present — skipping meta-based backfill.';
  END IF;
END$$;

-- 4) Drop existing view if any (avoid rename problems)
DROP VIEW IF EXISTS public.deliveries_for_admin;

-- 5) Build and create the view dynamically — only reference meta when it exists
DO $$
DECLARE
  has_meta boolean := false;
  select_order_number_expr text;
  select_payment_method_expr text;
  select_payment_status_expr text;
  select_payment_amount_expr text;
  sql_text text;
BEGIN
  -- detect if orders.meta column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='meta'
  ) INTO has_meta;

  -- order_number expr (use existing order_number if any, else generate)
  select_order_number_expr := 'COALESCE(o.order_number, ''MB-'' || TO_CHAR(o.created_at, ''YYYYMMDD'') || ''-'' || SUBSTRING(REPLACE(o.id::text, ''-'', ''''), 1, 8)) AS order_number';

  IF has_meta THEN
    -- when meta exists, prefer o.payment_method then meta->>'payment_method'
    select_payment_method_expr := 'COALESCE(NULLIF(o.payment_method::text, ''''), NULLIF(o.meta->>''payment_method'', '''')) AS payment_method';
    select_payment_status_expr := 'COALESCE(NULLIF(o.payment_status::text, ''''), NULLIF(o.meta->>''payment_status'', '''')) AS payment_status';
    -- payment_amount: prefer column, else meta.payment_amount or meta.total
    select_payment_amount_expr := 'COALESCE(o.payment_amount::numeric, (CASE WHEN (o.meta->>''payment_amount'') IS NOT NULL THEN (o.meta->>''payment_amount'')::numeric WHEN (o.meta->>''total'') IS NOT NULL THEN (o.meta->>''total'')::numeric ELSE NULL END)) AS payment_amount';
  ELSE
    -- when meta missing, just use top-level columns or NULLs
    select_payment_method_expr := 'NULL::text AS payment_method';
    select_payment_status_expr := 'NULL::text AS payment_status';
    select_payment_amount_expr := 'NULL::numeric AS payment_amount';
  END IF;

  -- assemble final CREATE VIEW SQL
  sql_text := format($f$
    CREATE OR REPLACE VIEW public.deliveries_for_admin AS
    SELECT
      o.id::text AS order_id,
      %s,
      o.status::text AS status,
      o.assigned_to::text AS driver_id,
      d.name::text AS driver_name,
      %s,
      %s,
      %s,
      o.total::numeric AS total,
      c.name::text AS customer_name,
      o.created_at
    FROM public.orders o
    LEFT JOIN public.drivers d ON d.id::text = o.assigned_to::text
    LEFT JOIN public.customers c ON c.id = o.customer_id;
  $f$, select_order_number_expr, select_payment_method_expr, select_payment_status_expr, select_payment_amount_expr);

  EXECUTE sql_text;
END$$;

-- 6) Grant select to typical roles (PO may adjust for RLS)
GRANT SELECT ON public.deliveries_for_admin TO authenticated;
GRANT SELECT ON public.deliveries_for_admin TO anon;

COMMIT;
