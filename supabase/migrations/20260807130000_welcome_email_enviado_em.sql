-- Ser Dono — marca de idempotência do e-mail de boas-vindas (SDD-70).
--
-- Contexto: a confirmação de e-mail nativa do Supabase Auth foi desligada
-- porque confundia o usuário. O e-mail de boas-vindas ocupou esse lugar, e
-- precisa de um registro de "já foi enviado" para que retry do client, duplo
-- clique ou reprocessamento não gerem dois e-mails para a mesma pessoa.
--
-- Fica em `users` (e não numa tabela de log própria) porque é um fato de
-- ciclo de vida da conta, um por usuário — não um histórico de mensagens.
-- Quando existir mais de um e-mail transacional, aí sim vale uma tabela
-- `email_events` e esta coluna migra para lá.

alter table public.users
  add column if not exists welcome_email_enviado_em timestamptz;

comment on column public.users.welcome_email_enviado_em is
  'Quando o e-mail de boas-vindas foi enviado com sucesso. Nulo = ainda não enviado. Escrito apenas pela Edge Function enviar-email-boas-vindas (service role).';

-- Nenhuma policy nova: a coluna é lida e escrita apenas pela Edge Function com
-- service role. O usuário continua enxergando a própria linha pelas policies já
-- existentes de `users`, e não tem motivo para alterar este campo.
