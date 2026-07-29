# Ser Dono — SPEC (Especificação Técnica / SDD)

**Versão 0.1 · 27 de julho de 2026 · Documento vivo — este projeto é Spec-Driven Development (SDD): nenhuma implementação começa sem uma seção correspondente aqui**

> Este documento define **como** construir o que o `PRD.md` define **o quê** construir. Toda dúvida técnica durante a codificação deve primeiro ser resolvida aqui; se a SPEC não cobre o caso, atualize a SPEC antes de escrever código, não depois.

---

## 0. Papel deste documento no fluxo de trabalho

1. `PRD.md` — o quê construir e por quê (produto, regras de negócio, critérios de aceite).
2. `SPEC.md` (este arquivo) — como construir: stack, arquitetura, estrutura de pastas, convenções, pipelines.
3. Código — implementa exatamente o que PRD + SPEC descrevem. Divergência do código em relação à SPEC é bug de processo, não "detalhe de implementação".

**Regra SDD-0:** qualquer decisão técnica tomada durante a codificação que não esteja prevista aqui deve ser adicionada a este arquivo no mesmo PR que a implementa.

---

## 1. Stack Definida

| Camada | Escolha | Versão-alvo |
|---|---|---|
| Framework de UI | React + React Native, código único | — |
| Toolchain mobile/web | Expo | **SDK 54** (fixado — ver §1.1) |
| React Native | via Expo SDK 54 | 0.81 |
| Web | Expo exportado para web (`react-native-web`), **sem Next.js** | — |
| Roteamento | Expo Router (file-based, funciona em native e web) | |
| Backend/dados | Supabase (Postgres, Auth, Storage, Edge Functions, RLS) | |
| Hospedagem web | Vercel (build estático/SSR do export do Expo) | |
| IA | API Anthropic (Claude) — Haiku (econômico) e Sonnet (avançado), conforme PRD §5.5 | |
| CI/CD mobile | GitHub Actions — `expo prebuild` + Gradle, **sem EAS Build** | |
| Linguagem | TypeScript em 100% do código de aplicação | |
| Gerenciador de pacotes | pnpm (workspaces) | |

### 1.1 Por que Expo SDK 54, fixado, e não a versão mais nova

SDK 54 traz React Native 0.81 e é a **última versão que ainda permite Legacy Architecture** (`newArchEnabled: false`). A partir do React Native 0.82 (usado a partir do SDK 55) não é mais possível desativar a New Architecture. Fixamos em 54 deliberadamente para ter uma janela estável de desenvolvimento no MVP sem a obrigatoriedade de migrar para a New Architecture no meio do caminho — a migração é tratada como item de roadmap técnico (§10), não como bloqueio do MVP.

**SDD-1:** Não atualizar o SDK do Expo durante a Fase 1 (MVP) sem passar por uma seção nova aqui documentando o motivo e o plano de migração de New Architecture, caso a versão-alvo exija.

---

## 2. Por que um código único para Web e Mobile (e o que isso custa)

**Decisão:** Expo puro (React Native + `react-native-web`) para as três plataformas, em vez de Next.js separado para web + Expo para mobile.

**Ganho:** uma tela, um componente, uma correção — vale para iOS, Android e Web ao mesmo tempo. É a exigência explícita do projeto ("um único código que possa ser usado para os dois tipos de sistema").

**Custo assumido conscientemente:** o Expo Router web não tem a mesma maturidade de SEO/SSR que o Next.js. Para o MVP isso é aceitável porque a jornada principal (diagnóstico → workflow) é majoritariamente pós-login, sem necessidade de indexação profunda no Google. Se o marketing (Documento de Conceito §12, canal orgânico) precisar de páginas públicas fortemente otimizadas para SEO (landing pages, blog), essas páginas **podem** viver fora do monorepo, em um site estático simples — decisão isolada, que não contamina o app.

**SDD-2:** Páginas 100% públicas e voltadas a SEO (landing, blog, páginas institucionais) são candidatas a ficar fora do app Expo. Qualquer tela que exija autenticação ou dado do usuário fica dentro do monorepo único.

---

## 3. Estrutura do Monorepo

