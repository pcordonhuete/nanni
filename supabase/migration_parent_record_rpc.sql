-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Editar / eliminar registros desde el portal padres (/p/token) ║
-- ║  sin SUPABASE_SERVICE_ROLE_KEY en Next.js.                   ║
-- ║  Ejecutar en Supabase → SQL Editor (una vez por proyecto).   ║
-- ╚══════════════════════════════════════════════════════════════╝

create or replace function public.delete_activity_record_from_parent(
  p_invite_token text,
  p_record_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  adv uuid;
  bname text;
  n int;
begin
  if p_invite_token is null or length(trim(p_invite_token)) < 8 then
    raise exception 'invalid_invite_token';
  end if;

  select f.id, f.advisor_id, f.baby_name
  into fid, adv, bname
  from public.families f
  where f.invite_token = p_invite_token;

  if fid is null then
    raise exception 'invalid_invite_token';
  end if;

  delete from public.activity_records
  where id = p_record_id and family_id = fid;
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'record_not_found';
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    adv,
    'new_record',
    'Registro eliminado · ' || coalesce(bname, ''),
    'Se eliminó un registro desde el portal de padres',
    '/familia/' || fid::text
  );

  return fid;
end;
$$;

create or replace function public.update_activity_record_from_parent(
  p_invite_token text,
  p_record_id uuid,
  p_type text,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_duration_minutes integer,
  p_details jsonb,
  p_parent_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
  adv uuid;
  bname text;
  n int;
begin
  if p_invite_token is null or length(trim(p_invite_token)) < 8 then
    raise exception 'invalid_invite_token';
  end if;

  if p_type is null or p_type not in (
    'sleep', 'feeding', 'wakeup', 'note',
    'feed', 'diaper', 'play', 'mood', 'wake'
  ) then
    raise exception 'invalid_type';
  end if;

  select f.id, f.advisor_id, f.baby_name
  into fid, adv, bname
  from public.families f
  where f.invite_token = p_invite_token;

  if fid is null then
    raise exception 'invalid_invite_token';
  end if;

  update public.activity_records
  set
    type = p_type,
    started_at = p_started_at,
    ended_at = p_ended_at,
    duration_minutes = p_duration_minutes,
    details = coalesce(p_details, '{}'::jsonb)
  where id = p_record_id and family_id = fid;
  get diagnostics n = row_count;
  if n = 0 then
    raise exception 'record_not_found';
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    adv,
    'new_record',
    coalesce(nullif(trim(p_parent_name), ''), 'Padre/madre') || ' actualizó un registro · ' || coalesce(bname, ''),
    'Registro modificado desde el portal de padres',
    '/familia/' || fid::text
  );

  return fid;
end;
$$;

revoke all on function public.delete_activity_record_from_parent(text, uuid) from public;
revoke all on function public.update_activity_record_from_parent(text, uuid, text, timestamptz, timestamptz, integer, jsonb, text) from public;

grant execute on function public.delete_activity_record_from_parent(text, uuid) to anon, authenticated;
grant execute on function public.update_activity_record_from_parent(text, uuid, text, timestamptz, timestamptz, integer, jsonb, text) to anon, authenticated;
