-- Supabase schema additions for Shopee-like merchant coupons with eligibility rules.
-- Run these migrations in your Supabase SQL editor after the base coupon table exists.

-- 1. Add eligibility columns to the existing coupons table.
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS max_discount_amount_thb integer,
  ADD COLUMN IF NOT EXISTS per_customer_max_uses integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS first_time_customer_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS applicable_categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_listing_types text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS stackable boolean DEFAULT false;

-- 2. Track every redemption so we can enforce global + per-customer limits.
CREATE TABLE IF NOT EXISTS coupon_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_customer_id ON coupon_uses(customer_id);

-- 3. Record which coupon was applied to an order and the discount amount.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coupon_discount_thb integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);

-- 4. Helper to count how many times a customer has used a coupon.
CREATE OR REPLACE FUNCTION count_customer_coupon_uses(p_coupon_id uuid, p_customer_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT count(*)::integer
    FROM coupon_uses
    WHERE coupon_id = p_coupon_id AND customer_id = p_customer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper to count total uses of a coupon.
CREATE OR REPLACE FUNCTION count_coupon_uses(p_coupon_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT count(*)::integer
    FROM coupon_uses
    WHERE coupon_id = p_coupon_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper to decide if a customer has ever completed an order (for first-time-only coupons).
CREATE OR REPLACE FUNCTION customer_has_completed_orders(p_customer_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM orders
    WHERE buyer_id = p_customer_id
      AND status NOT IN ('cancelled', 'refunded')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
