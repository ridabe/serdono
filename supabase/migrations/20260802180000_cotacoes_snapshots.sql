-- Ser Dono — Cotações de mercado via HG Brasil (SDD-57, PRD §12.6).
--
-- Uma tabela que faz dois trabalhos de propósito:
--
-- 1. **Cache.** A cota da chave HG Brasil é finita e a cotação não muda a
--    cada segundo. A Edge Function `cotacoes` só chama a API externa quando o
--    snapshot mais recente passou da validade; fora isso serve daqui.
-- 2. **Histórico.** O plano atual da HG **não dá acesso a série temporal**
--    (`/finance/historical` responde "sem plano válido"). Em vez de inventar
--    um passado, o produto passa a construir o dele: cada captura vira uma
--    linha, e o gráfico mostra a série real acumulada desde que o módulo
--    entrou no ar. Começa curta e cresce — a tela diz isso ao usuário em vez
--    de simular uma curva bonita (PRD §4, RN-20).
--
-- Não há dado de usuário aqui: é cotação pública, igual pra todo mundo. Por
-- isso a policy de leitura é aberta a qualquer autenticado, e não existe
-- policy de escrita — só a Edge Function grava, com a service role.

create table public.cotacoes_snapshots (
  id uuid primary key default gen_random_uuid(),
  capturado_em timestamptz not null default now(),
  -- Payload normalizado pela própria function (não o JSON cru da HG): assim
  -- uma mudança de formato do fornecedor é absorvida num lugar só.
  dados jsonb not null,
  -- Guardado explicitamente pra citar fonte e data na tela (RN-20).
  fonte text not null default 'HG Brasil Finance'
);

create index cotacoes_snapshots_recentes_idx
  on public.cotacoes_snapshots (capturado_em desc);

alter table public.cotacoes_snapshots enable row level security;

-- Leitura pra qualquer autenticado — mesmo espírito de `niches`/`knowledge_*`:
-- é conteúdo do produto, não dado pessoal. O gate de quem vê o MÓDULO é
-- `user_modules` (SDD-30), não a RLS desta tabela.
create policy "select_authenticated" on public.cotacoes_snapshots
  for select using (auth.role() = 'authenticated');
