const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("places-count");
const loadStatusEl = document.getElementById("load-status");
const btnStart = document.getElementById("btn-start");
const screenStart = document.getElementById("screen-start");
const mapActions = document.getElementById("map-actions");
const locationHint = document.getElementById("location-hint");
const btnFight = document.getElementById("btn-fight");
const btnRestart = document.getElementById("btn-restart");
const mapPicker = document.getElementById("map-picker");

const HEX = 26;
const SQRT3 = Math.sqrt(3);
const mapImg = new Image();
const heroImg = new Image();

const MAP_ASSETS = {
  faerun: ["assets/karte.webp", "assets/karte.jpg"],
  kinder: [
    "assets/karte-kinder.webp",
    "assets/karte-kinder.jpg",
    "assets/karte-kinder.svg",
  ],
};

const DIRS = [
  { q: 1, r: 0, keys: ["ArrowRight", "d", "D"] },
  { q: 1, r: -1, keys: ["e", "E"] },
  { q: 0, r: -1, keys: ["ArrowUp", "w", "W"] },
  { q: -1, r: 0, keys: ["ArrowLeft", "a", "A"] },
  { q: -1, r: 1, keys: ["q", "Q"] },
  { q: 0, r: 1, keys: ["ArrowDown", "s", "S"] },
];

