# Ser Dono — PRD (Product Requirements Document)

**Versão 0.1 · 27 de julho de 2026 · Documento vivo — atualizar a cada decisão de escopo**

> Nome do produto adotado: **Ser Dono** (`serdono.com.br`). Logo definitivo ainda em escolha — ver `Ser Dono - Painel de Conceitos de Marca`. Nenhuma decisão de marca aqui depende do logo final.

---

## 0. Como usar este documento

Este PRD é a fonte de verdade para o que construir, nesta ordem: primeiro o quê e o porquê (seções 1–4), depois o modelo de dados e a arquitetura (5–6), depois módulo por módulo com fluxos e critérios de aceite (7–12), depois regras transversais e não-funcionais (13–15). Ao codificar, comece pela seção 7 (Diagnóstico) — é o primeiro módulo do MVP.

Convenção: `RN-x` = regra de negócio, `CA-x` = critério de aceite, `RF-x` = requisito funcional, `RNF-x` = requisito não funcional. Cada um é referenciável em issues/PRs.

---

## 1. Visão do Produto

Ser Dono é uma plataforma de assinatura que funciona como sócio digital do empreendedor iniciante: primeiro diagnostica qual negócio combina com a pessoa, depois conduz — passo a passo, com inteligência de mercado e um copiloto de IA — até o negócio estar aberto, operando e captando clientes. Depois da abertura, o produto continua como camada de inteligência da operação (marketing, financeiro, B2B).

Detalhes de mercado, modelo de negócio e financeiro completo estão no *Documento de Conceito v0.1* e no *Estudo de Viabilidade Financeira*. Este PRD assume esses documentos como contexto e não os repete — apenas referencia o que muda o comportamento do sistema.

### 1.1 Objetivo deste documento
Definir o que construir no MVP e nas fases seguintes, com precisão suficiente para codificar sem ambiguidade: entidades de dados, telas, regras, integrações e critérios de aceite.

### 1.2 Fora de escopo deste PRD
Identidade visual final (aguardando escolha do logo), contratos jurídicos com parceiros, script de vendas. Esses são insumos de outras frentes, não bloqueiam o desenvolvimento.

---

## 2. Personas

### 2.1 Persona primária — "Marcos, o decidido indeciso"
35 anos, ensino médio completo, trabalha registrado mas quer sair do CLT. Tem entre R$ 3 mil e R$ 15 mil guardados. Sabe que quer empreender, não sabe em quê. Usa o celular mais que o computador, mas topa usar a web se for simples. Baixa tolerância a jargão técnico ou financeiro. Decide por intuição e prova social ("outras pessoas como eu conseguiram").

**Implicação de produto:** linguagem simples em todo o produto (RN-1), onboarding no celular tem que funcionar tão bem quanto na web, todo termo técnico (CNAE, Simples Nacional, MEI) precisa de explicação em uma frase ao lado.

### 2.2 Persona secundária — "Juliana, já tem o CNPJ"
Já abriu um MEI ou pequena empresa nos últimos 24 meses, mas está no escuro sobre como crescer. Entra pela porta "já tenho negócio" (ver 8.6). Mais orientada a números que Marcos.

### 2.3 Persona de calda — "Sr. Aparecido, indicado pelo SEBRAE/prefeitura"
Chega por canal institucional (ver Documento de Conceito, seção 9.2). Mais velho, menos digital, precisa de UI ainda mais simples e de suporte humano acessível.

---

## 3. Escopo por Fase

| Fase | Este PRD cobre | Trilhas do workflow |
|---|---|---|
| **Fase 0 — Validação** | Seções 7–8 (Diagnóstico e Match) | — |
| **Fase 1 — MVP** | Seções 7–10 completas | A (Validação), B (Identidade), C (Formalização) |
| **Fase 2 — Profundidade** | Seção 11 (esqueleto; detalhar em PRD próprio antes de codificar) | D (Estrutura), E (Comercial), F (Gestão) |
| **Fase 3 — Ecossistema** | Seção 12 (esqueleto) | Módulos pós-abertura |

**RN-2:** Nenhuma tela ou tabela de dados das Fases 2–3 deve ser construída antes das da Fase 1 estarem em produção, exceto os campos de dados que a Fase 1 já precisa prever (ver seção 5, campos marcados `[futuro]`).

**Exceção à RN-2, registrada em 29/07/2026 (decisão do dono do produto):** o **Painel Admin** (dashboard, gestão de usuários, e o **framework** de módulos — menu → tela de módulos, liberação por cliente independente de plano) deixa de esperar a Fase 1 estar em produção. Motivo: é infraestrutura de administração do próprio sistema, não um módulo de negócio voltado ao cliente — o dono do produto decidiu que "toda administração do sistema parte da área de admin" precisa existir desde já, para que os módulos de Fase 2/3 (e o próprio conteúdo de Fase 1 que ainda falta) nasçam dentro dessa estrutura em vez de serem encaixados depois. **O que continua Fase 3 e não é liberado por esta exceção:** o *conteúdo* de cada módulo de negócio (financeiro de verdade, marketing, hub B2B — ver §12) — só o framework que os hospeda (catálogo de módulos + liberação por cliente) é construído agora. O primeiro módulo de conteúdo real só entra depois que o framework estiver pronto e funcionando (ver §12.1).

---

## 4. Princípios de Produto (não negociáveis)

1. **Uma decisão por vez.** Toda tela mostra no máximo uma decisão principal.
2. **Nada trava.** Se uma etapa depende de terceiros, o sistema oferece a próxima etapa disponível em outra trilha (RN-14).
3. **Todo dado de mercado citado precisa ter fonte e data visíveis.** Sem exceção — inclusive em texto gerado por IA (RN-20).
4. **Toda recomendação sensível (jurídica, fiscal, sanitária) traz aviso de que não substitui profissional habilitado** (RN-21).
5. **Mobile e web têm paridade de funcionalidade.** Nenhuma etapa do workflow existe só em uma plataforma.

---

## 5. Modelo de Dados (visão lógica)

Banco: Postgres via Supabase. Convenção: `snake_case`, chaves primárias `uuid`, timestamps `created_at`/`updated_at` em todas as tabelas. RLS (Row Level Security) obrigatória em toda tabela com dado de usuário (RNF-6).

### 5.1 Identidade e assinatura

