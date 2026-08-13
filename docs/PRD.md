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
Já abriu um MEI ou pequena empresa nos últimos 24 meses, mas está no escuro sobre como crescer. Entra pela porta "já tenho negócio" (ver §8.3, construída em 31/07/2026). Mais orientada a números que Marcos.

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
5. **Resultado — Prévia de 3 nichos** — nome, Fit Score, uma linha de justificativa, faixa de investimento, **e os caminhos concretos dentro do nicho** (§8.5). CTA para assinatura.

**Bloco aberto "Sobre você" (adicionado em 04/08/2026 — o questionário passou de 7 para 8 blocos):** uma pergunta de texto livre e **opcional** ("me conta com as suas palavras: o que você gosta de fazer?"), entre Experiência e Localização. Motivo: os 5 checkboxes de área eram um sinal pobre demais para descrever alguém — e é justamente texto livre que uma IA interpreta melhor que qualquer fórmula. Opcional de propósito: obrigar redação num funil de conversão afugenta a persona primária (§2.1); pular não muda nada no resto do fluxo. O bloco 5 (Experiência) também ganhou as áreas que faltavam para cobrir o catálogo: Educação, Saúde e bem-estar, Moda.

### 7.2 Regras de negócio
- **RN-13:** Progresso do questionário é salvo a cada bloco — usuário pode sair e voltar sem perder resposta (abandono é o inimigo nº 1, Documento de Conceito §6.4).
- **RN-5** (repetida aqui por relevância): capital em faixas, nunca valor livre.
- **RN-37 (nova, 04/08/2026): a IA amplia o sinal de perfil e explica o resultado — nunca decide, ranqueia ou recalcula o Fit Score.** Ela traduz o texto livre do bloco 6 num **vocabulário fechado de áreas** (as mesmas do bloco 5 e de `niches.areas_afinidade`); qualquer área fora dessa lista é descartada antes de influenciar qualquer nota. O que a IA inferiu é **persistido e mostrado ao usuário** na tela de resultado ("pelo que você escreveu, entendi afinidade com: …") — não existe sinal invisível mexendo na ordem das sugestões. Se a chamada de IA falhar, o diagnóstico segue com o sinal dos checkboxes, sem travar.

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

### 8.3 Porta de entrada "já tenho negócio" (construída em 31/07/2026 — SDD-52)

**Substitui o esboço original desta seção** (citado desde a v0.1 do PRD, nunca implementado): em vez de pular o workflow de abertura inteiro e cair num módulo de operação separado, a pessoa que já tem negócio entra na MESMA Jornada Empreendedora (§9) — só que mais adiantada. Motivo da mudança: quando este parágrafo foi escrito, a Jornada Empreendedora ainda não existia de verdade; hoje ela é o motor mais maduro do produto, e reaproveitá-lo é mais simples e mais consistente do que construir um caminho paralelo.

**Fluxo** (rota `/negocio-existente`, acessível pela home — CTA secundário no Hero e o card "JÁ TEM CNPJ" do §2.2/persona Juliana — **e agora também de dentro do app, ver §8.6**):
1. Escolhe o próprio nicho num catálogo de 31 opções (expandido de 5 nesta mesma rodada — ver nota de dado abaixo) ou descreve em texto livre se não encontrar.
2. Responde, marco a marco, uma pergunta objetiva por fase da Jornada ("já tem nome e identidade definidos?", "já tem CNPJ?", "já tem fornecedor definido?"...) — nunca uma única pergunta de "quão avançado você está", porque quem já empreende raramente avança de forma linear (pode ter CNPJ e ainda não ter fornecedor, por exemplo). Planejamento e Formalização, quando confirmadas, pedem os dados reais do negócio dela pra usar no resto da Jornada, nunca fabricados: nome da empresa (obrigatório); se já tem logo pronto, sobe o arquivo (opcional — se ainda não tem, a tela avisa que a fase Planejamento ajuda a criar um do zero, §9.3); regime MEI ou formal (obrigatório); e o número do CNPJ (opcional, validado por dígito verificador quando preenchido, nunca consultado numa API externa — mesmo princípio "sem falsa certeza jurídica" do §9.4).
3. **Cria a conta — só quando ainda não existe uma.** Quem chega aqui já autenticado (ver §8.6) pula esta etapa por inteiro: a tela detecta a sessão real e não pede e-mail/senha de novo.
4. O sistema semeia toda a Jornada de uma vez, marca como concluídas as fases confirmadas — reaproveitando exatamente as mesmas funções que cada tela usaria pra se concluir, nunca fabricando um entregável (persona, SWOT, plano) que nunca foi gerado de verdade — e entra direto na primeira fase ainda pendente, na ordem canônica.
5. Toda fase marcada continua 100% editável depois (mesmo princípio "nada trava" já aplicado a Estrutura/Formalização) — a pessoa está atestando o que já viveu na prática, não perdendo a chance de gerar o entregável real depois se quiser.

**Nichos — de 5 pra 31:** ~~os 5 originais continuam com dossiê completo e são os únicos usados no Fit Score do diagnóstico de novo empreendedor.~~ **Superado em 04/08/2026 — os 31 entram no Fit Score (ver §8.5).** Os 26 novos entram num nível mais leve (sem dossiê de mercado completo — evolução futura, não bloqueia este lançamento).

Detalhamento técnico completo: SPEC.md SDD-52. Captura de CNPJ e logo próprio: SPEC.md SDD-68.

### 8.6 Bifurcação dentro do app pra quem já está logado (pedido do dono do produto em 04/08/2026)

**Problema relatado:** o dono do produto cadastrou um cliente que já tem negócio. A pessoa logou — e como nunca tinha passado pela home (nem pelo diagnóstico, nem pelo "já tenho negócio"), o único caminho que o app oferecia de dentro dele era "Fazer o diagnóstico", como se fosse começar do zero.

**Causa:** a bifurcação "quero começar do zero" vs. "já tenho um negócio" só existia nas telas de **antes** do login (home/Hero na web, `AppWelcomeScreen` no app nativo). Quem chegava a `/jornada` já autenticado e sem nenhuma jornada em andamento — inclusive conta criada pelo admin — caía direto no estado vazio da tela de escolha de nicho, que só oferecia iniciar o diagnóstico.

**Correção:** o mesmo estado vazio (`EscolherNichoScreen`, quando não existe `niche_matches`) agora oferece as duas opções, igual à home: "Quero começar do zero" (segue pro diagnóstico) e "Já tenho um negócio" (segue pro fluxo do §8.3). Ajuste companheiro: o fluxo do §8.3 precisou reconhecer sessão já autenticada e pular a etapa 3 (criar conta) — sem isso, um usuário já logado seria levado a tentar criar uma conta nova por cima da que já tem.

Detalhamento técnico: SPEC.md SDD-67.

### 8.5 Catálogo completo no Fit Score e sub-negócios (pedido do dono do produto em 04/08/2026)

**Origem:** testando o funil, o dono do produto marcou só "Tecnologia / digital" e recebeu 3 sugestões das quais só 1 tinha a ver com o perfil dele — e apontou, com razão, que "Serviço digital" não diz nada pra quem nunca empreendeu. Ele perguntou se valeria colocar IA no cálculo. A investigação mostrou que **a causa era estrutural, não de inteligência**, em três camadas:

1. **O motor só via 5 nichos, e só 1 era de tecnologia.** Como a tela mostra os 3 melhores, 2 tinham que vir de outra área — matemática, não falta de IA. Nenhum modelo escolhendo entre as mesmas 5 opções devolveria coisa diferente.
2. **Ter capital de sobra era tratado como incompatibilidade.** O componente financeiro media a *sobreposição* entre a faixa de capital e a de investimento: quem tinha mais de R$ 40 mil tirava **zero** num nicho de R$ 300–5.000, porque as faixas não se cruzavam. Com 5 nichos ficava mascarado; com o catálogo inteiro passou a mandar no resultado e empurrava perfis de tecnologia pra lavanderia e escola infantil. A pergunta certa é "você consegue bancar?", nunca "suas faixas coincidem?".
3. **Nicho tinha uma categoria só.** Vários negócios digitais estavam sob "serviços"/"varejo", invisíveis pra quem marcava tecnologia.

