---
name: material-de-apoio
description: Gera material de apoio educativo (PDF, apresentação em PPTX ou vídeo-slide) sobre qualquer assunto de empreendedorismo/negócios, sempre com a identidade visual do Ser Dono (cores da marca, avatar da Mary) e na voz da Mary em 1ª pessoa. Use sempre que o usuário pedir pra "criar material de apoio", "gerar uma apresentação/PDF/vídeo pro Ser Dono", "montar um treinamento", "criar conteúdo educativo com a marca", "fazer um material sobre [assunto] pra mandar pros empreendedores", ou pedir um resumo/guia/aula sobre um tema pra distribuir — mesmo que não diga explicitamente "PDF"/"PPT"/"vídeo" ou "Mary" pelo nome. Não é a skill certa pra telas do produto em si (isso é código React Native) nem pra campanha de redes sociais no Canva.
---

# Material de apoio — Ser Dono

Gera material educativo (PDF, apresentação ou vídeo-slide) sobre qualquer assunto de empreendedorismo/negócios, escrito na voz da Mary e com a identidade visual do Ser Dono aplicada de verdade — nunca um documento genérico com o logo colado em cima.

## Passo 1 — Sempre perguntar antes de gerar

Toda vez que esta skill for usada, pergunte (via `AskUserQuestion`, não assuma):

1. **Qual o assunto do material?** (texto livre — ex.: "como precificar um serviço", "erros comuns na hora de abrir CNPJ")
2. **Qual o formato de saída?** — PDF, Apresentação (PPTX) ou Vídeo (slide narrado/animado simples)

Não pule esta pergunta mesmo que o pedido do usuário pareça já responder — confirme os dois antes de escrever qualquer conteúdo. Se o usuário já dá os dois na mesma frase (ex.: "cria um PDF sobre precificação"), tudo bem pular o `AskUserQuestion` e seguir direto — a regra é não **assumir** o que falta, não repetir o óbvio.

## Passo 2 — Escrever o conteúdo primeiro, o design depois

Escreva o texto do material **antes** de pensar em arquivo/ferramenta. Duas regras não-negociáveis, porque são a voz do produto inteiro (DS-17 do design system):

- **Fala a Mary, em 1ª pessoa** — "eu vou te mostrar...", "separei 3 passos...", nunca "a IA gerou..." ou "este material foi criado por inteligência artificial" dentro do conteúdo em si.
- **Linguagem simples, sem jargão sem explicação** — o público é o empreendedor de pequeno negócio, não um MBA.

Estrutura por formato:

- **PDF**: capa (título + subtítulo) → 3 a 6 seções curtas (um conceito por seção, não um textão) → fechamento com um próximo passo prático.
- **Apresentação**: slide de capa → 1 slide por ideia (título curto + 3-5 bullets, nunca parágrafo em slide) → slide de fechamento/CTA.
- **Vídeo**: mesma lógica da apresentação, mas cada "slide" vira uma tela estática com um título e um subtítulo curto (é vídeo-slide, não um roteiro narrado com trilha — ver limitações no fim deste arquivo).

## Passo 3 — Identidade visual (nunca inventar cor/fonte)

Todo valor abaixo vem de `packages/ui/tokens.ts` e `img/README.md` do próprio produto — a mesma fonte que qualquer tela do Ser Dono usa. Não estime um tom "parecido"; use o hex exato.

| Uso | Token | Hex |
|---|---|---|
| Fundo de destaque (capa, faixas) | `bg.brand` | `#0E3A4F` (azul-petróleo) |
| Cor de ênfase/CTA (o "marco" da marca) | `action.primary` | `#F2B03D` (dourado) |
| Texto secundário sobre fundo escuro | `bg.brandSubtle` | `#BFD4DC` |
| Texto principal sobre fundo claro | `text.primary` | `#111827` |
| Fundo de página (documentos claros) | `bg.canvas` | `#F7F9FC` |

