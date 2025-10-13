-- =========================================================================
-- Combined idempotent migration: coupons table + orders columns + RPC + seed
-- Safe to run multiple times. Does NOT DROP data.
-- Paste into a new SQL editor tab and run.
-- =========================================================================

-- ----------------------------
-- 1) Create table if missing
-- ----------------------------
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'flat')),
  value NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- 2) Ensure required columns exist (safe for older tables)
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='id'
  ) THEN
    ALTER TABLE coupons ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='code'
  ) THEN
    ALTER TABLE coupons ADD COLUMN code TEXT NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='type'
  ) THEN
    ALTER TABLE coupons ADD COLUMN type TEXT NOT NULL CHECK (type IN ('percentage', 'flat'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='value'
  ) THEN
    ALTER TABLE coupons ADD COLUMN value NUMERIC NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='is_active'
  ) THEN
    ALTER TABLE coupons ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='max_uses'
  ) THEN
    ALTER TABLE coupons ADD COLUMN max_uses INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='uses_count'
  ) THEN
    ALTER TABLE coupons ADD COLUMN uses_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='starts_at'
  ) THEN
    ALTER TABLE coupons ADD COLUMN starts_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='expires_at'
  ) THEN
    ALTER TABLE coupons ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='created_at'
  ) THEN
    ALTER TABLE coupons ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='coupons' AND column_name='updated_at'
  ) THEN
    ALTER TABLE coupons ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- 3) timestamp trigger function (create/replace safe)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- create trigger if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp'
  ) THEN
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
  END IF;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- 4) CASE-INSENSITIVE UNIQUE INDEX on UPPER(code)
--    but first, check for duplicates (case-insensitive).
--    If duplicates exist, migration will RAISE and you must fix them.
-- -------------------------------------------------------
-- 4a) Check for case-insensitive duplicates. If any exist, raise with details.
DO $$
DECLARE
  dup_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT UPPER(code) AS code_up, COUNT(*) AS cnt
    FROM coupons
    GROUP BY UPPER(code)
    HAVING COUNT(*) > 1
  ) AS t;

  IF dup_count > 0 THEN
    RAISE EXCEPTION '
      Migration aborted: found % case-insensitive coupon code groups with duplicates.
      Run the query to list groups and resolve duplicates before re-running.
      SELECT UPPER(code) AS code_up, array_agg(id) AS ids, COUNT(*) FROM coupons GROUP BY UPPER(code) HAVING COUNT(*) > 1;
    ', dup_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4b) Drop old case-sensitive UNIQUE constraint/index if it exists
DO $$
BEGIN
  -- drop constraint (if created by UNIQUE(code) the constraint name is often coupons_code_key)
  IF EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'coupons_code_key' AND t.relname = 'coupons'
  ) THEN
    ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_code_key;
  END IF;

  -- also drop any index named idx_coupons_code (non-unique expression index) to avoid duplicates
  IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'idx_coupons_code') THEN
    DROP INDEX IF EXISTS idx_coupons_code;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4c) Create unique expression index on UPPER(code) if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename='coupons' AND indexname = 'idx_coupons_code_unique'
  ) THEN
    -- Note: not using CONCURRENTLY because we are inside a DO block.
    -- For very large tables in production consider creating the index with:
    -- CREATE UNIQUE INDEX CONCURRENTLY idx_coupons_code_unique ON coupons (UPPER(code));
    CREATE UNIQUE INDEX idx_coupons_code_unique ON coupons (UPPER(code));
  END IF;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- 5) Uppercase-normalizing trigger (so stored codes are consistent)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION coupons_uppercase_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NOT NULL THEN
    NEW.code := UPPER(NEW.code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'coupons_uppercase_code_tr'
  ) THEN
    CREATE TRIGGER coupons_uppercase_code_tr
    BEFORE INSERT OR UPDATE ON coupons
    FOR EACH ROW
    EXECUTE PROCEDURE coupons_uppercase_code();
  END IF;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- 6) Add coupon columns to orders table (idempotent)
--    (Adds coupon_code TEXT and discount_amount NUMERIC if missing)
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'orders'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='orders' AND column_name='coupon_code'
    ) THEN
      ALTER TABLE orders ADD COLUMN coupon_code TEXT;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='orders' AND column_name='discount_amount'
    ) THEN
      ALTER TABLE orders ADD COLUMN discount_amount NUMERIC;
    END IF;
  ELSE
    -- optionally inform: orders table not present in this DB (maybe different schema name)
    RAISE NOTICE 'Orders table not found; skipping ALTER TABLE orders ...';
  END IF;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- 7) increment_coupon_uses RPC (atomic increment)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET uses_count = COALESCE(uses_count,0) + 1
  WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql;


-- -------------------------------------------------------
-- 8) Optional: seed data (idempotent)
--    Insert sample coupons only if same CODE doesn't already exist.
-- -------------------------------------------------------
INSERT INTO coupons (code, type, value, is_active)
SELECT 'MIYABHAI10', 'percentage', 10, true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER('MIYABHAI10'));

INSERT INTO coupons (code, type, value, is_active)
SELECT 'MIYABHAI50', 'flat', 50, true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE UPPER(code) = UPPER('MIYABHAI50'));

-- -------------------------------------------------------
-- 9) Final sanity check output (informational)
-- -------------------------------------------------------
-- You can run these queries manually after migration to validate state:
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'coupons';
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'coupons'::regclass;
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'coupons';
-- SELECT id, code, uses_count, max_uses FROM coupons LIMIT 20;

-- End of migration
