import { mockRepositories } from './mock';
import { supabaseRepositories } from './supabase';
import type { Repositories } from './interfaces';

export const repositories: Repositories =
  process.env.EXPO_PUBLIC_REPOSITORY_MODE === 'supabase' ? supabaseRepositories : mockRepositories;
