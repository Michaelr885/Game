# Ritter auf Faerûn – Spielkonzept & Roadmap

Dieses Dokument fasst deine Pläne zusammen, erklärt das Prinzip von **Boss Fighters QR** und beschreibt, wie wir es für euer Tablet-Spiel mit **druckbaren Barcode-Karten** umsetzen können.

---

## 1. Deine Vision (Kurzfassung)

| Bereich | Wunsch |
|--------|--------|
| **Welt** | Detaillierte Fantasy-Karte mit benannten Orten |
| **Reisen** | Avatar bewegt sich auf der Karte, mindestens **5 Reiseziele** |
| **Kämpfe** | An jedem Ort Boss-Kämpfe im Stil **Boss Fighters** |
| **Karten** | **Faltkarten**: vorne Bild, hinten **QR-Code**, Scan per **Frontkamera** |
| **Kartentypen** | Waffen, Heiltränke, Schilde, Angriffe, Items |
| **Gerät** | **Tablet** (Touch, große Buttons, Querformat optional) |

---

## 2. Boss Fighters QR – So funktioniert das Original

*Quelle: offizielles Regelbuch (Pegasus / Palm & Zach), App unter boss-fighters-qr.com*

Boss Fighters QR ist ein **kooperatives Kampagnenspiel** (2–4 Spieler, ~40–60 Min. pro Boss). Physische Karten + **App mit Kamera** arbeiten zusammen – das nennt Pegasus **Scan & Play**.

### Kernprinzip

1. **Physische Karte** wird vor die **Frontkamera** gehalten (~15 cm).
2. Die **App erkennt** die Karte (im Original per **QR-Code**).
3. Die App **löst Effekte auf** (Schaden, Heilung, Schilde, Ziehen, …).
4. Der **Boss reagiert** planbar und taktisch (Angriffe, Schilde, Status, Muster).

> **Hinweis:** Im Original sind es **QR-Codes**, keine klassischen Strichcodes. Technisch ist das **dasselbe Prinzip**: ein eindeutiger Code auf Papier → Kamera → Spiel erkennt Karte → Effekt. Für euer Spiel können wir **Barcodes** (z. B. Code 128) nutzen – gut druckbar und von Browser-Bibliotheken lesbar.

### Aufbau vor dem Kampf

- Jeder Spieler wählt **Held** + **Klasse** (z. B. Zwerg + Krieger).
- Daraus entsteht ein **Deck** (~12 Aktionskarten + Held/Klasse).
- Lebenspunkte = Summe aus Held + Klasse (z. B. 14 + 10 = 24).
- Handkartenlimit ebenfalls aus beiden Karten.

### Ein Boss-Kampf: 7 Phasen pro Runde

Jede Runde läuft **in fester Reihenfolge** (wichtig für Fairness und Spannung):

| Phase | Name | Was passiert |
|-------|------|----------------|
| 1 | **Planung** | Boss plant Angriffe (Werte/Symbole an Helden) |
| 2 | **Schild** | Boss erhält ggf. Schilde (Nah-/Fern-/Magie) |
| 3 | **Aktion** | Helden reihum: **3 Aktionen** pro Spieler (Karten spielen, Items nutzen) |
| 4 | **Angriff** | Boss führt geplante Angriffe aus (Schaden + Status) |
| 5 | **Status** | Gift, Panik, Lähmung, Feuer, … wirken |
| 6 | **Abwurf** | Gespielte Karten weg, Hand auf Limit reduzieren |
| 7 | **Ziehen** | Neue Handkarten bis zum Limit |

**Sieg:** Boss-Leben = 0. **Niederlage:** Ein Held auf 0 LP.

### Karteneffekte (Grundlagen)

- **Angriff** (Nah / Fern / Magie): Schaden = Stärke der Karte.
- **Unterstützung**: Wie Angriff, aber nur wenn vorher ein Angriff **desselben Typs** in der Runde gespielt wurde.
- **Schutz**: Reduziert geplanten Boss-Angriff auf einen Helden.
- **Heilung**: LP zurück (max. Start-LP).
- **Blitz**: Sofort **+1 zusätzliche Aktion**.
- **Ziehen**: Karten vom Nachziehstapel.
- **Items** (z. B. Heiltrank): Eigene Aktion – Karte/Token vor Kamera halten.

