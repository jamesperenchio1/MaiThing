-- MaiThing (RescueBite) — Initial Schema
-- Applies to Supabase Cloud dev project: bvvsuollejcndcjjveal
-- Run via: supabase db push  OR  supabase migration up --linked
-- Uses PostGIS for geospatial queries.

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ─── Enums ───────────────────────────────────────────────────────────────────

do $$ begin
  create type user_role as enum ('buyer', 'merchant', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_status as enum ('pending', 'active', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('draft', 'active', 'sold_out', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fulfillment_type as enum ('surprise_bag', 'pick_your_own');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum ('reserved', 'paid', 'collected', 'cancelled', 'refunded', 'no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type issue_status as enum ('open', 'auto_refunded', 'resolved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_tier as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

-- ─── Tables ───────────────────────────────────────────────────────────────────

-- profiles: extends auth.users 1:1
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  role              user_role not null default 'buyer',
  display_name      text,
  phone             text,
  avatar_url        text,
  locale            text not null default 'th',
  home_lat          double precision,
  home_lng          double precision,
  reliability_score smallint not null default 100 check (reliability_score between 0 and 100),
  pdpa_consented_at timestamptz,
  created_at        timestamptz not null default now()
);

-- merchant_orgs
create table if not exists public.merchant_orgs (
  id                         uuid primary key default gen_random_uuid(),
  owner_id                   uuid not null references public.profiles(id) on delete cascade,
  name                       text not null,
  description                text,
  logo_url                   text,
  category                   text not null,
  stripe_connect_account_id  text,
  subscription_tier          subscription_tier not null default 'free',
  subscription_status        text not null default 'active',
  verified_at                timestamptz,
  suspended_at               timestamptz,
  created_at                 timestamptz not null default now()
);

-- locations (one per physical store)
create table if not exists public.locations (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.merchant_orgs(id) on delete cascade,
  name            text not null,
  address_text    text not null,
  location        geography(Point, 4326) not null,
  cover_url       text,
  photo_urls      text[] not null default '{}',
  hours           jsonb not null default '{}',
  status          location_status not null default 'pending',
  rating_avg      numeric(3,2) not null default 0,
  value_rating_avg numeric(3,2) not null default 0,
  rating_count    int not null default 0,
  created_at      timestamptz not null default now()
);

-- GIST index on geography column for spatial queries
create index if not exists locations_location_gist on public.locations using gist(location);
create index if not exists locations_status_idx on public.locations(status);

-- slot_templates (reusable pickup window templates per location)
create table if not exists public.slot_templates (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  label       text not null,
  start_time  time not null,
  end_time    time not null,
  weekdays    smallint[] not null default '{1,2,3,4,5,6,7}'
);

-- listings
create table if not exists public.listings (
  id                  uuid primary key default gen_random_uuid(),
  location_id         uuid not null references public.locations(id) on delete cascade,
  title               text not null,
  category            text not null,
  description         text,
  fulfillment_type    fulfillment_type not null default 'surprise_bag',
  photo_urls          text[] not null default '{}',
  original_value_thb  numeric(10,2) not null check (original_value_thb > 0),
  price_thb           numeric(10,2) not null check (price_thb > 0),
  qty_total           int not null check (qty_total > 0),
  qty_remaining       int not null check (qty_remaining >= 0),
  allergens           text[] not null default '{}',
  best_before_note    text,
  status              listing_status not null default 'draft',
  auto_repeat         boolean not null default false,
  created_at          timestamptz not null default now(),
  constraint listings_qty_check check (qty_remaining <= qty_total),
  constraint listings_price_check check (price_thb < original_value_thb)
);

create index if not exists listings_location_status_idx on public.listings(location_id, status);
create index if not exists listings_status_idx on public.listings(status);

-- listing_items (for pick_your_own; optional itemized preview for surprise_bag)
create table if not exists public.listing_items (
  id                uuid primary key default gen_random_uuid(),
  listing_id        uuid not null references public.listings(id) on delete cascade,
  name              text not null,
  photo_url         text,
  available_qty     int not null check (available_qty >= 0),
  reserved_qty      int not null default 0 check (reserved_qty >= 0),
  price_thb         numeric(10,2) not null check (price_thb > 0),
  original_price_thb numeric(10,2) not null check (original_price_thb > 0)
);

create index if not exists listing_items_listing_idx on public.listing_items(listing_id);

-- pickup_slots
create table if not exists public.pickup_slots (
  id             uuid primary key default gen_random_uuid(),
  listing_id     uuid not null references public.listings(id) on delete cascade,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  capacity       int not null check (capacity > 0),
  reserved_count int not null default 0 check (reserved_count >= 0),
  constraint slots_time_check check (ends_at > starts_at),
  constraint slots_capacity_check check (reserved_count <= capacity)
);

create index if not exists pickup_slots_listing_idx on public.pickup_slots(listing_id);
create index if not exists pickup_slots_starts_at_idx on public.pickup_slots(starts_at);

-- orders
create table if not exists public.orders (
  id                        uuid primary key default gen_random_uuid(),
  buyer_id                  uuid not null references public.profiles(id),
  listing_id                uuid not null references public.listings(id),
  location_id               uuid not null references public.locations(id),
  pickup_slot_id            uuid not null references public.pickup_slots(id),
  qty                       int not null check (qty > 0),
  amount_thb                numeric(10,2) not null,
  platform_fee_thb          numeric(10,2) not null,
  status                    order_status not null default 'reserved',
  pickup_code               text not null unique,
  qr_payload                text not null,
  stripe_payment_intent_id  text,
  created_at                timestamptz not null default now(),
  collected_at              timestamptz,
  cancelled_at              timestamptz
);

create index if not exists orders_buyer_idx on public.orders(buyer_id);
create index if not exists orders_location_idx on public.orders(location_id);
create index if not exists orders_pickup_code_idx on public.orders(pickup_code);
create index if not exists orders_slot_idx on public.orders(pickup_slot_id);
create index if not exists orders_status_idx on public.orders(status);

-- order_items (for pick_your_own)
create table if not exists public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  listing_item_id   uuid not null references public.listing_items(id),
  name_snapshot     text not null,
  qty               int not null check (qty > 0),
  unit_price_thb    numeric(10,2) not null
);

create index if not exists order_items_order_idx on public.order_items(order_id);

-- reviews
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null unique references public.orders(id),
  buyer_id        uuid not null references public.profiles(id),
  location_id     uuid not null references public.locations(id),
  overall_rating  smallint not null check (overall_rating between 1 and 5),
  value_rating    smallint not null check (value_rating between 1 and 5),
  comment         text,
  photo_urls      text[] not null default '{}',
  merchant_reply  text,
  created_at      timestamptz not null default now()
);

create index if not exists reviews_location_idx on public.reviews(location_id);

-- issue_reports
create table if not exists public.issue_reports (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id),
  reason           text not null,
  detail           text,
  photo_urls       text[] not null default '{}',
  status           issue_status not null default 'open',
  resolution_note  text,
  created_at       timestamptz not null default now()
);

