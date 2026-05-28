#!/usr/bin/env python3
"""Erzeugt cards/Faerun-Faltkarten.pdf aus data/cards.json."""

import json
import io
from pathlib import Path

import qrcode
from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
CARDS_JSON = ROOT / "data" / "cards.json"
OUT_PDF = ROOT / "cards" / "Faerun-Faltkarten.pdf"

CARD_W = 63 * mm
HALF_H = 88 * mm
FULL_H = 176 * mm
COLS = 3
MARGIN_X = 10 * mm
MARGIN_Y = 12 * mm
GAP = 2 * mm

TYPE_LABELS = {
    "attack": "Angriff",
    "protection": "Schutz",
    "heal": "Heilung",
    "item": "Item",
    "weapon": "Waffe",
    "lightning": "Blitz",
    "draw": "Zug",
}


def load_cards():
    return json.loads(CARDS_JSON.read_text(encoding="utf-8"))


def make_qr_image(card_id: str, size_px: int = 280) -> Image.Image:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(card_id)
    qr.make(fit=True)
    return qr.make_image(fill_color="#1a1a2a", back_color="#fffef5").convert("RGB")


def load_card_art(card: dict, max_w: int = 400) -> Image.Image | None:
    path = card.get("image")
    if not path:
        return None
    full = ROOT / path
    if not full.exists():
        return None
    img = Image.open(full).convert("RGB")
    ratio = max_w / img.width
    nh = int(img.height * ratio)
    return img.resize((max_w, nh), Image.Resampling.LANCZOS)


def draw_card(c: canvas.Canvas, x: float, y: float, card: dict):
    """y = untere Kante der gesamten Faltkarte (reportlab-Koordinaten)."""
    # —— Vorderseite (oben) ——
    top = y + FULL_H
    c.setStrokeColor(colors.HexColor("#333333"))
    c.setLineWidth(1.2)
    c.rect(x, y + HALF_H, CARD_W, HALF_H, stroke=1, fill=0)

    art = load_card_art(card)
    if art:
        buf = io.BytesIO()
        art.save(buf, format="JPEG", quality=85, optimize=True)
        buf.seek(0)
        img_h = HALF_H - 22 * mm
        c.drawImage(
            ImageReader(buf),
            x + 2 * mm,
            y + HALF_H + 14 * mm,
            CARD_W - 4 * mm,
            img_h,
            preserveAspectRatio=True,
            anchor="c",
        )

    c.setFillColor(colors.HexColor(card.get("color", "#4a5a7a")))
    c.rect(x, y + HALF_H, CARD_W, 12 * mm, stroke=0, fill=1)

    subtype = card.get("subtype", "")
    type_lbl = TYPE_LABELS.get(card["type"], card["type"])
    if subtype:
        type_lbl += f" · {subtype}"
    c.setFillColor(colors.white)
    c.setFont("Helvetica", 6)
    c.drawCentredString(x + CARD_W / 2, y + HALF_H + 3.5 * mm, type_lbl.upper())

    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(x + CARD_W / 2, y + HALF_H + 8 * mm, card["name"])

    val = card.get("value", 0)
    badge = "★" if not val else str(val)
    c.setFillColor(colors.HexColor("#f0d878"))
    c.circle(x + CARD_W - 6 * mm, y + FULL_H - 6 * mm, 5 * mm, stroke=1, fill=1)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(x + CARD_W - 6 * mm, y + FULL_H - 7.5 * mm, badge)

    c.setFont("Helvetica", 7)
    text = card["text"]
    lines = []
    words = text.split()
    line = ""
    for w in words:
        test = (line + " " + w).strip()
        if c.stringWidth(test, "Helvetica", 7) < CARD_W - 6 * mm:
            line = test
        else:
            lines.append(line)
            line = w
    if line:
        lines.append(line)
    ty = y + HALF_H + 2 * mm
    for ln in reversed(lines[:3]):
        c.drawCentredString(x + CARD_W / 2, ty, ln)
        ty += 3 * mm

    c.setFillColor(colors.grey)
    c.setFont("Helvetica", 5)
    c.drawCentredString(x + CARD_W / 2, y + HALF_H + 1 * mm, "VORDERSEITE")

    # Falzlinie
    fold_y = y + HALF_H
    c.setStrokeColor(colors.HexColor("#cc0000"))
    c.setDash(3, 2)
    c.line(x, fold_y, x + CARD_W, fold_y)
    c.setDash()
    c.setFillColor(colors.HexColor("#cc0000"))
    c.setFont("Helvetica-Bold", 6)
    c.drawCentredString(x + CARD_W / 2, fold_y - 2.5 * mm, "✂ HIER FALTEN")

    # —— Rückseite (unten) ——
    c.setStrokeColor(colors.HexColor("#333333"))
    c.setFillColor(colors.HexColor("#fffef5"))
    c.rect(x, y, CARD_W, HALF_H, stroke=1, fill=1)

    c.setFillColor(colors.HexColor("#666666"))
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(x + CARD_W / 2, y + HALF_H - 8 * mm, "RÜCKSEITE · SCAN")

    qr_img = make_qr_image(card["id"])
    qr_buf = io.BytesIO()
    qr_img.save(qr_buf, format="PNG")
    qr_buf.seek(0)
    qr_size = 38 * mm
    c.drawImage(
        ImageReader(qr_buf),
        x + (CARD_W - qr_size) / 2,
        y + 18 * mm,
        qr_size,
        qr_size,
        mask="auto",
    )

    c.setFont("Helvetica", 5)
    c.setFillColor(colors.grey)
    c.drawCentredString(x + CARD_W / 2, y + 12 * mm, card["id"])
    c.drawCentredString(x + CARD_W / 2, y + 6 * mm, "QR zur Tablet-Frontkamera")


