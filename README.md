# Ritter auf Faerûn

Browser-Spiel für GitHub Pages: Fantasy-Karte, Reisen zu Orten, Boss-Kämpfe (inspiriert von **Boss Fighters QR**) und druckbare **Barcode-Karten**.

📄 **Vollständiges Konzept:** [docs/SPIELKONZEPT.md](docs/SPIELKONZEPT.md)  
🃏 **Karten drucken:** [cards/druckvorlage.html](cards/druckvorlage.html)

## Online spielen (GitHub Pages)

1. Repository → **Settings** → **Pages**
2. **Source:** Branch `main`, Ordner `/ (root)`
3. Nach dem Deploy: `https://<dein-user>.github.io/Game/`

Die Startseite ist `index.html` im Repository-Root.

## Lokal testen

```bash
python3 -m http.server 8080
```

Dann: `http://localhost:8080`

## Eigene Bilder

Dateien in `assets/` ersetzen:

| Datei | Inhalt |
|--------|--------|
| `karte.webp` / `karte.jpg` | Fantasy-Karte (klein, schnell) |
| `aaaaGemini_….webp` / `.png` | Ritter-Figur |

## Steuerung

- Pfeiltasten / WASD (+ Q/E schräg)
- Klick auf benachbartes Hex-Feld
- Mausrad zum Zoomen
