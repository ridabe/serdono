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

### 2.2-bis Cores de dado — gráficos (`chart`, registradas em 31/07/2026)

**DS-19:** o produto ganhou seu primeiro gráfico de dado real (Painel do Empreendedor, PRD §12.4, SPEC.md SDD-50) — token novo `packages/ui/tokens.ts` → `chart`, seguindo o mesmo método de dataviz aplicado a qualquer design system (escolher a forma pelo trabalho do dado, cor por último, validar com script, nunca no olho).

| Token | Valor | Papel |
|---|---|---|
| `chart.ramp` | `["#7FA9BC","#5E93A8","#3C7791","#1E5B76","#0E3A4F"]` | Rampa ORDINAL de uma matiz só (teal da marca) — magnitude/progresso, nunca identidade de série |
| `chart.series` | `#1E5B76` | Passo padrão pra série única (linha/área/barra sem gradação) |
| `chart.seriesFill` | `rgba(30,91,118,0.16)` | Preenchimento de área sob linha |
| `chart.accent` | `gold.500` | Ênfase (o ponto/estado que é o assunto do gráfico) — sempre com rótulo numérico junto, nunca só a cor (DS-2) |
| `chart.track` | `ink.200` | Trilho de medidor/barra de progresso |
| `chart.grid` / `chart.axis` | `ink.200` / `ink.400` | Linhas de grade e eixo, recessivas |

**Por que rampa ordinal e não paleta categórica:** os gráficos do produto (progresso, conclusão por fase, ponto de equilíbrio) comparam **magnitude**, não distinguem séries diferentes — uma paleta categórica traria risco de daltonismo sem necessidade nenhuma (nada precisa "ter identidade própria"). Se o produto algum dia precisar comparar séries de verdade lado a lado (ex.: comparar dois negócios), aí sim entra uma paleta categórica nova — validada e registrada aqui, nunca improvisada num componente.

**Validação (não no olho):** rodado o script de validação do método de dataviz contra a superfície real do app (`color.bg.surface`, `#FFFFFF`) — monotonia de luminosidade, degrau mínimo entre passos, ponta clara acima de 2:1 de contraste e matiz única (spread 9°): todos PASS. Qualquer novo passo na rampa precisa passar pelo mesmo script antes de entrar aqui.

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
| `soft` | `color.bg.brandSubtle` (`brand.100`) | `color.action.secondary` | nenhuma | Ação secundária dentro de uma linha de tabela/lista densa (DS-26) — nunca `outline`/`ghost` nesse contexto |
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

### 9.10 Card colapsável (sanfona) de subcategoria de etapa (DS-18, registrada em 31/07/2026)

Pedido do dono do produto: toda tela de etapa da Jornada Empreendedora tende a acumular vários blocos de subcategoria (ex.: na Fase Clientes — Meta de captação, Oferta comercial, Adicionar contato, Meus contatos, Critérios de conclusão) e a tela fica muito longa quando todos ficam sempre abertos ao mesmo tempo. Todo card de **subcategoria de etapa** (um bloco de conteúdo com identidade própria dentro da tela) usa o componente `CollapsibleSection` (`packages/ui/components/CollapsibleSection.tsx`), nunca um `Card` simples direto — **padrão obrigatório em toda tela nova de etapa daqui pra frente**, não só nas telas já existentes.