### Was Boss Fighters besonders macht

- **Muster erkennen**: Jeder Boss hat eigene Taktik; man lernt Rhythmen und Reaktionen.
- **Kommunikation**: Kooperation und Absprache sind explizit gewollt.
- **Kampagne**: Nach Sieg Loot, neue Regeln, schwierigere Bosse.
- **App = Spielleiter**: Boss-Logik, Schilde, Timing – Spieler konzentrieren sich auf Karten.

---

## 3. Übertragung auf „Ritter auf Faerûn“

### Unterschiede zum Brettspiel (bewusst)

| Boss Fighters | Euer Spiel |
|---------------|------------|
| 2–4 Spieler kooperativ | Zunächst **1 Spieler** (Sohn + Vater später erweiterbar) |
| QR auf jeder Karte | **Barcode** (druckerfreundlich) |
| Separates Brettspiel + App | **Alles im Browser** (GitHub Pages) |
| 10 Bosse in Box | **5+ Orte** auf **eurer Faerûn-Karte** |
| Physischer Lebenszähler | LP in der App (+ optional am Tablet sichtbar) |

### Spielablauf (Zielbild)

```
[Weltkarte]  →  Zum Ort reisen  →  [Boss-Kampf]  →  Sieg: Loot / Ort erobert
     ↑                                    ↓
     └──────────────  Nächster Ort ───────┘
```

1. **Weltkarte (Tablet)**  
   - Vollbild-Karte, Touch: Tippen = benachbartes Hex bewegen.  
   - **Orts-Marker** (5+): z. B. Brunnenstadt, Drachenhöhle, Nebelwald, Eispass, Ruinen.  
   - Am Ort: Button **„Kampf beginnen“**.

2. **Boss-Kampf (eigener Bildschirm)**  
   - Gleiche **7 Phasen** vereinfacht für Solo.  
   - Boss-Leben, Schilde, geplanter Angriff, deine LP.  
   - Button **„Karte scannen“** → Frontkamera → Barcode → Effekt.

3. **Physische Karten**  
   - Ihr druckt Karten zu Hause.  
   - Jede Karte: Name, Bild, Effekt-Text, **Barcode** (eindeutige ID).  
   - Kategorien: Waffe, Heiltrank, Schild, Angriff, Item, Spezial.

4. **Nach dem Sieg**  
   - Ort als „befreit“ markieren, evtl. neue Karte freischalten, nächstes Ziel auf der Karte.

---

## 4. Die fünf+ Orte (Vorschlag)

Diese Orte sind in `data/locations.json` hinterlegt und können auf der Karte per Hex-Koordinate platziert werden:

| ID | Name | Boss | Schwierigkeit |
|----|------|------|----------------|
| `start` | Brunnenstadt | Übungs-Dummy (Tutorial) | ★ |
| `drachenhoehle` | Drachenhöhle | Höhlenwyrm | ★★ |
| `nebelwald` | Wald der Nebel | Nebelgeist | ★★ |
| `eispass` | Eispass | Frostriese | ★★★ |
| `ruinen` | Ruinen von Eldoria | Verwundener Ritter | ★★★ |
| `hafen` | Hafen der Sterne | Seeschlange (Finale) | ★★★★ |

Koordinaten (`q`, `r`) müsst ihr einmal an **eure echte Faerûn-Karte** anpassen (Pixel/Hex auf dem Bild).

---

## 5. Barcode-Karten: Technik & Druck

### Code-Format (Empfehlung)

- **Code 128** oder **QR** (QR ist robuster bei schlechtem Licht).
- Inhalt: kurze ID, z. B. `FAERUN_HEAL_01`, `FAERUN_SWORD_02`.
- **Keine** URLs im Code (Datenschutz, offline-fähig).

### Ablauf Scan im Browser

1. Nutzer tippt „Karte scannen“.
2. `getUserMedia({ facingMode: 'user' })` – **Frontkamera**.
3. Bibliothek: z. B. **ZXing** oder **html5-qrcode** (unterstützt Barcode + QR).
4. ID wird in `data/cards.json` nachgeschlagen → Effekt ausführen.

### Druckvorlage

