import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@maithing/shared';
import styles from './admin.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/merchants', label: 'Merchants' },
  { href: '/dashboard/users', label: 'Users' },
  { href: '/dashboard/listings', label: 'Listings' },
  { href: '/dashboard/orders', label: 'Orders' },
  { href: '/dashboard/disputes', label: 'Disputes' },
  { href: '/dashboard', label: 'Analytics' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile.data as { role: Database['public']['Enums']['user_role'] } | null)?.role;
  if (profile.error || role !== 'admin') redirect('/unauthorized');

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>MaiThing Admin</div>
        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link key={item.href + item.label} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