- **Não se aplica a cards de item de lista** (uma linha de contato, um item de checklist, um resultado de calculadora dentro de uma subcategoria) — só ao container da subcategoria em si. Um card de item continua um `Card` comum.
- **Cabeçalho:** faixa colorida à esquerda (4px) + fundo levemente tingido na cor da seção + título (`type.bodyStrong`) + contador opcional à direita (ex.: "5/5") + badge circular preenchido (28px, `radius.full`) com "+"/"−" (DS-18.1, ver abaixo). Tocar em qualquer parte do cabeçalho alterna o estado — cada seção expande/retrai de forma independente, não é acordeão exclusivo (abrir uma não fecha as outras).
- **Cor por seção — ciclo fixo de 6, `SECTION_ACCENT_CYCLE`:** `brand` → `gold` → `info` → `success` → `warning` → `danger`, reaproveitando exatamente os tokens já existentes (nenhum hex novo criado pra isso) — os 4 últimos são os mesmos pares `color.state.X`/`color.state.XBg` já usados pelo Badge de status (§9.4), o que já garante contraste aprovado. Cada tela nova atribui as cores em ordem de aparição dos cards (primeiro card = `brand`, segundo = `gold`, etc.), sem repetir uma cor adjacente quando a tela tiver 6 ou menos seções.
- **DS-0 aplicada:** nenhuma cor nova criada — o componente só recombina tokens de `color.bg.brand`/`color.action.primary*`/`color.state.*` já existentes.

**DS-18.1 (revisão — sanfona nasce sempre retraída + indicador vira badge, pedido do dono do produto em 08/08/2026):**

- **Estado padrão trocou:** `defaultExpanded = false` (era `true`). Motivo: o dono do produto identificou que, com tudo aberto por padrão, quem chega numa tela pela primeira vez (ex.: fase da Jornada Empreendedora com várias subcategorias) não consegue ter uma visão geral de **quais** áreas existem — precisa rolar por conteúdo já expandido pra descobrir que tinha mais seções abaixo. Retraído por padrão, o título de cada card já entrega o mapa da tela inteira de cara.
- **Indicador de expandir trocou de seta pra badge:** a seta de texto `▾`/`▸` (fonte comum, sem contorno) era discreta demais — testado com usuário real, não ficava claro que aquilo era clicável, principalmente pra quem não conhece a convenção de seta-pra-baixo-expande. Virou um círculo preenchido de 28px (`radius.full`) na cor de destaque da seção (`tones.bar`) com um "+" (retraído) ou "−" (expandido) em negrito — visual de botão reconhecível mesmo por quem nunca viu o padrão de seta.
- **Cor do texto do badge não é sempre branco (DS-2/§2.3):** o acento `gold` usa `color.text.onAction` (`brand.900`) — nunca branco sobre a família de dourado, mesma regra já registrada em §2.3 pro botão primário. Os outros 5 acentos (`brand`, `info`, `success`, `warning`, `danger`) são tons "600", escuros o bastante pra texto branco (`color.text.onBrand`) em cima, mesmo padrão já usado no círculo de etapa concluída do `StepRail` (`StepDot`, ✓ branco sobre `color.state.success`).
- **Não afeta os campos `title`/`accent`/`rightLabel`** nem a regra de "cada seção expande independente" — só o valor padrão de `defaultExpanded` e o visual do indicador.

### 9.11 Shell do app instalado — barra de abas e cabeçalho (DS-20, registrada em 02/08/2026)

Pedido do dono do produto (02/08/2026): o app baixado da Play Store não pode ser a página web dentro de uma moldura. A **aparência de cada tela continua idêntica nas três plataformas** — o que muda é só o *shell*, ou seja, a moldura de navegação em volta do conteúdo. Ver `SPEC.md` SDD-53 para o lado técnico.

