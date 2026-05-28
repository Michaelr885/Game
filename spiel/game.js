const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const finalScoreEl = document.getElementById("final-score");
const screenStart = document.getElementById("screen-start");
const screenOver = document.getElementById("screen-over");
const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");

const W = canvas.width;
const H = canvas.height;

const player = {
  x: W / 2,
  y: H - 52,
  w: 72,
  h: 28,
  speed: 6,
};

let stars = [];
let score = 0;
let lives = 3;
let running = false;
let spawnTimer = 0;
let keys = { left: false, right: false };
let pointerX = null;

function resetGame() {
  stars = [];
  score = 0;
  lives = 3;
  player.x = W / 2;
  spawnTimer = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  livesEl.textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function spawnStar() {
  const size = 18 + Math.random() * 14;
  stars.push({
    x: 40 + Math.random() * (W - 80),
    y: -size,
    size,
    speed: 2.2 + Math.random() * 2.5,
    wobble: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.08,
  });
}

function drawBackground() {
  const grassY = H * 0.82;
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#7ec8ff");
  grad.addColorStop(0.55, "#d4f1ff");
  grad.addColorStop(0.82, "#b8f0a0");
  grad.addColorStop(1, "#6bc96b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#5cb85c";
  ctx.fillRect(0, grassY, W, H - grassY);

  for (let i = 0; i < 8; i++) {
    const fx = ((i * 97 + Date.now() * 0.02) % (W + 40)) - 20;
    const fy = grassY + 8 + (i % 3) * 6;
    ctx.fillStyle = "#4a9e4a";
    ctx.beginPath();
    ctx.ellipse(fx, fy, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawStar(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.wobble);

  const r = s.size;
  ctx.fillStyle = "#ffe566";
  ctx.strokeStyle = "#f5a623";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    ctx.lineTo(Math.cos(outer) * r, Math.sin(outer) * r);
    ctx.lineTo(Math.cos(inner) * r * 0.45, Math.sin(inner) * r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(-r * 0.2, -r * 0.2, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlayer() {
  const { x, y, w, h } = player;
  const left = x - w / 2;

  ctx.fillStyle = "#8B4513";
  ctx.beginPath();
  ctx.roundRect(left, y, w, h, 6);
  ctx.fill();

  ctx.strokeStyle = "#5d2e0a";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#deb887";
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(left + 8 + i * 13, y + 4, 8, h - 8);
  }

  ctx.fillStyle = "#ff6b9d";
  ctx.beginPath();
  ctx.arc(x, y - 14, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x - 5, y - 16, 4, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 16, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#333";
  ctx.beginPath();
  ctx.arc(x - 5, y - 16, 2, 0, Math.PI * 2);
  ctx.arc(x + 7, y - 16, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 12, 6, 0.1, Math.PI - 0.1);
  ctx.stroke();
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function updatePlayer() {
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;

  if (pointerX !== null) {
    const target = pointerX;
    const diff = target - player.x;
    player.x += Math.sign(diff) * Math.min(Math.abs(diff), player.speed * 1.4);
  }

  const half = player.w / 2 + 4;
  player.x = Math.max(half, Math.min(W - half, player.x));
}

function updateStars(dt) {
  spawnTimer += dt;
  const interval = Math.max(420, 900 - score * 8);
  if (spawnTimer >= interval) {
    spawnTimer = 0;
    spawnStar();
  }

  const basket = {
    x: player.x - player.w / 2,
    y: player.y - 4,
    w: player.w,
    h: player.h + 8,
  };

  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.y += s.speed;
    s.wobble += s.spin;

    const hit = rectsOverlap(
      basket.x,
      basket.y,
      basket.w,
      basket.h,
      s.x - s.size,
      s.y - s.size,
      s.size * 2,
      s.size * 2
    );

    if (hit) {
      stars.splice(i, 1);
      score += 10;
      updateHud();
      continue;
    }

    if (s.y - s.size > H) {
      stars.splice(i, 1);
      lives -= 1;
      updateHud();
      if (lives <= 0) endGame();
    }
  }
}

function loop(timestamp) {
  if (!running) return;
  const dt = 16;
  updatePlayer();
  updateStars(dt);
  render();
  requestAnimationFrame(loop);
}

function render() {
  drawBackground();
  for (const s of stars) drawStar(s);
  drawPlayer();
}

function startGame() {
  resetGame();
  screenStart.classList.remove("active");
  screenOver.classList.remove("active");
  running = true;
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  finalScoreEl.textContent = String(score);
  screenOver.classList.add("active");
}

btnStart.addEventListener("click", startGame);
btnRestart.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
});

window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
});

function canvasToGameX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  return (clientX - rect.left) * scale;
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  pointerX = canvasToGameX(e.clientX);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.buttons) pointerX = canvasToGameX(e.clientX);
});

canvas.addEventListener("pointerup", () => {
  pointerX = null;
});

canvas.addEventListener("pointerleave", () => {
  pointerX = null;
});

render();
