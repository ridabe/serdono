// Existe só pro `tsc` resolver `import ".../LinkminerButton"` sem extensão —
// mesmo motivo documentado em `dicas/YoutubeEmbed.tsx`: o projeto roda um
// único `tsc --noEmit` pra toda a árvore (web + nativo), `moduleSuffixes`
// não é opção. Em runtime, o Metro NUNCA escolhe este arquivo:
// `LinkminerButton.web.tsx`/`LinkminerButton.native.tsx` são sempre mais
// específicos pra qualquer plataforma real (web ou nativo).
export * from "./LinkminerButton.native";