**`users`** — espelha `auth.users` do Supabase Auth, estendida.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | = auth.users.id |
| nome | text | |
| email | text | único |
| telefone | text | usado em WhatsApp/SMS — coletado obrigatoriamente na tela de completar cadastro pós-login (ver SPEC), mesmo a coluna aceitando nulo pra não travar migração de contas antigas |
| avatar_url | text | foto de perfil, opcional — Supabase Storage, padronizada (ver SPEC) |
| cidade, estado | text | usado no diagnóstico e na inteligência regional |
| criado_via | enum | `organico`, `pago`, `indicacao`, `institucional` — alimenta o CAC real (ver Estudo Financeiro) |
| onboarding_status | enum | `cadastrado`, `diagnostico_concluido`, `assinante`, `negocio_aberto` |

**`subscriptions`**

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | |
| user_id | uuid (FK) | |
| plano | enum | `free`, `essencial`, `multi`, `operacao` — ver Documento de Conceito §9.1 |
| status | enum | `ativa`, `cancelada`, `inadimplente`, `trial` |
| ciclo | enum | `mensal`, `anual` |
| gateway_subscription_id | text | referência externa (Stripe/Pagar.me) |
| nichos_destravados | int | limite conforme plano (1 para Essencial, 3 para Multi) |
| iniciado_em, renovado_em, cancelado_em | timestamp | |

**RN-3:** Downgrade de plano nunca apaga dados de nichos já destravados — apenas bloqueia edição/avanço até novo upgrade.

### 5.2 Diagnóstico

**`diagnostic_responses`**

| Campo | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| capital_disponivel | numeric | faixa, não valor exato (ver RN-5) |
| meses_de_folego | int | |
| apetite_risco | int (1–5) | |
| tempo_disponivel | enum | `integral`, `parcial`, `paralelo_emprego` |
| formacao, experiencia | text[] | tags livres com sugestão |
| estilo_vida | jsonb | respostas de múltipla escolha estruturadas |
| localizacao_cidade, localizacao_estado | text | |
| rede_ativos | text[] | |
| objetivo | enum | `renda_extra`, `substituir_salario`, `escalar` |
| respondido_em | timestamp | |

**RN-4:** O diagnóstico é versionado (`schema_version`) porque as perguntas vão evoluir; respostas antigas não podem quebrar quando o questionário mudar.
**RN-5:** Capital é sempre capturado em faixas (ex.: "até R$ 5 mil", "R$ 5–15 mil"...), nunca em campo numérico livre — reduz abandono e constrangimento.

### 5.3 Nichos e Fit Score

**`niches`** — base curada (ver Documento de Conceito §5.2)

| Campo | Tipo | Notas |
|---|---|---|
| id, nome, slug | | |
| categoria | text | ex.: alimentação, beleza, serviços |
| investimento_min, investimento_max | numeric | |
| tempo_ate_equilibrio_meses | int | |
| complexidade_regulatoria | int (1–5) | |
| sazonalidade | jsonb | |
| margem_tipica_pct | numeric | |
| intensidade_mao_de_obra | int (1–5) | |
| dependencia_ponto_fisico | bool | |
| nivel_concorrencia | int (1–5) | |
| perfil_cliente | text | |
| playbook_md | text | conteúdo curado — o ativo mais defensável do produto |
| ativo_no_mvp | bool | controla quais dos 5–8 nichos do MVP estão visíveis |

**`niche_matches`** — resultado do motor por usuário

| Campo | Tipo | Notas |
|---|---|---|
| id, user_id, niche_id | | |
| fit_score | numeric (0–100) | |
| score_perfil, score_financeiro, score_contexto, score_tempo | numeric | os 4 componentes (Documento de Conceito §5.2) |
| justificativa_ia | text | texto gerado, cacheável |
| gerado_em | timestamp | |

**RN-6:** Recalcular `niche_matches` sempre que `diagnostic_responses` mudar OU a cada 90 dias (dados de mercado envelhecem).
**RN-7:** Apenas os 3 melhores `fit_score` aparecem na prévia gratuita (RN definida no Documento de Conceito, aqui apenas implementada).

### 5.4 Workflow

**Substituído pela Jornada Empreendedora (29/07/2026 — ver §12.1, SPEC.md SDD-31):** o modelo abaixo (`workflow_instances`/`workflow_steps`/`step_templates`/`deliverables`, trilhas de letra `A-F`) nunca chegou a ser implementado no banco. Antes de construir o primeiro módulo real (Jornada Empreendedora), o dono do produto decidiu trocar a nomenclatura de trilha-por-letra por **fases nomeadas**: `validacao_ideia`, `planejamento`, `formalizacao`, `marketing`, `financeiro`, `clientes`, `retencao`, `escala` (a antiga trilha A "Validação" § 9.2 vira a fase "Validação da Ideia", detalhada quando essa fase for desenhada — não reescrita aqui ainda). As tabelas novas nascem com prefixo `jornada_*` (`jornada_instances` já existe; `jornada_etapas`/`jornada_etapa_templates`/`jornada_deliverables` nascem quando as etapas de cada fase forem desenhadas, uma de cada vez). A estrutura abaixo permanece como **referência conceitual** dos campos que cada tabela precisa cobrir — só os nomes de tabela/enum mudam.

**`workflow_instances`** (→ `jornada_instances`) — um negócio em construção

| Campo | Tipo | Notas |
|---|---|---|
| id, user_id, niche_id | | |
| nome_negocio | text | nulo até o usuário decidir (etapa B1) |
| cidade, estado | text | herda do diagnóstico, editável |
| intensidade_dedicacao | enum | `algumas_horas`, `integral` — calibra prazos sugeridos |
| status | enum | `em_andamento`, `concluido`, `pausado` |
| criado_em | timestamp | |

**`workflow_steps`** — instância de cada etapa do template (ver 5.5) para um negócio

| Campo | Tipo | Notas |
|---|---|---|
| id, workflow_instance_id, step_template_id | | |
| trilha | enum | `A`,`B`,`C`,`D`,`E`,`F` |
| status | enum | `bloqueada`, `disponivel`, `em_andamento`, `aguardando_terceiro`, `concluida` |
| dados_usuario | jsonb | respostas específicas da etapa |
| iniciado_em, concluido_em | timestamp | |
| aguardando_desde | timestamp | usado para lembrete de acompanhamento (RN-14) |

