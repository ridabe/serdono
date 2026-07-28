# img/ — Assets de marca do Ser Dono

Logo definitivo: **Conceito 01 — "O Marco"**. Especificação completa de cor, tipografia e uso em `docs/identidade-visual/DESIGN_SYSTEM.md`.

> **O texto do wordmark já está vetorizado** (convertido em `<path>`, não em `<text>`), cumprindo a regra **DS-1**. Isso significa que os arquivos renderizam idênticos em qualquer máquina, com ou sem a fonte Sora instalada. Nunca substitua esses arquivos por versões com `<text>`.

---

## Qual arquivo usar em cada lugar

### `simbolo/` — a marca gráfica sozinha

| Arquivo | Usar em |
|---|---|
| `simbolo-cor.svg` · `simbolo-cor-512.png` | Avatar, favicon grande, ícone dentro do produto, marca em fundo claro |
| `simbolo-invertido.svg` | Ladrilho dourado — usado no app sobre fundo azul-petróleo (splash, login) |
| `simbolo-mono-escuro.svg` | Contextos de baixo custo de impressão, marca d'água |
| `marca-cor.svg` | Os degraus + ponto **sem ladrilho** — sobre fundos claros já compostos |
| `marca-branca.svg` · `marca-branca-512.png` | Sem ladrilho, sobre fundo escuro ou foto |
| `marca-preta.svg` | Sem ladrilho, monocromático |

### `horizontal/` — assinatura principal

| Arquivo | Usar em |
|---|---|
| `horizontal-cor.svg` (+ `.png`, `@2x`, `@3x`) | Cabeçalho do portal web, e-mail, documento — **é a versão padrão da marca** |
| `horizontal-fundo-escuro.svg` | Barra lateral do app, rodapé escuro, capas |
| `horizontal-branca.svg` (+ `@2x.png`) | Sobre foto ou cor forte |
| `horizontal-preta.svg` | Impressão monocromática, fax, documentos oficiais |
| `wordmark-*.svg` | Só o nome, sem símbolo — quando o símbolo já aparece perto |

### `vertical/` — assinatura empilhada

Para espaços mais altos que largos: splash, capa de apresentação, adesivo, camiseta.
Disponível em `vertical-cor`, `vertical-branca`, `vertical-preta`.

### `app-icon/` — ícone dos aplicativos

| Arquivo | Onde entra |
|---|---|
| `ios-icon-1024.png` | `app.json` → `expo.ios.icon`. **Sem cantos arredondados e sem transparência de propósito** — o iOS aplica a própria máscara; um PNG já arredondado gera borda dupla |
| `android-adaptive-foreground-432.png` | `app.json` → `expo.android.adaptiveIcon.foregroundImage` |
| `android-adaptive-background-432.png` | `expo.android.adaptiveIcon.backgroundImage` (ou use `backgroundColor: "#0E3A4F"`) |
| `android-adaptive-monochrome-432.png` | `expo.android.adaptiveIcon.monochromeImage` — ícone temático do Material You |
| `android-legacy-*.png` | Fallback para Android antigo (mipmap por densidade) |

O ícone adaptativo do Android respeita a **safe zone**: todo o desenho fica dentro do círculo central de 66dp dos 108dp totais, então nenhuma máscara do fabricante (círculo, quadrado, gota) corta os degraus ou o ponto.

### `favicon/` — navegador

| Arquivo | Onde entra |
|---|---|
| `favicon.ico` | Raiz do site — contém 16, 32 e 48px no mesmo arquivo |
| `favicon.svg` | `<link rel="icon" type="image/svg+xml">` — nítido em qualquer densidade |
| `favicon-180.png` | `apple-touch-icon` |
| `favicon-192.png` · `favicon-512.png` | Manifesto PWA |
| `favicon-simplificado.svg` / `favicon-16.png` | **Versão com um degrau a menos e traço mais grosso.** A 16px o desenho completo vira borrão; esta versão mantém a leitura |

### `splash/` — abertura do app

| Arquivo | Onde entra |
|---|---|
| `splash-icone-1024.png` | `app.json` → `expo.splash.image`, com `backgroundColor: "#0E3A4F"` e `resizeMode: "contain"`. **É a forma recomendada** |
| `splash-escuro-1284x2778.png` | Splash de sangria completa, se algum caso exigir |

### `social/` — compartilhamento

| Arquivo | Onde entra |
|---|---|
| `og-image.png` (1200×630) | `<meta property="og:image">` e `twitter:image` — é a imagem que aparece quando alguém compartilha o link do serdono.com.br |

---

## Regras de uso

1. **Prefira sempre o SVG.** PNG só onde a plataforma exige (ícone de app, favicon `.ico`, Open Graph).
2. **Área de respiro:** mínimo igual à altura do ponto dourado em volta de toda a marca (DS §1.3).
3. **Tamanho mínimo:** símbolo 24×24px, assinatura horizontal 120px de largura. Abaixo disso, use o `favicon-simplificado`.
4. **Nunca** recolorir, distorcer, aplicar sombra/contorno, nem reconstruir o desenho em outra ferramenta. Se precisar de uma variação nova, ela é gerada a partir da fonte e registrada aqui (DS-10).
5. **Não use** a versão de fundo claro sobre fundo escuro e vice-versa — existe um arquivo específico para cada caso.

## Cores da marca

| Nome | Hex | Onde aparece no logo |
|---|---|---|
| Azul-petróleo | `#0E3A4F` | Ladrilho, wordmark "Ser" |
| Ouro | `#F2B03D` | O ponto (o "marco"), wordmark "Dono" |
| Azul-gelo | `#BFD4DC` | Os degraus sobre ladrilho escuro |
| Azul-petróleo 700 | `#17546E` | Círculo decorativo do splash e do Open Graph |

Nenhum arquivo usa `opacity` — todas as transparências foram pré-mescladas em hex sólido, para que o resultado seja idêntico em qualquer renderizador (navegador, Android, iOS, ferramenta de impressão).

## Fontes da marca

O wordmark usa **Sora Bold** (já vetorizado nestes arquivos — não é preciso ter a fonte para usá-los).

Para a **interface** do produto, Sora e Inter precisam ser empacotadas no app e carregadas com `expo-font` antes da primeira renderização — React Native não faz fallback automático como a web (DS §3.3). Baixe pelos pacotes `@fontsource/sora` e `@fontsource/inter` e coloque os arquivos em `packages/ui/assets/fonts/`.

---

Ser Dono · Assets de marca v1.0 · Gerados a partir de `docs/identidade-visual/DESIGN_SYSTEM.md`
