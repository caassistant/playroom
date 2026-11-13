// Block Drop: a falling-blocks puzzle. Fill a whole row to clear it.
// Kid-friendly touches: a "ghost" shows where the piece will land, gentle speed-up,
// big buttons + swipes, and the game ends with a celebration, never a "GAME OVER".
import { arcadeLayout, swipes, gameLoop, roundRect, particles, popups, hudText } from './arcade-kit.js';

const COLS = 10, ROWS = 18, CELL = 32;
const BOARD_W = COLS * CELL, SIDE = 130;
const COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#8A8FA3'];
const GARBAGE = 8;
// 20 levels. goal: lines to clear (or 'bottom' = clear every grey block). fall: seconds per row at the start.
// junk: grey rows already on the board. pieces: which shapes can appear (indexes into SHAPES).
const ALL = [0, 1, 2, 3, 4, 5, 6];
const LEVELS = [
  { goal: 5, fall: 0.95, junk: 0 },
  { goal: 6, fall: 0.9, junk: 0 },
  { goal: 6, fall: 0.85, junk: 2 },
  { goal: 6, fall: 0.85, junk: 0, pieces: [0, 1], name: 'Sticks and squares only!' },
  { goal: 8, fall: 0.75, junk: 3 },
  { goal: 'bottom', fall: 0.85, junk: 5, name: 'Clear all the grey blocks!' },
  { goal: 10, fall: 0.7, junk: 2 },
  { goal: 8, fall: 0.7, junk: 0, pieces: [0, 3, 4], name: 'Only long pieces!' },
  { goal: 10, fall: 0.62, junk: 4 },
  { goal: 'bottom', fall: 0.7, junk: 7, name: 'Clear all the grey blocks!' },
  { goal: 12, fall: 0.58, junk: 3 },
  { goal: 12, fall: 0.55, junk: 0, pieces: [2, 5, 6], name: 'Twisty pieces only!' },
  { goal: 14, fall: 0.5, junk: 4 },
  { goal: 'bottom', fall: 0.6, junk: 8, name: 'Dig to the bottom!' },
  { goal: 15, fall: 0.45, junk: 5 },
  { goal: 15, fall: 0.42, junk: 2, pieces: [0, 2, 5, 6], name: 'Tricky pieces!' },
  { goal: 18, fall: 0.38, junk: 5 },
  { goal: 'bottom', fall: 0.5, junk: 10, name: 'The great dig!' },
  { goal: 20, fall: 0.34, junk: 6 },
  { goal: 25, fall: 0.3, junk: 6, name: 'Champion level!' },
];
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
  const lvl = Math.max(1, Math.min(ctx.level, LEVELS.length));
  const L = LEVELS[lvl - 1];
  const pool = L.pieces || ALL;
  let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  // Grey "junk" rows with one or two gaps each.
  for (let r = 0; r < L.junk; r++) {
    const row = Array(COLS).fill(GARBAGE);
    const gap = (r * 7 + lvl * 3) % COLS;
    row[gap] = 0;
    if ((r + lvl) % 3 === 0) row[(gap + 4) % COLS] = 0;
    board[ROWS - 1 - r] = row;
  }
  const junkLeft = () => board.reduce((n, r) => n + r.filter(v => v === GARBAGE).length, 0);
  let piece, next = randPiece(), lines = 0, score = 0, fallT = 0, over = false, flash = [], flashT = 0;
  let moveRepeat = { left: 0, right: 0, down: 0 };

  function randPiece() {
    const i = pool[(Math.random() * pool.length) | 0];
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
      score += [0, 100, 300, 500, 800][full.length];
      const msg = ['', 'Nice!', 'Double!', 'Triple!', 'SUPER!'][full.length];
      txt.add(msg, BOARD_W / 2, full[0] * CELL, '#FFD23F', 40);
      ctx.sfx.good();
      if (full.length >= 2) ctx.say(msg);
      setTimeout(() => {
        board = board.filter((_, i) => !full.includes(i));
        while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
        checkGoal();
      }, 250);
    }
    spawn();
  }
  function hardDrop() { const y = ghostY(); score += (y - piece.y) * 2; piece.y = y; ctx.sfx.whoosh(); lock(); fallT = 0; }

  let won = false;
  function endGame() {
    if (over) return;
    over = true;
    const prog = L.goal === 'bottom' ? 1 - junkLeft() / Math.max(1, L.junk * 9) : lines / L.goal;
    ctx.say(`Good try! You cleared ${lines} line${lines === 1 ? '' : 's'}!`);
    setTimeout(() => ctx.finish(prog >= 0.75 ? 2 : 1), 1800);
  }
  function checkGoal() {
    if (over) return;
    const done = L.goal === 'bottom' ? junkLeft() === 0 : lines >= L.goal;
    if (!done) return;
    over = true; won = true;
    ctx.sfx.tada();
    fx.burst(BOARD_W / 2, ROWS * CELL / 2, 60, 400);
    ctx.say(`Level ${lvl} complete! Brilliant stacking!`);
    setTimeout(() => ctx.finish(3), 1800);
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

  function speed() { return Math.max(0.12, L.fall * Math.pow(0.94, Math.floor(lines / 5))); }

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
    if (L.goal === 'bottom') {
      hudText(g, 'GREY', sx, 130, { size: 22, color: '#FFD23F' });
      hudText(g, String(junkLeft()), sx, 156, { size: 40 });
    } else {
      hudText(g, 'LINES', sx, 130, { size: 22, color: '#FFD23F' });
      hudText(g, `${lines}/${L.goal}`, sx, 156, { size: 34 });
    }
    hudText(g, 'SCORE', sx, 220, { size: 22, color: '#FFD23F' });
    hudText(g, String(score), sx, 246, { size: 30 });
    hudText(g, 'LEVEL', sx, 310, { size: 22, color: '#FFD23F' });
    hudText(g, String(lvl), sx, 336, { size: 40 });
    fx.draw(g); txt.draw(g);
    if (over) {
      g.fillStyle = 'rgba(30,24,56,.6)'; g.fillRect(0, 0, A.w, A.h);
      hudText(g, won ? 'Level done!' : `${lines} lines!`, A.w / 2, A.h / 2 - 30, { size: 44, align: 'center', color: '#FFD23F' });
    }
  }

  spawn();
  if (window.__playroomTest) window.__playroomTest.blockdrop = { win: () => { lines = typeof L.goal === 'number' ? L.goal : lines; board = board.map(r => r.map(v => v === GARBAGE ? 0 : v)); checkGoal(); } };
  ctx.instruct(L.goal === 'bottom'
    ? `Level ${lvl}! ${L.name || ''} Fill rows to clear away all the grey blocks.`
    : `Level ${lvl}! ${L.name ? L.name + ' ' : ''}Clear ${L.goal} lines. Fill a whole row to make it disappear!`);
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); };
}
