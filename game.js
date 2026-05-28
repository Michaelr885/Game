const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const stageEl = document.querySelector(".stage");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const finalScoreEl = document.getElementById("final-score");
const screenStart = document.getElementById("screen-start");
const screenOver = document.getElementById("screen-over");
const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");

let W = 0;
let H = 0;
const HEX = 26;
const SQRT3 = Math.sqrt(3);

const mapImg = new Image();
const heroImg = new Image();
mapImg.src = "assets/karte.png";
heroImg.src = "assets/aaaaGemini_Generated_Image_6ettsz6ettsz6ett.png";

const DIRS = [
  { q: 1, r: 0, keys: ["ArrowRight", "d", "D"] },
  { q: 1, r: -1, keys: ["e", "E"] },
  { q: 0, r: -1, keys: ["ArrowUp", "w", "W"] },
  { q: -1, r: 0, keys: ["ArrowLeft", "a", "A"] },
  { q: -1, r: 1, keys: ["q", "Q"] },
  { q: 0, r: 1, keys: ["ArrowDown", "s", "S"] },
];

function hexDistance(q1, r1, q2, r2) {
  const s1 = -q1 - r1;
  const s2 = -q2 - r2;
  return Math.max(Math.abs(q1 - q2), Math.abs(r1 - r2), Math.abs(s1 - s2));
}

let grid = { cols: 0, rows: 0, originX: 0, originY: 0 };
let player = { q: 0, r: 0 };
let stars = [];
let score = 0;
let lives = 3;
let running = false;
let moveCooldown = 0;
let starTimer = 0;
let zoom = 1;
let cam = { x: 0, y: 0 };
let assetsReady = 0;
let pendingMove = null;

function axialToPixel(q, r) {
  const x = HEX * (SQRT3 * q + (SQRT3 / 2) * r) + grid.originX;
  const y = HEX * ((3 / 2) * r) + grid.originY;
  return { x, y };
}

function pixelToAxial(x, y) {
  const px = x - grid.originX;
  const py = y - grid.originY;
  const r = ((2 / 3) * py) / HEX;
  const q = (px / (SQRT3 * HEX)) - r / 2;
  return axialRound(q, r);
}

function axialRound(q, r) {
  let x = q;
  let z = r;
  let y = -x - z;
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);
  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);
  if (xDiff > yDiff && xDiff > zDiff) rx = -ry - rz;
  else if (yDiff > zDiff) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}

function inBounds(q, r) {
  return q >= 0 && r >= 0 && q < grid.cols && r < grid.rows;
}

function buildGrid() {
  const marginX = 80;
  const marginY = 60;
  const usableW = mapImg.naturalWidth - marginX * 2;
  const usableH = mapImg.naturalHeight - marginY * 2;
  grid.cols = Math.floor(usableW / (SQRT3 * HEX)) - 1;
  grid.rows = Math.floor(usableH / ((3 / 2) * HEX)) - 1;
  grid.originX = marginX + HEX;
  grid.originY = marginY + HEX;
}

function fitZoomToScreen() {
  if (!mapImg.naturalWidth || !W) return;
  const scaleX = W / mapImg.naturalWidth;
  const scaleY = H / mapImg.naturalHeight;
  zoom = Math.max(scaleX, scaleY);
}

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;
  if (cssW < 2 || cssH < 2) return;

  W = Math.floor(cssW * dpr);
  H = Math.floor(cssH * dpr);
  canvas.width = W;
  canvas.height = H;

  if (assetsReady >= 2) {
    fitZoomToScreen();
    centerCamera();
  }
}

function resetGame() {
  player.q = Math.floor(grid.cols / 2);
  player.r = Math.floor(grid.rows / 2);
  stars = [];
  score = 0;
  lives = 3;
  starTimer = 0;
  moveCooldown = 0;
  fitZoomToScreen();
  spawnStar();
  updateHud();
  centerCamera();
}

