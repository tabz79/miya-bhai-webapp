CREATE OR REPLACE FUNCTION public.admin_summary()
RETURNS TABLE(
  orders_count bigint,
  revenue_total numeric,
  pending_count bigint,
  completed_count bigint,
  other_status jsonb,
  last_updated timestamptz
)
LANGUAGE sql STABLE AS $$
  WITH status_counts AS (
    SELECT status, COUNT(*)::bigint AS cnt
    FROM public.orders
    GROUP BY status
  )
  SELECT
    (SELECT COUNT(*) FROM public.orders)::bigint AS orders_count,
    COALESCE((SELECT SUM(total) FROM public.orders), 0)::numeric(12,2) AS revenue_total,
    COALESCE((SELECT cnt FROM status_counts WHERE status = 'PENDING'), 0)::bigint AS pending_count,
    COALESCE((SELECT cnt FROM status_counts WHERE status = 'COMPLETED'), 0)::bigint AS completed_count,
    -- other statuses as jsonb (exclude PENDING and COMPLETED)
    (
      SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::jsonb)
      FROM status_counts
      WHERE status NOT IN ('PENDING','COMPLETED')
    )::jsonb AS other_status,
    now() AS last_updated;
$$;