- **Fronteira única:** `isNativeApp` (`packages/ui/platform.ts`), derivada de `Platform.OS !== "web"`. **Nunca usar `useWindowDimensions`/`breakpoint` pra decidir se é app** — largura estreita é web mobile, que continua tendo landing e cabeçalho de site. Largura decide layout; plataforma decide shell. São eixos diferentes.
- **Barra de abas** (`MobileTabBar`, só nativo): fixa no rodapé, fundo `color.bg.surface`, borda superior `color.border.default`, `paddingBottom` = inset de gestos do aparelho (piso `space[2]`). Cada aba tem 44dp de alvo de toque (DS-8), ícone de 20dp (`icon.md`) + rótulo em `type.caption`.
- **Estado ativo nunca é só cor (DS-2):** a aba ativa muda de cor (`color.action.secondary` contra `color.text.muted`), **e** engrossa o rótulo (peso 700), **e** ganha um traço de 2dp em `color.action.primary` no topo. Três sinais, porque cor sozinha não carrega estado.
- **Cabeçalho** (`ScreenHeader`, as duas plataformas): logo à esquerda; à direita, links de navegação **só na web** (`webLinks`) e ações que valem em qualquer plataforma (`links`, ex.: "Sair" no Perfil). No app instalado o cabeçalho fica só com a marca — repetir no topo o que já é aba embaixo é exatamente o defeito que motivou esta regra.
- **Recorte do aparelho:** `ScreenHeader` é o único ponto que soma `useSafeAreaInsets().top`; sem inset (web) mantém o `space[6]` histórico, pra a migração das telas não mexer no espaçamento da web.
- **Ícones:** desenhados em `react-native-svg` (`apps/app/components/shell/TabIcon.tsx`) porque Lucide (§7) ainda não está instalada — traço e tamanho saem de `icon.strokeWidth`/`icon.md`, e o arquivo inteiro sai quando Lucide entrar.
- **DS-20.1 — teto de 5 abas, e o catálogo de módulos nunca acrescenta a sexta (03/08/2026).** Preocupação levantada pelo dono do produto: se cada módulo novo virasse um ícone, a barra viraria uma gaveta ilegível em tela de celular. A quinta aba era **agregadora** (“Módulos” → `/modulos`) e servia para 1 módulo extra ou para 20 — ela aparecia quando existia qualquer módulo liberado além da Jornada e sumia quando o admin bloqueava todos. **Superada por DS-22 no mesmo dia**, ainda no mesmo turno de trabalho: o dono do produto pediu pra ir além do teto fixo e mover tudo que cresce pro menu lateral — a barra de abas hoje é só 4 fixas, para sempre (ver DS-22). Registro mantido por histórico: o raciocínio de "rodapé não pode virar gaveta" é o mesmo, só a solução evoluiu de "agregar numa aba" pra "menu lateral que cresce à vontade".

### 9.12 Paleta categórica de gráfico (DS-21, registrada em 03/08/2026)

A §12 estabeleceu a rampa **ordinal** como padrão de dado (DS-19) — matiz única, porque os gráficos do produto comparavam magnitude e progresso. O comparador de aplicações do módulo de Investimentos é o primeiro caso em que as séries têm **identidade**, não ordem: CDB, Tesouro Selic, Poupança e o cenário do usuário são alternativas, não graus da mesma coisa. Usar a rampa ali seria dizer visualmente que uma é "mais" que a outra.

- **Token:** `chart.categorical` (`packages/ui/tokens.ts`) — `cdb` `#2E6FD4`, `selic` `#12876A`, `poupanca` `#C77A0A`, `cenario` `#8B4FD6`.
- **Validada por script, não no olho** (método de dataviz): faixa de luminosidade, piso de croma, separação sob daltonismo (pior par ΔE 9,4 protan), piso de visão normal (ΔE 19,8) e contraste ≥ 3:1 contra a superfície — **todos PASS**. A primeira tentativa reaproveitava `chart.series` + `color.state.info` e **falhou** em dois checks (croma baixo e ΔE 9,5 de visão normal entre os dois azuis) — registrado porque a combinação parecia perfeitamente legível a olho nu.
- **Ordem é fixa.** Nunca cicle cores, nunca recolora uma série porque outra saiu do gráfico. Trocar um valor isolado exige revalidar o conjunto (mesma regra da rampa ordinal).
- **A rampa ordinal continua sendo o padrão.** Esta paleta é a exceção para séries com identidade — não uma segunda opção de estilo para gráfico de magnitude.
- **Identidade nunca só por cor (DS-2):** cada linha tem rótulo direto na ponta, a legenda está sempre presente, e a série que representa **hipótese do usuário** é tracejada — o traço carrega a diferença mesmo em preto e branco ou para quem não distingue as cores.

