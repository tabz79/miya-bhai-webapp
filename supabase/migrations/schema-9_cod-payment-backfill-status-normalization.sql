BEGIN;

-- 1) Backfill payment_amount for COD orders where it's NULL or zero
UPDATE public.orders
SET payment_amount = total
WHERE payment_method IS NOT NULL
  AND LOWER(payment_method) = 'cod'
  AND (payment_amount IS NULL OR payment_amount = 0)
  AND total IS NOT NULL;

-- 2) Normalize payment_status casing for COD/pending values
UPDATE public.orders
SET payment_status = 'PENDING'
WHERE payment_method IS NOT NULL
  AND LOWER(payment_method) = 'cod'
  AND (payment_status IS NULL OR trim(lower(payment_status)) IN ('pending',''));

-- 3) Optional safe normalization for online payments already marked (do not auto-mark unpaid)
-- Convert common values to uppercase where present
UPDATE public.orders
SET payment_status = UPPER(payment_status)
WHERE payment_status IS NOT NULL
  AND payment_status <> UPPER(payment_status);

COMMIT;
