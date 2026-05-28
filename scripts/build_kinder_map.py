#!/usr/bin/env python3
"""Erzeugt WebP/JPG aus assets/karte-abenteuerland.png (Fantasy-Karte)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "abenteuerland-karte-source.jpg"
PNG = ROOT / "assets" / "abenteuerland-karte.png"
WEBP = ROOT / "assets" / "abenteuerland-karte.webp"
JPG = ROOT / "assets" / "abenteuerland-karte.jpg"
TARGET = (1280, 853)


def main() -> None:
    src_path = SOURCE if SOURCE.is_file() else PNG
    if not src_path.is_file():
        raise SystemExit(f"Fehlt: {SOURCE} oder {PNG}")
    img = Image.open(src_path).convert("RGB")
    if img.size != TARGET:
        iw, ih = img.size
        tw, th = TARGET
        scale = max(tw / iw, th / ih)
        nw, nh = int(iw * scale), int(ih * scale)
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        left = (nw - tw) // 2
        top = (nh - th) // 2
        img = img.crop((left, top, left + tw, top + th))
    img.save(WEBP, "WEBP", quality=85, method=6)
    img.save(JPG, "JPEG", quality=88, optimize=True)
    print(f"OK: {WEBP.name} ({WEBP.stat().st_size} B), {JPG.name} ({JPG.stat().st_size} B)")


if __name__ == "__main__":
    main()
