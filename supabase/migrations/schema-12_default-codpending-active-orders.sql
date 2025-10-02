BEGIN;

UPDATE public.orders
SET
  payment_method = COALESCE(payment_method, 'COD'),
  payment_status = COALESCE(NULLIF(payment_status, ''), 'PENDING'),
  payment_amount = COALESCE(payment_amount, total)
WHERE payment_method IS NULL
  AND (payment_amount IS NOT NULL OR total IS NOT NULL)
  AND status IN ('NEW','ACCEPTED','OUT_FOR_DELIVERY');

COMMIT;
BEGIN;

UPDATE public.orders
SET
  payment_method = COALESCE(payment_method, 'COD'),
  payment_status = 'PAID',
  payment_amount = COALESCE(payment_amount, total)
WHERE (payment_method IS NULL OR payment_method = '')
  AND status = 'COMPLETED'
  AND (payment_amount IS NOT NULL OR total IS NOT NULL);

COMMIT;
