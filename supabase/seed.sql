-- MaiThing Seed Data — Idempotent, re-runnable
-- ~40 diverse orgs across Bangkok, Chiang Mai, Phuket, Khon Kaen
-- Run via: supabase db seed --linked  OR  psql ... < supabase/seed.sql

-- ─── Test users (email/password login) ──────────────────────────────────────
-- These must be created via Supabase Auth admin API or Dashboard.
-- Profile rows are auto-created by the handle_new_user trigger.
-- See SETUP-TODO.md for the supabase CLI commands to create test accounts.

-- ─── Merchant orgs ───────────────────────────────────────────────────────────

-- We use a DO block so the seed is idempotent.
do $seed$
declare
  -- Bangkok orgs
  org_aroi     uuid := 'aaaaaaaa-0001-0001-0001-000000000001';
  org_bake     uuid := 'aaaaaaaa-0002-0001-0001-000000000001';
  org_brew     uuid := 'aaaaaaaa-0003-0001-0001-000000000001';
  org_siam     uuid := 'aaaaaaaa-0004-0001-0001-000000000001';
  org_lotus    uuid := 'aaaaaaaa-0005-0001-0001-000000000001';
  org_noodle   uuid := 'aaaaaaaa-0006-0001-0001-000000000001';
  org_hotel_bkk uuid := 'aaaaaaaa-0007-0001-0001-000000000001';
  org_buffet   uuid := 'aaaaaaaa-0008-0001-0001-000000000001';
  org_deli_bkk uuid := 'aaaaaaaa-0009-0001-0001-000000000001';
  org_juice    uuid := 'aaaaaaaa-0010-0001-0001-000000000001';
  -- Chiang Mai orgs
  org_cm_cafe  uuid := 'aaaaaaaa-0011-0001-0001-000000000001';
  org_cm_bake  uuid := 'aaaaaaaa-0012-0001-0001-000000000001';
  org_cm_rest  uuid := 'aaaaaaaa-0013-0001-0001-000000000001';
  org_cm_supe  uuid := 'aaaaaaaa-0014-0001-0001-000000000001';
  org_cm_juice uuid := 'aaaaaaaa-0015-0001-0001-000000000001';
  -- Phuket orgs
  org_pkt_rest uuid := 'aaaaaaaa-0016-0001-0001-000000000001';
  org_pkt_hotel uuid := 'aaaaaaaa-0017-0001-0001-000000000001';
  org_pkt_cafe uuid := 'aaaaaaaa-0018-0001-0001-000000000001';
  -- Khon Kaen orgs
  org_kk_rest  uuid := 'aaaaaaaa-0019-0001-0001-000000000001';
  org_kk_bake  uuid := 'aaaaaaaa-0020-0001-0001-000000000001';
  -- Multi-location
  org_chain    uuid := 'aaaaaaaa-0021-0001-0001-000000000001';

  -- Placeholder owner (admin user, created separately)
  v_owner uuid := '00000000-0000-0000-0000-000000000001';

  -- Location IDs
  loc_aroi       uuid := 'bbbbbbbb-0001-0001-0001-000000000001';
  loc_bake       uuid := 'bbbbbbbb-0002-0001-0001-000000000001';
  loc_brew       uuid := 'bbbbbbbb-0003-0001-0001-000000000001';
  loc_siam       uuid := 'bbbbbbbb-0004-0001-0001-000000000001';
  loc_lotus      uuid := 'bbbbbbbb-0005-0001-0001-000000000001';
  loc_noodle     uuid := 'bbbbbbbb-0006-0001-0001-000000000001';
  loc_hotel_bkk  uuid := 'bbbbbbbb-0007-0001-0001-000000000001';
  loc_buffet     uuid := 'bbbbbbbb-0008-0001-0001-000000000001';
  loc_deli_bkk   uuid := 'bbbbbbbb-0009-0001-0001-000000000001';
  loc_juice      uuid := 'bbbbbbbb-0010-0001-0001-000000000001';
  loc_cm_cafe    uuid := 'bbbbbbbb-0011-0001-0001-000000000001';
  loc_cm_bake    uuid := 'bbbbbbbb-0012-0001-0001-000000000001';
  loc_cm_rest    uuid := 'bbbbbbbb-0013-0001-0001-000000000001';
  loc_cm_supe    uuid := 'bbbbbbbb-0014-0001-0001-000000000001';
  loc_cm_juice   uuid := 'bbbbbbbb-0015-0001-0001-000000000001';
  loc_pkt_rest   uuid := 'bbbbbbbb-0016-0001-0001-000000000001';
  loc_pkt_hotel  uuid := 'bbbbbbbb-0017-0001-0001-000000000001';
  loc_pkt_cafe   uuid := 'bbbbbbbb-0018-0001-0001-000000000001';
  loc_kk_rest    uuid := 'bbbbbbbb-0019-0001-0001-000000000001';
  loc_kk_bake    uuid := 'bbbbbbbb-0020-0001-0001-000000000001';
  loc_chain_bkk  uuid := 'bbbbbbbb-0021-0001-0001-000000000001';
  loc_chain_cm   uuid := 'bbbbbbbb-0022-0001-0001-000000000001';

