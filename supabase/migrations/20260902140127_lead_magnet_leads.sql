-- Ser Dono — Captura de leads da landing do e-book (SDD-139).
--
-- A landing pública `/ebook` (isca gratuita da SDD-138) tem um formulário de
-- 5 perguntas sobre o momento empreendedor + nome/telefone/e-mail. O e-mail
-- é o único obrigatório. Depois de enviar, a pessoa baixa o PDF direto do
-- bucket público `lead-magnets` — sem login, sem confirmação.
--
-- A tabela é dado de usuário (contato + respostas), então RLS nasce com ela
-- (SPEC §4.1). Ninguém escreve direto: a única porta de entrada é a Edge
-- Function `lead-capturar` (service_role), que valida e insere. Sem policy de
-- INSERT pra `anon`/`authenticated` de propósito — assim a anon key nunca
-- toca a tabela e não dá pra floodar por SQL. Leitura só admin (vai virar
-- tela no Painel numa próxima).

create table public.lead_magnet_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- slug da isca — hoje só 'ebook-abrir-negocio', mas o bucket lead-magnets
  -- é genérico (SDD-138) e outras iscas entram aqui sem migration nova.
  lead_magnet text not null default 'ebook-abrir-negocio',
  nome text not null,
  email text not null,
  telefone text,
  -- As 5 perguntas do funil. Texto livre do rótulo escolhido (não enum) —
  -- o objetivo é qualificar o lead pra follow-up humano/e-mail, não alimentar
  -- cálculo; manter o rótulo por extenso é o que serve pra quem for ler.
  q_momento text not null,
  q_vontade text not null,
  q_tem_ideia text not null,
  q_capital_giro text not null,
  q_prazo text not null,
  origem text,
  user_agent text
);

create index lead_magnet_leads_created_idx on public.lead_magnet_leads (created_at desc);
create index lead_magnet_leads_email_idx on public.lead_magnet_leads (email);

alter table public.lead_magnet_leads enable row level security;

-- Só admin lê. Escrita é exclusiva da Edge Function (service_role bypassa RLS).
create policy "lead_magnet_leads_read_admin" on public.lead_magnet_leads
  for select using (auth.jwt() ->> 'user_role' = 'admin');
