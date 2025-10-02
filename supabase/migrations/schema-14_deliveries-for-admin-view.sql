CREATE OR REPLACE VIEW public.deliveries_for_admin AS
SELECT
    o.id::text AS order_id,
    COALESCE(
        o.order_number,
        'MB-' || TO_CHAR(o.created_at, 'YYYYMMDD') || '-' ||
        SUBSTRING(REPLACE(o.id::text, '-', ''), 1, 8)
    ) AS order_number,
    o.status::text AS status,
    o.assigned_to::text AS driver_id,
    d.name::text AS driver_name,
    COALESCE(NULLIF(o.payment_method, ''), 'COD') AS payment_method,
    COALESCE(NULLIF(o.payment_status, ''), 'PENDING') AS payment_status,
    COALESCE(o.payment_amount, o.total) AS payment_amount,
    o.total::numeric AS total,
    c.name::text AS customer_name,
    o.created_at
FROM public.orders o
LEFT JOIN public.drivers d ON d.id::text = o.assigned_to::text
LEFT JOIN public.customers c ON c.id = o.customer_id;