**O que mudou:**
- **Os 31 nichos entram no Fit Score** (revoga a restrição do §8.3). A razão original era o dossiê completo (`playbook_md`), mas ele **não é lido por nenhuma tela** — a diferença era invisível pro usuário, então ativar não promete nada que não exista (§4/RN-2).
- **`niches.areas_afinidade`**: um nicho pode atender mais de uma área ("Agência de marketing digital" é tecnologia *e* serviços), coisa que a categoria única não expressava.
- **Catálogo de sub-negócios** (~130 itens, 4 a 6 por nicho): os caminhos concretos dentro de cada nicho — "Serviço digital" vira criação de sites, gestão de redes, tráfego pago, design, edição de vídeo, assessoria remota. Aparecem junto com a sugestão do nicho, e na tela de escolha da Jornada a pessoa pode fixar um deles (fica em `jornada_instances.sub_negocio_id`, e a Mary passa a saber que o negócio é "agência de tráfego pago", não só "serviço digital").

**RN-38 (nova): sub-negócio sugerido sai sempre do catálogo curado — a IA escolhe, ordena e explica, nunca inventa.** O nome devolvido pela IA é conferido contra a tabela antes de ir pra tela; o que não existir é descartado, e se a escolha falhar o produto mostra os primeiros da ordem curada. Mesma disciplina de RN-32 (roteiro de reaproximação). A justificativa também **não pode atribuir ao usuário uma afinidade que ele não declarou** — as áreas do nicho descrevem o nicho, não a pessoa.

**Deliberadamente fora desta versão:** investimento e margem por sub-negócio. A descrição do que cada negócio faz é conhecimento geral e não exige fonte; número de mercado exige, e as faixas com fonte real (Sebrae + data) são as do nicho-pai. Inventar "Fonte: Sebrae" para dado não consultado é exatamente o que a RN-20 previne.

Detalhamento técnico: SPEC.md SDD-66.

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

### 9.10 Fase "Clientes" — Captação de Clientes (desenhada em 30/07/2026, MVP)

Entra logo depois de Marketing — ordem atual: ... → Produto → Marketing → **Clientes** → Retenção → Escala. É o momento em que o empreendedor deixa de estruturar o negócio e passa a buscar receita de forma organizada.

**Escopo do MVP, cortado deliberadamente com o dono do produto:** a concepção original desta fase tinha 9 blocos (meta, canais recomendados, oferta comercial, materiais de prospecção por canal, lista de contatos com importação CSV e sugestão de perfil-alvo, plano diário de execução, follow-up automático, biblioteca de campanhas prontas, critérios de conclusão). Só **4 blocos** entram nesta rodada — os demais ficam fora do MVP, não esquecidos:

1. **Meta de captação** — o empreendedor informa quantos clientes quer conquistar, em quantos dias, e o ticket médio esperado. O sistema calcula o faturamento estimado e quantos contatos são necessários, assumindo uma taxa de conversão fixa de referência de 20% (mesmo espírito didático do Planejamento Financeiro, §9.5 — fórmula e cálculo sempre visíveis, nunca só o número final). Sem chamada de IA, cálculo local (ver SPEC.md SDD-45).
2. **Oferta comercial** — a IA gera, a partir do que a Jornada já sabe do negócio (nome, slogan, nicho, persona, proposta de valor — mesmo contexto reaproveitado por Marketing, §9.9), uma oferta estruturada em produto, benefício, diferencial, condição, prazo e chamada para ação. Regenerável quantas vezes o empreendedor quiser, mesmo padrão de Marketing (RN-26) — nunca inventa preço ou desconto que não esteja no contexto.
3. **Lista de contatos** — CRUD livre do empreendedor (nome, telefone, e-mail, empresa, status), mesmo espírito da lista pessoal de Fornecedores (§9.7): ele cadastra, edita e remove à vontade. O `status` de cada contato avança por um funil simples (`novo` → `contatado` → `respondeu` → `orcamento_enviado` → `cliente`) e é o que alimenta o critério de conclusão abaixo. Importação por CSV, sugestão de perfil-alvo sem dado real e canais recomendados por nicho ficam de fora do MVP — entram como incremento quando houver sinal de que a lista manual não é suficiente.
4. **Critérios de conclusão** — **diferente de toda fase anterior desde Financeiro (RN-24 — nada trava)**, o avanço para Retenção só libera quando todos os critérios reais abaixo forem verdadeiros, calculados sobre dado de verdade, nunca sobre um checklist de "criei uma conta":
   - Meta de captação definida;
   - Oferta comercial criada;
   - Pelo menos N contatos cadastrados, onde N é o número de "contatos necessários" calculado a partir da própria meta de captação do bloco 1 (nunca um número fixo desconectado do que o empreendedor pediu — uma meta de 1 cliente não pode exigir o mesmo tanto de contato que uma meta de 50);
   - Pelo menos N abordagens realizadas (status diferente de `novo`) — o mesmo N acima: "contatos necessários" já significa "contatos que você precisa abordar", então esse piso nunca pode passar do piso de contatos cadastrados;
   - Pelo menos K respostas recebidas (status `respondeu` ou além), onde K é a própria meta de clientes do bloco 1 — pra fechar K clientes, o mínimo matematicamente possível é K respostas;
   - Pelo menos K orçamentos enviados (status `orcamento_enviado` ou além) — mesmo K acima, mesmo raciocínio;
   - Primeiro cliente conquistado (pelo menos 1 contato com status `cliente`).

   Esse comportamento bloqueante é uma reintrodução deliberada do padrão de Formalização (RN-23/SDD-38) — a única outra fase que já bloqueia o avanço — e não do padrão "nada trava" (RN-24) usado por Estrutura/Fornecedores/Produto/Marketing: aqui o próprio objetivo da fase (captar cliente de verdade) só é atingido com ação real, então deixar avançar sem nenhuma abordagem feita mascararia isso.

**Fora do MVP, registrado para quando houver sinal de necessidade real:** canais recomendados por nicho (Instagram/WhatsApp/Google/parcerias, priorizados por custo e velocidade), geração de materiais de prospecção por canal (mensagem de WhatsApp, texto de Instagram, e-mail comercial, roteiro de ligação), plano diário de execução (checklist de 7/15/30 dias), follow-up automático por inatividade — este último é o mais custoso: exige infraestrutura de disparo agendado (cron/e-mail/push) que **nenhuma fase do produto construiu ainda** (mesmo adiamento já registrado em Estrutura, SDD-40) — e biblioteca de campanhas prontas curada pelo admin.

Detalhamento técnico (schema de `jornada_clientes_contatos`, Edge Function, cálculo de critérios de conclusão): ver SPEC.md SDD-45.

### 9.11 Fase "Primeira Venda" (desenhada em 31/07/2026)

Entra logo depois de Clientes, antes de Organização — ordem atual: ... → Marketing → Clientes → **Primeira Venda** → Organização (última fase do workflow, ver §9.13). É o grande marco simbólico: o momento em que o empreendedor deixa de "estar pronto pra vender" e passa a "ter vendido de verdade".

**O sistema nunca pode saber, por conta própria, que uma venda aconteceu** (mesmo princípio de honestidade do §4 — nunca fabricar um dado que não tem de verdade) — mas em vez de um botão genérico "já vendi" seguido de uma mensagem de parabéns solta, esta fase **reaproveita o que a Fase Clientes já capturou**, evitando pedir de novo algo que o empreendedor já informou:

1. **Recap dos clientes já conquistados** — a Fase Clientes só libera avanço com pelo menos 1 contato marcado com status `cliente` (critério de conclusão daquela fase, §9.10). Esta fase mostra esses contatos de volta, como ponto de partida — nunca pede pra cadastrar um cliente do zero.
2. **Registro da primeira venda** — o empreendedor escolhe qual desses contatos (ou nenhum, se preferir não vincular) foi a primeira venda de verdade, e opcionalmente informa o valor. Preencher o valor é incentivado, nunca obrigatório — baixa fricção (RN-1).
3. **Comparação com a meta, só quando o valor é informado** — se o empreendedor já tinha estimado um ticket médio na Fase Clientes, o sistema mostra a comparação ("você estimou R$ 250, vendeu R$ 300") — dado real contra dado real, nunca uma estimativa nova inventada.
4. **Celebração** — ao registrar, a tela mostra "🎉 Parabéns! Sua empresa realizou a primeira venda." e libera o avanço para Organização.

**RN-27 (nova): diferente do padrão "nada trava" (RN-24) das fases mais recentes, o avanço para Organização só libera depois de registrar a primeira venda** — mesmo espírito de Financeiro (SDD-39) e do critério de conclusão de Clientes (§9.10): o objetivo inteiro desta fase é esse único marco, então não faz sentido deixar passar batido. Pode editar/registrar de novo a qualquer momento depois (nada é travado permanentemente).

Detalhamento técnico (schema, reaproveitamento de dados entre fases): ver SPEC.md SDD-47.

### 9.12 Fase "Organização do Negócio" (desenhada em 31/07/2026)

