import { supabase } from './supabase';
import { queryClient } from './queryClient';
import { capture } from './posthog';

export async function collectOrder(orderId: string, pickupCode: string): Promise<void> {
  const { error } = await supabase.rpc('collect_order', {
    p_order_id: orderId,
    p_pickup_code: pickupCode.toUpperCase(),
  });
  if (error) throw new Error(error.message);

  capture('order_collected', { order_id: orderId });

  await queryClient.invalidateQueries({ queryKey: ['merchant-orders'] });
  await queryClient.invalidateQueries({ queryKey: ['merchant-listings'] });
}
