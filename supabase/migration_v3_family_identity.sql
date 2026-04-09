-- Add baby identity fields for better differentiation in advisor views
alter table public.families
  add column if not exists baby_last_name text,
  add column if not exists city text;

