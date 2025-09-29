-- Add assigned_to (nullable, type uuid for future driver linking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='assigned_to'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN assigned_to uuid;
  END IF;
END;
$$;

-- Add customer_id (nullable, type uuid for future customer linking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='orders' AND column_name='customer_id'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN customer_id uuid;
  END IF;
END;
$$;
