# Game brief — one-page test for the superagent

**What this is:** a small browser game, built entirely through GitHub tickets, to see how the
superagent behaves. It is a test, not a product.

## The game

Ball Munch. You are a ball on one screen. Smaller balls are food: eat them and you grow.
Bigger balls are enemies: touch one and the game ends. Score goes up with every bite.

- One screen, no levels, no menu.
- Works on a phone in a browser; no install.
- Portrait or landscape, fits the screen without scrolling.

## Rules of play

1. You start as a ball of radius 20 in the middle of the screen.
2. Food balls drift slowly and are smaller than you. Eating one removes it, grows you 10%, and
   adds 1 to the score.
3. Enemy balls are bigger than you and drift. Touching one ends the game.
4. Any ball that leaves the screen comes back on the opposite side.
5. When the game ends, a score and a "Play again" button appear. Play again resets everything.
6. A short sound plays when you eat. No sound files — the browser makes the tone.
7. Score is shown top-left at all times.

## What "working" means

A person opens the page on a phone and can play for a minute without a bug: the ball follows
the finger, food disappears when eaten, the ball grows, the score is right, an enemy ends the
game, and Play again starts a clean game.

## Out of scope

No accounts, no saving scores, no leaderboard, no multiplayer, no internet calls, no ads, no
images or fonts from the web, no build step, no frameworks, no package installs.

## How the code is kept

Exactly two files in the repo root:

- `index.html` — the page, styles and canvas.
- `game.js` — all the game logic, loaded by the page.

Plain JavaScript in the browser. Nothing else. If a ticket seems to need a third file or a
library, stop and ask instead.

## How work arrives

One GitHub issue per ticket. Each ticket is small, self-contained, and testable by hand. The
agent works it on its own branch, opens a pull request, and says what changed.

The game is built in steps, so a ticket may ask for a smaller piece than this brief describes,
and may say "that comes later". Follow the ticket; the brief is the end state.

If a request is vague or needs a design decision, the correct response is one short question,
not code.
