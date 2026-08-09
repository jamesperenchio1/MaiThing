-- ========================================================================
-- Maithing Production Schema
-- Supabase Postgres with RLS, indexes, triggers, RPC functions
-- ========================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================================
-- Helper: updated_at trigger
-- ========================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- Helper: auto-create profile on auth.user creation
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, roles, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    ARRAY['customer'],
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================================
-- 1. PROFILES (extends auth.users)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  roles TEXT[] NOT NULL DEFAULT ARRAY['customer'],
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_roles ON public.profiles USING GIN(roles);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile trigger (safety net)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 2. MERCHANT ORGS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_orgs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_merchant_orgs_name ON public.merchant_orgs(name);

ALTER TABLE public.merchant_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant orgs are viewable by everyone"
  ON public.merchant_orgs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create merchant orgs"
  ON public.merchant_orgs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE TRIGGER set_merchant_orgs_updated_at
  BEFORE UPDATE ON public.merchant_orgs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 3. LOCATIONS (merchant storefronts)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  merchant_org_id UUID REFERENCES public.merchant_orgs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  address JSONB DEFAULT '{}',
  coordinates JSONB DEFAULT '{"latitude":0,"longitude":0}',
  phone TEXT DEFAULT '',
  categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  business_hours JSONB DEFAULT '[]',
  is_open BOOLEAN DEFAULT true,
  closed_until TIMESTAMPTZ,
  pickup_instructions TEXT,
  followers INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'unverified',
  completed_orders INTEGER DEFAULT 0,
  refund_disputes INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  hygiene_rating NUMERIC(3,2),
  food_safety_cert_url TEXT,
  revenue_goal INTEGER,
  last_follower_milestone INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_owner ON public.locations(owner_id);
CREATE INDEX idx_locations_org ON public.locations(merchant_org_id);
CREATE INDEX idx_locations_slug ON public.locations(slug);
CREATE INDEX idx_locations_categories ON public.locations USING GIN(categories);
CREATE INDEX idx_locations_coords ON public.locations USING GIN(coordinates);
CREATE INDEX idx_locations_verified ON public.locations(is_verified) WHERE is_verified = true;
CREATE INDEX idx_locations_name ON public.locations USING gin(name gin_trgm_ops);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Locations are viewable by everyone"
  ON public.locations FOR SELECT USING (true);

CREATE POLICY "Owners can update their locations"
  ON public.locations FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create locations"
  ON public.locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE TRIGGER set_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 4. LISTINGS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fulfillment_type TEXT NOT NULL DEFAULT 'surprise_bag',
  category TEXT,
  price_thb INTEGER NOT NULL DEFAULT 0,
  original_value_thb INTEGER DEFAULT 0,
  qty_total INTEGER NOT NULL DEFAULT 0,
  qty_remaining INTEGER NOT NULL DEFAULT 0,
  pickup_start TIMESTAMPTZ,
  pickup_end TIMESTAMPTZ,
  photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  dietary_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  flash_sale_price INTEGER,
  flash_sale_ends_at TIMESTAMPTZ,
  auto_delist_when_sold_out BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  search_appearances INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_location ON public.listings(location_id);
CREATE INDEX idx_listings_active ON public.listings(is_active) WHERE is_active = true;
CREATE INDEX idx_listings_category ON public.listings(category);
CREATE INDEX idx_listings_price ON public.listings(price_thb);
CREATE INDEX idx_listings_pickup ON public.listings(pickup_start, pickup_end);
CREATE INDEX idx_listings_name ON public.listings USING gin(name gin_trgm_ops);

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Listings are viewable by everyone"
  ON public.listings FOR SELECT USING (true);

CREATE POLICY "Location owners can manage their listings"
  ON public.listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.locations l
      WHERE l.id = location_id AND l.owner_id = auth.uid()
    )
  );

CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 5. LISTING TEMPLATES
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.listing_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mystery_box',
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  original_price INTEGER DEFAULT 0,
  sale_price INTEGER DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  box_size TEXT,
  estimated_retail_value INTEGER,
  dietary_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  pickup_window_duration_hours NUMERIC(4,1) DEFAULT 2,
  auto_expiry BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_templates_merchant ON public.listing_templates(merchant_id);

