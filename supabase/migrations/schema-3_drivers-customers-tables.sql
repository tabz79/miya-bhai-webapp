BEGIN;

-- =========================
-- 1) Drivers table (existing patch)
-- =========================
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  vehicle text,
  status text NOT NULL DEFAULT 'active', -- added status with default
  created_at timestamptz DEFAULT now()
);

-- If drivers table already existed without 'status', add it (safe)
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Ensure existing rows have a non-null status value
UPDATE public.drivers
SET status = COALESCE(status, 'active')
WHERE status IS NULL;

-- Create an index on status to speed up status-filter queries (safe)
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers (status);

-- Add a check constraint to restrict values to 'active' or 'inactive'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'drivers_status_enum' AND t.relname = 'drivers'
  ) THEN
    ALTER TABLE public.drivers
      ADD CONSTRAINT drivers_status_enum CHECK (status IN ('active','inactive'));
  END IF;
END$$;

-- =========================
-- 2) Customers table (existing)
-- =========================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- =========================
-- 3) Orders table (safe, minimal create-if-missing)
--    We create a minimal orders table only if it doesn't exist.
--    If you already have a production orders table, this will be skipped.
-- =========================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE,                -- optional human-facing id if used
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  assigned_to text,                    -- stores driver id (text/uuid as string)
  status text DEFAULT 'NEW',
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}'              -- free-form metadata (items, etc.)
);

-- If you prefer orders.id to be treated as the definitive id (and the app expects order_id),
-- do NOT add an extra physical order_id column here — we prefer a view below that normalizes names.
-- However, if you explicitly want an order_id column to be present on existing orders table,
-- uncomment the following ALTER (use with caution in prod):
-- ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_id text;

-- =========================
-- 4) Safe, adaptive view creation for admin UI
--    This block inspects whether orders.order_id and orders.meta exist and creates
--    public.deliveries_for_admin accordingly so the view creation won't error
--    referencing non-existent columns.
--    The resulting view will always expose:
--      order_id (text), id, driver_id, driver_name, status, total, customer_name, created_at, meta
--    If meta doesn't exist, meta will be returned as NULL in the view.
-- =========================

DO $$
DECLARE
  has_order_id boolean := false;
  has_meta boolean := false;
  select_meta text := '';
  select_order_id_expr text := '';
  sql_text text := '';
BEGIN
  -- detect order_id presence
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'order_id'
  ) INTO has_order_id;

  -- detect meta presence
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'meta'
  ) INTO has_meta;

  -- build expressions depending on existence
  IF has_order_id THEN
    -- prefer order_id when present, fallback to id::text if order_id is null
    select_order_id_expr := 'COALESCE(o.order_id::text, o.id::text) AS order_id';
  ELSE
    -- order_id column missing: use id::text
    select_order_id_expr := 'o.id::text AS order_id';
  END IF;

  IF has_meta THEN
    select_meta := 'o.meta';
  ELSE
    select_meta := 'NULL::jsonb AS meta';
  END IF;

  -- construct final CREATE OR REPLACE VIEW SQL
  sql_text := format($f$
    CREATE OR REPLACE VIEW public.deliveries_for_admin AS
    SELECT
      %s,
      o.id AS id,
      o.assigned_to::text AS driver_id,
      d.name::text AS driver_name,
      o.status::text AS status,
      o.total::numeric AS total,
      c.name::text AS customer_name,
      o.created_at,
      %s
    FROM public.orders o
    LEFT JOIN public.drivers d ON d.id::text = o.assigned_to::text
    LEFT JOIN public.customers c ON c.id = o.customer_id;
  $f$, select_order_id_expr, select_meta);

  -- execute it
  EXECUTE sql_text;
END$$;

-- Grant select rights to anonymous/authenticated roles used by your frontend
-- Adjust roles as per your Supabase RLS and security model.
GRANT SELECT ON public.deliveries_for_admin TO authenticated;
GRANT SELECT ON public.deliveries_for_admin TO anon;

-- Also grant select on underlying tables to the roles if needed (be careful with RLS/service roles)
GRANT SELECT ON public.drivers TO authenticated;
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.orders TO authenticated;

COMMIT;
