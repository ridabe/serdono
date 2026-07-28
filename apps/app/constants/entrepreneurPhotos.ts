/**
 * Banco de fotos de empreendedores reais para o fundo sutil do funil
 * pré-login (DESIGN_SYSTEM.md §9.9, DS-13/DS-14).
 *
 * Todas sob licença Unsplash (unsplash.com/license) — uso comercial livre,
 * sem necessidade de atribuição. Créditos mantidos aqui mesmo assim, para
 * rastreabilidade da origem de cada imagem (DS-14).
 */

export interface EntrepreneurPhoto {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

export const ENTREPRENEUR_PHOTOS: EntrepreneurPhoto[] = [
  {
    url: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1600&q=70",
    alt: "Mulher sorridente apresentando um plano em um quadro branco",
    photographer: "ThisisEngineering",
    photographerUrl: "https://unsplash.com/@thisisengineering",
  },
  {
    url: "https://images.unsplash.com/photo-1624797432677-6f803a98acb3?auto=format&fit=crop&w=1600&q=70",
    alt: "Homem sorrindo em ambiente de trabalho",
    photographer: "Danny Ocean",
    photographerUrl: "https://unsplash.com/@d_ocean",
  },
  {
    url: "https://images.unsplash.com/photo-1508766917616-d22f3f1eea14?auto=format&fit=crop&w=1600&q=70",
    alt: "Homem sendo atendido no balcão de um pequeno negócio",
    photographer: "Joshua Rodriguez",
    photographerUrl: "https://unsplash.com/@jcrod",
  },
];

export function pickEntrepreneurPhoto(seed: string): EntrepreneurPhoto {
  const index = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % ENTREPRENEUR_PHOTOS.length;
  return ENTREPRENEUR_PHOTOS[index];
}
