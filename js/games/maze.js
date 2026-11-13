// Maze Muncher: Mango the cat gobbles up all the treats in the maze.
// Grumpy raincloud "Puffs" wander around; grab a ⭐ and they get sleepy so Mango can bop them home.
// Little level 1 has no Puffs at all — just explore and munch.
import { arcadeLayout, swipes, gameLoop, roundRect, particles, popups, hudText, sprite, drawStar } from './arcade-kit.js';

const MAP = [
  '###############',
  '#o.....#.....o#',
  '#.###.#.#.###.#',
  '#.............#',
  '#.#.###.###.#.#',
  '#.#...#.#...#.#',
  '#....#GGG#....#',
  '#.##.#####.##.#',
  '#......P......#',
  '#.###.#.#.###.#',
  '#...#.#.#.#...#',
  '#o..#.....#..o#',
  '###############',
];
const T = 40, HUD = 44;
const THEMES = [
  { bg: '#1C1F45', wall: '#5B4BC4', treat: '#FFE7C2' },   // night purple
  { bg: '#0E2A47', wall: '#2E86DE', treat: '#BDF1FF' },   // ocean
  { bg: '#3A1236', wall: '#E0559B', treat: '#FFE0F0' },   // candy
  { bg: '#10301F', wall: '#3BB273', treat: '#FFF3C4' },   // forest
  { bg: '#3A2410', wall: '#E08A2E', treat: '#FFF1D6' },   // desert
  { bg: '#16181F', wall: '#6B7A99', treat: '#FFD23F' },   // moon base
];

