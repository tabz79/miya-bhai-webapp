-- ONE FILE (fixed): install helpers, trigger, and run a batched backfill
-- Paste the entire file into Supabase SQL editor and RUN once.

-- ================================================
-- 0) Extensions (best-effort)
-- ================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1) Safe schema fixes (idempotent)
-- ================================================
-- add legacy_cart
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS legacy_cart jsonb;

-- copy old cart -> legacy_cart if present (best-effort)
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
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping copy cart->legacy_cart due to error: %', SQLERRM;
END
$$;

-- try drop cart if exists (non-fatal)
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

-- ensure core columns
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS customer_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'COD',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cart_id text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS total numeric;

-- backfill numeric total from totals JSON (NULLs only)
UPDATE public.orders
SET total = CASE
  WHEN total IS NULL AND jsonb_typeof(totals) = 'object' AND (totals->>'total') IS NOT NULL
    THEN (totals->>'total')::numeric
  WHEN total IS NULL
    THEN 0
  ELSE total
END
WHERE total IS NULL;

ALTER TABLE IF EXISTS public.orders
  ALTER COLUMN total SET DEFAULT 0;

-- add items-not-empty constraint only if all rows comply
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
      RAISE NOTICE 'Added orders_items_not_empty constraint.';
    ELSE
      RAISE NOTICE 'Skipped adding orders_items_not_empty constraint because existing rows do not comply. Clean rows first.';
    END IF;
  END IF;
END
$$;

-- index for cart_id
CREATE INDEX IF NOT EXISTS idx_orders_cart_id ON public.orders (cart_id);

-- updated_at trigger/function (idempotent)
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
    RAISE NOTICE 'Created set_updated_at function.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_set_updated_at'
  ) THEN
    CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
    RAISE NOTICE 'Created orders_set_updated_at trigger.';
  END IF;
END
$$;

-- ================================================
-- 2) Audit table for GST patches (idempotent)
-- ================================================
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

-- ================================================
-- 3) Helper: derive percent from order totals
-- ================================================
CREATE OR REPLACE FUNCTION public._derive_order_gst_percent(order_gst numeric, order_taxable numeric)
RETURNS numeric
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    CASE
      WHEN order_gst IS NULL OR order_taxable IS NULL OR order_taxable = 0 THEN NULL
      ELSE ROUND( (order_gst / order_taxable * 100)::numeric, 2 )
    END;
$$;

-- ================================================
-- 4) Preview function (safe)
-- ================================================
-- Drop + create to avoid signature conflicts
DROP FUNCTION IF EXISTS public.preview_order_gst_patch(uuid);
CREATE OR REPLACE FUNCTION public.preview_order_gst_patch(p_order_id uuid)
RETURNS TABLE (
  order_id uuid,
  order_gst numeric,
  order_taxable numeric,
  derived_percent numeric,
  preview_items jsonb
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH order_meta AS (
    SELECT o.id AS order_id,
           (CASE WHEN o.totals ? 'gst' THEN (o.totals->>'gst')::numeric ELSE NULL END) AS order_gst,
           (CASE WHEN o.totals ? 'taxableAmount' THEN (o.totals->>'taxableAmount')::numeric ELSE NULL END) AS order_taxable,
           o.items
    FROM public.orders o
    WHERE o.id = p_order_id
  )
  SELECT
    om.order_id,
    om.order_gst,
    om.order_taxable,
    public._derive_order_gst_percent(om.order_gst, om.order_taxable) AS derived_percent,
    COALESCE(jsonb_agg(
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
              to_jsonb( (COALESCE((item->>'unitPrice')::numeric, (item->'meta'->>'price')::numeric, 0)
                         * COALESCE((item->>'qty')::numeric, (item->'meta'->>'quantity')::numeric, 1))::numeric ),
              true
            ),
            '{itemGstAmount}',
            to_jsonb( ROUND( ((COALESCE((item->>'unitPrice')::numeric, (item->'meta'->>'price')::numeric, 0)
                               * COALESCE((item->>'qty')::numeric, (item->'meta'->>'quantity')::numeric, 1))
                             * (public._derive_order_gst_percent(om.order_gst, om.order_taxable)/100.0))::numeric, 2) ),
            true
          )
      END
    ), '[]'::jsonb) AS preview_items
  FROM order_meta om
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(om.items,'[]'::jsonb)) AS arr(item)
  GROUP BY om.order_id, om.order_gst, om.order_taxable;
