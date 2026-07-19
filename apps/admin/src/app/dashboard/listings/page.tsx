import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';
import { deleteListing, updateListingStatus } from '@/lib/actions';
import type { Database } from '@maithing/shared';
import styles from '../admin.module.css';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type ListingItemRow = Database['public']['Tables']['listing_items']['Row'];

type ListingWithLocation = ListingRow & {
  locations: { name: string } | null;
};

const PAGE_SIZE = 20;
const LISTING_STATUSES = ['all', 'draft', 'active', 'sold_out', 'expired', 'cancelled'] as const;

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

export default async function ListingsPage({
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
  let query = supabase.from('listings').select('*, locations!inner(name)', { count: 'exact' });
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as ListingRow['status']);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  const rows = (data as ListingWithLocation[] | null) ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  let detailListing: (ListingWithLocation & { listing_items: ListingItemRow[] }) | null = null;
  if (detailId) {
    const { data: listing } = await supabase
      .from('listings')
      .select('*, locations!inner(name), listing_items(*)')
      .eq('id', detailId)
      .single();
    detailListing = listing;
  }

  return (
    <div>
      <h1 className={styles.pageHeader}>Listing Moderation</h1>
      <form action="/dashboard/listings" method="get" className={styles.toolbar}>
        <div className={styles.formGroup}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Title or category"
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
            {LISTING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.button}>
          Filter
        </button>
      </form>

      {error ? (
        <p className={styles.empty}>Error loading listings.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No listings found.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Title</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Location</th>
                <th className={styles.th}>Price</th>
                <th className={styles.th}>Stock</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Actions</th>
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
                      {row.title}
                    </Link>
                  </td>
                  <td className={styles.td}>{row.category}</td>
                  <td className={styles.td}>{row.locations?.name ?? 'Unknown'}</td>
                  <td className={styles.td}>฿{Number(row.price_thb).toLocaleString('th-TH')}</td>
                  <td className={styles.td}>
                    {row.qty_remaining} / {row.qty_total}
                  </td>
                  <td className={styles.td}>
                    <ListingStatusBadge status={row.status} />
                  </td>
                  <td className={styles.td}>
                    {row.status === 'draft' && (
                      <form action={updateListingStatus} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="status" value="active" />
                        <button type="submit" className={styles.button}>
                          Approve
                        </button>
                      </form>
                    )}
                    {row.status === 'active' && (
                      <form action={updateListingStatus} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="status" value="draft" />
                        <button type="submit" className={styles.buttonSecondary}>
                          Pause
                        </button>
                      </form>
                    )}
                    <form action={deleteListing} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className={styles.buttonDanger}>
                        Delete
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
                href={pageHref('/dashboard/listings', params, page - 1)}
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
                href={pageHref('/dashboard/listings', params, page + 1)}
                className={styles.linkButton}
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}

      {detailListing && (
        <div className={styles.details}>
          <h3>{detailListing.title}</h3>
          <p>
            <strong>Location:</strong> {detailListing.locations?.name ?? 'Unknown'}
          </p>
          <p>
            <strong>Description:</strong> {detailListing.description ?? '—'}
          </p>
          <p>
            <strong>Price:</strong> ฿{Number(detailListing.price_thb).toLocaleString('th-TH')}{' '}
            (value ฿{Number(detailListing.original_value_thb).toLocaleString('th-TH')})
          </p>
          <p>
            <strong>Stock:</strong> {detailListing.qty_remaining} / {detailListing.qty_total}
          </p>
          <p>
            <strong>Fulfillment:</strong> {detailListing.fulfillment_type}
          </p>
          <p>
            <strong>Auto-repeat:</strong> {detailListing.auto_repeat ? 'Yes' : 'No'}
          </p>
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Items</h4>
          {detailListing.listing_items.length === 0 ? (
            <p>No items.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Available</th>
                  <th className={styles.th}>Reserved</th>
                  <th className={styles.th}>Price</th>
                </tr>
              </thead>
              <tbody>
                {detailListing.listing_items.map((item) => (
                  <tr key={item.id} className={styles.row}>
                    <td className={styles.td}>{item.name}</td>
                    <td className={styles.td}>{item.available_qty}</td>
                    <td className={styles.td}>{item.reserved_qty}</td>
                    <td className={styles.td}>฿{Number(item.price_thb).toLocaleString('th-TH')}</td>
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

function ListingStatusBadge({ status }: { status: ListingRow['status'] }) {
  const className =
    status === 'active'
      ? styles.badgeGreen
      : status === 'draft'
        ? styles.badgeAmber
        : status === 'sold_out'
          ? styles.badgeGray
          : styles.badgeRed;
  return <span className={`${styles.badge} ${className}`}>{status}</span>;
}
