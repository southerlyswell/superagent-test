// Ball Munch — game logic. See GAME-BRIEF.md.
// Core loop (#3), score and restart (#5), munch sound (#6),
// enemies, game over and play again (#9).

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function sizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
sizeCanvas();

// Player: radius 20, centred on the screen.
const player = { x: canvas.width / 2, y: canvas.height / 2, r: 20 };

// Food: fixed positions, given as fractions of the screen so the same layout
// appears on a phone and a laptop. Static — they never move.
const FOOD_LAYOUT = [
  [0.15, 0.20], [0.35, 0.14], [0.58, 0.11], [0.82, 0.22],
  [0.11, 0.50], [0.30, 0.43], [0.72, 0.45], [0.88, 0.56],
  [0.18, 0.79], [0.41, 0.86], [0.65, 0.81], [0.86, 0.88],
];
const FOOD_RADIUS = 5;
const GROWTH = 1.1;

const food = [];

function resetFood() {
  food.length = 0;
  for (const [fx, fy] of FOOD_LAYOUT) {
    food.push({ fx, fy, x: fx * canvas.width, y: fy * canvas.height, r: FOOD_RADIUS });
  }
}
resetFood();

let score = 0;

// --- Enemies ---------------------------------------------------------------
// Three larger balls drifting slowly. Touching one ends the game.
const ENEMY_RADIUS = 40;
const ENEMY_SPEED = 0.7;
// Placed clear of the food dots and of the player's starting spot, so the
// first bite is never a death.
const ENEMY_START = [
  [0.50, 0.35],
  [0.85, 0.42],
  [0.50, 0.88],
];

let enemies = [];
let gameOver = false;

function resetEnemies() {
  enemies = ENEMY_START.map(([fx, fy], i) => ({
    x: fx * canvas.width,
    y: fy * canvas.height,
    r: ENEMY_RADIUS,
    vx: i % 2 === 0 ? ENEMY_SPEED : -ENEMY_SPEED,
    vy: i === 1 ? ENEMY_SPEED : -ENEMY_SPEED * 0.6,
  }));
}
resetEnemies();

function moveEnemy(e) {
  e.x += e.vx;
  e.y += e.vy;
  // Anything leaving the screen comes back on the opposite side.
  if (e.x < -e.r) e.x = canvas.width + e.r;
  if (e.x > canvas.width + e.r) e.x = -e.r;
  if (e.y < -e.r) e.y = canvas.height + e.r;
  if (e.y > canvas.height + e.r) e.y = -e.r;
}

function touchesEnemy(e) {
  return Math.hypot(player.x - e.x, player.y - e.y) < player.r + e.r;
}

// --- Sound -----------------------------------------------------------------
// Made with the browser's audio API: no files, no library.
// Browsers keep audio blocked until the user touches the page, so the
// context is created on the first click/tap and stays silent before that.
let audio = null;

function ensureAudio() {
  if (!audio) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    audio = new AudioCtor();
  }
  if (audio.state === "suspended") audio.resume();
}

canvas.addEventListener("pointerdown", ensureAudio);

function playMunch() {
  if (!audio || audio.state !== "running") return;
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(540, now);
  osc.frequency.exponentialRampToValueAtTime(190, now + 0.08);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.11);
}

function clampPlayer() {
  player.x = Math.min(Math.max(player.x, player.r), canvas.width - player.r);
  player.y = Math.min(Math.max(player.y, player.r), canvas.height - player.r);
}

function eats(dot) {
  return Math.hypot(player.x - dot.x, player.y - dot.y) < player.r + dot.r;
}

function update() {
  if (gameOver) return;

  for (const enemy of enemies) {
    moveEnemy(enemy);
    if (touchesEnemy(enemy)) {
      gameOver = true;
      return;
    }
  }

  for (let i = food.length - 1; i >= 0; i--) {
    if (eats(food[i])) {
      food.splice(i, 1);
      player.r *= GROWTH;
      score += 1;
      playMunch();
      clampPlayer();
    }
  }
}

function draw() {
  ctx.fillStyle = "#0b0b10";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const dot of food) {
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fillStyle = "#7ee0c4";
    ctx.fill();
  }

  for (const enemy of enemies) {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
    ctx.fillStyle = "#e2657a";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = "#f4f4f7";
  ctx.fill();

  ctx.fillStyle = "#cfcfd6";
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Score: " + score, 16, 30);

  if (gameOver) drawGameOver();
}

function playAgainRect() {
  const w = 220;
  const h = 56;
  return { x: (canvas.width - w) / 2, y: canvas.height / 2 + 40, w, h };
}

function drawGameOver() {
  ctx.fillStyle = "rgba(8, 8, 12, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f4f4f7";
  ctx.font = "600 34px system-ui, -apple-system, sans-serif";
  ctx.fillText("Game over", canvas.width / 2, canvas.height / 2 - 30);

  ctx.fillStyle = "#cfcfd6";
  ctx.font = "20px system-ui, -apple-system, sans-serif";
  ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 8);

  const b = playAgainRect();
  ctx.fillStyle = "#f4f4f7";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#0b0b10";
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Play again", canvas.width / 2, b.y + b.h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Back to a clean game: ball, food, score and enemies.
function restart() {
  score = 0;
  player.r = 20;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  gameOver = false;
  resetFood();
  resetEnemies();
}

// While playing, a click or tap anywhere restarts. Once the game is over,
// only the Play again button does.
canvas.addEventListener("pointerdown", (event) => {
  if (!gameOver) {
    restart();
    return;
  }
  const b = playAgainRect();
  const x = event.clientX;
  const y = event.clientY;
  if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) restart();
});

function frame() {
  update();
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.addEventListener("resize", () => {
  sizeCanvas();
  for (const dot of food) {
    dot.x = dot.fx * canvas.width;
    dot.y = dot.fy * canvas.height;
  }
  clampPlayer();
});
