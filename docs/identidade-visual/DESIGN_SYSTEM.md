# Ser Dono — Design System

**Versão 1.0 · 27 de julho de 2026 · Documento vivo — parte do SDD deste projeto**

> Logo definitivo: **Conceito 01 — "O Marco"** (ver `docs/identidade-visual/identidade-ser-dono/01-o-marco-*.svg`). Este documento é a fonte de verdade visual do produto: cores, tipografia, espaçamento, grid e especificação de componentes. Qualquer tela nova, em qualquer plataforma, nasce a partir dos tokens definidos aqui — não de valores soltos no código.

---

## 0. Papel deste documento no fluxo SDD

Junto com `docs/PRD.md` (o quê) e `docs/SPEC.md` (como, em arquitetura), este documento define **a aparência**. Nenhum componente de UI é codificado com cor, fonte ou espaçamento hardcoded — sempre referenciando os tokens da seção 8, implementados em `packages/ui/tokens.ts` (ver SPEC §3).

**DS-0:** qualquer valor visual novo (uma cor, um tamanho de fonte, um espaçamento) que não exista neste documento precisa ser adicionado aqui no mesmo PR que o introduz — igual à regra SDD-0 da SPEC técnica.

---

## 1. Fundamento da Marca

### 1.1 Conceito escolhido — "O Marco"
Degraus ascendentes que terminam num ponto dourado: a jornada de construção do negócio (PRD §9, trilhas A–F) chegando à conquista. É a mesma lógica da barra de progresso do workflow — a marca e o produto contam a mesma história visual.

### 1.2 Arquivos-fonte
| Arquivo | Uso |
|---|---|
| `identidade-ser-dono/01-o-marco-simbolo.svg` | Símbolo isolado — ícone de app, favicon, avatar, splash screen |
| `identidade-ser-dono/01-o-marco-assinatura.svg` | Assinatura horizontal (símbolo + wordmark) — cabeçalhos, materiais de marketing, splash com nome |

**DS-1:** antes de qualquer build de produção (ícone de app, favicon), o texto da assinatura precisa estar convertido em curvas vetoriais (outline), nunca dependendo de fonte instalada no sistema que renderiza o SVG — ver nota técnica já registrada no painel de conceitos.

### 1.3 Área de respiro (clear space)
Espaço mínimo ao redor do símbolo e da assinatura, em qualquer aplicação: **igual à altura do ponto dourado do símbolo** (a "unidade de marca", chamada aqui de `1 un.`). Nenhum elemento de UI, borda de container ou outro texto pode invadir essa margem.

### 1.4 Tamanho mínimo
- Símbolo isolado: **24×24px** (digital) / **10mm** (impresso). Abaixo disso, os degraus perdem legibilidade.
- Assinatura horizontal: **120px** de largura mínima.

### 1.5 Uso incorreto (não fazer)
- Não recolorir os degraus e o ponto fora dos tokens definidos na seção 2.
- Não distorcer proporção (esticar/comprimir).
- Não aplicar sombra, brilho ou contorno decorativo ao símbolo.
- Não colocar a versão para fundo claro sobre fundo escuro (usar sempre a variante de fundo escuro da seção 1.6) nem vice-versa.
- Não reconstruir o símbolo à mão em outra ferramenta — sempre a partir do SVG-fonte.

### 1.6 Variantes de cor do logo
| Variante | Quando usar |
|---|---|
| Colorida (padrão) | Fundos claros/neutros — a maioria dos casos |
| Monocromática branca | Fundos escuros/coloridos (`brand.900`, imagens, capas) |
| Monocromática `ink.900` | Aplicações de baixo custo de impressão, marca d'água, uso sobre padrões |

---

## 2. Cor

### 2.1 Paleta primitiva (não usar direto em componentes — ver §2.2)

| Token primitivo | Hex | Papel |
|---|---|---|
| `brand.900` | `#0E3A4F` | Azul-petróleo — cor dominante da marca |
| `brand.700` | `#17546E` | Azul-petróleo, um tom mais claro (hover/pressed sobre `brand.900`) |
| `brand.100` | `#BFD4DC` | Azul-gelo — apoio, fundos suaves, ilustrações |
| `brand.50` | `#F7F9FC` | Neutro claro — fundo padrão de tela |
| `gold.500` | `#F2B03D` | Ouro — cor de destaque/ação (o "ponto" do logo) |
| `gold.600` | `#D89620` | Ouro, hover/pressed |
| `gold.100` | `#FCE9C2` | Ouro claro — fundos de destaque suave, badges |
| `ink.900` | `#111827` | Texto principal |
| `ink.600` | `#374151` | Texto secundário |
| `ink.400` | `#6B7280` | Texto terciário/legendas, ícones inativos |
| `ink.200` | `#D1D5DB` | Bordas e divisores |
| `ink.50` | `#F3F4F6` | Fundo de card/superfície alternativa |
| `white` | `#FFFFFF` | — |
| `success.600` | `#1E8E5A` | Confirmações, etapa concluída |
| `success.100` | `#DCF3E7` | Fundo de estado de sucesso |
| `warning.600` | `#B5760E` | Avisos (ex.: "aguardando terceiro", RN-14) |
| `warning.100` | `#FBEBD2` | Fundo de estado de aviso |
| `danger.600` | `#C23B2E` | Erros, cancelamento, valor fora da regra (RF-5) |
| `danger.100` | `#F9DEDB` | Fundo de estado de erro |
| `info.600` | `#2464B0` | Dicas neutras, avisos informativos do copiloto |
| `info.100` | `#DCE8F7` | Fundo de estado informativo |

