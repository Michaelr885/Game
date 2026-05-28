const GameData = {
  locations: [],
  cardsById: {},
  campaign: { defeated: [] },

  async load() {
    const [locations, cards] = await Promise.all([
      fetch("data/locations.json").then((r) => r.json()),
      fetch("data/cards.json").then((r) => r.json()),
    ]);
    this.locations = locations;
    cards.forEach((c) => {
      this.cardsById[c.id] = c;
    });
    this.loadCampaign();
    this.applyUnlocks();
  },

  loadCampaign() {
    try {
      const raw = localStorage.getItem("faerun_campaign");
      if (raw) this.campaign = JSON.parse(raw);
    } catch {
      this.campaign = { defeated: [] };
    }
  },

  saveCampaign() {
    localStorage.setItem("faerun_campaign", JSON.stringify(this.campaign));
    this.applyUnlocks();
  },

  applyUnlocks() {
    const defeated = new Set(this.campaign.defeated);
    const order = this.locations.map((l) => l.id);
    this.locations.forEach((loc, i) => {
      if (loc.id === "start") {
        loc.unlocked = true;
        return;
      }
      const prevId = order[i - 1];
      loc.unlocked = defeated.has(prevId) || defeated.has(loc.id);
    });
  },

  isDefeated(id) {
    return this.campaign.defeated.includes(id);
  },

  defeatLocation(id) {
    if (!this.campaign.defeated.includes(id)) {
      this.campaign.defeated.push(id);
      this.saveCampaign();
    }
  },

  getCard(id) {
    return this.cardsById[id] || null;
  },

  placesProgress() {
    const total = this.locations.length;
    const done = this.campaign.defeated.length;
    return { done, total };
  },
};

window.GameData = GameData;
