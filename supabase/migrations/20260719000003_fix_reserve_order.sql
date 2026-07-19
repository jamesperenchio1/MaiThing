-- Fix ambiguous `qr_payload` reference in reserve_order return query.
-- The subquery `select qr_payload from public.orders where id = v_order_id`
-- was ambiguous because the function's return column `qr_payload` was also
-- visible in scope, causing Postgres error 42702.
--
-- Also fixes the QR payload to contain the actual order_id instead of a
-- randomly generated UUID.
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
  v_qr_payload  text;
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
  v_code := upper(substring(encode(extensions.gen_random_bytes(4), 'hex') from 1 for 6));

  -- Pre-generate the order id so the QR payload contains the real order id.
  v_order_id := gen_random_uuid();

  -- Build QR payload (deterministic, using real order id — v_order_id is pre-generated above)
  v_qr_payload := json_build_object(
    'order_id', v_order_id,
    'code', v_code,
    'listing_id', p_listing_id
  )::text;

  -- Create order
  insert into public.orders (
    buyer_id, listing_id, location_id, pickup_slot_id,
    qty, amount_thb, platform_fee_thb, status,
    pickup_code, qr_payload
  )
  values (
    auth.uid(),
    p_listing_id,
    v_listing.location_id,
    p_slot_id,
    v_qty,
    v_total_thb,
    v_fee_thb,
    'reserved',
    v_code,
    v_qr_payload
  )
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

  return query select v_order_id, v_code, v_qr_payload;
end;
$$;