### 2.2 Tokens semânticos (o que o código de fato consome)

Componentes referenciam **sempre** estes nomes semânticos, nunca `brand.900` diretamente — isso é o que permite trocar tema (ex.: dark mode futuro, §2.4) sem tocar em componente:

| Token semântico | Valor (light) | Uso |
|---|---|---|
| `color.bg.canvas` | `brand.50` | Fundo padrão de toda tela |
| `color.bg.surface` | `white` | Cards, modais, inputs |
| `color.bg.surfaceAlt` | `ink.50` | Seções alternadas, linhas pares de tabela |
| `color.bg.brand` | `brand.900` | Cabeçalhos de destaque, cards escuros, CTA de fundo cheio |
| `color.bg.brandSubtle` | `brand.100` | Fundos suaves de destaque de marca |
| `color.action.primary` | `gold.500` | Botão primário, link de ação principal |
| `color.action.primaryHover` | `gold.600` | Estado hover/pressed do primário |
| `color.action.secondary` | `brand.900` | Botão secundário, ação de navegação |
| `color.text.primary` | `ink.900` | Texto principal |
| `color.text.secondary` | `ink.600` | Texto de apoio |
| `color.text.muted` | `ink.400` | Legendas, timestamps, placeholders |
| `color.text.onBrand` | `white` | Texto sobre `color.bg.brand` |
| `color.text.onAction` | `brand.900` | Texto sobre botão dourado (contraste — ver §9) |
| `color.border.default` | `ink.200` | Bordas de input, card, divisor |
| `color.border.focus` | `brand.700` | Contorno de foco em campos e botões |
| `color.state.success` / `.successBg` | `success.600` / `success.100` | Etapa concluída, confirmação |
| `color.state.warning` / `.warningBg` | `warning.600` / `warning.100` | Etapa aguardando terceiro (RN-14) |
| `color.state.danger` / `.dangerBg` | `danger.600` / `danger.100` | Erro, validação de RF-5, cancelamento |
| `color.state.info` / `.infoBg` | `info.600` / `info.100` | Dica, aviso não bloqueante do copiloto |

### 2.3 Regra de contraste (obrigatória)

**DS-2:** todo par texto/fundo deste sistema deve atingir **WCAG AA** (contraste ≥ 4.5:1 para texto normal, ≥ 3:1 para texto grande ≥18px/24px bold). Combinações já verificadas e aprovadas:

| Texto | Fundo | Contraste | Status |
|---|---|---|---|
| `ink.900` | `white` / `brand.50` | 16.1:1 | ✅ |
| `white` | `brand.900` | 12.6:1 | ✅ |
| `brand.900` | `gold.500` | 7.1:1 | ✅ (por isso `color.text.onAction` = `brand.900`, nunca branco) |
| `ink.600` | `white` | 8.4:1 | ✅ |
| `ink.400` | `white` | 4.7:1 | ✅ (mínimo aceitável — não usar `ink.400` abaixo de 14px) |

**Nunca** usar texto branco sobre `gold.500` — o contraste fica abaixo de 2:1. Esse é o erro mais provável de acontecer por hábito (branco sobre cor de destaque é o padrão comum), então fica registrado aqui explicitamente.

### 2.4 Dark mode
Fora do escopo do MVP. Os tokens semânticos (§2.2) já existem exatamente para que um tema escuro possa ser adicionado depois trocando os valores por trás dos nomes, sem alterar nenhum componente — não deixar de usar os tokens semânticos "porque dark mode não existe ainda" é o erro que inviabilizaria essa troca futura.

---

## 3. Tipografia

### 3.1 Famílias
| Família | Papel | Fonte |
|---|---|---|
| **Sora** | Display/títulos — herda da marca (mesma fonte do wordmark) | Google Fonts, pesos 600/700 |
| **Inter** | Interface — corpo de texto, labels, botões, dados | Google Fonts, pesos 400/500/600/700 |