Entra logo depois de Primeira Venda — ordem atual: ... → Clientes → Primeira Venda → **Organização**, a última fase do workflow (ver §9.13: a partir daqui a Jornada está concluída, 100%). Pergunta central: *"Agora que meu negócio começou a funcionar, como posso organizar minha rotina, meu dinheiro, meus documentos e minhas operações pra crescer sem perder o controle?"*

**Posicionamento deliberado: guia de organização, não ERP.** O sistema não controla vendas, estoque, contas a pagar/receber ou pedidos individuais de verdade — ensina como organizar cada um desses pontos, gera diagnóstico, modelos pra baixar e um plano de implantação, e recomenda categoria de ferramenta externa pra quem quiser ir além da planilha. Mesmo espírito de honestidade do §4: o sistema nunca finge controlar uma operação que só existe fora dele.

**MVP definido com o dono do produto (opção "os 14 itens da seção 21 do documento de concepção"):** todos os guias entram nesta rodada — a única redução real em relação ao documento de concepção original é de **granularidade de tela** (10 "etapas" do documento viram blocos de conteúdo dentro de uma única fase, não 10 etapas separadas no motor) e de **dado armazenado** (nenhuma tabela de operação real — só diagnóstico, escolhas e plano).

**Os 10 blocos da tela, nesta ordem:**

1. **Diagnóstico de organização** — ~15 perguntas sim/não sobre a rotina atual (separa dinheiro pessoal? registra vendas? guarda notas fiscais?). Gera um **nível de maturidade calculado** (1 a 4, nunca por IA — mesmo princípio do Fit Score, §5.3): Nível 1 "Organização inicial" até Nível 4 "Organização preparada para crescer", com pontos fortes, riscos e até 3 prioridades.
2. **Separação entre pessoa física e empresa** — conteúdo curado sobre por que não misturar dinheiro pessoal e da empresa (a orientação mais importante da fase) + plano de 5 passos.
3. **Organização financeira** — guia de entradas/saídas e contas a pagar/receber, com **link conceitual de volta pra Fase Financeiro** (não recalcula o que já foi calculado lá) + modelos de fluxo de caixa, contas a pagar e contas a receber pra baixar.
4. **Organização de documentos** — estrutura de pastas recomendada + boas práticas (nomes padronizados, backup em nuvem). Sem cofre de arquivo real — é orientação, o armazenamento continua sendo do empreendedor.
5. **Organização de estoque/materiais** — conceitos (estoque mínimo, ponto de reposição, itens críticos) + modelo pra baixar.
6. **Organização de pedidos e serviços** — vocabulário de status sugerido + modelo pra baixar.
7. **Rotina administrativa** — checklist de referência por frequência (diária/semanal/mensal/anual), conteúdo curado.
8. **Ferramentas de gestão** — a IA sugere categorias de ferramenta (nunca marca específica, mesma honestidade do roteiro de Fornecedores, §9.7) adequadas ao nicho e ao nível de maturidade do diagnóstico.
9. **Indicadores básicos** — catálogo fixo (não gerado por IA) de ~18 indicadores em 4 grupos (financeiro/comercial/operacional/clientes); o empreendedor escolhe de 3 a 5, deliberadamente pouco pra não sobrecarregar.
10. **Plano de organização + checklist final** — plano de 30 dias (4 semanas, conteúdo fixo) personalizado só pelas prioridades reais do diagnóstico, exportável em PDF (Kit de Organização), e a confirmação final que libera o avanço.

**RN-28 (nova): igual ao padrão de Primeira Venda (RN-27), a conclusão da Jornada fica bloqueada até o diagnóstico e a confirmação final estarem feitos** — mas **não exige que nenhum controle esteja "funcionando perfeitamente"**: a barra de conclusão é propositalmente baixa (só responder o diagnóstico e confirmar que revisou o plano), porque o objetivo desta fase é o empreendedor compreender o processo e começar, não provar que já organizou tudo.

Detalhamento técnico (schema, edge function do roteiro de ferramentas, kit de modelos): ver SPEC.md SDD-48.

### 9.13 Conclusão da Jornada (decisão do dono do produto, 31/07/2026)

**A Jornada Empreendedora termina em Organização — 100%.** As fases `retencao`/`escala`, reservadas desde o desenho inicial do motor (§5.4), **saem do workflow guiado**: manter o empreendedor no produto depois de o negócio estar de pé é uma estratégia de retenção de assinatura, não uma continuação natural do checklist de abertura — por isso esse "e agora?" passa a ser tratado como **módulo independente** do catálogo já existente (§12.1), com liberação própria, igual Marketing/Financeiro/Hub B2B (§12).

**Ao confirmar o plano de Organização, o empreendedor vê uma tela de conclusão, no espírito de um diploma:**

1. **Celebração** — reconhece explicitamente o tanto que foi percorrido (não é só mais uma etapa concluída, é o workflow inteiro).
2. **Resumo da jornada** — todas as fases percorridas, da Descoberta (diagnóstico + escolha do nicho) até Organização.
3. **Certificado de conclusão**, para baixar.
4. **Espaço reservado para um vídeo da equipe** parabenizando o empreendedor — carregado futuramente pelo painel administrativo; até lá, a tela simplesmente não mostra essa seção (nunca um "em breve" fingindo que existe algo pra ver).
5. **Convite honesto pros próximos módulos** — nunca promete um módulo específico ou plano que ainda não foi decidido (RN-2, RN-29): só menciona o que já estiver de fato liberado pro usuário; sem isso, um texto genérico prepara a expectativa de que módulos futuros (retenção de clientes, crescimento, escala, outros a definir) podem exigir um plano diferente do atual — sem inventar preço ou nome de plano, já que planos pagos ainda não existem no produto (§17, pendente).

**RN-29 (nova): a Jornada Empreendedora é um workflow com fim — nenhum módulo de pós-abertura é fase do motor de etapas nem é anunciado como certo/pronto antes de existir de fato** (reforça RN-2). O empreendedor pode revisar qualquer fase já percorrida a qualquer momento, mesmo com a Jornada concluída.

Detalhamento técnico (schema do estado terminal, tela de conclusão, slot de vídeo): ver SPEC.md SDD-49.

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

Marketing, Financeiro, Hub B2B — ver Documento de Conceito §8. **Retenção e Escala se juntam a essa lista a partir de 31/07/2026** (§9.13): eram fases reservadas no motor da Jornada desde o desenho inicial, mas viraram módulos independentes daqui pra frente — mesma razão de existir de Marketing/Financeiro/Hub B2B (reter o empreendedor depois da abertura), mesma regra de "PRD próprio no momento da priorização". Mesma regra da seção 11: PRD próprio no momento da priorização.

### 12.1 Framework de módulos (exceção à RN-2, ver §3) — construído em 29/07/2026

O **Painel Admin** ganhou o mecanismo genérico que hospeda os módulos (e os de Fase 2) quando cada um for priorizado: um catálogo de módulos (nome, slug, descrição) e uma tabela de liberação por usuário (`modules`/`user_modules`), **independente de plano pago** — planos pagos ainda não existem no produto (PRD §17 trata gateway como decisão pendente), então por ora liberação é 1:1 por usuário. O menu do app (lado cliente) mostra só os módulos liberados pra aquele usuário; o lado admin mostra o catálogo inteiro + toggle de liberação por usuário, e continua podendo ligar/desligar qualquer módulo pra qualquer pessoa a qualquer momento. Detalhamento técnico em SPEC.md SDD-30.

**Liberação automática no cadastro (mudança de 07/08/2026, SPEC.md SDD-73):** até aqui a liberação de cada módulo pra cada conta nova era 100% manual — na prática, o dono do produto vinha ligando os módulos um a um pra praticamente todo usuário novo. Agora toda conta que completa o cadastro (pelo diagnóstico ou pelo fluxo "já tenho negócio") já nasce com **todos os módulos do catálogo habilitados**; o admin segue com controle total pra desligar/religar qualquer módulo de qualquer conta quando precisar — o que mudou foi só o ponto de partida.

**Primeiro módulo de conteúdo (29/07/2026):** a **Jornada Empreendedora** (ver §5.4, §9, SPEC.md SDD-31) começou a ser construída. É o módulo mais importante do produto: o workflow guiado da escolha do nicho até o negócio aberto e funcionando. Construído incrementalmente, uma etapa de cada vez — a primeira etapa (confirmação/escolha do nicho pós-login) está pronta; a "Fase: Validação da Ideia" é a próxima a ser desenhada.

### 12.2 Módulos anunciados na landing (decisão do dono do produto, 29/07/2026)