**`step_templates`** — o catálogo mestre de etapas (dado de configuração, não por usuário)

| Campo | Tipo | Notas |
|---|---|---|
| id, trilha, ordem, titulo | | |
| depende_de | uuid[] | outros `step_templates` da mesma trilha |
| contexto_md, acao_md | text | conteúdo da etapa (ver anatomia, 6.1) |
| tipo_entregavel | enum | `documento`, `planilha`, `checklist`, `lista` |
| criterio_conclusao | jsonb | regra objetiva verificável (RN-9) |

**`deliverables`** — artefatos gerados

| Campo | Tipo | Notas |
|---|---|---|
| id, workflow_step_id | | |
| tipo | enum | igual a `step_templates.tipo_entregavel` |
| conteudo_url ou conteudo_jsonb | | arquivo (Supabase Storage) ou dado estruturado |
| gerado_por | enum | `ia`, `usuario`, `hibrido` |
| versao | int | permite regenerar sem perder histórico |

**RN-8:** Uma etapa só muda para `disponivel` quando todas em `depende_de` estão `concluida`. Etapas sem dependência ficam `disponivel` desde a criação da instância — garante o paralelismo (Documento de Conceito §6.3).
**RN-9:** `criterio_conclusao` é avaliado pelo copiloto (RF-12), nunca só por clique do usuário — a checagem é o que diferencia o produto de uma checklist estática.

### 5.5 Copiloto de IA

**`ai_conversations`**

| Campo | Tipo | Notas |
|---|---|---|
| id, user_id, workflow_step_id (nullable) | | conversa pode ou não estar ligada a uma etapa |
| titulo | text | |
| criada_em | timestamp | |

**`ai_messages`**

| Campo | Tipo | Notas |
|---|---|---|
| id, conversation_id | | |
| papel | enum | `usuario`, `assistente`, `sistema` |
| conteudo | text | |
| modelo_usado | enum | `economico`, `avancado` (RN-10) |
| tokens_entrada, tokens_saida | int | para custo e para o painel de unit economics |
| criado_em | timestamp | |

**`business_memory`** — a "memória do negócio" citada no Documento de Conceito §7.1

| Campo | Tipo | Notas |
|---|---|---|
| id, workflow_instance_id | | |
| chave | text | ex.: `preco_definido`, `fornecedor_escolhido` |
| valor | jsonb | |
| origem_step_id | uuid | rastreável à etapa que gerou o dado |
| atualizado_em | timestamp | |

**RN-10:** Roteamento de modelo (ver Estudo Financeiro, aba Premissas): perguntas de baixa complexidade (FAQ, formatação, resumo) vão ao modelo econômico; geração de entregável final e checagem de etapa vão ao modelo avançado. A proporção-alvo é 70/30 econômico/avançado.
**RN-11:** Todo prompt enviado ao modelo inclui, por injeção automática, o conteúdo relevante de `business_memory` do negócio — nunca repetir pergunta já respondida (Princípio de Produto, Documento de Conceito §7.1).
**RN-12:** Cache de prompt (prefixo fixo: playbook do nicho + instruções de sistema) obrigatório — é premissa do modelo financeiro (35% de economia líquida esperada).

### 5.6 Módulos pós-abertura `[futuro — Fase 3]`
Esqueleto de tabelas a prever desde já para não quebrar migrações depois: `marketing_campaigns`, `financial_entries`, `suppliers`, `supplier_quotes`. Não implementar nesta fase — apenas reservar os nomes no domínio para evitar colisão.

---

## 6. Arquitetura (visão macro)

> **A especificação técnica completa desta seção vive em `docs/SPEC.md`, não aqui.** O PRD só resume o suficiente para dar contexto de produto; qualquer decisão de stack, estrutura de pastas, RLS ou pipeline de build é definida e mantida na SPEC. Em caso de conflito entre esta tabela e a SPEC, a SPEC vence — e este PRD deve ser corrigido no mesmo PR.

| Camada | Tecnologia | Responsabilidade |
|---|---|---|
| Web + Mobile | **Código único** em React + React Native via **Expo (SDK 54 fixado)**, exportado para web com `react-native-web` — sem Next.js separado (ver SPEC §1, §2) | Site do assinante, apps iOS/Android, paridade total de funcionalidade |
| Hospedagem web | Vercel | Deploy do export web do Expo |
| Backend/dados | Supabase (Postgres + Auth + Storage + Edge Functions) | Toda a persistência, autenticação, regras de RLS (ver SPEC §4) |
| IA | API Anthropic (Claude) — modelo econômico (Haiku) e avançado (Sonnet) | Copiloto, geração de entregáveis, checagem de etapas (ver SPEC §5) |
| Build mobile | GitHub Actions — **EAS Build em modo `--local`** (keystore gerenciado pela EAS, sem consumir build na nuvem), disparado por mudança de versão em `apps/app/app.config.js` (ver SPEC §7, SDD-28) | Geração automática do `.aab` do Android |
| Pagamento | Gateway com suporte a assinatura recorrente no Brasil (Stripe ou Pagar.me — decisão pendente, PRD §17) | Cobrança de planos, webhooks de status |
| E-mail transacional | Resend ou Postmark | Confirmação, lembretes de etapa em espera (RN-14) |

**RNF-1 (custo de IA):** toda chamada ao copiloto deve logar `modelo_usado`, `tokens_entrada`, `tokens_saida` em `ai_messages` — é o dado que valida ou derruba as premissas do Estudo de Viabilidade Financeira. Sem esse log, o modelo financeiro fica cego.

**RNF-2 (RLS):** usuário só lê/escreve suas próprias linhas em `diagnostic_responses`, `workflow_instances`, `workflow_steps`, `deliverables`, `ai_conversations`, `business_memory`. `niches` e `step_templates` são somente-leitura para o app e somente-escrita pelo painel admin.

**RNF-3 (mobile-web paridade de dados):** um único backend Supabase serve as duas plataformas — nenhuma lógica de negócio duplicada no cliente mobile que não exista também na web.

---

## 7. Módulo: Diagnóstico (Fase 0/1 — grátis)