**DS-3:** Sora é usada **só** em títulos de tela (`display.*`, `heading.*` — ver §3.2), nunca em corpo de texto ou em componentes de dado denso (tabelas, listas longas) — geometria de display não escala bem para leitura extensa. Inter cobre tudo o resto, incluindo toda a UI do copiloto de IA.

### 3.2 Escala tipográfica

| Token | Fonte | Tamanho | Peso | Line-height | Uso |
|---|---|---|---|---|---|
| `type.display` | Sora | 32px | 700 | 40px | Tela de boas-vindas, resultado do diagnóstico, telas de marco (PRD §6.4) |
| `type.h1` | Sora | 24px | 700 | 32px | Título de tela padrão |
| `type.h2` | Sora | 20px | 600 | 28px | Título de seção dentro da tela |
| `type.h3` | Inter | 17px | 600 | 24px | Subtítulo, cabeçalho de card |
| `type.bodyLg` | Inter | 16px | 400 | 24px | Corpo de texto principal, mensagens do copiloto |
| `type.body` | Inter | 14px | 400 | 20px | Corpo de texto padrão, itens de lista |
| `type.bodyStrong` | Inter | 14px | 600 | 20px | Ênfase inline, label de campo preenchido |
| `type.caption` | Inter | 12px | 500 | 16px | Legendas, timestamps, fonte/data de dado citado (RN-20) |
| `type.overline` | Inter | 11px | 700 | 14px, +0.04em tracking | Rótulos de categoria em maiúsculas (ex.: "TRILHA A", "CONCEITO 01") |
| `type.button` | Inter | 15px | 600 | 20px | Texto de botão |
| `type.mono` | ui-monospace | 13px | 400 | 18px | Valores técnicos ocasionais (nunca no fluxo do usuário final) |

**Regra de tamanho mínimo (DS-4):** nenhum texto lido pelo usuário final (Marcos, Juliana, Sr. Aparecido — PRD §2) é menor que 14px. `type.caption` (12px) é reservado a metadado curto (fonte, timestamp), nunca a conteúdo que precise ser lido com atenção — condição direta da persona primária ter baixa tolerância a fricção (PRD §2.1).

### 3.3 Carregamento de fonte em React Native / Expo

Diferente da web, React Native não faz *fallback* automático de fonte do sistema — a fonte precisa ser empacotada e carregada explicitamente via `expo-font` antes da primeira renderização (tela de loading/splash segura isso). Arquivos `.ttf` de Sora e Inter ficam em `packages/ui/assets/fonts/`, carregados uma única vez no ponto de entrada do app (`apps/app/app/_layout.tsx`).

**DS-5:** nenhum componente declara `fontFamily` diretamente — sempre via os tokens `type.*` (que já encapsulam família + peso + tamanho + line-height como um único objeto de estilo), para que trocar a fonte da marca no futuro seja uma mudança em um arquivo só.

---

## 4. Espaçamento

Grid de **4px** como unidade base. Todo espaçamento de layout (padding, gap, margin) usa a escala abaixo — nunca um valor arbitrário fora dela.

| Token | Valor |
|---|---|
| `space.0` | 0px |
| `space.1` | 4px |
| `space.2` | 8px |
| `space.3` | 12px |
| `space.4` | 16px |
| `space.5` | 20px |
| `space.6` | 24px |
| `space.8` | 32px |
| `space.10` | 40px |
| `space.12` | 48px |
| `space.16` | 64px |

**Regras de aplicação:**
- Padding interno de card/container: `space.4` (mobile) a `space.6` (web/telas largas).
- Gap entre blocos de conteúdo dentro de uma tela: `space.6`.
- Gap entre seções distintas da tela: `space.10` a `space.12`.
- Margem mínima da borda da tela: `space.4` (mobile), `space.6` (web).

---

## 5. Raio de borda, elevação e bordas

| Token | Valor | Uso |
|---|---|---|
| `radius.sm` | 6px | Badges, chips, inputs pequenos |
| `radius.md` | 10px | Botões, inputs, campos de formulário |
| `radius.lg` | 14px | Cards, modais, folhas (sheets) |
| `radius.full` | 999px | Avatares, indicadores circulares de progresso |

| Token de elevação | Composição | Uso |
|---|---|---|
| `elevation.0` | sem sombra, apenas `color.border.default` 1px | Cards em listas densas |
| `elevation.1` | `0 1px 3px rgba(17,24,39,0.08)` | Card padrão, item de lista destacável |
| `elevation.2` | `0 4px 12px rgba(17,24,39,0.12)` | Modal, menu suspenso, tooltip |
| `elevation.3` | `0 12px 32px rgba(17,24,39,0.16)` | Folha modal em tela cheia (mobile), diálogo de confirmação |

