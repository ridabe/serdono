-- Ser Dono — Jornada Empreendedora, Fase 3: Planejamento, Etapa 1: Nome da
-- Empresa (SDD-34). Fluxo: palavras-chave -> IA gera 10 nomes -> checa
-- domínio (.com.br/.com) e Instagram de cada um -> usuário escolhe o nome
-- final. As consultas de disponibilidade de nome empresarial (Junta
-- Comercial) e de marca (INPI) ficaram de fora do MVP por decisão de
-- produto — nenhuma das duas tem API pública/oficial (ver SDD-34).

-- ============================================================================
-- Nome escolhido — 1:1 por instância, mesmo padrão dos inputs curtos da
-- Fase 2 (publico_alvo/concorrentes/diferenciais).
-- ============================================================================
alter table public.jornada_instances add column nome_empresa_escolhido text;

-- ============================================================================
-- Novo tipo de deliverable: lista de candidatos gerados pela IA + resultado
-- das checagens de domínio/Instagram (conteudo jsonb, mesmo formato livre
-- já usado por persona/swot/canvas/proposta_valor).
-- ============================================================================
alter table public.jornada_deliverables drop constraint jornada_deliverables_tipo_check;
alter table public.jornada_deliverables add constraint jornada_deliverables_tipo_check
  check (tipo in ('persona', 'swot', 'canvas', 'proposta_valor', 'nomes_empresa'));

-- ============================================================================
-- Etapa 1 da fase "planejamento" — conclusão é tipo 'usuario' porque o
-- critério real é uma escolha do empreendedor (nenhum "correto" avaliável
-- por regra automática, diferente de validacao_persona que é gerado e
-- pronto), mesmo espírito de validacao_clientes_reais.
-- ============================================================================
insert into public.jornada_etapa_templates (slug, fase, ordem, titulo, descricao, tipo_conclusao, dica, depende_de)
values
  ('planejamento_nome_empresa', 'planejamento', 1,
   'Nome da empresa escolhido',
   'Gere sugestões com IA a partir de palavras-chave do seu negócio, veja domínio e Instagram disponíveis e escolha o nome final.',
   'usuario',
   'Pense em 3-5 palavras que descrevem seu negócio (o que você faz, pra quem, seu diferencial) — quanto mais específicas, melhores os nomes gerados.',
   '{}');
