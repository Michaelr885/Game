#!/usr/bin/env python3
"""Erzeugt WebP/JPG aus assets/karte-abenteuerland.png (Fantasy-Karte)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PNG = ROOT / "assets" / "karte-abenteuerland.png"
WEBP = ROOT / "assets" / "karte-abenteuerland.webp"
JPG = ROOT / "assets" / "karte-abenteuerland.jpg"


def main() -> None:
    if not PNG.is_file():
        raise SystemExit(f"Fehlt: {PNG}")
    img = Image.open(PNG).convert("RGB")
    img.save(WEBP, "WEBP", quality=85, method=6)
    img.save(JPG, "JPEG", quality=88, optimize=True)
    print(f"OK: {WEBP.name} ({WEBP.stat().st_size} B), {JPG.name} ({JPG.stat().st_size} B)")


if __name__ == "__main__":
    main()