-- chat_threads
create table if not exists public.chat_threads (
  id               uuid primary key default gen_random_uuid(),
  buyer_id         uuid not null references public.profiles(id),
  location_id      uuid not null references public.locations(id),
  order_id         uuid references public.orders(id),
  last_message_at  timestamptz not null default now(),
  unique(buyer_id, location_id)
);

create index if not exists chat_threads_buyer_idx on public.chat_threads(buyer_id);
create index if not exists chat_threads_location_idx on public.chat_threads(location_id);

-- chat_messages
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.chat_threads(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id),
  body        text not null,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx on public.chat_messages(thread_id, created_at);

-- favorites
create table if not exists public.favorites (
  buyer_id     uuid not null references public.profiles(id) on delete cascade,
  location_id  uuid not null references public.locations(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (buyer_id, location_id)
);

-- demand_signals (notify-me when sparse)
create table if not exists public.demand_signals (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  geohash     text not null,
  category    text,
  created_at  timestamptz not null default now()
);

create index if not exists demand_signals_geohash_idx on public.demand_signals(geohash);

-- referrals
create table if not exists public.referrals (
  id             uuid primary key default gen_random_uuid(),
  referrer_id    uuid not null references public.profiles(id),
  referred_id    uuid references public.profiles(id),
  code           text not null unique,
  reward_status  text not null default 'pending',
  created_at     timestamptz not null default now()
);

create index if not exists referrals_code_idx on public.referrals(code);

-- user_impact (materialized per-user, updated by trigger)
create table if not exists public.user_impact (
  profile_id   uuid primary key references public.profiles(id) on delete cascade,
  meals_saved  int not null default 0,
  co2_kg_saved numeric(10,2) not null default 0,
  thb_saved    numeric(10,2) not null default 0,
  hero_level   text not null default 'seed'
);

-- subscriptions
create table if not exists public.subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  subscriber_id         uuid not null references public.profiles(id),
  subscriber_type       text not null,
  stripe_subscription_id text,
  tier                  subscription_tier not null,
  status                text not null default 'active',
  current_period_end    timestamptz,
  created_at            timestamptz not null default now()
);

