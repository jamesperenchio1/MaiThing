import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables } from '@maithing/shared';

type Profile = Tables<'profiles'>;
type MerchantOrg = Tables<'merchant_orgs'>;
type Location = Tables<'locations'>;

export interface ProfileWithMerchant extends Profile {
  merchant_org: MerchantOrg | null;
  merchant_locations: Location[];
}

export function useProfile() {
  return useQuery<ProfileWithMerchant>({
    queryKey: ['profile'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

      const { data: orgs } = await supabase
        .from('merchant_orgs')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const org = orgs?.[0] ?? null;

      let locations: Location[] = [];
      if (org) {
        const { data: locs } = await supabase
          .from('locations')
          .select('*')
          .eq('org_id', org.id)
          .order('created_at', { ascending: false });
        locations = locs ?? [];
      }

      return {
        ...profile,
        merchant_org: org,
        merchant_locations: locations,
      };
    },
    staleTime: 30_000,
  });
}

export function useMerchantOrg() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  return {
    org: profile?.merchant_org ?? null,
    locations: profile?.merchant_locations ?? [],
    isLoading,
    error,
    refetch,
  };
}
