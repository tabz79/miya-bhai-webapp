-- supabase/migrations/0003_fix_orders_table.sql
-- FULL MIGRATION + preview/apply helper functions for GST backfill

BEGIN;

-- ========================
-- Extensions & guards
-- ========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    BEGIN
      EXECUTE 'CREATE EXTENSION IF NOT EXISTS pgcrypto';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Unable to create pgcrypto extension automatically. Create it manually if needed.';
    END;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    RAISE EXCEPTION 'Table public.orders not found - aborting migration.';
  END IF;
END
$$;

-- ========================
-- Schema fixes (idempotent)
-- ========================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS legacy_cart jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cart'
  ) THEN
    UPDATE public.orders
    SET legacy_cart = cart
    WHERE cart IS NOT NULL
      AND (legacy_cart IS NULL OR legacy_cart = 'null'::jsonb);
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'cart'
  ) THEN
    BEGIN
      ALTER TABLE public.orders DROP COLUMN cart;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not drop public.orders.cart automatically - check manually.';
    END;
  END IF;
END
$$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'COD',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cart_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS total numeric;

UPDATE public.orders
SET total = CASE
  WHEN total IS NULL AND jsonb_typeof(totals) = 'object' AND (totals->>'total') IS NOT NULL
    THEN (totals->>'total')::numeric
  WHEN total IS NULL
    THEN 0
  ELSE total
END
WHERE total IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN total SET DEFAULT 0;

-- Create constraint only if all rows already comply
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = 'c'
      AND t.relname = 'orders'
      AND c.conname = 'orders_items_not_empty'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.orders
      WHERE NOT (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0)
    ) THEN
      ALTER TABLE public.orders
        ADD CONSTRAINT orders_items_not_empty
        CHECK (jsonb_typeof(items) = 'array' AND jsonb_array_length(items) > 0);
    ELSE
      RAISE NOTICE 'Skipped adding orders_items_not_empty constraint because existing rows do not comply. Clean rows first.';
    END IF;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_orders_cart_id ON public.orders (cart_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'set_updated_at' AND n.nspname = 'public'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_set_updated_at'
  ) THEN
    CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
  END IF;
END
$$;

-- ========================
-- GST helpers & audit table (idempotent)
-- ========================
CREATE TABLE IF NOT EXISTS public.gst_patch_audit (
  audit_id uuid DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()) PRIMARY KEY,
  order_id uuid NOT NULL,
  patched_at timestamptz NOT NULL DEFAULT now(),
  patched_by text NOT NULL DEFAULT current_user,
  reason text,
  items_before jsonb NOT NULL,
  items_after jsonb,
  CONSTRAINT fk_order_exists FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Derive percent helper (immutable)