begin
  -- Merchant orgs
  insert into public.merchant_orgs (id, owner_id, name, description, category, subscription_tier, subscription_status, verified_at)
  values
    (org_aroi,     v_owner, 'อร่อยดี Kitchen', 'Thai comfort food near BTS Asok', 'restaurant', 'pro', 'active', now()),
    (org_bake,     v_owner, 'Bangkok Bakes', 'Artisan bakery, Thonglor', 'bakery', 'free', 'active', now()),
    (org_brew,     v_owner, 'The Brew Room', 'Specialty coffee & light bites', 'cafe', 'free', 'active', now()),
    (org_siam,     v_owner, 'Siam Fresh Market', 'Grocery & produce, Siam area', 'grocery', 'pro', 'active', now()),
    (org_lotus,    v_owner, 'Lotus Superstore BKK', 'Supermarket clearance', 'supermarket', 'pro', 'active', now()),
    (org_noodle,   v_owner, 'เส้นสวรรค์ Noodles', 'Thai noodle shop, Lad Phrao', 'restaurant', 'free', 'active', now()),
    (org_hotel_bkk, v_owner, 'Skyline Hotel Bangkok', 'Hotel F&B surplus', 'hotel', 'pro', 'active', now()),
    (org_buffet,   v_owner, 'สุขสำราญ Buffet', 'All-day buffet, Don Mueang', 'buffet', 'free', 'active', now()),
    (org_deli_bkk, v_owner, 'BKK Deli Co.', 'European-style deli, Phrom Phong', 'deli', 'free', 'active', now()),
    (org_juice,    v_owner, 'JuiceBar 99', 'Cold-press juice & smoothies', 'juice_bar', 'free', 'active', now()),
    (org_cm_cafe,  v_owner, 'Doi Cafe Chiang Mai', 'Highland coffee, Nimman', 'cafe', 'free', 'active', now()),
    (org_cm_bake,  v_owner, 'CM Patisserie', 'French-Thai patisserie', 'bakery', 'free', 'active', now()),
    (org_cm_rest,  v_owner, 'Khao Soi Paradise', 'Northern Thai food', 'restaurant', 'free', 'active', now()),
    (org_cm_supe,  v_owner, 'Tops Chiang Mai', 'Supermarket, Maya Mall', 'supermarket', 'pro', 'active', now()),
    (org_cm_juice, v_owner, 'Nimman Juice Bar', 'Fresh tropical juices', 'juice_bar', 'free', 'active', now()),
    (org_pkt_rest, v_owner, 'Phuket Town Bistro', 'Sino-Portuguese cuisine', 'restaurant', 'free', 'active', now()),
    (org_pkt_hotel, v_owner, 'Andaman Resort Phuket', 'Resort F&B clearance', 'hotel', 'pro', 'active', now()),
    (org_pkt_cafe, v_owner, 'Rawai Coffee', 'Beach-side cafe', 'cafe', 'free', 'active', now()),
    (org_kk_rest,  v_owner, 'ขอนแก่น BBQ House', 'Northeast BBQ & som tam', 'restaurant', 'free', 'active', now()),
    (org_kk_bake,  v_owner, 'KK Sweet Bakery', 'Local bakery, Khon Kaen city', 'bakery', 'free', 'active', now()),
    (org_chain,    v_owner, 'Green Earth Cafe (Chain)', 'Eco-friendly cafe chain', 'cafe', 'pro', 'active', now())
  on conflict (id) do nothing;

  -- Locations (lat/lng for real Thai cities)
  insert into public.locations (id, org_id, name, address_text, location, status, hours)
  values
    -- Bangkok (~13.74, 100.55)
    (loc_aroi,      org_aroi,      'อร่อยดี Kitchen – Asok',       '123 Sukhumvit 21, Bangkok', st_point(100.5601, 13.7373)::geography, 'active', '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"10:00","close":"20:00"}}'),
    (loc_bake,      org_bake,      'Bangkok Bakes – Thonglor',     '45 Thonglor Soi 10, Bangkok', st_point(100.5812, 13.7288)::geography, 'active', '{"mon":{"open":"07:00","close":"18:00"},"tue":{"open":"07:00","close":"18:00"},"wed":{"open":"07:00","close":"18:00"},"thu":{"open":"07:00","close":"18:00"},"fri":{"open":"07:00","close":"19:00"},"sat":{"open":"07:00","close":"19:00"},"sun":{"open":"08:00","close":"17:00"}}'),
    (loc_brew,      org_brew,      'The Brew Room – Ekkamai',      '89 Ekkamai Rd, Bangkok', st_point(100.5857, 13.7178)::geography, 'active', '{"mon":{"open":"08:00","close":"20:00"},"tue":{"open":"08:00","close":"20:00"},"wed":{"open":"08:00","close":"20:00"},"thu":{"open":"08:00","close":"20:00"},"fri":{"open":"08:00","close":"21:00"},"sat":{"open":"09:00","close":"21:00"},"sun":{"open":"09:00","close":"20:00"}}'),
    (loc_siam,      org_siam,      'Siam Fresh Market',            'Siam Square Soi 7, Bangkok', st_point(100.5347, 13.7455)::geography, 'active', '{"mon":{"open":"08:00","close":"21:00"},"tue":{"open":"08:00","close":"21:00"},"wed":{"open":"08:00","close":"21:00"},"thu":{"open":"08:00","close":"21:00"},"fri":{"open":"08:00","close":"21:00"},"sat":{"open":"08:00","close":"21:00"},"sun":{"open":"08:00","close":"21:00"}}'),
    (loc_lotus,     org_lotus,     'Lotus Superstore – Bangna',    'Bangna-Trad Km.2, Bangkok', st_point(100.6702, 13.6711)::geography, 'active', '{"mon":{"open":"08:00","close":"22:00"},"tue":{"open":"08:00","close":"22:00"},"wed":{"open":"08:00","close":"22:00"},"thu":{"open":"08:00","close":"22:00"},"fri":{"open":"08:00","close":"22:00"},"sat":{"open":"08:00","close":"22:00"},"sun":{"open":"08:00","close":"22:00"}}'),
    (loc_noodle,    org_noodle,    'เส้นสวรรค์ – Lad Phrao',      '234 Lad Phrao Rd, Bangkok', st_point(100.5698, 13.7998)::geography, 'active', '{"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"09:00","close":"21:00"},"sun":{"open":"09:00","close":"19:00"}}'),
    (loc_hotel_bkk, org_hotel_bkk, 'Skyline Hotel – Silom',        '999 Silom Rd, Bangkok', st_point(100.5255, 13.7234)::geography, 'active', '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"23:00"},"sat":{"open":"06:00","close":"23:00"},"sun":{"open":"06:00","close":"22:00"}}'),
    (loc_buffet,    org_buffet,    'สุขสำราญ Buffet – Don Mueang', '56 Vibhavadi Rd, Bangkok', st_point(100.5541, 13.9072)::geography, 'active', '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"10:00","close":"21:00"}}'),
    (loc_deli_bkk,  org_deli_bkk, 'BKK Deli – Phrom Phong',       '12 Sukhumvit 33, Bangkok', st_point(100.5691, 13.7273)::geography, 'active', '{"mon":{"open":"09:00","close":"20:00"},"tue":{"open":"09:00","close":"20:00"},"wed":{"open":"09:00","close":"20:00"},"thu":{"open":"09:00","close":"20:00"},"fri":{"open":"09:00","close":"20:00"},"sat":{"open":"09:00","close":"20:00"},"sun":{"open":"10:00","close":"18:00"}}'),
    (loc_juice,     org_juice,     'JuiceBar 99 – Ari',            '78 Phahon Yothin Soi 7, Bangkok', st_point(100.5464, 13.7745)::geography, 'active', '{"mon":{"open":"07:00","close":"19:00"},"tue":{"open":"07:00","close":"19:00"},"wed":{"open":"07:00","close":"19:00"},"thu":{"open":"07:00","close":"19:00"},"fri":{"open":"07:00","close":"20:00"},"sat":{"open":"07:00","close":"20:00"},"sun":{"open":"08:00","close":"18:00"}}'),
    -- Chiang Mai (~18.79, 98.99)
    (loc_cm_cafe,   org_cm_cafe,  'Doi Cafe – Nimman',            '1 Nimmanhemin Rd, Chiang Mai', st_point(98.9674, 18.7947)::geography, 'active', '{"mon":{"open":"07:00","close":"19:00"},"tue":{"open":"07:00","close":"19:00"},"wed":{"open":"07:00","close":"19:00"},"thu":{"open":"07:00","close":"19:00"},"fri":{"open":"07:00","close":"19:00"},"sat":{"open":"07:00","close":"19:00"},"sun":{"open":"08:00","close":"18:00"}}'),
    (loc_cm_bake,   org_cm_bake,  'CM Patisserie – Old City',     '33 Ratchadamnoen Rd, Chiang Mai', st_point(98.9876, 18.7884)::geography, 'active', '{"mon":{"open":"08:00","close":"18:00"},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"18:00"},"sat":{"open":"08:00","close":"18:00"},"sun":{"open":"09:00","close":"16:00"}}'),
    (loc_cm_rest,   org_cm_rest,  'Khao Soi Paradise – Faham',    '22 Faham Rd, Chiang Mai', st_point(98.9897, 18.7826)::geography, 'active', '{"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"09:00","close":"21:00"},"sun":{"open":"09:00","close":"19:00"}}'),
    (loc_cm_supe,   org_cm_supe,  'Tops – Maya Mall',             'Maya Mall, Nimman, Chiang Mai', st_point(98.9677, 18.8023)::geography, 'active', '{"mon":{"open":"09:00","close":"22:00"},"tue":{"open":"09:00","close":"22:00"},"wed":{"open":"09:00","close":"22:00"},"thu":{"open":"09:00","close":"22:00"},"fri":{"open":"09:00","close":"22:00"},"sat":{"open":"09:00","close":"22:00"},"sun":{"open":"09:00","close":"22:00"}}'),
    (loc_cm_juice,  org_cm_juice, 'Nimman Juice Bar',             '5 Nimmana Haeminda Soi 7, Chiang Mai', st_point(98.9681, 18.7962)::geography, 'active', '{"mon":{"open":"08:00","close":"19:00"},"tue":{"open":"08:00","close":"19:00"},"wed":{"open":"08:00","close":"19:00"},"thu":{"open":"08:00","close":"19:00"},"fri":{"open":"08:00","close":"19:00"},"sat":{"open":"08:00","close":"19:00"},"sun":{"open":"09:00","close":"18:00"}}'),
    -- Phuket (~7.88, 98.39)
    (loc_pkt_rest,  org_pkt_rest, 'Phuket Town Bistro',           '15 Thalang Rd, Phuket Town', st_point(98.3872, 7.8867)::geography, 'active', '{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"22:00"},"sat":{"open":"10:00","close":"22:00"},"sun":{"open":"10:00","close":"20:00"}}'),
    (loc_pkt_hotel, org_pkt_hotel,'Andaman Resort – Patong',      '100 Beach Rd, Patong, Phuket', st_point(98.2971, 7.8951)::geography, 'active', '{"mon":{"open":"06:00","close":"22:00"},"tue":{"open":"06:00","close":"22:00"},"wed":{"open":"06:00","close":"22:00"},"thu":{"open":"06:00","close":"22:00"},"fri":{"open":"06:00","close":"23:00"},"sat":{"open":"06:00","close":"23:00"},"sun":{"open":"06:00","close":"22:00"}}'),
    (loc_pkt_cafe,  org_pkt_cafe, 'Rawai Coffee – Rawai Beach',   '88 Viset Rd, Rawai, Phuket', st_point(98.3317, 7.7861)::geography, 'active', '{"mon":{"open":"07:00","close":"18:00"},"tue":{"open":"07:00","close":"18:00"},"wed":{"open":"07:00","close":"18:00"},"thu":{"open":"07:00","close":"18:00"},"fri":{"open":"07:00","close":"18:00"},"sat":{"open":"07:00","close":"18:00"},"sun":{"open":"07:00","close":"18:00"}}'),
    -- Khon Kaen (~16.44, 102.83)
    (loc_kk_rest,   org_kk_rest,  'ขอนแก่น BBQ House',           '200 Mittraphap Rd, Khon Kaen', st_point(102.8356, 16.4322)::geography, 'active', '{"mon":{"open":"16:00","close":"23:00"},"tue":{"open":"16:00","close":"23:00"},"wed":{"open":"16:00","close":"23:00"},"thu":{"open":"16:00","close":"23:00"},"fri":{"open":"16:00","close":"00:00"},"sat":{"open":"15:00","close":"00:00"},"sun":{"open":"15:00","close":"23:00"}}'),
    (loc_kk_bake,   org_kk_bake,  'KK Sweet Bakery – City Centre','44 Si Chan Rd, Khon Kaen', st_point(102.8326, 16.4412)::geography, 'active', '{"mon":{"open":"07:00","close":"18:00"},"tue":{"open":"07:00","close":"18:00"},"wed":{"open":"07:00","close":"18:00"},"thu":{"open":"07:00","close":"18:00"},"fri":{"open":"07:00","close":"18:00"},"sat":{"open":"07:00","close":"18:00"},"sun":{"open":"08:00","close":"16:00"}}'),
    -- Multi-location chain
    (loc_chain_bkk, org_chain,   'Green Earth Cafe – Silom',     '777 Silom Rd, Bangkok', st_point(100.5232, 13.7241)::geography, 'active', '{"mon":{"open":"07:00","close":"20:00"},"tue":{"open":"07:00","close":"20:00"},"wed":{"open":"07:00","close":"20:00"},"thu":{"open":"07:00","close":"20:00"},"fri":{"open":"07:00","close":"21:00"},"sat":{"open":"08:00","close":"21:00"},"sun":{"open":"08:00","close":"20:00"}}'),
    (loc_chain_cm,  org_chain,   'Green Earth Cafe – Nimman',    '3 Nimmana Haeminda Rd, Chiang Mai', st_point(98.9679, 18.7955)::geography, 'active', '{"mon":{"open":"07:00","close":"20:00"},"tue":{"open":"07:00","close":"20:00"},"wed":{"open":"07:00","close":"20:00"},"thu":{"open":"07:00","close":"20:00"},"fri":{"open":"07:00","close":"21:00"},"sat":{"open":"08:00","close":"21:00"},"sun":{"open":"08:00","close":"20:00"}}')
  on conflict (id) do nothing;

  -- Sample listings (mix of surprise_bag and pick_your_own, various stock)
  insert into public.listings (id, location_id, title, category, description, fulfillment_type, original_value_thb, price_thb, qty_total, qty_remaining, status, auto_repeat)
  values
    ('cccccccc-0001-0001-0001-000000000001', loc_aroi,      'อาหารไทยเซอร์ไพรส์แบ็ก',             'restaurant', null,                          'surprise_bag',   180, 65,  5, 5, 'active', true),
    ('cccccccc-0002-0001-0001-000000000001', loc_bake,      'Pastry Surprise Box',                  'bakery',     'Assorted pastries & bread',    'surprise_bag',   250, 89,  8, 8, 'active', true),
    ('cccccccc-0003-0001-0001-000000000001', loc_brew,      'Coffee & Snack Bag',                   'cafe',       null,                          'surprise_bag',   150, 55,  6, 6, 'active', false),
    ('cccccccc-0004-0001-0001-000000000001', loc_siam,      'Fresh Produce Bundle',                 'grocery',    null,                          'pick_your_own',  300, 120, 10, 10,'active', false),
    ('cccccccc-0005-0001-0001-000000000001', loc_lotus,     'Supermarket End-of-Day Bag',           'supermarket',null,                          'surprise_bag',   400, 149, 20, 18,'active', true),
    ('cccccccc-0006-0001-0001-000000000001', loc_noodle,    'เส้นหมดวัน Noodle Bag',               'restaurant', null,                          'surprise_bag',   120, 45,  4, 4, 'active', false),
    ('cccccccc-0007-0001-0001-000000000001', loc_hotel_bkk, 'Hotel Breakfast Leftover Box',         'hotel',      'Pastries, fruits, yoghurt',   'surprise_bag',   500, 189, 3, 3, 'active', true),
    ('cccccccc-0008-0001-0001-000000000001', loc_buffet,    'Buffet Rescue Bag',                    'buffet',     null,                          'surprise_bag',   350, 129, 10, 10,'active', true),
    ('cccccccc-0009-0001-0001-000000000001', loc_deli_bkk,  'Deli Pick-Your-Own',                   'deli',       'Choose from today''s counter', 'pick_your_own',  280, 99,  5, 5, 'active', false),
    ('cccccccc-0010-0001-0001-000000000001', loc_juice,     'Juice & Smoothie Bag',                 'juice_bar',  null,                          'surprise_bag',   160, 59,  8, 8, 'active', false),
    ('cccccccc-0011-0001-0001-000000000001', loc_cm_cafe,   'Highland Coffee Bag',                  'cafe',       null,                          'surprise_bag',   140, 49,  6, 6, 'active', false),
    ('cccccccc-0012-0001-0001-000000000001', loc_cm_bake,   'Patisserie Surprise',                  'bakery',     null,                          'surprise_bag',   300, 109, 5, 5, 'active', true),
    ('cccccccc-0013-0001-0001-000000000001', loc_cm_rest,   'Khao Soi Set',                         'restaurant', null,                          'surprise_bag',   160, 59,  8, 7, 'active', false),
    ('cccccccc-0014-0001-0001-000000000001', loc_cm_supe,   'Supermarket Pick-Your-Own',            'supermarket',null,                          'pick_your_own',  500, 199, 15, 15,'active', false),
    ('cccccccc-0015-0001-0001-000000000001', loc_pkt_rest,  'Sino-Portuguese Surprise Bag',         'restaurant', null,                          'surprise_bag',   220, 79,  6, 6, 'active', false),
    ('cccccccc-0016-0001-0001-000000000001', loc_pkt_hotel, 'Resort Buffet Leftover Box',           'hotel',      null,                          'surprise_bag',   600, 229, 4, 4, 'active', true),
    ('cccccccc-0017-0001-0001-000000000001', loc_pkt_cafe,  'Rawai Beach Coffee Bag',               'cafe',       null,                          'surprise_bag',   130, 49,  5, 5, 'active', false),
    ('cccccccc-0018-0001-0001-000000000001', loc_kk_rest,   'BBQ & Som Tam Rescue Bag',             'restaurant', null,                          'surprise_bag',   200, 69,  6, 6, 'active', false),
    ('cccccccc-0019-0001-0001-000000000001', loc_kk_bake,   'KK Bakery Daily Bag',                  'bakery',     null,                          'surprise_bag',   120, 39,  10, 10,'active', true),
    ('cccccccc-0020-0001-0001-000000000001', loc_chain_bkk, 'Green Earth Cafe Bag – Silom',         'cafe',       null,                          'surprise_bag',   160, 59,  8, 8, 'active', true),
    ('cccccccc-0021-0001-0001-000000000001', loc_chain_cm,  'Green Earth Cafe Bag – Nimman',        'cafe',       null,                          'surprise_bag',   160, 59,  8, 8, 'active', true)
  on conflict (id) do nothing;

  -- Pickup slots for each listing (today + tomorrow, 18:00–20:00)
  insert into public.pickup_slots (id, listing_id, starts_at, ends_at, capacity, reserved_count)
  select
    gen_random_uuid(),
    l.id,
    (current_date + interval '1 day' + time '18:00')::timestamptz,
    (current_date + interval '1 day' + time '20:00')::timestamptz,
    l.qty_total,
    0
  from public.listings l
  where l.id::text like 'cccccccc-%'
  on conflict do nothing;

  -- Listing items for pick_your_own listings
  -- loc_siam: Fresh Produce Bundle
  insert into public.listing_items (id, listing_id, name, available_qty, price_thb, original_price_thb)
  values
    ('dddddddd-0001-0001-0001-000000000001', 'cccccccc-0004-0001-0001-000000000001', 'Dragon Fruit', 20, 15, 40),
    ('dddddddd-0002-0001-0001-000000000001', 'cccccccc-0004-0001-0001-000000000001', 'Mangosteen (5 pcs)', 15, 25, 60),
    ('dddddddd-0003-0001-0001-000000000001', 'cccccccc-0004-0001-0001-000000000001', 'Morning Glory (bunch)', 30, 10, 25),
    ('dddddddd-0004-0001-0001-000000000001', 'cccccccc-0004-0001-0001-000000000001', 'Thai Basil (pack)', 30, 8, 20)
  on conflict (id) do nothing;

  -- loc_deli_bkk: Deli Pick-Your-Own
  insert into public.listing_items (id, listing_id, name, available_qty, price_thb, original_price_thb)
  values
    ('dddddddd-0005-0001-0001-000000000001', 'cccccccc-0009-0001-0001-000000000001', 'Smoked Salmon (100g)', 10, 49, 120),
    ('dddddddd-0006-0001-0001-000000000001', 'cccccccc-0009-0001-0001-000000000001', 'Brie Cheese (100g)', 8, 39, 99),
    ('dddddddd-0007-0001-0001-000000000001', 'cccccccc-0009-0001-0001-000000000001', 'Sourdough Loaf', 6, 45, 110)
  on conflict (id) do nothing;

  -- loc_cm_supe: Supermarket Pick-Your-Own
  insert into public.listing_items (id, listing_id, name, available_qty, price_thb, original_price_thb)
  values
    ('dddddddd-0008-0001-0001-000000000001', 'cccccccc-0014-0001-0001-000000000001', 'Ready Meal – Pad Thai', 10, 35, 89),
    ('dddddddd-0009-0001-0001-000000000001', 'cccccccc-0014-0001-0001-000000000001', 'Ready Meal – Green Curry', 8, 35, 89),
    ('dddddddd-0010-0001-0001-000000000001', 'cccccccc-0014-0001-0001-000000000001', 'Fresh Juice (500ml)', 20, 25, 59),
    ('dddddddd-0011-0001-0001-000000000001', 'cccccccc-0014-0001-0001-000000000001', 'Sushi Box (6 pcs)', 6, 59, 149)
  on conflict (id) do nothing;

end $seed$;
