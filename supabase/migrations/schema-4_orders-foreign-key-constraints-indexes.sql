-- FK: orders.assigned_to -> drivers(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'orders'
      AND kcu.column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT fk_orders_assigned_to_drivers
      FOREIGN KEY (assigned_to) REFERENCES public.drivers(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- FK: orders.customer_id -> customers(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'orders'
      AND kcu.column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT fk_orders_customer_id_customers
      FOREIGN KEY (customer_id) REFERENCES public.customers(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON public.orders (assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders (payment_method);