def build_pdf():
    cards = load_cards()
    page_w, page_h = A4
    c = canvas.Canvas(str(OUT_PDF), pagesize=A4)
    c.setTitle("Ritter auf Faerûn – Faltkarten")
    c.setAuthor("Faerûn Spiel")

    col_w = CARD_W + GAP
    row_h = FULL_H + GAP
    per_row = COLS
    max_rows = int((page_h - 2 * MARGIN_Y + GAP) / row_h)
    per_page = per_row * max_rows

    for idx, card in enumerate(cards):
        page_idx = idx // per_page
        slot = idx % per_page
        if idx > 0 and slot == 0:
            c.showPage()

        if idx == 0 and slot == 0:
            pass
        elif slot == 0:
            pass

        col = slot % per_row
        row = slot // per_row

        x = MARGIN_X + col * col_w
        y = page_h - MARGIN_Y - (row + 1) * row_h

        draw_card(c, x, y, card)

    # Anleitungsseite
    c.showPage()
    c.setFont("Helvetica-Bold", 16)
    c.drawString(20 * mm, page_h - 25 * mm, "Ritter auf Faerûn – Faltkarten")
    c.setFont("Helvetica", 11)
    lines = [
        "So verwendest du die Karten:",
        "",
        "1. Karten entlang der roten Linie falten (untere Hälfte nach hinten).",
        "2. Vorne: Bild und Effekt · Hinten: QR-Code.",
        "3. Im Spiel am Tablet: Rückseite (QR) zur Frontkamera halten (~15 cm).",
        "4. Mattes Papier und gutes Licht verbessern den Scan.",
        "",
        f"Enthalten: {len(cards)} Karten · GitHub: Michaelr885/Game",
    ]
    ty = page_h - 45 * mm
    for line in lines:
        c.drawString(20 * mm, ty, line)
        ty -= 7 * mm

    c.save()
    print(f"PDF erstellt: {OUT_PDF} ({OUT_PDF.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    build_pdf()
