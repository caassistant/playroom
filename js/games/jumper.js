// Jump Island: Mango runs and jumps across a sunny island to reach the flag.
// Collect stars and fish, bop the grumpy raincloud Puffs by landing on them.
// Little mode: wide platforms, falling just pops Mango back up — no lives lost.
// 20 levels in five worlds (beach, forest, caves, clouds, snow), each with its own layout.
// New things appear as you go: springs, moving and crumbling platforms, windy gusts, slippery snow.
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText, sprite, drawStar } from './arcade-kit.js';

const W = 800, H = 450, GROUND = 380;
const PW = 46, PH = 52;            // Mango's hitbox

const THEMES = [
  { name: 'Beach',  sky: ['#7FD3FF', '#D8F3FF'], sun: '#FFF3A8', hills: '#A7D98B', sea: '#3EA8E0', top: '#5DBB63', dirt: '#E8C27A', dots: '#D4A95E', plat: '#B67A4C', deco: '🌴' },
  { name: 'Forest', sky: ['#9BE3B0', '#E4FBE9'], sun: '#FFF3A8', hills: '#3E9E5B', sea: '#2E7D4F', top: '#3BB273', dirt: '#8E5B3A', dots: '#6F4429', plat: '#7A4E2D', deco: '🌳' },
  { name: 'Caves',  sky: ['#3A2E5C', '#6B5B95'], sun: '#C9B8FF', hills: '#4B3F7A', sea: '#1C1638', top: '#8E6CEF', dirt: '#5B4C8A', dots: '#47396F', plat: '#6A5AA0', deco: '💎' },
  { name: 'Clouds', sky: ['#FFB8D9', '#FFE9F3'], sun: '#FFF3A8', hills: '#FFFFFF', sea: '#FFD6EA', top: '#FFFFFF', dirt: '#F2F4FF', dots: '#DDE2F7', plat: '#E6E9FA', deco: '🎈' },
  { name: 'Snow',   sky: ['#BFE3FF', '#F2FAFF'], sun: '#FFFFFF', hills: '#E3F2FF', sea: '#8FC7F0', top: '#FFFFFF', dirt: '#CFE6F7', dots: '#B5D6EE', plat: '#A9C9E6', deco: '⛄' },
];

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const L = Math.max(1, ctx.level | 0);
  const lvl = 1 + (L - 1) * 0.18;     // smooth difficulty, 1..4.4
  const theme = THEMES[Math.min(4, Math.floor((L - 1) / 4))];
  const snowy = theme.name === 'Snow';
  const useSprings = little ? L >= 5 : L >= 3;
  const useCrumble = little ? L >= 12 : L >= 6;
  const useMovers = little ? L >= 8 : true;
  const useWind = little ? L >= 16 : L >= 10;
  const A = arcadeLayout(ctx.stage, {
    w: W, h: H,
    left: [[{ id: 'left', label: '◀' }, { id: 'right', label: '▶' }]],
    right: [[{ id: 'a', label: '⤒', color: '#FFD23F' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();

  /* ---------- Build the level ---------- */
  const R = rng(1234 + L * 77 + (little ? 0 : 999));
  const plats = [], treats = [], puffs = [], checkpoints = [], springs = [], winds = [];
  let x = 0;
  plats.push({ x: -200, y: GROUND, w: 700, ground: true });
  x = 500;
  const length = little ? 2200 + L * 140 : 3000 + L * 260;
  let segN = 0;
  while (x < length) {
    segN++;
    const gap = little ? 60 + R() * 50 : 80 + R() * (50 + lvl * 15);
    x += gap;
    const kind = R();
    if (segN === 1) {
      const w = little ? 520 : 420;
      plats.push({ x, y: GROUND, w, ground: true });
      for (let k = 0; k < 3; k++) treats.push({ x: x + 120 + k * 60, y: GROUND - 60, kind: 'star' });
      x += w;
    } else if (useMovers && kind < (little ? 0.15 : 0.18 + lvl * 0.03)) {
      // moving platform over a pit
      const w = little ? 190 : 150;
      plats.push({ x, y: GROUND - 70 - R() * 60, w, move: { ox: x, range: (little ? 60 : 90) + R() * 50, speed: (little ? 0.7 : 0.9) + R() * 0.5, ph: R() * 6 } });
      treats.push({ x: x + w / 2, y: plats[plats.length - 1].y - 50, kind: 'star' });
      x += w + 180;
    } else if (useSprings && kind < 0.36) {
      // ground with a spring that launches Mango up to a high ledge full of treats
      const w = 460;
      plats.push({ x, y: GROUND, w, ground: true });
      springs.push({ x: x + 110, y: GROUND, squash: 0 });
      const lw = 200, ly = GROUND - 250;
      plats.push({ x: x + 200, y: ly, w: lw });
      for (let k = 0; k < 4; k++) treats.push({ x: x + 230 + k * 45, y: ly - 40, kind: k % 2 ? 'fish' : 'star' });
      if (!little && R() < 0.5) puffs.push({ x: x + 300, minX: x + 260, maxX: x + w - 40, y: GROUND, dir: 1, alive: true, sp: 50 + lvl * 12 });
      x += w;
    } else if (useCrumble && kind < 0.5) {
      // crumbly stepping stones: don't stand still!
      const n = little ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const w = little ? 190 : 120;
        const y = GROUND - 50 - (k % 2) * 50;
        plats.push({ x, y, w, crumble: { t: null, oy: y, vy: 0, back: 0 } });
        treats.push({ x: x + w / 2, y: y - 40, kind: 'star' });
        x += w + (little ? 60 : 70 + R() * 30);
      }
      const w = little ? 420 : 320;
      plats.push({ x, y: GROUND, w, ground: true });
      x += w;
    } else if (kind < 0.72) {
      // ground stretch with a floating ledge
      const w = little ? 520 : 380 + R() * 200;
      plats.push({ x, y: GROUND, w, ground: true });
      const lw = 160;
      const ly = GROUND - 110 - R() * 40;
      plats.push({ x: x + w / 2 - lw / 2, y: ly, w: lw });
      for (let k = 0; k < 3; k++) treats.push({ x: x + w / 2 - 40 + k * 40, y: ly - 40, kind: k === 1 ? 'fish' : 'star' });
      if ((!little && R() < 0.5 + lvl * 0.08) || (little && L >= 3 && R() < 0.35 + L * 0.01)) puffs.push({ x: x + 60, minX: x + 20, maxX: x + w - 60, y: GROUND, dir: 1, alive: true, sp: little ? 35 : 50 + lvl * 12 });
      if (useWind && R() < 0.5) winds.push({ x0: x, x1: x + w, f: (R() < 0.5 ? -1 : 1) * (little ? 160 : 260 + lvl * 30) });
      x += w;
    } else {
      // stepping stones
      const n = little ? 2 : 3 + (L >= 12 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const w = little ? 200 : Math.max(90, 140 - L * 2);
        const y = GROUND - 40 - k * 45;
        plats.push({ x, y, w });
        treats.push({ x: x + w / 2, y: y - 40, kind: k % 2 ? 'fish' : 'star' });
        x += w + (little ? 60 : 70 + R() * 30);
      }
      const w = little ? 420 : 320;
      plats.push({ x, y: GROUND, w, ground: true });
      x += w;
    }
    if (!little && segN % 3 === 0) checkpoints.push({ x: x - 120, y: GROUND, hit: false });
  }
  plats.push({ x: x + 60, y: GROUND, w: 600, ground: true });
  const flag = { x: x + 380, y: GROUND };
  const totalTreats = treats.length;

  /* ---------- Player ---------- */
  const P = { x: 80, y: GROUND - PH, vx: 0, vy: 0, onGround: true, face: 1, coyote: 0, buffer: 0, inv: 0, plat: null };
  let hearts = 3, got = 0, cam = 0, t = 0, over = false;
  let safe = { x: 80, y: GROUND - PH };
  let respawn = { x: 80, y: GROUND - PH };

  A.onPress(id => { if (id === 'a' || id === 'up') P.buffer = 0.14; });
  const jumpHeld = () => A.keys.a || A.keys.up;

  function platRect(p) {
    if (p.move) p.x = p.move.ox + Math.sin(t * p.move.speed + p.move.ph) * p.move.range;
    return p;
  }
  // Crumbly platforms wobble, fall, then grow back.
  function crumbleUpdate(p, dt) {
    const c = p.crumble;
    if (c.t === null) return;
    c.t += dt;
    if (c.t > 0.65) { p.falling = true; c.vy += 1400 * dt; p.y += c.vy * dt; }
    if (c.t > 3.2) { p.falling = false; p.y = c.oy; c.vy = 0; c.t = null; }
  }

  function hurt(knock) {
    if (P.inv > 0) return;
    if (little) { P.vy = -400; P.vx = knock * 260; P.inv = 1; ctx.sfx.oops(); return; }
    hearts--; P.inv = 1.6; P.vy = -420; P.vx = knock * 300;
    ctx.sfx.oops();
    if (hearts <= 0) finishGame(false);
    else ctx.say('Ouch! Careful!');
  }

  function fell() {
    if (little) {
      ctx.sfx.whoosh();
      txt.add('Boing!', safe.x + PW / 2 - cam, safe.y - 20, '#fff', 30);
      P.x = safe.x; P.y = safe.y - 40; P.vx = 0; P.vy = -200; P.inv = 1;
      return;
    }
    hearts--;
    ctx.sfx.oops();
    if (hearts <= 0) { finishGame(false); return; }
    ctx.say('Whoops! Try again!');
    P.x = respawn.x; P.y = respawn.y - 20; P.vx = 0; P.vy = 0; P.inv = 1.5;
  }

  function finishGame(won) {
    if (over) return;
    over = true;
    const frac = got / Math.max(1, totalTreats);
    if (won) {
      ctx.sfx.tada();
      fx.burst(flag.x - cam, flag.y - 120, 70, 420);
      ctx.say(`You made it! You collected ${got} treats!`);
      let stars = frac >= 0.7 ? 3 : frac >= 0.4 ? 2 : 1;
      if (little) stars = Math.max(2, stars);
      else stars = Math.min(stars + (hearts === 3 ? 1 : 0), 3, hearts + 1);
      setTimeout(() => ctx.finish(stars), 2000);
    } else {
      ctx.say(`Good try! You collected ${got} treats!`);
      setTimeout(() => ctx.finish(1), 1800);
    }
  }

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    plats.forEach(platRect);
    for (const p of plats) if (p.crumble) crumbleUpdate(p, dt);
    for (const sp of springs) if (sp.squash > 0) sp.squash -= dt;
    if (over) { P.vx *= 0.9; return; }

    // Horizontal
    const dir = (A.keys.right ? 1 : 0) - (A.keys.left ? 1 : 0);
    const maxV = little ? 230 : 280;
    P.vx += dir * 1600 * dt;
    if (!dir) P.vx *= Math.pow(snowy ? 0.2 : 0.0005, dt);
    // Windy gusts push Mango along.
    for (const wz of winds) if (P.x + PW > wz.x0 && P.x < wz.x1) P.x += wz.f * dt * (0.6 + 0.4 * Math.sin(t * 2));
    P.vx = Math.max(-maxV, Math.min(maxV, P.vx));
    if (dir) P.face = dir;

    // Jump (buffer + coyote time, hold for higher)
    P.coyote -= dt; P.buffer -= dt;
    if (P.buffer > 0 && (P.onGround || P.coyote > 0)) {
      P.vy = little ? -700 : -740; P.onGround = false; P.coyote = 0; P.buffer = 0;
      ctx.sfx.flip();
    }
    if (P.vy >= 0) P.autoHop = false;
    if (!jumpHeld() && !P.autoHop && P.vy < -250) P.vy = -250;
    P.vy += 1900 * dt;
    if (P.vy > 900) P.vy = 900;

    // Ride moving platform
    if (P.onGround && P.plat && P.plat.move) {
      const nx = P.plat.move.ox + Math.sin(t * P.plat.move.speed + P.plat.move.ph) * P.plat.move.range;
      P.x += nx - (P.plat._lastX ?? nx);
    }
    plats.forEach(p => (p._lastX = p.x));

    const prevBottom = P.y + PH;
    P.x += P.vx * dt;
    P.y += P.vy * dt;
    P.x = Math.max(-150, P.x);

    // Land on platforms (one-way, from above)
    const wasGround = P.onGround;
    P.onGround = false;
    if (P.vy >= 0) {
      for (const p of plats) {
        if (p.falling) continue;
        if (P.x + PW - 8 > p.x && P.x + 8 < p.x + p.w && prevBottom <= p.y + 2 && P.y + PH >= p.y) {
          P.y = p.y - PH; P.vy = 0; P.onGround = true; P.plat = p;
          if (p.crumble && p.crumble.t === null) { p.crumble.t = 0; ctx.sfx.tap(); }
          if (!p.move && !p.crumble) safe = { x: Math.min(Math.max(P.x, p.x + 10), p.x + p.w - PW - 10), y: p.y - PH };
          break;
        }
      }
      // Springs!
      if (P.onGround) for (const sp of springs) {
        if (P.x + PW - 6 > sp.x - 26 && P.x + 6 < sp.x + 26 && Math.abs(P.y + PH - GROUND) < 4) {
          P.vy = -1120; P.onGround = false; P.autoHop = true; sp.squash = 0.25;
          ctx.sfx.whoosh(); txt.add('Boing!', sp.x - cam, GROUND - 60, '#FFD23F', 30);
        }
      }
    }
    if (wasGround && !P.onGround) P.coyote = 0.1;
    // Little mode: Mango hops over gaps by herself when running off an edge.
    if (little && P.onGround && P.plat && dir) {
      const atEdge = dir > 0 ? P.x + PW > P.plat.x + P.plat.w - 4 : P.x < P.plat.x + 4;
      const more = plats.some(p => p !== P.plat && (dir > 0 ? p.x > P.plat.x + P.plat.w - 10 : p.x + p.w < P.plat.x + 10));
      if (atEdge && more) { P.vy = -700; P.autoHop = true; P.onGround = false; P.vx = dir * 230; ctx.sfx.flip(); }
    }
    if (P.inv > 0) P.inv -= dt;

    // Treats
    for (const tr of treats) {
      if (tr.got) continue;
      if (Math.abs(P.x + PW / 2 - tr.x) < 34 && Math.abs(P.y + PH / 2 - tr.y) < 40) {
        tr.got = true; got++;
        ctx.sfx.star(got);
        fx.burst(tr.x - cam, tr.y, 10, 160, ['#FFD23F', '#fff']);
      }
    }
    // Puffs
    for (const pf of puffs) {
      if (!pf.alive) continue;
      pf.x += pf.dir * pf.sp * dt;
      if (pf.x < pf.minX || pf.x > pf.maxX) pf.dir *= -1;
      const px = pf.x, py = pf.y - 22;
      const cx = P.x + PW / 2, cy = P.y + PH / 2;
      if (Math.abs(cx - px) < 36 && Math.abs(cy - py) < 40) {
        if (P.vy > 50 && P.y + PH < py + 6) {
          pf.alive = false;
          P.vy = -520;
          ctx.sfx.pop();
          fx.burst(px - cam, py, 24, 260, ['#fff', '#BDE7FF', '#9AA6FF']);
          txt.add('BOP!', px - cam, py - 20, '#fff', 30);
        } else hurt(cx < px ? -1 : 1);
      }
    }
    // Checkpoints
    for (const c of checkpoints) if (!c.hit && P.x > c.x) { c.hit = true; respawn = { x: c.x, y: GROUND - PH }; ctx.sfx.ding(); txt.add('Checkpoint!', c.x - cam, c.y - 120, '#3BB273', 28); }
    // Fall
    if (P.y > H + 80) fell();
    // Flag
    if (P.x + PW > flag.x) finishGame(true);

    cam += (Math.max(0, P.x - W * 0.35) - cam) * Math.min(1, dt * 6);
  }

  /* ---------- Drawing ---------- */
  function drawFish(x, y) {
    g.fillStyle = '#FF9F1C';
    g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + 20, y - 9); g.lineTo(x + 20, y + 9); g.closePath(); g.fill();
    g.fillStyle = '#2EC4B6'; g.beginPath(); g.ellipse(x - 2, y, 15, 10, 0, 0, 7); g.fill();
    g.fillStyle = '#2B2140'; g.beginPath(); g.arc(x - 9, y - 2, 2.5, 0, 7); g.fill();
  }
  function drawPuff(pf) {
    const cx = pf.x - cam, cy = pf.y - 22 + Math.sin(t * 6 + pf.minX) * 2;
    g.fillStyle = '#7A8BA6';
    for (const [ox, oy, r] of [[-12, 4, 14], [12, 4, 14], [0, -8, 17], [0, 8, 15]]) { g.beginPath(); g.arc(cx + ox, cy + oy, r, 0, 7); g.fill(); }
    g.fillStyle = '#2B2140';
    for (const ex of [-7, 7]) { g.beginPath(); g.arc(cx + ex + pf.dir * 2, cy - 3, 4, 0, 7); g.fill(); }
    g.fillRect(cx - 12, cy - 13, 9, 3); g.fillRect(cx + 3, cy - 13, 9, 3);
  }

  function draw() {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = theme.sun; g.beginPath(); g.arc(W - 90, 70, 38, 0, 7); g.fill();
    if (snowy) { g.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 40; i++) { const fx2 = ((i * 97 - cam * 0.3 + Math.sin(t + i) * 20) % W + W) % W; const fy = (i * 53 + t * 40) % H; g.beginPath(); g.arc(fx2, fy, 2.5, 0, 7); g.fill(); } }
    // clouds (slow parallax)
    g.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 6; i++) { const cx = ((i * 260 - cam * 0.2) % (W + 300) + W + 300) % (W + 300) - 150; g.beginPath(); g.ellipse(cx, 60 + (i % 3) * 30, 60, 18, 0, 0, 7); g.fill(); }
    // distant islands
    g.fillStyle = theme.hills;
    for (let i = 0; i < 6; i++) { const cx = ((i * 330 - cam * 0.4) % (W + 400) + W + 400) % (W + 400) - 200; g.beginPath(); g.ellipse(cx, GROUND + 10, 140, 70, 0, Math.PI, 0); g.fill(); }
    // sea / pit
    g.fillStyle = theme.sea; g.fillRect(0, GROUND + 30, W, H);
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 12; i++) { const wx = ((i * 90 - cam * 0.6 + t * 20) % (W + 90) + W + 90) % (W + 90) - 45; g.fillRect(wx, GROUND + 44 + (i % 3) * 18, 34, 4); }

    g.save(); g.translate(-cam, 0);
    for (const p of plats) {
      if (p.x + p.w < cam - 50 || p.x > cam + W + 50) continue;
      if (p.ground) {
        g.fillStyle = theme.dirt; g.fillRect(p.x, p.y + 12, p.w, H - p.y);
        g.fillStyle = theme.dots; for (let k = p.x + 20; k < p.x + p.w - 10; k += 60) { g.beginPath(); g.arc(k, p.y + 40 + (k % 3) * 12, 4, 0, 7); g.fill(); }
        g.fillStyle = theme.top; roundRect(g, p.x - 4, p.y, p.w + 8, 18, 9); g.fill();
      } else {
        const shake = p.crumble && p.crumble.t !== null && !p.falling ? Math.sin(t * 60) * 2 : 0;
        g.globalAlpha = p.falling ? 0.6 : 1;
        g.fillStyle = p.crumble ? '#B9A58A' : p.move ? '#C98B5A' : theme.plat; roundRect(g, p.x + shake, p.y + 6, p.w, 18, 8); g.fill();
        g.fillStyle = p.crumble ? '#D8C7A8' : theme.top; roundRect(g, p.x - 3 + shake, p.y, p.w + 6, 12, 6); g.fill();
        if (p.crumble) { g.strokeStyle = 'rgba(43,33,64,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x + p.w * 0.3 + shake, p.y + 2); g.lineTo(p.x + p.w * 0.4 + shake, p.y + 20); g.moveTo(p.x + p.w * 0.7 + shake, p.y + 2); g.lineTo(p.x + p.w * 0.62 + shake, p.y + 20); g.stroke(); }
        g.globalAlpha = 1;
      }
    }
    // palm trees on the start beach
    g.font = '64px system-ui'; g.textAlign = 'center'; g.textBaseline = 'bottom';
    g.fillText(theme.deco, 40, GROUND + 4);
    for (const sp of springs) {
      const sq = sp.squash > 0 ? 8 : 0;
      g.strokeStyle = '#8E8E9E'; g.lineWidth = 4;
      g.beginPath(); for (let k = 0; k < 4; k++) { g.moveTo(sp.x - 16, sp.y - 4 - k * (6 - sq / 4)); g.lineTo(sp.x + 16, sp.y - 7 - k * (6 - sq / 4)); } g.stroke();
      g.fillStyle = '#FF5A5F'; roundRect(g, sp.x - 26, sp.y - 30 + sq, 52, 10, 5); g.fill();
    }
    for (const wz of winds) {
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const wx = wz.x0 + (((k * 97 + t * Math.abs(wz.f) * 0.8 * Math.sign(wz.f)) % (wz.x1 - wz.x0)) + (wz.x1 - wz.x0)) % (wz.x1 - wz.x0);
        const wy = GROUND - 60 - k * 40;
        g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + 40 * Math.sign(wz.f), wy); g.stroke();
      }
    }
    for (const c of checkpoints) {
      g.fillStyle = '#8E5B3A'; g.fillRect(c.x, c.y - 70, 6, 70);
      g.fillStyle = c.hit ? '#3BB273' : '#B8C0CC'; g.beginPath(); g.moveTo(c.x + 6, c.y - 70); g.lineTo(c.x + 40, c.y - 58); g.lineTo(c.x + 6, c.y - 46); g.fill();
    }
    // flag
    g.fillStyle = '#8E5B3A'; g.fillRect(flag.x, flag.y - 160, 8, 160);
    g.fillStyle = '#FF5A5F'; g.beginPath(); g.moveTo(flag.x + 8, flag.y - 160); g.lineTo(flag.x + 80, flag.y - 138 + Math.sin(t * 6) * 4); g.lineTo(flag.x + 8, flag.y - 116); g.fill();
    drawStar(g, flag.x + 4, flag.y - 170, 14);
    for (const tr of treats) {
      if (tr.got) continue;
      const bob = Math.sin(t * 4 + tr.x) * 4;
      if (tr.kind === 'star') drawStar(g, tr.x, tr.y + bob, 14); else drawFish(tr.x, tr.y + bob);
    }
    g.restore();
    for (const pf of puffs) if (pf.alive) drawPuff(pf);

    // Mango
    if (!(P.inv > 0 && Math.floor(t * 12) % 2)) {
      const img = sprite('mango', over ? 'cheer' : !P.onGround ? 'cheer' : 'happy');
      const s = 70;
      const run = P.onGround && Math.abs(P.vx) > 30 ? Math.abs(Math.sin(t * 16)) * 4 : 0;
      g.save();
      g.translate(P.x + PW / 2 - cam, P.y + PH - run);
      g.scale(P.face, 1);
      if (!P.onGround) g.rotate(P.vy < 0 ? -0.08 : 0.08);
      if (img.complete) g.drawImage(img, -s / 2, -s + 4, s, s);
      g.restore();
    }
    fx.draw(g); txt.draw(g);
    if (!little) hudText(g, '❤️'.repeat(Math.max(0, hearts)), 12, 10, { size: 24 });
    // treat counter
    drawStar(g, W - 110, 26, 14);
    hudText(g, `${got}/${totalTreats}`, W - 90, 10, { size: 26 });
    // progress bar to the flag
    const prog = Math.min(1, P.x / flag.x);
    g.fillStyle = 'rgba(43,33,64,.35)'; roundRect(g, W / 2 - 120, 16, 240, 10, 5); g.fill();
    g.fillStyle = '#FF5A5F'; roundRect(g, W / 2 - 120, 16, 240 * prog, 10, 5); g.fill();
    if (over && hearts > 0) hudText(g, 'YOU MADE IT!', W / 2, 140, { size: 60, align: 'center', color: '#FFD23F' });
    if (t < 2) hudText(g, `${theme.deco} Level ${L}: ${theme.name}`, W / 2, 120, { size: 44, align: 'center', color: '#FFD23F' });
  }

  // Lets automated tests finish quickly. Harmless in normal play.
  if (window.__playroomTest) window.__playroomTest.jumper = { win: () => { P.x = flag.x + 10; P.y = GROUND - PH; } };

  const news = [];
  if (springs.length && L === (little ? 5 : 3)) news.push('Jump on the red springs to bounce up high!');
  if (useCrumble && L === (little ? 12 : 6)) news.push('Wobbly stones fall down, so keep moving!');
  if (winds.length) news.push('Watch out for the wind!');
  if (snowy) news.push('The snow is slippery!');
  ctx.instruct((little ? 'Help Mango run and jump to the flag! Collect the stars!' : 'Run and jump to the flag! Collect stars and fish, and bop the grumpy Puffs by jumping on them!') + ' ' + news.join(' '));
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); if (window.__playroomTest) delete window.__playroomTest.jumper; };
}
