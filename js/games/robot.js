// Robot Path: help Bo reach the battery. Early coding for little and big explorers.
//  Little (30 levels): 1–12 move Bo straight away with each arrow, 13–30 make short plans (gems and ×2 later).
//  Big (30 levels): plans with arrows, gems to collect, ×2 and ×3 repeat blocks, forward / turn left / turn right,
//  growing from 5×5 to 8×8 boards. Using the fewest steps earns the most stars.
// Bumping into a rock or water never fails the game — Bo just goes back to the start to try again.
import { character } from '../characters.js';
import { shuffle, pick } from '../words.js';

const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const FACE = ['up', 'right', 'down', 'left'];
const ROT = { up: 0, right: 90, down: 180, left: 270 };

const arrowSVG = (rot, color = '#fff') => `<svg viewBox="0 0 40 40" style="width:70%;height:70%;transform:rotate(${rot}deg)"><path d="M20 5 L35 22 H25.5 V35 H14.5 V22 H5 Z" fill="${color}" stroke="rgba(0,0,0,.15)" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
const turnSVG = (right, color = '#fff') => `<svg viewBox="0 0 40 40" style="width:70%;height:70%;transform:scaleX(${right ? -1 : 1})"><path d="M29 35 V20 Q29 11 20 11 H15 V4 L4 14.5 L15 25 V18 H20 Q22 18 22 20 V35 Z" fill="${color}" stroke="rgba(0,0,0,.15)" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

// Level tables: [grid size, kind, rock chance, min steps, max steps, gems to collect, repeat (0 / 2 / 3)]
// D = direct (each arrow moves Bo straight away), P = plan with arrows, T = forward / turn left / turn right.
const LITTLE = [
  [3, 'D', 0, 2, 3, 0, 0], [3, 'D', 0, 3, 4, 0, 0], [4, 'D', .1, 3, 5, 0, 0], [4, 'D', 0, 3, 6, 1, 0],
  [4, 'D', .2, 4, 6, 0, 0], [5, 'D', .15, 4, 7, 1, 0], [5, 'D', .2, 5, 7, 0, 0], [5, 'D', .1, 5, 8, 2, 0],
  [5, 'D', .25, 5, 9, 2, 0], [6, 'D', .2, 6, 9, 0, 0], [6, 'D', .2, 6, 10, 2, 0], [6, 'D', .25, 7, 12, 3, 0],
  [3, 'P', 0, 2, 3, 0, 0], [3, 'P', 0, 3, 4, 0, 0], [4, 'P', 0, 3, 4, 0, 0], [4, 'P', .1, 3, 5, 0, 0],
  [4, 'P', .1, 3, 5, 1, 0], [4, 'P', .2, 4, 5, 0, 0], [5, 'P', .1, 4, 6, 0, 0], [5, 'P', .1, 4, 6, 1, 0],
  [5, 'P', .2, 5, 6, 0, 0], [5, 'P', .2, 5, 7, 1, 0], [4, 'P', .1, 4, 6, 0, 2], [5, 'P', .15, 5, 7, 0, 2],
  [5, 'P', .15, 5, 7, 1, 2], [5, 'P', .25, 6, 8, 0, 0], [6, 'P', .15, 5, 8, 0, 2], [6, 'P', .15, 5, 9, 2, 0],
  [6, 'P', .2, 6, 9, 0, 2], [6, 'P', .2, 6, 10, 2, 2],
];
const BIG = [
  [5, 'P', .15, 4, 6, 0, 0], [5, 'P', .2, 5, 7, 0, 0], [5, 'P', .15, 4, 7, 1, 0], [5, 'P', .25, 6, 8, 0, 0],
  [6, 'P', .2, 6, 9, 0, 0], [6, 'P', .2, 5, 9, 1, 0], [5, 'P', .15, 5, 8, 0, 2], [6, 'P', .2, 6, 10, 0, 2],
  [6, 'P', .2, 6, 10, 1, 2], [6, 'P', .25, 8, 12, 2, 2], [5, 'T', .1, 3, 6, 0, 0], [5, 'T', .15, 4, 7, 0, 0],
  [6, 'T', .15, 5, 8, 0, 0], [6, 'T', .2, 6, 9, 0, 0], [7, 'P', .2, 8, 12, 0, 3], [7, 'P', .25, 8, 12, 1, 3],
  [7, 'P', .25, 9, 13, 2, 3], [6, 'T', .2, 6, 10, 0, 2], [7, 'T', .15, 6, 10, 0, 2], [7, 'T', .2, 7, 11, 0, 3],
  [7, 'P', .3, 10, 14, 2, 3], [8, 'P', .25, 10, 15, 2, 3], [8, 'P', .3, 11, 16, 3, 3], [7, 'T', .25, 8, 12, 0, 3],
  [8, 'T', .2, 8, 13, 0, 3], [8, 'P', .3, 12, 18, 3, 3], [8, 'T', .25, 9, 14, 0, 3], [8, 'P', .35, 12, 18, 3, 3],
  [8, 'T', .3, 10, 15, 0, 3], [8, 'P', .35, 14, 20, 3, 3],
];
function cfgFor(mode, lvl) {
  const t = mode === 'little' ? LITTLE : BIG;
  const [n, k, rocks, min, max, gems, repeat] = t[Math.min(Math.max(1, lvl), t.length) - 1];
  return { n, kind: k === 'D' ? 'direct' : k === 'T' ? 'turn' : 'program', rocks, min, max, gems, repeat };
}