**DS-6:** em React Native, sombra não é CSS — usar `shadow*` (iOS) + `elevation` (Android) mapeados nos mesmos tokens semânticos acima, dentro de `packages/ui`, para que o componente só declare `elevation="2"` e o valor certo por plataforma seja resolvido automaticamente.

---

## 6. Grid e breakpoints

Mobile-first por definição de produto (PRD §2.1: "usa o celular mais que o computador"). Breakpoints usados apenas para adaptar a mesma tela em telas largas (web/tablet), nunca para criar layout divergente de funcionalidade (RNF-3, SPEC §2).

| Token | Largura mínima | Comportamento típico |
|---|---|---|
| `bp.compact` | 0px (padrão) | Coluna única, navegação em abas inferiores |
| `bp.medium` | 768px | Conteúdo centralizado com largura máxima de leitura (`content.maxWidth`) |
| `bp.expanded` | 1080px | Navegação lateral fixa substitui abas inferiores; painéis lado a lado onde fizer sentido (ex.: lista de nichos + detalhe) |

| Token | Valor |
|---|---|
| `content.maxWidth` | 640px (telas de leitura/formulário — diagnóstico, etapas do workflow) |
| `content.maxWidthWide` | 1024px (dashboard/painel do negócio, PRD §14.2) |
| `layout.gutter` | `space.4` (compact) / `space.6` (medium+) |

---

## 7. Iconografia

- Biblioteca base: **Lucide** (via `lucide-react-native`, com equivalente web do mesmo pacote) — traço consistente, licença permissiva, cobre o vocabulário do produto (progresso, cadeado, documento, alerta).
- Peso de traço: `1.75px` a 24px (padrão da biblioteca) — não misturar com ícones de traços diferentes.
- Tamanhos padronizados: `icon.sm` = 16px, `icon.md` = 20px, `icon.lg` = 24px, `icon.xl` = 32px.
- Cor de ícone segue o token de texto do contexto (`color.text.secondary` para ícones de apoio, `color.action.primary` para ícones de ação) — nunca cor fixa fora dos tokens.
- Ícones autorais (o próprio símbolo do "Marco", selos de conquista) vivem como SVG em `packages/ui/assets/icons/brand/`, separados dos ícones de interface.

---

## 8. Estrutura de tokens no código

Implementação em `packages/ui/tokens.ts` (referenciado em `docs/SPEC.md` §3), consumido tanto pelos componentes React Native quanto pela configuração do NativeWind/Tailwind:

```ts
// packages/ui/tokens.ts
export const color = {
  bg: {
    canvas: "#F7F9FC",
    surface: "#FFFFFF",
    surfaceAlt: "#F3F4F6",
    brand: "#0E3A4F",
    brandSubtle: "#BFD4DC",
  },
  action: {
    primary: "#F2B03D",
    primaryHover: "#D89620",
    secondary: "#0E3A4F",
  },
  text: {
    primary: "#111827",
    secondary: "#374151",
    muted: "#6B7280",
    onBrand: "#FFFFFF",
    onAction: "#0E3A4F",
  },
  border: { default: "#D1D5DB", focus: "#17546E" },
  state: {
    success: "#1E8E5A", successBg: "#DCF3E7",
    warning: "#B5760E", warningBg: "#FBEBD2",
    danger: "#C23B2E", dangerBg: "#F9DEDB",
    info: "#2464B0", infoBg: "#DCE8F7",
  },
} as const;

export const space = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;
export const radius = { sm: 6, md: 10, lg: 14, full: 999 } as const;
export const type = {
  display: { fontFamily: "Sora_700Bold", fontSize: 32, lineHeight: 40 },
  h1:      { fontFamily: "Sora_700Bold", fontSize: 24, lineHeight: 32 },
  h2:      { fontFamily: "Sora_600SemiBold", fontSize: 20, lineHeight: 28 },
  h3:      { fontFamily: "Inter_600SemiBold", fontSize: 17, lineHeight: 24 },
  bodyLg:  { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  body:    { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  bodyStrong: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 16 },
  overline:{ fontFamily: "Inter_700Bold", fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  button:  { fontFamily: "Inter_600SemiBold", fontSize: 15, lineHeight: 20 },
} as const;
```

**DS-7:** este arquivo é a única fonte de valores visuais no código. Um componente que precisa de uma cor faz `color.action.primary`, nunca `"#F2B03D"` literal — isso é revisado no checklist de PR junto dos itens já definidos em `SPEC.md` §9.

---

## 9. Especificação de Componentes

Cada componente abaixo é especificado com variantes, estados e tokens usados — pronto para virar `packages/ui/<Componente>.tsx`.

### 9.1 Button

