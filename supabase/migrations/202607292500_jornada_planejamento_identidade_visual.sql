-- Ser Dono — Jornada Empreendedora, Fase 3: Planejamento, Etapa 2: Identidade
-- Visual (SDD-35). Questionário curto (valores, personalidade, tom de
-- comunicação, cores) -> IA gera slogan + 3 rascunhos de logo (qualidade
-- baixa, para economizar) -> usuário escolhe um logo -> sistema gera a
-- versão final em alta qualidade e guarda no Storage do usuário.

-- ============================================================================
-- Resultado final — mesmo padrão de nome_empresa_escolhido (SDD-34): campo
-- 1:1 na instância. logo_path é o caminho no bucket, não a URL pública (o
-- bucket é privado — RN de dado do negócio, não dado público como o avatar).
-- ============================================================================
alter table public.jornada_instances add column logo_path text;
alter table public.jornada_instances add column slogan_escolhido text;

-- ============================================================================
-- Novo tipo de deliverable: slogan gerado + os 3 rascunhos de logo (base64,
-- qualidade baixa — não persistidos no Storage, só no jsonb, pois são
-- descartáveis assim que o usuário escolhe um).
-- ============================================================================
alter table public.jornada_deliverables drop constraint jornada_deliverables_tipo_check;
alter table public.jornada_deliverables add constraint jornada_deliverables_tipo_check
  check (tipo in ('persona', 'swot', 'canvas', 'proposta_valor', 'nomes_empresa', 'identidade_visual'));

-- ============================================================================
-- Etapa 2 da fase "planejamento" — depende da etapa 1 (nome da empresa),
-- porque o logo e o slogan são gerados a partir do nome já escolhido.
-- ============================================================================
insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
select
  'planejamento_identidade_visual', 'planejamento', 2,
  'Identidade visual definida',
  'Responda um questionário curto sobre a alma da sua marca e a IA gera um slogan e 3 opções de logo — escolha a favorita.',
  'usuario',
  'Pense em como você quer que as pessoas se sintam ao ver sua marca — isso ajuda mais do que descrever elementos visuais específicos.',
  array[id]::uuid[]
from public.jornada_etapa_templates
where slug = 'planejamento_nome_empresa';

-- ============================================================================
-- Storage — bucket privado (diferente do bucket "avatars", público): logo e
-- identidade visual são dado do negócio do usuário, não algo exibível sem
-- controle de acesso. Mesma convenção de path "{user_id}/...", RLS por
-- pasta, download via signed URL gerada sob demanda no client.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('identidade-visual', 'identidade-visual', false)
on conflict (id) do nothing;

create policy "identidade_visual_read_own" on storage.objects
  for select using (
    bucket_id = 'identidade-visual' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identidade_visual_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'identidade-visual' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identidade_visual_update_own" on storage.objects
  for update using (
    bucket_id = 'identidade-visual' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "identidade_visual_delete_own" on storage.objects
  for delete using (
    bucket_id = 'identidade-visual' and (storage.foldername(name))[1] = auth.uid()::text
  );
