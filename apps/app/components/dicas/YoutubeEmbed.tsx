// Existe só pro `tsc` resolver `import ".../YoutubeEmbed"` sem extensão —
// o projeto roda um único `tsc --noEmit` pra toda a árvore (web + nativo),
// então `moduleSuffixes` não é opção (afeta resolução de pacotes de
// terceiros também, ver SPEC.md SDD-59). Em runtime, o Metro NUNCA escolhe
// este arquivo: `YoutubeEmbed.web.tsx`/`YoutubeEmbed.native.tsx` são sempre
// mais específicos pra qualquer plataforma real (web ou nativo).
export * from "./YoutubeEmbed.native";
