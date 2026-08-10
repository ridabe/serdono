# -*- coding: utf-8 -*-
"""Gera o PDF "5 estratégias de marketing gratuito" — Dicas da Mary / Ser Dono.
Identidade visual real do produto (packages/ui/tokens.ts + img/README.md),
não uma paleta aproximada.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.lib.utils import ImageReader
import textwrap

BRAND900 = HexColor("#0E3A4F")
BRAND_SUBTLE = HexColor("#BFD4DC")
GOLD = HexColor("#F2B03D")
INK900 = HexColor("#111827")
INK600 = HexColor("#374151")
CANVAS = HexColor("#F7F9FC")
WHITE = HexColor("#FFFFFF")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

LOGO_BRANCA = "../../img/horizontal/horizontal-branca@2x.png"
LOGO_COR = "../../img/horizontal/horizontal-cor@2x.png"
MARY_BOAS_VINDAS = "../../img/mary/mary-boas-vindas.png"
MARY_POSITIVO = "../../img/mary/mary-positivo.png"

OUT = "5-estrategias-marketing-gratuito.pdf"


def wrap_text(c, text, font, size, max_width):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if stringWidth(trial, font, size) <= max_width:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_wrapped(c, text, x, y, font, size, max_width, leading, color=INK600):
    c.setFont(font, size)
    c.setFillColor(color)
    for line in wrap_text(c, text, font, size, max_width):
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_mary(c, path, x, y, w, h):
    img = ImageReader(path)
    c.drawImage(img, x, y, width=w, height=h, mask="auto", preserveAspectRatio=True, anchor="sw")


def footer(c, page_label):
    c.setFillColor(BRAND900)
    c.rect(0, 0, PAGE_W, 10 * mm, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, 3.2 * mm, "Ser Dono · Dicas da Mary")
    c.drawRightString(PAGE_W - MARGIN, 3.2 * mm, page_label)


def cover(c):
    c.setFillColor(BRAND900)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    logo = ImageReader(LOGO_BRANCA)
    logo_w = 55 * mm
    logo_h = logo_w * (196 / 640)
    c.drawImage(logo, MARGIN, PAGE_H - MARGIN - logo_h, width=logo_w, height=logo_h, mask="auto")

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, PAGE_H - 78 * mm, "MARKETING E VENDAS · DICAS DA MARY")

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 30)
    title_lines = ["5 estratégias de", "marketing gratuito"]
    ty = PAGE_H - 92 * mm
    for line in title_lines:
        c.drawString(MARGIN, ty, line)
        ty -= 12 * mm

    c.setFont("Helvetica", 14)
    c.setFillColor(BRAND_SUBTLE)
    ty -= 2 * mm
    for line in wrap_text(c, "pra divulgar seu negócio sem gastar nada", "Helvetica", 14, PAGE_W - 2 * MARGIN - 60 * mm):
        c.drawString(MARGIN, ty, line)
        ty -= 7 * mm

    # Mary no canto inferior direito (recomendação da skill: encostada na borda)
    mary_h = 95 * mm
    mary_w = mary_h * (512 / 768)
    draw_mary(c, MARY_BOAS_VINDAS, PAGE_W - mary_w + 8 * mm, 0, mary_w, mary_h)

    c.setFont("Helvetica", 10)
    c.setFillColor(BRAND_SUBTLE)
    c.drawString(MARGIN, 14 * mm, "Um material rápido — 5 minutos de leitura, 1 estratégia pra começar hoje.")
    c.showPage()


def intro_page(c):
    c.setFillColor(CANVAS)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    logo = ImageReader(LOGO_COR)
    logo_w = 42 * mm
    logo_h = logo_w * (196 / 640)
    c.drawImage(logo, MARGIN, PAGE_H - MARGIN - logo_h, width=logo_w, height=logo_h, mask="auto")

    c.setFillColor(BRAND900)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(MARGIN, PAGE_H - 45 * mm, "Oi, eu sou a Mary")

    y = PAGE_H - 58 * mm
    intro = (
        "Separei 5 jeitos de divulgar o seu negócio que não pedem nenhum real de investimento "
        "— só constância e um pouco do seu tempo. Não precisa fazer as 5 ao mesmo tempo: "
        "escolha 1 pra começar essa semana e vá adicionando as outras depois."
    )
    y = draw_wrapped(c, intro, MARGIN, y, "Helvetica", 12.5, PAGE_W - 2 * MARGIN, 6.5 * mm, INK600)

    y -= 10 * mm
    c.setFillColor(GOLD)
    c.rect(MARGIN, y - 1, 30 * mm, 1.4, fill=1, stroke=0)
    y -= 10 * mm
    c.setFillColor(BRAND900)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, y, "O que você vai encontrar aqui:")
    y -= 9 * mm

    itens = [
        "1. Redes sociais, com constância — não com perfeição",
        "2. Peça indicação de quem já comprou de você",
        "3. Parceria com negócios vizinhos (sem ser concorrente)",
        "4. Ensine um pouco do que você sabe, de graça",
        "5. Apareça onde seu cliente já está",
    ]
    c.setFont("Helvetica", 11.5)
    c.setFillColor(INK900)
    for item in itens:
        c.drawString(MARGIN + 2 * mm, y, item)
        y -= 8 * mm

    footer(c, "1 / 4")
    c.showPage()


def section(c, numero, titulo, corpo):
    """Desenha 1 bloco de estratégia; devolve o y onde parou."""
    y = c._section_y
    c.setFillColor(GOLD)
    c.circle(MARGIN + 4 * mm, y - 3.5 * mm, 4.5 * mm, fill=1, stroke=0)
    c.setFillColor(BRAND900)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(MARGIN + 4 * mm, y - 5.3 * mm, str(numero))

    c.setFillColor(BRAND900)
    c.setFont("Helvetica-Bold", 13.5)
    c.drawString(MARGIN + 12 * mm, y - 2 * mm, titulo)

    y -= 9 * mm
    y = draw_wrapped(c, corpo, MARGIN + 12 * mm, y, "Helvetica", 10.8, PAGE_W - 2 * MARGIN - 12 * mm, 5.6 * mm, INK600)
    y -= 9 * mm
    c._section_y = y


def strategies_pages(c, estrategias):
    # página 2: estratégias 1-3 / página 3: estratégias 4-5
    grupos = [estrategias[:3], estrategias[3:]]
    for i, grupo in enumerate(grupos):
        c.setFillColor(WHITE)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        c.setFillColor(BRAND900)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(MARGIN, PAGE_H - MARGIN, "Marketing gratuito na prática")
        c._section_y = PAGE_H - MARGIN - 16 * mm
        for numero, titulo, corpo in grupo:
            section(c, numero, titulo, corpo)
        footer(c, f"{i + 2} / 4")
        c.showPage()


def closing_page(c):
    c.setFillColor(BRAND900)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, PAGE_H - 40 * mm, "SEU PRÓXIMO PASSO")

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 22)
    for i, line in enumerate(["Escolha só 1 estratégia", "e comece essa semana"]):
        c.drawString(MARGIN, PAGE_H - 52 * mm - i * 10 * mm, line)

    y = PAGE_H - 78 * mm
    corpo = (
        "Depois que virar hábito, aí sim adicione a próxima. Divulgação que funciona de "
        "verdade é a que você consegue manter todo mês — não a que você faz uma vez só e larga."
    )
    y = draw_wrapped(c, corpo, MARGIN, y, "Helvetica", 12, PAGE_W - 2 * MARGIN - 55 * mm, 6.5 * mm, BRAND_SUBTLE)

    mary_h = 100 * mm
    mary_w = mary_h * (512 / 768)
    draw_mary(c, MARY_POSITIVO, PAGE_W - mary_w + 8 * mm, 0, mary_w, mary_h)

    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(BRAND_SUBTLE)
    c.drawString(MARGIN, 14 * mm, "Continue essa conversa comigo dentro do app Ser Dono.")
    footer(c, "4 / 4")
    c.showPage()


def main():
    c = canvas.Canvas(OUT, pagesize=A4)
    c.setTitle("5 estratégias de marketing gratuito — Ser Dono")
    c.setAuthor("Ser Dono")

    cover(c)
    intro_page(c)

    estrategias = [
        (1, "Redes sociais, com constância", (
            "Você não precisa de vídeo profissional nem legenda perfeita. Poste 3 vezes por "
            "semana mostrando o que você faz, os bastidores, um cliente satisfeito. Quem vê com "
            "frequência lembra de você na hora de comprar."
        )),
        (2, "Peça indicação de quem já comprou", (
            "Cliente satisfeito indica — mas só se você pedir. Depois de entregar um bom "
            "serviço, pergunte: \"Você conhece alguém que também precisa disso?\" É a "
            "propaganda mais barata (e mais confiável) que existe."
        )),
        (3, "Parceria com negócios vizinhos", (
            "Encontre um negócio que atende o mesmo público que o seu, sem ser concorrente "
            "direto, e combine indicar um o outro. Exemplo: salão de beleza + manicure, "
            "padaria + cafeteria."
        )),
        (4, "Ensine um pouco do que você sabe, de graça", (
            "Um vídeo curto ou um post explicando \"como escolher X\" ou \"erro comum ao "
            "comprar Y\" mostra que você entende do assunto. Quem aprende com você confia "
            "mais na hora de comprar."
        )),
        (5, "Apareça onde seu cliente já está", (
            "Grupo de bairro no WhatsApp, feira local, evento de comércio da região — não "
            "espere o cliente te achar, vá aonde ele já circula. Presença local ainda vale "
            "muito pro pequeno negócio."
        )),
    ]
    strategies_pages(c, estrategias)
    closing_page(c)

    c.save()
    print("PDF gerado:", OUT)


if __name__ == "__main__":
    main()
