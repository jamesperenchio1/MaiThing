-- Full Supabase schema for the new Shopee-like coupon system.
-- Run this in your Supabase SQL editor or via `supabase db query --linked --file docs/supabase-coupons-full.sql`.

-- 1. Coupons table (matches the app's supabase repository expectations).
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL DEFAULT 0,
  max_discount_amount_thb integer,
  min_order_amount integer,
  max_uses integer,
  per_customer_max_uses integer DEFAULT 1,
  first_time_customer_only boolean DEFAULT false,
  applicable_categories text[] DEFAULT '{}',
  applicable_listing_types text[] DEFAULT '{}',
  stackable boolean DEFAULT false,
  uses_count integer NOT NULL DEFAULT 0,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'expired')) DEFAULT 'active',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_coupons_merchant_id ON coupons(merchant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

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
