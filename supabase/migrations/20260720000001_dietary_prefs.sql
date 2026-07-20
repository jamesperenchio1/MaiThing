-- Add dietary preferences to buyer profiles.
-- Stored as a text array of tags: vegetarian, vegan, halal, no_pork, gluten_free.
alter table public.profiles
  add column if not exists dietary_prefs text[] not null default '{}';
