-- ────────────────────────────────────────────────────────────────
-- Plan Phases: evoluciona sleep_plan_steps a fases con pautas
-- ────────────────────────────────────────────────────────────────

-- 1. Nuevas columnas en sleep_plan_steps (ahora son "fases")
alter table public.sleep_plan_steps
  add column if not exists advisor_notes text;

alter table public.sleep_plan_steps
  add column if not exists status text not null default 'locked';

alter table public.sleep_plan_steps
  add column if not exists activated_at timestamptz;

-- Añadir check constraint solo si no existe
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sleep_plan_steps_status_check'
  ) then
    alter table public.sleep_plan_steps
      add constraint sleep_plan_steps_status_check
      check (status in ('locked', 'active', 'completed'));
  end if;
end $$;

-- Migrar datos existentes
update public.sleep_plan_steps set status = 'completed' where completed = true and status = 'locked';

-- 2. Pautas (guidelines) por fase — lo que ve la familia
create table if not exists public.plan_phase_guidelines (
  id uuid default gen_random_uuid() primary key,
  step_id uuid references public.sleep_plan_steps(id) on delete cascade not null,
  guideline_order integer not null default 1,
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.plan_phase_guidelines enable row level security;

-- Políticas RLS (drop+create para idempotencia)
drop policy if exists "Guidelines follow plan access (advisor)" on public.plan_phase_guidelines;
create policy "Guidelines follow plan access (advisor)"
  on public.plan_phase_guidelines for all using (
    exists (
      select 1 from public.sleep_plan_steps s
      join public.sleep_plans sp on sp.id = s.plan_id
      where s.id = plan_phase_guidelines.step_id and sp.advisor_id = auth.uid()
    )
  );

drop policy if exists "Guidelines readable by parents" on public.plan_phase_guidelines;
create policy "Guidelines readable by parents"
  on public.plan_phase_guidelines for select using (
    exists (
      select 1 from public.sleep_plan_steps s
      join public.sleep_plans sp on sp.id = s.plan_id
      join public.family_members fm on fm.family_id = sp.family_id
      where s.id = plan_phase_guidelines.step_id and fm.profile_id = auth.uid()
    )
  );

-- 3. Checklist de adherencia (la familia marca pautas como hechas hoy)
create table if not exists public.guideline_checks (
  id uuid default gen_random_uuid() primary key,
  guideline_id uuid references public.plan_phase_guidelines(id) on delete cascade not null,
  family_id uuid references public.families(id) on delete cascade not null,
  checked_date date not null default current_date,
  checked_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (guideline_id, family_id, checked_date)
);

alter table public.guideline_checks enable row level security;

drop policy if exists "Parents can manage own checks" on public.guideline_checks;
create policy "Parents can manage own checks"
  on public.guideline_checks for all using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = guideline_checks.family_id and fm.profile_id = auth.uid()
    )
  );

drop policy if exists "Advisors can read checks" on public.guideline_checks;
create policy "Advisors can read checks"
  on public.guideline_checks for select using (
    exists (
      select 1 from public.families f
      where f.id = guideline_checks.family_id and f.advisor_id = auth.uid()
    )
  );

-- 4. Asegurar tabla sleep_plan_templates existe
create table if not exists public.sleep_plan_templates (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade,
  is_system boolean not null default false,
  title text not null,
  description text,
  method text,
  age_min_months integer not null default 0,
  age_max_months integer not null default 36,
  goals jsonb not null default '[]',
  steps jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.sleep_plan_templates enable row level security;

drop policy if exists "Advisors can manage own templates" on public.sleep_plan_templates;
create policy "Advisors can manage own templates"
  on public.sleep_plan_templates for all using (
    advisor_id = auth.uid() or is_system = true
  );