-- device_tokens (Expo push)
create table if not exists public.device_tokens (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  created_at      timestamptz not null default now(),
  unique(profile_id, expo_push_token)
);

-- platform_config (single row)
create table if not exists public.platform_config (
  id                    int primary key default 1 check (id = 1),
  platform_fee_bps      int not null default 1500,
  feature_flags         jsonb not null default '{}'
);

insert into public.platform_config (id, platform_fee_bps, feature_flags)
values (1, 1500, '{"rescue_club": false, "priority_slots": false}')
on conflict (id) do nothing;

-- ─── Triggers ────────────────────────────────────────────────────────────────

-- Auto-create profile row when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name, avatar_url, locale)
  values (
    new.id,
    'buyer',
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'locale', 'th')
  )
  on conflict (id) do nothing;

  insert into public.user_impact (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update location rating aggregates after a review
create or replace function public.update_location_ratings()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.locations
  set
    rating_avg = (
      select avg(overall_rating)::numeric(3,2) from public.reviews where location_id = new.location_id
    ),
    value_rating_avg = (
      select avg(value_rating)::numeric(3,2) from public.reviews where location_id = new.location_id
    ),
    rating_count = (
      select count(*) from public.reviews where location_id = new.location_id
    )
  where id = new.location_id;
  return new;
end;
$$;

drop trigger if exists on_review_insert on public.reviews;
create trigger on_review_insert
  after insert on public.reviews
  for each row execute procedure public.update_location_ratings();

-- Update user_impact after an order is collected
create or replace function public.update_user_impact()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_meals_saved int;
  v_thb_saved   numeric;
  v_hero        text;
begin
  if new.status = 'collected' and old.status != 'collected' then
    -- Accumulate
    update public.user_impact
    set
      meals_saved  = meals_saved + new.qty,
      co2_kg_saved = co2_kg_saved + (new.qty * 2.5),
      thb_saved    = thb_saved + (
        select (original_value_thb - price_thb) * new.qty
        from public.listings where id = new.listing_id
      )
    where profile_id = new.buyer_id
    returning meals_saved into v_meals_saved;

    -- Compute hero level
    v_hero := case
      when v_meals_saved >= 200 then 'forest'
      when v_meals_saved >= 100 then 'tree'
      when v_meals_saved >= 50  then 'leaf'
      when v_meals_saved >= 10  then 'sprout'
      else 'seed'
    end;

    update public.user_impact set hero_level = v_hero where profile_id = new.buyer_id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_order_status_change on public.orders;
create trigger on_order_status_change
  after update of status on public.orders
  for each row execute procedure public.update_user_impact();

-- Keep listing sold_out status in sync with qty_remaining
create or replace function public.sync_listing_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.qty_remaining = 0 and old.qty_remaining > 0 and new.status = 'active' then
    update public.listings set status = 'sold_out' where id = new.id;
  elsif new.qty_remaining > 0 and old.qty_remaining = 0 and new.status = 'sold_out' then
    update public.listings set status = 'active' where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_listing_qty_change on public.listings;
create trigger on_listing_qty_change
  after update of qty_remaining on public.listings
  for each row execute procedure public.sync_listing_status();

-- ─── RPCs ────────────────────────────────────────────────────────────────────

-- listings_in_bounds: viewport-only query; never returns all rows
create or replace function public.listings_in_bounds(
  min_lat  double precision,
  min_lng  double precision,
  max_lat  double precision,
  max_lng  double precision,
  filters  jsonb default '{}',
  lim      int default 200
)
returns table (
  id                uuid,
  location_id       uuid,
  title             text,
  category          text,
  fulfillment_type  fulfillment_type,
  price_thb         numeric,
  original_value_thb numeric,
  qty_remaining     int,
  location_lat      double precision,
  location_lng      double precision,
  location_name     text,
  rating_avg        numeric,
  value_rating_avg  numeric
)
language sql stable security definer set search_path = public as $$
  select
    li.id,
    li.location_id,
    li.title,
    li.category,
    li.fulfillment_type,
    li.price_thb,
    li.original_value_thb,
    li.qty_remaining,
    st_y(lo.location::geometry) as location_lat,
    st_x(lo.location::geometry) as location_lng,
    lo.name as location_name,
    lo.rating_avg,
    lo.value_rating_avg
  from public.listings li
  join public.locations lo on lo.id = li.location_id
  where
    li.status = 'active'
    and lo.status = 'active'
    and lo.location && st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography
    and (filters->>'category' is null or li.category = filters->>'category')
    and (filters->>'max_price_thb' is null or li.price_thb <= (filters->>'max_price_thb')::numeric)
    and (filters->>'fulfillment_type' is null or li.fulfillment_type::text = filters->>'fulfillment_type')
  limit lim;
$$;

-- nearby_listings: distance-sorted with cursor pagination
create or replace function public.nearby_listings(
  lat       double precision,
  lng       double precision,
  radius_m  double precision default 5000,
  filters   jsonb default '{}',
  p_cursor  text default null,
  lim       int default 20
)
returns table (
  id                uuid,
  location_id       uuid,
  title             text,
  category          text,
  fulfillment_type  fulfillment_type,
  price_thb         numeric,
  original_value_thb numeric,
  qty_remaining     int,
  distance_m        double precision,
  location_name     text,
  rating_avg        numeric,
  value_rating_avg  numeric,
  next_cursor       text
)
language sql stable security definer set search_path = public as $$
  with base as (
    select
      li.id,
      li.location_id,
      li.title,
      li.category,
      li.fulfillment_type,
      li.price_thb,
      li.original_value_thb,
      li.qty_remaining,
      st_distance(lo.location, st_point(lng, lat)::geography) as distance_m,
      lo.name as location_name,
      lo.rating_avg,
      lo.value_rating_avg,
      row_number() over (
        order by st_distance(lo.location, st_point(lng, lat)::geography), li.id
      ) as rn
    from public.listings li
    join public.locations lo on lo.id = li.location_id
    where
      li.status = 'active'
      and lo.status = 'active'
      and st_dwithin(lo.location, st_point(lng, lat)::geography, radius_m)
      and (filters->>'category' is null or li.category = filters->>'category')
      and (filters->>'max_price_thb' is null or li.price_thb <= (filters->>'max_price_thb')::numeric)
      and (filters->>'fulfillment_type' is null or li.fulfillment_type::text = filters->>'fulfillment_type')
      and (p_cursor is null or li.id > p_cursor::uuid)
    order by distance_m, li.id
    limit lim + 1
  )
  select
    b.id, b.location_id, b.title, b.category, b.fulfillment_type,
    b.price_thb, b.original_value_thb, b.qty_remaining,
    b.distance_m, b.location_name, b.rating_avg, b.value_rating_avg,
    case when (select count(*) from base) > lim
      then (select bb.id::text from base bb where bb.rn = lim)
      else null
    end as next_cursor
  from base b
  where b.rn <= lim;
$$;

-- reserve_order: atomic, prevents overselling
-- Takes advisory lock on (listing_id, slot_id) to prevent race conditions.
create or replace function public.reserve_order(
  p_listing_id  uuid,
  p_slot_id     uuid,
  p_items       jsonb default '[]'
)
returns table (
  order_id    uuid,
  pickup_code text,
  qr_payload  text
)
language plpgsql security definer set search_path = public as $$
declare
  v_listing     record;
  v_slot        record;
  v_qty         int;
  v_total_thb   numeric;
  v_fee_thb     numeric;
  v_fee_bps     int;
  v_code        text;
  v_order_id    uuid;
  v_item        jsonb;
  v_item_rec    record;
  v_item_qty    int;
begin
  -- Advisory lock scoped to this (listing, slot) pair
  perform pg_advisory_xact_lock(
    ('x' || encode(p_listing_id::text::bytea || p_slot_id::text::bytea, 'hex'))::bit(63)::bigint
  );

  -- Lock & read listing
  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'listing_not_found';
  end if;

  if v_listing.status != 'active' then
    raise exception 'listing_not_active';
  end if;

  -- Lock & read slot
  select * into v_slot
  from public.pickup_slots
  where id = p_slot_id and listing_id = p_listing_id
  for update;

  if not found then
    raise exception 'slot_not_found';
  end if;

  if v_slot.reserved_count >= v_slot.capacity then
    raise exception 'slot_full';
  end if;

  -- Determine quantity (for surprise_bag = 1, pick_your_own = sum of items)
  if v_listing.fulfillment_type = 'surprise_bag' then
    v_qty := 1;
  else
    v_qty := 0;
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_qty := v_qty + (v_item->>'qty')::int;
    end loop;
    if v_qty <= 0 then
      raise exception 'invalid_items';
    end if;
  end if;

  if v_listing.qty_remaining < v_qty then
    raise exception 'insufficient_stock';
  end if;

  -- For pick_your_own: validate and decrement each item
  if v_listing.fulfillment_type = 'pick_your_own' then
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_item_qty := (v_item->>'qty')::int;
      select * into v_item_rec
      from public.listing_items
      where id = (v_item->>'listing_item_id')::uuid
        and listing_id = p_listing_id
      for update;

      if not found then
        raise exception 'item_not_found';
      end if;

      if (v_item_rec.available_qty - v_item_rec.reserved_qty) < v_item_qty then
        raise exception 'item_insufficient_stock:%', v_item_rec.id;
      end if;

      update public.listing_items
      set reserved_qty = reserved_qty + v_item_qty
      where id = v_item_rec.id;
    end loop;
  end if;

  -- Decrement listing stock
  update public.listings
  set qty_remaining = qty_remaining - v_qty
  where id = p_listing_id;

  -- Increment slot reservation count
  update public.pickup_slots
  set reserved_count = reserved_count + 1
  where id = p_slot_id;

  -- Calculate fees
  select platform_fee_bps into v_fee_bps from public.platform_config where id = 1;
  v_total_thb := v_listing.price_thb * v_qty;
  v_fee_thb   := round((v_total_thb * v_fee_bps) / 10000, 2);

  -- Generate pickup code
  v_code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));

  -- Create order
  insert into public.orders (
    buyer_id, listing_id, location_id, pickup_slot_id,
    qty, amount_thb, platform_fee_thb, status,
    pickup_code, qr_payload
  )
  select
    auth.uid(),
    p_listing_id,
    v_listing.location_id,
    p_slot_id,
    v_qty,
    v_total_thb,
    v_fee_thb,
    'reserved',
    v_code,
    json_build_object(
      'order_id', gen_random_uuid(),
      'code', v_code,
      'listing_id', p_listing_id
    )::text
  returning id into v_order_id;

  -- Insert order_items for pick_your_own
  if v_listing.fulfillment_type = 'pick_your_own' then
    for v_item in select * from jsonb_array_elements(p_items) loop
      select * into v_item_rec from public.listing_items
      where id = (v_item->>'listing_item_id')::uuid;

      insert into public.order_items (order_id, listing_item_id, name_snapshot, qty, unit_price_thb)
      values (
        v_order_id,
        (v_item->>'listing_item_id')::uuid,
        v_item_rec.name,
        (v_item->>'qty')::int,
        v_item_rec.price_thb
      );
    end loop;
  end if;

  return query select v_order_id, v_code, (
    select qr_payload from public.orders where id = v_order_id
  );
