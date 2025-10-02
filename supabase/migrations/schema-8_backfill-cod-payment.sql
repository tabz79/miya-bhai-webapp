BEGIN;

-- 1) Backfill payment_amount for COD orders where it's NULL
UPDATE public.orders
SET payment_amount = total
WHERE payment_method ILIKE 'COD'
  AND (payment_amount IS NULL OR payment_amount = 0 AND total IS NOT NULL);

-- 2) Normalize payment_status for COD orders to 'PENDING' when missing or empty
UPDATE public.orders
SET payment_status = 'PENDING'
WHERE payment_method ILIKE 'COD'
  AND (payment_status IS NULL OR trim(payment_status) = '');

COMMIT;
