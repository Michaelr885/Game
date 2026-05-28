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

  runPhase() {
    this.renderPhases();
    this.renderHp();

    switch (this.phaseIndex) {
      case 0:
        this.log(`Boss plant Angriff: ${this.plannedAttack} Schaden`);
        setTimeout(() => this.nextPhase(), 600);
        break;
      case 1:
        if (this.location.difficulty >= 3) {
          this.log("Boss erhält Schilde (vereinfacht: −1 Angriff auf dich)");
          this.plannedAttack = Math.max(0, this.plannedAttack - 1);
        } else {
          this.log("Keine Boss-Schilde in diesem Kampf.");
        }
        setTimeout(() => this.nextPhase(), 500);
        break;
      case 2:
        this.log("Deine Aktionen! Karte tippen oder scannen.");
        document.getElementById("btn-end-round").classList.add("hidden");
        this.updateActionsUi();
        break;
      case 3: {
        const dmg = Math.max(0, this.plannedAttack - this.attackReduced);
        if (dmg > 0) {
          this.playerHp = Math.max(0, this.playerHp - dmg);
          this.log(`Boss greift an: ${dmg} Schaden!`);
        } else {
          this.log("Boss-Angriff komplett geblockt!");
        }
        this.renderHp();
        if (this.playerHp <= 0) {
          setTimeout(() => this.end(false), 800);
          return;
        }
        setTimeout(() => this.nextPhase(), 700);
        break;
      }
      case 4:
        this.log("Status-Phase (keine Effekte im Prototyp).");
        setTimeout(() => this.nextPhase(), 400);
        break;
      case 5:
        this.log("Abwurf-Phase: Karten weg.");
        setTimeout(() => this.nextPhase(), 400);
        break;
      case 6:
        this.log("Zieh-Phase: Bereit für nächste Runde.");
        setTimeout(() => {
          this.round++;
          if (this.bossHp <= 0) this.end(true);
          else this.startRound();
        }, 500);
        break;
    }
  },

  nextPhase() {
    if (!this.active) return;
    if (this.phaseIndex === 2) return;
    this.phaseIndex++;
    this.runPhase();
  },

  useAction() {
    if (this.phaseIndex !== 2 || this.actionsLeft <= 0) return false;
    this.actionsLeft--;
    this.updateActionsUi();
    if (this.actionsLeft <= 0) {
      document.getElementById("btn-end-round").classList.remove("hidden");
      setTimeout(() => {
        if (this.phaseIndex === 2) {
          this.phaseIndex++;
          this.runPhase();
        }
      }, 400);
    }
    if (this.bossHp <= 0) {
      this.end(true);
      return true;
    }
    return true;
  },

  playCard(card) {
    if (!this.useAction()) return;

    switch (card.type) {
      case "attack": {
        let dmg = card.value;
        if (card.subtype === "melee") dmg += this.weaponBonus;
        this.weaponBonus = 0;
        this.bossHp = Math.max(0, this.bossHp - dmg);
        this.log(`${card.name}: ${dmg} Schaden!`);
        break;
      }
      case "protection":
        this.attackReduced += card.value;
        this.log(`${card.name}: Angriff −${card.value}`);
        break;
      case "heal":
        this.playerHp = Math.min(this.playerHpMax, this.playerHp + card.value);
        this.log(`${card.name}: +${card.value} LP`);
        break;
      case "item":
        if (card.id.includes("POTION") && this.potionUsed) {
          this.log("Heiltrank schon benutzt!");
          this.actionsLeft++;
          return;
        }
        if (card.id.includes("POTION")) this.potionUsed = true;
        this.playerHp = Math.min(this.playerHpMax, this.playerHp + card.value);
        this.log(`${card.name}: +${card.value} LP`);
        break;
      case "weapon":
        this.weaponBonus = 2;
        this.log(`${card.name}: Nächster Nah-Angriff +2`);
        break;
      case "lightning":
        this.actionsLeft++;
        this.log(`${card.name}: +1 Aktion!`);
        break;
      default:
        this.log(`${card.name} gespielt.`);
    }
    this.renderHp();
  },

  renderPhases() {
    const bar = document.getElementById("phase-bar");
    bar.innerHTML = PHASES.map((name, i) => {
      const cls = i === this.phaseIndex ? "phase active" : i < this.phaseIndex ? "phase done" : "phase";
      return `<span class="${cls}">${name}</span>`;
    }).join("");
    document.getElementById("battle-boss-attack").textContent =
      `Geplanter Angriff: ${Math.max(0, this.plannedAttack - this.attackReduced)} (roh: ${this.plannedAttack})`;
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

  renderQuickCards() {
    const ids = [
      "FAERUN_MELEE_03",
      "FAERUN_SHIELD_04",
      "FAERUN_HEAL_08",
    ];
    const root = document.getElementById("quick-cards");
    root.innerHTML = ids
      .map((id) => {
        const c = GameData.getCard(id);
        if (!c) return "";
        return `<button type="button" class="card-btn" data-id="${c.id}">${c.name}<br><small>${c.value > 0 ? c.value : "★"}</small></button>`;
      })
      .join("");
    root.querySelectorAll(".card-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = GameData.getCard(btn.dataset.id);
        if (card) this.playCard(card);
      });
    });
  },
};

document.getElementById("btn-flee").addEventListener("click", () => Battle.flee());
document.getElementById("btn-scan").addEventListener("click", () => {
  CardScanner.open((card) => Battle.playCard(card));
});

window.Battle = Battle;
