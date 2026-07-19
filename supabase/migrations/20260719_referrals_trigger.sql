-- MaiThing (RescueBite) — Referral system migration
-- Adds referral_code / referred_by_code to profiles, generates a code on signup,
-- creates a referrals row when a buyer applies a code, and rewards the buyer on
-- the first collected order after they were referred.

-- ─── Schema additions ──────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists referral_code   text,
  add column if not exists referred_by_code text;

-- One code per user, but a code can refer many users.
alter table public.profiles
  add constraint profiles_referral_code_key unique (referral_code);

-- The original schema incorrectly made referrals.code unique. Drop it so one
-- referrer can have many referred users.
alter table public.referrals
  drop constraint if exists referrals_code_key;

drop index if exists referrals_code_idx;
create index if not exists referrals_code_idx on public.referrals(code);

create index if not exists profiles_referral_code_idx on public.profiles(referral_code);

-- Prevent a single buyer from being linked to multiple referral rows.
create unique index if not exists referrals_referrer_referred_idx
  on public.referrals (referrer_id, referred_id)
  where referred_id is not null;

-- Backfill existing profiles with deterministic 6-character referral codes.
do $$
declare
  p record;
  code text;
  attempts int;
begin
  for p in select id from public.profiles where referral_code is null loop
    attempts := 0;
    loop
      attempts := attempts + 1;
      code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));
      begin
        update public.profiles set referral_code = code where id = p.id;
        exit;
      exception when unique_violation then
        if attempts >= 10 then
          raise exception 'Could not generate unique referral code for %', p.id;
        end if;
      end;
    end loop;
  end loop;
end;
$$;

-- ─── RPC: apply a referral code ──────────────────────────────────────────────

create or replace function public.apply_referral_code(p_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user_id     uuid := auth.uid();
  v_referrer_id uuid;
  v_profile     record;
  v_normalized  text;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_profile.referred_by_code is not null then
    raise exception 'referral_already_applied';
  end if;

  v_normalized := upper(trim(p_code));
  if length(v_normalized) = 0 then
    raise exception 'invalid_code';
  end if;

  -- Cannot refer yourself.
  if v_profile.referral_code = v_normalized then
    raise exception 'self_referral';
  end if;

  select id into v_referrer_id from public.profiles where referral_code = v_normalized;
  if v_referrer_id is null then
    raise exception 'referrer_not_found';
  end if;

  update public.profiles
  set referred_by_code = v_normalized
  where id = v_user_id;

  -- Only create one referral record per referred buyer.
  if not exists (select 1 from public.referrals where referred_id = v_user_id) then
    insert into public.referrals (referrer_id, referred_id, code, reward_status)
    values (v_referrer_id, v_user_id, v_normalized, 'pending');
  end if;
end;
$$;

-- ─── Trigger: generate a referral code for every new user ──────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_code    text;
  attempts  int := 0;
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

  -- Generate a unique referral code for the new profile (or an existing one that
  -- was created without a code).
  loop
    attempts := attempts + 1;
    v_code := upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 6));
    begin
      update public.profiles
      set referral_code = v_code
      where id = new.id and referral_code is null;
      exit;
    exception when unique_violation then
      if attempts >= 10 then
        raise exception 'Could not generate unique referral code';
      end if;
    end;
  end loop;

  insert into public.user_impact (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;

-- Re-create the auth trigger so the updated function is bound.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Trigger: reward a referral when the referred buyer collects an order ──────

create or replace function public.reward_referral_on_collection()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_referred_by text;
  v_reward_thb  numeric := 10;
begin
  if new.status = 'collected' and old.status != 'collected' then
    select referred_by_code into v_referred_by
    from public.profiles
    where id = new.buyer_id;

    if v_referred_by is not null then
      update public.referrals
      set reward_status = 'rewarded'
      where referred_id = new.buyer_id
        and reward_status = 'pending';

      if found then
        update public.user_impact
        set thb_saved = thb_saved + v_reward_thb
        where profile_id = new.buyer_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_order_collected_reward on public.orders;
create trigger on_order_collected_reward
  after update of status on public.orders
  for each row execute procedure public.reward_referral_on_collection();
