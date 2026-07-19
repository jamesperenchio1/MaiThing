import { createServiceClient } from '@/lib/supabase-server';
import type { Database } from '@maithing/shared';
import cardStyles from './page.module.css';
import styles from './admin.module.css';

type OrderStatus = Database['public']['Enums']['order_status'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

function rangeToDate(range: string): string | null {
  if (range === '7d') return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === '30d') return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

async function getStats(supabase: ReturnType<typeof createServiceClient>, since: string | null) {
  const sinceDate = since ?? '1970-01-01T00:00:00.000Z';
  const [orgs, locations, listings, ordersResult] = await Promise.all([
    supabase
      .from('merchant_orgs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceDate),
    supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceDate),
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', sinceDate),
    supabase
      .from('orders')
      .select('amount_thb', { count: 'exact' })
      .in('status', ['paid', 'collected'] as OrderStatus[])
      .gte('created_at', sinceDate),
  ]);
  const orders = ordersResult.data ?? [];
  const gmv = orders.reduce((sum, o) => sum + Number(o.amount_thb), 0);
  return {
    orgs: orgs.count ?? 0,
    locations: locations.count ?? 0,
    activeListings: listings.count ?? 0,
    gmv,
    orderCount: ordersResult.count ?? 0,
  };
}

type TopMerchant = { name: string; total: number; count: number };

async function getTopMerchants(
  supabase: ReturnType<typeof createServiceClient>,
  since: string | null,
): Promise<TopMerchant[]> {
  let query = supabase
    .from('orders')
    .select('amount_thb, location_id')
    .in('status', ['paid', 'collected'] as OrderStatus[]);
  if (since) query = query.gte('created_at', since);
  const { data: orders } = await query;

  const locationIds = [...new Set((orders ?? []).map((o) => o.location_id))];
  const [locationsResult, orgsResult] = await Promise.all([
    supabase.from('locations').select('id, org_id').in('id', locationIds),
    supabase.from('merchant_orgs').select('id, name'),
  ]);

  const locations = locationsResult.data ?? [];
  const orgs = orgsResult.data ?? [];
  const locationToOrg = new Map(locations.map((l) => [l.id, l.org_id]));
  const orgNames = new Map(orgs.map((o) => [o.id, o.name]));

  const totals = new Map<string, TopMerchant>();
  for (const order of orders ?? []) {
    const orgId = locationToOrg.get(order.location_id);
    if (!orgId) continue;
    const name = orgNames.get(orgId) ?? 'Unknown';
    const current = totals.get(name) ?? { name, total: 0, count: 0 };
    current.total += Number(order.amount_thb);
    current.count += 1;
    totals.set(name, current);
  }

  return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, 10);
}

type OrderWithDetails = OrderRow & {
  profiles: { display_name: string | null } | null;
  listings: { title: string } | null;
};

async function getRecentOrders(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase
    .from('orders')
    .select('*, profiles(display_name), listings(title)')
    .order('created_at', { ascending: false })
    .limit(10);
  return (data as OrderWithDetails[] | null) ?? [];
}

type HeatmapCell = { geohash: string; category: string | null; count: number };

async function getDemandHeatmap(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase.from('demand_signals').select('geohash, category').limit(1000);
  const rows = data ?? [];
  const counts = new Map<string, HeatmapCell>();
  for (const row of rows) {
    const key = `${row.geohash}|${row.category ?? ''}`;
    const cell = counts.get(key) ?? { geohash: row.geohash, category: row.category, count: 0 };
    cell.count += 1;
    counts.set(key, cell);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 20);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawRange = params.range;
  const range = typeof rawRange === 'string' ? rawRange : 'all';
  const since = rangeToDate(range);

  const supabase = createServiceClient();
  const [stats, topMerchants, recentOrders, heatmap] = await Promise.all([
    getStats(supabase, since),
    getTopMerchants(supabase, since),
    getRecentOrders(supabase),
    getDemandHeatmap(supabase),
  ]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <h1 className={styles.pageHeader}>Platform Overview</h1>
        <form action="/dashboard" method="get" className={styles.toolbar}>
          <div className={styles.formGroup}>
            <label htmlFor="range">Date range</label>
            <select id="range" name="range" defaultValue={range} className={styles.select}>
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={styles.button}>
            Apply
          </button>
        </form>
      </div>

      <div className={cardStyles.grid}>
        <StatCard label="Merchant Orgs" value={stats.orgs} />
        <StatCard label="Active Locations" value={stats.locations} />
        <StatCard label="Active Listings" value={stats.activeListings} />
        <StatCard label="Total GMV" value={`฿${stats.gmv.toLocaleString('th-TH')}`} />
      </div>

      <h2 className={styles.pageHeader} style={{ marginTop: '2rem', fontSize: '1.25rem' }}>
        Top Merchants
      </h2>
      {topMerchants.length === 0 ? (
        <p className={styles.empty}>No merchant sales in this range.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Merchant</th>
              <th className={styles.th}>Orders</th>
              <th className={styles.th}>GMV</th>
            </tr>
          </thead>
          <tbody>
            {topMerchants.map((merchant) => (
              <tr key={merchant.name} className={styles.row}>
                <td className={styles.td}>{merchant.name}</td>
                <td className={styles.td}>{merchant.count}</td>
                <td className={styles.td}>฿{merchant.total.toLocaleString('th-TH')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className={styles.pageHeader} style={{ marginTop: '2rem', fontSize: '1.25rem' }}>
        Recent Orders
      </h2>
      {recentOrders.length === 0 ? (
        <p className={styles.empty}>No orders yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Code</th>
              <th className={styles.th}>Buyer</th>
              <th className={styles.th}>Listing</th>
              <th className={styles.th}>Amount</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className={styles.row}>
                <td className={styles.td}>{order.pickup_code}</td>
                <td className={styles.td}>{order.profiles?.display_name ?? 'Unknown'}</td>
                <td className={styles.td}>{order.listings?.title ?? 'Unknown'}</td>
                <td className={styles.td}>฿{Number(order.amount_thb).toLocaleString('th-TH')}</td>
                <td className={styles.td}>
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className={styles.pageHeader} style={{ marginTop: '2rem', fontSize: '1.25rem' }}>
        Demand vs Supply Heatmap
      </h2>
      {heatmap.length === 0 ? (
        <p className={styles.empty}>No demand signals yet.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Geohash</th>
              <th className={styles.th}>Category</th>
              <th className={styles.th}>Demand Signals</th>
            </tr>
          </thead>
          <tbody>
            {heatmap.map((cell) => (
              <tr key={`${cell.geohash}-${cell.category ?? 'all'}`} className={styles.row}>
                <td className={styles.td}>{cell.geohash}</td>
                <td className={styles.td}>{cell.category ?? 'Any'}</td>
                <td className={styles.td}>{cell.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.cardLabel}>{label}</div>
      <div className={cardStyles.cardValue}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const color =
    status === 'collected' || status === 'paid'
      ? styles.badgeGreen
      : status === 'cancelled' || status === 'refunded'
        ? styles.badgeRed
        : styles.badgeAmber;
  return <span className={`${styles.badge} ${color}`}>{status}</span>;
}
