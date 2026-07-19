import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';
import { resolveIssue } from '@/lib/actions';
import type { Database } from '@maithing/shared';
import styles from '../admin.module.css';

type IssueReportRow = Database['public']['Tables']['issue_reports']['Row'];
type IssueStatus = Database['public']['Enums']['issue_status'];

type IssueWithOrder = IssueReportRow & {
  orders: {
    pickup_code: string;
    amount_thb: number;
    status: Database['public']['Enums']['order_status'];
    profiles: { display_name: string | null } | null;
    listings: { title: string } | null;
  } | null;
};

const PAGE_SIZE = 20;
const ISSUE_STATUSES = ['all', 'open', 'auto_refunded', 'resolved', 'rejected'] as const;

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

export default async function DisputesPage({
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
    .from('issue_reports')
    .select(
      '*, orders!inner(pickup_code, amount_thb, status, buyer_id, profiles!inner(display_name), listings!inner(title))',
      { count: 'exact' },
    );
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as IssueStatus);
  }
  if (search) {
    query = query.or(`reason.ilike.%${search}%,orders.pickup_code.ilike.%${search}%`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  const rows = (data as IssueWithOrder[] | null) ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  let detailIssue: IssueWithOrder | null = null;
  if (detailId) {
    const { data: issue } = await supabase
      .from('issue_reports')
      .select(
        '*, orders!inner(pickup_code, amount_thb, status, buyer_id, profiles!inner(display_name), listings!inner(title))',
      )
      .eq('id', detailId)
      .single();
    detailIssue = issue;
  }

  return (
    <div>
      <h1 className={styles.pageHeader}>Dispute & Refund Override</h1>
      <form action="/dashboard/disputes" method="get" className={styles.toolbar}>
        <div className={styles.formGroup}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Reason or pickup code"
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
            {ISSUE_STATUSES.map((s) => (
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
        <p className={styles.empty}>Error loading disputes.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No disputes found.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Order</th>
                <th className={styles.th}>Reason</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Created</th>
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
                      {row.orders?.pickup_code ?? 'Unknown'}
                    </Link>
                  </td>
                  <td className={styles.td}>{row.reason}</td>
                  <td className={styles.td}>
                    <IssueStatusBadge status={row.status} />
                  </td>
                  <td className={styles.td}>
                    {new Date(row.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className={styles.td}>
                    {row.status === 'open' && (
                      <form action={resolveIssue} className={styles.inlineForm}>
                        <input type="hidden" name="id" value={row.id} />
                        <button
                          type="submit"
                          name="status"
                          value="auto_refunded"
                          className={styles.button}
                        >
                          Approve Refund
                        </button>
                        <button
                          type="submit"
                          name="status"
                          value="rejected"
                          className={styles.buttonDanger}
                        >
                          Reject
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.pagination}>
            {page > 1 && (
              <Link
                href={pageHref('/dashboard/disputes', params, page - 1)}
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
                href={pageHref('/dashboard/disputes', params, page + 1)}
                className={styles.linkButton}
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}

      {detailIssue && (
        <div className={styles.details}>
          <h3>Dispute {detailIssue.id.slice(0, 8)}</h3>
          <p>
            <strong>Order:</strong> {detailIssue.orders?.pickup_code}
          </p>
          <p>
            <strong>Buyer:</strong> {detailIssue.orders?.profiles?.display_name ?? 'Unknown'}
          </p>
          <p>
            <strong>Listing:</strong> {detailIssue.orders?.listings?.title ?? 'Unknown'}
          </p>
          <p>
            <strong>Order amount:</strong> ฿
            {Number(detailIssue.orders?.amount_thb ?? 0).toLocaleString('th-TH')}
          </p>
          <p>
            <strong>Order status:</strong> {detailIssue.orders?.status}
          </p>
          <p>
            <strong>Reason:</strong> {detailIssue.reason}
          </p>
          <p>
            <strong>Detail:</strong> {detailIssue.detail ?? '—'}
          </p>
          <p>
            <strong>Resolution note:</strong> {detailIssue.resolution_note ?? '—'}
          </p>
          {detailIssue.status === 'open' && (
            <form
              action={resolveIssue}
              className={styles.toolbar}
              style={{ marginTop: '1rem', marginBottom: 0 }}
            >
              <input type="hidden" name="id" value={detailIssue.id} />
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="note">Resolution note</label>
                <input
                  id="note"
                  name="note"
                  className={styles.input}
                  placeholder="Add a note before resolving"
                />
              </div>
              <button type="submit" name="status" value="auto_refunded" className={styles.button}>
                Approve Refund
              </button>
              <button type="submit" name="status" value="rejected" className={styles.buttonDanger}>
                Reject
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const className =
    status === 'resolved'
      ? styles.badgeGreen
      : status === 'auto_refunded'
        ? styles.badgeGreen
        : status === 'rejected'
          ? styles.badgeRed
          : styles.badgeAmber;
  return <span className={`${styles.badge} ${className}`}>{status.replace('_', ' ')}</span>;
}
