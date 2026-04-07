-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Nanni — Full database schema                               ║
-- ║  Run this in the Supabase SQL Editor (or via CLI migration)  ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ────────────────────────────────────────────────────────────────
-- 1. Profiles (extends auth.users)
-- ────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  role text not null default 'advisor'
    check (role in ('advisor', 'parent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'advisor')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- 2. Brands (advisor white-label settings)
-- ────────────────────────────────────────────────────────────────

create table if not exists public.brands (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade not null unique,
  name text not null default 'Mi Marca',
  subdomain text unique,
  custom_domain text,
  logo_url text,
  primary_color text not null default '#188d91',
  headline text,
  description text,
  calendly_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brands enable row level security;

create policy "Advisors can manage own brand"
  on public.brands for all using (auth.uid() = advisor_id);

create policy "Anyone can read brands by subdomain"
  on public.brands for select using (true);

-- Auto-create brand on profile creation for advisors
create or replace function public.handle_new_advisor()
returns trigger as $$
begin
  if new.role = 'advisor' then
    insert into public.brands (advisor_id, name)
    values (new.id, new.full_name);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_advisor_created on public.profiles;
create trigger on_advisor_created
  after insert on public.profiles
  for each row execute function public.handle_new_advisor();

-- ────────────────────────────────────────────────────────────────
-- 3. Families
-- ────────────────────────────────────────────────────────────────

create table if not exists public.families (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  baby_name text not null,
  baby_birth_date date not null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  invite_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.families enable row level security;

create policy "Advisors can manage own families"
  on public.families for all using (auth.uid() = advisor_id);

create policy "Parents can read their families"
  on public.families for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = families.id and fm.profile_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Family Members (parents/caregivers linked to families)
-- ────────────────────────────────────────────────────────────────

create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  relationship text not null
    check (relationship in ('mother', 'father', 'caregiver')),
  created_at timestamptz not null default now(),
  unique(family_id, profile_id)
);

alter table public.family_members enable row level security;

create policy "Advisors can manage family members"
  on public.family_members for all using (
    exists (
      select 1 from public.families f
      where f.id = family_members.family_id and f.advisor_id = auth.uid()
    )
  );

create policy "Parents can read own membership"
  on public.family_members for select using (profile_id = auth.uid());

-- ────────────────────────────────────────────────────────────────
-- 5. Activity Records
-- ────────────────────────────────────────────────────────────────

create table if not exists public.activity_records (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  recorded_by uuid references public.profiles(id) on delete set null,
  type text not null
    check (type in ('sleep', 'feed', 'diaper', 'play', 'mood', 'note', 'wake')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_minutes integer,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_records_family on public.activity_records(family_id);
create index idx_records_started on public.activity_records(started_at desc);
create index idx_records_type on public.activity_records(type);

alter table public.activity_records enable row level security;

create policy "Advisors can read records of their families"
  on public.activity_records for select using (
    exists (
      select 1 from public.families f
      where f.id = activity_records.family_id and f.advisor_id = auth.uid()
    )
  );

create policy "Parents can manage records of their families"
  on public.activity_records for all using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = activity_records.family_id and fm.profile_id = auth.uid()
    )
  );

create policy "Advisors can insert records"
  on public.activity_records for insert with check (
    exists (
      select 1 from public.families f
      where f.id = activity_records.family_id and f.advisor_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 6. Sleep Plans
-- ────────────────────────────────────────────────────────────────

create table if not exists public.sleep_plans (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sleep_plans enable row level security;

create policy "Advisors can manage own plans"
  on public.sleep_plans for all using (auth.uid() = advisor_id);

create policy "Parents can read plans for their families"
  on public.sleep_plans for select using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = sleep_plans.family_id and fm.profile_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 7. Sleep Plan Goals
-- ────────────────────────────────────────────────────────────────

create table if not exists public.sleep_plan_goals (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.sleep_plans(id) on delete cascade not null,
  description text not null,
  target_value numeric,
  current_value numeric,
  metric text,
  achieved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.sleep_plan_goals enable row level security;

create policy "Goals follow plan access"
  on public.sleep_plan_goals for all using (
    exists (
      select 1 from public.sleep_plans sp
      where sp.id = sleep_plan_goals.plan_id and sp.advisor_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 8. Sleep Plan Steps
-- ────────────────────────────────────────────────────────────────

create table if not exists public.sleep_plan_steps (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references public.sleep_plans(id) on delete cascade not null,
  step_order integer not null,
  title text not null,
  description text,
  duration_days integer not null default 7,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sleep_plan_steps enable row level security;

create policy "Steps follow plan access"
  on public.sleep_plan_steps for all using (
    exists (
      select 1 from public.sleep_plans sp
      where sp.id = sleep_plan_steps.plan_id and sp.advisor_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 9. Advisor Notes
-- ────────────────────────────────────────────────────────────────

create table if not exists public.advisor_notes (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.advisor_notes enable row level security;

create policy "Advisors can manage own notes"
  on public.advisor_notes for all using (auth.uid() = advisor_id);

-- ────────────────────────────────────────────────────────────────
-- 10. AI Insights
-- ────────────────────────────────────────────────────────────────

create table if not exists public.insights (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  type text not null
    check (type in ('improvement', 'alert', 'pattern', 'recommendation')),
  title text not null,
  description text not null,
  data jsonb default '{}',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.insights enable row level security;

create policy "Advisors can manage own insights"
  on public.insights for all using (auth.uid() = advisor_id);

-- ────────────────────────────────────────────────────────────────
-- 11. Notifications
-- ────────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null
    check (type in ('new_record', 'family_inactive', 'insight', 'reminder', 'system')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can manage own notifications"
  on public.notifications for all using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 12. Subscriptions
-- ────────────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade not null unique,
  plan text not null default 'starter'
    check (plan in ('starter', 'pro', 'clinica')),
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  max_families integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Advisors can read own subscription"
  on public.subscriptions for select using (auth.uid() = advisor_id);

-- Auto-create starter subscription for new advisors
create or replace function public.handle_new_subscription()
returns trigger as $$
begin
  if new.role = 'advisor' then
    insert into public.subscriptions (advisor_id, plan, status, max_families)
    values (new.id, 'starter', 'active', 3);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_advisor_subscription on public.profiles;
create trigger on_advisor_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_subscription();

-- ────────────────────────────────────────────────────────────────
-- 13. Utility: updated_at trigger
-- ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_brands_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create trigger set_families_updated_at
  before update on public.families
  for each row execute function public.set_updated_at();

create trigger set_plans_updated_at
  before update on public.sleep_plans
  for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- 14. Views for common queries
-- ────────────────────────────────────────────────────────────────

create or replace view public.family_stats as
select
  f.id as family_id,
  f.advisor_id,
  f.baby_name,
  f.baby_birth_date,
  f.status,
  f.invite_token,
  f.created_at,
  extract(year from age(now(), f.baby_birth_date)) * 12 +
    extract(month from age(now(), f.baby_birth_date)) as baby_age_months,
  coalesce(
    (select sum(ar.duration_minutes)
     from public.activity_records ar
     where ar.family_id = f.id
       and ar.type = 'sleep'
       and ar.started_at >= current_date),
    0
  ) / 60.0 as sleep_hours_today,
  coalesce(
    (select count(*)
     from public.activity_records ar
     where ar.family_id = f.id
       and ar.type = 'wake'
       and ar.started_at >= current_date - interval '1 day'
       and ar.started_at < current_date),
    0
  ) as awakenings_last_night,
  (select max(ar.created_at)
   from public.activity_records ar
   where ar.family_id = f.id
  ) as last_record_at
from public.families f;
