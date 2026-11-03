// Ball Munch — game logic. See GAME-BRIEF.md.
// Ticket #3: player ball, static food dots, growth on eat.
// No score, no sound, no game over yet — those are later tickets.

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

const food = FOOD_LAYOUT.map(([fx, fy]) => ({
  fx,
  fy,
  x: fx * canvas.width,
  y: fy * canvas.height,
  r: FOOD_RADIUS,
}));

function clampPlayer() {
  player.x = Math.min(Math.max(player.x, player.r), canvas.width - player.r);
  player.y = Math.min(Math.max(player.y, player.r), canvas.height - player.r);
}

function eats(dot) {
  return Math.hypot(player.x - dot.x, player.y - dot.y) < player.r + dot.r;
}

function update() {
  for (let i = food.length - 1; i >= 0; i--) {
    if (eats(food[i])) {
      food.splice(i, 1);
      player.r *= GROWTH;
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

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = "#f4f4f7";
  ctx.fill();
}

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