END;
$$;

-- ================================================
-- 5) Apply function (safe, idempotent, audited)
-- ================================================
DROP FUNCTION IF EXISTS public.apply_order_gst_patch(uuid, text);
CREATE OR REPLACE FUNCTION public.apply_order_gst_patch(p_order_id uuid, p_reason text DEFAULT 'single-order-enhanced-patch')
RETURNS TABLE (order_id uuid, items jsonb)
LANGUAGE plpgsql AS $$
DECLARE
  v_order_id uuid;
  v_order_gst numeric;
  v_order_taxable numeric;
  v_items jsonb;
  v_new_items jsonb;
  v_derived numeric;
BEGIN
  SELECT o.id, 
         (CASE WHEN o.totals ? 'gst' THEN (o.totals->>'gst')::numeric ELSE NULL END),
         (CASE WHEN o.totals ? 'taxableAmount' THEN (o.totals->>'taxableAmount')::numeric ELSE NULL END),
         o.items
  INTO v_order_id, v_order_gst, v_order_taxable, v_items
  FROM public.orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  v_derived := public._derive_order_gst_percent(v_order_gst, v_order_taxable);

  IF v_derived IS NULL THEN
    RETURN QUERY SELECT v_order_id, v_items;
    RETURN;
  END IF;

  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN (itm->>'gstPercent') IS NOT NULL AND (itm->>'gstPercent') <> '0'
           AND (itm ? 'itemTaxable') AND (itm ? 'itemGstAmount') THEN itm
      ELSE
        jsonb_set(
          jsonb_set(
            jsonb_set(
              itm,
              '{gstPercent}',
              to_jsonb(v_derived),
              true
            ),
            '{itemTaxable}',
            to_jsonb( (COALESCE((itm->>'unitPrice')::numeric, (itm->'meta'->>'price')::numeric, 0)
                       * COALESCE((itm->>'qty')::numeric, (itm->'meta'->>'quantity')::numeric, 1))::numeric ),
            true
          ),
          '{itemGstAmount}',
          to_jsonb( ROUND( ((COALESCE((itm->>'unitPrice')::numeric, (itm->'meta'->>'price')::numeric, 0)
                             * COALESCE((itm->>'qty')::numeric, (itm->'meta'->>'quantity')::numeric, 1))
                           * (v_derived/100.0))::numeric, 2) ),
          true
        )
    END
  ), '[]'::jsonb) INTO v_new_items
  FROM jsonb_array_elements(COALESCE(v_items, '[]'::jsonb)) AS arr(itm);

  IF v_new_items IS NULL OR v_new_items = COALESCE(v_items, '[]'::jsonb) THEN
    RETURN QUERY SELECT v_order_id, v_items;
    RETURN;
  END IF;

  INSERT INTO public.gst_patch_audit (order_id, reason, items_before, items_after)
  VALUES (v_order_id, p_reason, COALESCE(v_items, '[]'::jsonb), v_new_items);

  UPDATE public.orders
  SET items = v_new_items
  WHERE id = v_order_id;

  RETURN QUERY SELECT v_order_id, v_new_items;
END;
$$;

-- ================================================
-- 6) Trigger to auto-fill item GST on INSERT/UPDATE (automates future orders)
-- ================================================
CREATE OR REPLACE FUNCTION public.orders_set_items_gst_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
  v_order_gst numeric;
  v_order_taxable numeric;
  v_pct numeric;
  v_items jsonb;
  v_new_items jsonb;