A home passou a apresentar o catálogo de módulos do produto, para que o visitante entenda que o Ser Dono é mais que um passo a passo. São quatro, e **o rótulo de status na tela é obrigatório** — anunciar módulo não construído como pronto contraria o princípio de honestidade do §4 e a RN-2:

| Módulo | Status hoje | Onde vive |
|---|---|---|
| **Jornada Empreendedora** | Disponível | §9, SPEC.md SDD-31 a SDD-36 |
| **Materiais sobre empreendedorismo** | Disponível | Base de 30 artigos curados com fonte/data + assistente sobre ela (SPEC.md SDD-21) |
| **Tutoriais** | Em breve | Passo a passo prático das tarefas operacionais que travam o empreendedor (emitir nota, abrir conta PJ, usar cada ferramenta) — sem PRD próprio ainda |
| **Calculadora de Precificação** | ~~Em breve~~ → **é etapa da Jornada, não módulo** (decidido em 02/08/2026) | A dúvida registrada aqui ("módulo separado ou etapa?") foi resolvida pelos fatos: a calculadora **já existe e está em produção** dentro da fase Produto (§9.9, `packages/core/precificacao.ts`, SDD-42). Manter o rótulo "Em breve" na landing anunciava como futuro algo já entregue — corrigido no mesmo turno. Não haverá módulo separado: seria a mesma conta em dois lugares |

**Regra:** enquanto um módulo estiver "em breve", ele aparece na landing com o rótulo visível e **sem link** para uma tela que não existe. Nenhum módulo sai de "em breve" na landing antes de estar utilizável em produção.

**Atualização de 02/08/2026 (decisão do dono do produto — a landing não exibe mais nenhum "em breve"):** o pedido foi apresentar o produto como o sistema completo que ele de fato virou. Como isso foi executado, e por que não conflita com a regra acima:

- **A lista de fases estava desatualizada para MENOS, e esse era o problema real.** A home mostrava 9 fases com 6 rotuladas "EM BREVE" — mas Formalização, Financeiro, Marketing e Clientes já estavam em produção; Estrutura, Fornecedores, Produto, Primeira Venda e Organização nem apareciam; e Retenção/Escala continuavam listadas como fases depois de terem virado módulos (§9.13). Hoje a home mostra **as 12 fases reais, todas disponíveis** — nenhuma promessa, só correção de informação defasada.
- **"Tutoriais" saiu da lista em vez de virar "disponível".** É o único item deste catálogo ainda não construído. Deixar de anunciar o que não existe é edição; anunciar como pronto seria falsidade — a regra acima continua valendo integralmente para qualquer módulo futuro.
- **Catálogo atual da home**, todos com código em produção: Jornada Empreendedora (§9), A Mary responde (SDD-21/SDD-50), Retenção de Clientes (§12.5), Calculadora de Precificação (dentro da fase Produto, §9.9), Biblioteca de Conteúdos (§12.3) e Painel do Empreendedor (§12.4).
- **Seção nova de mentoria em investimentos** (§12.6).

### 12.6 Mentoria em investimentos na landing (decisão do dono do produto, 02/08/2026)

O dono do produto pediu uma seção mostrando que o Ser Dono também ajuda o empreendedor com investimentos. **O que a seção afirma foi ajustado para descrever o que existe:** a Mary responde sobre finanças e investimentos a partir da base curada (SDD-21), citando fonte e data em toda afirmação (RN-20) — ela **ensina a decidir** (quanto manter de reserva, liquidez vs. rentabilidade, separar dinheiro do negócio do pessoal, o que cada sigla significa).

**RN-33 (nova): o produto não recomenda investimento, e nenhuma peça de venda pode sugerir que recomenda.** Indicar carteira, ativo ou alocação personalizada é atividade regulada (CVM, analista/consultor credenciado) — o Ser Dono não é isso e não se anuncia como isso. A seção traz, no próprio texto visível, a ressalva de que a Mary não indica onde pôr o dinheiro nem substitui profissional certificado (aplicação direta da RN-21 em material de aquisição, não só dentro do produto). Também não se anuncia dado de mercado "ao vivo" ou "atualizado a todo momento": não existe integração de cotação no produto.

**Construído em 03/08/2026 como módulo do catálogo** (`mentoria-investimentos`, SPEC.md SDD-56/SDD-57), com liberação/bloqueio por usuário pelo admin (§12.1) como qualquer outro. O que a tela entrega:

1. **Mercado hoje** — CDI, Selic, dólar, euro, Ibovespa, IFIX e Bitcoin, com **fonte e horário visíveis** (RN-20). Dados reais da HG Brasil Finance.
2. **Quanto o seu negócio precisa ter guardado** — reserva de emergência e capital de giro, calculados com os números que a pessoa preencheu na fase Financeiro (§9.5). Sem esse preenchimento, não mostra estimativa nenhuma (RN-30).
3. **Comparador de aplicações** — CDB (a % do CDI que o banco dela paga), Tesouro Selic e Poupança, com IR já descontado, num gráfico de uma linha por aplicação. A renda variável entra **apenas** como um cenário que o próprio empreendedor digita — inclusive negativo, porque enxergar o prejuízo possível é metade da decisão.
4. **Onde deixar cada parte do dinheiro** — três "bolsos" por prazo (o que pode precisar amanhã, o que não vai precisar por meses, o que dá pra deixar anos), com as características que importam em cada um.

**Limite honesto do plano atual da fonte:** não há cotação de ação individual nem histórico de série longa (ambos exigem plano superior na HG Brasil). O produto não finge ter: o histórico do gráfico é a série que o próprio sistema acumula desde que o módulo entrou no ar.

**Mockup da tela de carteira:** decisão explícita do dono do produto por uma ilustração realista, com números e ativos, pelo impacto visual. Três salvaguardas aplicadas: (a) os ativos são **categorias reais de investimento** (Tesouro Selic, CDB, LCI, Fundo DI), nunca fundos ou instituições nomeadas — usar marca de terceiro em peça de venda é problema à parte; (b) o card exibe **"Exemplo ilustrativo — valores e proporções fictícios"** de forma visível; (c) nenhum número do mockup é apresentado como leitura de mercado ou como carteira sugerida. Detalhamento técnico em SPEC.md SDD-55.

### 12.3 Biblioteca de Conteúdos (construída em 31/07/2026)

**Substituída por §12.7 "Dicas da Mary" em 03/08/2026 — ver SPEC.md SDD-59.** Esta seção existia com o mesmo espírito (cursos/vídeos/apostilas/dicas, acesso livre a todo autenticado), mas nunca ganhou tela do lado cliente e tinha zero conteúdo cadastrado em produção — substituída, não migrada, sem perda de dado real. Texto original preservado abaixo por histórico.

<details>
<summary>Texto original (histórico)</summary>

Área de **cursos, vídeos, apostilas e dicas** disponível a todo usuário autenticado (mesmo espírito de acesso livre da base de conhecimento do assistente, SPEC.md SDD-21 — sem gate de assinatura, é material de aquisição/confiança). Publicação é **manual pelo admin** (catálogo `biblioteca_conteudos` + `biblioteca_aulas` para cursos com múltiplas aulas); um conteúdo só aparece pro empreendedor depois de marcado "Publicado" — rascunho fica visível só no admin, mesmo princípio de honestidade das seções anteriores (nada anunciado antes de existir de fato).

**Deliberadamente separada de `knowledge_articles`:** aquela tabela alimenta o RAG do assistente (texto curado, fatiado e embeddado para busca por similaridade) — não é o mesmo modelo de dado que um vídeo ou PDF. Ver SPEC.md SDD-50.

</details>

### 12.4 Painel do Empreendedor (decisão do dono do produto, 31/07/2026)

### 12.4 Painel do Empreendedor (decisão do dono do produto, 31/07/2026)

**A partir de agora, o destino pós-login de quem tem a Jornada Empreendedora liberada deixa de ser a própria Jornada e passa a ser um Painel** (`/inicio`) — a "casa" do usuário no produto. Motivo: nem toda visita ao sistema é pra avançar uma etapa; a pessoa também quer ver o negócio dela, revisitar o que já fez, e descobrir o que mais o Ser Dono oferece (módulos, biblioteca, conversa com a Mary) sem precisar entrar dentro do fluxo guiado.