end;
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.merchant_orgs enable row level security;
alter table public.locations enable row level security;
alter table public.listings enable row level security;
alter table public.listing_items enable row level security;
alter table public.pickup_slots enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.issue_reports enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;
alter table public.favorites enable row level security;
alter table public.demand_signals enable row level security;
alter table public.referrals enable row level security;
alter table public.user_impact enable row level security;
alter table public.subscriptions enable row level security;
alter table public.device_tokens enable row level security;
alter table public.slot_templates enable row level security;
alter table public.platform_config enable row level security;

-- profiles: read your own; admins read all
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- merchant_orgs: owner CRUD; buyers + merchants read approved orgs
create policy "merchant_orgs_select_active" on public.merchant_orgs
  for select using (suspended_at is null);

create policy "merchant_orgs_owner_all" on public.merchant_orgs
  for all using (owner_id = auth.uid());

create policy "merchant_orgs_admin_all" on public.merchant_orgs
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- locations: active locations readable by all authenticated users
create policy "locations_select_active" on public.locations
  for select using (status = 'active');

create policy "locations_owner_all" on public.locations
  for all using (
    exists (
      select 1 from public.merchant_orgs
      where id = org_id and owner_id = auth.uid()
    )
  );

create policy "locations_admin_all" on public.locations
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- listings: active readable by all; merchant manages own
create policy "listings_select_active" on public.listings
  for select using (status in ('active', 'sold_out'));

