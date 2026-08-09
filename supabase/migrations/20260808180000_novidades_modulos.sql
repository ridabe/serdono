-- Ser Dono — Premissa nova: pop-up de novidade de módulo (pedido do dono do
-- produto em 08/08/2026, referência de UX: app irmão strivePersonalApp).
--
-- Toda vez que um módulo NOVO for lançado pra quem já tem conta, essa pessoa
-- vê, na tela Início, um pop-up com a Mary explicando o que o módulo faz —
-- até marcar "não mostrar mais" (permanente, não por sessão). Cadastro NOVO
-- nunca vê essas pop-ups pra módulos que já existiam quando a conta nasceu —
-- a pop-up avisa quem JÁ USAVA o produto que apareceu algo a mais, não é
-- tutorial de onboarding pra conta que acabou de nascer.

-- ============================================================================
-- `novidade_vista`: DEFAULT true, de propósito — cobre os dois casos sem
-- precisar mexer no trigger de auto-liberação (SDD anterior,
-- `grant_all_modules_to_new_user`): cadastro novo já nasce com `true`
-- (nunca viu pop-up de nada, e não deveria) e todo `user_modules` já
-- existente também vira `true` só de rodar este ALTER (ninguém recebe
-- pop-up retroativo de módulo que já usava sem nunca ter sido avisado antes
-- desta premissa existir). Um módulo lançado DEPOIS desta migration precisa
-- de uma migration própria que dê UPDATE explícito pra `false` nos usuários
-- já existentes — convenção documentada em SPEC.md.
-- ============================================================================
alter table public.user_modules add column novidade_vista boolean not null default true;

create policy "update_own" on public.user_modules
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- RLS restringe LINHA, não coluna (mesmo aprendizado da SDD-22 sobre
-- `users.role`) — sem este revoke, a policy acima deixaria o usuário também
-- alterar `habilitado` (ligar/desligar módulo pra si mesmo, hoje exclusivo
-- do admin via claim JWT).
revoke update (habilitado) on public.user_modules from authenticated, anon;

-- ============================================================================
-- `anuncio_grupo`: módulos lançados JUNTOS na mesma leva de trabalho
-- compartilham o mesmo valor e viram 1 pop-up só (uma descrição por módulo,
-- dentro da mesma tela) — módulo sem grupo (NULL, o normal) sempre vira
-- pop-up sozinho.
-- ============================================================================
alter table public.modules add column anuncio_grupo text;
