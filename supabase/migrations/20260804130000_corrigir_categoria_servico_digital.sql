-- Ser Dono — Corrigir categoria do nicho "Serviço digital" (SDD-65).
--
-- BUG ENCONTRADO: `niches.categoria = 'serviços'` pro nicho "Serviço digital"
-- — o mesmo valor de "Serviços domiciliares" (limpeza/reparo residencial,
-- nada a ver com trabalho digital). O Fit Score (packages/core/fitScore.ts)
-- casa a área de formação/experiência do diagnóstico com `niches.categoria`;
-- a opção do questionário é literalmente "tecnologia" (blocks.ts, bloco 5,
-- "Tecnologia / digital"). Com `categoria = 'serviços'`, quem marca
-- "Tecnologia / digital" nunca casa com "Serviço digital" (só casaria se
-- tivesse marcado "Serviços", que é outra opção) — e ainda colide, pro
-- mesmo motivo, com "Serviços domiciliares", que É de fato genérico
-- "serviços". Caso real reproduzido: usuário marcou só "Tecnologia / digital"
-- e recebeu Serviços domiciliares (66) > Serviço digital (63) > Comércio de
-- bairro (62) — quase empatados, decididos por acaso (score_contexto, o
-- componente mais fraco da fórmula).
--
-- Só este nicho muda: é o único dos 5 do MVP (`ativo_no_mvp=true`, únicos
-- usados no Fit Score hoje, PRD §8.3) miscategorizado. Os 26 nichos extras
-- (catálogo de "já tenho negócio", `ativo_no_mvp=false`) têm o mesmo tipo de
-- imprecisão em alguns casos (ex.: "Agência de marketing digital" também
-- 'serviços') — não tocados aqui por não afetarem o Fit Score hoje; revisar
-- quando esses nichos ganharem dossiê completo e entrarem no motor (RN-2).

update public.niches
set categoria = 'tecnologia'
where slug = 'servico-digital';
