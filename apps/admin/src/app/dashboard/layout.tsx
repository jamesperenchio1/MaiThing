import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import type { Database } from '@maithing/shared';
import { Sidebar } from './Sidebar';
import styles from './admin.module.css';

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
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
