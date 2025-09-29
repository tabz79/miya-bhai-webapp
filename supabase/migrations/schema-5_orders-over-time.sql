-- Create function orders_over_time(from_date date, to_date date, interval text)
-- Returns rows: period, orders, revenue
CREATE OR REPLACE FUNCTION public.orders_over_time(
  p_from date,
  p_to date,
  p_interval text DEFAULT 'day'
)
RETURNS TABLE(period timestamptz, orders bigint, revenue numeric)
LANGUAGE sql STABLE AS $$
  WITH bounds AS (
    SELECT
      $1::timestamptz AS from_ts,
      ($2::timestamptz + INTERVAL '1 day' - INTERVAL '1 second') AS to_ts,
      CASE
        WHEN lower($3) IN ('day','d') THEN 'day'
        WHEN lower($3) IN ('week','w') THEN 'week'
        WHEN lower($3) IN ('month','m') THEN 'month'
        ELSE 'day'
      END AS the_interval
  )
  SELECT
    date_trunc(bounds.the_interval, o.created_at) AS period,
    COUNT(*)::bigint AS orders,
    COALESCE(SUM(o.total),0)::numeric(12,2) AS revenue
  FROM public.orders o, bounds
  WHERE o.created_at BETWEEN bounds.from_ts AND bounds.to_ts
  GROUP BY 1
  ORDER BY 1;
$$;