**O painel mostra:**
1. **Identidade do negócio** — nome da empresa, nicho, regime (MEI/formal), CNPJ (quando informado — pelo intake "já tenho negócio" ou concluído de verdade na Formalização), logo (gerado na fase Planejamento ou subido pela pessoa no intake, §8.3) e o percentual de progresso da Jornada — o **mesmo cálculo** usado dentro da Jornada (extraído para `packages/core/jornadaProgresso.ts` justamente para as duas telas nunca mostrarem números diferentes).
2. **KPIs reais** — valor da primeira venda, ponto de equilíbrio mensal e clientes conquistados vs. meta. **Nunca um número estimado**: cada KPI só aparece se o empreendedor já preencheu o dado de origem (calculadora do Financeiro, registro da venda, meta de captação); sem isso, o card convida a preencher, em vez de mostrar um valor de exemplo (princípio de honestidade do §4).
3. **Linha do tempo** — os marcos mais recentes, com a data real de conclusão de cada etapa (`jornada_etapas.concluido_em`) — não é uma narrativa fabricada, é o histórico real do motor de etapas.
4. **Onde você chegou** — resumo de conclusão por fase da Jornada, mesma fonte de dado da trilha lateral.
5. **Seus módulos** — outros módulos já liberados pra conta (catálogo do §12.1); sem nenhum além da Jornada, mensagem honesta de "em preparação" (RN-29), nunca promessa de módulo ou plano ainda não definido.
6. **Dicas da Mary** — prévia das categorias publicadas (§12.7).
7. **Conversar com a Mary** — atalho para o assistente (`/assistente`), que a partir desta mesma data passa a receber o **contexto do negócio da pessoa** quando ela tiver uma Jornada em andamento (nome da empresa, nicho, fase atual, público-alvo, diferenciais) — ver RN-11 e SPEC.md SDD-50. Sem esse contexto, a pergunta continua sendo respondida só pela base de conhecimento geral, comportamento inalterado.

**Decisão de forma deliberada:** o painel NÃO é um dashboard analítico denso (várias grades de gráfico) — o produto é orientador, não ERP (§9.12), e não há dado operacional real (vendas, estoque, contas) pra sustentar aquilo sem ficar vazio pra maioria dos usuários. O conceito escolhido investe em identidade do negócio + narrativa de evolução, que é honesto com o dado que o produto realmente tem.

### 12.5 Módulo: Retenção de Clientes (priorizado pelo dono do produto em 02/08/2026)

**Segundo módulo de conteúdo do catálogo**, depois da Jornada Empreendedora. Previsto desde §9.13/RN-29, quando Retenção deixou de ser fase do motor de etapas: a Jornada termina em Organização (100%) e o que vem depois é assinatura, não workflow.

**Por que este foi o escolhido:** era o único buraco já causando dano. Quem terminava a Jornada batia 100% e encontrava "novos módulos a caminho" — o produto acabava exatamente quando o empreendedor tinha mais motivo pra continuar. Some-se a isso que o módulo não começa vazio: a Fase Clientes (§9.10) e a Primeira Venda (§9.11) já coletaram quem comprou.

**Pergunta central:** *"Quem já comprou de mim e está prestes a me esquecer — e o que eu digo pra essa pessoa?"*

**O ciclo de recompra é do empreendedor, não nosso.** Na primeira abertura o módulo faz uma única pergunta: de quanto em quanto tempo um cliente costuma voltar. Salão (~30 dias) e consultoria (~180) não podem compartilhar o mesmo corte de "sumiu" — um alerta calibrado errado é pior que nenhum alerta, porque ensina o empreendedor a ignorar o aviso. Todas as faixas derivam desse número: até o ciclo, **em dia**; entre o ciclo e 1,5× dele, **esfriando**; acima disso, **sumido**. A faixa intermediária existe pra avisar enquanto ainda dá tempo.

**O módulo mostra:**
1. **Carteira de clientes** — importada dos contatos que fecharam na Jornada (a pedido, nunca automaticamente) ou cadastrada direto aqui, inclusive por quem nunca fez a Jornada.
2. **Situação de cada cliente**, ordenada por urgência: quem sumiu primeiro, mais abandonado no topo.
3. **Registro do que aconteceu** — compra (valor sempre opcional, RN-1) ou contato, com data real. É o que alimenta tudo o mais.
4. **Clientes que voltaram** — % de quem comprou mais de uma vez. Única métrica de resultado do módulo.
5. **Roteiro de reaproximação da Mary** — só para quem está esfriando ou sumido: uma mensagem pronta pra enviar, escrita com o contexto do negócio e o histórico real daquele cliente.

**RN-31 (nova): o módulo nunca afirma que um cliente sumiu sem data real que sustente isso.** Cliente sem nenhuma interação registrada aparece como **"sem histórico"**, nunca como "sumido" — o produto não sabe se a pessoa sumiu, sabe apenas que ninguém anotou nada. Pelo mesmo motivo, a taxa de retorno é nula (não "0%") enquanto ninguém tiver comprado: sem base, não existe percentual. Aplicação direta do princípio de honestidade do §4, na mesma linha da RN-30.

**RN-32 (nova): roteiro de reaproximação nunca inventa fato sobre o relacionamento.** Nada de desconto, preço, promoção, novidade ou opinião do cliente sobre a compra anterior que não esteja no histórico registrado — o empreendedor vai mandar esse texto pra uma pessoa real que sabe o que de fato aconteceu, e uma frase inventada destrói a confiança na hora. Histórico pobre gera mensagem mais simples, nunca mensagem preenchida com invenção. Estende a mesma disciplina já aplicada à oferta comercial (§9.10) e ao roteiro de fornecedores.

**Deliberadamente fora desta versão:** disparo automático de mensagem (o empreendedor copia e envia pelo canal dele — automação de envio é outro produto), segmentação por valor/curva ABC, campanhas em massa e integração com WhatsApp Business API. Detalhamento técnico em SPEC.md SDD-54.

### 12.7 Dicas da Mary (pedido do dono do produto em 03/08/2026)

**Área de estudo livre a todo usuário autenticado, sem gate de módulo/plano (RN-34) e fora do catálogo de módulos** — não é uma tela dentro do menu "Módulos", é uma entrada própria e sempre visível (no app instalado, um link fixo no menu lateral, ver §7.x/SPEC.md SDD-59; na web, um link no cabeçalho do Painel). Substitui a Biblioteca de Conteúdos (§12.3), que tinha a mesma proposta de valor mas nunca ganhou tela pro lado cliente.

**Organizada por categoria, nunca em formato de blog** (pedido explícito do dono do produto): cada categoria tem um **texto explicativo** dizendo do que ela trata, e dentro dela uma lista de materiais — sempre tratada como lista (uma categoria pode ter vários assuntos), nunca um único item assumido. Navegação em **duas telas** (categorias → assuntos da categoria escolhida, SPEC.md SDD-60), não tudo espremido numa página só. Um material pode combinar livremente:
- **PDF** — upload real feito pelo admin, disponível pra download.
- **Vídeo do YouTube** — toca **embutido** na própria tela, num player compacto (não do tamanho de um embed cru) — com opção de abrir o vídeo completo no YouTube numa aba/navegador in-app, sem sair do produto.
- **Link externo** — abre num navegador in-app, nunca fecha o produto.

Nenhum desses três é obrigatório nem exclusivo dos outros — diferente da Biblioteca antiga (que tinha um `tipo` único por conteúdo), um material de "Dicas da Mary" pode ter os três ao mesmo tempo.

**Publicação é manual pelo admin**, mesmo princípio de honestidade das seções anteriores: categoria e material só aparecem pro empreendedor depois de marcados "Publicado"; rascunho fica visível só no admin.

**RN-34 (nova): Dicas da Mary é liberado a todo usuário autenticado, sem gate de módulo/plano.** Ao contrário de Retenção (§12.5) e Investimentos (§12.6), não existe aqui nenhuma checagem de `user_modules` — é material de aquisição/confiança, mesmo espírito já aplicado à base de conhecimento do assistente (SDD-21) e à Biblioteca original.

Detalhamento técnico (schema, split de plataforma do player de vídeo, mudança de navegação) em SPEC.md SDD-59/SDD-60.

### 12.8 Meu Negócio em Dia (pedido do dono do produto em 03/08/2026)

**Quarto módulo do catálogo.** Pergunta central: *"o que eu tenho que pagar, declarar ou renovar este mês pra não perder o meu CNPJ?"* A lacuna era a mesma que motivou Retenção de Clientes (§12.5): a Jornada termina em Organização (100%, RN-29) e larga o empreendedor exatamente onde a obrigação recorrente começa. Diferente de Retenção, a lacuna aqui é o item "Tutoriais" que a landing (§12.2) anunciava desde 29/07/2026 sem nunca ter sido construído — este módulo entrega essa promessa, com o valor agregado de já vir contextualizado por regime.

**Pedido explícito do dono do produto nesta sessão: não cobrir só MEI.** O módulo atende três regimes — MEI, ME/EPP no Simples Nacional e Lucro Presumido/Real — porque a única granularidade que o produto já guardava (`jornada_instances.regime_formalizacao`, fase Formalização, §9.4) distingue apenas MEI de "empresa formal", insuficiente para as obrigações reais de cada regime.

