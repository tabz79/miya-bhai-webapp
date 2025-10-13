-- 1) Redemption tracking table
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- replace type if your user PK is different (e.g., text)
  order_id UUID,         -- optional, store order that used it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (coupon_id, user_id)  -- guarantees one redemption per user per coupon
);

-- 2) Atomic RPC: validate + insert redemption + increment uses_count
CREATE OR REPLACE FUNCTION redeem_coupon_for_user(
  p_coupon_id UUID,
  p_user_id UUID,
  p_order_id UUID DEFAULT NULL
)
RETURNS TABLE(ok boolean, message text, uses_count integer) AS $$
DECLARE
  c RECORD;
BEGIN
  -- lock coupon row
  SELECT * INTO c
  FROM coupons
  WHERE id = p_coupon_id
  FOR UPDATE;

  IF NOT FOUND THEN
    ok := false; message := 'coupon_not_found'; uses_count := NULL; RETURN;
  END IF;

  IF NOT c.is_active THEN
    ok := false; message := 'coupon_inactive'; uses_count := c.uses_count; RETURN;
  END IF;

  IF c.expires_at IS NOT NULL AND c.expires_at < NOW() THEN
    ok := false; message := 'coupon_expired'; uses_count := c.uses_count; RETURN;
  END IF;

  IF c.max_uses IS NOT NULL AND COALESCE(c.uses_count,0) >= c.max_uses THEN
    ok := false; message := 'max_uses_reached'; uses_count := c.uses_count; RETURN;
  END IF;

  -- check if this user already redeemed
  IF EXISTS (SELECT 1 FROM coupon_redemptions WHERE coupon_id = p_coupon_id AND user_id = p_user_id) THEN
    ok := false; message := 'already_redeemed_by_user'; SELECT uses_count INTO uses_count FROM coupons WHERE id = p_coupon_id; RETURN;
  END IF;

  -- insert redemption
  INSERT INTO coupon_redemptions (coupon_id, user_id, order_id) VALUES (p_coupon_id, p_user_id, p_order_id);

  -- increment coupon uses
  UPDATE coupons
  SET uses_count = COALESCE(uses_count,0) + 1, updated_at = NOW()
  WHERE id = p_coupon_id
  RETURNING uses_count INTO uses_count;

  ok := true; message := 'ok';
  RETURN;
END;
$$ LANGUAGE plpgsql;
