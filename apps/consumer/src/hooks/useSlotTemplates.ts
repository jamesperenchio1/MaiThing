import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '@maithing/shared';

export type SlotTemplate = Tables<'slot_templates'>;
export type SlotTemplateInsert = Omit<TablesInsert<'slot_templates'>, 'id'>;

export function useSlotTemplates(locationId: string) {
  return useQuery<SlotTemplate[]>({
    queryKey: ['slot_templates', locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('slot_templates')
        .select('*')
        .eq('location_id', locationId)
        .order('label');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!locationId,
  });
}

export function useCreateSlotTemplate() {
  const queryClient = useQueryClient();
  return useMutation<SlotTemplate, Error, SlotTemplateInsert>({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('slot_templates')
        .insert(values)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['slot_templates', data.location_id] });
    },
  });
}

export function useDeleteSlotTemplate() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; locationId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('slot_templates').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, { locationId }) => {
      void queryClient.invalidateQueries({ queryKey: ['slot_templates', locationId] });
    },
  });
}
