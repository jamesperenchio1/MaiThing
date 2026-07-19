-- Fix cancel_order to always set status to 'cancelled'.
-- The actual Stripe refund is performed by the refund-payment Edge Function.
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
begin
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

  select * into v_slot from public.pickup_slots where id = v_order.pickup_slot_id;
  v_deadline := v_slot.starts_at - interval '2 hours';
  if now() > v_deadline then
    raise exception 'cancellation_deadline_passed';
  end if;

  select * into v_listing from public.listings where id = v_order.listing_id for update;

  update public.listings
  set qty_remaining = qty_remaining + v_order.qty
  where id = v_order.listing_id;

  update public.pickup_slots
  set reserved_count = reserved_count - 1
  where id = v_order.pickup_slot_id;

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