| Variante | Fundo | Texto | Borda | Uso |
|---|---|---|---|---|
| `primary` | `color.action.primary` | `color.text.onAction` (`brand.900`, nunca branco — §2.3) | nenhuma | Ação principal da tela (ex.: "Destravar este nicho", "Concluir etapa") |
| `secondary` | `color.action.secondary` | `color.text.onBrand` | nenhuma | Ação secundária de peso (ex.: "Ver dossiê completo") |
| `outline` | transparente | `color.action.secondary` | 1.5px `color.action.secondary` | Ação alternativa em tela já carregada de cor |
| `ghost` | transparente | `color.text.secondary` | nenhuma | Ação terciária, baixo destaque (ex.: "Pular por enquanto") |
| `danger` | `danger.600` | branco | nenhuma | Cancelar assinatura, excluir dado |

- Altura: `48px` (padrão, alvo de toque confortável), `36px` (`size="sm"`, usado só em contextos densos de web/desktop).
- Raio: `radius.md`.
- Padding horizontal: `space.5`.
- Estado `disabled`: opacidade 40%, sem alteração de cor de base (nunca virar cinza genérico — mantém a identidade da marca visível mesmo desabilitado).
- Estado `loading`: texto substituído por spinner do token `color.text.onAction`/`onBrand` conforme variante; botão mantém a largura (não "pula" o layout).
- Alvo de toque mínimo: **44×44px** mesmo quando o conteúdo visual for menor (DS-8, ver §10).

### 9.2 Input de texto / campo de formulário

- Altura: `48px`. Padding horizontal: `space.4`. Raio: `radius.md`.
- Borda padrão: 1px `color.border.default`; foco: 2px `color.border.focus` + leve elevação (`elevation.1`).
- Estado de erro: borda `danger.600` + texto de ajuda abaixo em `type.caption` cor `danger.600` (usado pela validação de RF-5 do PRD — ex.: preço abaixo do custo).
- Label sempre visível acima do campo (`type.bodyStrong`), nunca só placeholder — persona primária tem baixa tolerância a ambiguidade (PRD §2.1).
- Campo de faixa/seleção (RN-5 — capital sempre em faixas, nunca número livre): usar componente de **seleção segmentada ou chips**, nunca input numérico livre, reforçando a regra de produto na própria camada visual.

### 9.3 Card

- Fundo `color.bg.surface`, raio `radius.lg`, `elevation.1`.
- Padding interno `space.4` (mobile) / `space.6` (web largo).
- Variante `card--brand`: fundo `color.bg.brand`, texto `color.text.onBrand` — usada para o card de "Fit Score" e destaques de marco (mesmo padrão visual do Documento de Conceito e do Deck).
- Variante `card--outline`: `elevation.0`, borda 1px — para listas densas (ex.: lista de fornecedores futura, PRD §12).

### 9.4 Badge / Tag de status

Mapeamento direto dos `status` de `workflow_steps` (PRD §5.4):

| Status (dado) | Label visível | Cor |
|---|---|---|
| `bloqueada` | "Bloqueada" | `ink.400` sobre `ink.50` |
| `disponivel` | "Disponível" | `info.600` sobre `info.100` |
| `em_andamento` | "Em andamento" | `brand.900` sobre `brand.100` |
| `aguardando_terceiro` | "Aguardando" | `warning.600` sobre `warning.100` |
| `concluida` | "Concluída" | `success.600` sobre `success.100` |

- Formato: `radius.sm`, padding `space.2`/`space.3`, `type.caption` peso 600, ícone opcional de 14px à esquerda do texto.

### 9.5 Indicador de progresso de trilha (barra + stepper)

Componente direto do PRD §6.4 ("marcos visíveis... barra de progresso por trilha"):
- Barra horizontal, altura 8px, `radius.full`, trilho em `ink.200`, preenchimento em `gold.500`.
- Stepper vertical (usado na anatomia da etapa, PRD §9.1: Contexto → Dados → Decisão → Ação → Entregável → Checagem): círculos de 24px conectados por linha de 2px; círculo preenchido (`gold.500` + check branco) = concluído, contorno (`brand.900` sobre branco) = atual, `ink.200` = futuro.

### 9.6 Bolha de mensagem do Copiloto (chat de IA)

- Mensagem do assistente: fundo `color.bg.surfaceAlt`, texto `type.body`, alinhada à esquerda, avatar de 28px com o símbolo "O Marco" reduzido.
- Mensagem do usuário: fundo `color.bg.brand`, texto `color.text.onBrand`, alinhada à direita.
- Citação de fonte (RN-20, obrigatória sempre que há dado de mercado): linha separada abaixo do texto, `type.caption`, ícone de "livro/link" 14px + texto tipo "SEBRAE, jul/2026" — nunca dentro do corpo da mensagem em texto corrido, para ficar sempre visualmente escaneável.
- Aviso de guardrail (RF-4 — tema jurídico/fiscal/sanitário): card inline com fundo `info.100`, borda esquerda 3px `info.600`, ícone de alerta informativo — visualmente distinto de erro (`danger`), porque não é um problema, é uma ressalva.

