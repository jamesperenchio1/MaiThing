import { redirect } from 'next/navigation';
import type { Database } from '@maithing/shared';
import { createClient } from '@/lib/supabase-server';

type UserRole = Database['public']['Enums']['user_role'];

export default async function AdminRoot() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const profileResult = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const profile = profileResult.data as { role: UserRole } | null;

  if (!profile || profile.role !== 'admin') redirect('/unauthorized');

  redirect('/dashboard');
}
