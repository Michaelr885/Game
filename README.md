# Ritter auf Faerûn

Ein kleines Browser-Spiel: Mit dem Ritter über eine Fantasy-Karte laufen und Sterne auf Hex-Feldern einsammeln.

## Spielen

```bash
cd spiel && python3 -m http.server 8080
```

Dann im Browser: `http://localhost:8080`

## Eigene Bilder verwenden

Lege deine Dateien in `spiel/assets/` ab (gleiche Dateinamen überschreiben die Platzhalter):

| Datei | Inhalt |
|--------|--------|
| `karte.png` | Deine Faerûn-Karte (Querformat mit Hex-Raster) |
| `ritter.png` | Deine Ritter-Figur (am besten PNG mit transparentem Hintergrund) |

## Steuerung

- **Pfeiltasten** – Ritter bewegt sich zu benachbarten Hex-Feldern
- **Klick** – auf ein angrenzendes Feld klicken
- **Mausrad** – Karte zoomen
