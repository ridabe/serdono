// Ser Dono — variante nativa do botão "Fale conosco" (Linkminer, pedido do
// dono do produto, 28/08/2026). O widget só existe no SITE público (páginas
// não logadas, web) — o app instalado nunca chega nessas telas, então aqui
// é um no-op puro. Ver `LinkminerButton.web.tsx` pro componente de verdade.
export function LinkminerButton(_props: { bottomOffset?: number }) {
  return null;
}