### 7.1 Fluxo de tela
1. **Boas-vindas** — explica em 3 frases o que vai acontecer e quanto tempo leva (RF-1: mostrar estimativa de tempo, ex. "6 minutos").
2. **Questionário em blocos** — um bloco por dimensão (capital, perfil, formação, tempo, estilo de vida, localização, rede, objetivo), nunca mais de 4 perguntas por tela (Princípio 1).
3. **Tela de processamento** — enquanto o Fit Score calcula, mostra progresso (não pode ser instantâneo demais nem lento sem feedback — RNF-4: resposta em até 4s ou skeleton animado).
4. **Resultado — Perfil Empreendedor** — resumo do que o sistema entendeu sobre o usuário, com opção de editar qualquer resposta.
5. **Resultado — Prévia de 3 nichos** — nome, Fit Score, uma linha de justificativa, faixa de investimento. CTA para assinatura.

### 7.2 Regras de negócio
- **RN-13:** Progresso do questionário é salvo a cada bloco — usuário pode sair e voltar sem perder resposta (abandono é o inimigo nº 1, Documento de Conceito §6.4).
- **RN-5** (repetida aqui por relevância): capital em faixas, nunca valor livre.

### 7.3 Critérios de aceite
- **CA-1:** Usuário completa o questionário e recebe 3 nichos com Fit Score calculado (não hardcoded) em até 4 segundos de processamento percebido.
- **CA-2:** Fechar o navegador no meio e voltar depois restaura exatamente o bloco em que parou.
- **CA-3:** Toda justificativa de nicho cita ao menos um dado do `niches.playbook_md` com fonte.

---

## 8. Módulo: Match de Nichos e Paywall

### 8.1 Fluxo
1. Tela de resultado (7.1.5) → usuário toca em um dos 3 nichos → **tela de detalhe bloqueada** (mostra o título das seções do dossiê completo borrado/parcial, não o conteúdo).
2. CTA "Destravar este nicho" → tela de planos (Essencial / Multi / Operação, ver Documento de Conceito §9.1).
3. Checkout → confirmação → dossiê completo liberado → CTA "Começar a construir" leva ao workflow (seção 9).

### 8.2 Regras de negócio
- **RN-15:** Plano Essencial destrava 1 nicho; Multi destrava até 3 (posições fixadas no momento da escolha, mas trocáveis 1x por ciclo — evita gaming do limite).
- **RN-16:** Downgrade de Multi para Essencial mantém o nicho mais avançado no workflow (maior nº de `workflow_steps` concluídas), nunca o escolhido por último.
- **RN-17:** Cobrança preferencialmente pela web (fora da loja de app) para evitar a comissão de 15% — o app mobile deve linkar para checkout web quando a política da loja permitir (verificar guideline vigente da Apple/Google antes de implementar; ver RNF-8).

### 8.3 Módulo "já tenho negócio" `[Fase 3, esqueleto de dados já em 5.6]`
Porta de entrada alternativa citada no Documento de Conceito §8. Fluxo: diagnóstico de saúde do negócio existente → recomendação direta de módulos de operação, pulando o workflow de abertura.

### 8.4 Critérios de aceite
- **CA-4:** Usuário sem assinatura não consegue, por nenhuma rota de URL direta, ler o conteúdo completo de um `niches.playbook_md` de nicho não destravado (checar RLS, não só UI).
- **CA-5:** Downgrade respeita RN-16 e é reversível dentro do mesmo ciclo de cobrança.

---

## 9. Módulo: Workflow de Construção (trilhas A, B, C — MVP)

**Renomeado pela Jornada Empreendedora (ver §5.4, §12.1):** esta seção descreve o conteúdo conceitual das trilhas A/B/C, mas a estrutura de execução real é a Jornada Empreendedora, com fases nomeadas em vez de letras. O conteúdo da **Trilha A — Validação** abaixo é o rascunho que alimenta a futura fase **"Validação da Ideia"** (a próxima a ser desenhada, ainda não detalhada — inclui um checklist específico e geração de Persona/SWOT/Canvas/Proposta de Valor por IA, escopo novo não coberto por este parágrafo). Trilhas B (Identidade) e C (Formalização) mapeiam pras fases "Planejamento"/"Formalização" da Jornada, a detalhar quando chegar a vez delas.

### 9.1 Anatomia de uma etapa (aplica-se a toda etapa de toda trilha)
Toda etapa renderiza, nesta ordem fixa: **Contexto** (por que existe) → **Dados** (inteligência de mercado/região, com fonte) → **Decisão** (escolha concreta com trade-offs) → **Ação** (passo a passo operacional) → **Entregável** (artefato salvo) → **Checagem** (copiloto valida `criterio_conclusao` antes de liberar avanço).

### 9.2 Fase "Planejamento" — Etapa 1: Nome da Empresa (desenhada em 29/07/2026)

Primeira etapa da fase "Planejamento" (antiga Trilha B — Identidade, §9). Fluxo: o usuário digita palavras-chave do negócio → a IA gera 10 nomes candidatos → o sistema consulta disponibilidade de **domínio** (.com.br e .com) e um indício de **handle do Instagram** para cada candidato → o usuário escolhe o nome final.

**Escopo reduzido por decisão de produto:** o fluxo conceitual original também previa consultar disponibilidade de nome empresarial (Junta Comercial) e de marca (INPI) antes da escolha final. As duas foram **descartadas do MVP** — nenhuma tem API pública/oficial, e simulá-las daria uma falsa sensação de certeza jurídica/fiscal. Se algum dia entrarem, é como etapa nova e explícita, não reaproveitando esta.

Detalhamento técnico da geração e das checagens: ver SPEC.md SDD-34.

### 9.3 Fase "Planejamento" — Etapa 2: Identidade Visual (desenhada em 29/07/2026)

Segunda etapa da fase "Planejamento", depende da Etapa 1 (o nome já escolhido entra no prompt de geração). Fluxo: questionário curto sobre a "alma da marca" (valores, personalidade em 3 palavras, tom de comunicação formal/casual, cores preferidas e cores a evitar) → a IA gera **1 slogan** e **3 opções de logo** (estilos fixos: minimalista, moderno, clássico) → o usuário escolhe um logo → o sistema gera a versão escolhida em **qualidade alta** e guarda no Storage do usuário, disponível para download a qualquer momento.

**Princípio de custo:** os 3 rascunhos de logo são gerados em qualidade baixa (barato) — o gasto maior com geração de imagem em alta qualidade só acontece **uma vez**, depois da escolha do usuário, nunca nas 3 opções de rascunho.