### 9.7 Navegação

- **Mobile (`bp.compact`):** abas inferiores fixas (Tab Bar), 4–5 itens no máximo, ícone 24px + label `type.caption`. Item ativo: ícone e label em `color.action.secondary` (`brand.900`); inativo: `ink.400`.
- **Web largo (`bp.expanded`):** barra lateral fixa à esquerda, mesma hierarquia de itens, com o símbolo do logo no topo (não a assinatura completa, para economizar espaço).
- **Cabeçalho de tela:** título em `type.h1`, ação contextual (se houver) alinhada à direita, altura mínima 56px.

### 9.8 Empty states e erros

- Ilustração simples ou ícone grande (48–64px) em `brand.100`, título `type.h2`, descrição `type.body` em `color.text.secondary`, botão de ação abaixo quando aplicável.
- Tom sempre alinhado ao Princípio de Produto do PRD §4 (honestidade sobre risco) — nunca mensagens de erro genéricas tipo "Algo deu errado"; sempre nomear o que aconteceu e o próximo passo possível.

### 9.9 Fotografia de fundo (telas do funil pré-login)

Telas de fundo branco/canvas puro no funil de diagnóstico e cadastro ganham uma camada sutil de fotografia real de empreendedores — reforça que o produto fala de gente real construindo negócio real, não é só formulário. Aplica-se a qualquer tela nova desse funil daqui pra frente (diagnóstico, resultado, cadastro), não só à primeira em que foi usado.

- **Componente:** `EntrepreneurBackground` (`packages/ui/components/EntrepreneurBackground.tsx`), usado como camada absoluta atrás do conteúdo da tela (nunca atrás de texto lido diretamente — só atrás de área com card branco por cima).
- **Tratamento:** foto cobre a tela inteira, com um véu de `color.bg.canvas` a 90–94% de opacidade por cima — o resultado é uma textura quase imperceptível, nunca uma foto nítida competindo com o conteúdo. **DS-13: nunca reduzir esse véu abaixo de 85% de opacidade** — abaixo disso a foto compete com o texto e quebra o contraste da §2.3.
- **Banco de imagens:** fotos do catálogo `apps/app/constants/entrepreneurPhotos.ts`, todas sob licença Unsplash (uso comercial livre, sem necessidade de atribuição) — nunca imagem gerada por IA tentando simular uma "pessoa real", nunca foto sem licença clara.
- **Curadoria:** preferir fotos com bastante espaço negativo, tom quente, pessoa real em contexto de pequeno negócio (loja, bancada, atendimento, notebook) — evitar fotos muito cheias/ruidosas, que não ficam sutis nem com o véu por cima.
- **DS-14:** toda foto nova desse banco entra primeiro em `entrepreneurPhotos.ts` com URL, crédito do fotógrafo e link do perfil (mesmo a licença não exigindo atribuição, é a forma de manter rastreável de onde veio cada imagem) — nunca uma URL solta direto num componente de tela.

---

## 10. Acessibilidade

- **DS-8:** alvo de toque mínimo de 44×44px em qualquer elemento interativo, mesmo que visualmente menor (ícone de 20px dentro de área de toque de 44px).
- Todo texto respeita a razão de contraste da §2.3.
- Suporte a escala de fonte do sistema (Dynamic Type / configuração de acessibilidade do Android) — nenhum texto com tamanho fixo em unidade que ignore a preferência do usuário; usar `PixelRatio`/unidades relativas do React Native.
- Todo ícone usado sozinho como botão tem `accessibilityLabel` (RN) / `aria-label` (web) — sem exceção, dado o público de menor familiaridade digital (persona 3, PRD §2.3).
- Foco de teclado visível (web) em todo elemento interativo, usando `color.border.focus`.

---

## 11. Motion (transições)

| Token | Duração | Easing | Uso |
|---|---|---|---|
| `motion.fast` | 120ms | ease-out | Toggle, troca de estado de botão |
| `motion.base` | 200ms | ease-in-out | Abertura de card, troca de aba |
| `motion.slow` | 320ms | ease-in-out | Transição de tela, modal/sheet |

**DS-9:** nenhuma animação acima de 400ms no fluxo principal — a persona primária já tem baixa tolerância a fricção (PRD §2.1); movimento deve confirmar uma ação, nunca atrasar a percepção de resposta (reforça RNF-4 da SPEC/PRD: resposta percebida em até 4s).