- **Logo**: use `img/horizontal/horizontal-cor.png` no cabeçalho de documentos/capas com fundo claro; `img/horizontal/horizontal-branca.svg` (ou o PNG `@2x`) sobre fundo escuro/foto. Nunca recolorir ou distorcer (regra do próprio `img/README.md`).
- **Avatar da Mary**: `img/mary/mary-<pose>.png`, uma das 4 poses — escolha pela função da tela/slide, igual o produto já faz:
  - `boas-vindas` — capa, abertura, primeira impressão.
  - `jornada` — explicando um passo específico.
  - `positivo` — conclusão, conquista, "pronto!".
  - `checklist` — lista de itens, revisão, resumo.
  - **Limitação conhecida** (já registrada no próprio produto, não é bug seu): essas fotos ainda têm fundo próprio, não removido. Composite a Mary encostada numa borda (canto inferior direito costuma funcionar melhor) em vez de centralizada — funde menos mal com o fundo sólido da marca.
- **Tipografia**: a marca usa Sora (títulos) + Inter (corpo), mas os arquivos `.ttf` ainda não estão empacotados no repo (mesma dívida documentada em `img/README.md`). Use uma fonte sem serifa neutra disponível na máquina (Arial/Calibri/Segoe UI) como fallback e não trave nisso — título em negrito, corpo em regular já comunica a hierarquia certa.

## Passo 4 — Gerar o arquivo

### PDF ou Apresentação (PPTX)

Invoque a skill correspondente já disponível no ambiente — `anthropic-skills:pdf` para PDF, `anthropic-skills:pptx` para apresentação — passando o conteúdo do Passo 2 junto com este briefing de marca (cores, caminhos de logo/Mary, tipografia) como instrução de design. Não reimplemente geração de PDF/PPTX na mão; a skill genérica já sabe construir o arquivo, você só está dizendo **com que cara** ele deve sair.

Pontos a garantir no resultado, porque são fáceis de esquecer ao delegar:
- A capa tem o logo horizontal E uma pose da Mary — nunca um documento sem nenhum dos dois.
- Nenhum slide/seção é só texto preto em fundo branco sem nenhum toque da marca (uma faixa `#0E3A4F` no rodapé, um título em `#0E3A4F`, o que for suficiente pro elemento não ficar genérico).
- O ouro (`#F2B03D`) é usado como destaque pontual (título, ícone, CTA) — nunca como cor de fundo grande com texto preto em cima sem checar contraste.

### Vídeo (vídeo-slide)

Use o script já pronto e testado desta skill: `.claude/skills/material-de-apoio/scripts/build_video.py`.

1. Instale as duas dependências, se ainda não estiverem no ambiente: `pip install imageio imageio-ffmpeg pillow` (não precisa de ffmpeg instalado no sistema — vem embutido).
2. Escreva um JSON com um objeto por slide: `titulo`, `subtitulo`, `mary_pose` (opcional, uma das 4 poses acima) e `segundos` (opcional, default 5).
3. Rode:
   ```
   python .claude/skills/material-de-apoio/scripts/build_video.py caminho/slides.json caminho/saida.mp4
   ```
4. O script já aplica as cores da marca e compõe a pose da Mary escolhida — não precisa (e não deve) reimplementar isso à mão.

Isso entrega um vídeo-slide (tela estática por seção, sem narração/trilha) — se o pedido for por um vídeo narrado ou com edição mais rica, avise o usuário que isso está fora do escopo desta v1 e pergunte se um roteiro de texto (pra gravação humana depois) resolveria melhor.

## Onde salvar

Salve o arquivo final numa pasta `material-de-apoio/<assunto-em-slug>/` a partir de onde o usuário estiver trabalhando (crie se não existir), com um nome descritivo (`precificacao-de-servico.pdf`, não `output.pdf`). Se o usuário pedir um destino diferente, use o que ele pedir.

## Limitações desta v1 (avise o usuário se a necessidade for além disso)

- Vídeo é **slide estático**, não narração com IA de voz nem edição com transições complexas.
- Fontes da marca (Sora/Inter) não estão empacotadas — o resultado usa uma fonte neutra do sistema, não pixel-perfect com o app.
- As fotos da Mary têm fundo próprio (não é PNG com fundo transparente) — funciona bem em composição lateral, fica estranho centralizada por cima de outro fundo.
