const BOSSES = {
  dummy: { hp: 18, attackMin: 3, attackMax: 5 },
  höhlenwyrm: { hp: 32, attackMin: 4, attackMax: 7 },
  nebelgeist: { hp: 30, attackMin: 4, attackMax: 6 },
  frostriese: { hp: 38, attackMin: 5, attackMax: 8 },
  schattenritter: { hp: 40, attackMin: 5, attackMax: 9 },
  seeschlange: { hp: 45, attackMin: 6, attackMax: 10 },
};

const PHASES = [
  "1. Planung",
  "2. Schild",
  "3. Aktion",
  "4. Angriff",
  "5. Status",
  "6. Abwurf",
  "7. Ziehen",
];

const PHASE_INFO = [
  {
    title: "1. Planung",
    desc: "Der Boss plant seinen Angriff. Die Zahl unten zeigt, wie viel Schaden er dir zufügen will.",
  },
  {
    title: "2. Schild",
    desc: "Der Boss bekommt manchmal Schilde. Bei schweren Bosse wird sein Angriff etwas schwächer.",
  },
  {
    title: "3. Aktion",
    desc: "Du hast 3 Aktionen: Tippe eine Karte mit Bild oder scanne deine gedruckte QR-Karte.",
  },
  {
    title: "4. Angriff",
    desc: "Der Boss greift an! Schaden = geplanter Angriff minus dein Schutz.",
  },
  {
    title: "5. Status",
    desc: "Gift, Feuer und andere Effekte würden hier wirken (im Prototyp übersprungen).",
  },
  {
    title: "6. Abwurf",
    desc: "Gespielte Karten kommen weg. Handkarten begrenzen (vereinfacht).",
  },
  {
    title: "7. Ziehen",
    desc: "Neue Karten ziehen – danach beginnt die nächste Runde.",
  },
];

