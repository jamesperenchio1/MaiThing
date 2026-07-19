-- Fix RLS infinite recursion in admin-check policies.
-- The original policies used `exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')`
-- inside policies on `profiles` and other tables. Because the subquery re-entered the same
-- RLS policies, Postgres reported infinite recursion (42P17).
--
-- Fix: introduce a security-definer helper `public.is_admin()` that reads the profile role
-- without re-applying RLS, and use it in all admin policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- profiles
-- (select-own and update-own policies are not recursive; only the admin policy was.)
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

-- merchant_orgs
drop policy if exists "merchant_orgs_admin_all" on public.merchant_orgs;
create policy "merchant_orgs_admin_all" on public.merchant_orgs
  for all using (public.is_admin());

-- locations
drop policy if exists "locations_admin_all" on public.locations;
create policy "locations_admin_all" on public.locations
  for all using (public.is_admin());

-- listings
drop policy if exists "listings_admin_all" on public.listings;
create policy "listings_admin_all" on public.listings
  for all using (public.is_admin());

-- orders
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin());

-- issue_reports
drop policy if exists "issue_reports_admin_all" on public.issue_reports;
create policy "issue_reports_admin_all" on public.issue_reports
  for all using (public.is_admin());

-- user_impact
drop policy if exists "user_impact_admin_all" on public.user_impact;
create policy "user_impact_admin_all" on public.user_impact
  for all using (public.is_admin());

-- subscriptions
drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all" on public.subscriptions
  for all using (public.is_admin());

-- platform_config
drop policy if exists "platform_config_admin_update" on public.platform_config;
create policy "platform_config_admin_update" on public.platform_config
  for update using (public.is_admin());