```
serdono/
├── CLAUDE.md
├── docs/
│   ├── PRD.md
│   ├── SPEC.md                      (este arquivo)
│   └── identidade-visual/
│       └── DESIGN_SYSTEM.md         # cores, tipografia, tokens e spec de componentes
├── apps/
│   └── app/                         # o único app Expo — roda em iOS, Android e Web
│       ├── app.json                 # versão/build number — ver §7
│       ├── app/                     # Expo Router — rotas file-based
│       │   ├── (auth)/              # telas de cadastro/login
│       │   ├── (onboarding)/        # diagnóstico — PRD §7
│       │   ├── (workflow)/          # trilhas A-F — PRD §9
│       │   └── (paywall)/           # planos e checkout — PRD §8
│       ├── android/                 # gerado por `expo prebuild`, não versionado (ver §7.2)
│       └── ios/                     # idem
├── packages/
│   ├── ui/                          # componentes compartilhados + tokens visuais (ver docs/identidade-visual/DESIGN_SYSTEM.md §8)
│   ├── core/                        # regras de negócio puras: cálculo de Fit Score, validações (PRD §5, §13)
│   ├── supabase/                    # client Supabase, tipos gerados, hooks de dados
│   └── config/                      # tsconfig, eslint, tailwind/nativewind compartilhados
├── supabase/
│   ├── migrations/                  # SQL versionado — fonte de verdade do schema (PRD §5)
│   └── functions/                   # Edge Functions (ex.: webhook de pagamento, roteamento de IA)
├── .github/
│   └── workflows/
│       ├── android-release.yml      # §7
│       ├── web-deploy.yml           # Vercel (pode ser só integração nativa, ver §6)
│       └── ci.yml                   # lint, typecheck, testes em todo PR
├── pnpm-workspace.yaml
└── package.json
```

**SDD-3:** Nenhuma lógica de negócio (cálculo, validação, regra de RN-x do PRD) vive dentro de `apps/app` — sempre em `packages/core`, para poder ser testada isoladamente e para impedir duplicação futura caso um segundo app apareça (ex.: painel admin separado).

---

## 4. Modelo de Dados → Supabase

O modelo lógico está no `PRD.md` §5. Aqui ficam as convenções de implementação.

