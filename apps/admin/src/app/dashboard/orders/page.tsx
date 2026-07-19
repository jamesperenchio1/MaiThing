import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';
import { updateOrderStatus } from '@/lib/actions';
import type { Database } from '@maithing/shared';
import styles from '../admin.module.css';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

type OrderWithDetails = OrderRow & {
  profiles: { display_name: string | null } | null;
  listings: { title: string } | null;
  locations: { name: string } | null;
};

type OrderWithItems = OrderWithDetails & {
  order_items: OrderItemRow[];
};

const PAGE_SIZE = 20;
const ORDER_STATUSES = [
  'all',
  'reserved',
  'paid',
  'collected',
  'cancelled',
  'refunded',
  'no_show',
] as const;

function pageHref(
  path: string,
  params: Record<string, string | string[] | undefined>,
  page: number,
) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || value === undefined) continue;
    qs.set(key, String(value));
  }
  qs.set('page', String(page));
  return `${path}?${qs.toString()}`;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPage = params.page;
  const page = Math.max(1, Number(Array.isArray(rawPage) ? rawPage[0] : rawPage) || 1);
  const rawSearch = params.search;
  const search = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;
  const rawStatus = params.status;
  const statusFilter = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const rawDetail = params.detail;
  const detailId = Array.isArray(rawDetail) ? rawDetail[0] : rawDetail;

  const supabase = createServiceClient();
  let query = supabase
    .from('orders')
    .select('*, profiles!inner(display_name), listings!inner(title), locations!inner(name)', {
      count: 'exact',
    });
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as OrderRow['status']);
  }
  if (search) {
    query = query.ilike('pickup_code', `%${search}%`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  const rows = (data as OrderWithDetails[] | null) ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  let detailOrder: OrderWithItems | null = null;
  if (detailId) {
    const { data: order } = await supabase
      .from('orders')
      .select(
        '*, profiles!inner(display_name), listings!inner(title), locations!inner(name), order_items(*)',
      )
      .eq('id', detailId)
      .single();
    detailOrder = order;
  }

  return (
    <div>
      <h1 className={styles.pageHeader}>Orders</h1>
      <form action="/dashboard/orders" method="get" className={styles.toolbar}>
        <div className={styles.formGroup}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Pickup code"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter ?? 'all'}
            className={styles.select}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.button}>
          Filter
        </button>
      </form>

      {error ? (
        <p className={styles.empty}>Error loading orders.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No orders found.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Code</th>
                <th className={styles.th}>Buyer</th>
                <th className={styles.th}>Listing</th>
                <th className={styles.th}>Location</th>
                <th className={styles.th}>Amount</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Update</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  <td className={styles.td}>
                    <Link
                      href={`?${new URLSearchParams({ detail: row.id, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}), page: String(page) }).toString()}`}
                      className={styles.linkButton}
                    >
                      {row.pickup_code}
                    </Link>
                  </td>
                  <td className={styles.td}>{row.profiles?.display_name ?? 'Unknown'}</td>
                  <td className={styles.td}>{row.listings?.title ?? 'Unknown'}</td>
                  <td className={styles.td}>{row.locations?.name ?? 'Unknown'}</td>
                  <td className={styles.td}>฿{Number(row.amount_thb).toLocaleString('th-TH')}</td>
                  <td className={styles.td}>
                    <OrderStatusBadge status={row.status} />
                  </td>
                  <td className={styles.td}>
                    <form action={updateOrderStatus} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={row.id} />
                      <select name="status" defaultValue={row.status} className={styles.select}>
                        {ORDER_STATUSES.filter((s) => s !== 'all').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className={styles.buttonSecondary}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Update
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.pagination}>
            {page > 1 && (
              <Link
                href={pageHref('/dashboard/orders', params, page - 1)}
                className={styles.linkButton}
              >
                ← Previous
              </Link>
            )}
            <span>
              Page {page} of {totalPages || 1}
            </span>
            {page < totalPages && (
              <Link
                href={pageHref('/dashboard/orders', params, page + 1)}
                className={styles.linkButton}
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}

      {detailOrder && (
        <div className={styles.details}>
          <h3>Order {detailOrder.pickup_code}</h3>
          <p>
            <strong>Buyer:</strong> {detailOrder.profiles?.display_name ?? 'Unknown'}
          </p>
          <p>
            <strong>Listing:</strong> {detailOrder.listings?.title ?? 'Unknown'}
          </p>
          <p>
            <strong>Location:</strong> {detailOrder.locations?.name ?? 'Unknown'}
          </p>
          <p>
            <strong>Amount:</strong> ฿{Number(detailOrder.amount_thb).toLocaleString('th-TH')}
          </p>
          <p>
            <strong>Quantity:</strong> {detailOrder.qty}
          </p>
          <p>
            <strong>Created:</strong> {new Date(detailOrder.created_at).toLocaleString('th-TH')}
          </p>
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Order Items</h4>
          {detailOrder.order_items.length === 0 ? (
            <p>No items.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Item</th>
                  <th className={styles.th}>Qty</th>
                  <th className={styles.th}>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {detailOrder.order_items.map((item) => (
                  <tr key={item.id} className={styles.row}>
                    <td className={styles.td}>{item.name_snapshot}</td>
                    <td className={styles.td}>{item.qty}</td>
                    <td className={styles.td}>
                      ฿{Number(item.unit_price_thb).toLocaleString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: OrderRow['status'] }) {
  const className =
    status === 'collected' || status === 'paid'
      ? styles.badgeGreen
      : status === 'cancelled' || status === 'refunded' || status === 'no_show'
        ? styles.badgeRed
        : styles.badgeAmber;
  return <span className={`${styles.badge} ${className}`}>{status}</span>;
}
