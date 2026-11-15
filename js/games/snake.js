// Snake Trail: steer a friendly caterpillar around the garden, munching fruit and growing longer.
// 20 levels: new rock layouts, magic portals, hopping fruit, golden fruit and five garden themes.
// Little: the edges wrap around, bumping a rock or your tail just says "Oops!" (never ends badly).
// Big: walls are solid, 3 hearts; bumping costs a heart.
import { arcadeLayout, swipes, gameLoop, roundRect, particles, popups, hudText } from './arcade-kit.js';

const COLS = 16, ROWS = 12, C = 40, HUD = 44;
const W = COLS * C, H = ROWS * C + HUD;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const FRUITS = [
  { body: '#FF4B4B', leaf: '#3BB273' },   // apple
  { body: '#FF9F1C', leaf: '#3BB273' },   // orange
  { body: '#8E6CEF', leaf: '#3BB273' },   // plum
  { body: '#FFD23F', leaf: '#7BC96F' },   // lemon
  { body: '#FF7EB6', leaf: '#3BB273' },   // berry
];
// Garden themes, four levels each.
const THEMES = [
  { name: 'Garden', a: '#8ED47F', b: '#7BC96F', rock: '#9AA0B5', edge: '#5A9E4E', deco: '🌼' },
  { name: 'Beach',  a: '#FFE29A', b: '#F6D27E', rock: '#B9A58A', edge: '#D9B45F', deco: '🐚' },
  { name: 'Autumn', a: '#F2B880', b: '#E8A869', rock: '#8C7A6B', edge: '#C0763A', deco: '🍂' },
  { name: 'Snow',   a: '#EAF6FF', b: '#D7ECFA', rock: '#8FA9C4', edge: '#9CC3E6', deco: '❄️' },
  { name: 'Night',  a: '#3C4F8C', b: '#34467D', rock: '#6A6F99', edge: '#232F5C', deco: '✨' },
];
// Which rock layout each level uses (0 = none). Index = level - 1.
const LAYOUT = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 1, 9, 3, 5, 10, 6, 7, 8, 9, 10];

// Small seeded random so a level always looks the same.
function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