ALTER TABLE public.listing_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are viewable by everyone"
  ON public.listing_templates FOR SELECT USING (true);

CREATE POLICY "Location owners can manage templates"
  ON public.listing_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.locations l
      WHERE l.id = merchant_id AND l.owner_id = auth.uid()
    )
  );

CREATE TRIGGER set_listing_templates_updated_at
  BEFORE UPDATE ON public.listing_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ========================================================================
-- 6. ORDERS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  amount_thb INTEGER NOT NULL DEFAULT 0,
  platform_fee_thb INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'reserved',
  qr_payload TEXT DEFAULT '{}',
  pickup_start TIMESTAMPTZ,
  pickup_end TIMESTAMPTZ,
  customer_note TEXT,
  coupon_id UUID,
  coupon_discount_thb INTEGER DEFAULT 0,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_location ON public.orders(location_id);
CREATE INDEX idx_orders_listing ON public.orders(listing_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = buyer_id OR EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.owner_id = auth.uid()
  ));

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Owners can update orders for their location"
  ON public.orders FOR UPDATE
  USING (auth.uid() = buyer_id OR EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.owner_id = auth.uid()
  ));

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 7. ORDER ITEMS (future-proof multi-item support)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_listing ON public.order_items(listing_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items follow order visibility"
  ON public.order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.locations l WHERE l.id = o.location_id AND l.owner_id = auth.uid()
    ))
  ));

-- ========================================================================
-- 8. WALLETS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance_thb INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own wallet"
  ON public.wallets FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER set_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 9. WALLET TRANSACTIONS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'purchase',
  amount_thb INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wallet_txn_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX idx_wallet_txn_order ON public.wallet_transactions(order_id);
CREATE INDEX idx_wallet_txn_type ON public.wallet_transactions(type);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own transactions"
  ON public.wallet_transactions FOR ALL USING (auth.uid() = user_id);

