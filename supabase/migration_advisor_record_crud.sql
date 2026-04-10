-- ╔══════════════════════════════════════════════════════════════╗
-- ║  Políticas RLS faltantes: advisor UPDATE / DELETE           ║
-- ║  en activity_records.                                       ║
-- ║                                                             ║
-- ║  El schema original solo daba al asesor SELECT + INSERT.    ║
-- ║  Sin estas políticas, editar/eliminar registros desde el    ║
-- ║  portal de padres falla silenciosamente cuando la sesión    ║
-- ║  del navegador es la del asesor.                            ║
-- ║                                                             ║
-- ║  Ejecutar en Supabase → SQL Editor (una sola vez).          ║
-- ╚══════════════════════════════════════════════════════════════╝

create policy "Advisors can update records of their families"
  on public.activity_records for update using (
    exists (
      select 1 from public.families f
      where f.id = activity_records.family_id and f.advisor_id = auth.uid()
    )
  );

create policy "Advisors can delete records of their families"
  on public.activity_records for delete using (
    exists (
      select 1 from public.families f
      where f.id = activity_records.family_id and f.advisor_id = auth.uid()
    )
  );
