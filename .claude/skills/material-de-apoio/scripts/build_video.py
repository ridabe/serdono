#!/usr/bin/env python3
"""
Monta um vídeo-slide com a identidade visual do Ser Dono a partir de uma
lista de slides (título + subtítulo + pose da Mary opcional).

Não depende de ffmpeg instalado no sistema — usa `imageio-ffmpeg`, que traz
o binário embutido via pip. Único setup necessário:

    pip install imageio imageio-ffmpeg pillow

Uso:
    python build_video.py slides.json saida.mp4

Onde slides.json é uma lista de objetos:
    [
      {"titulo": "Como precificar seu serviço",
       "subtitulo": "Um guia rápido da Mary pra você não vender no prejuízo",
       "mary_pose": "boas-vindas",
       "segundos": 4},
      {"titulo": "Passo 1: some seus custos",
       "subtitulo": "Material, tempo e o que você gasta pra entregar",
       "mary_pose": "jornada",
       "segundos": 5}
    ]

`mary_pose` é opcional (uma de: boas-vindas, jornada, positivo, checklist —
ver img/README.md) e `segundos` tem default de 5 se omitido.

Validado manualmente em 03/08/2026: gera um .mp4 de verdade, frame conferido
por inspeção visual. Limitação conhecida: as fotos da Mary ainda têm fundo
próprio (não removido, dívida visual já registrada em img/README.md/DS-15)
— compõem melhor no canto direito da tela do que centralizadas.
"""

import json
import os
import sys

import imageio
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---- Cores da marca (packages/ui/tokens.ts) — nunca hardcode um hex fora
# daqui; se o token mudar lá, muda aqui também. ----
BRAND900 = (14, 58, 79)     # #0E3A4F — bg.brand
GOLD500 = (242, 176, 61)    # #F2B03D — action.primary
BRAND100 = (191, 212, 220)  # #BFD4DC — texto secundário sobre fundo escuro
WHITE = (255, 255, 255)

W, H = 1280, 720
FPS = 30

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
MARY_DIR = os.path.join(REPO_ROOT, "img", "mary")
MARY_POSES = {
    "boas-vindas": "mary-boas-vindas.png",
    "jornada": "mary-jornada.png",
    "positivo": "mary-positivo.png",
    "checklist": "mary-checklist.png",
}


def _font(size: int) -> ImageFont.FreeTypeFont:
    """Sora/Inter (fontes da marca) não estão empacotadas no repo ainda
    (dívida conhecida, ver img/README.md) — cai pra Arial, que existe em
    qualquer Windows/macOS. Se `packages/ui/assets/fonts/*.ttf` existir no
    futuro, troque o caminho aqui pra usar a fonte real da marca."""
    for candidate in ("arial.ttf", "Arial.ttf", "DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def make_slide(titulo: str, subtitulo: str, mary_pose: str | None) -> np.ndarray:
    img = Image.new("RGB", (W, H), BRAND900)
    draw = ImageDraw.Draw(img)

    # Faixa dourada — o "marco" da marca, presente em toda peça (DS-15/§1.3).
    draw.rectangle([0, H - 16, W, H], fill=GOLD500)

    titulo_w = W - 480 if mary_pose else W - 160
    draw.text((80, 260), _wrap(titulo, _font(52), titulo_w), font=_font(52), fill=WHITE)
    draw.text((80, 340), _wrap(subtitulo, _font(26), titulo_w), font=_font(26), fill=BRAND100)

    if mary_pose:
        arquivo = MARY_POSES.get(mary_pose, MARY_POSES["boas-vindas"])
        mary_path = os.path.join(MARY_DIR, arquivo)
        if os.path.exists(mary_path):
            mary = Image.open(mary_path).convert("RGBA")
            mary_h = 560
            mary_w = int(mary.width * (mary_h / mary.height))
            mary = mary.resize((mary_w, mary_h))
            img.paste(mary, (W - mary_w - 40, H - mary_h - 20), mary)

    return np.array(img)


def _wrap(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> str:
    """Quebra de linha simples por largura — PIL não faz isso sozinho."""
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if font.getlength(trial) > max_width and current:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return "\n".join(lines)


def build(slides_path: str, saida_path: str) -> None:
    with open(slides_path, encoding="utf-8") as f:
        slides = json.load(f)

    writer = imageio.get_writer(saida_path, fps=FPS, codec="libx264", quality=8)
    try:
        for slide in slides:
            frame = make_slide(
                slide["titulo"],
                slide.get("subtitulo", ""),
                slide.get("mary_pose"),
            )
            segundos = slide.get("segundos", 5)
            for _ in range(int(segundos * FPS)):
                writer.append_data(frame)
    finally:
        writer.close()

    print(f"Vídeo gerado: {saida_path} ({os.path.getsize(saida_path)} bytes, {len(slides)} slides)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python build_video.py slides.json saida.mp4")
        sys.exit(1)
    build(sys.argv[1], sys.argv[2])
