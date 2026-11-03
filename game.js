// Ball Munch — game logic. See GAME-BRIEF.md.
// Core loop (#3), score and restart (#5), munch sound (#6),
// enemies, game over and play again (#9), start screen, three lives
// and a best score kept on the device (#13).

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
// appears on a phone and a laptop. They then drift and bounce (#11).
const FOOD_LAYOUT = [
  [0.15, 0.20], [0.35, 0.14], [0.58, 0.11], [0.82, 0.22],
  [0.11, 0.50], [0.30, 0.43], [0.72, 0.45], [0.88, 0.56],
  [0.18, 0.79], [0.41, 0.86], [0.65, 0.81], [0.86, 0.88],
];
const FOOD_RADIUS = 5;
const FOOD_SPEED = 1; // pixels per frame, same for every dot
const GROWTH = 1.1;

// One direction per dot, spread around the circle so the field never looks
// like a marching band. Speed is identical; only the heading differs.
const FOOD_HEADINGS = [
  0.35, 1.10, -0.55, 2.30,
  -1.90, 0.05, 1.75, -0.95,
  2.85, -2.40, 0.75, -0.20,
];

const food = [];

function resetFood() {
  food.length = 0;
  FOOD_LAYOUT.forEach(([fx, fy], i) => {
    const heading = FOOD_HEADINGS[i];
    food.push({
      fx,
      fy,
      x: fx * canvas.width,
      y: fy * canvas.height,
      r: FOOD_RADIUS,
      vx: Math.cos(heading) * FOOD_SPEED,
      vy: Math.sin(heading) * FOOD_SPEED,
    });
  });
}
resetFood();

// Drift in a straight line; bounce off the edges so every dot stays visible.
function moveFood() {
  for (const dot of food) {
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (dot.x < dot.r) {
      dot.x = dot.r;
      dot.vx = -dot.vx;
    } else if (dot.x > canvas.width - dot.r) {
      dot.x = canvas.width - dot.r;
      dot.vx = -dot.vx;
    }
    if (dot.y < dot.r) {
      dot.y = dot.r;
      dot.vy = -dot.vy;
    } else if (dot.y > canvas.height - dot.r) {
      dot.y = canvas.height - dot.r;
      dot.vy = -dot.vy;
    }
  }
}

let score = 0;

// --- Best score ------------------------------------------------------------
// Kept on the device only: no accounts, no network.
const BEST_KEY = "ballmunch.best";

function loadBest() {
  try {
    const stored = Number(window.localStorage.getItem(BEST_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch (err) {
    return 0; // storage blocked (private mode): the game still plays
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch (err) {
    /* nothing to do: the score still shows for this session */
  }
}

let best = loadBest();

// --- Lives -----------------------------------------------------------------
const START_LIVES = 3;
const INVULNERABLE_FRAMES = 90; // about 1.5 s to get clear after a hit
let lives = START_LIVES;
let invulnerable = 0;

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

// start screen -> playing -> over
let phase = "start";

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
  if (phase !== "playing") return;
  if (invulnerable > 0) invulnerable -= 1;

  for (const enemy of enemies) {
    moveEnemy(enemy);
    if (invulnerable === 0 && touchesEnemy(enemy)) {
      loseLife();
      return;
    }
  }

  moveFood();

  for (let i = food.length - 1; i >= 0; i--) {
    if (eats(food[i])) {
      food.splice(i, 1);
      player.r *= GROWTH;
      score += 1;
      if (score > best) {
        best = score;
        saveBest(best);
      }
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

  // Blink while invulnerable so a hit is visible.
  const visible = invulnerable === 0 || Math.floor(invulnerable / 6) % 2 === 0;
  if (visible) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = "#f4f4f7";
    ctx.fill();
  }

  drawHud();

  if (phase === "start") drawStartScreen();
  if (phase === "over") drawGameOver();
}

function drawHud() {
  ctx.fillStyle = "#cfcfd6";
  ctx.font = "16px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Score: " + score, 16, 30);
  ctx.fillStyle = "#8c8c96";
  ctx.fillText("Best: " + best, 16, 54);

  // Lives as dots, top-right.
  for (let i = 0; i < START_LIVES; i++) {
    const cx = canvas.width - 24 - i * 26;
    ctx.beginPath();
    ctx.arc(cx, 28, 7, 0, Math.PI * 2);
    ctx.fillStyle = i < lives ? "#7ee0c4" : "#33333c";
    ctx.fill();
  }
}

function startButtonRect() {
  const w = 220;
  const h = 56;
  return { x: (canvas.width - w) / 2, y: canvas.height / 2 + 40, w, h };
}

function insideButton(b, event) {
  return event.clientX >= b.x && event.clientX <= b.x + b.w &&
         event.clientY >= b.y && event.clientY <= b.y + b.h;
}

function drawStartScreen() {
  ctx.fillStyle = "rgba(8, 8, 12, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f4f4f7";
  ctx.font = "600 40px system-ui, -apple-system, sans-serif";
  ctx.fillText("Ball Munch", canvas.width / 2, canvas.height / 2 - 70);

  ctx.fillStyle = "#cfcfd6";
  ctx.font = "18px system-ui, -apple-system, sans-serif";
  ctx.fillText("Eat the small green dots. Avoid the big red ones.",
               canvas.width / 2, canvas.height / 2 - 24);

  const b = startButtonRect();
  ctx.fillStyle = "#f4f4f7";
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = "#0b0b10";
  ctx.font = "600 18px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("Start", canvas.width / 2, b.y + b.h / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

const playAgainRect = startButtonRect;

function drawGameOver() {
  ctx.fillStyle = "rgba(8, 8, 12, 0.82)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.fillStyle = "#f4f4f7";
  ctx.font = "600 34px system-ui, -apple-system, sans-serif";
  ctx.fillText("Game over", canvas.width / 2, canvas.height / 2 - 30);

  ctx.fillStyle = "#cfcfd6";
  ctx.font = "20px system-ui, -apple-system, sans-serif";
  ctx.fillText("Score: " + score + "    Best: " + best,
               canvas.width / 2, canvas.height / 2 + 8);

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

// A clean game: ball, food, score, lives and enemies. Best is never reset.
function resetRound() {
  score = 0;
  lives = START_LIVES;
  invulnerable = 0;
  player.r = 20;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  resetFood();
  resetEnemies();
}

function startGame() {
  resetRound();
  phase = "playing";
}

// A hit costs a life. The ball shrinks back and the score stays; a short
// spell without collisions stops the same enemy taking every life at once.
function loseLife() {
  lives -= 1;
  player.r = 20;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  invulnerable = INVULNERABLE_FRAMES;
  if (lives <= 0) {
    phase = "over";
    if (score > best) {
      best = score;
      saveBest(best);
    }
  }
}

// Start screen: only the Start button begins. Playing: a click or tap
// anywhere restarts. Game over: only Play again does.
canvas.addEventListener("pointerdown", (event) => {
  if (phase === "start") {
    if (insideButton(startButtonRect(), event)) startGame();
    return;
  }
  if (phase === "over") {
    if (insideButton(playAgainRect(), event)) startGame();
    return;
  }
  startGame();
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
    dot.x = Math.min(Math.max(dot.x, dot.r), canvas.width - dot.r);
    dot.y = Math.min(Math.max(dot.y, dot.r), canvas.height - dot.r);
  }
  clampPlayer();
});
