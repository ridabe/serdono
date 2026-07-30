-- Ser Dono — Controle de versão do app / aviso de atualização obrigatória e opcional (SDD-28)
-- Dado de configuração pública (não pertence a um usuário) — leitura livre,
-- inclusive sem sessão, pois a checagem de versão precisa funcionar antes de
-- qualquer login/sessão anônima existir.

create table public.app_versions (
  platform text primary key check (platform in ('android', 'ios')),
  current_version text not null,
  current_version_code int not null,
  min_version_code int not null,
  force_update boolean not null default false,
  store_url text,
  release_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_versions enable row level security;

create policy "app_versions_read_all" on public.app_versions
  for select using (true);

create trigger set_app_versions_updated_at
  before update on public.app_versions
  for each row execute function public.set_updated_at();

insert into public.app_versions (platform, current_version, current_version_code, min_version_code, force_update, store_url)
values ('android', '0.1.0', 1, 1, false, 'https://play.google.com/store/apps/details?id=br.com.serdono.app');
