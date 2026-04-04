-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Nanni v2 — New tables for messaging, agenda, templates,  ║
-- ║  notification preferences, and intake questionnaires       ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Fix subscription plan values to match app code
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check
  check (plan in ('trial', 'basico', 'premium'));

-- Add trial_ends_at if missing
alter table public.subscriptions
  add column if not exists trial_ends_at timestamptz
  default (now() + interval '14 days');

-- Add expired status
alter table public.subscriptions drop constraint if exists subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired'));

-- ────────────────────────────────────────────────────────────────
-- 15. Messages (advisor ↔ family communication)
-- ────────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  sender_type text not null check (sender_type in ('advisor', 'parent')),
  sender_name text not null,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_messages_family on public.messages(family_id, created_at desc);

alter table public.messages enable row level security;

create policy "Advisors can manage messages for their families"
  on public.messages for all using (
    exists (
      select 1 from public.families f
      where f.id = messages.family_id and f.advisor_id = auth.uid()
    )
  );

create policy "Anyone can insert messages by family token"
  on public.messages for insert with check (true);

create policy "Anyone can read messages by family"
  on public.messages for select using (true);

-- ────────────────────────────────────────────────────────────────
-- 16. Agenda Items (calendar events)
-- ────────────────────────────────────────────────────────────────