- Datei `cards/druckvorlage.html` (im Repo): Kartenlayout A6/Spielkartengröße, Barcode wird automatisch erzeugt.
- Auf **mattem Papier**, gut beleuchtet scannen (wie im Boss-Fighters-Regelbuch: helles Blatt unter dem Handy hilft).

### Beispiel-Kartentypen (`data/cards.json`)

| ID | Typ | Effekt (Boss-Fighters-ähnlich) |
|----|-----|--------------------------------|
| `FAERUN_MELEE_03` | Angriff | 3 Nah-Schaden |
| `FAERUN_HEAL_08` | Heilung | +8 LP |
| `FAERUN_SHIELD_04` | Schutz | Boss-Angriff −4 |
| `FAERUN_POTION_08` | Item | Einmal +8 LP (wie Heiltrank) |
| `FAERUN_SWORD_05` | Waffe | +2 auf nächsten Nah-Angriff |

---

## 6. Tablet-Bedienung

- **Vollbild** (bereits umgesetzt).
- **Große Touch-Ziele** (min. 48×48 px): Buttons, Orts-Marker, Scan.
- **Kein Hover nötig** – alles per Tap.
- **Wischen** auf Karte zum Verschieben (optional, Pinch-Zoom).
- **Querformat** empfohlen für Karte + Kampf (CSS `orientation: landscape` Hinweis).
- **Kampf-UI**: Phasen-Leiste oben, große „Scan“-Fläche unten (Daumenzone).

---

## 7. Technische Architektur (schrittweise)

```
index.html
├── css/          (map.css, battle.css, tablet.css)
├── js/
│   ├── map.js        ← Weltkarte, Reisen, Orte
│   ├── battle.js     ← 7 Phasen, Boss-Logik
│   ├── scanner.js    ← Kamera + Barcode
│   └── data.js       ← locations + cards laden
├── data/
│   ├── locations.json
│   └── cards.json
├── cards/
│   └── druckvorlage.html
└── assets/           ← Karte, Avatar, Boss-Bilder
```

**Speicher:** `localStorage` für Kampagne (besiegte Bosse, Deck, LP zwischen Kämpfen optional).

**GitHub Pages:** HTTPS nötig für Kamera – `*.github.io` erfüllt das.

---

## 8. Entwicklungsphasen

### Phase A – Fundament (teilweise fertig)

- [x] Vollbild-Karte, Avatar, Touch/Zoom  
- [ ] Orte auf Karte sichtbar + Reiseziel  
- [ ] `locations.json` an echte Karte anbinden  

### Phase B – Kampf-Prototyp

- [ ] Kampf-Screen mit Boss + LP  
- [ ] 7 Phasen vereinfacht (Solo, 1 Held)  
- [ ] 3–5 Karten **digital** testen (ohne Druck)  

### Phase C – QR-Scan

- [x] Kamera + QR-Erkennung  
- [x] `cards.json` + Faltkarten-Druckvorlage  
- [ ] Waffen, Tränke, Schilde mit echten Ausdrucken testen  

### Phase D – Kampagne

- [ ] 5 Orte freischaltbar  
- [ ] Boss-Muster pro Ort  
- [ ] Loot / stärkere Karten  

### Phase E – Feinschliff

- [ ] Detaillierte Karte (Labels, Wege)  
- [ ] Sound, Animationen  
- [ ] 2-Spieler optional  

---

## 9. Rechtliches / Inspiration

- **Boss Fighters QR** ist ein eingetragenes Produkt von Pegasus / Autoren Palm & Zach.  
- Wir **übernehmen das Phasen-Prinzip und Scan-Idee**, aber **keine** originalen Karten, Bosse oder QR-Codes.  
- Eure Karten, Namen und Bosse sind **eigene Fantasy-Inhalte**.

---

## 10. Nächste sinnvolle Schritte

1. **Orte auf eurer Faerûn-Karte festnageln** (wo genau liegen die 5 Hex-Felder?).  
2. **Phase B starten**: Kampf-Bildschirm + ein Übungs-Boss (Mr.-Puppet-Äquivalent).  
3. **10–15 Karten** für den ersten Drucktest definieren.  
4. **Barcode-Druck** testen (Handy + Lampe + mattes Papier).

Wenn du möchtest, setze ich als Nächstes **Phase A+B** um: Orte auf der Karte + einfachen Boss-Kampf mit Scan-Button (ohne noch alle 7 Phasen perfekt).