Detalhamento técnico (provedor de IA de imagem, formato do Storage): ver SPEC.md SDD-35.

### 9.4 Fase "Formalização" (desenhada em 30/07/2026)

Diferente das fases anteriores, o conteúdo de cada etapa **não é gerado por IA** — é o mesmo processo burocrático real para qualquer empreendedor no mesmo regime, então é conteúdo curado uma vez, não personalizado por usuário.

**Etapa 1 — bifurcação por regime:** "Você pretende faturar até R$ 81 mil no primeiro ano?" — a resposta decide o caminho:
- **Sim → MEI:** 3 etapas (Cadastro no Portal do Empreendedor, Escolha do CNAE, Alvará e licenças).
- **Não → Empresa formal:** 9 etapas, nesta ordem — Escolha do CNAE, Natureza Jurídica, Capital Social, Sócios, Contrato Social, Registro, Receita Federal, Alvará, Inscrição Estadual.

**Toda etapa (dos dois caminhos) tem:** lista de documentos (cada um com explicação de como obter), explicação da etapa, prazo esperado e botão "Concluir". O empreendedor pode baixar/imprimir em PDF os documentos de uma etapa, ou o checklist completo do seu caminho.

**RN-23 (nova): nenhuma etapa desta fase trava outra.** Diferente do motor genérico de etapas (RN-8), aqui não existe `bloqueada` — o empreendedor precisa poder ir e voltar livremente, inclusive desmarcar uma etapa já concluída para refazê-la, sem que isso trave nenhuma outra. O percentual de conclusão é sempre `concluídas / total` do caminho escolhido — desmarcar já reduz o percentual automaticamente, sem cálculo especial.

**RN-18 satisfeita pela estrutura, não por uma etapa nova:** o RN-18 original (viabilidade econômica bloqueia a abertura de CNPJ) já é garantido pelo modelo de fases sequenciais — não existe caminho para chegar a "Formalização" sem antes completar "Validação da Ideia" e "Planejamento" por inteiro. Nenhuma etapa de "estudo de viabilidade econômica" foi criada separadamente; ela nunca chegou a ser desenhada como etapa própria da Fase 2 construída (SDD-32) — se um dia fizer falta, entra como etapa nova ali, não aqui.

**RN-19 aplicada:** como as cidades-piloto ainda não foram decididas (pendência registrada no fim deste documento), todo o conteúdo de alvará/licenças é **genérico** — cada etapa que depende de exigência municipal diz explicitamente "consulte a prefeitura da sua cidade", nunca finge saber o processo de uma cidade específica.

**RN-21 aplicada:** aviso fixo no topo da tela ("orientação geral, não substitui contador/advogado") + dica pontual em etapas de maior risco (Natureza Jurídica, Contrato Social, Alvará) sugerindo consultar um profissional.

Detalhamento técnico (schema da bifurcação, conteúdo completo por etapa, exportação em PDF): ver SPEC.md SDD-38.

### 9.5 Fase "Financeiro" — Planejamento Financeiro (desenhada em 30/07/2026)

**Reordenação (decisão do dono do produto):** esta fase passou a vir logo após Formalização, antes de Marketing — conhecer a própria saúde financeira antes de gastar com divulgação. Ordem atual: Validação da Ideia → Planejamento → Formalização → **Financeiro** → Marketing → Clientes → Retenção → Escala.

**Diferente de todas as fases anteriores, esta não tem nenhuma chamada de IA.** É uma calculadora financeira interativa: o empreendedor informa quanto tem disponível (sugestão de partida vem da faixa de capital já respondida no diagnóstico, Fase 1) e o sistema monta automaticamente 6 blocos — Investimento Inicial, Capital de Giro, Reserva de Emergência, Ponto de Equilíbrio Mensal, Fluxo de Caixa (projeção de 12 meses) e Lucro Esperado Mensal — cada um com a fórmula exibida ao lado e uma explicação em português simples.

**Princípio central: ensinar, não só entregar o número.** Todo input por trás dos 6 blocos é editável (investimento inicial, custos fixos, receita esperada, margem de contribuição, meses de capital de giro, meses de reserva) e o recálculo é 100% local — sem chamada de rede — pra dar resposta instantânea a cada valor testado, exatamente como pedido pelo dono do produto.

**RN-21 aplicada:** aviso fixo de que os números são estimativa de partida e não substituem um contador.

**RN-23 aplicada:** mesmo espírito de Formalização — nada trava, o empreendedor edita e reconclui quantas vezes quiser.

Detalhamento técnico (fórmulas, defaults, fonte dos dados do nicho): ver SPEC.md SDD-39.

### 9.6 Fase "Estrutura" (desenhada em 30/07/2026)

Checklist da infraestrutura básica que o negócio precisa pra funcionar no dia a dia: Local, Internet, Telefone, Notebook, ERP, Conta Bancária, Pix, Maquininha, E-mail, Domínio, Site, CRM. Entra logo após Financeiro, antes de Marketing — ordem atual: Validação da Ideia → Planejamento → Formalização → Financeiro → **Estrutura** → Marketing → Clientes → Retenção → Escala.

Cada item traz: uma explicação do que é, uma dica de como resolver, e é marcado "concluído"/"pendente" pelo próprio empreendedor (ação no mundo real, igual às etapas de Formalização) — sem geração por IA, é conteúdo curado uma vez.

**RN-24 (nova): o checklist de Estrutura nunca bloqueia o avanço para a próxima fase.** Diferente de toda outra fase do produto (inclusive Formalização, RN-23, cujo botão de avançar só libera com o checklist 100% completo), aqui o empreendedor pode seguir para Marketing a qualquer momento, com qualquer parte do checklist pendente, e voltar depois — mesmo já estando em fases seguintes — pra marcar o que resolveu. São indicações do que ele vai precisar, não uma condição de avanço. Para viabilizar o "voltar depois", a trilha lateral de fases passou a permitir clicar em qualquer fase já visitada para revisá-la, não só a atual.

**RN-25 (nova): o checklist é adaptado ao tipo de negócio escolhido.** Nem todo item se aplica a todo nicho — ex.: Maquininha não é essencial pra quem não depende de ponto físico; ERP e CRM não são essenciais pra quem vende de balcão sem controle de estoque ou relacionamento recorrente de cliente. O sistema separa os itens em "essenciais" (contam para o percentual de conclusão da fase) e "não essenciais para o seu tipo de negócio" (ficam numa seção à parte, continuam editáveis, mas não contam) — critério guardado como dado de configuração junto de cada item, não uma regra fixa de código, pra poder ser ajustado/expandido sem alterar o app.

