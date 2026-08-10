-- MaiThing Production Schema Migration
-- Covers all tables, indexes, RLS policies, and RPC functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
-- Covers all tables, indexes, RLS policies, and RPC functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase Auth users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('buyer', 'merchant', 'admin')) DEFAULT 'buyer',
  locale TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{}',
  followed_merchant_notifications UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- MERCHANT ORGS
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchant_orgs_select" ON merchant_orgs FOR SELECT USING (true);
CREATE POLICY "merchant_orgs_update_owner" ON merchant_orgs FOR UPDATE USING (auth.uid() = owner_id);

-- ============================================
-- LOCATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_org_id UUID REFERENCES merchant_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address_line1 TEXT,
  subdistrict TEXT,
  district TEXT,
  province TEXT DEFAULT 'Bangkok',
  postal_code TEXT,
  phone TEXT,
  cuisine_types TEXT[] DEFAULT '{}',
  cover_photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'unverified',
  closed_until TIMESTAMPTZ,
  pickup_instructions TEXT,
  follower_count INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  refund_disputes INTEGER DEFAULT 0,
  avg_rating NUMERIC(2,1) DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  food_safety_cert_url TEXT,
  hygiene_rating NUMERIC(2,1),
  coordinates JSONB,
  geo_point GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_name ON locations USING gin(to_tsvector('english', name));
CREATE INDEX idx_locations_geo_point ON locations USING GIST (geo_point);
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_locations_name ON locations USING gin(to_tsvector('english', name));

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_select" ON locations FOR SELECT USING (true);
CREATE POLICY "locations_update_owner" ON locations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid())
);

-- ============================================
-- MERCHANT BUSINESS HOURS
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  day INTEGER CHECK (day BETWEEN 0 AND 6),
  open TEXT,
  close TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mbh_select" ON merchant_business_hours FOR SELECT USING (true);

-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fulfillment_type TEXT CHECK (fulfillment_type IN ('surprise_bag', 'pick_your_own')) DEFAULT 'surprise_bag',
  price_thb NUMERIC(10,2) NOT NULL,
  original_value_thb NUMERIC(10,2),
  qty_total INTEGER DEFAULT 1,
  qty_remaining INTEGER DEFAULT 1,
  pickup_start TIMESTAMPTZ,
  pickup_end TIMESTAMPTZ,
  photo_urls TEXT[] DEFAULT '{}',
  dietary_tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  box_size TEXT CHECK (box_size IN ('small', 'medium', 'large', 'xl')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_location ON listings(location_id);
CREATE INDEX idx_listings_active ON listings(is_active, qty_remaining);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_select" ON listings FOR SELECT USING (true);
CREATE POLICY "listings_update_merchant" ON listings FOR ALL USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = listings.location_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- LISTING TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS listing_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  original_price NUMERIC(10,2),
  sale_price NUMERIC(10,2),
  quantity INTEGER DEFAULT 1,
  box_size TEXT,
  estimated_retail_value NUMERIC(10,2),
  dietary_tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  pickup_window_duration_hours INTEGER DEFAULT 2,
  auto_expiry BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listing_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lt_select" ON listing_templates FOR SELECT USING (true);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  amount_thb NUMERIC(10,2) NOT NULL,
  platform_fee_thb NUMERIC(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('reserved', 'paid', 'collected', 'cancelled', 'refunded', 'no_show')) DEFAULT 'reserved',
  qr_payload JSONB,
  pickup_start TIMESTAMPTZ,
  pickup_end TIMESTAMPTZ,
  customer_note TEXT,
  cancellation_reason TEXT,
  coupon_id UUID,
  coupon_discount_thb NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_location ON orders(location_id);
CREATE INDEX idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (
  auth.uid() = buyer_id OR EXISTS (
    SELECT 1 FROM locations WHERE locations.id = orders.location_id AND EXISTS (
      SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
    )
  )
);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  merchant_reply TEXT,
  merchant_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_location ON reviews(location_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);

-- ============================================
-- WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance_thb NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_select_own" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- WALLET TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('top_up', 'purchase', 'refund', 'payout', 'top_up_bonus', 'points_earned')),
  amount_thb NUMERIC(10,2),
  description TEXT,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx_select_own" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- WALLET REWARDS
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  points INTEGER DEFAULT 0,
  bonus_balance_thb NUMERIC(10,2) DEFAULT 0,
  lifetime_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallet_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wr_select_own" ON wallet_rewards FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- USER IMPACT
-- ============================================
CREATE TABLE IF NOT EXISTS user_impact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  meals_saved INTEGER DEFAULT 0,
  money_saved_thb NUMERIC(10,2) DEFAULT 0,
  co2_saved_kg NUMERIC(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_impact ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ui_select_own" ON user_impact FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- MERCHANT WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
  balance_thb NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'THB',
  total_earnings NUMERIC(10,2) DEFAULT 0,
  pending_payout NUMERIC(10,2) DEFAULT 0,
  commission_rate NUMERIC(4,2) DEFAULT 0.15,
  last_payout_date TIMESTAMPTZ,
  next_payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mw_select_merchant" ON merchant_wallets FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_wallets.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- PAYOUT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS payout_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  amount_thb NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  method TEXT DEFAULT 'bank_transfer',
  bank_account_id UUID,
  bank_account_name TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payout_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pt_select_merchant" ON payout_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = payout_transactions.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- MERCHANT BANK ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mba_select_merchant" ON merchant_bank_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_bank_accounts.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value NUMERIC(10,2) DEFAULT 0,
  max_discount_amount_thb NUMERIC(10,2),
  min_order_amount NUMERIC(10,2),
  max_uses INTEGER,
  per_customer_max_uses INTEGER,
  first_time_customer_only BOOLEAN DEFAULT false,
  applicable_categories TEXT[],
  applicable_listing_types TEXT[],
  uses_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_select" ON coupons FOR SELECT USING (true);

-- ============================================
-- COUPON USES
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cu_select" ON coupon_uses FOR SELECT USING (true);

-- ============================================
-- MERCHANT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID,
  content TEXT NOT NULL,
  sent_by TEXT CHECK (sent_by IN ('merchant', 'customer')) DEFAULT 'merchant',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mm_merchant_customer ON merchant_messages(merchant_id, customer_id);

ALTER TABLE merchant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mm_select_participants" ON merchant_messages FOR SELECT USING (
  auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM locations WHERE locations.id = merchant_messages.merchant_id AND EXISTS (
      SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
    )
  )
);