function seeded(seed) { let s = (seed * 2654435761) % 4294967296; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

// A looping ("braided") maze with a Puff home in the middle, a start spot below it and ⭐ in the corners.
function genMaze(seed, cols, rows) {
  const r = seeded(seed);
  const gr = Array.from({ length: rows }, () => Array(cols).fill('#'));
  const stack = [[1, 1]];
  gr[1][1] = '.';
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [[2, 0], [-2, 0], [0, 2], [0, -2]].map(([dx, dy]) => [x + dx, y + dy, dx, dy])
      .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < cols - 1 && ny < rows - 1 && gr[ny][nx] === '#');
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[(r() * nb.length) | 0];
    gr[y + dy / 2][x + dx / 2] = '.'; gr[ny][nx] = '.';
    stack.push([nx, ny]);
  }
  // Braid: knock out walls at dead ends so there are loops to escape the Puffs.
  const open = (x, y) => gr[y] && gr[y][x] !== '#' && gr[y][x] !== undefined;
  for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
    if (!open(x, y)) continue;
    const walls = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !open(x + dx, y + dy));
    if (walls.length >= 3 && r() < 0.9) {
      const cand = walls.filter(([dx, dy]) => x + dx * 2 > 0 && x + dx * 2 < cols - 1 && y + dy * 2 > 0 && y + dy * 2 < rows - 1 && x + dx > 0 && x + dx < cols - 1 && y + dy > 0 && y + dy < rows - 1);
      if (cand.length) { const [dx, dy] = cand[(r() * cand.length) | 0]; gr[y + dy][x + dx] = '.'; }
    }
  }
  // Extra random loops
  for (let k = 0; k < cols; k++) {
    const x = 1 + ((r() * (cols - 2)) | 0), y = 1 + ((r() * (rows - 2)) | 0);
    if (gr[y][x] === '#' && ((open(x - 1, y) && open(x + 1, y)) || (open(x, y - 1) && open(x, y + 1)))) gr[y][x] = '.';
  }
  // Puff home in the centre
  const cx = (cols - 1) / 2, hy = Math.floor(rows / 2);
  for (let x = cx - 2; x <= cx + 2; x++) { gr[hy - 1][x] = '#'; gr[hy + 1][x] = '#'; gr[hy - 2][x] = '.'; gr[hy + 2][x] = '.'; }
  gr[hy][cx - 2] = '#'; gr[hy][cx + 2] = '#';
  for (let x = cx - 1; x <= cx + 1; x++) gr[hy][x] = 'G';
  gr[hy - 1][cx] = '.';
  for (let x = cx - 3; x <= cx + 3; x++) { if (x > 0 && x < cols - 1) { if (gr[hy - 2][x] === '#') gr[hy - 2][x] = '.'; if (gr[hy + 2][x] === '#') gr[hy + 2][x] = '.'; } }
  // Make sure every open cell can be reached from the start.
  const sx = cx, sy = hy + 2;
  const isWall = (x, y) => gr[y][x] === '#' || gr[y][x] === 'G';
  for (let guard = 0; guard < 400; guard++) {
    const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
    const q = [[sx, sy]]; seen[sy][sx] = true;
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!seen[ny][nx] && !isWall(nx, ny)) { seen[ny][nx] = true; q.push([nx, ny]); } } }
    let fixed = false;
    for (let y = 1; y < rows - 1 && !fixed; y++) for (let x = 1; x < cols - 1 && !fixed; x++) {
      if (gr[y][x] !== '#' || (Math.abs(y - hy) <= 1 && Math.abs(x - cx) <= 2)) continue;
      const h = [[x - 1, y], [x + 1, y]], v = [[x, y - 1], [x, y + 1]];
      for (const [a, b] of [h, v]) {
        const A1 = !isWall(...a) && seen[a[1]][a[0]], B1 = !isWall(...b) && !seen[b[1]][b[0]];
        const A2 = !isWall(...b) && seen[b[1]][b[0]], B2 = !isWall(...a) && !seen[a[1]][a[0]];
        if ((A1 && B1) || (A2 && B2)) { gr[y][x] = '.'; fixed = true; break; }
      }
    }
    if (!fixed) break;
  }
  gr[sy][sx] = 'P';
  for (const [x, y] of [[1, 1], [cols - 2, 1], [1, rows - 2], [cols - 2, rows - 2]]) gr[y][x] = 'o';
  return gr.map(row => row.join(''));
}
const PUFF_COLORS = ['#7A8BA6', '#5FBF9A', '#B58BD9', '#E9A15C'];
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const lvl = Math.max(1, ctx.level);
  const MAPL = lvl === 1 ? MAP : genMaze(lvl * 7 + (little ? 100 : 0), lvl < 8 ? 15 : lvl < 15 ? 17 : 19, lvl < 15 ? 13 : 15);
  const COLS = MAPL[0].length, ROWS = MAPL.length;
  const theme = THEMES[(lvl - 1) % THEMES.length];
  const exitX = (COLS - 1) / 2, exitY = Math.floor(ROWS / 2) - 2;
  const A = arcadeLayout(ctx.stage, {
    w: COLS * T, h: ROWS * T + HUD,
    left: [[null, { id: 'up', label: '▲' }, null], [{ id: 'left', label: '◀' }, { id: 'down', label: '▼' }, { id: 'right', label: '▶' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();
  const nPuffs = little ? (lvl === 1 ? 0 : lvl < 5 ? 1 : lvl < 10 ? 2 : 3) : Math.min(4, 2 + Math.floor((lvl - 1) / 5));
  const puffSpeed = little ? Math.min(2.8, 1.9 + lvl * 0.045) : Math.min(4.7, 3.0 + lvl * 0.085);
  const chaseChance = little ? Math.min(0.35, 0.12 + lvl * 0.012) : Math.min(0.85, 0.3 + lvl * 0.03);

  const grid = MAPL.map(r => r.split(''));
  let treats = 0, score = 0, hearts = 3, sleepyT = 0, over = false, hurtT = 0, t = 0;
  let player, puffs = [], homes = [];
  grid.forEach((r, y) => r.forEach((c, x) => {
    if (c === '.' || c === 'o') treats++;
    if (c === 'P') { player = { x, y, sx: x, sy: y, dir: [0, 0], want: [0, 0], speed: little ? 3.4 : 4.4 }; grid[y][x] = ' '; }
    if (c === 'G') homes.push({ x, y });
  }));
  for (let i = 0; i < nPuffs; i++) {
    const h = homes[i % homes.length];
    puffs.push({ x: h.x, y: h.y, hx: h.x, hy: h.y, dir: [0, -1], speed: puffSpeed, color: PUFF_COLORS[i % 4], wait: 1.5 + i * 2.5, poof: 0 });
  }

  const wall = (x, y, isPlayer) => { const c = grid[y]?.[x]; return c === undefined || c === '#' || (isPlayer && c === 'G'); };
  const atCenter = e => Math.abs(e.x - Math.round(e.x)) < 1e-6 && Math.abs(e.y - Math.round(e.y)) < 1e-6;

  function move(e, dt, decide) {
    let rem = e.speed * dt, guard = 0;
    while (rem > 1e-6 && guard++ < 6) {
      if (atCenter(e)) { e.x = Math.round(e.x); e.y = Math.round(e.y); decide(e); if (!e.dir[0] && !e.dir[1]) return; }
      const [dx, dy] = e.dir;
      let dist;
      if (dx) { const tx = dx > 0 ? Math.floor(e.x + 1e-6) + 1 : Math.ceil(e.x - 1e-6) - 1; dist = Math.abs(tx - e.x); if (rem >= dist) { e.x = tx; rem -= dist; } else { e.x += dx * rem; rem = 0; } }
      else { const ty = dy > 0 ? Math.floor(e.y + 1e-6) + 1 : Math.ceil(e.y - 1e-6) - 1; dist = Math.abs(ty - e.y); if (rem >= dist) { e.y = ty; rem -= dist; } else { e.y += dy * rem; rem = 0; } }
    }
  }

  function decidePlayer(e) {
    const [wx, wy] = e.want;
    if ((wx || wy) && !wall(e.x + wx, e.y + wy, true)) e.dir = [wx, wy];
    else if (wall(e.x + e.dir[0], e.y + e.dir[1], true)) e.dir = [0, 0];
    eat(e.x, e.y);
  }

  function eat(x, y) {
    const c = grid[y][x];
    if (c === '.') { grid[y][x] = ' '; treats--; score += 10; if (treats % 2 === 0) ctx.sfx.tap(); }
    else if (c === 'o') {
      grid[y][x] = ' '; treats--; score += 50; sleepyT = 7;
      ctx.sfx.good(); txt.add('⭐ Sleepy Puffs!', COLS * T / 2, HUD + 30, '#FFD23F', 28);
      if (puffs.length) ctx.say('The Puffs are sleepy! Bop them!');
    }
    if (treats === 0) win();
  }

  function decidePuff(p) {
    const opts = DIRS.filter(([dx, dy]) => !wall(p.x + dx, p.y + dy, false) && !(dx === -p.dir[0] && dy === -p.dir[1]));
    const choices = opts.length ? opts : DIRS.filter(([dx, dy]) => !wall(p.x + dx, p.y + dy, false));
    if (!choices.length) return;
    const inHome = grid[p.y][p.x] === 'G';
    const tx = inHome ? exitX : player.x, ty = inHome ? exitY : player.y;
    const dist = ([dx, dy]) => Math.hypot(p.x + dx - tx, p.y + dy - ty);
    let pick;
    if (inHome) pick = choices.reduce((a, b) => dist(a) <= dist(b) ? a : b);
    else if (sleepyT > 0) pick = Math.random() < .7 ? choices.reduce((a, b) => dist(a) >= dist(b) ? a : b) : choices[(Math.random() * choices.length) | 0];
    else if (Math.random() < chaseChance) pick = choices.reduce((a, b) => dist(a) <= dist(b) ? a : b);
    else pick = choices[(Math.random() * choices.length) | 0];
    p.dir = pick;
  }

  function want(d) {
    const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
    if (!m) return;
    player.want = m;
    // Reversing works instantly, even between tiles.
    if (m[0] === -player.dir[0] && m[1] === -player.dir[1] && (m[0] || m[1])) player.dir = m;
    if (!player.dir[0] && !player.dir[1] && atCenter(player)) decidePlayer(player);
  }
  A.onPress(want);
  swipes(A.canvas, d => want(d));

  function win() {
    if (over) return; over = true;
    ctx.sfx.tada();
    fx.burst(player.x * T + T / 2, player.y * T + T / 2 + HUD, 60, 400);
    ctx.say('You ate all the treats!');
    setTimeout(() => ctx.finish(little ? 3 : hearts), 2000);
  }
  function caught() {
    hearts--;
    hurtT = 1.5;
    ctx.sfx.oops();
    fx.burst(player.x * T + T / 2, player.y * T + T / 2 + HUD, 20, 200, ['#9AA6FF', '#fff']);
    if (hearts <= 0) {
      over = true;
      ctx.say(`Good try! You got ${score} points!`);
      setTimeout(() => ctx.finish(1), 1800);
      return;
    }
    ctx.say('Oops! Try again!');
    player.x = player.sx; player.y = player.sy; player.dir = [0, 0]; player.want = [0, 0];
    for (const p of puffs) { p.x = p.hx; p.y = p.hy; p.dir = [0, -1]; p.wait = 1.5; }
  }

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    if (over) return;
    for (const d of ['up', 'down', 'left', 'right']) if (A.keys[d]) player.want = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[d];
    if (hurtT > 0) hurtT -= dt;
    move(player, dt, decidePlayer);
    if (sleepyT > 0) sleepyT -= dt;
    for (const p of puffs) {
      if (p.poof > 0) { p.poof -= dt; continue; }
      if (p.wait > 0) { p.wait -= dt; continue; }
      p.speed = sleepyT > 0 ? puffSpeed * 0.55 : puffSpeed;
      move(p, dt, decidePuff);
      if (Math.hypot(p.x - player.x, p.y - player.y) < 0.65) {
        if (sleepyT > 0) {
          score += 200;
          ctx.sfx.pop();
          fx.burst(p.x * T + T / 2, p.y * T + T / 2 + HUD, 30, 300, ['#fff', '#BDE7FF', '#9AA6FF']);
          txt.add('BOP! +200', p.x * T + T / 2, p.y * T + HUD, '#fff', 26);
          p.x = p.hx; p.y = p.hy; p.dir = [0, -1]; p.poof = 2; p.wait = 1;
        } else if (hurtT <= 0) caught();
      }
    }
  }

  function drawPuff(p) {
    const cx = p.x * T + T / 2, cy = p.y * T + T / 2 + HUD + Math.sin(t * 6 + p.hx) * 2;
    const sleepy = sleepyT > 0;
    const blink = sleepy && sleepyT < 2 && Math.floor(t * 6) % 2;
    g.fillStyle = sleepy ? (blink ? '#fff' : '#BDE7FF') : p.color;
    for (const [ox, oy, r] of [[-9, 2, 11], [9, 2, 11], [0, -6, 13], [0, 6, 12]]) { g.beginPath(); g.arc(cx + ox, cy + oy, r, 0, 7); g.fill(); }
    g.fillStyle = '#2B2140';
    if (sleepy) {
      g.strokeStyle = '#2B2140'; g.lineWidth = 2.5;
      for (const ex of [-6, 6]) { g.beginPath(); g.arc(cx + ex, cy - 2, 3.5, 0.1, Math.PI - 0.1); g.stroke(); }
    } else {
      for (const ex of [-6, 6]) { g.beginPath(); g.arc(cx + ex + p.dir[0] * 2, cy - 3 + p.dir[1] * 2, 3.5, 0, 7); g.fill(); }
      g.fillRect(cx - 9, cy - 10, 7, 2.5); g.fillRect(cx + 2, cy - 10, 7, 2.5); // little grumpy eyebrows
    }
  }

  function draw() {
    g.fillStyle = theme.bg; g.fillRect(0, 0, A.w, A.h);
    // HUD
    hudText(g, '❤️'.repeat(Math.max(0, hearts)), 10, 8, { size: 24 });
    hudText(g, String(score), A.w - 10, 8, { size: 26, align: 'right', color: '#FFD23F' });
    hudText(g, `Level ${lvl}`, A.w / 2, 8, { size: 24, align: 'center' });
    g.save(); g.translate(0, HUD);
    grid.forEach((r, y) => r.forEach((c, x) => {
      const px = x * T, py = y * T;
      if (c === '#') {
        g.fillStyle = theme.wall; roundRect(g, px + 3, py + 3, T - 6, T - 6, 10); g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)'; roundRect(g, px + 7, py + 6, T - 14, 6, 3); g.fill();
      } else if (c === '.') {
        g.fillStyle = theme.treat; g.beginPath(); g.arc(px + T / 2, py + T / 2, 5, 0, 7); g.fill();
      } else if (c === 'o') {
        drawStar(g, px + T / 2, py + T / 2, 13 + Math.sin(t * 5) * 2);
      } else if (c === 'G') {
        g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(px, py, T, T);
      }
    }));
    g.restore();
    for (const p of puffs) if (p.poof <= 0) drawPuff(p);
    // Mango
    const img = sprite('mango', over && treats === 0 ? 'cheer' : 'happy');
    if (!(hurtT > 0 && Math.floor(t * 10) % 2)) {
      const moving = player.dir[0] || player.dir[1];
      const bob = moving ? Math.abs(Math.sin(t * 14)) * 4 : 0;
      const s = T * 1.15;
      g.save();
      g.translate(player.x * T + T / 2, player.y * T + T / 2 + HUD - bob);
      if (player.dir[0] < 0) g.scale(-1, 1);
      if (img.complete) g.drawImage(img, -s / 2, -s / 2 - 2, s, s);
      g.restore();
    }
    fx.draw(g); txt.draw(g);
  }

  if (window.__playroomTest) window.__playroomTest.maze = { win: () => { grid.forEach(r => r.forEach((c, x) => { if (c === '.' || c === 'o') r[x] = ' '; })); treats = 0; win(); }, treats: () => treats };
  ctx.instruct(`Level ${lvl}! ` + (puffs.length ? `Help Mango eat all the treats! Watch out for ${puffs.length === 1 ? 'the grumpy Puff' : `${puffs.length} grumpy Puffs`}!` : 'Help Mango eat all the treats! Swipe or use the arrows.'));
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); };
}