Detalhamento técnico (schema de relevância por nicho, navegação da trilha lateral): ver SPEC.md SDD-40.

### 9.7 Fase "Fornecedores" (desenhada em 30/07/2026)

Entra logo depois de Estrutura, ainda antes de Marketing — ordem atual: Validação da Ideia → Planejamento → Formalização → Financeiro → Estrutura → **Fornecedores** → Marketing → Clientes → Retenção → Escala. A lógica: só faz sentido negociar fornecedor a sério depois de ter CNPJ/conta PJ (preço e prazo B2B costumam depender disso), e só faz sentido divulgar o negócio (Marketing) depois de saber que consegue comprar/revender o que pretende vender.

**Três fontes de fornecedor, deliberadamente separadas:**
1. **Roteiro de busca gerado por IA** — a IA sugere de 4 a 6 *categorias* de fornecedor/parceiro que aquele tipo de negócio costuma precisar (ex.: embalagem, matéria-prima, equipamento), com o que avaliar em cada uma e uma busca pronta no Google. **A IA nunca gera nome de empresa fornecedora específica** — ela não tem acesso a nenhum fornecedor real, e inventar um nome seria dado fabricado (mesmo princípio do §4, honestidade sobre o que o produto sabe de verdade).
2. **Base de parceiros curada pelo admin** — nova tela no Painel Admin (`/admin/fornecedores`) onde o admin cadastra parceiros/fornecedores reais (produto ou serviço), cada um podendo ser marcado como aplicável a nichos específicos ou a todos. Aparecem pro empreendedor como sugestão automática, filtrados pelo nicho dele. Nasce vazia — o valor cresce conforme o admin popula.
3. **Lista pessoal do empreendedor** — ele mesmo cadastra os fornecedores que encontrar (por conta própria ou a partir de uma sugestão de parceiro), no formato Categoria → Fornecedor → Avaliação → Preço → Prazo → Contato. Pode adicionar, editar e remover livremente.

**Preparado para RAG futuro, não construído ainda:** a base de parceiros já nasce com a estrutura pronta para busca semântica (embedding por parceiro, mesmo padrão da base de conhecimento geral do copiloto, RN-20-adjacent) — mas a busca em si (gerar embedding ao cadastrar, buscar por similaridade) só entra quando houver conteúdo real cadastrado; rodar isso sobre uma base vazia não teria valor. Até lá, a sugestão pro empreendedor é um filtro simples por nicho.

**Mesmo espírito "nada trava" da Estrutura:** só existe 1 item de conclusão nesta fase (a lista em si), concluído manualmente pelo empreendedor quando ele achar que já tem o essencial — nunca bloqueia o avanço para Marketing.

Detalhamento técnico (schema das duas tabelas novas, Edge Function do roteiro): ver SPEC.md SDD-41.

### 9.8 Fase "Produto" (desenhada em 30/07/2026)

Entra logo depois de Fornecedores, ainda antes de Marketing — ordem atual: ... → Estrutura → Fornecedores → **Produto** → Marketing → Clientes → Retenção → Escala. Só faz sentido divulgar (Marketing) depois de saber o que vai vender e por quanto.

**Não é uma base de dados de produtos do empreendedor** — é uma aula prática + ferramenta, com quatro blocos:
1. **Orientação de cadastro:** planilha vs. sistema próprio, com recomendação direta (comece pela planilha; migre pra sistema quando o catálogo/operação justificar) — conteúdo curado, igual à Formalização, não gerado por IA nem personalizado por usuário.
2. **Planilha-modelo pronta pra baixar**, com os campos certos e 2 linhas de exemplo já preenchidas (um produto físico, um serviço).
3. **Aula de precificação:** explica em linguagem simples (RN-1) os quatro conceitos — custo, despesas variáveis, impostos, margem de lucro — e nomeia o erro mais comum de quem tá começando (calcular imposto/margem em cima do custo em vez do preço de venda).
4. **Calculadora de precificação:** o empreendedor informa custo, % de despesas variáveis, % de impostos e % de margem desejada, e o sistema calcula o preço de venda na hora — mesmo espírito "ensinar, não só entregar o número" do Planejamento Financeiro (§9.5). Se a soma das três porcentagens passar de 100%, o sistema recusa mostrar um preço (matematicamente impossível) e explica por quê, em vez de mostrar um número quebrado.

**Sugestão de parceiro desenvolvedor:** reaproveita a base de parceiros do admin (§9.7) — se houver algum parceiro marcado como "indicado pra sistema próprio", ele aparece nesta tela como opção pra quem quiser sair da planilha e ter algo sob medida. Sugestão, nunca obrigatória.

**RN-24 aplicada:** mesmo espírito "nada trava" — só existe 1 item de conclusão nesta fase, marcado manualmente quando o empreendedor sentir que entendeu como cadastrar e precificar; nunca bloqueia o avanço para Marketing.

Detalhamento técnico (fórmula de precificação, planilha-modelo, flag do parceiro desenvolvedor): ver SPEC.md SDD-42.

### 9.9 Fase "Marketing" (desenhada em 30/07/2026)

Entra logo depois de Produto — ordem atual: ... → Fornecedores → Produto → **Marketing** → Clientes → Retenção → Escala. Duas partes:

1. **Checklist de contas** — Instagram, Facebook, Perfil da Empresa no Google, TikTok e WhatsApp Business, cada um com explicação de por que importa e um passo a passo de como configurar. TikTok traz a ressalva de que a Loja do TikTok (venda direto no app) só vale a pena pra quem já vende produto físico com estoque pronto — pra quem presta serviço, o TikTok comum já basta.
2. **Bio, sugestões de post e de anúncio geradas automaticamente** — a partir do que a Jornada já sabe do negócio (nome, slogan, nicho, persona, proposta de valor, todos já coletados nas fases anteriores), sem pedir nada de novo ao empreendedor. As sugestões de anúncio ficam deliberadamente sem preço/promoção inventados — é o empreendedor que completa com a oferta real.

