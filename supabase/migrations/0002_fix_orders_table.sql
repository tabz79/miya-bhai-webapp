
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS totals jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS customer_details jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'COD',
ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

-- Drop the cart column if it exists
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='orders' AND column_name='cart') THEN
    ALTER TABLE orders DROP COLUMN cart;
  END IF;
END$$;