**O módulo mostra, por regime (e se a empresa tem funcionários):**
1. **Próximos prazos**, ordenados por urgência (atrasado → vence em breve → no prazo → sem prazo fixo → concluído) — cada um com nome, frase explicativa (RN-1), data de vencimento real ou, quando a regra varia por estado/cidade (ICMS, ISS, alvará), a orientação de consultar o órgão responsável, nunca uma data inventada.
2. **Como fazer** — passo a passo prático de cada obrigação, com fonte e data de consulta visíveis (RN-20).
3. **Marcação manual de "resolvido neste período"** — o produto não sabe se o empreendedor pagou ou declarou; só sabe que uma data passou.
4. **Export do checklist em PDF**, mesmo mecanismo já usado na fase Formalização.

**RN-35 (nova): o produto nunca afirma que uma obrigação foi paga/declarada, nem que está "atrasada" como fato definitivo — só que a data de vencimento passou.** O status "concluído" só existe quando o próprio empreendedor marcar aquele período; sem marcação, a tela mostra que o prazo passou e convida a marcar quando resolver, nunca "não pago". Mesma disciplina de RN-30/RN-31.

**RN-36 (nova): o módulo não calcula valor de imposto devido nem dá orientação fiscal personalizada.** Informa prazo e procedimento oficial, com fonte e data, e sinaliza quando é caso de contador (irmã da RN-33, que faz o mesmo para investimentos). Itens de regra municipal/estadual nunca fingem uma regra única nacional — mesmo tratamento que RN-19 já dá a alvará na fase Formalização.

**Conteúdo curado por migration, não por CRUD de admin** — decisão deliberada: é conteúdo fiscal/legal que muda por lei, não por curadoria editorial; atualizar um prazo exige nova migration, com a mesma disciplina de citar fonte e data que valeu para semear o catálogo inicial. Mesmo raciocínio já aplicado ao conteúdo estático da fase Formalização (§9.4).

**Fora de escopo desta versão** (registrado para não virar dívida invisível): cálculo de valor de imposto devido, integração com sistemas da Receita Federal/eSocial/PGDAS, geração de guia de pagamento, lembrete por notificação push/e-mail (fica para quando o produto tiver esse canal).

Detalhamento técnico (schema, fontes reais consultadas, verificação) em SPEC.md SDD-61.

### 12.9 Plano de Ação Mensal (pedido do dono do produto em 08/08/2026)

**Quinto módulo do catálogo (framework em §12.1), liberado automaticamente pra toda conta nova (mesmo mecanismo dos demais módulos desde SPEC.md SDD-73).** Pergunta central: *"o que eu faço esta semana pra fazer meu negócio andar?"* — diferente dos demais módulos, que respondem uma pergunta pontual (retenção, investimento, obrigação fiscal), este dá ao empreendedor um plano de ação recorrente, mês a mês, gerado a partir do que ele mesmo já construiu na Jornada.

**O módulo, todo mês:**
1. **Gera, por IA, um plano do mês** — 1 objetivo central (ex.: "aumentar vendas") e 4 semanas com 2-3 ações práticas cada, a partir do contexto real do negócio (nicho, entregáveis da Fase 2, etapas concluídas de todas as fases) e, se existir, do plano do mês anterior — dando continuidade ao que ficou pendente em vez de repetir do zero.
2. **Um plano por mês civil.** A partir do dia 1º, o botão "Gerar plano do mês" libera de novo; depois de gerado, fica indisponível até o mês seguinte — sem meio-termo, sem "gerar de novo".
3. **Checklist marcável.** O empreendedor só marca/desmarca item concluído — o texto do item, uma vez gerado, é fixo (decisão do dono do produto: não é um editor de tarefas, é um compromisso do mês).
4. **Barra/anel de progresso** com "X de Y atividades concluídas".
5. **Export em PDF** do plano do mês, mesmo mecanismo já usado em Formalização/Meu Negócio em Dia.
6. **Histórico com todos os meses já gerados**, cada um com seu % de conclusão, e **comparação lado a lado de até 3 meses selecionados**.

**RN-39 (nova): o Plano de Ação Mensal só libera depois que a Jornada passar da Fase 2 (Validação da Ideia).** Antes disso não existe contexto de negócio real o bastante (nem persona, nem SWOT, nem etapa preenchida) pra um plano fazer sentido — gerar um plano genérico demais nesse ponto seria pior que não oferecer o módulo ainda.

**RN-40 (nova): itens do plano nunca são editáveis pelo usuário — só a conclusão.** Evita que o módulo vire um gerenciador de tarefas genérico; o valor do produto está no plano vir pronto, contextualizado, não em ser mais um app de to-do list.

**Fora de escopo desta versão:** edição/adição manual de item, lembrete por notificação quando o mês vira, geração de plano pra período diferente do mês corrente (semanal, trimestral), integração do progresso do plano de volta no cálculo de progresso da Jornada (são sistemas independentes).

Detalhamento técnico (schema, Edge Function, gate de elegibilidade, PDF, comparação) em SPEC.md SDD-86.

### 12.10 Parceiros e Fornecedores (pedido do dono do produto em 08/08/2026)

**Sexto módulo do catálogo, mesma liberação automática dos demais.** Não é dado novo — é a mesma base curada pelo admin (`fornecedores_parceiros`) que já existia desde a Fase 8 da Jornada (§9.7), agora também acessível como módulo próprio, sem depender de estar naquela fase específica nem de já ter um nicho escolhido.

**O módulo mostra a base inteira de parceiros ativos, com:**
1. **Filtro por categoria** (o tipo de negócio do próprio parceiro — ex.: "Gráfica", "Contabilidade" — não o nicho do empreendedor).
2. **Um bloco por parceiro**, com logo (quando cadastrado), nome, categoria, descrição e região.
3. **Contato e site como ação clicável**, não só texto — número de telefone abre o discador, e-mail abre o cliente de e-mail, site abre no navegador. Contato que não é nem telefone nem e-mail reconhecível continua visível, só não vira link (nunca fingir uma ação que não existe).

**Fora de escopo desta versão:** avaliação/comentário de usuário sobre o parceiro, busca por texto livre (só filtro por categoria), qualquer contato direto pelo produto que não seja abrir o app nativo de telefone/e-mail/navegador do próprio aparelho.

Detalhamento técnico em SPEC.md SDD-89.

### 12.11 Check-up Mensal do Negócio (pedido do dono do produto em 08/08/2026 — prioridade nº 1)

**Sétimo módulo do catálogo, e o primeiro logo depois da Jornada Empreendedora na ordem do menu** — pedido explícito do dono do produto de tratar este como prioridade máxima entre os módulos existentes. Pergunta central: *"como está a saúde do meu negócio este mês?"*

**Uma vez por mês, a Mary faz um questionário curto (menos de 5 minutos) em 4 seções:**
1. **Financeiro** — faixa de faturamento, tendência de vendas e despesas, se sobrou caixa, se teve despesa inesperada.
2. **Clientes** — clientes novos, clientes antigos que voltaram, reclamações, indicações.
3. **Marketing** — se fez divulgação, qual canal trouxe mais resultado, se fez promoção.
4. **Operação** — problema com fornecedor, atraso de entrega, falta de produto, processo demorado.

**A IA devolve, a partir SÓ dessas respostas:**
- **Status por categoria** (bom / atenção / precisa melhorar) com um comentário curto explicando o porquê.
- **Uma pontuação geral de 0 a 100.**
- **As 3 prioridades da Mary pro mês** — recomendações concretas e específicas às respostas dadas, nunca genéricas.

**RN-41 (nova): o Check-up Mensal libera com a Jornada apenas iniciada (nicho confirmado) — não exige nenhuma fase concluída.** Diferente do Plano de Ação Mensal (RN-39, que exige a Fase 2 concluída), aqui a pergunta é sobre o que aconteceu no negócio no mês, não sobre planejamento estratégico prévio — o bar de entrada é bem mais baixo.

**RN-42 (nova): o Check-up Mensal alimenta a geração do Plano de Ação Mensal do mesmo mês.** Pedido explícito do dono do produto de conectar os dois módulos — quando existe um check-up recente, a IA do Plano de Ação dá peso extra às categorias em pior situação (status "atenção"/"precisa melhorar") na hora de montar o objetivo e as ações do mês, em vez de se basear só no progresso estrutural da Jornada.