**RN-26 (nova): entregável de Marketing pode ser gerado de novo sempre que o empreendedor quiser.** Pedido explícito do dono do produto — diferente de Persona/SWOT/Canvas/Proposta de Valor (§9.2, geradas uma vez por fase), aqui o botão de gerar continua disponível a cada vez que o empreendedor volta a esta fase, sobrescrevendo o conteúdo anterior.

**RN-24 aplicada:** checklist de contas não trava nada — cada item marcado independentemente, avanço pra Clientes sempre disponível.

Detalhamento técnico (schema, Edge Function, modelo de IA usado): ver SPEC.md SDD-43.

### 9.2 Trilha A — Validação
Etapas: estudo de mercado local, mapeamento de concorrentes, pesquisa com clientes potenciais, teste de demanda, estudo de viabilidade econômica.
**RN-18:** A etapa "estudo de viabilidade econômica" é bloqueante para a trilha C (Formalização) — não faz sentido abrir CNPJ sem viabilidade minimamente validada. É a única dependência cross-trilha do MVP; todas as demais dependências são internas à própria trilha.

### 9.3 Trilha B — Identidade
Etapas: escolha do nome, checagem de disponibilidade (domínio + redes + busca prévia INPI), registro de marca, identidade visual, presença digital inicial.
**RF-2:** A etapa de checagem de nome deve integrar verificação de domínio (RDAP/registro.br ou provedor equivalente) e retornar disponibilidade em tempo real — não é conteúdo estático.

### 9.4 Trilha C — Formalização
Etapas: natureza jurídica e regime tributário, CNAE, CNPJ, alvarás municipais, licenças setoriais, conta PJ, emissor de nota fiscal.
**RN-19:** Conteúdo de exigência municipal varia por cidade — no MVP, cobrir com profundidade real apenas as cidades dos primeiros usuários-piloto (RN-2 aplicada: profundidade antes de amplitude); demais cidades recebem orientação genérica com aviso claro de que é genérica.

### 9.5 Paralelismo e etapas em espera
**RN-14:** Quando uma etapa entra em `aguardando_terceiro` (ex.: aguardando prefeitura), o sistema: (a) registra `aguardando_desde`; (b) sugere imediatamente a próxima etapa disponível em outra trilha; (c) dispara lembrete por e-mail/push se `aguardando_desde` passar de 7 dias sem atualização.

### 9.6 Critérios de aceite
- **CA-6:** Duas etapas de trilhas diferentes sem dependência entre si podem estar `em_andamento` simultaneamente.
- **CA-7:** Uma etapa com `depende_de` não vazio nunca aparece como `disponivel` antes de suas dependências estarem `concluida`.
- **CA-8:** Toda etapa concluída tem ao menos um registro em `deliverables` associado.

---

## 10. Módulo: Copiloto de IA

### 10.1 Superfícies do copiloto
- **Chat contextual** — disponível em qualquer tela do workflow, ciente de `workflow_step` atual e de `business_memory`.
- **Geração de entregável** — acionado pela própria etapa, não pelo chat livre (evita entregável incoerente com o template).
- **Checagem de etapa** — roda ao usuário clicar "concluir etapa"; se falhar, explica o que falta, não apenas bloqueia.

### 10.2 Guardrails (RN-21, RN-20 já citadas — detalhamento técnico)
- **RF-3:** Todo texto de resposta que citar número de mercado deve incluir fonte e data inline (ex.: "SEBRAE, jul/2026"), renderizado como citação visível, não rodapé escondido.
- **RF-4:** Perguntas classificadas como jurídicas/fiscais/sanitárias (lista de palavras-chave + fallback por classificação do próprio modelo) recebem aviso padrão e oferta de encaminhamento a parceiro.
- **RF-5:** Se `criterio_conclusao` envolve número (ex.: preço, margem) e o número informado pelo usuário viola uma regra de sanidade (ex.: preço abaixo do custo declarado), o copiloto recusa concluir a etapa e explica por quê.

### 10.3 Critérios de aceite
- **CA-9:** Uma pergunta repetida sobre um dado já salvo em `business_memory` é respondida sem pedir a informação de novo.
- **CA-10:** 100% das respostas com dado de mercado passam em um teste automatizado de presença de citação (regex/parse) antes de ir para produção.

---

## 11. Módulos Fase 2 (trilhas D, E, F) — esqueleto

Não detalhar fluxo de tela agora. Ao chegar a esta fase, abrir PRD específico usando a mesma anatomia da seção 9.1. Preservar nomes de tabela já reservados na seção 5.6.

---

## 12. Módulos Fase 3 (Ecossistema pós-abertura) — esqueleto

Marketing, Financeiro, Hub B2B — ver Documento de Conceito §8. Mesma regra da seção 11: PRD próprio no momento da priorização.

### 12.1 Framework de módulos (exceção à RN-2, ver §3) — construído em 29/07/2026

O **Painel Admin** ganhou o mecanismo genérico que hospeda os módulos (e os de Fase 2) quando cada um for priorizado: um catálogo de módulos (nome, slug, descrição) e uma tabela de liberação por usuário (`modules`/`user_modules`), **independente de plano pago** — planos pagos ainda não existem no produto (PRD §17 trata gateway como decisão pendente), então por ora liberação é 1:1 por usuário, controlada manualmente pelo admin. O menu do app (lado cliente) mostra só os módulos liberados pra aquele usuário; o lado admin mostra o catálogo inteiro + toggle de liberação por usuário. Detalhamento técnico em SPEC.md SDD-30.

**Primeiro módulo de conteúdo (mesma data):** a **Jornada Empreendedora** (ver §5.4, §9, SPEC.md SDD-31) começou a ser construída — ainda sob liberação manual do admin (inclusive pra testes, mesmo sem assinatura), até existir a feature de liberação por plano. É o módulo mais importante do produto: o workflow guiado da escolha do nicho até o negócio aberto e funcionando. Construído incrementalmente, uma etapa de cada vez — a primeira etapa (confirmação/escolha do nicho pós-login) está pronta; a "Fase: Validação da Ideia" é a próxima a ser desenhada.

### 12.2 Módulos anunciados na landing (decisão do dono do produto, 29/07/2026)

A home passou a apresentar o catálogo de módulos do produto, para que o visitante entenda que o Ser Dono é mais que um passo a passo. São quatro, e **o rótulo de status na tela é obrigatório** — anunciar módulo não construído como pronto contraria o princípio de honestidade do §4 e a RN-2:

