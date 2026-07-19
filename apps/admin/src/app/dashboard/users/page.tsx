import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase-server';
import { flagUser } from '@/lib/actions';
import type { Database } from '@maithing/shared';
import styles from '../admin.module.css';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];

type OrderWithListing = OrderRow & {
  listings: { title: string } | null;
};

const PAGE_SIZE = 20;

const ROLES = ['all', 'buyer', 'merchant', 'admin'] as const;

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

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawPage = params.page;
  const page = Math.max(1, Number(Array.isArray(rawPage) ? rawPage[0] : rawPage) || 1);
  const rawSearch = params.search;
  const search = Array.isArray(rawSearch) ? rawSearch[0] : rawSearch;
  const rawRole = params.role;
  const roleFilter = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const rawDetail = params.detail;
  const detailId = Array.isArray(rawDetail) ? rawDetail[0] : rawDetail;

  const supabase = createServiceClient();
  let query = supabase.from('profiles').select('*', { count: 'exact' });
  if (
    roleFilter &&
    ROLES.includes(roleFilter as 'all' | 'buyer' | 'merchant' | 'admin') &&
    roleFilter !== 'all'
  ) {
    query = query.eq('role', roleFilter as 'buyer' | 'merchant' | 'admin');
  }
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  const rows = data ?? [];
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  let detailUser: ProfileRow | null = null;
  let userOrders: OrderWithListing[] = [];
  if (detailId) {
    const { data: user } = await supabase.from('profiles').select('*').eq('id', detailId).single();
    detailUser = user;
    const { data: orders } = await supabase
      .from('orders')
      .select('*, listings!inner(title)')
      .eq('buyer_id', detailId)
      .order('created_at', { ascending: false })
      .limit(10);
    userOrders = (orders as OrderWithListing[] | null) ?? [];
  }

  return (
    <div>
      <h1 className={styles.pageHeader}>User Management</h1>
      <form action="/dashboard/users" method="get" className={styles.toolbar}>
        <div className={styles.formGroup}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Name or phone"
            className={styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            name="role"
            defaultValue={roleFilter ?? 'all'}
            className={styles.select}
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={styles.button}>
          Filter
        </button>
      </form>

      {error ? (
        <p className={styles.empty}>Error loading users.</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>No users found.</p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Phone</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Reliability</th>
                <th className={styles.th}>Created</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={styles.row}>
                  <td className={styles.td}>
                    <Link
                      href={`?${new URLSearchParams({ detail: row.id, ...(search ? { search } : {}), ...(roleFilter ? { role: roleFilter } : {}), page: String(page) }).toString()}`}
                      className={styles.linkButton}
                    >
                      {row.display_name ?? 'Unnamed'}
                    </Link>
                  </td>
                  <td className={styles.td}>{row.phone ?? '—'}</td>
                  <td className={styles.td}>
                    <RoleBadge role={row.role} />
                  </td>
                  <td className={styles.td}>{row.reliability_score}</td>
                  <td className={styles.td}>
                    {new Date(row.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className={styles.td}>
                    <form action={flagUser} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="score" value="0" />
                      <button type="submit" className={styles.buttonDanger}>
                        Ban
                      </button>
                    </form>
                    <form action={flagUser} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="score" value="25" />
                      <button type="submit" className={styles.buttonSecondary}>
                        Flag
                      </button>
                    </form>
                    <form action={flagUser} className={styles.inlineForm}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="score" value="100" />
                      <button type="submit" className={styles.button}>
                        Restore
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
                href={pageHref('/dashboard/users', params, page - 1)}
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
                href={pageHref('/dashboard/users', params, page + 1)}
                className={styles.linkButton}
              >
                Next →
              </Link>
            )}
          </div>
        </>
      )}

      {detailUser && (
        <div className={styles.details}>
          <h3>{detailUser.display_name ?? 'Unnamed user'}</h3>
          <p>
            <strong>Phone:</strong> {detailUser.phone ?? '—'}
          </p>
          <p>
            <strong>Role:</strong> {detailUser.role}
          </p>
          <p>
            <strong>Reliability score:</strong> {detailUser.reliability_score}
          </p>
          <h4 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Recent Orders</h4>
          {userOrders.length === 0 ? (
            <p>No orders for this user.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Code</th>
                  <th className={styles.th}>Listing</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {userOrders.map((order) => (
                  <tr key={order.id} className={styles.row}>
                    <td className={styles.td}>{order.pickup_code}</td>
                    <td className={styles.td}>{order.listings?.title ?? 'Unknown'}</td>
                    <td className={styles.td}>
                      ฿{Number(order.amount_thb).toLocaleString('th-TH')}
                    </td>
                    <td className={styles.td}>{order.status}</td>
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

function RoleBadge({ role }: { role: ProfileRow['role'] }) {
  const className =
    role === 'admin'
      ? styles.badgeGreen
      : role === 'merchant'
        ? styles.badgeAmber
        : styles.badgeGray;
  return <span className={`${styles.badge} ${className}`}>{role}</span>;
}
