-- MaiThing (RescueBite) — Payments backend RPCs and RLS fixes
-- Applies to Supabase Cloud dev project: bvvsuollejcndcjjveal

-- ─── Triggers ───────────────────────────────────────────────────────────────

-- Auto-update chat_threads.last_message_at when a new message is inserted.
create or replace function public.handle_new_chat_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.chat_threads
  set last_message_at = new.created_at
  where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists on_chat_message_insert on public.chat_messages;
create trigger on_chat_message_insert
  after insert on public.chat_messages
  for each row execute procedure public.handle_new_chat_message();

-- ─── RPCs ────────────────────────────────────────────────────────────────────

-- cancel_order: buyer cancels an active order, restores inventory, and marks
-- refund state. The actual Stripe refund is initiated by the client via the
-- create-payment-intent Edge Function; the webhook finalizes status.
create or replace function public.cancel_order(
  p_order_id    uuid,
  p_reason      text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order     record;
  v_slot      record;
  v_listing   record;
  v_items     record;
  v_deadline  timestamptz;
  v_new_status order_status;
begin
  -- Advisory lock scoped to the order to prevent double-cancellation races.
  perform pg_advisory_xact_lock(('x' || encode(p_order_id::text::bytea, 'hex'))::bit(63)::bigint);

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.buyer_id != auth.uid() then
    raise exception 'not_order_owner';
  end if;

  if v_order.status not in ('reserved', 'paid') then
    raise exception 'order_not_cancellable';
  end if;

  -- Free-cancellation deadline: up to 2 hours before the pickup slot starts.
  select * into v_slot from public.pickup_slots where id = v_order.pickup_slot_id;
  v_deadline := v_slot.starts_at - interval '2 hours';
  if now() > v_deadline then
    raise exception 'cancellation_deadline_passed';
  end if;

  select * into v_listing from public.listings where id = v_order.listing_id for update;

  -- Restore listing quantity
  update public.listings
  set qty_remaining = qty_remaining + v_order.qty
  where id = v_order.listing_id;

  -- Restore slot capacity
  update public.pickup_slots
  set reserved_count = reserved_count - 1
  where id = v_order.pickup_slot_id;

  -- Restore pick-your-own item reservations
  if v_listing.fulfillment_type = 'pick_your_own' then
    for v_items in select * from public.order_items where order_id = p_order_id loop
      update public.listing_items
      set reserved_qty = reserved_qty - v_items.qty
      where id = v_items.listing_item_id;
    end loop;
  end if;

  update public.orders
  set
    status = 'cancelled',
    cancelled_at = now()
  where id = p_order_id;
end;
$$;

-- collect_order: merchant confirms a paid order by pickup code.
create or replace function public.collect_order(
  p_order_id      uuid,
  p_pickup_code   text
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order record;
begin
  -- Advisory lock scoped to the order to prevent double-collection races.
  perform pg_advisory_xact_lock(('x' || encode(p_order_id::text::bytea, 'hex'))::bit(63)::bigint);

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  -- Merchant must own the location.
  if not exists (
    select 1 from public.locations lo
    join public.merchant_orgs mo on mo.id = lo.org_id
    where lo.id = v_order.location_id and mo.owner_id = auth.uid()
  ) then
    raise exception 'not_location_owner';
  end if;

  if v_order.status != 'paid' then
    raise exception 'order_not_paid';
  end if;

  if upper(coalesce(p_pickup_code, '')) != v_order.pickup_code then
    raise exception 'invalid_pickup_code';
  end if;

  update public.orders
  set
    status = 'collected',
    collected_at = now()
  where id = p_order_id;

  -- Location ratings are updated by the review trigger when a review is later
  -- submitted; collection itself does not change the rating.
  -- user_impact is updated by the existing on_order_status_change trigger.
end;
$$;

-- create_slot_from_template: generate a concrete pickup slot from a template.
create or replace function public.create_slot_from_template(
  p_location_id uuid,
  p_listing_id  uuid,
  p_date        date
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_template record;
  v_starts   timestamptz;
  v_ends     timestamptz;
  v_slot_id  uuid;
begin
  -- Verify the listing belongs to the location and merchant owns the location.
  if not exists (
    select 1 from public.listings li
    join public.locations lo on lo.id = li.location_id
    join public.merchant_orgs mo on mo.id = lo.org_id
    where li.id = p_listing_id and lo.id = p_location_id and mo.owner_id = auth.uid()
  ) then
    raise exception 'not_listing_owner';
  end if;

  select * into v_template
  from public.slot_templates
  where location_id = p_location_id
    and extract(isodow from p_date)::int = any(weekdays)
  order by start_time
  limit 1;

  if not found then
    raise exception 'no_template_for_date';
  end if;

  v_starts := p_date::timestamptz + v_template.start_time::interval;
  v_ends   := p_date::timestamptz + v_template.end_time::interval;

  insert into public.pickup_slots (listing_id, starts_at, ends_at, capacity)
  values (p_listing_id, v_starts, v_ends, 10)
  returning id into v_slot_id;

  return v_slot_id;
end;
$$;

-- ─── Row Level Security fixes ───────────────────────────────────────────────

-- issue_reports: location owners must be able to see reports on their orders.
drop policy if exists "issue_reports_select_merchant" on public.issue_reports;
create policy "issue_reports_select_merchant" on public.issue_reports
  for select using (
    exists (
      select 1 from public.orders o
      join public.locations lo on lo.id = o.location_id
      join public.merchant_orgs mo on mo.id = lo.org_id
      where o.id = order_id and mo.owner_id = auth.uid()
    )
  );

-- platform_config: any authenticated user can read the single config row.
drop policy if exists "platform_config_select" on public.platform_config;
create policy "platform_config_select" on public.platform_config
  for select using (auth.uid() is not null);
