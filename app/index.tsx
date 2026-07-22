import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/auth';

export default function Index() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.selectedRole);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/welcome' as any);
    } else if (role === 'merchant') {
      router.replace('/(merchant)/(tabs)' as any);
    } else {
      router.replace('/(customer)/(tabs)' as any);
    }
  }, [user, role, router]);

  return null;
}
