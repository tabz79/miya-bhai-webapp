BEGIN;

-- =========================
-- 1) Drivers table (existing patch)
-- =========================
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  vehicle text,
  status text NOT NULL DEFAULT 'active',
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
-- =========================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  assigned_to text,
  status text DEFAULT 'NEW',
  total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  meta jsonb DEFAULT '{}' 
);

-- =========================
-- 4) Safe, adaptive view creation for admin UI
--    Drop the old view if it exists, then create the new one based
--    on whether orders.order_id and orders.meta exist. This avoids
--    the "cannot drop columns from view" error.
-- =========================

DO $$
DECLARE
  has_order_id boolean := false;
  has_meta boolean := false;
  select_order_id_expr text := '';
  select_meta_expr text := '';
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

  IF has_order_id THEN
    select_order_id_expr := 'COALESCE(o.order_id::text, o.id::text) AS order_id';
  ELSE
    select_order_id_expr := 'o.id::text AS order_id';
  END IF;

  IF has_meta THEN
    select_meta_expr := 'o.meta';
  ELSE
    select_meta_expr := 'NULL::jsonb AS meta';
  END IF;

  -- Drop the view first if it exists to avoid column-drop issues
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'deliveries_for_admin'
  ) THEN
    EXECUTE 'DROP VIEW IF EXISTS public.deliveries_for_admin CASCADE';
  END IF;

  -- Construct the CREATE VIEW statement
  sql_text := format($f$
    CREATE VIEW public.deliveries_for_admin AS
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
  $f$, select_order_id_expr, select_meta_expr);

  EXECUTE sql_text;
END$$;

-- Grant select rights to the roles used by your frontend.
-- Adjust roles as per your Supabase RLS/security model.
GRANT SELECT ON public.deliveries_for_admin TO authenticated;
GRANT SELECT ON public.deliveries_for_admin TO anon;

-- Also grant select on underlying tables to the roles if needed
GRANT SELECT ON public.drivers TO authenticated;
GRANT SELECT ON public.customers TO authenticated;
GRANT SELECT ON public.orders TO authenticated;

COMMIT;
