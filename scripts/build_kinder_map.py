#!/usr/bin/env python3
"""Erzeugt assets/karte-kinder.webp und .jpg aus der SVG-Vorlage."""
from __future__ import annotations

import io
from pathlib import Path

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "assets" / "karte-kinder.svg"
WEBP = ROOT / "assets" / "karte-kinder.webp"
JPG = ROOT / "assets" / "karte-kinder.jpg"
SIZE = (1280, 853)


def main() -> None:
    png = cairosvg.svg2png(url=str(SVG), output_width=SIZE[0], output_height=SIZE[1])
    img = Image.open(io.BytesIO(png)).convert("RGB")
    img.save(WEBP, "WEBP", quality=82, method=6)
    img.save(JPG, "JPEG", quality=85, optimize=True)
    print(f"OK: {WEBP.name} ({WEBP.stat().st_size} B), {JPG.name} ({JPG.stat().st_size} B)")


if __name__ == "__main__":
    main()