### 4.1 Migrations
- Toda alteração de schema é um arquivo SQL em `supabase/migrations/`, nunca uma alteração manual no painel do Supabase em produção.
- Nome do arquivo: `YYYYMMDDHHMM_descricao_curta.sql`.
- Cada tabela criada já nasce com RLS habilitada (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`) no mesmo arquivo de migration que a cria — nunca em migration separada posterior (janela de exposição zero).

### 4.2 Padrão de políticas RLS

**SDD-4 (política padrão de dado pessoal):** para toda tabela listada no PRD §5 com `user_id`, aplicar o padrão:

```sql
-- leitura e escrita restritas ao dono da linha
create policy "select_own" on public.<tabela>
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.<tabela>
  for insert with check (auth.uid() = user_id);

create policy "update_own" on public.<tabela>
  for update using (auth.uid() = user_id);
```

**SDD-5 (dado de configuração/catálogo):** `niches` e `step_templates` (PRD §5.3, §5.4) são somente-leitura para qualquer usuário autenticado e somente-escrita por um papel `admin` (via claim customizada no JWT, não por tabela de usuários — ver §4.3):

```sql
create policy "niches_read_all" on public.niches
  for select using (auth.role() = 'authenticated');

create policy "niches_write_admin" on public.niches
  for all using (auth.jwt() ->> 'user_role' = 'admin');
```

**SDD-6 (conteúdo bloqueado por assinatura):** o Fit Score e a prévia (PRD RN-7) são de leitura livre; o `playbook_md` completo de um nicho só é lido se existir uma linha em `subscriptions` ativa com aquele nicho destravado. Isso **não** é feito filtrando no client — a política de RLS em `niches` (ou em uma view derivada `niches_dossie`) precisa verificar a assinatura via subquery:

```sql
create policy "dossie_completo_apenas_assinantes" on public.niches_dossie
  for select using (
    exists (
      select 1 from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status = 'ativa'
        and niches_dossie.niche_id = any(s.nichos_destravados_ids)
    )
  );
```

Isso implementa diretamente o **CA-4** do PRD ("usuário sem assinatura não consegue, por nenhuma rota de URL direta, ler o conteúdo completo").

### 4.3 Papéis e claims
- Papel `admin` (curadoria de nichos) é setado via **custom claim** no JWT (Supabase Auth Hook), não por uma coluna `is_admin` em `users` — evita que RLS mal escrita em `users` vaze a informação de quem é admin.
- **SDD-7:** toda nova tabela criada é revisada com a pergunta "quem pode ler, quem pode escrever" antes do merge — isso é item obrigatório de checklist de PR (ver §9).

### 4.4 Tipos TypeScript
- Gerar tipos automaticamente do schema com `supabase gen types typescript` e publicar em `packages/supabase/types.ts` a cada migration aplicada — nunca escrever tipos de tabela manualmente.

---

## 5. Camada de IA (Copiloto)

Implementação do PRD §5.5, §10.

- Todas as chamadas à API Anthropic passam por uma **Edge Function do Supabase** (`supabase/functions/ai-copilot`), nunca diretamente do client — protege a chave de API e centraliza o log de `tokens_entrada`/`tokens_saida`/`modelo_usado` exigido em RNF-1.
- Roteamento de modelo (RN-10) é uma função pura em `packages/core/ai/routeModel.ts`, testável sem rede.
- Cache de prompt (RN-12): usar o recurso de prompt caching nativo da API Anthropic no prefixo fixo (instruções de sistema + playbook do nicho), montado a partir de `business_memory` (RN-11).
- Guardrails (PRD §10.2): validação de citação de fonte (RF-3) é um teste automatizado que roda contra uma amostra de respostas antes de qualquer deploy que toque o prompt de sistema — não é apenas revisão manual.

---

## 6. Web em Produção (Vercel)

- O app Expo é exportado para web com `expo export --platform web`, gerando um bundle estático (ou com API routes via Expo Router se necessário).
- Deploy no Vercel via integração direta com o repositório (build command = export do Expo), sem necessidade de workflow próprio no GitHub Actions **a menos que** surjam passos customizados de pré-build (ex.: gerar tipos do Supabase antes do build) — nesse caso, mover para `.github/workflows/web-deploy.yml` chamando o Vercel via CLI/token.
- **SDD-8:** variáveis de ambiente (chave pública do Supabase, URL do projeto) ficam nas Environment Variables do Vercel para produção e em `.env.local` (git-ignored) para desenvolvimento — nunca hardcoded.
- **SDD-15:** o projeto Vercel foi criado com Framework Preset "Next.js" (herdado do scaffold inicial, mesma origem do problema descrito na SDD-14), o que quebra o build pois este projeto não usa Next.js. Corrigido com `vercel.json` na raiz do monorepo, fixando `framework: null`, `buildCommand: "pnpm --filter @serdono/app run build:web"` (script que roda `expo export --platform web`) e `outputDirectory: "apps/app/dist"`. **Ação pendente no dashboard:** confirmar em Project Settings → General que o Framework Preset mudou para "Other" após o próximo deploy; se o Vercel continuar assumindo Next.js, trocar manualmente o preset.

---

## 7. Build Mobile Automatizado (GitHub Actions, sem EAS)

Requisito do projeto: **toda vez que a versão em `app.json` for atualizada, gerar automaticamente o `.aab` do Android, sem depender do EAS Build.**

### 7.1 Gatilho
Workflow dispara em `push` na branch principal com alteração no arquivo `apps/app/app.json`, e adicionalmente compara `expo.version` / `expo.android.versionCode` com o valor do commit anterior para evitar rebuilds em alterações do `app.json` que não mudem versão.

### 7.2 Por que gerar a pasta `android/` no CI, e não versionar
`expo prebuild` gera a pasta `android/` (projeto nativo puro) a partir de `app.json` e dos plugins de config. Essa pasta **não é versionada no git** — é regenerada a cada build, garantindo que `app.json` continue sendo a única fonte de verdade de configuração nativa (evita divergência entre config declarada e projeto nativo commitado).

### 7.3 Pipeline (`.github/workflows/android-release.yml`)

```yaml
name: Android Release (AAB)

on:
  push:
    branches: [main]
    paths:
      - "apps/app/app.json"

jobs:
  build-aab:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/app
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: "pnpm" }

      - uses: actions/setup-java@v4
        with: { distribution: "temurin", java-version: "17" }

      - name: Instalar dependências
        run: pnpm install --frozen-lockfile

      - name: Gerar projeto nativo Android (expo prebuild)
        run: npx expo prebuild --platform android --clean

      - name: Restaurar keystore de assinatura
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > android/app/release.keystore

      - name: Configurar credenciais de assinatura
        run: |
          cat >> android/gradle.properties <<EOF
          RELEASE_STORE_FILE=release.keystore
          RELEASE_STORE_PASSWORD=${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          RELEASE_KEY_ALIAS=${{ secrets.ANDROID_KEY_ALIAS }}
          RELEASE_KEY_PASSWORD=${{ secrets.ANDROID_KEY_PASSWORD }}
          EOF

      - name: Build do AAB
        run: cd android && ./gradlew bundleRelease

      - name: Publicar artefato
        uses: actions/upload-artifact@v4
        with:
          name: app-release.aab
          path: apps/app/android/app/build/outputs/bundle/release/app-release.aab
```

**Pré-requisitos deste pipeline (decisões pendentes — ver PRD §17):**
- `android/app/build.gradle` precisa referenciar `RELEASE_STORE_FILE` / `RELEASE_KEY_ALIAS` / `RELEASE_KEY_PASSWORD` no bloco `signingConfigs.release` — configurado uma vez, versionado (o gradle não é regenerado do zero de forma a perder customização: usar um **config plugin do Expo**, `withAndroidSigningConfig`, para que `expo prebuild` sempre recrie o bloco de assinatura corretamente a cada execução do CI).
- **`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`** precisam existir como GitHub Secrets antes do primeiro run. **SDD-9:** o keystore de produção, uma vez gerado, nunca é regenerado — perdê-lo impede atualizar o app publicado na Play Store. Guardar backup fora do GitHub também (ex.: cofre do 1Password/Bitwarden da empresa).
- `versionCode` do Android precisa incrementar a cada build enviado à Play Store — **SDD-10:** usar `expo.android.versionCode` em `app.json` como campo controlado manualmente (não autoincrement do CI), para manter `app.json` como única fonte de verdade de versão, conforme o requisito original.

### 7.4 Publicação na Play Store
Este pipeline gera o artefato `.aab` (`upload-artifact`). O upload para a Play Console pode ser manual no MVP ou automatizado depois com a action `r0adkll/upload-google-play`, usando uma service account do Google Play Console — tratado como item de roadmap técnico (§10), não bloqueio do MVP.

### 7.5 iOS
Fora do escopo deste pipeline (Android apenas, por pedido explícito). Build de iOS exige macOS runner e assinatura via conta Apple Developer — a ser especificado em seção própria quando for priorizado.

---

## 8. Ambientes

| Ambiente | Supabase | Vercel | Mobile |
|---|---|---|---|
| Desenvolvimento local | projeto Supabase local (`supabase start`, Docker) | `expo start --web` | `expo start` + Expo Go ou dev client |
| Staging | projeto Supabase de staging | branch preview do Vercel | build interno via Actions (manual dispatch) |
| Produção | projeto Supabase de produção | branch `main` | pipeline §7, disparado por `app.json` |

**SDD-11:** migrations de banco (§4.1) são aplicadas primeiro em staging, validadas, e só then aplicadas em produção — nunca direto em produção a partir da máquina local.

---

## 9. Qualidade e CI (`ci.yml`)

Executa em todo Pull Request:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck` (TypeScript em todos os packages)
3. `pnpm lint`
4. `pnpm test` (testes unitários de `packages/core` — regras de negócio do PRD, especialmente cálculo de Fit Score e roteamento de IA)
5. Checklist de PR obrigatório (texto no template do PR): *"Esta mudança altera uma tabela? Se sim, RLS foi revisada (SDD-7)? Se altera `app.json`, a versão foi incrementada corretamente (SDD-10)?"*

---

## 10. Itens de Roadmap Técnico (fora do MVP, não bloqueiam)

- Migração para New Architecture do React Native, antes ou junto da atualização para SDK 55+ (ver §1.1).
- Automatizar publicação do `.aab` direto na Play Console via `upload-google-play` action.
- Pipeline de build iOS (`.ipa`) via runner macOS.
- Avaliar Solito ou abordagem equivalente **apenas se** for necessário separar uma landing page pública (SDD-2) sem duplicar lógica de autenticação/dados.

---

## 11. Decisões que ainda precisam de dono (bloqueiam itens específicos, não o início geral do código)

1. Geração e custódia do keystore Android de produção (SDD-9) — precisa existir antes do primeiro run do workflow §7.
2. ~~Confirmar se o roteamento de rotas públicas fica no Expo Router ou em site estático separado~~ — **resolvido:** dentro do Expo Router, ver SDD-13.
3. Gateway de pagamento definitivo (já listado no PRD §17) — define o formato do webhook que a Edge Function de assinatura precisa expor.
4. ~~Habilitar "Anonymous sign-ins" no projeto Supabase~~ — **resolvido** em 28/07/2026 (ver SDD-18).
5. ~~Deploy da Edge Function `diagnostic-match`~~ — **resolvido** (ver SDD-19/SDD-20).
6. Deploy da Edge Function `knowledge-search` (RAG) com o secret `OPENAI_API_KEY` — ver SDD-21.
7. Habilitar o provider **Google** em Authentication → Providers (Client ID/Secret do Google Cloud Console) — sem isso, `signInWithOAuth({ provider: "google" })` (SDD-22) falha com erro tratado na tela de login, não crash, mas o botão não funciona de fato até essa configuração.
8. Habilitar o Auth Hook **"Custom Access Token"** em Authentication → Hooks, apontando para `public.custom_access_token_hook` (criado em `supabase/migrations/202607281600_user_roles_admin_claim.sql`) — sem isso, o claim `user_role` nunca chega ao JWT e todo usuário autenticado cai em `/assistente` (fallback seguro por padrão, mas o papel `admin` fica inacessível até habilitar).
9. Promover o primeiro usuário admin — sem UI para isso nesta fase; feito via SQL direto (`update public.users set role = 'admin' where email = '...';`), já que o client não tem permissão de escrever a coluna `role` (SDD-22).

---

## 12. Decisões registradas durante a implementação da Home/Landing (retroativas a este PR)

**SDD-13 (resolve o item 2 da seção 11):** a Home pública nasce **dentro do monorepo Expo**, como rota `apps/app/app/index.tsx` do Expo Router, e não como site estático separado fora do monorepo. Decisão do dono do produto: preferir base única desde o início a uma migração posterior de um site estático para dentro do Expo Router (SDD-2 permanece válida como *opção* para o futuro, caso SEO se torne bloqueante — não foi descartada, só não foi a escolha inicial).

**SDD-14 (nomenclatura de env vars do Supabase — parcialmente superada por SDD-14b):** o `.env` da raiz tinha `EXPO_PUBLIC_SUPABASE_ANON_KEY` (convenção Expo) mas a URL do projeto só existia como `NEXT_PUBLIC_SUPABASE_URL` (convenção Next.js, herdada de outro scaffold — este projeto **não usa Next.js**, SPEC §1). Corrigido adicionando `EXPO_PUBLIC_SUPABASE_URL` ao `.env` raiz.

**SDD-14b (mecanismo de env var público — substitui a abordagem original da SDD-14):** o inlining automático `process.env.EXPO_PUBLIC_*` do Expo (via módulo virtual `expo/virtual/env`, injetado pelo babel-preset-expo) se mostrou **instável no modo dev web do SDK 54** — o módulo virtual serve `export const env = process.env` sem substituição real, e `process.env` no browser não carrega nada além de um objeto vazio, resultando em `supabaseUrl is required` mesmo com o `.env` correto. **Solução adotada:** `apps/app/app.json` virou `apps/app/app.config.js` (config dinâmica), que carrega o `.env` da raiz via `dotenv` e expõe `extra.supabaseUrl` / `extra.supabaseAnonKey`; `packages/supabase/client.ts` lê esses valores via `expo-constants` (`Constants.expoConfig.extra`), não mais via `process.env`. Esse é o mecanismo estabelecido e confiável do Expo para config pública, nativo e web — qualquer nova env var pública do app deve seguir o mesmo caminho (adicionar em `app.config.js` → `extra`, ler via `expo-constants`), não `process.env.EXPO_PUBLIC_*` direto.

**SDD-18 (Supabase Anonymous Sign-ins):** o diagnóstico roda antes do cadastro via sessão anônima do Supabase Auth (`packages/supabase/session.ts`, ver §4/SPEC anterior) — isso exige a opção **"Enable anonymous sign-ins"** ligada em Authentication → Settings do projeto Supabase. Vem **desligada por padrão** em projetos novos. Sem isso, `ensureSession()` falha com `Anonymous sign-ins are disabled` e nenhuma tela do diagnóstico consegue ler/escrever no banco (toda RLS depende de `auth.uid()`). **Resolvido** em 28/07/2026 — opção habilitada pelo dono do projeto.

**SDD-19 (acesso ao projeto Supabase real):** o MCP do Supabase neste ambiente nunca listou o projeto `klvmbytlqnvydjsauigy` (só dois projetos de outras organizações). As 4 tabelas de `202607281300_diagnostico_e_nichos.sql` e o seed de `202607281301_seed_nichos_mvp.sql` já existiam no banco quando isso foi verificado (confirmado 28/07/2026 via conexão Postgres direta, usando `SUPABASE_DB_PASS` do `.env` — RLS habilitada nas 4 tabelas, 5 nichos populados). A Edge Function `diagnostic-match` foi deployada manualmente pelo dono do projeto (`supabase functions deploy` + secrets configurados pelo painel) e testada com sucesso ponta a ponta. Sem acesso MCP ao projeto real, o caminho de conexão direta ao Postgres (host `db.<ref>.supabase.co:5432`, usuário `postgres`, `SUPABASE_DB_PASS`) segue sendo a alternativa viável para qualquer migration futura enquanto o MCP não for reconectado — foi o caminho usado também para aplicar a migration da base de conhecimento (SDD-21).

**SDD-20 (grants ausentes ao aplicar SQL fora do `supabase db push`):** as tabelas criadas manualmente (fora do fluxo padrão da CLI) vieram com RLS habilitada mas **sem os GRANTs de privilégio padrão** (`SELECT`/`INSERT`/`UPDATE`/`DELETE`) para `anon`, `authenticated` e até `service_role` — só `postgres` tinha acesso. RLS restringe linhas, mas não substitui o GRANT de tabela; as duas camadas são exigidas juntas, e `supabase db push` normalmente garante isso via `ALTER DEFAULT PRIVILEGES` na configuração-base do projeto. Corrigido em `202607281400_grants_padrao_supabase.sql`, que também seta `ALTER DEFAULT PRIVILEGES` para toda tabela nova em `public` nascer com os grants corretos — **qualquer schema aplicado manualmente (fora da CLI) no futuro precisa repetir essa checagem.**

**SDD-21 (Base de conhecimento para RAG — nova camada de IA, complementar ao PRD §5.5/§10):** além do copiloto do workflow (Anthropic Claude, PRD §5.5), o produto ganhou um serviço de perguntas e respostas de conhecimento geral (MEI/empreendedorismo, finanças pessoais, investimentos), **disponível a todo usuário autenticado (inclusive sessão anônima), sem gate de assinatura** — é serviço de aquisição/confiança, não de retenção paga.

- **Schema:** `supabase/migrations/202607281500_knowledge_base_rag.sql` — `knowledge_categories`, `knowledge_articles` (conteúdo curado, sempre parafraseado a partir da fonte oficial — nunca copiado verbatim, direito autoral — com `fonte`/`fonte_url`/`fonte_data` obrigatórios, RN-20) e `knowledge_chunks` (`embedding vector(1536)`, extensão `pgvector`). RLS no mesmo padrão SDD-5 (`niches`): leitura livre para qualquer autenticado, escrita só para `admin` via JWT claim.
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dimensões) — é o único uso da chave `OPENAI_API_KEY` no projeto até aqui. Guardar a chave só como secret de Edge Function/script server-side, nunca no client.
- **Busca por similaridade:** função SQL `match_knowledge_chunks` (cosine distance via `<=>`, índice `ivfflat`), chamável via `supabase.rpc(...)`.
- **Síntese da resposta:** Edge Function `supabase/functions/knowledge-search` — embeda a pergunta, busca os trechos mais próximos, e só então chama Claude Haiku (RN-10, caso econômico) pra escrever a resposta final citando a fonte de cada trecho usado. Se a similaridade dos melhores resultados for baixa (`MIN_SIMILARITY = 0.3`), a função responde honestamente que não tem essa informação, em vez de deixar o modelo alucinar — mesmo guardrail RF-3 do `diagnostic-match`.
- **Reuso:** `packages/supabase/knowledgeBase.ts` expõe `askKnowledgeBase(question, category?)` — qualquer tela/módulo futuro (workflow, um eventual chat livre do copiloto) chama a mesma function, sem duplicar lógica de busca (SDD-3).
- **Seed inicial:** 30 artigos (12 empreendedorismo, 10 finanças, 8 investimentos), parafraseados a partir do Portal Empresas e Negócios (gov.br) e do Caderno de Educação Financeira do Banco Central — base revisável e expansível, aplicada e com embeddings gerados direto no banco real via SDD-19 (conexão Postgres direta), testada com sucesso (consulta de exemplo retornou o artigo certo com 83% de similaridade).
- **Ação pendente no dashboard do Supabase:** `supabase functions deploy knowledge-search` + `supabase secrets set OPENAI_API_KEY=...` — só falta o deploy, o restante já está no banco.