function updateHud() {
  scoreEl.textContent = String(score);
  livesEl.textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function spawnStar() {
  if (stars.length >= 4) return;
  let tries = 0;
  while (tries < 40) {
    const q = Math.floor(Math.random() * grid.cols);
    const r = Math.floor(Math.random() * grid.rows);
    const taken =
      (player.q === q && player.r === r) ||
      stars.some((s) => s.q === q && s.r === r);
    if (!taken) {
      stars.push({ q, r, pulse: Math.random() * Math.PI * 2 });
      return;
    }
    tries++;
  }
}

function tryMove(dq, dr) {
  const nq = player.q + dq;
  const nr = player.r + dr;
  if (!inBounds(nq, nr)) return;
  player.q = nq;
  player.r = nr;
  moveCooldown = 140;

  for (let i = stars.length - 1; i >= 0; i--) {
    if (stars[i].q === player.q && stars[i].r === player.r) {
      stars.splice(i, 1);
      score += 10;
      updateHud();
      spawnStar();
    }
  }
  centerCamera();
}

function centerCamera() {
  const p = axialToPixel(player.q, player.r);
  cam.x = p.x * zoom - W / 2;
  cam.y = p.y * zoom - H / 2;
  const maxX = mapImg.naturalWidth * zoom - W;
  const maxY = mapImg.naturalHeight * zoom - H;
  cam.x = Math.max(0, Math.min(maxX, cam.x));
  cam.y = Math.max(0, Math.min(maxY, cam.y));
}

function drawHexOutline(q, r, fill, stroke, lineW = 1) {
  const { x, y } = axialToPixel(q, r);
  const sx = x * zoom - cam.x;
  const sy = y * zoom - cam.y;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const hx = sx + HEX * zoom * Math.cos(angle);
    const hy = sy + HEX * zoom * Math.sin(angle);
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
}

function drawMap() {
  ctx.fillStyle = "#4a7a5a";
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(
    mapImg,
    -cam.x,
    -cam.y,
    mapImg.naturalWidth * zoom,
    mapImg.naturalHeight * zoom
  );
}

function drawGridHints() {
  const { q, r } = player;
  for (const dir of DIRS) {
    const nq = q + dir.q;
    const nr = r + dir.r;
    if (!inBounds(nq, nr)) continue;
    drawHexOutline(nq, nr, "rgba(255, 220, 100, 0.12)", "rgba(255, 220, 100, 0.35)", 1.5);
  }
  drawHexOutline(q, r, "rgba(100, 180, 255, 0.18)", "rgba(140, 200, 255, 0.55)", 2);
}

function drawStar(s) {
  const { x, y } = axialToPixel(s.q, s.r);
  const sx = x * zoom - cam.x;
  const sy = y * zoom - cam.y;
  s.pulse += 0.08;
  const glow = 14 + Math.sin(s.pulse) * 4;

  ctx.save();
  ctx.shadowColor = "#ffe566";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#ffe566";
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    ctx.lineTo(sx + Math.cos(outer) * glow, sy + Math.sin(outer) * glow);
    ctx.lineTo(sx + Math.cos(inner) * glow * 0.45, sy + Math.sin(inner) * glow * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHero() {
  const { x, y } = axialToPixel(player.q, player.r);
  const sx = x * zoom - cam.x;
  const sy = y * zoom - cam.y;
  const size = HEX * zoom * 2.4;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(sx, sy + size * 0.35, size * 0.45, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();
  ctx.restore();

  const w = size * 0.85;
  const h = size * 1.15;
  ctx.drawImage(heroImg, sx - w / 2, sy - h * 0.85, w, h);
}

function render() {
  ctx.fillStyle = "#0f1824";
  ctx.fillRect(0, 0, W, H);
  if (assetsReady < 2) {
    ctx.fillStyle = "#8aa4c4";
    ctx.font = "18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Karte wird geladen …", W / 2, H / 2);
    return;
  }
  drawMap();
  if (running) drawGridHints();
  for (const s of stars) drawStar(s);
  drawHero();
}

function update(dt) {
  if (!running || assetsReady < 2) return;

  moveCooldown = Math.max(0, moveCooldown - dt);

  if (pendingMove && moveCooldown === 0) {
    tryMove(pendingMove.dq, pendingMove.dr);
    pendingMove = null;
  }

  starTimer += dt;
  if (starTimer >= 12000) {
    starTimer = 0;
    if (stars.length > 0) {
      stars.shift();
      lives -= 1;
      updateHud();
      if (stars.length === 0) spawnStar();
      if (lives <= 0) endGame();
    }
  }
}

let last = 0;
function loop(ts) {
  const dt = last ? Math.min(ts - last, 50) : 16;
  last = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function queueMove(dq, dr) {
  if (!running || moveCooldown > 0) return;
  pendingMove = { dq, dr };
}

function screenToMap(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const sx = (clientX - rect.left) * scaleX;
  const sy = (clientY - rect.top) * scaleY;
  const mx = (sx + cam.x) / zoom;
  const my = (sy + cam.y) / zoom;
  return pixelToAxial(mx, my);
}

function startGame() {
  if (assetsReady < 2) return;
  resetGame();
  screenStart.classList.remove("active");
  screenOver.classList.remove("active");
  running = true;
}

function endGame() {
  running = false;
  finalScoreEl.textContent = String(score);
  screenOver.classList.add("active");
}

function onAssetLoad() {
  assetsReady += 1;
  if (assetsReady === 2) {
    resizeCanvas();
    buildGrid();
    resetGame();
    render();
  }
}

mapImg.onload = onAssetLoad;
heroImg.onload = onAssetLoad;
mapImg.onerror = heroImg.onerror = () => {
  assetsReady = 2;
  render();
};

btnStart.addEventListener("click", startGame);
btnRestart.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => {
  if (!running) return;
  const dir = DIRS.find((d) => d.keys.includes(e.key));
  if (!dir) return;
  e.preventDefault();
  queueMove(dir.q, dir.r);
});

canvas.addEventListener("click", (e) => {
  if (!running) return;
  const target = screenToMap(e.clientX, e.clientY);
  if (hexDistance(player.q, player.r, target.q, target.r) !== 1) return;
  queueMove(target.q - player.q, target.r - player.r);
});

canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const minZoom = W / mapImg.naturalWidth * 0.85;
    const maxZoom = Math.max(2.5, minZoom * 2.5);
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom + delta));
    centerCamera();
  },
  { passive: false }
);

function initLayout() {
  resizeCanvas();
  if (assetsReady >= 2) render();
}

window.addEventListener("resize", initLayout);
window.addEventListener("orientationchange", initLayout);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLayout);
} else {
  initLayout();
}
window.addEventListener("load", initLayout);

requestAnimationFrame(loop);
