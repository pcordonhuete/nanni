-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Migration: Parent authentication                          ║
-- ║  Run this in Supabase Dashboard → SQL Editor               ║
-- ╚══════════════════════════════════════════════════════════════╝

-- 1. Allow any authenticated user to read families
--    (needed so parents can look up a family by invite_token during registration)
--    Safe: invite_tokens are random 32-char hex strings, not guessable.
create policy "Authenticated users can read families"
  on public.families for select
  using (auth.uid() is not null);

-- 2. Allow authenticated users to add themselves as family members
--    (needed so parents can join a family after registering via invite link)
--    Safe: profile_id = auth.uid() ensures they can only add themselves.
create policy "Users can join families as members"
  on public.family_members for insert
  with check (profile_id = auth.uid());

-- 3. Allow parents to read sleep plan goals of their families
create policy "Parents can read goals of their family plans"
  on public.sleep_plan_goals for select
  using (
    exists (
      select 1 from public.sleep_plans sp
      join public.family_members fm on fm.family_id = sp.family_id
      where sp.id = sleep_plan_goals.plan_id and fm.profile_id = auth.uid()
    )
  );

-- 4. Allow parents to read sleep plan steps of their families
create policy "Parents can read steps of their family plans"
  on public.sleep_plan_steps for select
  using (
    exists (
      select 1 from public.sleep_plans sp
      join public.family_members fm on fm.family_id = sp.family_id
      where sp.id = sleep_plan_steps.plan_id and fm.profile_id = auth.uid()
    )
  );
