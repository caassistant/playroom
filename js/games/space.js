// Space Defenders: Bo flies a little rocket and pops wobbly space bubbles.
// No violence: bubbles pop into stars. Ends in a celebration whatever happens.
// 20 levels: different formations, zig-zag divers, shielded bubbles (2 pops), splitting bubbles,
// a giant boss bubble every 5 levels, and more power-ups (double shot, shield, rapid fire, extra heart).
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText, sprite, drawStar } from './arcade-kit.js';

const W = 520, H = 640;
const BLOB_COLORS = ['#FF7EB6', '#5FBF9A', '#B58BD9', '#FFB347', '#6EC6FF'];
// Formation shapes on a 7x5 grid (x = bubble, . = empty).
const SHAPES = [
  ['xxxxxxx', 'xxxxxxx', 'xxxxxxx'],
  ['x.....x', '.x...x.', '..x.x..', '...x...'],                       // V
  ['...x...', '..xxx..', '.xxxxx.', '..xxx..', '...x...'],            // diamond
  ['xx...xx', 'xx...xx', 'xx...xx', 'xx...xx'],                       // two towers
  ['.xxxxx.', 'x.....x', 'x.....x', '.xxxxx.'],                       // ring
  ['x.x.x.x', '.x.x.x.', 'x.x.x.x', '.x.x.x.'],                       // checker
  ['...x...', '..xxx..', '.xx.xx.', 'xx...xx'],                       // arrow
  ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'], // heart
  ['x.....x', '.x...x.', '..xxx..', '.x...x.', 'x.....x'],            // X
  ['xxxxxxx', '.......', 'xxxxxxx', '.......', 'xxxxxxx'],            // stripes
];