**SDD-22 (Login, papéis de acesso e rotas protegidas):** primeira implementação de login e da divisão admin/usuário citada no PRD (autenticação/autorização não tinham seção própria até aqui).

- **Papel do usuário:** coluna `public.users.role` (`'user'` default / `'admin'`), mas **nunca lida diretamente como fonte de autorização** — a policy `update_own` já existente em `users` não restringe coluna, então a migration `202607281600_user_roles_admin_claim.sql` revoga `UPDATE` da coluna `role` de `authenticated`/`anon` (nenhum usuário pode se autopromover via PostgREST). A fonte de autorização de fato é o claim custom **`user_role` no JWT**, injetado pelo Auth Hook `public.custom_access_token_hook` no momento em que o token é emitido — exatamente o mecanismo já previsto em SDD-5/§4.3, agora implementado. Sem o Hook habilitado no dashboard (pendência §11 item 8), o claim não existe e `packages/supabase/session.ts` (`getUserRole`) retorna `"user"` por padrão — fail-safe, nunca `"admin"` por omissão.
- **Login:** `apps/app/components/login/LoginScreen.tsx` (rota `/login`) — e-mail/senha via `supabase.auth.signInWithPassword` (`packages/supabase/auth.ts`, `signInWithEmail`) e Google via `supabase.auth.signInWithOAuth`. Web deixa o próprio browser navegar e volta com `detectSessionInUrl` (já configurado em `client.ts`); fora da web usa `expo-web-browser` (`WebBrowser.openAuthSessionAsync`) com `skipBrowserRedirect: true` e o deep link `serdono://login` (via `Linking.createURL`), parseando o fragmento da URL de retorno manualmente (sem adicionar `expo-auth-session` só por causa disso).
- **Rotas protegidas:** grupo `apps/app/app/(protected)/` — `_layout.tsx` exige sessão real (`!isAnonymousSession`), senão redireciona para `/login`; sub-grupo `(protected)/admin/_layout.tsx` exige adicionalmente `getUserRole(session) === "admin"`, senão redireciona para `/assistente`. **Isso é UX, não a fronteira de segurança** — quem protege dado é a RLS de cada tabela (§4.2); o guard de rota só evita que a UI errada apareça para o papel errado.
- **Destino pós-login:** usuário comum cai em `/assistente` (chat sobre o RAG de conhecimento geral, `askKnowledgeBase` já existente em SDD-21 — sem histórico persistido em tabela, é local ao componente); admin cai em `/admin`, hoje um placeholder (RN-2 do PRD proíbe construir o Painel Admin de verdade antes da hora). Ambos os destinos são posicionamento **temporário**, a ser realocado quando o Painel do Negócio (PRD §14.2) e o Painel Admin de verdade existirem.

**Decisão de Metro/monorepo:** com pnpm workspaces, o `metro.config.js` de `apps/app` **não** deve setar `resolver.disableHierarchicalLookup = true` nem sobrescrever `resolver.nodeModulesPaths` — essa receita é da documentação oficial para monorepos com hoist "flat" (yarn/npm workspaces). O pnpm resolve dependências via `node_modules` simbólico por pacote; forçar a lookup não-hierárquica quebra a resolução de dependências transitivas de pacotes como `expo` (ex.: `expo-modules-core`) e do próprio `expo-router` (`@expo/metro-runtime`, `@react-navigation/native` como dependências diretas de `apps/app`). A única customização necessária é ampliar `watchFolders` para a raiz do monorepo.