**RN-43 (nova): a análise de saúde do negócio é sempre uma leitura qualitativa das respostas do PRÓPRIO usuário, nunca um dado de mercado ou benchmark externo.** A IA nunca compara o negócio com "a média do setor" nem com nenhum dado que não esteja nas respostas — mesma disciplina de honestidade já aplicada em outros módulos (RN-1/RN-20/RN-30).

**Fora de escopo desta versão:** editor de admin pras perguntas (catálogo fixo em código, mesmo raciocínio de Meu Negócio em Dia — muda por decisão de produto, não por curadoria editorial recorrente), histórico com todos os check-ups já feitos e comparação entre meses (existe no Plano de Ação Mensal, SDD-86, mas não foi pedido aqui — fica pra quando for priorizado), resumo do check-up na tela Início, lembrete por notificação quando o mês vira.

Detalhamento técnico (schema, Edge Function, integração com o Plano de Ação) em SPEC.md SDD-90.

### 12.12 Avisos no celular — notificação push (pedido do dono do produto em 08/08/2026)

**Opt-in, nunca automático.** No app instalado (Android/iOS — não existe no navegador), a tela Perfil ganhou "Avisos no celular": o usuário ativa explicitamente, e só a partir daí o aparelho recebe notificação. Quem nunca ativa nunca recebe nada.

**Uma vez por dia, o produto analisa 3 situações e avisa quando alguma se aplica:**
1. **Jornada parada** — uma etapa que depende de ação do empreendedor (`tipo_conclusao = "usuario"`) está esperando há 7 dias ou mais sem ele ter feito nada. **Implementa a RN-14, que estava registrada no PRD desde o início do produto mas nunca tinha sido construída.**
2. **Check-up Mensal pendente** — a partir do dia 20 do mês, se o Check-up Mensal (§12.11) daquele mês ainda não foi feito.
3. **Obrigação vencendo** — no módulo Meu Negócio em Dia (§12.8), uma obrigação de vencimento mensal fixo (DAS-MEI, PGDAS, FGTS etc.) a até 3 dias do prazo e ainda sem marcação de resolvida.

**RN-44 (nova): cada aviso só é enviado 1 vez por ocorrência — nunca todo dia enquanto a condição continuar valendo.** Uma etapa parada há 20 dias gera exatamente 1 aviso (no dia 7), não um por dia até ser resolvida.

**RN-45 (nova): notificação push nunca é a única forma de acesso a uma informação — é sempre um lembrete de algo que já está visível dentro do produto.** Quem nunca ativa avisos continua com acesso total a tudo, só sem o lembrete proativo.

**Fora de escopo desta versão:** lembrete pros módulos Retenção de Clientes, Mentoria em Investimentos e Plano de Ação Mensal (cobertura pensada pros 3 casos mais concretos citados pelo dono do produto; os demais módulos podem ganhar lembrete próprio depois, seguindo o mesmo padrão), obrigação de vencimento variável/anual/trimestral na análise automática (só `mensal_dia_fixo` por enquanto), horário de envio configurável pelo usuário, notificação com ação embutida (abrir direto a tela relevante ao tocar).

Detalhamento técnico (schema, Edge Functions, agendamento) em SPEC.md SDD-91.

### 12.13 Raio-X Financeiro (pedido do dono do produto em 09/08/2026)

**Oitavo módulo do catálogo.** Um fechamento financeiro mensal simples pra quem está começando — nada de contabilidade completa, só os 3 números que todo empreendedor precisa saber sobre o próprio mês.

**Uma vez por mês, o empreendedor confirma 3 valores:**
1. **Quanto faturou** — digitado manualmente.
2. **Quanto gastou** — sugerido automaticamente a partir da soma das despesas do dia a dia que ele foi lançando ao longo do mês (tipo + descrição opcional + valor cada uma), mas o valor final que fica salvo é o que ele confirmar — pode ajustar antes de fechar. A tela sempre explica de onde veio a sugestão.
3. **Quanto retirou pra ele mesmo** — digitado manualmente, mostrado como informação separada (não entra na conta de resultado/margem — é o que ele tirou do que o negócio gerou, não um custo do negócio).

**O produto calcula, sem IA (regra determinística — RN-46):** resultado estimado (faturamento − despesas) e margem estimada (resultado / faturamento). E compara com o mês anterior, quando existir, num gráfico de barras simples.

**A Mary comenta o resultado com UMA frase**, escolhida por regra a partir dos números reais — nunca gerada livremente:
- Faturamento subiu de forma relevante → comenta o crescimento.
- Despesas subiram mais rápido que o faturamento → alerta pra investigar antes de afetar a margem.
- Faturamento caiu → comenta a queda.
- Sem mudança relevante → comenta estabilidade.
- Primeiro mês (sem histórico anterior) → mensagem neutra convidando a voltar no mês seguinte.

**RN-46 (nova): o comentário da Mary no Raio-X Financeiro é sempre regra determinística sobre os números que o próprio usuário confirmou, nunca texto gerado por IA.** Diferente do Check-up Mensal (RN-43) e do Plano de Ação, aqui a "inteligência" é só comparação aritmética — decisão do dono do produto pra manter resposta instantânea, sem custo de IA, e sem risco nenhum de a Mary inferir uma tendência que os números não sustentam.

**Despesas do dia a dia são editáveis a qualquer momento** (o usuário pode corrigir ou apagar um lançamento errado) — diferente do fechamento mensal em si, que é imutável depois de confirmado (mesmo princípio de "retrato do mês" já usado no Check-up Mensal e no Plano de Ação).

**Fora de escopo desta versão:** categorização de despesas em grupos fixos (é texto livre por enquanto), gráfico com mais de 6 meses de histórico, exportar/imprimir o fechamento, registro de receita diária (só despesa tem lançamento dia a dia — faturamento é só o total mensal digitado), integração com Check-up Mensal/Plano de Ação (pode entrar depois, seguindo o padrão da RN-42).

Detalhamento técnico (schema, lógica de cálculo) em SPEC.md SDD-94.

### 12.14 Nível de Maturidade & Ser Dono Score (pedido do dono do produto em 12/08/2026)

**Nono módulo do catálogo.** Gamificação da evolução pós-Jornada: um selo de 5 estágios e um score de 0 a 1000 que resume, num único número, como o negócio está indo em 5 frentes — sem pedir nenhuma pergunta nova ao empreendedor.

**Importante: este é um conceito GLOBAL, separado do diagnóstico de maturidade organizacional 1-4 já existente na Jornada (§9.12, "nível de maturidade calculado" da fase Organização do Negócio).** Aquele avalia só rotina e controles administrativos, dentro de uma etapa específica da Jornada. Este novo módulo é um retrato do negócio inteiro, pensado pra depois da Jornada — os dois convivem sem se sobrepor, e a nomenclatura ("nível") é parecida de propósito só porque o conceito de fundo (maturidade calculada, nunca decorativa) é o mesmo.

**Selo de nível — 5 estágios, do mais inicial ao mais avançado:**
1. 🌱 Iniciante
2. 🚀 Em operação
3. 📈 Em crescimento
4. 🏆 Estruturado
5. 💎 Preparado para escalar

**Ser Dono Score — 0 a 1000, calculado uma vez por mês civil, sem formulário próprio.** A Mary lê o que o empreendedor já preencheu em 4 módulos (Jornada, Check-up Mensal, Plano de Ação Mensal, Raio-X Financeiro) e julga uma nota de 0 a 100 pra cada uma de 5 categorias — Financeiro, Marketing, Clientes, Organização e Crescimento —, cada uma com um comentário curto explicando o porquê. **O score total (0-1000) e o nível (1 dos 5 estágios) nunca são decididos pela IA: são sempre a mesma conta determinística** a partir das 5 notas (a média das 5 categorias × 10) — mesmo princípio de honestidade auditável do Fit Score.

**Ao tocar numa categoria, a Mary explica o porquê da nota** (o comentário gerado, sempre sobre o dado real do próprio usuário — RN-43) **e oferece "Criar plano"**, que leva direto ao Plano de Ação Mensal já existente (§12.9) — a gamificação vira ação concreta, não fica só decorativa.

**Fora de escopo desta versão:** histórico/comparação entre meses (a tela mostra sempre o snapshot mais recente, sem tela de linha do tempo própria — pode entrar depois, seguindo o padrão de `plano-acao/historico`), categorias customizáveis pelo usuário, qualquer forma de comparação com outros usuários ou com médias de mercado.

**RN-47 (nova): o Nível de Maturidade libera com a Jornada apenas iniciada, sem exigir fase concluída** — mesma regra do Check-up Mensal (RN-41) e do Raio-X Financeiro: precisa existir negócio pra ter o que avaliar, mas não é preciso ter avançado muito na Jornada.