-- ============================================
-- MERCHANT STAFF
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT CHECK (role IN ('owner', 'manager', 'staff')) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ,
  permissions TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ms_select_merchant" ON merchant_staff FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_staff.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- MERCHANT NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
  new_orders BOOLEAN DEFAULT true,
  low_stock BOOLEAN DEFAULT true,
  payout_updates BOOLEAN DEFAULT true,
  customer_reviews BOOLEAN DEFAULT true,
  pickup_reminders BOOLEAN DEFAULT true,
  auto_confirm_orders BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mnp_select_merchant" ON merchant_notification_preferences FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_notification_preferences.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- MERCHANT ONBOARDING
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
  completed_steps TEXT[] DEFAULT '{}',
  current_step TEXT DEFAULT 'welcome',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mo_select_merchant" ON merchant_onboarding FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_onboarding.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  ))
);

-- ============================================
-- MERCHANT BROADCASTS
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mb_select" ON merchant_broadcasts FOR SELECT USING (true);

-- ============================================
-- MERCHANT FOLLOWS
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, merchant_id)
);

ALTER TABLE merchant_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mf_select_own" ON merchant_follows FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- MERCHANT FOLLOWER HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_follower_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  UNIQUE(merchant_id, date)
);

ALTER TABLE merchant_follower_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mfh_select" ON merchant_follower_history FOR SELECT USING (true);

-- ============================================
-- USER FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, merchant_id)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uf_select_own" ON user_favorites FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- USER SAVED LISTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS user_saved_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE user_saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usl_select_own" ON user_saved_listings FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- SAVED ADDRESSES
-- ============================================
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  address_line1 TEXT,
  subdistrict TEXT,
  district TEXT,
  province TEXT DEFAULT 'Bangkok',
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sa_select_own" ON saved_addresses FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- RESTOCK ALERTS
-- ============================================
CREATE TABLE IF NOT EXISTS restock_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE restock_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ra_select_own" ON restock_alerts FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWED MERCHANT NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS followed_merchant_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, merchant_id)
);

ALTER TABLE followed_merchant_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fmn_select_own" ON followed_merchant_notifications FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- USER PERSONALITY
-- ============================================
CREATE TABLE IF NOT EXISTS user_personality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  dietary_preferences TEXT[] DEFAULT '{}',
  price_range TEXT DEFAULT 'any',
  preferred_categories TEXT[] DEFAULT '{}',
  discovery_style TEXT DEFAULT 'explore',
  environmental_motivation TEXT DEFAULT 'medium',
  pickup_time_preference TEXT DEFAULT 'any',
  max_distance_km NUMERIC(5,1) DEFAULT 10,
  notification_style TEXT DEFAULT 'all',
  favorite_merchants UUID[] DEFAULT '{}',
  order_patterns JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_personality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "up_select_own" ON user_personality FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "up_update_own" ON user_personality FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "up_insert_own" ON user_personality FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MERCHANT PERSONALITY
