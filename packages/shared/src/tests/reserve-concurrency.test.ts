import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import type { Database } from '../types/supabase';

/**
 * Concurrency test for `reserve_order`.
 *
 * Requires the following environment variables to run:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *
 * If either is missing, the test is skipped. This is a human-prerequisite
 * credential (Section 21 of the build brief); it cannot be faked.
 */
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const runIntegrationTest = !!url && !!serviceRoleKey;

if (runIntegrationTest) {
  describe('reserve_order concurrency', () => {
    if (!url || !serviceRoleKey) throw new Error('Missing Supabase credentials');
    const admin = createClient<Database>(url, serviceRoleKey);

    const testEmail = (idx: number) => `concurrency.test.${idx}@example.com`;
    const testPassword = 'TestPassword123!';

    async function createTestUser(idx: number) {
      const email = testEmail(idx);
      // Clean up any previous test user from a failed run.
      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
      const found = existing?.users.find((u) => u.email === email);
      if (found) await admin.auth.admin.deleteUser(found.id);

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: testPassword,
        email_confirm: true,
      });
      if (error) throw error;
      return data.user;
    }

    async function signInClient(idx: number) {
      const client = createClient<Database>(url!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '');
      const { error } = await client.auth.signInWithPassword({
        email: testEmail(idx),
        password: testPassword,
      });
      if (error) throw error;
      return client;
    }

    async function setupTestListing() {
      const orgId = 'aaaaaaaa-0000-0000-0000-000000000001';
      const locationId = 'bbbbbbbb-0000-0000-0000-000000000001';
      const listingId = 'cccccccc-0000-0000-0000-000000000001';

      // Use deterministic UUIDs so repeated runs are idempotent.
      await admin.from('merchant_orgs').upsert({
        id: orgId,
        owner_id: '00000000-0000-0000-0000-000000000001',
        name: 'Concurrency Test Org',
        category: 'restaurant',
        subscription_tier: 'free',
        subscription_status: 'active',
        verified_at: new Date().toISOString(),
      });

      await admin.from('locations').upsert({
        id: locationId,
        org_id: orgId,
        name: 'Concurrency Test Location',
        address_text: 'Test Address',
        location: 'SRID=4326;POINT(100.5231 13.7367)',
        status: 'active',
      });

      await admin.from('listings').upsert({
        id: listingId,
        location_id: locationId,
        title: 'Last Item Listing',
        category: 'restaurant',
        fulfillment_type: 'surprise_bag',
        original_value_thb: 100,
        price_thb: 39,
        qty_total: 1,
        qty_remaining: 1,
        status: 'active',
      });

      const slotId = 'dddddddd-0000-0000-0000-000000000001';
      await admin.from('pickup_slots').upsert({
        id: slotId,
        listing_id: listingId,
        starts_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        capacity: 1,
        reserved_count: 0,
      });

      return { listingId, slotId };
    }

    async function cleanup() {
      const listingId = 'cccccccc-0000-0000-0000-000000000001';
      const slotId = 'dddddddd-0000-0000-0000-000000000001';
      const locationId = 'bbbbbbbb-0000-0000-0000-000000000001';
      const orgId = 'aaaaaaaa-0000-0000-0000-000000000001';

      await admin.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await admin.from('orders').delete().eq('listing_id', listingId);
      await admin.from('pickup_slots').delete().eq('id', slotId);
      await admin.from('listings').delete().eq('id', listingId);
      await admin.from('locations').delete().eq('id', locationId);
      await admin.from('merchant_orgs').delete().eq('id', orgId);

      for (let i = 1; i <= 2; i++) {
        const email = testEmail(i);
        const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 100 });
        const found = existing?.users.find((u) => u.email === email);
        if (found) await admin.auth.admin.deleteUser(found.id);
      }
    }

    it('exactly one racer wins when only one item is available', async () => {
      await cleanup();

      await Promise.all([createTestUser(1), createTestUser(2)]);
      const { listingId, slotId } = await setupTestListing();

      const [client1, client2] = await Promise.all([signInClient(1), signInClient(2)]);

      const call1 = client1.rpc('reserve_order', {
        p_listing_id: listingId,
        p_slot_id: slotId,
        p_items: null,
      });

      const call2 = client2.rpc('reserve_order', {
        p_listing_id: listingId,
        p_slot_id: slotId,
        p_items: null,
      });

      const [result1, result2] = await Promise.allSettled([call1, call2]);

      const successes = [result1, result2].filter(
        (r) => r.status === 'fulfilled' && r.value.data,
      ).length;
      const failures = [result1, result2].filter(
        (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error),
      ).length;

      expect(successes).toBe(1);
      expect(failures).toBe(1);

      const { data: listing } = await admin
        .from('listings')
        .select('qty_remaining, status')
        .eq('id', listingId)
        .single();
      expect(listing?.qty_remaining).toBe(0);
      expect(listing?.status).toBe('sold_out');

      const { data: slot } = await admin
        .from('pickup_slots')
        .select('reserved_count')
        .eq('id', slotId)
        .single();
      expect(slot?.reserved_count).toBe(1);

      // Exactly one order should have been created.
      const { count } = await admin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId);
      expect(count).toBe(1);

      await cleanup();
    }, 30_000);
  });
} else {
  describe('reserve_order concurrency (skipped)', () => {
    it('is skipped until SUPABASE_SERVICE_ROLE_KEY is provided', () => {
      expect(serviceRoleKey).toBeFalsy();
    });
  });
}
