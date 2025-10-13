-- 1. Trigger function: call the customer-aggregate refresher when orders change
CREATE OR REPLACE FUNCTION trg_fn_refresh_customer_on_order_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- On DELETE we refresh the OLD.customer_id (if present)
  IF (TG_OP = 'DELETE') THEN
    IF OLD.customer_id IS NOT NULL THEN
      PERFORM refresh_customer_aggregates_for(OLD.customer_id);
    END IF;
    RETURN OLD;
  END IF;

  -- INSERT or UPDATE: refresh NEW.customer_id (if present)
  IF (NEW.customer_id IS NOT NULL) THEN
    PERFORM refresh_customer_aggregates_for(NEW.customer_id);
  END IF;

  -- If customer moved from one id to another, refresh the OLD too
  IF (TG_OP = 'UPDATE' AND OLD.customer_id IS NOT NULL AND OLD.customer_id IS DISTINCT FROM NEW.customer_id) THEN
    PERFORM refresh_customer_aggregates_for(OLD.customer_id);
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger: run after INSERT / UPDATE of relevant columns, or DELETE
DROP TRIGGER IF EXISTS trg_orders_refresh_customer ON public.orders;

CREATE TRIGGER trg_orders_refresh_customer
AFTER INSERT OR UPDATE OF payment_status, total, customer_id OR DELETE
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION trg_fn_refresh_customer_on_order_change();
