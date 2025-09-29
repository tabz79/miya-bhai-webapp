-- 1) Create drivers table if missing
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  vehicle text,
  created_at timestamptz DEFAULT now()
);

-- 2) Create customers table if missing
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);