create table if not exists public.agenda_items (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  family_id uuid references public.families(id) on delete set null,
  title text not null,
  description text,
  type text not null default 'session'
    check (type in ('call', 'session', 'review', 'reminder')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_agenda_advisor on public.agenda_items(advisor_id, starts_at);

alter table public.agenda_items enable row level security;

create policy "Advisors can manage own agenda"
  on public.agenda_items for all using (auth.uid() = advisor_id);

-- ────────────────────────────────────────────────────────────────
-- 17. Notification Preferences
-- ────────────────────────────────────────────────────────────────

create table if not exists public.notification_preferences (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade not null unique,
  new_record boolean not null default true,
  family_inactive boolean not null default true,
  insight boolean not null default true,
  weekly_summary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy "Advisors can manage own notification prefs"
  on public.notification_preferences for all using (auth.uid() = advisor_id);

create trigger set_notification_prefs_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────
-- 18. Sleep Plan Templates
-- ────────────────────────────────────────────────────────────────

create table if not exists public.sleep_plan_templates (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade,
  is_system boolean not null default false,
  title text not null,
  description text,
  method text,
  age_min_months integer default 0,
  age_max_months integer default 36,
  goals jsonb not null default '[]',
  steps jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.sleep_plan_templates enable row level security;

create policy "Advisors can manage own templates"
  on public.sleep_plan_templates for all using (
    auth.uid() = advisor_id or is_system = true
  );

create policy "Anyone can read system templates"
  on public.sleep_plan_templates for select using (is_system = true);

-- Insert default system templates
insert into public.sleep_plan_templates (is_system, title, description, method, age_min_months, age_max_months, goals, steps) values
(
  true,
  'Extinción gradual (Ferber)',
  'Método progresivo de intervalos crecientes para enseñar al bebé a dormirse solo.',
  'ferber',
  6, 18,
  '[{"description":"Dormirse solo/a en la cuna en menos de 20 min","target_value":20,"metric":"minutos"},{"description":"Reducir despertares nocturnos a 1 o menos","target_value":1,"metric":"despertares"},{"description":"Sueño nocturno de 10-12h seguidas","target_value":10,"metric":"horas"}]',
  '[{"title":"Rutina de noche consistente","description":"Establecer baño, pijama, cuento, canción. Misma secuencia cada noche a la misma hora.","duration_days":3},{"title":"Intervalos de 3-5-7 minutos","description":"Dejar al bebé en la cuna despierto. Salir. Volver a los 3 min, luego 5, luego 7. Consolar brevemente sin coger.","duration_days":3},{"title":"Intervalos de 5-10-12 minutos","description":"Aumentar los intervalos progresivamente. Mantener la rutina previa.","duration_days":3},{"title":"Intervalos de 10-15-20 minutos","description":"El bebé debería empezar a dormirse antes de necesitar intervención.","duration_days":4},{"title":"Consolidación","description":"Mantener rutina. El bebé se duerme solo la mayoría de noches.","duration_days":7}]'
),
(
  true,
  'Método de la silla',
  'Presencia gradual del cuidador que se aleja progresivamente de la cuna.',
  'chair',
  4, 24,
  '[{"description":"Dormirse sin contacto físico","target_value":null,"metric":null},{"description":"Reducir llanto al acostarse a menos de 5 min","target_value":5,"metric":"minutos"},{"description":"Sin intervención nocturna excepto para tomas","target_value":null,"metric":null}]',
  '[{"title":"Silla junto a la cuna","description":"Sentar una silla tocando la cuna. Acompañar al bebé con voz y contacto hasta que se duerma.","duration_days":3},{"title":"Silla a medio metro","description":"Alejar la silla 50cm. Solo voz suave, sin contacto físico salvo si llora mucho.","duration_days":3},{"title":"Silla junto a la puerta","description":"Mover la silla cerca de la puerta. Presencia visual pero mínima intervención.","duration_days":3},{"title":"Fuera de la habitación","description":"Salir de la habitación. Volver brevemente si llora más de 3 min.","duration_days":4},{"title":"Consolidación","description":"El bebé se duerme solo con la rutina. Intervenir solo si es necesario.","duration_days":7}]'
),
(
  true,
  'Rutina progresiva (suave)',
  'Enfoque gradual y respetuoso para bebés más pequeños o familias que prefieren menos llanto.',
  'gentle',
  0, 12,
  '[{"description":"Establecer ventanas de vigilia apropiadas para la edad","target_value":null,"metric":null},{"description":"Lograr al menos 1 siesta en cuna al día","target_value":1,"metric":"siestas"},{"description":"Rutina nocturna de menos de 30 min","target_value":30,"metric":"minutos"}]',
  '[{"title":"Observar y registrar patrones","description":"Registrar durante 3 días todos los sueños, tomas y despertares sin cambiar nada. Identificar ventanas de vigilia.","duration_days":3},{"title":"Ajustar ventanas de vigilia","description":"Empezar a respetar las ventanas de vigilia apropiadas para la edad. Ofrecer sueño antes de que esté demasiado cansado.","duration_days":5},{"title":"Introducir rutina de noche","description":"Crear una rutina corta (15-20 min): baño, masaje, pijama, toma, canción. Misma hora cada noche.","duration_days":5},{"title":"Practicar una siesta en cuna","description":"Elegir una siesta del día (preferiblemente la de la mañana) para intentar en la cuna. Las demás pueden seguir como antes.","duration_days":7},{"title":"Ampliar a más siestas","description":"Gradualmente intentar más siestas en la cuna. Mantener la rutina nocturna.","duration_days":7}]'
),
(
  true,
  'Plan de siestas estructurado',
  'Organizar las siestas del día según la edad del bebé para mejorar el sueño nocturno.',
  'nap_schedule',
  3, 18,
  '[{"description":"Conseguir un horario de siestas predecible","target_value":null,"metric":null},{"description":"Siestas de al menos 45 min","target_value":45,"metric":"minutos"},{"description":"Acostarse antes de las 20:00","target_value":20,"metric":"hora"}]',
  '[{"title":"Evaluar patrón actual","description":"Registrar horarios de siestas actuales durante 3 días. Anotar señales de sueño y duración real.","duration_days":3},{"title":"Fijar hora de despertar matutino","description":"Despertar al bebé a la misma hora cada mañana (±15 min). Esto ancla todo el horario.","duration_days":4},{"title":"Estructurar primera siesta","description":"Ofrecer primera siesta según ventana de vigilia para su edad. Intentar en cuna con rutina breve.","duration_days":5},{"title":"Añadir segunda siesta","description":"Respetar la ventana de vigilia entre siestas. Si la siesta es corta (<30min), ofrecer otra oportunidad.","duration_days":5},{"title":"Consolidar horario completo","description":"Mantener el horario de siestas consistente. Ajustar hora de acostarse según la última siesta del día.","duration_days":7}]'
);

-- ────────────────────────────────────────────────────────────────
-- 19. Intake Questionnaires
-- ────────────────────────────────────────────────────────────────

create table if not exists public.intake_templates (
  id uuid default gen_random_uuid() primary key,
  advisor_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  questions jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.intake_templates enable row level security;

create policy "Advisors can manage own intake templates"
  on public.intake_templates for all using (auth.uid() = advisor_id);

create table if not exists public.intake_responses (
  id uuid default gen_random_uuid() primary key,
  family_id uuid references public.families(id) on delete cascade not null,
  template_id uuid references public.intake_templates(id) on delete set null,
  answers jsonb not null default '{}',
  submitted_at timestamptz not null default now()
);

alter table public.intake_responses enable row level security;

create policy "Advisors can read intake responses for their families"
  on public.intake_responses for all using (
    exists (
      select 1 from public.families f
      where f.id = intake_responses.family_id and f.advisor_id = auth.uid()
    )
  );

create policy "Anyone can insert intake responses"
  on public.intake_responses for insert with check (true);

-- ────────────────────────────────────────────────────────────────
-- 20. Add parent_phone and parent_email to families
-- ────────────────────────────────────────────────────────────────

alter table public.families add column if not exists parent_phone text;
alter table public.families add column if not exists parent_email text;