create policy "listings_merchant_all" on public.listings
  for all using (
    exists (
      select 1 from public.locations lo
      join public.merchant_orgs mo on mo.id = lo.org_id
      where lo.id = location_id and mo.owner_id = auth.uid()
    )
  );

create policy "listings_admin_all" on public.listings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- listing_items: same visibility as listing
create policy "listing_items_select_via_listing" on public.listing_items
  for select using (
    exists (
      select 1 from public.listings where id = listing_id and status in ('active', 'sold_out')
    )
  );

create policy "listing_items_merchant_all" on public.listing_items
  for all using (
    exists (
      select 1 from public.listings li
      join public.locations lo on lo.id = li.location_id
      join public.merchant_orgs mo on mo.id = lo.org_id
      where li.id = listing_id and mo.owner_id = auth.uid()
    )
  );

-- pickup_slots: readable when listing is visible
create policy "pickup_slots_select_active_listing" on public.pickup_slots
  for select using (
    exists (
      select 1 from public.listings where id = listing_id and status in ('active', 'sold_out')
    )
  );

create policy "pickup_slots_merchant_all" on public.pickup_slots
  for all using (
    exists (
      select 1 from public.listings li
      join public.locations lo on lo.id = li.location_id
      join public.merchant_orgs mo on mo.id = lo.org_id
      where li.id = listing_id and mo.owner_id = auth.uid()
    )
  );