### 9.13 Menu lateral / drawer (DS-22, registrada em 03/08/2026)

Pedido do dono do produto, no mesmo turno em que fixou o DS-20.1: em vez de um teto rígido de abas, mover tudo que cresce (catálogo de módulos, áreas livres novas como "Dicas da Mary") pra um menu lateral colapsável. **Regra que resulta disso: a barra de abas nativa (`MobileTabBar`) tem exatamente 4 itens fixos, para sempre — Início, Jornada, Mary, Perfil. Nenhuma aba nova nunca mais.**

- **Componente:** `AppDrawer.tsx` (`apps/app/components/shell/`), montado só quando `isNativeApp`. Reaproveita o padrão de overlay já estabelecido em `AppUpdateAlert.tsx` — `Modal transparent` com backdrop escuro (`rgba(17,24,39,0.5)`) — em vez de inventar um segundo mecanismo de overlay no projeto.
- **Gatilho:** ícone de hamburguer (`MenuIcon.tsx`, mesmo estilo SVG de `TabIcon.tsx`) integrado ao `ScreenHeader`, à esquerda da logo, visível só no app instalado. Único ponto de entrada — nenhuma tela precisa montar o gatilho por conta própria.
- **Animação:** painel desliza da esquerda via `Animated.Value`/`translateX`, timing `motion.base` (200ms, DS-16) — mesma técnica de transform já usada em `Button.tsx`/`HoverLift.tsx`, não uma lib de animação nova.
- **Conteúdo, organizado em seções com rótulo (`overline`, maiúsculo, `color.text.muted`):** "Módulos" — só aparece se houver algum liberado além da Jornada (mesma honestidade da RN-2: nunca listar destino vazio), e lista **cada módulo diretamente**, sem passar pelo catálogo `/modulos` intermediário. "Aprender" — link fixo pra "Dicas da Mary", sempre visível, sem gate nenhum (é área livre, não módulo).
- **Fechamento:** tocar um item fecha o drawer e navega; tocar o backdrop fecha sem navegar; no Android, o botão físico "voltar" fecha o drawer em vez de sair da tela (mesmo padrão de interceptação de `AppUpdateAlert.tsx`, mas aqui desviando, não bloqueando).
- **Web não ganha drawer.** `isNativeApp` continua sendo a única fronteira (§9.11) — na web, os mesmos destinos entram como `webLinks` do `ScreenHeader`.

### 9.14 Badge de ícone de módulo/fase + grade colorida (DS-23, registrada em 08/08/2026)

Pedido do dono do produto (08/08/2026): dar ao Início e à Jornada uma cara mais "app nativo" — mais cor, mais identidade visual por card, menos texto corrido/barra fina. Piloto aplicado primeiro no **Início** (`DashboardScreen.tsx`); extensão pra Jornada e demais telas é decisão separada, registrada quando acontecer.