### 11.1 Primitivas de movimento (DS-16, registradas em 29/07/2026)

Movimento não é escrito à mão em cada tela — vem de dois componentes de `packages/ui`, pelo mesmo motivo do DS-7 para cor: um lugar só para mudar o comportamento do produto inteiro.

| Primitiva | O que faz | Tokens |
|---|---|---|
| `Reveal` | Entrada de conteúdo: *fade* + subida curta. `delay` permite revelar uma lista em sequência | `motion.slow`, `motion.revealDistance`, `motion.revealStagger` |
| `HoverLift` | Card sobe no hover (web) e afunda no press | `motion.hoverLift`, `motion.pressScale`, `motion.base`, `motion.fast` |
| `Button` | Já traz o mesmo hover/press embutido — nenhum CTA precisa animar por conta própria | idem |

**DS-16:** todo movimento do produto usa essas primitivas e os tokens de `motion`, nunca duração ou deslocamento escrito solto no componente. Três regras que vêm junto:

1. **A informação nunca depende do movimento.** `Reveal` respeita a preferência de *movimento reduzido* do sistema — com ela ligada, o conteúdo aparece direto, sem animação. Quem não vê a animação não perde nada.
2. **Movimento confirma, não decora.** Hover e press existem para dizer "isto é clicável / seu toque foi registrado". Nada anima sozinho em laço no fluxo principal.
3. **Driver nativo só fora da web.** `useNativeDriver` fica `Platform.OS !== "web"` — o `react-native-web` não o suporta. É a mesma divergência plataforma-a-plataforma já registrada no DS-6 para sombra.

---

## 12. Governança de assets

**Todos os assets de marca prontos para uso vivem em `img/`, na raiz do projeto.** O catálogo completo, com a indicação de qual arquivo usar em cada lugar, está em `img/README.md`.

| Pasta | Conteúdo |
|---|---|
| `img/simbolo/` | Marca gráfica isolada — com e sem ladrilho, colorida, branca, preta |
| `img/horizontal/` | Assinatura principal (símbolo + wordmark) e wordmark isolado, nas 4 variantes de fundo |
| `img/vertical/` | Assinatura empilhada, para espaços mais altos que largos |
| `img/app-icon/` | Ícone iOS 1024, adaptive icon do Android (fundo, frente e monocromático) e mipmaps legados |
| `img/favicon/` | `.ico` multi-resolução, SVG, apple-touch-icon e ícones de PWA |
| `img/splash/` | Ícone central para `expo.splash` e versão de sangria completa |
| `img/social/` | Open Graph 1200×630 |
| `img/mary/` | Fotos da mascote Mary, uma por pose (`mary-{pose}.png`) — ver DS-15 |
| `docs/identidade-visual/identidade-ser-dono/` | Conceitos originais dos 5 logos avaliados (histórico da decisão) |
| `packages/ui/assets/fonts/` | Sora e Inter em `.ttf`, pesos listados em §3.1 — necessários em runtime (§3.3) |
| Ícones de interface (Lucide) | via pacote, não versionado como asset próprio |

**DS-10:** qualquer novo asset de marca (variação de cor, versão simplificada para tamanhos muito pequenos) é gerado a partir das fontes existentes e registrado em `img/README.md` — nunca colado solto no código sem origem documentada.

**DS-12:** todo SVG de marca tem o wordmark **vetorizado** (`<path>`, nunca `<text>`) e **não usa `opacity`** — transparências são pré-mescladas em hex sólido. As duas regras existem pelo mesmo motivo: um asset de marca precisa renderizar idêntico em qualquer ferramenta, sem depender de fonte instalada nem de suporte a recursos avançados de SVG.

**DS-15 (Mary — mascote do produto, registrada em 29/07/2026):** Mary é a personagem que representa o Ser Dono em toda a interface — dá boas-vindas ao entrar em cada módulo e acompanha o empreendedor etapa a etapa (primeiro uso: Jornada Empreendedora, PRD §9). Componente `MaryAvatar` (`packages/ui/components/MaryAvatar.tsx`), prop `pose`.

| Pose | Arquivo | Uso |
|---|---|---|
| `boas-vindas` | `img/mary/mary-boas-vindas.png` | Abertura de módulo, primeira impressão |
| `jornada` | `img/mary/mary-jornada.png` | Orientando dentro de uma etapa específica |
| `positivo` | `img/mary/mary-positivo.png` | Confirmação, conquista, etapa concluída |
| `checklist` | `img/mary/mary-checklist.png` | Contexto de lista/checklist, revisão |