**RN-48 (nova): o snapshot mensal do Nível de Maturidade é imutável depois de calculado** — mesmo princípio de "retrato do mês" já usado no Check-up Mensal e no Plano de Ação: o snapshot representa o negócio NAQUELE mês, editar depois não faria sentido.

**RN-49 (nova): tocar numa categoria do Ser Dono Score nunca cria um Plano de Ação automaticamente** — sempre abre a explicação da Mary primeiro, com "Criar plano" como uma ação explícita do usuário, nunca disparada sozinha.

Detalhamento técnico (schema, Edge Function, fórmula de agregação) em SPEC.md SDD-102.

### 12.15 Assistente de Reunião — V1 (pedido do dono do produto em 12/08/2026)

**Décimo módulo do catálogo.** Empreendedores novos (e até quem já tem negócio aberto) chegam despreparados em reuniões com fornecedor, cliente/prospect, investidor etc. Este módulo gera, a partir de um formulário curto, um guia de preparação personalizado — usando o negócio real do usuário, não texto genérico.

**Formulário:** tipo de reunião (catálogo fixo: Fornecedor, Cliente ou prospect, Investidor, Parceiro de negócio, Banco/crédito, Outro — com campo de texto livre quando "Outro"), com quem é a reunião, o que o empreendedor quer conseguir com ela (objetivo, texto livre) e observações opcionais.

**Guia gerado pela Mary**, lendo o contexto real já coletado pelo produto (nicho, fase da Jornada, entregáveis estratégicos, Check-up Mensal mais recente, Plano de Ação mais recente, Raio-X Financeiro mais recente) — nunca dado de mercado ou concorrência inventado. O guia tem: um resumo de enquadramento, pauta sugerida, perguntas a fazer, dicas de comportamento (adaptadas ao tipo da reunião — fornecedor, investidor e cliente pedem posturas diferentes), erros a evitar e um checklist de preparação. Exportável em **PDF**.

**Histórico simples:** cada guia gerado fica salvo e pode ser reaberto/reexportado depois, sem precisar gerar de novo — mas é só consulta, sem edição.

**Importante — diferente de todo módulo mensal anterior (Check-up, Plano de Ação, Raio-X, Nível de Maturidade): não há limite de "1 por mês".** O empreendedor pode se preparar pra quantas reuniões precisar, a qualquer momento — cada geração é um registro novo no histórico, nunca um snapshot que se sobrescreve.

**Agenda (V2, fatia 1 — pedido do dono do produto em 12/08/2026):** a partir de um guia já gerado, o empreendedor pode agendar a reunião de verdade — data e hora, tipo de local (Presencial, com endereço, ou Online, com link da chamada) e um contato opcional. Uma vez agendada, a tela mostra a data formatada, o local e o contato, com opção de **reagendar** (mudar data/local/contato a qualquer momento) ou **cancelar o agendamento** (o guia continua salvo, só o agendamento some). A lista de reuniões já geradas mostra "Agendada para [data]" nos cards que têm agendamento.

**Fora de escopo desta versão (V2 futura, ainda não construída):** envio de e-mail de convite aos participantes com o logo do negócio, lembrete automático antes da reunião, e um campo pra registrar o resultado final da reunião (se teve sucesso, o que ficou combinado). Nada disso libera nesta versão.

**RN-50 (nova): o Assistente de Reunião libera com a Jornada apenas iniciada, sem exigir fase concluída** — mesma regra do Check-up Mensal (RN-41), Raio-X Financeiro e Nível de Maturidade (RN-47): precisa existir negócio pra ter reunião sobre o que preparar.

**RN-51 (nova): o guia gerado é imutável depois de criado** — se a reunião mudou de figura, o empreendedor gera um guia novo, nunca edita o antigo (mesmo princípio de "retrato" já usado nos outros módulos de IA).

**RN-52 (nova): o guia é sempre gerado a partir de dado real do negócio do próprio usuário, nunca de dado de mercado, concorrência ou benchmark externo** — mesmo espírito de RN-43.

**RN-53 (nova): não é possível agendar uma reunião no passado** — a data/hora do agendamento precisa ser sempre futura, validado tanto na tela quanto antes de gravar.

**RN-54 (nova): o agendamento (data/hora/local/contato) é mutável — reagendável e cancelável a qualquer momento —, diferente do guia gerado pela IA, que continua imutável por RN-51.** São dois ciclos de vida diferentes na mesma reunião: o guia é um retrato fechado, o agendamento é informação viva.

Detalhamento técnico (schema, Edge Function, colisão de nome com a rota `/assistente` existente, agenda) em SPEC.md SDD-103/SDD-104.

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
| RN-27 | Avanço para Organização só libera depois da primeira venda registrada (exceção ao "nada trava" da RN-24) — §9.11 |
| RN-28 | Conclusão da Jornada exige diagnóstico + confirmação final, mas nunca que os controles estejam "funcionando" — §9.12 |
| RN-29 | A Jornada é workflow com fim; módulo de pós-abertura não é fase do motor nem é anunciado antes de existir — §9.13 |
| RN-30 | Nenhum KPI do painel é estimado — só aparece com o dado real de origem preenchido — §12.4 |
| RN-31 | Retenção nunca afirma que um cliente sumiu sem data real; sem histórico é "sem histórico", e taxa sem base é nula — §12.5 |
| RN-32 | Roteiro de reaproximação nunca inventa desconto, promoção ou fato do relacionamento fora do histórico registrado — §12.5 |
| RN-33 | O produto não recomenda investimento; nenhuma peça de venda sugere que recomenda, nem promete dado de mercado ao vivo — §12.6 |
| RN-34 | Dicas da Mary é liberado a todo usuário autenticado, sem gate de módulo/plano — §12.7 |
| RN-35 | Meu Negócio em Dia nunca afirma pagamento/atraso como fato — só que a data passou; "concluído" exige marcação do usuário — §12.8 |
| RN-36 | Meu Negócio em Dia não calcula imposto devido nem dá orientação fiscal personalizada; regra municipal/estadual nunca é fingida como única — §12.8 |
| RN-37 | A IA amplia o sinal de perfil (texto livre → vocabulário fechado de áreas) e explica o resultado; nunca decide, ranqueia ou recalcula o Fit Score. O que ela inferiu é persistido e mostrado ao usuário — §7.2 |
| RN-38 | Sub-negócio sugerido sai sempre do catálogo curado — a IA escolhe, ordena e explica, nunca inventa; e não atribui ao usuário afinidade que ele não declarou — §8.5 |
| RN-39 | Plano de Ação Mensal só libera depois que a Jornada passar da Fase 2 (Validação da Ideia) — §12.9 |
| RN-40 | Itens do Plano de Ação Mensal nunca são editáveis pelo usuário, só a conclusão — §12.9 |
| RN-41 | Check-up Mensal libera com a Jornada apenas iniciada, sem exigir fase concluída — §12.11 |
| RN-42 | O Check-up Mensal alimenta a geração do Plano de Ação Mensal do mesmo mês — §12.11 |
| RN-43 | A análise de saúde do negócio é sempre leitura qualitativa das respostas do próprio usuário, nunca dado de mercado externo — §12.11 |
| RN-44 | Cada aviso push só é enviado 1 vez por ocorrência, nunca repetido todo dia enquanto a condição continuar valendo — §12.12 |
| RN-45 | Notificação push nunca é a única forma de acesso a uma informação — sempre lembrete de algo já visível no produto — §12.12 |
| RN-46 | O comentário da Mary no Raio-X Financeiro é sempre regra determinística sobre os números confirmados pelo usuário, nunca texto gerado por IA — §12.13 |
| RN-47 | Nível de Maturidade libera com a Jornada apenas iniciada, sem exigir fase concluída — §12.14 |
| RN-48 | O snapshot mensal do Nível de Maturidade é imutável depois de calculado — §12.14 |
| RN-49 | Tocar numa categoria do Ser Dono Score nunca cria um Plano de Ação automaticamente — sempre exige a ação explícita "Criar plano" — §12.14 |
| RN-50 | Assistente de Reunião libera com a Jornada apenas iniciada, sem exigir fase concluída — §12.15 |
| RN-51 | O guia do Assistente de Reunião é imutável depois de gerado — §12.15 |
| RN-52 | O guia do Assistente de Reunião é sempre gerado a partir de dado real do negócio do usuário, nunca de mercado/concorrência/benchmark externo — §12.15 |
| RN-53 | Não é possível agendar uma reunião no Assistente de Reunião no passado — §12.15 |
| RN-54 | O agendamento do Assistente de Reunião é mutável (reagendável/cancelável), diferente do guia da IA, que continua imutável (RN-51) — §12.15 |

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
