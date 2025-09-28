
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL,
  totals jsonb NOT NULL,
  customer_details jsonb NOT NULL,
  status text NOT NULL DEFAULT 'NEW',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL,
  assigned_to uuid,
  collected_amount numeric,
  collected_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE,
  phone text UNIQUE,
  role text NOT NULL DEFAULT 'customer',
  password_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders
ADD FOREIGN KEY (assigned_to) REFERENCES users(id);

ALTER TABLE orders
ADD FOREIGN KEY (collected_by) REFERENCES users(id);
