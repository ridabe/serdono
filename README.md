# Ser Dono

![Ser Dono](img/horizontal/horizontal-cor.svg)

> Plataforma de assinatura que funciona como sócio digital do empreendedor iniciante: primeiro diagnostica qual negócio combina com a pessoa, depois conduz — passo a passo, com inteligência de mercado e um copiloto de IA — até o negócio estar aberto, operando e captando clientes. Depois da abertura, o produto continua como camada de inteligência da operação (marketing, financeiro, B2B).

Domínio alvo: `serdono.com.br`.

---

## Sobre o projeto

Este é um projeto **Spec-Driven Development (SDD)**: nenhuma implementação começa sem uma seção correspondente na documentação. Antes de codificar, a fonte de verdade é sempre lida nesta ordem:

1. **[`docs/PRD.md`](docs/PRD.md)** — o quê construir: produto, personas, modelo de dados lógico, regras de negócio (`RN-x`), critérios de aceite (`CA-x`), requisitos funcionais (`RF-x`) e não funcionais (`RNF-x`).
2. **[`docs/SPEC.md`](docs/SPEC.md)** — como construir: stack, estrutura do monorepo, convenções de RLS no Supabase, pipeline de build do Android, decisões técnicas (`SDD-x`).
3. **[`docs/identidade-visual/DESIGN_SYSTEM.md`](docs/identidade-visual/DESIGN_SYSTEM.md)** — a aparência: cores, tipografia, espaçamento, grid e especificação de todo componente de UI (`DS-x`).

Divergência entre código e documentação é considerada bug de processo, não detalhe de implementação. Veja as regras completas de colaboração em [`CLAUDE.md`](CLAUDE.md).

## Personas

- **Marcos, o decidido indeciso** — quer sair do CLT, sabe que quer empreender, não sabe em quê. Persona primária; linguagem simples e paridade mobile/web são inegociáveis por causa dele.
- **Juliana, já tem o CNPJ** — já abriu um negócio pequeno, entra pela porta "já tenho negócio".
- **Sr. Aparecido** — indicado por canal institucional (SEBRAE/prefeitura), precisa de UI ainda mais simples e suporte humano acessível.

## Escopo por fase

| Fase | Cobertura | Trilhas do workflow |
|---|---|---|
| Fase 0 — Validação | Diagnóstico e Match | — |
| Fase 1 — MVP | Diagnóstico → Match → Workflow completo | A (Validação), B (Identidade), C (Formalização) |
| Fase 2 — Profundidade | A detalhar antes de codificar | D (Estrutura), E (Comercial), F (Gestão) |
| Fase 3 — Ecossistema | A detalhar antes de codificar | Módulos pós-abertura (marketing, financeiro, B2B) |

## Princípios de produto (não negociáveis)

1. Uma decisão por vez — toda tela mostra no máximo uma decisão principal.
2. Nada trava — se uma etapa depende de terceiros, o sistema sugere a próxima etapa disponível em outra trilha.
3. Todo dado de mercado citado tem fonte e data visíveis, inclusive em texto gerado por IA.
4. Toda recomendação sensível (jurídica, fiscal, sanitária) traz aviso de que não substitui profissional habilitado.
5. Mobile e web têm paridade total de funcionalidade.

## Stack

| Camada | Tecnologia |
|---|---|
| UI (Web + iOS + Android) | React + React Native, código único via **Expo SDK 54** (fixado), exportado para web com `react-native-web` — sem Next.js |
| Roteamento | Expo Router (file-based) |
| Backend/dados | Supabase (Postgres, Auth, Storage, Edge Functions, RLS obrigatória) |
| Hospedagem web | Vercel |
| IA | API Anthropic (Claude) — Haiku (econômico) e Sonnet (avançado) |
| CI/CD mobile | GitHub Actions — `expo prebuild` + Gradle, sem EAS Build, disparado por mudança de versão em `app.json` |
| Linguagem | TypeScript em 100% do código de aplicação |
| Gerenciador de pacotes | pnpm (workspaces) |

Detalhes completos e decisões técnicas (`SDD-x`) estão em [`docs/SPEC.md`](docs/SPEC.md).

## Estrutura do monorepo (alvo)

```
serdono/
├── docs/                  # PRD, SPEC e identidade visual — fonte de verdade
├── apps/
│   └── app/               # único app Expo — roda em iOS, Android e Web
├── packages/
│   ├── ui/                # componentes compartilhados + tokens visuais
│   ├── core/               # regras de negócio puras (Fit Score, validações) — nunca dentro de apps/app
│   ├── supabase/           # client Supabase, tipos gerados, hooks de dados
│   └── config/              # tsconfig, eslint e config compartilhada
├── supabase/
│   ├── migrations/         # SQL versionado — fonte de verdade do schema
│   └── functions/          # Edge Functions (IA, webhooks de pagamento)
└── .github/workflows/       # CI e build Android (AAB)
```

## Identidade visual

Logo definitivo: **Conceito 01 — "O Marco"** — degraus ascendentes que terminam num ponto dourado, representando a jornada de construção do negócio. Cores, tipografia, espaçamento e especificação de componentes estão em [`docs/identidade-visual/DESIGN_SYSTEM.md`](docs/identidade-visual/DESIGN_SYSTEM.md). Nenhuma cor, fonte ou espaçamento é escrito direto no código — todo valor visual vem de um token (`packages/ui/tokens.ts`).

## Regras de trabalho

- Nunca implementar algo que contradiga o PRD ou a SPEC sem avisar antes.
- Toda decisão técnica nova vai para a SPEC no mesmo PR/turno que a implementa.
- Código único para Web, iOS e Android — nenhuma tela ou lógica de negócio escrita só para uma plataforma quando puder ser compartilhada.
- Lógica de negócio nunca dentro de `apps/app` — sempre em `packages/core`, testável isoladamente.
- RLS é obrigatória e nasce junto com a tabela — nenhuma migration cria tabela com dado de usuário sem RLS habilitada na mesma migration.

## Status

Projeto em fase de especificação (Fase 0/1). Documentação viva — PRD, SPEC e Design System evoluem junto com o código.
