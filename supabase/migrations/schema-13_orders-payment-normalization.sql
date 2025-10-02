-- Backfill payment fields in orders (no meta column)

-- Ensure payment_method is never NULL or empty (default COD)
UPDATE public.orders
SET payment_method = COALESCE(NULLIF(payment_method, ''), 'COD')
WHERE payment_method IS NULL OR payment_method = '';

-- Ensure payment_status is never NULL or empty (default PENDING)
UPDATE public.orders
SET payment_status = COALESCE(NULLIF(payment_status, ''), 'PENDING')
WHERE payment_status IS NULL OR payment_status = '';

-- Ensure payment_amount is never NULL (fallback to total)
UPDATE public.orders
SET payment_amount = COALESCE(payment_amount, total)
WHERE payment_amount IS NULL;

-- Normalize payment_status casing (optional)
UPDATE public.orders
SET payment_status = UPPER(payment_status)
WHERE payment_status IS NOT NULL AND payment_status <> UPPER(payment_status);
