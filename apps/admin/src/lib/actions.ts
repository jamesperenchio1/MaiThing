'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, createServiceClient } from './supabase-server';
import type { Database } from '@maithing/shared';

const idSchema = z.string().uuid();

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const profile = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile.data as { role: Database['public']['Enums']['user_role'] } | null)?.role;
  if (profile.error || role !== 'admin') throw new Error('Forbidden');
}

export async function approveMerchant(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const service = createServiceClient();
  const { error } = await service
    .from('merchant_orgs')
    .update({ verified_at: new Date().toISOString(), suspended_at: null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/merchants');
}

export async function suspendMerchant(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const service = createServiceClient();
  const { error } = await service
    .from('merchant_orgs')
    .update({ suspended_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/merchants');
}

export async function reactivateMerchant(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const service = createServiceClient();
  const { error } = await service.from('merchant_orgs').update({ suspended_at: null }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/merchants');
}

export async function flagUser(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const score = z.coerce.number().min(0).max(100).parse(formData.get('score'));
  const service = createServiceClient();
  const { error } = await service
    .from('profiles')
    .update({ reliability_score: score })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/users');
}

export async function updateListingStatus(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const status = z
    .enum(['active', 'draft', 'sold_out', 'expired', 'cancelled'])
    .parse(formData.get('status'));
  const service = createServiceClient();
  const { error } = await service.from('listings').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/listings');
}

export async function deleteListing(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const service = createServiceClient();
  const { error } = await service.from('listings').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/listings');
}

export async function resolveIssue(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const status = z.enum(['auto_refunded', 'resolved', 'rejected']).parse(formData.get('status'));
  const rawNote = formData.get('note');
  const note =
    typeof rawNote === 'string' && rawNote.trim()
      ? z.string().max(1000).parse(rawNote.trim())
      : null;

  const service = createServiceClient();
  const { error } = await service
    .from('issue_reports')
    .update({ status, resolution_note: note })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/disputes');
}

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = idSchema.parse(formData.get('id'));
  const status = z
    .enum(['reserved', 'paid', 'collected', 'cancelled', 'refunded', 'no_show'])
    .parse(formData.get('status'));
  const service = createServiceClient();
  const { error } = await service.from('orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/orders');
}