function rocksFor(n, level) {
  const R = new Set();
  const add = (x, y) => { if (x >= 0 && y >= 0 && x < COLS && y < ROWS) R.add(x + ',' + y); };
  const hbar = (x0, x1, y) => { for (let x = x0; x <= x1; x++) add(x, y); };
  const vbar = (x, y0, y1) => { for (let y = y0; y <= y1; y++) add(x, y); };
  switch (n) {
    case 1: for (const [x, y] of [[7, 2], [8, 2], [7, 9], [8, 9]]) add(x, y); break;                    // four stones
    case 2: hbar(3, 6, 3); hbar(9, 12, 3); hbar(3, 6, 9); hbar(9, 12, 9); break;                          // four short bars
    case 3: vbar(4, 2, 4); vbar(11, 2, 4); vbar(4, 8, 10); vbar(11, 8, 10); break;                        // posts
    case 4: hbar(5, 10, 2); hbar(5, 10, 9); vbar(2, 3, 5); vbar(13, 6, 8); break;                          // frame pieces
    case 5: hbar(6, 9, 3); vbar(7, 2, 4); hbar(6, 9, 9); vbar(8, 8, 10); add(2, 2); add(13, 10); break;    // crosses
    case 6: { const r = rng(level); for (let i = 0; i < 14; i++) add(1 + ((r() * 14) | 0), 1 + ((r() * 10) | 0)); break; } // scattered
    case 7: hbar(3, 12, 2); hbar(3, 12, 9); vbar(3, 2, 4); vbar(12, 7, 9); break;                          // big S-box
    case 8: for (let i = 0; i < 5; i++) { add(2 + i * 2, 1 + i); add(13 - i * 2, 10 - i); } break;         // diagonals
    case 9: for (let x = 2; x < 14; x += 3) { vbar(x, x % 2 ? 1 : 7, x % 2 ? 4 : 10); } break;             // zig-zag posts
    case 10: hbar(2, 5, 2); hbar(10, 13, 2); hbar(2, 5, 9); hbar(10, 13, 9); vbar(7, 1, 3); vbar(8, 8, 10); add(1, 5); add(14, 7); break; // maze-ish
  }
  // Keep the starting row clear.
  for (let x = 1; x <= 10; x++) R.delete(x + ',' + (ROWS >> 1));
  return R;
}

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const L = Math.max(1, ctx.level | 0);
  const theme = THEMES[Math.min(4, Math.floor((L - 1) / 4))];
  const target = little ? Math.min(18, 5 + L) : Math.min(34, 10 + L + Math.floor(L / 2));
  const layout = little ? (L >= 3 ? LAYOUT[L - 1] : 0) : LAYOUT[L - 1];
  const rocks = rocksFor(layout, L);
  // Portals always come in a working pair, placed on the first free spots (never inside rocks).
  const PORTAL_SPOTS = [[2, 2], [13, 9], [1, 10], [14, 1], [7, 1], [8, 10], [1, 1], [14, 10]];
  const portalFree = PORTAL_SPOTS.filter(([x, y]) => !rocks.has(x + ',' + y) && y !== (ROWS >> 1)).map(([x, y]) => ({ x, y }));
  const portals = (little ? L >= 12 : L >= 8) && portalFree.length >= 2 ? portalFree.slice(0, 2) : [];
  const hoppingFruit = little ? L >= 15 : L >= 10;
  const golden = L >= 5;
  const A = arcadeLayout(ctx.stage, {
    w: W, h: H,
    right: [[null, { id: 'up', label: '▲' }, null], [{ id: 'left', label: '◀' }, { id: 'down', label: '▼' }, { id: 'right', label: '▶' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();

  let body, dir, queue, fruit, eaten = 0, hearts = 3, stepT = 0, over = false, pauseT = 1.2, t = 0, hurtT = 0, warpT = 0;

  function reset() {
    const y = ROWS >> 1;
    body = [{ x: 6, y }, { x: 5, y }, { x: 4, y }];
    dir = [1, 0]; queue = [];
  }
  const blocked = (x, y) => rocks.has(x + ',' + y) || portals.some(p => p.x === x && p.y === y);
  function placeFruit() {
    let x, y, tries = 0;
    do { x = (Math.random() * COLS) | 0; y = (Math.random() * ROWS) | 0; tries++; }
    while (tries < 800 && (body.some(s => s.x === x && s.y === y) || blocked(x, y) || (!little && (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1))));
    const isGold = golden && eaten % 4 === 3;
    fruit = { x, y, kind: isGold ? { body: '#FFC300', leaf: '#3BB273', gold: true } : FRUITS[(Math.random() * FRUITS.length) | 0], born: t, hopAt: t + 5 };
  }
  reset();
  placeFruit();

  function interval() {
    const k = (L - 1) / 19; // 0..1
    if (little) return 0.55 - k * 0.27;                                   // 0.55s → 0.28s per step
    return Math.max(0.09, 0.42 - k * 0.29 - body.length * 0.001);         // 0.42s → 0.13s per step
  }

  function want(d) {
    const m = DIRS[d];
    if (!m || over) return;
    const last = queue.length ? queue[queue.length - 1] : dir;
    if (m[0] === -last[0] && m[1] === -last[1]) return;   // no turning straight back into yourself
    if (m[0] === last[0] && m[1] === last[1]) return;
    if (queue.length < 3) queue.push(m);
  }
  A.onPress(want);
  swipes(A.canvas, d => want(d));

  function step() {
    if (queue.length) dir = queue.shift();
    const head = body[0];
    let nx = head.x + dir[0], ny = head.y + dir[1];
    if (little) { nx = (nx + COLS) % COLS; ny = (ny + ROWS) % ROWS; }
    else if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return bump();
    // Magic portals: pop out of the other one.
    const pi = portals.findIndex(p => p.x === nx && p.y === ny);
    if (pi >= 0) {
      const o = portals[1 - pi];
      nx = o.x + dir[0]; ny = o.y + dir[1];
      if (little) { nx = (nx + COLS) % COLS; ny = (ny + ROWS) % ROWS; }
      else if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return bump();
      ctx.sfx.whoosh(); warpT = 0.4;
      fx.burst(o.x * C + C / 2, o.y * C + C / 2 + HUD, 16, 200, ['#8E6CEF', '#fff', '#2EC4B6']);
    }
    if (rocks.has(nx + ',' + ny)) {
      if (little) return littleOops(nx, ny, true);
      return bump();
    }
    const hitSelf = body.slice(0, -1).some(s => s.x === nx && s.y === ny);
    if (hitSelf) {
      if (little) return littleOops(nx, ny, false);
      return bump();
    }
    body.unshift({ x: nx, y: ny });
    if (nx === fruit.x && ny === fruit.y) {
      const worth = fruit.kind.gold ? 2 : 1;
      eaten = Math.min(target, eaten + worth);
      ctx.sfx.pop();
      fx.burst(nx * C + C / 2, ny * C + C / 2 + HUD, fruit.kind.gold ? 36 : 18, 240, [fruit.kind.body, '#fff', '#FFD23F']);
      txt.add(fruit.kind.gold ? 'Golden! +2' : little ? String(eaten) : '+1', nx * C + C / 2, ny * C + HUD, '#FFD23F', 30);
      if (fruit.kind.gold) { ctx.sfx.good(); body.push({ ...body[body.length - 1] }); }
      if (little || eaten % 5 === 0) ctx.say(String(eaten));
      if (eaten >= target) return win();
      placeFruit();
    } else {
      body.pop();
    }
  }

  function littleOops(nx, ny, rock) {
    ctx.sfx.oops();
    ctx.say('Oops!');
    txt.add('Oops!', nx * C + C / 2, ny * C + HUD, '#fff', 28);
    if (!rock) {
      const cut = body.findIndex(s => s.x === nx && s.y === ny);
      body = body.slice(0, Math.max(3, cut));
    } else {
      // Turn to a free direction so the caterpillar can keep going.
      const h = body[0];
      const opts = Object.values(DIRS).filter(([dx, dy]) => !(dx === -dir[0] && dy === -dir[1]) &&
        !rocks.has(((h.x + dx + COLS) % COLS) + ',' + ((h.y + dy + ROWS) % ROWS)));
      if (opts.length) dir = opts[(Math.random() * opts.length) | 0];
      queue = [];
    }
    hurtT = 0.6; pauseT = 0.4;
  }

  function bump() {
    hearts--;
    ctx.sfx.oops();
    const h = body[0];
    fx.burst(h.x * C + C / 2, h.y * C + C / 2 + HUD, 20, 200, ['#9AA6FF', '#fff']);
    if (hearts <= 0) {
      over = true;
      ctx.say(`Good try! You ate ${eaten} fruit!`);
      setTimeout(() => ctx.finish(1), 1800);
      return;
    }
    ctx.say('Bump! Try again!');
    reset();
    pauseT = 1.2; hurtT = 1.2;
  }

  function win() {
    over = true;
    ctx.sfx.tada();
    fx.burst(W / 2, H / 2, 70, 420);
    ctx.say(`Yum! You ate ${eaten} fruit!`);
    setTimeout(() => ctx.finish(little ? 3 : hearts), 2000);
  }

  // Lets automated tests finish quickly. Harmless in normal play.
  if (window.__playroomTest) window.__playroomTest.snake = { win: () => { eaten = target - 1; win(); } };

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    if (hurtT > 0) hurtT -= dt;
    if (warpT > 0) warpT -= dt;
    if (over) return;
    for (const d of ['up', 'down', 'left', 'right']) if (A.keys[d]) want(d);
    if (pauseT > 0) { pauseT -= dt; return; }
    // Hopping fruit jumps to a new spot every few seconds.
    if (hoppingFruit && t > fruit.hopAt) {
      const old = { x: fruit.x, y: fruit.y };
      const kind = fruit.kind;
      placeFruit(); fruit.kind = kind;
      fruit.hopAt = t + (little ? 7 : 5 - Math.min(2, (L - 10) * 0.2));
      fx.burst(old.x * C + C / 2, old.y * C + C / 2 + HUD, 8, 120, ['#fff']);
    }
    stepT += dt;
    if (stepT >= interval()) { stepT = 0; step(); }
  }

  function drawFruit(f) {
    const cx = f.x * C + C / 2, cy = f.y * C + C / 2 + HUD + Math.sin(t * 4) * 2;
    if (f.kind.gold) { g.fillStyle = 'rgba(255,215,0,.35)'; g.beginPath(); g.arc(cx, cy + 2, 20 + Math.sin(t * 8) * 3, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(cx, cy + 15, 12, 4, 0, 0, 7); g.fill();
    g.fillStyle = f.kind.body; g.beginPath(); g.arc(cx, cy + 2, 14, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx - 5, cy - 3, 4, 3, -0.6, 0, 7); g.fill();
    g.strokeStyle = '#7A4E2D'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy - 10); g.lineTo(cx + 2, cy - 16); g.stroke();
    g.fillStyle = f.kind.leaf; g.beginPath(); g.ellipse(cx + 8, cy - 14, 7, 4, -0.5, 0, 7); g.fill();
    if (hoppingFruit && fruit.hopAt - t < 1.2) { g.fillStyle = '#fff'; g.font = '900 16px Nunito, system-ui'; g.textAlign = 'center'; g.fillText('!', cx + 14, cy - 12); }
  }

  function drawRock(x, y) {
    const px = x * C, py = y * C + HUD;
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(px + C / 2, py + C - 5, C * 0.42, 6, 0, 0, 7); g.fill();
    g.fillStyle = theme.rock; roundRect(g, px + 3, py + 4, C - 6, C - 8, 12); g.fill();
    g.fillStyle = 'rgba(255,255,255,.3)'; roundRect(g, px + 8, py + 8, C - 20, 7, 4); g.fill();
  }

  function drawPortal(p, k) {
    const cx = p.x * C + C / 2, cy = p.y * C + C / 2 + HUD;
    for (let i = 3; i > 0; i--) {
      g.strokeStyle = k ? `rgba(46,196,182,${0.3 + i * 0.2})` : `rgba(142,108,239,${0.3 + i * 0.2})`;
      g.lineWidth = 4;
      g.beginPath(); g.arc(cx, cy, i * 6 + Math.sin(t * 5 + i) * 1.5, t * 3 + i, t * 3 + i + 4.5); g.stroke();
    }
  }

  function draw() {
    g.fillStyle = '#2B2160'; g.fillRect(0, 0, W, HUD);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      g.fillStyle = (x + y) % 2 ? theme.a : theme.b;
      g.fillRect(x * C, y * C + HUD, C, C);
    }
    if (theme.name === 'Night') {
      g.fillStyle = 'rgba(255,255,200,.7)';
      for (let i = 0; i < 18; i++) { const tw = Math.sin(t * 2 + i) > 0.6; if (tw) { g.beginPath(); g.arc((i * 137) % W, HUD + (i * 71) % (H - HUD), 2, 0, 7); g.fill(); } }
    }
    if (!little) { g.strokeStyle = theme.edge; g.lineWidth = 6; g.strokeRect(3, HUD + 3, W - 6, H - HUD - 6); }
    for (const k of rocks) { const [x, y] = k.split(',').map(Number); drawRock(x, y); }
    portals.forEach(drawPortal);
    drawFruit(fruit);

    // Caterpillar: tail to head
    const blink = (hurtT > 0 || warpT > 0) && Math.floor(t * 12) % 2;
    if (!blink) {
      for (let i = body.length - 1; i >= 1; i--) {
        const s = body[i];
        const cx = s.x * C + C / 2, cy = s.y * C + C / 2 + HUD;
        const wob = Math.sin(t * 10 - i * 0.8) * 2;
        g.fillStyle = i % 2 ? '#3BB273' : '#5FCF8C';
        g.beginPath(); g.arc(cx, cy + wob, C * 0.44, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(cx - 5, cy - 6 + wob, 5, 0, 7); g.fill();
        g.fillStyle = '#2A8A55';
        g.beginPath(); g.arc(cx - 8, cy + 15 + wob, 3.5, 0, 7); g.arc(cx + 8, cy + 15 + wob, 3.5, 0, 7); g.fill();
      }
      const h = body[0];
      const hx = h.x * C + C / 2, hy = h.y * C + C / 2 + HUD;
      const [dx, dy] = dir;
      g.strokeStyle = '#2B2140'; g.lineWidth = 3;
      for (const side of [-1, 1]) {
        const ax = hx + side * 8, ay = hy - 10;
        const tx = ax + side * 6 + dx * 7, ty = ay - 13 + dy * 4;
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(tx, ty); g.stroke();
        g.fillStyle = '#FF7EB6'; g.beginPath(); g.arc(tx, ty, 4.5, 0, 7); g.fill();
      }
      g.fillStyle = '#FFB23F'; g.beginPath(); g.arc(hx, hy, C * 0.5, 0, 7); g.fill();
      for (const side of [-1, 1]) {
        const ex = hx + dx * 5 + side * 8, ey = hy + dy * 5 - 3;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, 6.5, 0, 7); g.fill();
        g.fillStyle = '#2B2140'; g.beginPath(); g.arc(ex + dx * 2, ey + dy * 2, 3.5, 0, 7); g.fill();
      }
      g.strokeStyle = '#2B2140'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(hx + dx * 5, hy + 6 + dy * 3, 5, 0.2, Math.PI - 0.2); g.stroke();
    }

    fx.draw(g); txt.draw(g);
    hudText(g, `🍎 ${eaten} / ${target}`, 12, 8, { size: 24, color: '#FFD23F' });
    if (!little) hudText(g, '❤️'.repeat(Math.max(0, hearts)), W - 12, 8, { size: 22, align: 'right' });
    const bw = 180, bx = W / 2 - bw / 2;
    g.fillStyle = 'rgba(255,255,255,.2)'; roundRect(g, bx, 16, bw, 12, 6); g.fill();
    g.fillStyle = '#3BB273'; roundRect(g, bx, 16, bw * Math.min(1, eaten / target), 12, 6); g.fill();
    if (pauseT > 0.5 && !over && t < 1.3) hudText(g, `${theme.deco} Level ${L}`, W / 2, H / 2 - 30, { size: 50, align: 'center', color: '#FFD23F' });
  }

  const extras = [];
  if (portals.length) extras.push('Go through the magic portals!');
  if (hoppingFruit) extras.push('The fruit hops around, so be quick!');
  if (golden && L === 5) extras.push('Golden fruit counts double!');
  ctx.instruct(little
    ? `Help the caterpillar eat ${target} fruit! ${extras.join(' ')}`
    : `Eat ${target} fruit! Don't bump the walls, the rocks or your tail! ${extras.join(' ')}`);
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); if (window.__playroomTest) delete window.__playroomTest.snake; };
}
