import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/auth';
import type { Tables } from '@maithing/shared';

type ReferralRow = Tables<'referrals'>;

type ReferralWithName = ReferralRow & {
  referred: { display_name: string | null } | null;
};

export function useReferralCode() {
  const user = useAuthStore((s) => s.user);
  return useQuery<string | null>({
    queryKey: ['referral-code'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data?.referral_code ?? null;
    },
    enabled: !!user,
  });
}

export function useReferrals() {
  const user = useAuthStore((s) => s.user);
  return useQuery<ReferralWithName[]>({
    queryKey: ['referrals'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select(
          `
          *,
          referred:profiles!referrals_referred_id_fkey(display_name)
        `,
        )
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useApplyReferralCode() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation<void, Error, string>({
    mutationFn: async (code) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('apply_referral_code', { p_code: code });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['referrals'] });
      void queryClient.invalidateQueries({ queryKey: ['referral-code'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