-- ========================================================================
-- 10. WALLET REWARDS (points + bonus)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.wallet_rewards (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  bonus_balance_thb INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallet_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own rewards"
  ON public.wallet_rewards FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER set_wallet_rewards_updated_at
  BEFORE UPDATE ON public.wallet_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 11. NOTIFICATIONS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own notifications"
  ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ========================================================================
-- 12. USER IMPACT (environmental stats)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.user_impact (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  meals_saved INTEGER NOT NULL DEFAULT 0,
  money_saved_thb INTEGER NOT NULL DEFAULT 0,
  co2_saved_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own impact"
  ON public.user_impact FOR ALL USING (auth.uid() = user_id);

-- ========================================================================
-- 13. MERCHANT FOLLOWER HISTORY
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_follower_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(merchant_id, date)
);

CREATE INDEX idx_follower_history_merchant ON public.merchant_follower_history(merchant_id, date);

ALTER TABLE public.merchant_follower_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follower history is public"
  ON public.merchant_follower_history FOR SELECT USING (true);

-- ========================================================================
-- 14. MERCHANT WALLETS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_wallets (
  merchant_id UUID PRIMARY KEY REFERENCES public.locations(id) ON DELETE CASCADE,
  balance_thb INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB',
  total_earnings INTEGER NOT NULL DEFAULT 0,
  pending_payout INTEGER NOT NULL DEFAULT 0,
  commission_rate NUMERIC(4,3) NOT NULL DEFAULT 0.15,
  last_payout_date TIMESTAMPTZ,
  next_payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.merchant_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant wallets visible to owner"
  ON public.merchant_wallets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

CREATE TRIGGER set_merchant_wallets_updated_at
  BEFORE UPDATE ON public.merchant_wallets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 15. PAYOUT TRANSACTIONS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.payout_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  amount_thb INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_account_id TEXT,
  bank_account_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payout_merchant ON public.payout_transactions(merchant_id, created_at DESC);
CREATE INDEX idx_payout_status ON public.payout_transactions(status);

ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payouts visible to merchant owner"
  ON public.payout_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

-- ========================================================================
-- 16. MERCHANT BANK ACCOUNTS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_merchant ON public.merchant_bank_accounts(merchant_id);

ALTER TABLE public.merchant_bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bank accounts visible to merchant owner"
  ON public.merchant_bank_accounts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

CREATE TRIGGER set_bank_accounts_updated_at
  BEFORE UPDATE ON public.merchant_bank_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ========================================================================
-- 17. COUPONS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value INTEGER NOT NULL DEFAULT 0,
  max_discount_amount_thb INTEGER,
  min_order_amount INTEGER DEFAULT 0,
  max_uses INTEGER,
  per_customer_max_uses INTEGER DEFAULT 1,
  first_time_customer_only BOOLEAN DEFAULT false,
  applicable_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  applicable_listing_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(merchant_id, code)
);

CREATE INDEX idx_coupons_merchant ON public.coupons(merchant_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_status ON public.coupons(status) WHERE status = 'active';
CREATE INDEX idx_coupons_valid ON public.coupons(valid_from, valid_until);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are viewable by everyone"
  ON public.coupons FOR SELECT USING (true);

CREATE POLICY "Location owners can manage coupons"
  ON public.coupons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.locations l
    WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

CREATE TRIGGER set_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 18. COUPON USES
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.coupon_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupon_uses_coupon ON public.coupon_uses(coupon_id);
CREATE INDEX idx_coupon_uses_customer ON public.coupon_uses(customer_id, coupon_id);

ALTER TABLE public.coupon_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupon uses viewable by coupon owner or user"
  ON public.coupon_uses FOR SELECT
  USING (customer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.coupons c
    JOIN public.locations l ON l.id = c.merchant_id
    WHERE c.id = coupon_id AND l.owner_id = auth.uid()
  ));

-- ========================================================================
-- 19. MERCHANT MESSAGES
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_by TEXT NOT NULL DEFAULT 'customer',
  read BOOLEAN NOT NULL DEFAULT false,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_merchant ON public.merchant_messages(merchant_id, created_at DESC);
CREATE INDEX idx_messages_customer ON public.merchant_messages(customer_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON public.merchant_messages(merchant_id, customer_id, created_at DESC);
CREATE INDEX idx_messages_unread ON public.merchant_messages(merchant_id, read, sent_by)
  WHERE read = false AND sent_by = 'customer';

ALTER TABLE public.merchant_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages visible to conversation participants"
  ON public.merchant_messages FOR SELECT
  USING (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

CREATE POLICY "Participants can send messages"
  ON public.merchant_messages FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

CREATE POLICY "Participants can update read status"
  ON public.merchant_messages FOR UPDATE
  USING (auth.uid() = customer_id OR EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

-- ========================================================================
-- 20. MERCHANT BROADCASTS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_broadcasts_merchant ON public.merchant_broadcasts(merchant_id, created_at DESC);

ALTER TABLE public.merchant_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Broadcasts are public"
  ON public.merchant_broadcasts FOR SELECT USING (true);

CREATE POLICY "Location owners can create broadcasts"
  ON public.merchant_broadcasts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

-- ========================================================================
-- 21. REVIEWS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  merchant_reply TEXT,
  merchant_replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_location ON public.reviews(location_id, created_at DESC);
CREATE INDEX idx_reviews_buyer ON public.reviews(buyer_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Location owners can reply to reviews"
  ON public.reviews FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = location_id AND l.owner_id = auth.uid()
  ));

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 22. CATEGORIES (seeded reference table)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_th TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public"
  ON public.categories FOR SELECT USING (true);

-- Seed default categories
INSERT INTO public.categories (id, name, name_th, icon, sort_order) VALUES
  ('bakery', 'Bakery', 'เบเกอรี่', 'cake', 1),
  ('cafe', 'Café', 'คาเฟ่', 'coffee', 2),
  ('restaurant', 'Restaurant', 'ร้านอาหาร', 'utensils', 3),
  ('grocery', 'Grocery', 'ร้านขายของชำ', 'shopping-basket', 4),
  ('hotel', 'Hotel', 'โรงแรม', 'bed', 5),
  ('dessert', 'Dessert', 'ของหวาน', 'ice-cream', 6),
  ('healthy', 'Healthy', 'อาหารเพื่อสุขภาพ', 'leaf', 7),
  ('street_food', 'Street Food', 'อาหารริมทาง', 'flame', 8)
ON CONFLICT (id) DO NOTHING;

-- ========================================================================
-- 23. USER PERSONALITY (new)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.user_personality (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  dietary_preferences TEXT[] DEFAULT ARRAY[]::TEXT[],
  price_range TEXT DEFAULT 'any',
  preferred_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  discovery_style TEXT DEFAULT 'explore',
  environmental_motivation TEXT DEFAULT 'medium',
  pickup_time_preference TEXT DEFAULT 'any',
  max_distance_km NUMERIC(6,2) DEFAULT 10,
  notification_style TEXT DEFAULT 'all',
  favorite_merchants TEXT[] DEFAULT ARRAY[]::TEXT[],
  order_patterns JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_personality_categories ON public.user_personality USING GIN(preferred_categories);

ALTER TABLE public.user_personality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their personality"
  ON public.user_personality FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER set_user_personality_updated_at
  BEFORE UPDATE ON public.user_personality
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========================================================================
-- 24. MERCHANT PERSONALITY (new)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.merchant_personality (
  merchant_id UUID PRIMARY KEY REFERENCES public.locations(id) ON DELETE CASCADE,
  brand_voice TEXT DEFAULT 'friendly',
  sustainability_focus TEXT DEFAULT 'medium',
  community_engagement TEXT DEFAULT 'medium',
  customer_communication TEXT DEFAULT 'responsive',
  story TEXT,
  values TEXT[] DEFAULT ARRAY[]::TEXT[],
  auto_welcome_message TEXT,
  pickup_personality TEXT DEFAULT 'standard',
  packaging_style TEXT DEFAULT 'standard',
  social_links JSONB DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.merchant_personality ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant personality visible to owner"
  ON public.merchant_personality FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.locations l WHERE l.id = merchant_id AND l.owner_id = auth.uid()
  ));

CREATE POLICY "Merchant personality is public read"
  ON public.merchant_personality FOR SELECT USING (true);

CREATE TRIGGER set_merchant_personality_updated_at
  BEFORE UPDATE ON public.merchant_personality
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ========================================================================
-- 25. RPC FUNCTIONS
-- ========================================================================

-- Count total uses of a coupon
CREATE OR REPLACE FUNCTION public.count_coupon_uses(p_coupon_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.coupon_uses WHERE coupon_id = p_coupon_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count uses of a coupon by a specific customer
CREATE OR REPLACE FUNCTION public.count_customer_coupon_uses(
  p_coupon_id UUID,
  p_customer_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.coupon_uses
  WHERE coupon_id = p_coupon_id AND customer_id = p_customer_id;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if customer has any completed orders
CREATE OR REPLACE FUNCTION public.customer_has_completed_orders(p_customer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.orders
    WHERE buyer_id = p_customer_id
    AND status IN ('collected', 'paid', 'completed', 'picked_up')
  ) INTO v_has;
  RETURN v_has;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement listing stock atomically (prevents overselling)
CREATE OR REPLACE FUNCTION public.reserve_listing(
  p_listing_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT qty_remaining INTO v_remaining
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_remaining IS NULL OR v_remaining < p_quantity THEN
    RETURN false;
  END IF;

  UPDATE public.listings
  SET qty_remaining = qty_remaining - p_quantity
  WHERE id = p_listing_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release listing stock (on cancel/refund)
CREATE OR REPLACE FUNCTION public.release_listing(
  p_listing_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.listings
  SET qty_remaining = qty_remaining + p_quantity
  WHERE id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update location rating average when a new review is added
CREATE OR REPLACE FUNCTION public.update_location_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg NUMERIC(3,2);
  v_count INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO v_avg, v_count
  FROM public.reviews
  WHERE location_id = COALESCE(NEW.location_id, OLD.location_id);

  UPDATE public.locations
  SET rating = v_avg, review_count = v_count
  WHERE id = COALESCE(NEW.location_id, OLD.location_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_location_rating();

-- Update user impact stats when order status changes to completed
CREATE OR REPLACE FUNCTION public.update_user_impact()
RETURNS TRIGGER AS $$
DECLARE
  v_items_count INTEGER;
  v_money_saved INTEGER;
BEGIN
  IF NEW.status IN ('completed', 'picked_up', 'collected')
     AND OLD.status NOT IN ('completed', 'picked_up', 'collected') THEN
    -- Count items from order_items if present, else 1
    SELECT COALESCE(SUM(quantity), 1) INTO v_items_count
    FROM public.order_items
    WHERE order_id = NEW.id;

    -- Calculate money saved (original value - paid)
    SELECT COALESCE(SUM(
      (l.original_value_thb - oi.unit_price) * oi.quantity
    ), 0) INTO v_money_saved
    FROM public.order_items oi
    JOIN public.listings l ON l.id = oi.listing_id
    WHERE oi.order_id = NEW.id;

    INSERT INTO public.user_impact (user_id, meals_saved, money_saved_thb, co2_saved_kg, orders_count)
    VALUES (
      NEW.buyer_id,
      v_items_count,
      GREATEST(v_money_saved, 0),
      ROUND(v_items_count * 2.3, 2),
      1
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      meals_saved = user_impact.meals_saved + v_items_count,
      money_saved_thb = user_impact.money_saved_thb + GREATEST(v_money_saved, 0),
      co2_saved_kg = user_impact.co2_saved_kg + ROUND(v_items_count * 2.3, 2),
      orders_count = user_impact.orders_count + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_completed ON public.orders;
CREATE TRIGGER on_order_completed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_user_impact();

-- Auto-update merchant wallet on completed order
CREATE OR REPLACE FUNCTION public.update_merchant_wallet()
RETURNS TRIGGER AS $$
DECLARE
  v_commission NUMERIC(4,3);
  v_earnings INTEGER;
BEGIN
  IF NEW.status IN ('completed', 'picked_up', 'collected')
     AND OLD.status NOT IN ('completed', 'picked_up', 'collected') THEN
    -- Get or default commission rate
    SELECT COALESCE(commission_rate, 0.15) INTO v_commission
    FROM public.merchant_wallets
    WHERE merchant_id = NEW.location_id;

    v_commission := COALESCE(v_commission, 0.15);
    v_earnings := ROUND(NEW.amount_thb * (1 - v_commission));

    INSERT INTO public.merchant_wallets (merchant_id, balance_thb, total_earnings)
    VALUES (NEW.location_id, v_earnings, v_earnings)
    ON CONFLICT (merchant_id)
    DO UPDATE SET
      balance_thb = merchant_wallets.balance_thb + v_earnings,
      total_earnings = merchant_wallets.total_earnings + v_earnings,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_merchant_wallet ON public.orders;
CREATE TRIGGER on_order_merchant_wallet
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_merchant_wallet();

-- ========================================================================
-- 26. ENABLE REALTIME (for messages, orders, notifications)
-- ========================================================================
DO $$
BEGIN
  -- Add tables to realtime publication
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
END $$;

-- ========================================================================
-- 27. ANALYTICS VIEWS
-- ========================================================================

-- Daily revenue view for merchants
CREATE OR REPLACE VIEW public.merchant_daily_revenue AS
SELECT
  location_id AS merchant_id,
  DATE(created_at) AS date,
  SUM(amount_thb) AS revenue,
  COUNT(*) AS order_count
FROM public.orders
WHERE status IN ('completed', 'picked_up', 'collected', 'paid')
GROUP BY location_id, DATE(created_at);

-- Category performance view
CREATE OR REPLACE VIEW public.category_performance AS
SELECT
  l.category,
  COUNT(DISTINCT o.id) AS total_orders,
  SUM(o.amount_thb) AS total_revenue,
  AVG(r.rating) AS avg_rating
FROM public.orders o
JOIN public.listings l ON l.id = o.listing_id
LEFT JOIN public.reviews r ON r.location_id = o.location_id
WHERE o.status IN ('completed', 'picked_up', 'collected')
GROUP BY l.category;
