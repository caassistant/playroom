// Turbo Track: a pseudo-3D arcade racer (the classic "road rushing towards you" style).
// The car speeds up by itself; kids just steer. Collect ⭐ to fill the boost meter, then press 🚀.
// Little mode: the car gently keeps itself on the road and races are shorter.
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText, sprite, drawStar } from './arcade-kit.js';
import { CAST } from '../characters.js';

const W = 640, H = 400;
const SEG = 200, ROAD = 2000, CAM_H = 1000, DRAW = 140, LANES = 3;
const DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);
const PLAYER_Z = CAM_H * DEPTH;
const CAR_COLORS = ['#3A86FF', '#3BB273', '#8E6CEF', '#FF9F1C', '#2EC4B6', '#FF7EB6', '#FFD23F', '#9A6237'];
// A new world every 4 levels.
const THEMES = [
  { name: 'Green Hills', sky: ['#6EC6FF', '#CDEBFF'], hills: ['#9BD3AE', '#7BC48F'], grass: ['#7BC96F', '#8ED47F'], rumble: ['#FF5A5F', '#FFFFFF'], road: ['#6B6F80', '#73778A'], scenery: ['🌳', '🌲', '🌻', '🏠', '🌷'], clouds: true },
  { name: 'Sunny Beach', sky: ['#4FC3F7', '#E1F5FE'], hills: ['#4FB3D9', '#2E86DE'], grass: ['#F2D49B', '#F7DFAE'], rumble: ['#FF9F1C', '#FFFFFF'], road: ['#6B6F80', '#73778A'], scenery: ['🌴', '⛱️', '🌴', '🐚', '🏖️'], clouds: true },
  { name: 'Desert Dash', sky: ['#FFB74D', '#FFE0B2'], hills: ['#E3A869', '#C98B5A'], grass: ['#E8C07D', '#EFCB8C'], rumble: ['#8E6CEF', '#FFFFFF'], road: ['#7A6A5A', '#857463'], scenery: ['🌵', '🪨', '🌵', '🦎', '🌵'], clouds: false },
  { name: 'Snowy Peaks', sky: ['#B3D9FF', '#F2F8FF'], hills: ['#E6EEF7', '#CFDCEB'], grass: ['#E9F1F9', '#FFFFFF'], rumble: ['#3A86FF', '#FFFFFF'], road: ['#7D8597', '#868EA0'], scenery: ['🌲', '⛄', '🌲', '🎄', '🌲'], clouds: true },
  { name: 'Night City', sky: ['#0D1033', '#2B2F6B'], hills: ['#2A2E66', '#1B1E45'], grass: ['#2A2E55', '#323765'], rumble: ['#FFD23F', '#2B2140'], road: ['#3D4157', '#45495F'], scenery: ['🏢', '🏬', '🏢', '🏙️', '🏢'], clouds: false, night: true },
];
function seeded(seed) { let s = (seed * 2654435761) % 4294967296; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

export default function start(ctx) {
  ctx.hideMascot();
  const little = ctx.mode === 'little';
  const lvl = Math.max(1, ctx.level);
  const TH = THEMES[Math.floor((lvl - 1) / 4) % THEMES.length];
  const LAPS = little ? (lvl <= 6 ? 1 : 2) : (lvl <= 5 ? 2 : 3);
  const MAX = little ? 3600 + lvl * 160 : 4600 + lvl * 260;   // level 1 is gentle, level 20 is fast
  const nCars = little ? Math.min(6, 3 + Math.floor(lvl / 5)) : Math.min(7, 4 + Math.floor(lvl / 5));
  ctx.dots(LAPS);
  const A = arcadeLayout(ctx.stage, {
    w: W, h: H,
    left: [[{ id: 'left', label: '◀' }, { id: 'right', label: '▶' }]],
    right: [[{ id: 'a', label: '🚀', color: '#FFD23F' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();
  const me = ctx.profile.avatar in CAST ? ctx.profile.avatar : 'bo';
  const friends = Object.keys(CAST).filter(k => k !== me);

  /* ---------- Build the track ---------- */
  const segs = [];
  let lastY = 0;
  function addSeg(curve, y) {
    const i = segs.length;
    segs.push({ i, curve, p1: { wy: lastY, wz: i * SEG }, p2: { wy: y, wz: (i + 1) * SEG }, sprites: [], dark: Math.floor(i / 3) % 2 });
    lastY = y;
  }
  const ease = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);
  function road(enter, hold, leave, curve, hill = 0) {
    const y0 = lastY, y1 = y0 + hill * SEG, n = enter + hold + leave;
    for (let k = 0; k < enter; k++) addSeg(ease(0, curve, k / enter), ease(y0, y1, k / n));
    for (let k = 0; k < hold; k++) addSeg(curve, ease(y0, y1, (enter + k) / n));
    for (let k = 0; k < leave; k++) addSeg(ease(curve, 0, k / leave), ease(y0, y1, (enter + hold + k) / n));
  }
  // Each level gets its own track: more and sharper bends and bigger hills as levels go up.
  const R = seeded(lvl * 31 + (little ? 7 : 0));
  road(10, 30, 10, 0);
  const sections = 8 + Math.floor(lvl / 3);
  const bend = Math.min(5, 1.5 + lvl * 0.18) * (little ? 0.6 : 1);
  for (let k = 0; k < sections; k++) {
    const curve = R() < 0.25 ? 0 : (R() * 2 - 1) * bend;
    const hill = (R() * 2 - 1) * (10 + lvl * 2);
    road(15 + ((R() * 15) | 0), 20 + ((R() * 30) | 0), 15 + ((R() * 15) | 0), curve, hill);
  }
  road(20, 30, 20, 0, -lastY / SEG); // come back down to the start line
  const N = segs.length, TRACK = N * SEG;
  // Start / finish line
  for (let k = 0; k < 3; k++) segs[k].finish = true;
  // Scenery and stars
  const SCENERY = TH.scenery;
  for (let i = 12; i < N; i += 4 + ((i * 7) % 5)) {
    segs[i].sprites.push({ e: SCENERY[i % SCENERY.length], off: -1.4 - (i % 3) * 0.4, size: 1.6 });
    if (i % 2) segs[(i + 2) % N].sprites.push({ e: SCENERY[(i + 3) % SCENERY.length], off: 1.4 + (i % 4) * 0.35, size: 1.6 });
  }
  for (let i = 40; i < N - 10; i += 26) {
    const off = [-0.6, 0, 0.6][(i / 26 | 0) % 3];
    for (let k = 0; k < 3; k++) segs[i + k * 3].sprites.push({ star: true, off, size: 0.5 });
  }
  // Traffic cones to steer around (from level 4 for Big, level 8 for Little).
  const nCones = little ? (lvl >= 8 ? lvl : 0) : (lvl >= 4 ? lvl * 2 : 0);
  for (let k = 0; k < nCones; k++) {
    const i = 40 + ((R() * (N - 60)) | 0);
    if (segs[i].sprites.some(x => x.star)) continue;
    segs[i].sprites.push({ cone: true, off: [-0.6, 0, 0.6][(R() * 3) | 0], size: 0.5 });
  }

  /* ---------- Racers ---------- */
  let pos = 0, speed = 0, px = 0, lap = 0, starCount = 0, boost = 0, boostT = 0, phase = 'count', countT = 3.5, t = 0, skyOff = 0, bumpT = 0;
  const carSpeed = i => MAX * (little
    ? 0.4 + (i / Math.max(1, nCars - 1)) * 0.17 + lvl * 0.004
    : Math.min(0.92, 0.6 + (i / Math.max(1, nCars - 1)) * 0.2 + lvl * 0.006));
  const cars = Array.from({ length: nCars }, (_, i) => ({
    dist: PLAYER_Z + (i + 1) * 900,
    off: [-0.5, 0.5, 0, -0.5, 0.5, 0, -0.3][i % 7],
    speed: carSpeed(i),
    color: CAR_COLORS[i % CAR_COLORS.length],
    who: friends[i % friends.length],
    wob: Math.random() * 6,
  }));
  function resetRace() {
    pos = 0; speed = 0; px = 0; lap = 0; starCount = 0; boost = 0; boostT = 0; bumpT = 0;
    phase = 'count'; countT = 3.5; lastCount = 4;
    cars.forEach((c, i) => { c.dist = PLAYER_Z + (i + 1) * 900; });
    for (const s2 of segs) for (const sp2 of s2.sprites) { sp2.got = false; sp2.hit = false; }
    ctx.progress(0);
  }
  let lastCount = 4;

  const segAt = z => segs[Math.floor(((z % TRACK) + TRACK) % TRACK / SEG) % N];

  // Touch: hold the left or right half of the road to steer.
  let touchSteer = 0;
  A.canvas.addEventListener('pointerdown', e => { e.preventDefault(); A.canvas.setPointerCapture(e.pointerId); touchSteer = A.toLocal(e).x < W / 2 ? -1 : 1; });
  A.canvas.addEventListener('pointermove', e => { if (touchSteer) touchSteer = A.toLocal(e).x < W / 2 ? -1 : 1; });
  A.canvas.addEventListener('pointerup', () => { touchSteer = 0; });
  A.canvas.addEventListener('pointercancel', () => { touchSteer = 0; });

  A.onPress(id => {
    if (id === 'a' && phase === 'race' && boost >= 100 && boostT <= 0) {
      boost = 0; boostT = 2.2; ctx.sfx.whoosh(); txt.add('TURBO!', W / 2, H - 150, '#FFD23F', 44);
    }
  });

  function place() {
    const mine = lap * TRACK + pos + PLAYER_Z;
    return 1 + cars.filter(c => c.dist > mine).length;
  }

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    if (phase === 'count') {
      countT -= dt;
      const c = Math.ceil(countT);
      if (c !== lastCount && c >= 0) {
        lastCount = c;
        if (c > 0 && c <= 3) { ctx.say(String(c)); ctx.sfx.tap(); }
        if (c === 0) { ctx.say('Go!'); ctx.sfx.ding(); phase = 'race'; }
      }
      return;
    }
    if (phase === 'done') { speed *= Math.pow(0.3, dt); pos += speed * dt; return; }

    const steer = (A.keys.left ? -1 : 0) + (A.keys.right ? 1 : 0) + touchSteer;
    const sp = speed / MAX;
    const seg = segAt(pos + PLAYER_Z);
    px += Math.max(-1, Math.min(1, steer)) * dt * 2.4 * Math.max(0.3, sp);
    px -= seg.curve * sp * dt * (little ? 0.25 : 0.55);
    if (little && !steer) px -= px * dt * 1.2;
    px = Math.max(-2.2, Math.min(2.2, px));

    let top = MAX * (boostT > 0 ? 1.45 : 1);
    if (Math.abs(px) > 1.05) { top = MAX * 0.4; if (Math.floor(t * 12) % 2) fx.burst(W / 2 + (Math.random() - .5) * 80, H - 30, 2, 80, ['#7BC96F', '#A0D995']); }
    if (bumpT > 0) { bumpT -= dt; top = Math.min(top, MAX * 0.5); }
    speed += (speed < top ? MAX * 0.45 : -MAX * 1.2) * dt;
    if (boostT > 0) boostT -= dt;
    pos += speed * dt;
    skyOff += seg.curve * sp * dt * 0.02;

    // Stars
    const z = pos + PLAYER_Z;
    for (const s of seg.sprites) {
      if (s.cone && !s.hit && Math.abs(s.off - px) < 0.3) {
        s.hit = true; bumpT = 0.7; speed = Math.min(speed, MAX * 0.45); ctx.sfx.oops();
        txt.add('Bonk!', W / 2, H - 140, '#FF9F1C', 30); fx.burst(W / 2, H - 100, 10, 160, ['#FF9F1C', '#fff']);
      }
      if (s.star && !s.got && Math.abs(s.off - px) < 0.35) {
        s.got = true; starCount++; boost = Math.min(100, boost + 34);
        ctx.sfx.star(starCount);
        fx.burst(W / 2, H - 110, 14, 200, ['#FFD23F', '#FFF3C4']);
        if (boost >= 100) txt.add('Press 🚀!', W / 2, H - 160, '#FFD23F', 30);
      }
    }
    // Opponents
    for (const c of cars) {
      c.dist += c.speed * dt;
      // gentle lane weaving
      c.off += Math.sin(t * 0.5 + c.wob) * dt * 0.15;
      c.off = Math.max(-0.8, Math.min(0.8, c.off));
      const d = c.dist - z;
      if (d > 0 && d < SEG * 0.9 && Math.abs(c.off - px) < 0.42 && bumpT <= 0) {
        bumpT = 0.6; speed = Math.min(speed, c.speed * 0.85); ctx.sfx.oops(); txt.add('Bump!', W / 2, H - 140, '#fff', 30);
      }
    }
    // Laps
    if (pos >= TRACK) {
      pos -= TRACK; lap++;
      for (const s of segs) for (const sp2 of s.sprites) { sp2.got = false; sp2.hit = false; }
      ctx.progress(lap);
      if (lap >= LAPS) {
        phase = 'done';
        const pl = place();
        if (!little && pl > 3) {
          // Big mode: you need a podium place to pass the level. No game over, just race again.
          ctx.sfx.oops();
          ctx.say(`You finished ${ORD[pl - 1]}. Finish in the top 3 to win this level! Let's race again!`);
          setTimeout(() => { if (phase === 'done') resetRace(); }, 4200);
          return;
        }
        ctx.sfx.tada();
        fx.burst(W / 2, H / 2, 70, 450);
        ctx.say(pl === 1 ? 'You won the race! First place!' : `You finished ${ORD[pl - 1]}! Great driving!`);
        setTimeout(() => ctx.finish(pl === 1 ? 3 : pl <= 3 ? 2 : 1), 2400);
      } else {
        ctx.say(lap === LAPS - 1 ? 'Last lap!' : `Lap ${lap + 1}!`);
        ctx.sfx.ding();
      }
    }
  }

  /* ---------- Rendering ---------- */
  function project(p, camX, camY, camZ) {
    const tz = p.wz - camZ;
    p.tz = tz;
    p.s = DEPTH / tz;
    p.x = W / 2 + p.s * (-camX) * W / 2;
    p.y = H / 2 - p.s * (p.wy - camY) * H / 2;
    p.w = p.s * ROAD * W / 2;
  }
  function quad(c, x1, y1, w1, x2, y2, w2) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(x1 - w1, y1); g.lineTo(x2 - w2, y2); g.lineTo(x2 + w2, y2); g.lineTo(x1 + w1, y1); g.closePath(); g.fill();
  }

  function drawCar(x, y, w, color, who, isMe) {
    const h = w * 0.62;
    g.save(); g.translate(x, y);
    // driver peeking out
    const img = sprite(who, isMe && phase === 'done' ? 'cheer' : 'happy');
    if (img.complete) g.drawImage(img, -w * 0.28, -h - w * 0.42, w * 0.56, w * 0.56);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 0, w * 0.55, w * 0.08, 0, 0, 7); g.fill();
    g.fillStyle = '#2B2140';
    roundRect(g, -w * 0.5, -h * 0.35, w * 0.2, h * 0.38, w * 0.05); g.fill();
    roundRect(g, w * 0.3, -h * 0.35, w * 0.2, h * 0.38, w * 0.05); g.fill();
    g.fillStyle = color; roundRect(g, -w * 0.46, -h * 0.85, w * 0.92, h * 0.7, w * 0.14); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; roundRect(g, -w * 0.3, -h * 1.12, w * 0.6, h * 0.36, w * 0.1); g.fill();
    g.fillStyle = color; roundRect(g, -w * 0.34, -h * 1.15, w * 0.68, h * 0.1, w * 0.04); g.fill();
    g.fillStyle = '#FF5A5F'; g.fillRect(-w * 0.4, -h * 0.6, w * 0.14, h * 0.12); g.fillRect(w * 0.26, -h * 0.6, w * 0.14, h * 0.12);
    g.fillStyle = '#fff'; roundRect(g, -w * 0.12, -h * 0.45, w * 0.24, h * 0.14, 3); g.fill();
    g.restore();
  }

  function draw() {
    // Sky + hills (parallax)
    const sky = g.createLinearGradient(0, 0, 0, H / 2);
    sky.addColorStop(0, TH.sky[0]); sky.addColorStop(1, TH.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (TH.night) { g.fillStyle = '#fff'; for (let i = 0; i < 40; i++) { g.globalAlpha = 0.4 + ((i * 37) % 10) / 20; g.fillRect((i * 97 - skyOff * 300) % W + (i * 97 - skyOff * 300 < 0 ? W : 0), (i * 53) % (H / 2 - 20), 2, 2); } g.globalAlpha = 1; g.fillStyle = '#FFF7C2'; g.beginPath(); g.arc(W - 90, 60, 26, 0, 7); g.fill(); }
    g.fillStyle = '#fff';
    if (TH.clouds) for (let i = 0; i < 5; i++) { const cx = ((i * 170 - skyOff * 600) % (W + 200) + W + 200) % (W + 200) - 100; g.beginPath(); g.ellipse(cx, 50 + (i % 2) * 30, 50, 16, 0, 0, 7); g.fill(); }
    for (const [col, k, base, amp] of [[TH.hills[0], 900, H / 2 + 10, 50], [TH.hills[1], 1400, H / 2 + 20, 35]]) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) g.lineTo(x, base - Math.abs(Math.sin((x + skyOff * k) / 120)) * amp);
      g.lineTo(W, H); g.closePath(); g.fill();
    }

    const base = segAt(pos);
    const basePct = (pos % SEG) / SEG;
    const pSeg = segAt(pos + PLAYER_Z);
    const pPct = ((pos + PLAYER_Z) % SEG) / SEG;
    const playerY = pSeg.p1.wy + (pSeg.p2.wy - pSeg.p1.wy) * pPct;
    let maxy = H, x = 0, dx = -(base.curve * basePct);
    const drawn = [];
    for (let n = 0; n < DRAW; n++) {
      const s = segs[(base.i + n) % N];
      const loop = s.i < base.i ? TRACK : 0;
      project(s.p1, px * ROAD - x, playerY + CAM_H, pos - loop);
      project(s.p2, px * ROAD - x - dx, playerY + CAM_H, pos - loop);
      x += dx; dx += s.curve;
      s.clip = maxy;
      s.loop = loop;
      if (s.p1.tz <= DEPTH || s.p2.y >= s.p1.y || s.p2.y >= maxy) continue;
      const p1 = s.p1, p2 = s.p2;
      g.fillStyle = s.dark ? TH.grass[0] : TH.grass[1]; g.fillRect(0, p2.y, W, p1.y - p2.y + 1);
      quad(s.dark ? TH.rumble[0] : TH.rumble[1], p1.x, p1.y, p1.w * 1.12, p2.x, p2.y, p2.w * 1.12);
      quad(s.finish ? (s.i % 2 ? '#fff' : '#2B2140') : (s.dark ? TH.road[0] : TH.road[1]), p1.x, p1.y, p1.w, p2.x, p2.y, p2.w);
      if (!s.dark && !s.finish) for (let l = 1; l < LANES; l++) {
        const f = -1 + 2 * l / LANES;
        quad('#FFFFFF', p1.x + p1.w * f, p1.y, p1.w * 0.025, p2.x + p2.w * f, p2.y, p2.w * 0.025);
      }
      maxy = p2.y;
      drawn.push(s);
    }
    // Sprites & cars, far to near
    const z = pos + PLAYER_Z;
    for (let n = DRAW - 1; n > 0; n--) {
      const s = segs[(base.i + n) % N];
      if (!s.p1.s || s.p1.tz <= DEPTH) continue;
      g.save();
      g.beginPath(); g.rect(0, 0, W, s.clip); g.clip();
      for (const sp of s.sprites) {
        if (sp.got) continue;
        const sx = s.p1.x + s.p1.w * sp.off;
        const size = s.p1.w * (sp.star ? 0.14 : sp.cone ? 0.12 : 0.08 * sp.size);
        if (size < 2 || size > W * 0.6) continue;
        if (sp.cone) {
          if (sp.hit) continue;
          const y0 = s.p1.y;
          g.fillStyle = '#FF7A1A'; g.beginPath(); g.moveTo(sx - size * 0.35, y0); g.lineTo(sx, y0 - size); g.lineTo(sx + size * 0.35, y0); g.closePath(); g.fill();
          g.fillStyle = '#fff'; g.fillRect(sx - size * 0.2, y0 - size * 0.55, size * 0.4, size * 0.12);
          g.fillStyle = '#C24E00'; g.fillRect(sx - size * 0.45, y0 - size * 0.08, size * 0.9, size * 0.08);
        } else if (sp.star) drawStar(g, sx, s.p1.y - size * 1.2 - Math.sin(t * 6) * size * 0.15, size * 0.55);
        else { g.font = `${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(sp.e, sx, s.p1.y); }
      }
      for (const c of cars) {
        const cz = ((c.dist % TRACK) + TRACK) % TRACK;
        if (Math.floor(cz / SEG) % N !== s.i) continue;
        const pct = (cz % SEG) / SEG;
                const rw = s.p1.w + (s.p2.w - s.p1.w) * pct;
        const cx = s.p1.x + (s.p2.x - s.p1.x) * pct + rw * c.off;
        const cy = s.p1.y + (s.p2.y - s.p1.y) * pct;
        const w = rw * 0.26;
        if (w > 3) drawCar(cx, cy, w, c.color, c.who, false);
      }
      g.restore();
    }
    // Player car
    const bounce = speed > 100 ? Math.sin(t * 30) * 1.5 : 0;
    const tilt = ((A.keys.left || touchSteer < 0) ? -1 : 0) + ((A.keys.right || touchSteer > 0) ? 1 : 0);
    g.save(); g.translate(W / 2, H - 22 + bounce); g.rotate(tilt * 0.04);
    if (boostT > 0) { g.fillStyle = Math.floor(t * 20) % 2 ? '#FFD23F' : '#FF9F1C'; g.beginPath(); g.moveTo(-30, 0); g.lineTo(0, 30 + Math.random() * 20); g.lineTo(30, 0); g.fill(); }
    drawCar(0, 0, 150, '#FF5A5F', me, true);
    g.restore();
    fx.draw(g); txt.draw(g);

    // HUD
    const pl = place();
    hudText(g, ORD[pl - 1], 14, 10, { size: 40, color: pl === 1 ? '#FFD23F' : '#fff' });
    hudText(g, `Lap ${Math.min(lap + 1, LAPS)}/${LAPS}`, W - 14, 10, { size: 26, align: 'right' });
    hudText(g, `⭐ ${starCount}`, W - 14, 42, { size: 24, align: 'right' });
    g.fillStyle = 'rgba(43,33,64,.6)'; roundRect(g, 14, 60, 140, 16, 8); g.fill();
    g.fillStyle = boost >= 100 ? (Math.floor(t * 6) % 2 ? '#FFD23F' : '#FF9F1C') : '#FFD23F';
    roundRect(g, 16, 62, 136 * boost / 100, 12, 6); g.fill();
    hudText(g, '🚀', 160, 54, { size: 22 });
    if (phase === 'count') {
      const c = Math.ceil(countT);
      hudText(g, c > 3 ? 'Ready?' : c > 0 ? String(c) : 'GO!', W / 2, 110, { size: 84, align: 'center', color: '#FFD23F' });
    }
    if (phase === 'done') hudText(g, pl === 1 ? '🏆 1st!' : ORD[pl - 1] + '!', W / 2, 110, { size: 72, align: 'center', color: '#FFD23F' });
    A.btns.a.classList.toggle('disabled', boost < 100);
  }

  if (window.__playroomTest) window.__playroomTest.racer = { finish: () => { cars.forEach(c => { c.dist = -1e9; }); lap = LAPS - 1; pos = TRACK - 50; phase = 'race'; }, lose: () => { cars.forEach(c => { c.dist = 1e9; }); lap = LAPS - 1; pos = TRACK - 50; phase = 'race'; } };
  ctx.instruct(`Level ${lvl}, ${TH.name}! ` + (little ? 'Steer your car and collect the stars!' : `Race ${LAPS} laps and finish in the top 3! Collect stars to fill your turbo, then press the rocket!`));
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); };
}