- **`IconBadge`** (`packages/ui/components/IconBadge.tsx`): círculo colorido (`radius.full`) com o conteúdo passado por `children` (`ReactNode`, não mais `string` — revisado no mesmo dia, ver nota abaixo). `size` default 48 (grade de módulos/fases); usar menor (36-40) em contexto mais denso.
- **Revisão — ícone desenhado em vez de glyph de letra (08/08/2026, mesmo dia):** a primeira versão usava sigla de 2 letras (ex.: "VI" pra Validação da Ideia) por texto-em-círculo ser um padrão já existente no app (iniciais do negócio, "✓" do `StepDot`). O dono do produto pediu ícone "desenho" de verdade. `FaseIcon` (`apps/app/components/inicio/FaseIcon.tsx`) — um ícone por fase da Jornada, desenhado em `react-native-svg` seguindo exatamente o padrão já usado em `TabIcon.tsx` (§9.11): viewBox 24×24, `stroke`-only sem `fill`, cor via prop, `icon.strokeWidth`. Continua sem depender de Lucide (ainda não instalada) — quando entrar, `FaseIcon.tsx` e `TabIcon.tsx` saem juntos. `IconBadge` deixou de calcular a cor do conteúdo sozinho — quem chama passa `moduleAccent[accent].fg` pro ícone/texto que renderiza dentro.
- **Paleta — `MODULE_ACCENT_CYCLE` (`packages/ui/tokens.ts`), 6 cores:** `teal` (`bg.brand`) → `gold` (`action.primaryHover`) → `blue` (`state.info`) → `green` (`state.success`) → `purple` (`violet600`, **novo**) → `orange` (`orange600`, **novo**). Só os 2 últimos são hex genuinamente novos — os outros 4 reaproveitam tokens semânticos já existentes. `violet600` (`#8B4FD6`) é o mesmo hex já validado (DS-21) como `chart.categorical.cenario`, reaproveitado aqui como primitivo de uso geral (a paleta categórica do gráfico não muda, regra dela continua intacta). Cores atribuídas por índice de posição no ciclo (`i % 6`), não por significado fixo — a mesma fase pode cair numa cor diferente se a ordem mudar, o que é aceitável porque a cor aqui é só identidade visual, nunca codifica status sozinha (DS-2).
- **Contraste do glyph (`fg`) sobre o círculo (`bg`), validado por cálculo (não no olho):** `teal`/branco 12.6:1, `blue`/branco 5.96:1, `purple`/branco 5.01:1 — todos folgados. `gold`/`onAction` (`brand.900`) segue a regra já registrada em §2.3 (nunca branco sobre a família de dourado). `green`/branco ≈4.14:1 e `orange`/branco ≈3.65:1 ficam abaixo do piso de texto normal (4.5:1) mas acima do piso de texto grande em negrito (3:1) — aceitável porque o glyph é sempre ≥16px em negrito (mesmo raciocínio já aplicado ao indicador "+"/"−" da sanfona, DS-18.1); não usar essas duas cores pra texto corrido menor que isso.
- **Pill de status (`StatusPill`, local a `DashboardScreen.tsx` por enquanto — não exportado até um segundo uso aparecer):** reaproveita exatamente as cores já documentadas em §9.4 pros equivalentes "concluida"/"em_andamento"/"bloqueada" — nenhuma cor nova pro pill, só o `IconBadge`/paleta acima são novos.
- **"Próxima etapa" (`ProximaEtapa`, `DashboardScreen.tsx`):** card com `IconBadge` da fase atual + "Etapa N: {label}" (N calculado de `FASES_JORNADA.indexOf(fase) + 2` — Descoberta é a etapa 1 implícita, não entra no array) + texto de apoio **só com dado real** (`X de Y etapas concluídas nesta fase`, nunca uma descrição de tarefa inventada) + botão "Continuar" pra `/jornada`.
- **"Módulos da jornada" (`GradeFases`, `DashboardScreen.tsx`):** substitui as barras horizontais finas que existiam antes (`OndeVoceChegou`) por uma grade (`flexWrap: "wrap"`) de um card por fase — `IconBadge` + nome + `StatusPill`. Mostra **todas as fases**, inclusive as ainda não semeadas (`Pendente`), pra dar o mapa completo da Jornada de cara — diferente do componente anterior, que escondia fases com `total === 0`. A fase que é `faseEfetiva` agora ganha borda de destaque (`action.primaryHover`, 2px).
- **DS-0/DS-2 aplicadas:** qualquer novo card de módulo/fase usa `IconBadge` + `MODULE_ACCENT_CYCLE`, nunca uma cor solta no componente; todo par ícone/círculo segue os números de contraste acima.
- **"Seus módulos" dentro de `CollapsibleSection` (revisão 08/08/2026):** primeiro uso do card colapsável (§9.10/DS-18) **fora de uma tela de etapa da Jornada** — o catálogo de módulos extra (Investimentos, Retenção...) no Início agora nasce fechado, expansível. A regra da §9.10 nunca limitou o componente a telas de etapa, só descrevia o caso de origem; nenhuma mudança no componente foi necessária.
- **Linha do tempo horizontal (revisão 08/08/2026):** `LinhaDoTempo` deixou de empilhar marcos verticalmente (um embaixo do outro, até 6 linhas de 2 textos cada) e virou uma trilha horizontal rolável dentro do próprio card — nó circular + linha conectora + rótulo abaixo, um marco ao lado do outro, ordem cronológica da esquerda pra direita. Mesmo princípio "menos altura, mais largura" desta seção inteira, aplicado a um componente que não é grade (é sequência ordenada, então rolagem horizontal — não wrap — é o formato certo).