const MapGame = {
  W: 0,
  H: 0,
  grid: { cols: 0, rows: 0, originX: 0, originY: 0 },
  player: { q: 0, r: 0 },
  running: false,
  paused: false,
  moveCooldown: 0,
  zoom: 1,
  cam: { x: 0, y: 0 },
  assetsReady: false,
  pendingMove: null,
  message: "",

  async init() {
    setLoadStatus("Daten werden geladen …", false);
    if (btnStart) btnStart.disabled = true;
    try {
      await GameData.load();
      this.syncMapPicker();
      await this.loadMapWithFallback();
      await this.loadImage(heroImg, [
        "assets/aaaaGemini_Generated_Image_6ettsz6ettsz6ett.webp",
        "assets/aaaaGemini_Generated_Image_6ettsz6ettsz6ett.png",
      ]);
      this.assetsReady = true;
      this.buildGrid();
      this.resetMap();
      this.syncCampaignHud();
      setLoadStatus("", true);
      if (btnStart) btnStart.disabled = false;
      this.render();
    } catch (err) {
      console.error("Spielstart:", err);
      setLoadStatus(err?.message || "Fehler beim Laden. Seite neu laden.", false);
      if (btnStart) btnStart.disabled = true;
    }
  },

  async loadMapWithFallback() {
    try {
      await this.reloadMapAssets();
    } catch (err) {
      if (GameData.mapId !== "kinder") throw err;
      console.warn("Abenteuerland nicht geladen, wechsle zu Faerûn:", err);
      await GameData.setMap("faerun");
      this.syncMapPicker();
      await this.reloadMapAssets();
      this.logMessage("Abenteuerland noch nicht bereit – Faerûn wird angezeigt.");
    }
  },

  syncMapPicker() {
    if (!mapPicker) return;
    mapPicker.querySelectorAll('input[name="map"]').forEach((input) => {
      input.checked = input.value === GameData.mapId;
    });
  },

  async reloadMapAssets() {
    const sources = MAP_ASSETS[GameData.mapId] || MAP_ASSETS.faerun;
    await this.loadImage(mapImg, sources);
    if (this.assetsReady) {
      this.buildGrid();
      this.fitZoomToScreen();
      this.centerCamera();
    }
  },

  async changeMap(mapId) {
    if (mapId === GameData.mapId) return;
    const prevMapId = GameData.mapId;
    const wasRunning = this.running;
    this.running = false;
    this.assetsReady = false;
    setLoadStatus("Karte wird gewechselt …", false);
    if (btnStart) btnStart.disabled = true;
    try {
      await GameData.setMap(mapId);
      this.syncMapPicker();
      await this.reloadMapAssets();
      this.assetsReady = true;
      this.resetMap();
      this.syncCampaignHud();
      if (wasRunning) {
        screenStart.classList.remove("active");
        this.running = true;
        this.updateMapActions();
      } else {
        screenStart.classList.add("active");
      }
      setLoadStatus("", true);
      this.render();
    } catch (err) {
      console.error("Kartenwechsel:", err);
      try {
        await GameData.setMap(prevMapId);
        await this.reloadMapAssets();
        this.assetsReady = true;
        this.syncMapPicker();
        this.resetMap();
        this.syncCampaignHud();
        this.render();
      } catch (rollbackErr) {
        console.error("Rollback fehlgeschlagen:", rollbackErr);
        this.assetsReady = false;
      }
      setLoadStatus(
        err?.message || "Kartenwechsel fehlgeschlagen. Bitte Seite neu laden.",
        false
      );
    } finally {
      if (btnStart) btnStart.disabled = !this.assetsReady;
    }
  },

  restartCampaign() {
    if (
      !confirm(
        "Wirklich neu starten? Alle besiegten Bosse auf dieser Karte werden zurückgesetzt."
      )
    ) {
      return;
    }
    GameData.resetCampaign();
    Battle.playerHp = Battle.playerHpMax;
    const mapHp = document.getElementById("map-hp");
    if (mapHp) mapHp.textContent = String(Battle.playerHpMax);
    this.resetMap();
    this.syncCampaignHud();
    this.running = false;
    screenStart.classList.add("active");
    mapActions.classList.add("hidden");
    this.logMessage("Neues Abenteuer – viel Erfolg!");
    this.render();
  },

  loadImage(img, sources) {
    return new Promise((resolve, reject) => {
      const list = sources.filter(Boolean);
      if (!list.length) {
        reject(new Error("Keine Karten-Dateien konfiguriert."));
        return;
      }
      let i = 0;
      const tryNext = () => {
        if (i >= list.length) {
          reject(new Error(`Karte konnte nicht geladen werden (${list.join(", ")})`));
          return;
        }
        const src = list[i++];
        const probe = new Image();
        probe.onload = () => {
          img.src = src;
          resolve(img);
        };
        probe.onerror = tryNext;
        probe.src = src;
      };
      tryNext();
    });
  },

  buildGrid() {
    const marginX = 80;
    const marginY = 60;
    const usableW = mapImg.naturalWidth - marginX * 2;
    const usableH = mapImg.naturalHeight - marginY * 2;
    this.grid.cols = Math.max(1, Math.floor(usableW / (SQRT3 * HEX)) - 1);
    this.grid.rows = Math.max(1, Math.floor(usableH / ((3 / 2) * HEX)) - 1);
    this.grid.originX = marginX + HEX;
    this.grid.originY = marginY + HEX;
  },

  resetMap() {
    const start = GameData.locations.find((l) => l.id === "start") || GameData.locations[0];
    this.player.q = start?.q ?? Math.floor(this.grid.cols / 2);
    this.player.r = start?.r ?? Math.floor(this.grid.rows / 2);
    this.fitZoomToScreen();
    this.centerCamera();
    this.updateMapActions();
  },

  syncCampaignHud() {
    const { done, total } = GameData.placesProgress();
    if (scoreEl) scoreEl.textContent = `${done}/${total}`;
    GameData.applyUnlocks();
  },

  logMessage(msg) {
    this.message = msg;
    setTimeout(() => {
      if (this.message === msg) this.message = "";
    }, 4000);
  },

  setPaused(p) {
    this.paused = p;
  },

  getLocationAt(q, r) {
    return GameData.locations.find((l) => l.q === q && l.r === r);
  },

  axialToPixel(q, r) {
    const x = HEX * (SQRT3 * q + (SQRT3 / 2) * r) + this.grid.originX;
    const y = HEX * ((3 / 2) * r) + this.grid.originY;
    return { x, y };
  },

  pixelToAxial(x, y) {
    const px = x - this.grid.originX;
    const py = y - this.grid.originY;
    const r = ((2 / 3) * py) / HEX;
    const q = px / (SQRT3 * HEX) - r / 2;
    return this.axialRound(q, r);
  },

  axialRound(q, r) {
    let x = q;
    let z = r;
    let y = -x - z;
    let rx = Math.round(x);
    let ry = Math.round(y);
    let rz = Math.round(z);
    const xd = Math.abs(rx - x);
    const yd = Math.abs(ry - y);
    const zd = Math.abs(rz - z);
    if (xd > yd && xd > zd) rx = -ry - rz;
    else if (yd > zd) ry = -rx - rz;
    else rz = -rx - ry;
    return { q: rx, r: rz };
  },

  inBounds(q, r) {
    return q >= 0 && r >= 0 && q < this.grid.cols && r < this.grid.rows;
  },

  hexDistance(q1, r1, q2, r2) {
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;
    return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
  },

  fitZoomToScreen() {
    if (!mapImg.naturalWidth || !this.W) return;
    const scaleX = this.W / mapImg.naturalWidth;
    const scaleY = this.H / mapImg.naturalHeight;
    this.zoom = Math.max(scaleX, scaleY);
  },

  resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    if (cssW < 2 || cssH < 2) return;
    this.W = Math.floor(cssW * dpr);
    this.H = Math.floor(cssH * dpr);
    canvas.width = this.W;
    canvas.height = this.H;
    if (this.assetsReady) {
      this.fitZoomToScreen();
      this.centerCamera();
    }
  },

  clampCameraAxis(target, mapSize, viewSize) {
    if (mapSize <= viewSize) return (mapSize - viewSize) / 2;
    return Math.max(0, Math.min(mapSize - viewSize, target));
  },

  centerCamera() {
    const mapW = mapImg.naturalWidth * this.zoom;
    const mapH = mapImg.naturalHeight * this.zoom;
    const p = this.axialToPixel(this.player.q, this.player.r);
    let tx = p.x * this.zoom - this.W / 2;
    let ty = p.y * this.zoom - this.H / 2;
    this.cam.x = this.clampCameraAxis(tx, mapW, this.W);
    this.cam.y = this.clampCameraAxis(ty, mapH, this.H);
  },

  tryMove(dq, dr) {
    const nq = this.player.q + dq;
    const nr = this.player.r + dr;
    if (!this.inBounds(nq, nr)) return;
    this.player.q = nq;
    this.player.r = nr;
    this.moveCooldown = 120;
    this.centerCamera();
    this.updateMapActions();
  },

  updateMapActions() {
    const loc = this.getLocationAt(this.player.q, this.player.r);
    if (!loc || !this.running || this.paused) {
      mapActions.classList.add("hidden");
      return;
    }
    mapActions.classList.remove("hidden");
    const defeated = GameData.isDefeated(loc.id);
    if (defeated) {
      locationHint.textContent = `${loc.name} – bereits befreit ✓`;
      btnFight.disabled = true;
      btnFight.textContent = "✓ Besiegt";
    } else if (!loc.unlocked) {
      locationHint.textContent = `${loc.name} – noch gesperrt (vorherigen Boss besiegen)`;
      btnFight.disabled = true;
    } else {
      locationHint.textContent = `${loc.name}: ${loc.description}`;
      btnFight.disabled = false;
      btnFight.textContent = `⚔️ ${loc.bossName} bekämpfen`;
    }
  },

  drawHexOutline(q, r, fill, stroke, lineW = 1) {
    const { x, y } = this.axialToPixel(q, r);
    const sx = x * this.zoom - this.cam.x;
    const sy = y * this.zoom - this.cam.y;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      const hx = sx + HEX * this.zoom * Math.cos(angle);
      const hy = sy + HEX * this.zoom * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineW;
      ctx.stroke();
    }
  },

  drawLocations() {
    const t = Date.now() / 500;
    for (const loc of GameData.locations) {
      if (!this.inBounds(loc.q, loc.r)) continue;
      const { x, y } = this.axialToPixel(loc.q, loc.r);
      const sx = x * this.zoom - this.cam.x;
      const sy = y * this.zoom - this.cam.y;
      const defeated = GameData.isDefeated(loc.id);
      const pulse = 10 + Math.sin(t + loc.q) * 3;

      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
      ctx.fillStyle = defeated
        ? "rgba(100, 200, 120, 0.85)"
        : loc.unlocked
          ? "rgba(255, 200, 80, 0.9)"
          : "rgba(120, 120, 120, 0.7)";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${Math.max(10, 11 * this.zoom)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(defeated ? "✓" : "⚑", sx, sy + 4);
      ctx.restore();
    }
  },

  drawHero() {
    const { x, y } = this.axialToPixel(this.player.q, this.player.r);
    const sx = x * this.zoom - this.cam.x;
    const sy = y * this.zoom - this.cam.y;
    const size = HEX * this.zoom * 2.4;
    const w = size * 0.85;
    const h = size * 1.15;
    ctx.drawImage(heroImg, sx - w / 2, sy - h * 0.85, w, h);
  },

  render() {
    if (!this.W || !this.H) return;
    ctx.fillStyle = "#4a7a5a";
    ctx.fillRect(0, 0, this.W, this.H);
    if (!this.assetsReady) {
      ctx.fillStyle = "#8aa4c4";
      ctx.font = "18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Karte wird geladen …", this.W / 2, this.H / 2);
      return;
    }
    ctx.drawImage(
      mapImg,
      -this.cam.x,
      -this.cam.y,
      mapImg.naturalWidth * this.zoom,
      mapImg.naturalHeight * this.zoom
    );
    if (this.running && !this.paused) {
      for (const dir of DIRS) {
        const nq = this.player.q + dir.q;
        const nr = this.player.r + dir.r;
        if (!this.inBounds(nq, nr)) continue;
        this.drawHexOutline(nq, nr, "rgba(255,220,100,0.1)", "rgba(255,220,100,0.3)", 1.2);
      }
      this.drawHexOutline(
        this.player.q,
        this.player.r,
        "rgba(100,180,255,0.15)",
        "rgba(140,200,255,0.5)",
        2
      );
    }
    this.drawLocations();
    this.drawHero();
    if (this.message) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, this.H - 56 * (window.devicePixelRatio || 1), this.W, 48 * (window.devicePixelRatio || 1));
      ctx.fillStyle = "#fff";
      ctx.font = `${14 * (window.devicePixelRatio || 1)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(this.message, this.W / 2, this.H - 28 * (window.devicePixelRatio || 1));
    }
  },

  update(dt) {
    if (!this.running || !this.assetsReady || this.paused) return;
    this.moveCooldown = Math.max(0, this.moveCooldown - dt);
    if (this.pendingMove && this.moveCooldown === 0) {
      this.tryMove(this.pendingMove.dq, this.pendingMove.dr);
      this.pendingMove = null;
    }
  },

  queueMove(dq, dr) {
    if (!this.running || this.paused || this.moveCooldown > 0) return;
    this.pendingMove = { dq, dr };
  },

  screenToMap(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) * (this.W / rect.width);
    const sy = (clientY - rect.top) * (this.H / rect.height);
    return this.pixelToAxial((sx + this.cam.x) / this.zoom, (sy + this.cam.y) / this.zoom);
  },

  handlePointer(clientX, clientY) {
    if (!this.running || this.paused) return;
    const target = this.screenToMap(clientX, clientY);
    if (this.hexDistance(this.player.q, this.player.r, target.q, target.r) === 1) {
      this.queueMove(target.q - this.player.q, target.r - this.player.r);
      return;
    }
    const loc = GameData.locations.find(
      (l) => l.q === target.q && l.r === target.r && l.unlocked
    );
    if (loc && this.hexDistance(this.player.q, this.player.r, loc.q, loc.r) <= 2) {
      this.logMessage(`Reiseziel: ${loc.name} – laufe hin!`);
    }
  },

  startGame() {
    if (!this.assetsReady) return;
    this.resetMap();
    this.running = true;
    screenStart.classList.remove("active");
    this.updateMapActions();
  },
};

function setLoadStatus(text, ready) {
  if (loadStatusEl) loadStatusEl.textContent = text;
  if (btnStart) btnStart.disabled = !ready;
}

let last = 0;
function loop(ts) {
  const dt = last ? Math.min(ts - last, 50) : 16;
  last = ts;
  MapGame.update(dt);
  MapGame.render();
  requestAnimationFrame(loop);
}

btnStart.addEventListener("click", () => MapGame.startGame());

if (mapPicker) {
  mapPicker.addEventListener("change", (e) => {
    const input = e.target.closest('input[name="map"]');
    if (input) MapGame.changeMap(input.value);
  });
}

if (btnRestart) {
  btnRestart.addEventListener("click", () => MapGame.restartCampaign());
}

btnFight.addEventListener("click", () => {
  const loc = MapGame.getLocationAt(MapGame.player.q, MapGame.player.r);
  if (loc && loc.unlocked && !GameData.isDefeated(loc.id)) Battle.start(loc);
});

canvas.addEventListener("click", (e) => MapGame.handlePointer(e.clientX, e.clientY));
canvas.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      MapGame.handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  },
  { passive: false }
);

window.addEventListener("keydown", (e) => {
  if (!MapGame.running || MapGame.paused) return;
  const dir = DIRS.find((d) => d.keys.includes(e.key));
  if (!dir) return;
  e.preventDefault();
  MapGame.queueMove(dir.q, dir.r);
});

canvas.addEventListener(
  "wheel",
  (e) => {
    if (!MapGame.assetsReady) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const minZ = (MapGame.W / mapImg.naturalWidth) * 0.85;
    const maxZ = Math.max(2.5, minZ * 2.5);
    MapGame.zoom = Math.max(minZ, Math.min(maxZ, MapGame.zoom + delta));
    MapGame.centerCamera();
  },
  { passive: false }
);

function initLayout() {
  MapGame.resizeCanvas();
}
window.addEventListener("resize", initLayout);
window.addEventListener("orientationchange", initLayout);
document.addEventListener("DOMContentLoaded", initLayout);

MapGame.init();
requestAnimationFrame(loop);
window.MapGame = MapGame;
