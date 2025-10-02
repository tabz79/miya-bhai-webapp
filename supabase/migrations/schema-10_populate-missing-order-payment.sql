BEGIN;

-- 1) Heuristic: fill missing payment_method/payment_status for active orders (assume COD)
UPDATE public.orders
SET
  payment_method  = 'COD',
  payment_status  = 'PENDING',
  payment_amount  = COALESCE(payment_amount, total)
WHERE payment_method IS NULL
  AND (payment_amount IS NOT NULL OR total IS NOT NULL)
  AND status IN ('NEW', 'ACCEPTED', 'OUT_FOR_DELIVERY');

-- 2) For completed orders: if you want to mark them as collected (PAID), run the optional block below.
-- NOTE: run this only if you are confident completed COD orders were collected.
COMMIT;

BEGIN;

-- OPTIONAL: mark completed COD orders as PAID
UPDATE public.orders
SET
  payment_method = COALESCE(payment_method, 'COD'),
  payment_status = 'PAID',
  payment_amount = COALESCE(payment_amount, total)
WHERE (payment_method IS NULL OR LOWER(payment_method) = '')
  AND status = 'COMPLETED'
  AND (payment_amount IS NOT NULL OR total IS NOT NULL);

COMMIT;