### 9.15 Padrão obrigatório de layout mobile — grade de 2-3 colunas, ícone desenhado, sanfona pro secundário (DS-24, registrada em 08/08/2026)

Pedido do dono do produto (08/08/2026), generalizando o que foi validado no piloto do Início (§9.14/§9.10): **daqui pra frente, toda tela nova ou revisada pro acesso via app Android segue este padrão**, não é mais uma decisão pontual do Início.

- **Nunca uma coluna só, alta.** Blocos de conteúdo curto/numérico/resumo (KPI, card de status, tile de módulo) entram em grade de **2 a 3 colunas** (`flexDirection: "row", flexWrap: "wrap"`), mesmo em largura de celular — não empilhados um embaixo do outro. Ver `KpiCard`/`GradeFases` (`DashboardScreen.tsx`) pro padrão de `flexBasis`/`minWidth` que funciona.
- **`minWidth` seguro depende de QUANTOS `padding` a grade já atravessou até a borda da tela, e de QUANTAS colunas — nunca copiar um número de outro lugar sem refazer a conta.** Cada nível de aninhamento (padding da `ScrollView` da tela, do `Card`/`CollapsibleSection` que envolve a grade, e do `Card` que envolve a grade **se ele estiver dentro de OUTRO `Card`**, como `CardDicasDaMary`) consome ~40px de largura disponível. A 375px de tela:
  - Grade de 2 colunas direto na `ScrollView` (nenhum `Card` no meio) — 335px disponíveis, `minWidth: 140` é seguro (`KpiCard`, `GradeFases` fora de sanfona).
  - Grade de 2 colunas dentro de 1 `Card` ou `CollapsibleSection` — 295px disponíveis, `minWidth: 140` **estoura por fração de pixel e colapsa pra 1 coluna** (achado 3× na mesma sessão de 08/08/2026: `ProdutoScreen`/`ClientesScreen` dentro de `CollapsibleSection`, SPEC.md SDD-80; `CardDicasDaMary` dentro do próprio `Card`, SDD-81) — usar `minWidth: 120`.
  - Grade de 3 colunas dentro de 1 `Card` — 295px disponíveis divididos em 3, não 2 — `minWidth: 120` AINDA estoura (`3×120+16=376 > 295`) — usar `minWidth: 88` (`CardDicasDaMary`, SDD-81).
  - **Regra prática:** `colunas × minWidth + (colunas−1) × gap ≤ largura_disponível`, com `largura_disponível ≈ 375 − 40×(nº de paddings de Card/CollapsibleSection/ScrollView atravessados)`. **Sempre medir com `getComputedStyle`/`getBoundingClientRect` depois de implementar — a mesma grade "funcionando" visualmente pode ter colapsado pra 1 coluna sem ninguém perceber olhando só o texto renderizado.**
  - **Testar a 360px, não só a 375px do preset (achado na auditoria de 08/08/2026, SPEC.md SDD-83).** Grade confirmada a 375px pode ter margem de menos de 10px — suficiente pra passar no teste, mas insuficiente pra qualquer Android um pouco mais estreito (360px é uma largura comum). Duas grades desta sessão passaram no teste a 375px e só quebraram quando testadas a 360px: o Fluxo de Caixa do Financeiro (`minWidth` alto demais) e os cards "Faturamento estimado"/"Contatos necessários" de Clientes (`flexBasis` alto demais **sem `minWidth` nenhum** — o mesmo bug acontece com ou sem `minWidth`, o que importa é a soma total ultrapassar a largura disponível). Sempre medir nas duas larguras antes de considerar uma grade pronta.
