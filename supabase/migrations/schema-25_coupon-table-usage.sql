-- Safe idempotent migration for coupons table and helpers
-- Run anywhere — it will not drop data.

-- 1) Create table if it doesn't exist
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

-- 2) Ensure required columns exist (safe for tables created earlier with missing columns)
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

-- 3) Create or replace the timestamp trigger function (safe to run multiple times)
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Create trigger only if it doesn't exist
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

-- 5) Drop case-sensitive unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'coupons_code_key'
  ) THEN
    ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_code_key;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6) Create UNIQUE index on UPPER(code) (case-insensitive uniqueness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_coupons_code_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_coupons_code_unique ON coupons (UPPER(code));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 7) Optional: Force all codes to uppercase on insert/update
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
