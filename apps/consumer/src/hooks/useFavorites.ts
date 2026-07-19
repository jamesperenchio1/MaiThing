import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { supabase } from '../lib/supabase';

export function useFavorites() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: favorites = new Map<string, string>() } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      if (!user) return new Map<string, string>();
      const { data, error } = await supabase
        .from('favorites')
        .select('location_id, created_at')
        .eq('buyer_id', user.id);
      if (error) throw error;
      const map = new Map<string, string>();
      for (const f of data ?? []) {
        map.set(f.location_id, f.created_at);
      }
      return map;
    },
    enabled: !!user,
  });

  const toggle = useMutation({
    mutationFn: async ({ locationId, isFavorite }: { locationId: string; isFavorite: boolean }) => {
      if (!user) throw new Error('Not signed in');
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('buyer_id', user.id)
          .eq('location_id', locationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ buyer_id: user.id, location_id: locationId });
        if (error) throw error;
      }
    },
    onMutate: async ({ locationId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });
      const previous = queryClient.getQueryData<Map<string, string>>(['favorites']);
      queryClient.setQueryData<Map<string, string>>(['favorites'], (old) => {
        const next = new Map(old);
        if (isFavorite) {
          next.delete(locationId);
        } else {
          next.set(locationId, new Date().toISOString());
        }
        return next;
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['favorites'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return {
    favorites,
    isFavorite: (locationId: string) => favorites.has(locationId),
    toggle,
  };
}
