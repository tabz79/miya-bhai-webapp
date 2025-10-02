
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO settings (key, value) VALUES
('business_info', '{"name": "Miya Bhai", "address": "123 Main St, Anytown, USA", "phone": "555-123-4567", "email": "contact@miyabhai.com"}'),
('orders', '{"tax_gst_enabled": true, "tax_gst_percentage": 18, "service_charge_enabled": false, "service_charge_percentage": 10, "service_charge_value": 0, "minimum_order_amount": 100}'),
('payments', '{"cash_enabled": true, "upi_enabled": true, "card_enabled": true, "default_payment_method": "cash"}'),
('delivery', '{"delivery_radius": 5, "delivery_fee": 50, "free_delivery_threshold": 500}');
