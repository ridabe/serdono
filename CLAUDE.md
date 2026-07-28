# Ser Dono — Instruções do Projeto para o Claude

Este é um projeto **Spec-Driven Development (SDD)**. Antes de escrever, revisar ou explicar qualquer código neste repositório, leia nesta ordem:

1. **`docs/PRD.md`** — o quê construir: produto, personas, modelo de dados lógico, regras de negócio (`RN-x`), critérios de aceite (`CA-x`), requisitos funcionais (`RF-x`) e não funcionais (`RNF-x`).
2. **`docs/SPEC.md`** — como construir: stack (Expo SDK 54 fixado, React Native 0.81, `react-native-web`, sem Next.js), estrutura do monorepo, convenções de RLS no Supabase, pipeline de build do Android via GitHub Actions (sem EAS), decisões técnicas (`SDD-x`).
3. **`docs/identidade-visual/DESIGN_SYSTEM.md`** — a aparência: cores, tipografia, espaçamento, grid e especificação de todo componente de UI (`DS-x`). Logo definitivo: Conceito 01 — "O Marco".

## Regras de trabalho neste projeto

- **Nunca implemente algo que contradiga o PRD ou a SPEC sem avisar antes.** Se o pedido do usuário conflita com uma regra `RN-x` ou uma decisão `SDD-x` já registrada, aponte o conflito antes de codificar.
- **Toda decisão técnica nova vai para a SPEC no mesmo PR/turno que a implementa** — não deixe conhecimento apenas no código ou só na conversa.
- **Código único para Web, iOS e Android.** Nenhuma tela ou lógica de negócio deve ser escrita apenas para uma plataforma quando puder ser compartilhada — ver `SPEC.md` §2 e §3.
- **Lógica de negócio nunca dentro de `apps/app`.** Sempre em `packages/core`, para ser testável isoladamente (`SPEC.md` §3, SDD-3).
- **RLS é obrigatória e nasce junto com a tabela.** Nenhuma migration cria tabela com dado de usuário sem habilitar RLS na mesma migration (`SPEC.md` §4.1).
- **`docs/PRD.md`, `docs/SPEC.md` e `docs/identidade-visual/DESIGN_SYSTEM.md` são documentos vivos.** Ao evoluir o escopo, a arquitetura ou a aparência, atualize-os — não deixe a documentação decair em relação ao código.
- **Nenhuma cor, fonte ou espaçamento é escrito direto no código.** Todo valor visual vem de um token de `DESIGN_SYSTEM.md` §8 (`packages/ui/tokens.ts`) — ver regra `DS-0` e `DS-7`.
- **Identidade visual definida: Conceito 01 — "O Marco".** Cores, tipografia e especificação de componentes estão em `docs/identidade-visual/DESIGN_SYSTEM.md`. Novas variações de asset de marca entram primeiro em `docs/identidade-visual/`, nunca direto em `packages/ui`.

## Ordem de leitura recomendada ao iniciar qualquer tarefa

1. `docs/PRD.md` seção 0 (como usar o documento) e a seção correspondente ao módulo em questão (7 a 12).
2. `docs/SPEC.md` seção correspondente (stack, dados, IA, build, CI).
3. `docs/identidade-visual/DESIGN_SYSTEM.md` — tokens de cor/tipografia/espaçamento e a especificação do componente equivalente, antes de codificar qualquer tela ou componente de UI.
4. Código existente no monorepo, se houver.

Se alguma informação necessária não estiver em nenhum dos dois documentos, pare e pergunte antes de assumir — não invente regra de negócio nem decisão técnica.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