- **Origem:** os 4 arquivos são recortes de uma única imagem de referência fotográfica fornecida pelo dono do produto — ainda **sem fundo removido** (fundo fotográfico original). Antes de qualquer publicação além de protótipo interno, gerar uma versão com fundo transparente e, idealmente, um tratamento ilustrado consistente com o resto da marca (hoje 100% geométrica/vetorial — a mistura com foto realista é uma dívida visual conhecida, não a direção final).
- **Toda pose nova** entra primeiro aqui e em `img/README.md`, nunca só dentro do componente (mesma lógica de DS-10).
- Nunca usar a Mary para comunicar erro grave ou aviso sensível (jurídico/fiscal/sanitário, RN-21 do PRD) — a personagem é tom de acompanhamento, não de alerta.

**DS-17 (Voz do produto — nunca nomear "a IA" no texto que o empreendedor lê, registrada em 30/07/2026):** por trás de boa parte do produto tem IA/RAG fazendo o trabalho pesado (gerar documento, montar roteiro, buscar por similaridade), mas isso é implementação, não personagem. Nenhum texto de tela fala na terceira pessoa sobre "a IA" ("a IA sugere...", "a IA vai gerar...", "gerado por IA", botão "com IA") — quem fala é a Mary, em primeira pessoa ("eu gero...", "eu te aponto...", "monto um roteiro..."), porque o empreendedor precisa sentir que tem uma sócia acompanhando, não um sistema processando. Vale pra label de botão, texto de tela e mensagem de erro — não vale pra Termos de Uso/Política de Privacidade (`termos.tsx`/`privacidade.tsx`), onde citar "inteligência artificial"/fornecedor do modelo é obrigação de transparência (LGPD), não voz de personagem.

---

## 13. Telas de referência (mockups)

Os conceitos visuais aprovados vivem em `docs/identidade-visual/mockups/`. São HTML estático, abertos direto no navegador — servem para validar decisões visuais antes de virarem componente em `packages/ui`, e como referência durante a implementação.

### 13.1 Portal Web — `mockups/portal-web.html`

| # | Tela | Regras de produto exercitadas |
|---|---|---|
| 1 | Tela inicial (pública) | Questionário já na primeira dobra (PRD §2.1); capital em faixas (RN-5); dados de mercado com fonte (RN-20) |
| 2 | Login | Label sempre visível (DS §9.2); prova social para a persona primária |
| 3 | Resultado do diagnóstico + paywall | Prévia de 3 nichos (RN-7); dossiê bloqueado (CA-4 / SDD-6); ressalva honesta no nicho de menor aderência (PRD §4, Princípio 5) |
| 4 | Painel do Negócio | Próximo passo antes de tudo (Princípio 1); trilha bloqueada explica o que a libera (RN-18); etapa em espera vira aviso âmbar com alternativa (RN-14) |
| 5 | Etapa do workflow + Copiloto | Anatomia de 6 passos (PRD §9.1); citação de fonte escaneável (RN-20, DS §9.6); copiloto discorda quando a conta não fecha (RF-5); aviso fiscal em azul, não vermelho (RN-21) |

### 13.2 App Mobile — `mockups/app-mobile.html`

| # | Tela | Observação |
|---|---|---|
| 1 | Splash | Cobre o carregamento de Sora e Inter via `expo-font` (DS §3.3) — não é decorativa, é funcional |
| 2 | Login | Mesma lógica da web em coluna única |
| 3 | Diagnóstico | Uma decisão por tela; faixas de capital como opções, nunca input numérico |
| 4 | Painel do Negócio | Mesma informação da web, adaptada a `bp.compact` com abas inferiores |
| 5 | Etapa do workflow | Stepper de 6 passos empilhado; erro de validação inline (RF-5) |
| 6 | Copiloto de IA | Chat em tela cheia com sugestões rápidas de follow-up |

**DS-11:** os mockups são conceito, não contrato de pixel. Se a implementação divergir por uma boa razão técnica, atualize o mockup ou registre a divergência aqui — não deixe o conceito e o produto contarem histórias diferentes.

---

## 14. Checklist rápido para qualquer tela nova

1. Cor vem de um token semântico da §2.2 — nenhum hex direto no componente.
2. Texto usa um token de `type.*` da §3.2 — nenhuma fonte/tamanho solto.
3. Espaçamento é múltiplo da escala da §4.
4. Todo par texto/fundo passa no contraste mínimo da §2.3 (atenção especial: nunca texto branco sobre `gold.500`).
5. Todo elemento tocável tem no mínimo 44×44px, mesmo que visualmente menor.
6. Se a tela cita dado de mercado (RN-20 do PRD), a fonte aparece no formato do §9.6 — nunca escondida.
7. Se a tela é do fluxo do workflow, os estados de `workflow_steps` batem com as cores da §9.4 — nunca uma cor nova inventada para "mais um status".