-- orders: buyer owns; merchant sees orders for their locations
create policy "orders_select_buyer" on public.orders
  for select using (buyer_id = auth.uid());

create policy "orders_select_merchant" on public.orders
  for select using (
    exists (
      select 1 from public.locations lo
      join public.merchant_orgs mo on mo.id = lo.org_id
      where lo.id = location_id and mo.owner_id = auth.uid()
    )
  );

create policy "orders_admin_all" on public.orders
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- order_items: same as parent order
create policy "order_items_select_buyer" on public.order_items
  for select using (
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );

create policy "order_items_select_merchant" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      join public.locations lo on lo.id = o.location_id
      join public.merchant_orgs mo on mo.id = lo.org_id
      where o.id = order_id and mo.owner_id = auth.uid()
    )
  );

-- reviews: public read; buyer writes own
create policy "reviews_select_all" on public.reviews
  for select using (true);

create policy "reviews_insert_buyer" on public.reviews
  for insert with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.orders
      where id = order_id and buyer_id = auth.uid() and status = 'collected'
    )
  );

create policy "reviews_update_merchant_reply" on public.reviews
  for update using (
    exists (
      select 1 from public.locations lo
      join public.merchant_orgs mo on mo.id = lo.org_id
      where lo.id = location_id and mo.owner_id = auth.uid()
    )
  );

