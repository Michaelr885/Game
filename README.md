# Ritter auf Faerûn

Browser-Spiel für GitHub Pages: Mit dem Ritter über die Karte laufen und Sterne auf Hex-Feldern einsammeln.

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
| `karte.png` | Fantasy-Karte (Querformat) |
| `ritter.png` | Ritter-Figur (PNG mit transparentem Hintergrund) |

## Steuerung

- Pfeiltasten / WASD (+ Q/E schräg)
- Klick auf benachbartes Hex-Feld
- Mausrad zum Zoomen