CREATE OR REPLACE FUNCTION public._derive_order_gst_percent(order_gst numeric, order_taxable numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE
      WHEN order_taxable IS NULL OR order_taxable = 0 THEN NULL
      ELSE ROUND( (order_gst / order_taxable * 100)::numeric, 2 )
    END;
$$;

-- ========================
-- Preview function (callable)
-- Returns: id, order_gst, order_taxable, derived_percent, preview_items (jsonb)
-- ========================
CREATE OR REPLACE FUNCTION public.preview_order_gst_patch(p_order_id uuid)
RETURNS TABLE (
  id uuid,
  order_gst numeric,
  order_taxable numeric,
  derived_percent numeric,
  preview_items jsonb
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH order_meta AS (
    SELECT id,
           (totals->>'gst')::numeric AS order_gst,
           (totals->>'taxableAmount')::numeric AS order_taxable,
           items
    FROM public.orders
    WHERE id = p_order_id
  )
  SELECT
    om.id,
    om.order_gst,
    om.order_taxable,
    public._derive_order_gst_percent(om.order_gst, om.order_taxable) AS derived_percent,
    jsonb_agg(
      CASE
        WHEN (item->>'gstPercent') IS NOT NULL AND (item->>'gstPercent') <> '0'
             AND (item ? 'itemTaxable') AND (item ? 'itemGstAmount') THEN item
        ELSE
          jsonb_set(
            jsonb_set(
              jsonb_set(
                item,
                '{gstPercent}',
                to_jsonb(public._derive_order_gst_percent(om.order_gst, om.order_taxable)),
                true
              ),
              '{itemTaxable}',
              to_jsonb( (COALESCE((item->>'unitPrice')::numeric, (item->'meta'->>'price')::numeric, 0) * COALESCE((item->>'qty')::numeric, (item->'meta'->>'quantity')::numeric, 1))::numeric ),
              true
            ),
            '{itemGstAmount}',
            to_jsonb( ROUND( ((COALESCE((item->>'unitPrice')::numeric, (item->'meta'->>'price')::numeric, 0) * COALESCE((item->>'qty')::numeric, (item->'meta'->>'quantity')::numeric, 1)) * (public._derive_order_gst_percent(om.order_gst, om.order_taxable)/100.0))::numeric, 2) ),
            true
          )
      END
    ) AS preview_items
  FROM order_meta om
  CROSS JOIN LATERAL jsonb_array_elements(om.items) AS arr(item)
  GROUP BY om.id, om.order_gst, om.order_taxable;
END;
$$;

-- ========================
-- Apply function (idempotent & audited)
-- Updates items: gstPercent, itemTaxable, itemGstAmount
-- ========================
CREATE OR REPLACE FUNCTION public.apply_order_gst_patch(p_order_id uuid, p_reason text DEFAULT 'single-order-enhanced-patch')
RETURNS TABLE (order_id uuid, items jsonb)
LANGUAGE plpgsql AS $$
DECLARE
  v_order record;
  v_new_items jsonb;
BEGIN
  -- fetch the order
  SELECT id, (totals->>'gst')::numeric AS order_gst, (totals->>'taxableAmount')::numeric AS order_taxable, items
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE; -- lock the row

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- build new_items JSON
  SELECT jsonb_agg(
    CASE
      WHEN (item->>'gstPercent') IS NOT NULL AND (item->>'gstPercent') <> '0'
           AND (item ? 'itemTaxable') AND (item ? 'itemGstAmount') THEN item
      ELSE
        jsonb_set(
          jsonb_set(
            jsonb_set(
              item,
              '{gstPercent}',
              to_jsonb(public._derive_order_gst_percent(v_order.order_gst, v_order.order_taxable)),
              true
            ),
            '{itemTaxable}',
            to_jsonb( (COALESCE((item->>'unitPrice')::numeric, (item->'meta'->>'price')::numeric, 0) * COALESCE((item->>'qty')::numeric, (item->'meta'->>'quantity')::numeric, 1))::numeric ),
            true
          ),
          '{itemGstAmount}',
          to_jsonb( ROUND( ((COALESCE((item->>'unitPrice')::numeric, (item->'meta'->>'price')::numeric, 0) * COALESCE((item->>'qty')::numeric, (item->'meta'->>'quantity')::numeric, 1)) * (public._derive_order_gst_percent(v_order.order_gst, v_order.order_taxable)/100.0))::numeric, 2) ),
          true
        )
    END
  ) INTO v_new_items
  FROM jsonb_array_elements(v_order.items) AS arr(item);

  -- if items are same, return without update
  IF v_new_items IS NULL OR v_new_items = v_order.items THEN
    RETURN QUERY SELECT v_order.id AS order_id, v_order.items AS items;
    RETURN;
  END IF;

  -- audit before update
  INSERT INTO public.gst_patch_audit (order_id, reason, items_before, items_after)
  VALUES (v_order.id, p_reason, v_order.items, v_new_items);

  -- update order
  UPDATE public.orders
  SET items = v_new_items
  WHERE id = v_order.id;

  RETURN QUERY SELECT v_order.id AS order_id, v_new_items AS items;
END;
$$;

COMMIT;
