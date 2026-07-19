import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';
import { approveMerchant, reactivateMerchant, suspendMerchant } from '@/lib/actions';
import type { Database } from '@maithing/shared';
import styles from '../admin.module.css';

type MerchantOrgRow = Database['public']['Tables']['merchant_orgs']['Row'];

type MerchantOrgWithOwner = MerchantOrgRow & {
  profiles: { display_name: string | null } | null;
};

const PAGE_SIZE = 20;

function statusFromRow(row: MerchantOrgRow): 'pending' | 'verified' | 'suspended' {
  if (row.suspended_at) return 'suspended';
  if (row.verified_at) return 'verified';
  return 'pending';
}

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

export default async function MerchantsPage({
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
    .from('merchant_orgs')
    .select('*, profiles!inner(display_name)', { count: 'exact' });

  if (statusFilter === 'pending') query = query.is('verified_at', null).is('suspended_at', null);
  if (statusFilter === 'verified')
    query = query.not('verified_at', 'is', null).is('suspended_at', null);
  if (statusFilter === 'suspended') query = query.not('suspended_at', 'is', null);

  if (search) {
    query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  const rows = (data as MerchantOrgWithOwner[] | null) ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  let detailOrg: MerchantOrgWithOwner | null = null;
  let locationCount = 0;
  if (detailId) {
    const { data: org } = await supabase
      .from('merchant_orgs')
      .select('*, profiles!inner(display_name)')
      .eq('id', detailId)
      .single();
    detailOrg = org;
    const { count: locCount } = await supabase
      .from('locations')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', detailId);
    locationCount = locCount ?? 0;
  }

  return (
    <div>
      <h1 className={styles.pageHeader}>Merchant Approval Queue</h1>
      <form action="/dashboard/merchants" method="get" className={styles.toolbar}>
        <div className={styles.formGroup}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Name or category"
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button type="submit" className={styles.button}>
          Filter
        </button>
      </form>

      {error ? (
        <p className={styles.empty}>Error loading merchants.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No merchants found.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Owner</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Created</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = statusFromRow(row);
                return (
                  <tr key={row.id} className={styles.row}>
                    <td className={styles.td}>
                      <Link
                        href={`?${new URLSearchParams({ detail: row.id, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}), page: String(page) }).toString()}`}
                        className={styles.linkButton}
                      >
                        {row.name}
                      </Link>
                    </td>
                    <td className={styles.td}>{row.category}</td>
                    <td className={styles.td}>{row.profiles?.display_name ?? 'Unknown'}</td>
                    <td className={styles.td}>
                      <StatusBadge status={status} />
                    </td>
                    <td className={styles.td}>
                      {new Date(row.created_at).toLocaleDateString('th-TH')}
                    </td>
                    <td className={styles.td}>
                      {status !== 'suspended' && status !== 'verified' && (
                        <form action={approveMerchant} className={styles.inlineForm}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className={styles.button}>
                            Approve
                          </button>
                        </form>
                      )}
                      {status === 'suspended' ? (
                        <form action={reactivateMerchant} className={styles.inlineForm}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className={styles.buttonSecondary}>
                            Reactivate
                          </button>
                        </form>
                      ) : (
                        <form action={suspendMerchant} className={styles.inlineForm}>
                          <input type="hidden" name="id" value={row.id} />
                          <button type="submit" className={styles.buttonDanger}>
                            Suspend
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={styles.pagination}>
            {page > 1 && (
              <Link
                href={pageHref('/dashboard/merchants', params, page - 1)}
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
                href={pageHref('/dashboard/merchants', params, page + 1)}
                className={styles.linkButton}
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}

      {detailOrg && (
        <div className={styles.details}>
          <h3>{detailOrg.name}</h3>
          <p>
            <strong>Category:</strong> {detailOrg.category}
          </p>
          <p>
            <strong>Owner:</strong> {detailOrg.profiles?.display_name ?? 'Unknown'}
          </p>
          <p>
            <strong>Subscription:</strong> {detailOrg.subscription_tier} /{' '}
            {detailOrg.subscription_status}
          </p>
          <p>
            <strong>Locations:</strong> {locationCount}
          </p>
          <p>
            <strong>Verified:</strong>{' '}
            {detailOrg.verified_at
              ? new Date(detailOrg.verified_at).toLocaleDateString('th-TH')
              : 'No'}
          </p>
          <p>
            <strong>Suspended:</strong>{' '}
            {detailOrg.suspended_at
              ? new Date(detailOrg.suspended_at).toLocaleDateString('th-TH')
              : 'No'}
          </p>
          {detailOrg.description && (
            <p>
              <strong>Description:</strong> {detailOrg.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'verified' | 'suspended' }) {
  const className =
    status === 'verified'
      ? styles.badgeGreen
      : status === 'suspended'
        ? styles.badgeRed
        : styles.badgeAmber;
  return <span className={`${styles.badge} ${className}`}>{status}</span>;
}