/* ---------- Puzzle generation (always solvable) ---------- */
function bfs(grid, n, s, g) {
  const key = (x, y) => y * n + x;
  const prev = new Map([[key(s.x, s.y), null]]);
  const q = [[s.x, s.y]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === g.x && y === g.y) break;
    for (const [d, [dx, dy]] of Object.entries(DIRS)) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n || grid[ny][nx] !== '.' || prev.has(key(nx, ny))) continue;
      prev.set(key(nx, ny), [x, y, d]);
      q.push([nx, ny]);
    }
  }
  if (!prev.has(key(g.x, g.y))) return null;
  const path = [];
  let cur = [g.x, g.y];
  while (true) { const p = prev.get(key(cur[0], cur[1])); if (!p) break; path.unshift({ d: p[2], x: cur[0], y: cur[1] }); cur = [p[0], p[1]]; }
  return path;
}
// Shortest forward/turn program (state includes facing).
function bfsTurn(grid, n, s, face, g) {
  const key = (x, y, f) => (y * n + x) * 4 + f;
  const prev = new Map([[key(s.x, s.y, face), null]]);
  const q = [[s.x, s.y, face]];
  let end = null;
  while (q.length) {
    const [x, y, f] = q.shift();
    if (x === g.x && y === g.y) { end = [x, y, f]; break; }
    const opts = [['L', x, y, (f + 3) % 4], ['R', x, y, (f + 1) % 4]];
    const [dx, dy] = DIRS[FACE[f]], nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < n && ny < n && grid[ny][nx] === '.') opts.unshift(['F', nx, ny, f]);
    for (const [c, ax, ay, af] of opts) {
      const k = key(ax, ay, af);
      if (prev.has(k)) continue;
      prev.set(k, [x, y, f, c]); q.push([ax, ay, af]);
    }
  }
  if (!end) return null;
  const prog = [];
  let cur = end;
  while (true) { const p = prev.get(key(...cur)); if (!p) break; prog.unshift(p[3]); cur = [p[0], p[1], p[2]]; }
  return prog;
}
function permutations(a) {
  if (a.length <= 1) return [a];
  return a.flatMap((x, i) => permutations([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
}
function generate(cfg) {
  const { n } = cfg;
  for (let tries = 0; tries < 1500; tries++) {
    const grid = Array.from({ length: n }, () => Array(n).fill('.'));
    const s = { x: (Math.random() * n) | 0, y: (Math.random() * n) | 0 };
    const g = { x: (Math.random() * n) | 0, y: (Math.random() * n) | 0 };
    if (s.x === g.x && s.y === g.y) continue;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if ((x === s.x && y === s.y) || (x === g.x && y === g.y)) continue;
      if (Math.random() < cfg.rocks) grid[y][x] = Math.random() < 0.6 ? 'R' : 'W';
    }
    // Gems to pick up on the way (on free cells, not start or goal).
    const gems = [];
    let bad = false;
    for (let i = 0; i < (cfg.gems || 0); i++) {
      let c, guard = 0;
      do { c = { x: (Math.random() * n) | 0, y: (Math.random() * n) | 0 }; guard++; }
      while (guard < 50 && (grid[c.y][c.x] !== '.' || (c.x === s.x && c.y === s.y) || (c.x === g.x && c.y === g.y) || gems.some(q => q.x === c.x && q.y === c.y)));
      if (guard >= 50) { bad = true; break; }
      gems.push(c);
    }
    if (bad) continue;
    // Best order to collect the gems, then the battery.
    let path = null;
    for (const order of permutations(gems)) {
      let cur = s, full = [], ok = true;
      for (const stop of [...order, g]) {
        const leg = bfs(grid, n, cur, stop);
        if (!leg) { ok = false; break; }
        full = full.concat(leg); cur = stop;
      }
      // The route must not pass through the battery before all gems are collected.
      if (ok && full.slice(0, -1).some(p => p.x === g.x && p.y === g.y)) ok = false;
      if (ok && (!path || full.length < path.length)) path = full;
    }
    if (!path || path.length < cfg.min || path.length > cfg.max) continue;
    let face = 0, turnProg = null;
    if (cfg.kind === 'turn') {
      face = (Math.random() * 4) | 0;
      turnProg = bfsTurn(grid, n, s, face, g);
      if (!turnProg || turnProg.length > Math.max(10, cfg.max + 6)) continue;
    }
    return { grid, s, g, path, face, turnProg, gems };
  }
  // Fallback: an empty board with a straight path.
  const grid = Array.from({ length: n }, () => Array(n).fill('.'));
  const s = { x: 0, y: 0 }, g = { x: n - 1, y: 0 };
  return { grid, s, g, path: bfs(grid, n, s, g), face: 1, turnProg: bfsTurn(grid, n, s, 1, g), gems: [] };
}

export default function start(ctx) {
  const { stage, mode } = ctx;
  const cfg = cfgFor(mode, ctx.level);
  const little = mode === 'little';
  ctx.hideMascot();
  const N = 5;
  let solved = 0, mistakes = 0, alive = true, extraSteps = 0;
  ctx.dots(N);

  let puzzle, bo, prog = [], running = false, failures = 0, repeatOn = false, timers = [];
  const later = (fn, ms) => { const t = setTimeout(() => { if (alive) fn(); }, ms); timers.push(t); return t; };

  function layout() {
    const portrait = stage.clientHeight > stage.clientWidth * 0.95;
    stage.innerHTML = `
      <div class="rb-wrap" style="display:flex;flex-direction:${portrait ? 'column' : 'row'};gap:18px;align-items:center;justify-content:center;width:100%;flex:1;min-height:0">
        <div class="rb-board" style="position:relative;flex:none;border-radius:24px;overflow:hidden;box-shadow:var(--shadow);background:#9ED38A"></div>
        <div class="rb-panel" style="display:flex;flex-direction:column;align-items:center;gap:12px;min-width:0;max-width:520px"></div>
      </div>`;
    const board = stage.querySelector('.rb-board');
    const avail = portrait
      ? Math.min(stage.clientWidth * 0.9, (stage.clientHeight || 700) * 0.55)
      : Math.min(stage.clientWidth * 0.52, (stage.clientHeight || 600) - 10);
    board.style.width = board.style.height = Math.max(200, avail) + 'px';
    return board;
  }

  function newPuzzle() {
    puzzle = generate(cfg);
    prog = []; failures = 0; running = false; repeatOn = false;
    const board = layout();
    const n = cfg.n, size = parseFloat(board.style.width), cs = size / n;
    let cells = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const c = puzzle.grid[y][x];
      const isGoal = x === puzzle.g.x && y === puzzle.g.y;
      const bg = c === 'W' ? '#5DADEC' : (x + y) % 2 ? '#B8E2A4' : '#C9EBB8';
      cells += `<div class="rb-cell" data-x="${x}" data-y="${y}" style="position:absolute;left:${x * cs}px;top:${y * cs}px;width:${cs}px;height:${cs}px;background:${bg};display:grid;place-items:center;font-size:${cs * 0.55}px;
        ${c === 'W' ? 'border-radius:30%;box-shadow:inset 0 0 0 4px #4A98D6' : ''}">${c === 'R' ? '🪨' : c === 'W' ? '<span style="font-size:.6em;opacity:.8">〰️</span>' : isGoal ? '🔋' : puzzle.gems.some(q => q.x === x && q.y === y) ? '<span class="rb-gem">💎</span>' : ''}</div>`;
    }
    board.innerHTML = cells + `<div class="rb-bo" style="position:absolute;left:0;top:0;width:${cs}px;height:${cs}px;transition:transform .38s cubic-bezier(.4,1.5,.5,1);z-index:2;pointer-events:none">
        <div class="rb-body" style="width:100%;height:100%;padding:6%">${character('bo')}</div>
        ${cfg.kind === 'turn' ? `<div class="rb-face" style="position:absolute;left:50%;top:50%;width:46%;height:46%;margin:-23% 0 0 -23%;transition:transform .3s;opacity:.95">${`<svg viewBox="0 0 40 40" style="width:100%;height:100%;overflow:visible"><path d="M20 -18 L32 -4 H24 V4 H16 V-4 H8 Z" fill="#FFD23F" stroke="#2B2140" stroke-width="2.5" stroke-linejoin="round"/></svg>`}</div>` : ''}
      </div>`;
    bo = { x: puzzle.s.x, y: puzzle.s.y, f: puzzle.face, el: board.querySelector('.rb-bo'), cs, got: new Set(), moves: 0 };
    placeBo(false);
    buildPanel();
    const gemTxt = puzzle.gems.length ? ` Pick up ${puzzle.gems.length === 1 ? 'the gem' : puzzle.gems.length === 2 ? 'both gems' : `all ${puzzle.gems.length} gems`} on the way!` : '';
    const intro0 = cfg.kind === 'direct' ? 'Help Bo get to the battery! Tap the arrows to move him.'
      : cfg.kind === 'turn' ? 'Bo can go forward, turn left or turn right. Make a plan to reach the battery, then press play!'
      : cfg.repeat ? `Make a plan with the arrows. Use times ${cfg.repeat === 3 ? 'three' : 'two'} to repeat a step! Then press play.`
      : 'Make a plan with the arrows to get Bo to the battery. Then press play!';
    const intro = (solved === 0 ? `Level ${ctx.level}! ` : '') + intro0 + gemTxt;
    ctx.instruct(intro);
  }

  function placeBo(animate = true) {
    bo.el.style.transition = animate ? '' : 'none';
    bo.el.style.transform = `translate(${bo.x * bo.cs}px, ${bo.y * bo.cs}px)`;
    const f = bo.el.querySelector('.rb-face');
    if (f) f.style.transform = `rotate(${ROT[FACE[bo.f]]}deg)`;
    if (!animate) { void bo.el.offsetWidth; bo.el.style.transition = ''; }
  }

  function blocked(x, y) {
    const n = cfg.n;
    return x < 0 || y < 0 || x >= n || y >= n || puzzle.grid[y][x] !== '.';
  }

  function bump(dir) {
    const [dx, dy] = DIRS[dir];
    bo.el.style.transform = `translate(${bo.x * bo.cs + dx * bo.cs * 0.25}px, ${bo.y * bo.cs + dy * bo.cs * 0.25}px)`;
    later(() => placeBo(), 220);
    ctx.sfx.oops();
  }

  function atGoal() { return bo.x === puzzle.g.x && bo.y === puzzle.g.y && bo.got.size >= puzzle.gems.length; }
  function onBattery() { return bo.x === puzzle.g.x && bo.y === puzzle.g.y; }
  function collect() {
    const i = puzzle.gems.findIndex(q => q.x === bo.x && q.y === bo.y);
    if (i < 0 || bo.got.has(i)) return;
    bo.got.add(i);
    const cell = stage.querySelector(`.rb-cell[data-x="${bo.x}"][data-y="${bo.y}"] .rb-gem`);
    if (cell) { cell.style.transition = 'transform .3s, opacity .3s'; cell.style.transform = 'scale(1.8)'; cell.style.opacity = '0'; }
    ctx.sfx.star(bo.got.size);
    ctx.sparkleAt(bo.el, 14);
  }
  function resetGems() {
    bo.got = new Set();
    stage.querySelectorAll('.rb-gem').forEach(g => { g.style.transition = 'none'; g.style.transform = ''; g.style.opacity = '1'; });
  }

  function win() {
    running = true;
    ctx.right(bo.el);
    const goalCell = stage.querySelector(`.rb-cell[data-x="${puzzle.g.x}"][data-y="${puzzle.g.y}"]`);
    if (goalCell) goalCell.textContent = '⚡';
    bo.el.querySelector('.rb-body').innerHTML = character('bo', { mood: 'cheer' });
    ctx.say(pick(['Bo found the battery!', 'Charged up! Well done!', 'Beep boop! You did it!']));
    solved++; ctx.progress(solved);
    if (cfg.kind !== 'direct') extraSteps += Math.max(0, bo.moves - (cfg.kind === 'turn' ? puzzle.turnProg.length : puzzle.path.length));
    const score = mistakes + Math.floor(extraSteps / 3);
    later(() => solved >= N ? ctx.finish(little ? 3 : score <= 1 ? 3 : score <= 4 ? 2 : 1) : newPuzzle(), 2200);
  }

  /* ---------- Controls ---------- */
  function bigBtn(html, color, onClick, label) {
    const b = document.createElement('button');
    b.setAttribute('aria-label', label);
    b.style.cssText = `width:clamp(70px,10vw,92px);height:clamp(70px,10vw,92px);border-radius:22px;background:${color};box-shadow:0 6px 0 rgba(0,0,0,.2);display:grid;place-items:center;transition:transform .1s`;
    b.innerHTML = html;
    b.onclick = onClick;
    return b;
  }

  function buildPanel() {
    const panel = stage.querySelector('.rb-panel');
    panel.innerHTML = '';
    const pad = document.createElement('div');
    pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,auto);gap:10px;justify-content:center';
    const ARROW_COLORS = { up: '#3A86FF', left: '#FF9F1C', right: '#3BB273', down: '#8E6CEF' };
    const add = cmd => () => {
      if (running) return;
      ctx.sfx.tap();
      if (cfg.kind === 'direct') return stepDirect(cmd);
      if (prog.length >= 18) { ctx.say('That is a long plan! Press play.'); return; }
      prog.push({ cmd, times: repeatOn ? cfg.repeat : 1 });
      repeatOn = false;
      const rb = panel.querySelector('[data-rep]'); if (rb) rb.style.outline = 'none';
      const tm = prog[prog.length - 1].times;
      ctx.say(cmdWord(cmd) + (tm === 2 ? ' two times' : tm === 3 ? ' three times' : ''));
      renderProg();
      panel.querySelectorAll('.hint').forEach(x => x.classList.remove('hint'));
    };
    if (cfg.kind === 'turn') {
      const btns = [
        bigBtn(turnSVG(false), '#FF9F1C', add('L'), 'Turn left'),
        bigBtn(arrowSVG(0), '#3A86FF', add('F'), 'Forward'),
        bigBtn(turnSVG(true), '#3BB273', add('R'), 'Turn right'),
      ];
      btns.forEach((b, i) => { b.dataset.cmd = ['L', 'F', 'R'][i]; pad.appendChild(b); });
    } else {
      const cells = [null, 'up', null, 'left', 'down', 'right'];
      for (const c of cells) {
        if (!c) { pad.appendChild(document.createElement('div')); continue; }
        const b = bigBtn(arrowSVG(ROT[c]), ARROW_COLORS[c], add(c), c);
        b.dataset.cmd = c;
        pad.appendChild(b);
      }
    }
    panel.appendChild(pad);
    if (cfg.kind === 'direct') return;

    const strip = document.createElement('div');
    strip.className = 'rb-strip';
    strip.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;min-height:64px;width:100%;background:#fff;border-radius:20px;padding:8px;box-shadow:var(--shadow)';
    panel.appendChild(strip);

    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:12px;align-items:center';
    if (cfg.repeat) {
      const rep = bigBtn(`<span style="font-size:28px;color:#fff;font-weight:900">×${cfg.repeat}</span>`, '#FF7EB6', () => {
        if (running) return;
        repeatOn = !repeatOn; ctx.sfx.tap();
        rep.style.outline = repeatOn ? '5px solid #2B2140' : 'none';
        if (repeatOn) ctx.say(`Times ${cfg.repeat === 3 ? 'three' : 'two'}! Now pick an arrow.`);
      }, `Repeat ${cfg.repeat} times`);
      rep.dataset.rep = '1';
      row.appendChild(rep);
    }
    row.appendChild(bigBtn('<span style="font-size:34px">🧽</span>', '#fff', () => { if (running) return; prog = []; renderProg(); ctx.sfx.whoosh(); }, 'Clear plan'));
    const play = bigBtn('<svg viewBox="0 0 40 40" style="width:60%;height:60%"><path d="M12 6 L34 20 L12 34 Z" fill="#fff"/></svg>', '#3BB273', run, 'Play');
    play.style.width = play.style.height = 'clamp(84px,12vw,108px)';
    play.style.borderRadius = '50%';
    row.appendChild(play);
    panel.appendChild(row);
    renderProg();
  }

  const cmdWord = c => ({ up: 'up', down: 'down', left: 'left', right: 'right', F: 'forward', L: 'turn left', R: 'turn right' }[c]);
  function cmdIcon(c) {
    if (c === 'L') return turnSVG(false, '#2B2140');
    if (c === 'R') return turnSVG(true, '#2B2140');
    if (c === 'F') return arrowSVG(0, '#2B2140');
    return arrowSVG(ROT[c], '#2B2140');
  }
  function renderProg() {
    const strip = stage.querySelector('.rb-strip');
    if (!strip) return;
    strip.innerHTML = prog.length ? '' : `<span style="color:var(--ink-soft);font-size:18px">Your plan</span>`;
    prog.forEach((p, i) => {
      const c = document.createElement('button');
      c.style.cssText = 'position:relative;width:54px;height:54px;border-radius:14px;background:#FFE9C2;display:grid;place-items:center;box-shadow:0 3px 0 rgba(0,0,0,.12)';
      c.innerHTML = cmdIcon(p.cmd) + (p.times > 1 ? `<span style="position:absolute;right:-6px;top:-8px;background:#FF7EB6;color:#fff;border-radius:10px;padding:0 5px;font-size:14px;font-weight:900">×${p.times}</span>` : '');
      c.onclick = () => { if (running) return; prog.splice(i, 1); ctx.sfx.flip(); renderProg(); };
      c.dataset.i = i;
      strip.appendChild(c);
    });
  }

  /* ---------- Direct mode ---------- */
  let directMisses = 0;
  function stepDirect(dir) {
    const [dx, dy] = DIRS[dir];
    const nx = bo.x + dx, ny = bo.y + dy;
    if (blocked(nx, ny)) {
      bump(dir); mistakes++; directMisses++;
      ctx.say(nx < 0 || ny < 0 || nx >= cfg.n || ny >= cfg.n ? 'Oops, that is the edge!' : 'Oops! Something is in the way.');
      if (directMisses >= 2) {
        const path = bfs(puzzle.grid, cfg.n, bo, puzzle.g);
        if (path && path[0]) stage.querySelector(`.rb-panel [data-cmd="${path[0].d}"]`)?.classList.add('hint');
      }
      return;
    }
    directMisses = 0;
    stage.querySelectorAll('.rb-panel .hint').forEach(x => x.classList.remove('hint'));
    bo.x = nx; bo.y = ny; placeBo();
    ctx.sfx.note(392 + (nx + ny) * 40);
    collect();
    if (atGoal()) later(win, 380);
    else if (onBattery()) ctx.say('Pick up all the gems first, then come back to the battery!');
  }

  /* ---------- Program mode ---------- */
  function run() {
    if (running) return;
    if (!prog.length) { ctx.say('Tap the arrows to make a plan first!'); return; }
    running = true;
    bo.moves = 0;
    const steps = prog.flatMap((p, i) => Array(p.times).fill({ cmd: p.cmd, i }));
    let k = 0;
    const cards = () => stage.querySelectorAll('.rb-strip button');
    const tick = () => {
      cards().forEach(c => (c.style.outline = 'none'));
      if (atGoal()) return win();
      if (k >= steps.length) return fail(onBattery() ? 'Bo needs to pick up all the gems on the way!' : 'Bo needs more steps to reach the battery!');
      const { cmd, i } = steps[k++];
      const card = cards()[i];
      if (card) card.style.outline = '4px solid #3A86FF';
      if (cmd === 'L' || cmd === 'R') {
        bo.f = (bo.f + (cmd === 'L' ? 3 : 1)) % 4; placeBo(); ctx.sfx.flip(); bo.moves++;
        return later(tick, 520);
      }
      const dir = cmd === 'F' ? FACE[bo.f] : cmd;
      const [dx, dy] = DIRS[dir];
      const nx = bo.x + dx, ny = bo.y + dy;
      if (blocked(nx, ny)) { bump(dir); return later(() => fail(nx < 0 || ny < 0 || nx >= cfg.n || ny >= cfg.n ? 'Bonk! Bo reached the edge. Let\'s fix the plan!' : 'Bonk! Bo bumped into something. Let\'s fix the plan!'), 450); }
      bo.x = nx; bo.y = ny; placeBo(); bo.moves++;
      ctx.sfx.note(392 + k * 30);
      collect();
      later(tick, 520);
    };
    later(tick, 250);
  }

  function fail(msg) {
    mistakes++; failures++;
    ctx.wrong(bo.el, msg);
    later(() => {
      bo.x = puzzle.s.x; bo.y = puzzle.s.y; bo.f = puzzle.face; placeBo();
      resetGems();
      running = false;
      if (failures >= 2) showGhost();
    }, 1100);
  }

  // Hint: footprints along a shortest route.
  function showGhost() {
    stage.querySelectorAll('.rb-step').forEach(e => e.remove());
    const board = stage.querySelector('.rb-board');
    let pts = [];
    if (cfg.kind === 'turn') {
      let x = puzzle.s.x, y = puzzle.s.y, f = puzzle.face;
      for (const c of puzzle.turnProg) { if (c === 'F') { const [dx, dy] = DIRS[FACE[f]]; x += dx; y += dy; pts.push([x, y]); } else f = (f + (c === 'L' ? 3 : 1)) % 4; }
    } else pts = puzzle.path.map(p => [p.x, p.y]);
    pts.slice(0, -1).forEach(([x, y]) => {
      const d = document.createElement('div');
      d.className = 'rb-step';
      d.style.cssText = `position:absolute;left:${x * bo.cs}px;top:${y * bo.cs}px;width:${bo.cs}px;height:${bo.cs}px;display:grid;place-items:center;pointer-events:none;z-index:1`;
      d.innerHTML = `<span style="width:28%;height:28%;border-radius:50%;background:#FFD23F;box-shadow:0 0 0 4px rgba(255,210,63,.4)"></span>`;
      board.appendChild(d);
    });
    ctx.say('Follow the yellow dots!');
  }

  // Test-only shortcut (only when a test page sets window.__playroomTest).
  if (window.__playroomTest) window.__playroomTest.robot = {
    solve() {
      if (cfg.kind === 'direct') { let i = 0; const go = () => { if (i < puzzle.path.length && alive) { stepDirect(puzzle.path[i++].d); setTimeout(go, 420); } }; go(); return; }
      prog = cfg.kind === 'turn' ? puzzle.turnProg.map(c => ({ cmd: c, times: 1 })) : puzzle.path.map(p => ({ cmd: p.d, times: 1 }));
      renderProg(); run();
    },
  };
  newPuzzle();
  return () => { alive = false; timers.forEach(clearTimeout); };
}
