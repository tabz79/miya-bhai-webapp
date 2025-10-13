ALTER TABLE public.orders
ADD COLUMN payable_amount numeric(12,2) NOT NULL DEFAULT 0;