const Battle = {
  active: false,
  location: null,
  playerHp: 24,
  playerHpMax: 24,
  bossHp: 30,
  bossHpMax: 30,
  phaseIndex: 0,
  actionsLeft: 0,
  plannedAttack: 0,
  attackReduced: 0,
  weaponBonus: 0,
  round: 1,
  potionUsed: false,

  el: {
    continue: () => document.getElementById("btn-phase-continue"),
    actionPanel: () => document.getElementById("action-panel"),
    phasePanel: () => document.getElementById("phase-panel"),
    phaseTitle: () => document.getElementById("phase-title"),
    phaseDesc: () => document.getElementById("phase-desc"),
  },

  start(location) {
    const boss = BOSSES[location.bossId] || BOSSES.dummy;
    this.location = location;
    this.active = true;
    this.playerHp = this.playerHpMax;
    this.bossHp = boss.hp;
    this.bossHpMax = boss.hp;
    this.round = 1;
    this.weaponBonus = 0;
    this.potionUsed = false;

    document.getElementById("battle-location-name").textContent = location.name;
    document.getElementById("battle-boss-name").textContent = location.bossName;
    document.getElementById("screen-battle").classList.remove("hidden");
    document.getElementById("screen-battle").setAttribute("aria-hidden", "false");
    document.getElementById("hud-map").classList.add("hidden");
    document.getElementById("stage-map").classList.add("hidden");

    this.renderQuickCards();
    this.startRound();
    MapGame.setPaused(true);
  },

  end(victory) {
    this.active = false;
    document.getElementById("screen-battle").classList.add("hidden");
    document.getElementById("screen-battle").setAttribute("aria-hidden", "true");
    document.getElementById("hud-map").classList.remove("hidden");
    document.getElementById("stage-map").classList.remove("hidden");

    if (victory) {
      GameData.defeatLocation(this.location.id);
      MapGame.logMessage(`🎉 ${this.location.name} befreit!`);
      MapGame.syncCampaignHud();
    } else {
      MapGame.logMessage("Du wurdest besiegt … Versuche es erneut!");
    }
    MapGame.setPaused(false);
    MapGame.updateMapActions();
  },

  flee() {
    if (confirm("Kampf wirklich verlassen?")) this.end(false);
  },

  startRound() {
    const boss = BOSSES[this.location.bossId] || BOSSES.dummy;
    this.plannedAttack =
      boss.attackMin + Math.floor(Math.random() * (boss.attackMax - boss.attackMin + 1));
    this.attackReduced = 0;
    this.actionsLeft = 3;
    this.phaseIndex = 0;
    this.log(`— Runde ${this.round} —`);
    this.runPhase();
  },

  showContinueButton(label = "Weiter →") {
    const btn = this.el.continue();
    btn.textContent = label;
    btn.classList.remove("hidden");
  },

  hideContinueButton() {
    this.el.continue().classList.add("hidden");
  },

  setActionPanelVisible(visible) {
    this.el.actionPanel().classList.toggle("hidden", !visible);
  },

  runPhase() {
    this.renderPhases();
    this.renderHp();
    this.updateCardButtons();

    const info = PHASE_INFO[this.phaseIndex];
    this.el.phaseTitle().textContent = info.title;
    this.el.phaseDesc().textContent = info.desc;

    switch (this.phaseIndex) {
      case 0:
        this.setActionPanelVisible(false);
        this.log(`Der Boss plant ${this.plannedAttack} Schaden.`);
        this.showContinueButton("Weiter zur Schild-Phase →");
        break;
      case 1:
        this.setActionPanelVisible(false);
        if (this.location.difficulty >= 3) {
          this.plannedAttack = Math.max(0, this.plannedAttack - 1);
          this.log("Boss-Schilde aktiv: Angriff um 1 reduziert.");
        } else {
          this.log("In diesem Kampf hat der Boss keine Schilde.");
        }
        this.showContinueButton("Weiter zur Aktions-Phase →");
        break;
      case 2:
        this.hideContinueButton();
        this.setActionPanelVisible(true);
        this.log("Wähle bis zu 3 Aktionen – Karte antippen oder QR scannen.");
        this.updateActionsUi();
        break;
      case 3: {
        this.setActionPanelVisible(false);
        const dmg = Math.max(0, this.plannedAttack - this.attackReduced);
        if (dmg > 0) {
          this.playerHp = Math.max(0, this.playerHp - dmg);
          this.log(`Der Boss trifft dich für ${dmg} Schaden!`);
        } else {
          this.log("Perfekt! Der Boss-Angriff wurde komplett geblockt.");
        }
        this.renderHp();
        if (this.playerHp <= 0) {
          this.showContinueButton("Kampf verloren …");
          return;
        }
        this.showContinueButton("Weiter zur Status-Phase →");
        break;
      }
      case 4:
        this.setActionPanelVisible(false);
        this.log("Keine Status-Effekte in diesem Prototyp.");
        this.showContinueButton("Weiter zur Abwurf-Phase →");
        break;
      case 5:
        this.setActionPanelVisible(false);
        this.log("Gespielte Karten werden abgelegt.");
        this.showContinueButton("Weiter zur Zieh-Phase →");
        break;
      case 6:
        this.setActionPanelVisible(false);
        this.log("Du ziehst neue Karten – eine neue Runde beginnt gleich.");
        this.showContinueButton("Nächste Runde starten →");
        break;
    }
  },

  onContinueClick() {
    if (!this.active) return;
    if (this.phaseIndex === 2) return;

    if (this.phaseIndex === 6) {
      this.round++;
      if (this.bossHp <= 0) {
        this.end(true);
        return;
      }
      this.startRound();
      return;
    }

    this.phaseIndex++;
    this.runPhase();
  },

  useAction() {
    if (this.phaseIndex !== 2 || this.actionsLeft <= 0) return false;
    this.actionsLeft--;
    this.updateActionsUi();
    this.updateCardButtons();

    if (this.actionsLeft <= 0) {
      this.showContinueButton("Weiter zum Boss-Angriff →");
    }

    if (this.bossHp <= 0) {
      this.end(true);
      return true;
    }
    return true;
  },

  playCard(card) {
    if (this.phaseIndex !== 2) {
      this.log("Karten kannst du nur in der Aktions-Phase spielen.");
      return;
    }
    if (!this.useAction()) return;

    switch (card.type) {
      case "attack": {
        let dmg = card.value;
        if (card.subtype === "melee") dmg += this.weaponBonus;
        this.weaponBonus = 0;
        this.bossHp = Math.max(0, this.bossHp - dmg);
        this.log(`${card.name}: ${dmg} Schaden am Boss!`);
        break;
      }
      case "protection":
        this.attackReduced += card.value;
        this.log(`${card.name}: Boss-Angriff −${card.value}.`);
        break;
      case "heal":
        this.playerHp = Math.min(this.playerHpMax, this.playerHp + card.value);
        this.log(`${card.name}: +${card.value} Lebenspunkte.`);
        break;
      case "item":
        if (card.id.includes("POTION") && this.potionUsed) {
          this.log("Heiltrank wurde in diesem Kampf schon benutzt!");
          this.actionsLeft++;
          this.updateActionsUi();
          this.updateCardButtons();
          return;
        }
        if (card.id.includes("POTION")) this.potionUsed = true;
        this.playerHp = Math.min(this.playerHpMax, this.playerHp + card.value);
        this.log(`${card.name}: +${card.value} Lebenspunkte.`);
        break;
      case "weapon":
        this.weaponBonus = 2;
        this.log(`${card.name}: Nächster Nah-Angriff +2 Bonus.`);
        break;
      case "lightning":
        this.actionsLeft++;
        this.log(`${card.name}: +1 zusätzliche Aktion!`);
        this.updateActionsUi();
        this.updateCardButtons();
        break;
      default:
        this.log(`${card.name} gespielt.`);
    }
    this.renderHp();
  },

  renderPhases() {
    const bar = document.getElementById("phase-bar");
    bar.innerHTML = PHASES.map((name, i) => {
      const cls =
        i === this.phaseIndex ? "phase active" : i < this.phaseIndex ? "phase done" : "phase";
      return `<span class="${cls}">${name}</span>`;
    }).join("");
    const remaining = Math.max(0, this.plannedAttack - this.attackReduced);
    document.getElementById("battle-boss-attack").textContent =
      `Geplanter Boss-Angriff auf dich: ${remaining} (ursprünglich ${this.plannedAttack})`;
  },

  renderHp() {
    document.getElementById("battle-player-hp").textContent = String(this.playerHp);
    document.getElementById("battle-boss-hp").textContent = String(this.bossHp);
    const mapHp = document.getElementById("map-hp");
    if (mapHp) mapHp.textContent = String(this.playerHp);
  },

  updateActionsUi() {
    document.getElementById("actions-left").textContent = String(this.actionsLeft);
  },

  log(msg) {
    document.getElementById("battle-log").textContent = msg;
  },

  updateCardButtons() {
    document.querySelectorAll(".card-btn").forEach((btn) => {
      const enabled = this.phaseIndex === 2 && this.actionsLeft > 0;
      btn.disabled = !enabled;
      btn.classList.toggle("disabled", !enabled);
    });
    const scanBtn = document.getElementById("btn-scan");
    if (scanBtn) {
      scanBtn.disabled = this.phaseIndex !== 2 || this.actionsLeft <= 0;
    }
  },

  renderQuickCards() {
    const cards = Object.values(GameData.cardsById);
    const root = document.getElementById("quick-cards");
    root.innerHTML = cards
      .map((c) => {
        const img = c.image
          ? `<img class="card-btn-img" src="${c.image}" alt="" loading="lazy" />`
          : `<span class="card-btn-emoji">${c.emoji || "🃏"}</span>`;
        const val = c.value > 0 ? c.value : "★";
        return `
          <button type="button" class="card-btn" data-id="${c.id}">
            ${img}
            <span class="card-btn-name">${c.name}</span>
            <span class="card-btn-val">${val}</span>
          </button>`;
      })
      .join("");

    root.querySelectorAll(".card-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = GameData.getCard(btn.dataset.id);
        if (card) this.playCard(card);
      });
    });
    this.updateCardButtons();
  },
};

document.getElementById("btn-flee").addEventListener("click", () => Battle.flee());
document.getElementById("btn-phase-continue").addEventListener("click", () => {
  if (Battle.phaseIndex === 2 && Battle.actionsLeft <= 0) {
    Battle.phaseIndex = 3;
    Battle.hideContinueButton();
    Battle.runPhase();
  } else {
    Battle.onContinueClick();
  }
});
document.getElementById("btn-scan").addEventListener("click", () => {
  if (Battle.phaseIndex !== 2 || Battle.actionsLeft <= 0) return;
  CardScanner.open((card) => Battle.playCard(card));
});

window.Battle = Battle;
