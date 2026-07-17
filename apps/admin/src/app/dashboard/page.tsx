import { createClient } from '@/lib/supabase-server';
import type { Database } from '@maithing/shared';
import { redirect } from 'next/navigation';
import styles from './page.module.css';

type OrderStatus = Database['public']['Enums']['order_status'];
type OrderRow = { amount_thb: number };

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [orgs, locations, listings, ordersResult] = await Promise.all([
    supabase.from('merchant_orgs').select('id', { count: 'exact', head: true }),
    supabase.from('locations').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('orders').select('amount_thb').in('status', ['paid', 'collected'] as OrderStatus[]),
  ]);
  const orders = ordersResult as unknown as { data: OrderRow[] | null };
  const gmv = orders.data?.reduce((sum, o) => sum + Number(o.amount_thb), 0) ?? 0;
  return {
    orgs: orgs.count ?? 0,
    locations: locations.count ?? 0,
    activeListings: listings.count ?? 0,
    gmv,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const stats = await getStats(supabase);

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Platform Overview</h1>
      <div className={styles.grid}>
        <StatCard label="Merchant Orgs" value={stats.orgs} />
        <StatCard label="Active Locations" value={stats.locations} />
        <StatCard label="Active Listings" value={stats.activeListings} />
        <StatCard label="Total GMV" value={`฿${stats.gmv.toLocaleString('th-TH')}`} />
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  );
}
