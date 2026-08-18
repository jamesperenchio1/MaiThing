-- favorites: customer's own saved merchants
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = buyer_id);
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = buyer_id);
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = buyer_id);

-- waitlist_entries: customer's own waitlist entries for sold-out listings
create policy "waitlist_select_own" on public.waitlist_entries
  for select using (auth.uid() = user_id);
create policy "waitlist_insert_own" on public.waitlist_entries
  for insert with check (auth.uid() = user_id);
create policy "waitlist_delete_own" on public.waitlist_entries
  for delete using (auth.uid() = user_id);

-- push_tokens: user manages their own device token(s) (user_id is stored as text)
create policy "push_tokens_select_own" on public.push_tokens
  for select using (auth.uid()::text = user_id);
create policy "push_tokens_insert_own" on public.push_tokens
  for insert with check (auth.uid()::text = user_id);
create policy "push_tokens_update_own" on public.push_tokens
  for update using (auth.uid()::text = user_id);
create policy "push_tokens_delete_own" on public.push_tokens
  for delete using (auth.uid()::text = user_id);

-- device_tokens: legacy/alternate push-token table, same owner pattern
create policy "device_tokens_select_own" on public.device_tokens
  for select using (auth.uid() = profile_id);
create policy "device_tokens_insert_own" on public.device_tokens
  for insert with check (auth.uid() = profile_id);
create policy "device_tokens_update_own" on public.device_tokens
  for update using (auth.uid() = profile_id);
create policy "device_tokens_delete_own" on public.device_tokens
  for delete using (auth.uid() = profile_id);

-- referrals: visible to the referrer and the person referred; writes go through apply_referral_code()
create policy "referrals_select_own" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- subscriptions: user can see their own subscription record; writes go through Stripe webhook (service role)
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = subscriber_id);

-- demand_signals: users can log their own demand signal, not read others'
create policy "demand_signals_insert_own" on public.demand_signals
  for insert with check (auth.uid() = buyer_id);

-- platform_config: readable by any authenticated user (feature flags), no client writes
create policy "platform_config_select_authenticated" on public.platform_config
  for select using (auth.role() = 'authenticated');

-- listing_items: public read (part of listing display), merchant owner can manage
create policy "listing_items_select" on public.listing_items
  for select using (true);
create policy "listing_items_all_merchant" on public.listing_items
  for all using (
    exists (
      select 1 from public.listings
      join public.locations on locations.id = listings.location_id
      join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
      where listings.id = listing_items.listing_id
        and merchant_orgs.owner_id = auth.uid()
    )
  );

-- pickup_slots: public read (customers browse availability), merchant owner can manage
create policy "pickup_slots_select" on public.pickup_slots
  for select using (true);
create policy "pickup_slots_all_merchant" on public.pickup_slots
  for all using (
    exists (
      select 1 from public.listings
      join public.locations on locations.id = listings.location_id
      join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
      where listings.id = pickup_slots.listing_id
        and merchant_orgs.owner_id = auth.uid()
    )
  );

-- slot_templates: merchant-only, manages their own recurring pickup schedule
create policy "slot_templates_all_merchant" on public.slot_templates
  for all using (
    exists (
      select 1 from public.locations
      join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
      where locations.id = slot_templates.location_id
        and merchant_orgs.owner_id = auth.uid()
    )
  );

-- promotions: public read (coupon lookup at checkout), merchant owner can manage
create policy "promotions_select" on public.promotions
  for select using (true);
create policy "promotions_all_merchant" on public.promotions
  for all using (
    exists (
      select 1 from public.merchant_orgs
      where merchant_orgs.id = promotions.org_id
        and merchant_orgs.owner_id = auth.uid()
    )
  );

-- order_items: visible to the order's buyer or the merchant who owns the order's location
create policy "order_items_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (
          orders.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations
            join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
            where locations.id = orders.location_id
              and merchant_orgs.owner_id = auth.uid()
          )
        )
    )
  );

-- issue_reports: buyer of the order can create/view; merchant owner can view/update
create policy "issue_reports_select" on public.issue_reports
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = issue_reports.order_id
        and (
          orders.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations
            join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
            where locations.id = orders.location_id
              and merchant_orgs.owner_id = auth.uid()
          )
        )
    )
  );
create policy "issue_reports_insert_buyer" on public.issue_reports
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = issue_reports.order_id
        and orders.buyer_id = auth.uid()
    )
  );
create policy "issue_reports_update_merchant" on public.issue_reports
  for update using (
    exists (
      select 1 from public.orders
      join public.locations on locations.id = orders.location_id
      join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
      where orders.id = issue_reports.order_id
        and merchant_orgs.owner_id = auth.uid()
    )
  );

-- chat_threads: buyer or the merchant who owns the location can see/create their threads
create policy "chat_threads_select" on public.chat_threads
  for select using (
    auth.uid() = buyer_id
    or exists (
      select 1 from public.locations
      join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
      where locations.id = chat_threads.location_id
        and merchant_orgs.owner_id = auth.uid()
    )
  );
create policy "chat_threads_insert_buyer" on public.chat_threads
  for insert with check (auth.uid() = buyer_id);

-- chat_messages: only participants of the parent thread can read/send/mark read
create policy "chat_messages_select" on public.chat_messages
  for select using (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and (
          chat_threads.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations
            join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
            where locations.id = chat_threads.location_id
              and merchant_orgs.owner_id = auth.uid()
          )
        )
    )
  );
create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and (
          chat_threads.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations
            join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
            where locations.id = chat_threads.location_id
              and merchant_orgs.owner_id = auth.uid()
          )
        )
    )
  );
create policy "chat_messages_update_participant" on public.chat_messages
  for update using (
    exists (
      select 1 from public.chat_threads
      where chat_threads.id = chat_messages.thread_id
        and (
          chat_threads.buyer_id = auth.uid()
          or exists (
            select 1 from public.locations
            join public.merchant_orgs on merchant_orgs.id = locations.merchant_org_id
            where locations.id = chat_threads.location_id
              and merchant_orgs.owner_id = auth.uid()
          )
        )
    )
  );