-- issue_reports: buyer owns; merchant sees on their orders; admin all
create policy "issue_reports_select_buyer" on public.issue_reports
  for select using (
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );

create policy "issue_reports_insert_buyer" on public.issue_reports
  for insert with check (
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );

create policy "issue_reports_admin_all" on public.issue_reports
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- chat_threads: participants only
create policy "chat_threads_select_participant" on public.chat_threads
  for select using (
    buyer_id = auth.uid()
    or exists (
      select 1 from public.locations lo
      join public.merchant_orgs mo on mo.id = lo.org_id
      where lo.id = location_id and mo.owner_id = auth.uid()
    )
  );

create policy "chat_threads_insert_buyer" on public.chat_threads
  for insert with check (buyer_id = auth.uid());

-- chat_messages: thread participants only
create policy "chat_messages_select_participant" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_threads t
      where t.id = thread_id
        and (
          t.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations lo
            join public.merchant_orgs mo on mo.id = lo.org_id
            where lo.id = t.location_id and mo.owner_id = auth.uid()
          )
        )
    )
  );

create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_threads t
      where t.id = thread_id
        and (
          t.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations lo
            join public.merchant_orgs mo on mo.id = lo.org_id
            where lo.id = t.location_id and mo.owner_id = auth.uid()
          )
        )
    )
  );

-- favorites: own only
create policy "favorites_own" on public.favorites
  for all using (buyer_id = auth.uid());

-- demand_signals: own only
create policy "demand_signals_own" on public.demand_signals
  for all using (buyer_id = auth.uid());

-- referrals: own only
create policy "referrals_own" on public.referrals
  for select using (referrer_id = auth.uid() or referred_id = auth.uid());

create policy "referrals_insert_own" on public.referrals
  for insert with check (referrer_id = auth.uid());

-- user_impact: own; admin all
create policy "user_impact_own" on public.user_impact
  for select using (profile_id = auth.uid());

create policy "user_impact_admin_all" on public.user_impact
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- subscriptions: own; admin all
create policy "subscriptions_own" on public.subscriptions
  for select using (subscriber_id = auth.uid());

create policy "subscriptions_admin_all" on public.subscriptions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- device_tokens: own only
create policy "device_tokens_own" on public.device_tokens
  for all using (profile_id = auth.uid());

-- slot_templates: merchant owns
create policy "slot_templates_merchant_all" on public.slot_templates
  for all using (
    exists (
      select 1 from public.locations lo
      join public.merchant_orgs mo on mo.id = lo.org_id
      where lo.id = location_id and mo.owner_id = auth.uid()
    )
  );

-- platform_config: read-only for all authenticated; admin writes
create policy "platform_config_select" on public.platform_config
  for select using (auth.role() = 'authenticated');

create policy "platform_config_admin_update" on public.platform_config
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