- **Exceção — nunca parear conteúdo de altura desigual/variável (SPEC.md SDD-78.2):** cards com parágrafo, lista de itens de tamanho variável, ou qualquer conteúdo que não seja um resumo curto e previsível ficam em **coluna única de largura cheia** — parear isso num grid faz o card mais curto esticar verticalmente pra acompanhar o vizinho mais alto (comportamento padrão de flexbox, não um bug pontual). Sequência ordenada no tempo (linha do tempo, trilha de progresso) vira **rolagem horizontal**, não grade — ver `LinhaDoTempo`.
- **Ícone desenhado, nunca só iniciais/sigla de texto.** Todo card de identidade visual por cor (`IconBadge`) recebe um ícone de verdade em `react-native-svg` (padrão `TabIcon.tsx`/`FaseIcon.tsx` — viewBox 24×24, stroke-only, cor via prop), não um glyph de 1-2 letras. Sigla de texto só é aceitável como estado transitório enquanto o ícone da tela específica não foi desenhado — nunca a versão final.
- **O que não é essencial na primeira olhada vai pra dentro de uma `CollapsibleSection`** (§9.10/DS-18, nasce fechada por padrão desde a DS-18.1) — não precisa mais ser só "subcategoria de etapa da Jornada"; qualquer card cujo conteúdo completo não precisa aparecer de cara (catálogo de módulos extra, detalhes secundários, listas longas) é candidato.
- **Escopo de aplicação.** Início (`DashboardScreen.tsx`, §9.14) e as 11 telas de fase da Jornada (`ValidacaoIdeiaScreen`, `PlanejamentoScreen`/`NomeEmpresaScreen`/`IdentidadeVisualScreen`, `FormalizacaoScreen`, `FinanceiroScreen`, `EstruturaScreen`, `FornecedoresScreen`, `ProdutoScreen`, `MarketingScreen`, `ClientesScreen`, `PrimeiraVendaScreen`, `OrganizacaoScreen`) foram revisadas contra este padrão em 08/08/2026 (SPEC.md SDD-80) — a maioria já usava `CollapsibleSection` extensivamente (regra já valia desde a DS-18) e não precisou de grade nova, porque o conteúdo é intrinsecamente de altura variável (dica expansível, formulário, texto gerado por IA). Onde havia lista curta e uniforme empilhada à toa, virou grade (checklist da Validação da Ideia, critérios de conclusão de Clientes, conceitos de precificação do Produto — este último com `FaseIcon`-style novo, `ConceitoIcon` local). A tela de conclusão da Jornada e os módulos extra (Investimentos, Retenção, Meu Negócio em Dia) ainda não foram revisados — ficam pendentes.
- **DS-0/DS-2 continuam valendo:** nenhuma cor solta fora de `moduleAccent`/tokens existentes; todo par ícone/fundo com contraste validado antes de entrar aqui.

### 9.16 Gráficos do Dashboard Admin — barra vertical por magnitude, Pizza por composição, paleta categórica nova (DS-25, registrada em 11/08/2026)

Pedido do dono do produto (11/08/2026): trocar as barras horizontais do Painel Admin por barras verticais, usar gráfico de Pizza onde a forma do dado permitir, colorir as barras pra diferenciá-las e mostrar informação de eixo. Decisão de forma seguiu o método de dataviz (forma pelo trabalho do dado, cor por último) — nem todo "colorir as barras" virou paleta categórica nova, porque nem todo gráfico do Painel Admin é composição.