export default function start(ctx) {
  ctx.hideMascot();
  const L = Math.max(1, ctx.level | 0);
  const lvl = 1 + (L - 1) * 0.2;          // smooth difficulty factor, 1..4.8
  const bossLevel = L % 5 === 0;
  const WAVES = (L <= 3 ? 2 : L <= 14 ? 3 : 4) + (bossLevel ? 1 : 0);
  ctx.dots(WAVES);
  const A = arcadeLayout(ctx.stage, {
    w: W, h: H,
    left: [[{ id: 'left', label: '◀' }, { id: 'right', label: '▶' }]],
    right: [[{ id: 'a', label: '✨', color: '#FFD23F' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();

  const ship = { x: W / 2, y: H - 70, target: null, inv: 0, shield: 0, dbl: 0 };
  let hearts = 3, wave = 0, blobs = [], shots = [], drops = [], powers = [], t = 0, fireT = 0;
  let form = { x: 0, dir: 1, y: 0 };
  let boss = null;
  let phase = 'intro', phaseT = 2, score = 0, over = false;
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 0.5, v: 20 + Math.random() * 50 }));

  function makeWave() {
    blobs = []; boss = null;
    form = { x: 0, dir: 1, y: 0 };
    if (bossLevel && wave === WAVES - 1) {
      const hp = 12 + L;
      boss = { x: W / 2, y: 130, r: 62, hp, max: hp, dir: 1, ph: 0, spawnT: 3 };
      ctx.say('A giant bubble! Pop it lots of times!');
      return;
    }
    const shape = SHAPES[(L + wave * 3 - 1) % SHAPES.length];
    shape.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== 'x') return;
      const roll = Math.random();
      let kind = 'plain';
      if (L >= 8 && roll < 0.15) kind = 'split';
      else if (L >= 6 && roll < 0.33) kind = 'shield';
      else if (L >= 4 && roll < 0.45) kind = 'zig';
      blobs.push({ cx: 66 + c * 64, cy: 80 + r * 50, r: 20, color: BLOB_COLORS[(r + c) % BLOB_COLORS.length], ph: Math.random() * 6, alive: true,
        kind, hp: kind === 'shield' ? 2 : 1, dive: null, diveT: 3 + Math.random() * 8 });
    }));
  }

  const speed = () => 30 + lvl * 8 + wave * 10;
  const blobPos = b => b.dive ? { x: b.dive.x, y: b.dive.y } : b.free ? { x: b.fx, y: b.fy } : { x: b.cx + form.x, y: b.cy + form.y };
  function popBlob(b, p) {
    if (b.hp > 1) { b.hp--; ctx.sfx.tap(); fx.burst(p.x, p.y, 10, 160, ['#BDE7FF', '#fff']); txt.add('Ping!', p.x, p.y - 20, '#BDE7FF', 22); return; }
    b.alive = false; score++;
    ctx.sfx.pop();
    fx.burst(p.x, p.y, 14, 200, [b.color, '#FFD23F', '#fff']);
    txt.add('⭐', p.x, p.y, '#FFD23F', 26);
    if (b.kind === 'split') {
      for (const s of [-1, 1]) blobs.push({ free: true, fx: p.x + s * 12, fy: p.y, vx: s * 70, vy: 40, r: 12, color: b.color, ph: 0, alive: true, kind: 'mini', hp: 1 });
    }
    if (Math.random() < 0.09) {
      const kinds = L >= 7 ? ['dbl', 'shield', 'rapid', 'heart'] : ['dbl', 'shield'];
      powers.push({ x: p.x, y: p.y, kind: kinds[(Math.random() * kinds.length) | 0] });
    }
  }

  function fire() {
    if (phase !== 'play') return;
    if (shots.length > (ship.dbl > 0 ? 6 : 3)) return;
    if (ship.dbl > 0) { shots.push({ x: ship.x - 14, y: ship.y - 30 }, { x: ship.x + 14, y: ship.y - 30 }); }
    else shots.push({ x: ship.x, y: ship.y - 34 });
    ctx.sfx.tap();
  }
  A.onPress(id => { if (id === 'a' || id === 'up') { fire(); fireT = 0; } });

  // Drag anywhere on the canvas to steer.
  A.canvas.addEventListener('pointerdown', e => { e.preventDefault(); A.canvas.setPointerCapture(e.pointerId); ship.target = A.toLocal(e).x; });
  A.canvas.addEventListener('pointermove', e => { if (ship.target !== null) ship.target = A.toLocal(e).x; });
  const release = () => { ship.target = null; };
  A.canvas.addEventListener('pointerup', release);
  A.canvas.addEventListener('pointercancel', release);

  function hurt() {
    if (ship.inv > 0) return;
    if (ship.shield > 0) { ship.shield = 0; ship.inv = 1; ctx.sfx.tap(); txt.add('Shield!', ship.x, ship.y - 50, '#6EC6FF', 28); return; }
    hearts--;
    ship.inv = 2;
    ctx.sfx.oops();
    fx.burst(ship.x, ship.y, 20, 220, ['#fff', '#FF5A5F']);
    if (hearts <= 0) {
      over = true; phase = 'done';
      ctx.say(`Good try, space captain! You popped ${score} bubbles!`);
      setTimeout(() => ctx.finish(1), 1800);
    } else ctx.say('Oops! Keep going!');
  }

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    for (const s of stars) { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }
    if (phase === 'intro') {
      phaseT -= dt;
      if (phaseT <= 0) { phase = 'play'; makeWave(); }
      return;
    }
    if (phase !== 'play') return;

    // Ship
    const sp = 360;
    if (A.keys.left) ship.x -= sp * dt;
    if (A.keys.right) ship.x += sp * dt;
    if (ship.target !== null) ship.x += (ship.target - ship.x) * Math.min(1, dt * 12);
    ship.x = Math.max(30, Math.min(W - 30, ship.x));
    if (ship.inv > 0) ship.inv -= dt;
    if (ship.shield > 0) ship.shield -= dt;
    if (ship.dbl > 0) ship.dbl -= dt;
    if (ship.rapid > 0) ship.rapid -= dt;
    // Auto-fire while finger/button held, slowly otherwise
    fireT += dt;
    const holding = A.keys.a || ship.target !== null;
    if (fireT > (holding ? (ship.rapid > 0 ? 0.14 : 0.28) : 0.55)) { fireT = 0; fire(); }

    // Boss bubble
    if (boss) {
      boss.ph += dt;
      boss.x += boss.dir * (70 + L * 3) * dt;
      if (boss.x > W - boss.r - 10 || boss.x < boss.r + 10) boss.dir *= -1;
      boss.y = 130 + Math.sin(boss.ph * 0.8) * 30;
      if (Math.random() < dt * (1.2 + L * 0.05)) drops.push({ x: boss.x + (Math.random() - 0.5) * boss.r, y: boss.y + boss.r, vy: 130 + L * 4 });
      boss.spawnT -= dt;
      if (boss.spawnT <= 0) {
        boss.spawnT = 4;
        for (const s of [-1, 1]) blobs.push({ free: true, fx: boss.x + s * 40, fy: boss.y + 30, vx: s * 60, vy: 30, r: 14, color: '#FF7EB6', ph: 0, alive: true, kind: 'mini', hp: 1 });
      }
    }

    // Formation
    const alive = blobs.filter(b => b.alive);
    form.x += form.dir * speed() * dt;
    const xs = alive.filter(b => !b.free).map(b => b.cx + form.x);
    if (xs.length && (Math.max(...xs) > W - 26 || Math.min(...xs) < 26)) {
      form.dir *= -1;
      form.x += form.dir * 4;
      form.y += 16;
    }
    const lowest = Math.max(0, ...alive.filter(b => !b.free).map(b => b.cy + form.y));
    if (lowest > H - 140) { form.y -= 180; hurt(); }
    // Zig-zag divers swoop down and back up; little mini bubbles float about.
    for (const b of alive) {
      if (b.free) {
        b.fx += b.vx * dt; b.fy += b.vy * dt;
        if (b.fx < 16 || b.fx > W - 16) b.vx *= -1;
        if (b.fy > H - 120) b.vy = -Math.abs(b.vy);
        if (b.fy < 60) b.vy = Math.abs(b.vy);
        if (Math.abs(b.fx - ship.x) < 26 && Math.abs(b.fy - ship.y) < 24) { b.alive = false; hurt(); }
        continue;
      }
      if (b.kind !== 'zig') continue;
      if (!b.dive) {
        b.diveT -= dt;
        if (b.diveT <= 0) { const p = blobPos(b); b.dive = { x: p.x, y: p.y, t: 0, sx: p.x }; }
      } else {
        b.dive.t += dt;
        const k = b.dive.t;
        b.dive.x = b.dive.sx + Math.sin(k * 4) * 70;
        b.dive.y = b.cy + form.y + Math.sin(Math.min(Math.PI, k * 1.1)) * (H - 300);
        if (Math.abs(b.dive.x - ship.x) < 26 && Math.abs(b.dive.y - ship.y) < 24) hurt();
        if (k * 1.1 >= Math.PI) { b.dive = null; b.diveT = 4 + Math.random() * 6; }
      }
    }

    // Goo drops
    if (alive.length && Math.random() < dt * (0.5 + lvl * 0.25 + wave * 0.2)) {
      const b = alive[(Math.random() * alive.length) | 0];
      const p = blobPos(b);
      drops.push({ x: p.x, y: p.y + 18, vy: 110 + lvl * 15 });
    }
    for (const d of drops) d.y += d.vy * dt;
    drops = drops.filter(d => {
      if (d.y > H + 20) return false;
      if (Math.abs(d.x - ship.x) < 24 && Math.abs(d.y - ship.y) < 22) { hurt(); return false; }
      return true;
    });

    // Shots
    for (const s of shots) s.y -= 520 * dt;
    shots = shots.filter(s => {
      if (s.y < -20) return false;
      for (const b of blobs) {
        if (!b.alive) continue;
        const p = blobPos(b);
        if (Math.hypot(p.x - s.x, p.y - s.y) < b.r + 6) { popBlob(b, p); return false; }
      }
      if (boss && Math.hypot(boss.x - s.x, boss.y - s.y) < boss.r) {
        boss.hp--; ctx.sfx.tap();
        fx.burst(s.x, s.y, 8, 160, ['#FF7EB6', '#fff']);
        if (boss.hp <= 0) {
          score += 10; ctx.sfx.tada();
          fx.burst(boss.x, boss.y, 90, 480);
          txt.add('MEGA POP!', boss.x, boss.y, '#FFD23F', 44);
          boss = null;
        }
        return false;
      }
      return true;
    });

    // Power-ups
    for (const p of powers) p.y += 120 * dt;
    powers = powers.filter(p => {
      if (p.y > H + 20) return false;
      if (Math.abs(p.x - ship.x) < 32 && Math.abs(p.y - ship.y) < 30) {
        ctx.sfx.good();
        if (p.kind === 'dbl') { ship.dbl = 8; txt.add('Double shot!', ship.x, ship.y - 50, '#FFD23F', 28); }
        else if (p.kind === 'rapid') { ship.rapid = 8; txt.add('Rapid fire!', ship.x, ship.y - 50, '#FF9F1C', 28); }
        else if (p.kind === 'heart') { hearts = Math.min(3, hearts + 1); txt.add('+❤️', ship.x, ship.y - 50, '#FF5A5F', 30); }
        else { ship.shield = 10; txt.add('Shield!', ship.x, ship.y - 50, '#6EC6FF', 28); }
        return false;
      }
      return true;
    });

    if (!blobs.some(b => b.alive) && !boss) {
      wave++;
      ctx.progress(wave);
      drops = []; shots = [];
      ctx.sfx.tada();
      fx.burst(W / 2, H / 2, 50, 400);
      if (wave >= WAVES) {
        over = true; phase = 'done';
        ctx.say('You saved the galaxy!');
        setTimeout(() => ctx.finish(hearts >= 3 ? 3 : hearts === 2 ? 2 : 1), 1800);
      } else {
        phase = 'intro'; phaseT = 2;
        ctx.say(bossLevel && wave === WAVES - 1 ? 'Boss bubble coming!' : `Wave ${wave + 1}!`);
      }
    }
  }

  function drawBoss() {
    const { x, y, r } = boss;
    const wob = Math.sin(t * 3) * 4;
    g.fillStyle = '#FF7EB6'; g.beginPath(); g.ellipse(x, y, r + wob, r - wob, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.15, -0.6, 0, 7); g.fill();
    g.fillStyle = '#FFD23F';   // a little crown
    g.beginPath(); g.moveTo(x - 30, y - r + 6); g.lineTo(x - 30, y - r - 22); g.lineTo(x - 14, y - r - 8); g.lineTo(x, y - r - 26); g.lineTo(x + 14, y - r - 8); g.lineTo(x + 30, y - r - 22); g.lineTo(x + 30, y - r + 6); g.closePath(); g.fill();
    g.fillStyle = '#2B2140';
    for (const ex of [-20, 20]) { g.beginPath(); g.arc(x + ex, y - 6, 8, 0, 7); g.fill(); }
    g.fillRect(x - 32, y - 24, 20, 5); g.fillRect(x + 12, y - 24, 20, 5);
    g.strokeStyle = '#2B2140'; g.lineWidth = 4; g.beginPath(); g.arc(x, y + 22, 12, Math.PI + 0.3, -0.3); g.stroke();
    // health bar
    g.fillStyle = 'rgba(255,255,255,.25)'; roundRect(g, W / 2 - 120, 44, 240, 14, 7); g.fill();
    g.fillStyle = '#FF7EB6'; roundRect(g, W / 2 - 120, 44, 240 * boss.hp / boss.max, 14, 7); g.fill();
  }

  function drawBlob(b) {
    const p = blobPos(b);
    const wob = Math.sin(t * 5 + b.ph) * 2;
    g.fillStyle = b.color;
    g.beginPath(); g.ellipse(p.x, p.y, b.r + wob, b.r - wob, 0, 0, 7); g.fill();
    // little antenna
    g.strokeStyle = b.color; g.lineWidth = 3;
    g.beginPath(); g.moveTo(p.x, p.y - b.r + 2); g.lineTo(p.x + 4, p.y - b.r - 10); g.stroke();
    g.fillStyle = '#FFD23F'; g.beginPath(); g.arc(p.x + 4, p.y - b.r - 11, 4, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(p.x - 7, p.y - 8, 6, 4, -0.5, 0, 7); g.fill();
    g.fillStyle = '#2B2140';
    for (const ex of [-7, 7]) { g.beginPath(); g.arc(p.x + ex, p.y - 1, 3.5, 0, 7); g.fill(); }
    g.strokeStyle = '#2B2140'; g.lineWidth = 2.5;
    g.beginPath(); g.arc(p.x, p.y + 4, 5, 0.2, Math.PI - 0.2); g.stroke();
    if (b.kind === 'shield' && b.hp > 1) { g.strokeStyle = 'rgba(189,231,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, b.r + 7, 0, 7); g.stroke(); }
    if (b.kind === 'split') { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, p.y - b.r + 4); g.lineTo(p.x, p.y + b.r - 4); g.stroke(); }
    if (b.kind === 'zig') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(p.x - 5, p.y + b.r); g.lineTo(p.x, p.y + b.r + 7); g.lineTo(p.x + 5, p.y + b.r); g.fill(); }
  }

  function drawShip() {
    if (ship.inv > 0 && Math.floor(t * 12) % 2) return;
    const x = ship.x, y = ship.y;
    // flame
    g.fillStyle = Math.floor(t * 20) % 2 ? '#FFD23F' : '#FF9F1C';
    g.beginPath(); g.moveTo(x - 10, y + 22); g.lineTo(x, y + 40 + Math.random() * 8); g.lineTo(x + 10, y + 22); g.fill();
    // fins
    g.fillStyle = '#3A86FF';
    g.beginPath(); g.moveTo(x - 16, y + 4); g.lineTo(x - 30, y + 26); g.lineTo(x - 14, y + 22); g.fill();
    g.beginPath(); g.moveTo(x + 16, y + 4); g.lineTo(x + 30, y + 26); g.lineTo(x + 14, y + 22); g.fill();
    // body
    g.fillStyle = '#F4F4F8';
    g.beginPath(); g.moveTo(x, y - 34); g.quadraticCurveTo(x + 22, y - 10, x + 17, y + 24); g.lineTo(x - 17, y + 24); g.quadraticCurveTo(x - 22, y - 10, x, y - 34); g.fill();
    g.fillStyle = '#FF5A5F';
    g.beginPath(); g.moveTo(x, y - 34); g.quadraticCurveTo(x + 12, y - 24, x + 15, y - 16); g.lineTo(x - 15, y - 16); g.quadraticCurveTo(x - 12, y - 24, x, y - 34); g.fill();
    // Bo in the window
    g.fillStyle = '#BDE7FF'; g.beginPath(); g.arc(x, y + 2, 12, 0, 7); g.fill();
    const img = sprite('bo', 'happy');
    if (img.complete) { g.save(); g.beginPath(); g.arc(x, y + 2, 11, 0, 7); g.clip(); g.drawImage(img, x - 13, y - 10, 26, 26); g.restore(); }
    if (ship.shield > 0) {
      g.strokeStyle = `rgba(110,198,255,${0.5 + Math.sin(t * 8) * 0.3})`; g.lineWidth = 4;
      g.beginPath(); g.arc(x, y, 42, 0, 7); g.stroke();
    }
  }

  function draw() {
    g.fillStyle = '#120F2E'; g.fillRect(0, 0, W, H);
    for (const s of stars) { g.fillStyle = `rgba(255,255,255,${0.4 + s.s / 4})`; g.fillRect(s.x, s.y, s.s, s.s); }
    // a friendly planet
    g.fillStyle = '#4B3F8F'; g.beginPath(); g.arc(W - 60, 110, 46, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,210,63,.6)'; g.lineWidth = 5; g.beginPath(); g.ellipse(W - 60, 110, 72, 14, -0.3, 0, 7); g.stroke();

    for (const b of blobs) if (b.alive) drawBlob(b);
    if (boss) drawBoss();
    g.fillStyle = '#7BE495';
    for (const d of drops) { g.beginPath(); g.ellipse(d.x, d.y, 6, 9, 0, 0, 7); g.fill(); }
    for (const s of shots) {
      g.fillStyle = '#FFD23F'; roundRect(g, s.x - 3, s.y - 10, 6, 18, 3); g.fill();
    }
    for (const p of powers) {
      g.fillStyle = { dbl: '#FFD23F', shield: '#6EC6FF', rapid: '#FF9F1C', heart: '#FF5A5F' }[p.kind];
      g.beginPath(); g.arc(p.x, p.y, 16, 0, 7); g.fill();
      if (p.kind === 'dbl') drawStar(g, p.x, p.y, 10, '#fff');
      else if (p.kind === 'rapid') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(p.x - 3, p.y - 10); g.lineTo(p.x + 6, p.y - 10); g.lineTo(p.x + 1, p.y); g.lineTo(p.x + 7, p.y); g.lineTo(p.x - 5, p.y + 11); g.lineTo(p.x - 1, p.y + 2); g.lineTo(p.x - 7, p.y + 2); g.closePath(); g.fill(); }
      else if (p.kind === 'heart') { g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x - 4, p.y - 2, 5, 0, 7); g.arc(p.x + 4, p.y - 2, 5, 0, 7); g.fill(); g.beginPath(); g.moveTo(p.x - 9, p.y); g.lineTo(p.x, p.y + 9); g.lineTo(p.x + 9, p.y); g.fill(); }
      else { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 9, 0, 7); g.stroke(); }
    }
    drawShip();
    fx.draw(g); txt.draw(g);
    hudText(g, '❤️'.repeat(Math.max(0, hearts)), 10, 8, { size: 24 });
    hudText(g, `⭐ ${score}`, W - 10, 8, { size: 24, align: 'right', color: '#FFD23F' });
    if (phase === 'intro') {
      hudText(g, `LEVEL ${L}`, W / 2, H / 2 - 100, { size: 34, align: 'center', color: '#fff' });
      hudText(g, bossLevel && wave === WAVES - 1 ? 'BOSS!' : `WAVE ${wave + 1}`, W / 2, H / 2 - 50, { size: 60, align: 'center', color: '#FFD23F' });
    }
    if (phase === 'done' && hearts > 0) hudText(g, 'YOU WIN!', W / 2, H / 2 - 40, { size: 60, align: 'center', color: '#FFD23F' });
  }

  // Lets automated tests finish quickly. Harmless in normal play.
  if (window.__playroomTest) window.__playroomTest.space = { win: () => { wave = WAVES - 1; blobs = []; boss = null; phase = 'play'; }, boss: () => { wave = WAVES - 1; phase = 'play'; makeWave(); } };

  ctx.instruct('Move your rocket and pop all the space bubbles! Dodge the green goo!'
    + (L === 4 ? ' Some bubbles zig-zag down!' : '') + (L === 6 ? ' Bubbles with shields need two pops!' : '') + (L === 8 ? ' Some bubbles split in two!' : ''));
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); if (window.__playroomTest) delete window.__playroomTest.space; };
}
