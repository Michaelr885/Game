const GameData = {
  mapId: "faerun",
  locations: [],
  cardsById: {},
  campaign: { defeated: [] },

  mapConfig() {
    return this.mapId === "kinder"
      ? {
          id: "kinder",
          label: "Abenteuerland",
          locationsUrl: "data/locations-kinder.json",
          storageKey: "faerun_campaign_kinder",
        }
      : {
          id: "faerun",
          label: "Faerûn",
          locationsUrl: "data/locations.json",
          storageKey: "faerun_campaign_faerun",
        };
  },

  loadMapPreference() {
    try {
      const saved = localStorage.getItem("faerun_map");
      if (saved === "kinder" || saved === "faerun") return saved;
    } catch {
      /* ignore */
    }
    return "faerun";
  },

  saveMapPreference() {
    localStorage.setItem("faerun_map", this.mapId);
  },

  async setMap(mapId) {
    if (mapId !== "faerun" && mapId !== "kinder") return;
    this.mapId = mapId;
    this.saveMapPreference();
    const [locations] = await Promise.all([
      fetch(this.mapConfig().locationsUrl).then((r) => r.json()),
    ]);
    this.locations = locations;
    this.loadCampaign();
    this.applyUnlocks();
  },

  async load() {
    this.mapId = this.loadMapPreference();
    const cfg = this.mapConfig();
    const [locations, cards] = await Promise.all([
      fetch(cfg.locationsUrl).then((r) => r.json()),
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
    const key = this.mapConfig().storageKey;
    try {
      let raw = localStorage.getItem(key);
      if (!raw && this.mapId === "faerun") {
        raw = localStorage.getItem("faerun_campaign");
        if (raw) {
          localStorage.setItem(key, raw);
          localStorage.removeItem("faerun_campaign");
        }
      }
      if (raw) this.campaign = JSON.parse(raw);
      else this.campaign = { defeated: [] };
    } catch {
      this.campaign = { defeated: [] };
    }
  },

  saveCampaign() {
    const key = this.mapConfig().storageKey;
    localStorage.setItem(key, JSON.stringify(this.campaign));
    this.applyUnlocks();
  },

  resetCampaign() {
    this.campaign = { defeated: [] };
    this.saveCampaign();
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