-- ============================================
CREATE TABLE IF NOT EXISTS merchant_personality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES locations(id) ON DELETE CASCADE UNIQUE,
  brand_voice TEXT DEFAULT 'friendly',
  sustainability_focus TEXT DEFAULT 'medium',
  community_engagement TEXT DEFAULT 'medium',
  customer_communication TEXT DEFAULT 'responsive',
  story TEXT,
  values TEXT[] DEFAULT '{}',
  auto_welcome_message TEXT,
  pickup_personality TEXT DEFAULT 'standard',
  packaging_style TEXT DEFAULT 'standard',
  social_links JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE merchant_personality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_select_merchant" ON merchant_personality FOR SELECT USING (
  EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_personality.merchant_id AND EXISTS (
    SELECT 1 FROM merchant_orgs WHERE merchant_orgs.id = locations.merchant_org_id AND merchant_orgs.owner_id = auth.uid()
  )) OR EXISTS (SELECT 1 FROM locations WHERE locations.id = merchant_personality.merchant_id)
);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION increment_follower_count(merchant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE locations SET follower_count = follower_count + 1 WHERE id = merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_follower_count(merchant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE locations SET follower_count = GREATEST(0, follower_count - 1) WHERE id = merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_coupon_uses(p_coupon_id UUID)
RETURNS INTEGER AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM coupon_uses WHERE coupon_id = p_coupon_id;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION count_customer_coupon_uses(p_coupon_id UUID, p_customer_id UUID)
RETURNS INTEGER AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM coupon_uses WHERE coupon_id = p_coupon_id AND customer_id = p_customer_id;
  RETURN cnt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION customer_has_completed_orders(p_customer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_orders BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM orders WHERE buyer_id = p_customer_id AND status IN ('paid', 'collected')
  ) INTO has_orders;
  RETURN has_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name', NEW.email, 'buyer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- POSTGIS NEARBY LOCATIONS RPC
-- ============================================

CREATE OR REPLACE FUNCTION nearby_locations(lat float, lng float, radius_meters int)
RETURNS TABLE (
  id UUID,
  merchant_org_id UUID,
  name TEXT,
  description TEXT,
  address_line1 TEXT,
  subdistrict TEXT,
  district TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  cuisine_types TEXT[],
  cover_photo_url TEXT,
  is_active BOOLEAN,
  is_verified BOOLEAN,
  verification_status TEXT,
  closed_until TIMESTAMPTZ,
  pickup_instructions TEXT,
  follower_count INTEGER,
  completed_orders INTEGER,
  refund_disputes INTEGER,
  avg_rating NUMERIC,
  total_reviews INTEGER,
  food_safety_cert_url TEXT,
  hygiene_rating NUMERIC,
  coordinates JSONB,
  geo_point GEOGRAPHY,
  created_at TIMESTAMPTZ,
  distance_meters float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.merchant_org_id,
    l.name,
    l.description,
    l.address_line1,
    l.subdistrict,
    l.district,
    l.province,
    l.postal_code,
    l.phone,
    l.cuisine_types,
    l.cover_photo_url,
    l.is_active,
    l.is_verified,
    l.verification_status,
    l.closed_until,
    l.pickup_instructions,
    l.follower_count,
    l.completed_orders,
    l.refund_disputes,
    l.avg_rating,
    l.total_reviews,
    l.food_safety_cert_url,
    l.hygiene_rating,
    l.coordinates,
    l.geo_point,
    l.created_at,
    ST_Distance(l.geo_point, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography)::float AS distance_meters
  FROM locations l
  WHERE l.is_active = true
    AND l.geo_point IS NOT NULL
    AND ST_DWithin(
      l.geo_point,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- updated_at AUTOMATIC TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers to all tables with updated_at column

-- merchant_wallets needs updated_at added first
ALTER TABLE merchant_wallets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS listings_updated_at ON listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS wallet_rewards_updated_at ON wallet_rewards;
CREATE TRIGGER wallet_rewards_updated_at
  BEFORE UPDATE ON wallet_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_impact_updated_at ON user_impact;
CREATE TRIGGER user_impact_updated_at
  BEFORE UPDATE ON user_impact
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS merchant_wallets_updated_at ON merchant_wallets;
CREATE TRIGGER merchant_wallets_updated_at
  BEFORE UPDATE ON merchant_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS merchant_onboarding_updated_at ON merchant_onboarding;
CREATE TRIGGER merchant_onboarding_updated_at
  BEFORE UPDATE ON merchant_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS merchant_personality_updated_at ON merchant_personality;
CREATE TRIGGER merchant_personality_updated_at
  BEFORE UPDATE ON merchant_personality
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_personality_updated_at ON user_personality;
CREATE TRIGGER user_personality_updated_at
  BEFORE UPDATE ON user_personality
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
