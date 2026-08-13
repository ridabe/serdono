// Existe só pro `tsc` resolver `import ".../DateTimeField"` sem extensão —
// o projeto roda um único `tsc --noEmit` pra toda a árvore (web + nativo),
// então `moduleSuffixes` não é opção (mesma armadilha documentada em
// `YoutubeEmbed.tsx`, `apps/app/components/dicas/`). Em runtime, o Metro
// NUNCA escolhe este arquivo: `DateTimeField.web.tsx`/`DateTimeField.native.tsx`
// são sempre mais específicos pra qualquer plataforma real.
export * from "./DateTimeField.native";
