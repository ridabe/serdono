-- Ser Dono — Módulo "Mentoria em Investimentos" (SDD-56, PRD §12.6).
--
-- Terceiro módulo do catálogo. **Nenhuma tabela nova, de propósito:** o
-- módulo é educativo e lê dado que já existe (o planejamento financeiro da
-- fase Financeiro, SDD-39). Ele responde "onde deixar cada parte do dinheiro
-- e por quê" — a conta de "quanto guardar" já é feita por
-- `calcularPlanejamentoFinanceiro` (`packages/core/financeiro.ts`) e seria
-- erro duplicá-la aqui (mesmo motivo da SDD-50 ter extraído o cálculo de
-- progresso pra `packages/core`: duas contas separadas divergem).
--
-- RN-33: o módulo não recomenda investimento, não indica carteira nem
-- personaliza alocação — atividade regulada (CVM). Ele ensina a decidir e
-- carrega o aviso da RN-21 na própria tela. Por isso também não existe aqui
-- nenhuma tabela de "carteira do usuário" ou "recomendação": guardar isso
-- seria o primeiro passo pra virar o que o produto não é.
--
-- Liberação continua manual pelo admin via `user_modules` (SDD-30) — a tela
-- `/admin/usuarios/[id]` lista o catálogo inteiro, então este módulo aparece
-- lá automaticamente, sem mudança de código no admin.

insert into public.modules (slug, nome, descricao, ordem, ativo)
values (
  'mentoria-investimentos',
  'Mentoria em Investimentos',
  'O que fazer com a reserva do negócio e a sobra de cada mês: quanto guardar, por quanto tempo deixar parado e o que muda entre uma aplicação e outra.',
  3,
  true
)
on conflict (slug) do nothing;