- **Funil da Jornada por fase e Adoção por módulo continuam magnitude/progresso, não identidade** — viraram barra **vertical**, mas a cor de cada barra vem da rampa ordinal existente (`chart.ramp`, DS-19) por **valor** (barra com % maior = passo mais escuro da rampa), não uma cor arbitrária por categoria. Eixo Y mostra os valores da grade (0/metade/máximo); eixo X mostra o rótulo (fase/módulo) truncado sob a barra.
- **Fornecedores por categoria e Uso de IA por função SÃO composição** (cada fatia é % de um total que faz sentido somar 100%) — viraram gráfico de **Pizza/donut**, com legenda (cor + rótulo + %) fazendo o papel do eixo que um gráfico de Pizza não tem.
- **Token novo:** `chart.dashboardCategorical` (`packages/ui/tokens.ts`) — 5 cores, `#2E6FD4`/`#12876A`/`#C77A0A`/`#8B4FD6`/`#0B84A5`. Segundo caso do produto com identidade de série de verdade (o primeiro é DS-21/`chart.categorical`, exclusivo do comparador de Investimentos) — **não é a mesma paleta, não reaproveitar uma pela outra**, cada uma documentada e validada por conta própria.
- **Validada por script, não no olho:** faixa de luminosidade, piso de croma, separação sob daltonismo (pior par ΔE 9,4 protan), piso de visão normal (ΔE 19,8) e contraste ≥ 3:1 — todos PASS. Tentativas de 6ª cor (teal/magenta adicionais) falharam o piso de croma e a separação sob daltonismo — ficou em 5.
- **Ordem fixa, nunca cicle.** Categoria além da 5ª (ex.: uso de IA com muitas Edge Functions) dobra em **"Outras"** (`chart.dashboardOther` = `ink.400`, cor neutra) — nunca gerar uma 6ª cor pra Pizza.
- **`chart.ramp` continua sendo o default de todo gráfico de magnitude do produto** (DS-19) — esta seção não muda essa regra, só documenta as duas exceções de identidade que já existem (DS-21 e esta) e onde cada uma se aplica.

### 9.17 Botão `soft` — ação secundária em coluna de Ações de tabela (DS-26, registrada em 11/08/2026)

Pedido do dono do produto (11/08/2026): nas tabelas novas do Painel Admin (Usuários, Fornecedores, Dicas da Mary, Módulos), toda ação que não é a principal da linha (`primary`) nem destrutiva (`danger`) usava `outline`/`ghost` — fundo branco/transparente com texto quase preto, ficando "sem cor" perto dos botões cheios ao lado, numa coluna já densa com vários botões lado a lado. Padrão novo, obrigatório daqui pra frente em qualquer coluna de Ações de tabela admin:

- **Token:** variante `soft` do `Button` (`packages/ui/components/Button.tsx`) — fundo `color.bg.brandSubtle` (`brand.100`), texto `color.action.secondary` (`brand.900`), sem borda. Contraste calculado: 7,87:1 (folgado acima do piso AA de 4.5:1, DS-2).
- **Quando usar:** qualquer botão de ação secundária **dentro de uma linha de tabela** (ex.: "Reenviar senha", "Tornar admin", "Gerenciar materiais", "Despublicar", "Desativar"). Fora de tabela — formulário, tela cheia — `outline`/`ghost` continuam valendo exatamente como antes; esta variante não os substitui em geral, só nesse contexto específico.
- **O que não muda:** ação principal da linha continua `primary`/`danger` conforme o caso (ex.: "Bloquear" é `danger`, "Ativar" é `primary`); `soft` é sempre a ação de peso médio ao lado.
- **Telas já migradas:** `AdminUsersScreen`, `AdminFornecedoresScreen`, `AdminDicasCategoriasScreen`, `AdminDicasMateriaisScreen`, `AdminModulesScreen`.

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