BEGIN
  v_order_gst := CASE WHEN (NEW.totals IS NOT NULL AND NEW.totals ? 'gst') THEN (NEW.totals->>'gst')::numeric ELSE NULL END;
  v_order_taxable := CASE WHEN (NEW.totals IS NOT NULL AND NEW.totals ? 'taxableAmount') THEN (NEW.totals->>'taxableAmount')::numeric ELSE NULL END;
  v_pct := public._derive_order_gst_percent(v_order_gst, v_order_taxable);

  IF v_pct IS NULL THEN
    RETURN NEW;
  END IF;

  v_items := COALESCE(NEW.items, '[]'::jsonb);

  SELECT COALESCE(jsonb_agg(
    CASE
      WHEN (itm->>'gstPercent') IS NOT NULL AND (itm->>'gstPercent') <> '0'
           AND (itm ? 'itemTaxable') AND (itm ? 'itemGstAmount') THEN itm
      ELSE
        jsonb_set(
          jsonb_set(
            jsonb_set(
              itm,
              '{gstPercent}',
              to_jsonb(v_pct),
              true
            ),
            '{itemTaxable}',
            to_jsonb( (COALESCE((itm->>'unitPrice')::numeric, (itm->'meta'->>'price')::numeric, 0)
                       * COALESCE((itm->>'qty')::numeric, (itm->'meta'->>'quantity')::numeric, 1))::numeric ),
            true
          ),
          '{itemGstAmount}',
          to_jsonb( ROUND( ((COALESCE((itm->>'unitPrice')::numeric, (itm->'meta'->>'price')::numeric, 0)
                             * COALESCE((itm->>'qty')::numeric, (itm->'meta'->>'quantity')::numeric, 1))
                           * (v_pct/100.0))::numeric, 2) ),
          true
        )
    END
  ), '[]'::jsonb) INTO v_new_items
  FROM jsonb_array_elements(v_items) AS arr(itm);

  IF v_new_items IS NOT NULL AND v_new_items <> v_items THEN
    NEW.items := v_new_items;
  END IF;

  RETURN NEW;
END;
$$;

-- attach trigger (replace existing safely)
DROP TRIGGER IF EXISTS orders_set_items_gst_trigger ON public.orders;
CREATE TRIGGER orders_set_items_gst_trigger
BEFORE INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.orders_set_items_gst_trigger();

-- wrap final notices in DO blocks to avoid top-level RAISE errors
DO $$
BEGIN
  RAISE NOTICE 'Trigger installed to auto-fill items gstPercent/itemTaxable/itemGstAmount on INSERT/UPDATE.';
END
$$;

-- ================================================
-- 7) Optional: Batched backfill for historical orders (resumable, idempotent)
-- This block will loop until no more candidate orders remain.
-- Tune v_batch_size if you want smaller/larger batches.
-- ================================================
DO $$
DECLARE
  v_batch_size integer := 200; -- tune this (200 is a reasonable default)
  v_done boolean := false;
  v_count integer;
  r record;
BEGIN
  RAISE NOTICE 'Starting batched backfill (batch_size=%). This may take some time depending on DB size.', v_batch_size;

  LOOP
    v_count := 0;
    FOR r IN
      SELECT id
      FROM public.orders
      WHERE (totals->>'gst') IS NOT NULL
        AND (totals->>'taxableAmount') IS NOT NULL
        AND (
          items::text LIKE '%"gstPercent":0%' OR items::text NOT LIKE '%gstPercent%'
        )
      ORDER BY created_at NULLS LAST
      LIMIT v_batch_size
    LOOP
      BEGIN
        PERFORM public.apply_order_gst_patch(r.id, 'batch-backfill');
        v_count := v_count + 1;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Failed to patch order %: %', r.id, SQLERRM;
        -- continue to next order
      END;
    END LOOP;

    IF v_count = 0 THEN
      RAISE NOTICE 'No more candidate orders to patch. Backfill complete.';
      EXIT;
    ELSE
      RAISE NOTICE 'Patched % orders in this batch. Looping again...', v_count;
      -- small pause optional; omitted here to keep script moving
    END IF;
  END LOOP;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE 'All done: setup + trigger + batched backfill attempted.';
END
$$;

-- End of file
