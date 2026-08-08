-- Ser Dono — Policy de escrita em app_versions (SDD-84) — a SDD-29 tinha
-- deixado essa lacuna de propósito ("não tem UI de admin ainda, fora de
-- escopo"). Mesmo padrão _write_admin usado em niches/modules.

create policy "app_versions_write_admin" on public.app_versions
  for all using (auth.jwt() ->> 'user_role' = 'admin');
