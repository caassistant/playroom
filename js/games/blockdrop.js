// Block Drop: a falling-blocks puzzle. Fill a whole row to clear it.
// Kid-friendly touches: a "ghost" shows where the piece will land, gentle speed-up,
// big buttons + swipes, and the game ends with a celebration, never a "GAME OVER".
import { arcadeLayout, swipes, gameLoop, roundRect, particles, popups, hudText } from './arcade-kit.js';

const COLS = 10, ROWS = 18, CELL = 32;
const BOARD_W = COLS * CELL, SIDE = 130;
const COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#8A8FA3'];
// Classic "marathon" play: no level map. Start at level 1; every 10 lines the level goes up
// and the blocks fall faster. Play continues until the stack reaches the top.
const LINES_PER_LEVEL = 10;
const fallFor = lvl => Math.max(0.06, 0.85 * Math.pow(0.84, lvl - 1));   // seconds per row
const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[0, 1, 0], [1, 1, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[0, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [0, 1, 1]],
];

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const A = arcadeLayout(ctx.stage, {
    w: BOARD_W + SIDE, h: ROWS * CELL,
    left: [[{ id: 'rot', label: '⟳', color: '#FFD23F' }], [{ id: 'left', label: '◀' }, { id: 'right', label: '▶' }]],
    right: [[{ id: 'drop', label: '⤓', color: '#FF9F1C' }], [{ id: 'down', label: '▼' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();
  let lvl = 1;
  const p = ctx.profile;
  p.hiscore = p.hiscore || {};
  const best = p.hiscore.blockdrop || 0;
  let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  // "Bag" randomiser like the classic games: every piece shape once per 7, in a shuffled order.
  let bag = [];
  let piece, next = randPiece(), lines = 0, score = 0, fallT = 0, over = false, flash = [], flashT = 0;
  let moveRepeat = { left: 0, right: 0, down: 0 };

  function randPiece() {
    if (!bag.length) bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    const i = bag.pop();
    return { m: SHAPES[i].map(r => r.map(v => v ? i + 1 : 0)), x: 0, y: 0 };
  }
  function spawn() {
    piece = next; next = randPiece();
    piece.x = ((COLS - piece.m[0].length) / 2) | 0; piece.y = 0;
    if (collides(piece.m, piece.x, piece.y)) endGame();
  }
  function collides(m, x, y) {
    for (let r = 0; r < m.length; r++) for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const bx = x + c, by = y + r;
      if (bx < 0 || bx >= COLS || by >= ROWS) return true;
      if (by >= 0 && board[by][bx]) return true;
    }
    return false;
  }
  const rotate = m => m[0].map((_, c) => m.map(r => r[c]).reverse());
  function tryMove(dx, dy) {
    if (!collides(piece.m, piece.x + dx, piece.y + dy)) { piece.x += dx; piece.y += dy; return true; }
    return false;
  }
  function tryRotate() {
    const m = rotate(piece.m);
    for (const k of [0, -1, 1, -2, 2]) if (!collides(m, piece.x + k, piece.y)) { piece.m = m; piece.x += k; ctx.sfx.tap(); return; }
  }
  function ghostY() { let y = piece.y; while (!collides(piece.m, piece.x, y + 1)) y++; return y; }
  function lock() {
    piece.m.forEach((r, ri) => r.forEach((v, ci) => { if (v && piece.y + ri >= 0) board[piece.y + ri][piece.x + ci] = v; }));
    ctx.sfx.flip();
    const full = [];
    board.forEach((r, i) => { if (r.every(v => v)) full.push(i); });
    if (full.length) {
      flash = full; flashT = 0.25;
      for (const r of full) fx.burst(BOARD_W / 2, r * CELL + CELL / 2, 30, 300);
      lines += full.length;
      score += [0, 100, 300, 500, 800][full.length] * lvl;
      const msg = ['', 'Nice!', 'Double!', 'Triple!', 'SUPER!'][full.length];
      txt.add(msg, BOARD_W / 2, full[0] * CELL, '#FFD23F', 40);
      ctx.sfx.good();
      if (full.length >= 2) ctx.say(msg);
      setTimeout(() => {
        board = board.filter((_, i) => !full.includes(i));
        while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
        const newLvl = 1 + Math.floor(lines / LINES_PER_LEVEL);
        if (newLvl > lvl) {
          lvl = newLvl;
          ctx.sfx.tada();
          txt.add(`LEVEL ${lvl}!`, BOARD_W / 2, ROWS * CELL / 2, '#FFD23F', 52);
          ctx.say(`Level ${lvl}! Faster!`);
        }
      }, 250);
    }
    spawn();
  }
  function hardDrop() { const y = ghostY(); score += (y - piece.y) * 2; piece.y = y; ctx.sfx.whoosh(); lock(); fallT = 0; }

  function endGame() {
    if (over) return;
    over = true;
    const newBest = score > best;
    if (newBest) { p.hiscore.blockdrop = score; }
    ctx.say(newBest ? `New high score! ${score} points!` : `Wow! ${lines} line${lines === 1 ? '' : 's'}, and you reached level ${lvl}!`);
    setTimeout(() => ctx.finish(lines >= 40 ? 3 : lines >= 15 ? 2 : 1, { newBest, score }), 2000);
  }

  A.onPress(id => {
    if (over || flashT > 0) return;
    if (id === 'rot' || id === 'up') tryRotate();
    if (id === 'left') { tryMove(-1, 0); moveRepeat.left = -0.18; }
    if (id === 'right') { tryMove(1, 0); moveRepeat.right = -0.18; }
    if (id === 'drop' || id === 'a') hardDrop();
  });
  swipes(A.canvas, d => {
    if (over || flashT > 0) return;
    if (d === 'tap' || d === 'up') tryRotate();
    else if (d === 'left') tryMove(-1, 0);
    else if (d === 'right') tryMove(1, 0);
    else if (d === 'down') hardDrop();
  });

  function speed() { return fallFor(lvl); }

  function update(dt) {
    fx.update(dt); txt.update(dt);
    if (flashT > 0) { flashT -= dt; return; }
    if (over) return;
    for (const k of ['left', 'right']) {
      if (A.keys[k]) { moveRepeat[k] += dt; if (moveRepeat[k] > 0.09) { moveRepeat[k] = 0; tryMove(k === 'left' ? -1 : 1, 0); } }
    }
    fallT += dt * (A.keys.down ? 8 : 1);
    if (fallT >= speed()) {
      fallT = 0;
      if (!tryMove(0, 1)) lock();
      else if (A.keys.down) score += 1;
    }
  }

  function cell(x, y, color, alpha = 1) {
    g.globalAlpha = alpha;
    g.fillStyle = color; roundRect(g, x + 2, y + 2, CELL - 4, CELL - 4, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; roundRect(g, x + 6, y + 5, CELL - 14, 7, 3); g.fill();
    g.globalAlpha = 1;
  }

  function draw() {
    g.fillStyle = '#1E1838'; g.fillRect(0, 0, A.w, A.h);
    g.fillStyle = '#2A2350'; g.fillRect(0, 0, BOARD_W, A.h);
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 1;
    for (let c = 1; c < COLS; c++) { g.beginPath(); g.moveTo(c * CELL, 0); g.lineTo(c * CELL, A.h); g.stroke(); }
    board.forEach((r, ri) => r.forEach((v, ci) => {
      if (v) cell(ci * CELL, ri * CELL, flash.includes(ri) && flashT > 0 ? '#FFFFFF' : COLORS[v - 1]);
    }));
    if (piece && !over) {
      const gy = ghostY();
      piece.m.forEach((r, ri) => r.forEach((v, ci) => { if (v) cell((piece.x + ci) * CELL, (gy + ri) * CELL, COLORS[v - 1], 0.22); }));
      piece.m.forEach((r, ri) => r.forEach((v, ci) => { if (v) cell((piece.x + ci) * CELL, (piece.y + ri) * CELL, COLORS[v - 1]); }));
    }
    // Side panel
    const sx = BOARD_W + 12;
    hudText(g, 'NEXT', sx, 12, { size: 22, color: '#FFD23F' });
    const nm = next.m, cs = 24;
    nm.forEach((r, ri) => r.forEach((v, ci) => {
      if (!v) return;
      g.fillStyle = COLORS[v - 1]; roundRect(g, sx + 6 + ci * cs, 50 + ri * cs, cs - 3, cs - 3, 5); g.fill();
    }));
    hudText(g, 'LEVEL', sx, 128, { size: 22, color: '#FFD23F' });
    hudText(g, String(lvl), sx, 152, { size: 40 });
    hudText(g, 'LINES', sx, 212, { size: 22, color: '#FFD23F' });
    hudText(g, String(lines), sx, 236, { size: 34 });
    hudText(g, 'SCORE', sx, 292, { size: 22, color: '#FFD23F' });
    hudText(g, String(score), sx, 316, { size: 28 });
    hudText(g, 'BEST', sx, 370, { size: 22, color: '#FFD23F' });
    hudText(g, String(Math.max(best, score)), sx, 394, { size: 28 });
    // progress to the next level
    g.fillStyle = 'rgba(255,255,255,.15)'; roundRect(g, sx, 446, SIDE - 24, 12, 6); g.fill();
    g.fillStyle = '#3BB273'; roundRect(g, sx, 446, (SIDE - 24) * ((lines % LINES_PER_LEVEL) / LINES_PER_LEVEL), 12, 6); g.fill();
    fx.draw(g); txt.draw(g);
    if (over) {
      g.fillStyle = 'rgba(30,24,56,.6)'; g.fillRect(0, 0, A.w, A.h);
      hudText(g, `${lines} lines!`, A.w / 2, A.h / 2 - 30, { size: 44, align: 'center', color: '#FFD23F' });
    }
  }

  spawn();
  if (window.__playroomTest) window.__playroomTest.blockdrop = { addLines: n => { lines += n; lvl = 1 + Math.floor(lines / LINES_PER_LEVEL); }, end: () => endGame() };
  ctx.instruct('Fill a whole row to make it disappear! Every 10 lines, the blocks get faster.');
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); };
}