| Módulo | Status hoje | Onde vive |
|---|---|---|
| **Jornada Empreendedora** | Disponível | §9, SPEC.md SDD-31 a SDD-36 |
| **Materiais sobre empreendedorismo** | Disponível | Base de 30 artigos curados com fonte/data + assistente sobre ela (SPEC.md SDD-21) |
| **Tutoriais** | Em breve | Passo a passo prático das tarefas operacionais que travam o empreendedor (emitir nota, abrir conta PJ, usar cada ferramenta) — sem PRD próprio ainda |
| **Calculadora de Precificação** | Em breve | Ensinar a formar preço: custo, margem e resultado. Tem sobreposição conceitual com a fase "Financeiro" da Jornada (§9) — **decidir na priorização se é módulo separado ou etapa daquela fase**, para não construir a mesma conta em dois lugares |

**Regra:** enquanto um módulo estiver "em breve", ele aparece na landing com o rótulo visível e **sem link** para uma tela que não existe. Nenhum módulo sai de "em breve" na landing antes de estar utilizável em produção.

---

## 13. Regras de Negócio Transversais (numeração consolidada)

| # | Regra |
|---|---|
| RN-1 | Linguagem simples em todo o produto; termo técnico sempre acompanhado de explicação em uma frase |
| RN-2 | Não construir tela/tabela de fase futura antes da fase atual estar em produção |
| RN-3 | Downgrade nunca apaga dado de nicho destravado |
| RN-4 | Diagnóstico é versionado por schema |
| RN-5 | Capital sempre em faixas, nunca valor numérico livre |
| RN-6 | Recalcular Fit Score ao mudar diagnóstico ou a cada 90 dias |
| RN-7 | Prévia gratuita mostra sempre 3 nichos |
| RN-8 | Etapa muda para disponível só quando dependências concluídas |
| RN-9 | Checagem de conclusão sempre pelo copiloto, nunca só por clique |
| RN-10 | Roteamento de modelo de IA: 70% econômico / 30% avançado (meta) |
| RN-11 | Prompt sempre injeta `business_memory` relevante |
| RN-12 | Cache de prompt obrigatório no prefixo fixo |
| RN-13 | Progresso do diagnóstico salvo a cada bloco |
| RN-14 | Etapa em espera sugere próxima etapa disponível + lembrete em 7 dias |
| RN-15 | Limite de nichos destravados por plano (1 / até 3) |
| RN-16 | Downgrade preserva o nicho mais avançado |
| RN-17 | Preferência de cobrança pela web para evitar comissão de loja |
| RN-18 | Viabilidade econômica bloqueia início da trilha C |
| RN-19 | Profundidade real só nas cidades piloto; demais cidades com aviso de conteúdo genérico |
| RN-20 | Todo dado de mercado citado tem fonte e data visíveis |
| RN-21 | Toda recomendação sensível traz aviso de não substituir profissional habilitado |
| RN-22 | App Android verifica versão mínima suportada; abaixo dela, bloqueia uso até atualizar via Play Store |
| RN-23 | Etapas da fase Formalização nunca travam entre si — sempre navegáveis e desmarcáveis livremente |
| RN-24 | Checklist da fase Estrutura nunca bloqueia o avanço para a próxima fase; sempre editável, mesmo em fases seguintes |
| RN-25 | Checklist da fase Estrutura é filtrado por relevância ao tipo de negócio escolhido (nicho) |
| RN-26 | Entregável de Marketing (bio/posts/anúncios) pode ser regenerado quantas vezes o empreendedor quiser |

---

## 14. Requisitos Não Funcionais

| # | Requisito |
|---|---|
| RNF-1 | Toda chamada de IA loga tokens de entrada/saída e modelo usado |
| RNF-2 | RLS obrigatória em toda tabela com dado de usuário |
| RNF-3 | Backend único Supabase para web e mobile — sem lógica de negócio duplicada no cliente |
| RNF-4 | Resposta percebida em até 4s ou feedback de carregamento |
| RNF-5 | LGPD: base legal explícita para coleta do diagnóstico, consentimento registrado com timestamp, exportação e exclusão de dados a pedido do usuário |
| RNF-6 | RLS testada automaticamente (não apenas por revisão manual) antes de cada release |
| RNF-7 | Disponibilidade alvo do backend: 99,5% mensal no MVP (não é meta de fintech-grade ainda) |
| RNF-8 | Checkout mobile deve seguir a guideline vigente das lojas no momento da implementação — reconfirmar antes de codificar, política muda com frequência |
| RNF-9 | Todo custo de infraestrutura variável (Supabase, Vercel, IA) deve ser monitorável por painel simples — insumo direto do Estudo de Viabilidade Financeira |

---

## 15. Métricas a Instrumentar desde o Dia 1

Ligado à seção 11 do Documento de Conceito (North Star e funil). Eventos mínimos a disparar:
`cadastro_criado`, `diagnostico_iniciado`, `diagnostico_concluido`, `nicho_visualizado`, `checkout_iniciado`, `assinatura_ativada`, `etapa_iniciada`, `etapa_concluida`, `entregavel_gerado`, `assinatura_cancelada`.

**RF-6:** Cada evento carrega `user_id`, `timestamp`, e payload mínimo necessário para reconstruir o funil sem re-consultar todas as tabelas relacionais.

---

## 16. Glossário rápido

- **Fit Score** — nota calculada de aderência entre usuário e nicho (não gerada por IA, apenas explicada por ela).
- **Business memory** — registro estruturado de decisões do negócio, injetado em todo prompt.
- **Trilha** — agrupamento paralelo de etapas do workflow (A a F).
- **Dossiê** — conjunto de entregáveis de um negócio, exportável.

---

## 17. Decisões em aberto (bloqueiam início de código)

1. ~~React Native vs. Flutter para o app mobile~~ — **resolvido:** Expo (React Native, SDK 54) com código único para web e mobile. Ver `docs/SPEC.md` §1–§2.
2. Gateway de pagamento definitivo (Stripe vs. Pagar.me) — depende de checar suporte a assinatura recorrente + taxa real, ver Estudo de Viabilidade Financeira.
3. Cidades-piloto para profundidade real da trilha C (RN-19) — decisão de negócio, não técnica.
4. Nichos do MVP (5 a 8, ver Documento de Conceito §12) — precisa fechar a lista para popular `niches` antes de qualquer teste real.
