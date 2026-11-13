// Hop Across: help Pip the frog hop over the busy roads (and, for big kids, the river) to the lily-pad homes.
// Little: a few slow roads, no river, and a bump just sends Pip gently back to the start.
// Big: roads + a river of floating logs, 3 hearts, faster every level.
// 20 levels: more lanes, trucks and zippy scooters, diving turtles in the river, and night-time levels.
import { arcadeLayout, swipes, gameLoop, roundRect, particles, popups, hudText } from './arcade-kit.js';

const W = 480, H = 640, HUD = 44, COLS = 10, CW = W / COLS;
const CAR_COLORS = ['#FF5A5F', '#3A86FF', '#FFD23F', '#8E6CEF', '#FF9F1C', '#2EC4B6', '#FF7EB6'];

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const L = Math.max(1, ctx.level | 0);
  const lvl = L;
  const night = [9, 10, 14, 19, 20].includes(L);
  const A = arcadeLayout(ctx.stage, {
    w: W, h: H,
    left: [[null, { id: 'up', label: '▲' }, null], [{ id: 'left', label: '◀' }, { id: 'down', label: '▼' }, { id: 'right', label: '▶' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();
  const speedMul = little ? 0.7 + L * 0.035 : 0.95 + (L - 1) * 0.055;

  // Lanes, top to bottom. More lanes as the levels go up; a grass verge splits long roads.
  const nRoad = little ? Math.min(5, 2 + Math.floor((L - 1) / 4)) : Math.min(5, 2 + Math.floor((L + 1) / 4));
  const nRiver = little ? (L >= 11 ? (L >= 17 ? 2 : 1) : 0) : Math.min(4, 2 + Math.floor((L - 1) / 7));
  const roads = Array(nRoad).fill('road');
  if (nRoad >= 4) roads.splice(2, 0, 'grass');
  const kinds = ['home', ...Array(nRiver).fill('river'), ...(nRiver ? ['grass'] : little ? ['grass'] : []), ...roads, 'grass'];
  const turtles = !little && L >= 6;
  const RH = (H - HUD) / kinds.length;
  const lanes = kinds.map((type, i) => {
    const lane = { type, y: HUD + i * RH, dir: i % 2 ? 1 : -1, speed: 0, items: [] };
    if (type === 'road') {
      // Lane styles: cars, long trucks (from level 4), zippy scooters (from level 7).
      const style = (L >= 7 && i % 3 === 0) ? 'zip' : (L >= 4 && i % 3 === 1) ? 'truck' : 'car';
      lane.speed = (little ? 45 + (i % 3) * 15 : 65 + (i % 3) * 22) * speedMul * (style === 'zip' ? 1.6 : style === 'truck' ? 0.8 : 1);
      const n = style === 'truck' ? 2 : little ? 2 : 3;
      for (let k = 0; k < n; k++) lane.items.push({
        x: k * (W + 140) / n + Math.random() * 40,
        w: CW * (style === 'truck' ? 2.6 : style === 'zip' ? 0.9 : 1.2 + (k + i) % 2 * 0.5),
        color: CAR_COLORS[(i + k * 3) % CAR_COLORS.length], style });
    } else if (type === 'river') {
      lane.speed = (little ? 30 : 45 + (i % 3) * 20) * speedMul;
      const n = 3;
      const logW = little ? 3.6 : Math.max(2, 3.4 - L * 0.07);
      const turtleLane = turtles && i % 2 === 1;
      for (let k = 0; k < n; k++) lane.items.push({
        x: k * (W + 220) / n, w: CW * (turtleLane ? 3 : logW), log: !turtleLane && i % 2 === 0,
        turtle: turtleLane, phase: k * 2.1 + i });
    }
    return lane;
  });
  const LOOP = W + 220;
  const startRow = kinds.length - 1;
  const nHomes = little ? (L >= 10 ? 4 : 3) : 5;
  const homes = Array.from({ length: nHomes }, (_, k) => ({ x: (k + 0.5) * W / nHomes, filled: false }));

  let frog, hearts = 3, filledCount = 0, over = false, t = 0, deadT = 0;
  function resetFrog() { frog = { x: W / 2 - CW / 2 + CW / 2, row: startRow, hop: 0, from: null, face: 0 }; frog.x = Math.round(frog.x / CW - 0.5) * CW + CW / 2; }
  resetFrog();

  const frogY = () => {
    const y1 = lanes[frog.row].y + RH / 2;
    if (frog.hop > 0 && frog.from) { const k = 1 - frog.hop / 0.14; return frog.from.y + (y1 - frog.from.y) * k - Math.sin(k * Math.PI) * 12; }
    return y1;
  };
  const frogX = () => {
    if (frog.hop > 0 && frog.from) { const k = 1 - frog.hop / 0.14; return frog.from.x + (frog.x - frog.from.x) * k; }
    return frog.x;
  };

  function hop(d) {
    if (over || deadT > 0 || frog.hop > 0) return;
    const m = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], tap: [0, -1] }[d];
    if (!m) return;
    const nr = frog.row + m[1], nx = frog.x + m[0] * CW;
    if (nr < 0 || nr > startRow || nx < CW / 2 - 1 || nx > W - CW / 2 + 1) return;
    frog.from = { x: frog.x, y: lanes[frog.row].y + RH / 2 };
    frog.row = nr; frog.x = nx; frog.hop = 0.14;
    frog.face = m[0] * 0.25;   // a little lean when hopping sideways
    ctx.sfx.tap();
  }
  A.onPress(hop);
  swipes(A.canvas, hop);

  function poof(why) {
    deadT = 1.0;
    ctx.sfx.oops();
    fx.burst(frog.x, frogY(), 22, 220, why === 'splash' ? ['#BDE7FF', '#fff', '#3A86FF'] : ['#9AA6FF', '#fff']);
    txt.add(why === 'splash' ? 'Splash!' : 'Bump!', frog.x, frogY() - 20, '#fff', 30);
    if (!little) {
      hearts--;
      if (hearts <= 0) {
        over = true;
        ctx.say(`Good try! Pip got home ${filledCount} time${filledCount === 1 ? '' : 's'}!`);
        setTimeout(() => ctx.finish(1), 1800);
        return;
      }
    }
    ctx.say(why === 'splash' ? 'Splash! Try again!' : 'Oops! Try again!');
  }

  function arriveHome() {
    let best = null, bd = Infinity;
    for (const h of homes) { const d = Math.abs(h.x - frog.x); if (!h.filled && d < bd) { bd = d; best = h; } }
    const slotW = W / nHomes;
    if (best && (little || bd < slotW * 0.55)) {
      best.filled = true; filledCount++;
      ctx.sfx.good();
      fx.burst(best.x, lanes[0].y + RH / 2, 30, 260);
      txt.add('Home!', best.x, lanes[0].y + RH / 2, '#FFD23F', 32);
      if (filledCount >= nHomes) {
        over = true;
        ctx.sfx.tada();
        ctx.say('All the frogs are home!');
        setTimeout(() => ctx.finish(little ? 3 : hearts), 2000);
        return;
      }
      ctx.say(little ? `${filledCount}!` : `Home! ${nHomes - filledCount} to go!`);
      resetFrog();
    } else {
      ctx.sfx.oops();
      txt.add('Find an empty pad!', W / 2, lanes[0].y + RH, '#fff', 24);
      frog.row = 1; frog.hop = 0;
    }
  }

  // Lets automated tests finish quickly. Harmless in normal play.
  if (window.__playroomTest) window.__playroomTest.hop = { win: () => { for (const h of homes) h.filled = true; filledCount = nHomes - 1; homes[0].filled = false; frog.x = homes[0].x; frog.row = 0; arriveHome(); } };

  // Diving turtles: up for a while, then under the water for a moment.
  const under = it => Math.sin(t * 0.9 + it.phase) < -0.72;

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    for (const lane of lanes) for (const it of lane.items) {
      it.x += lane.dir * lane.speed * dt;
      if (lane.dir > 0 && it.x > W + 60) it.x -= LOOP;
      if (lane.dir < 0 && it.x + it.w < -60) it.x += LOOP;
    }
    if (over) return;
    if (deadT > 0) { deadT -= dt; if (deadT <= 0) resetFrog(); return; }
    for (const d of ['up', 'down', 'left', 'right']) if (A.keys[d] && frog.hop <= 0) hop(d);
    if (frog.hop > 0) {
      frog.hop -= dt;
      if (frog.hop <= 0) { frog.hop = 0; frog.from = null; if (frog.row === 0) return arriveHome(); }
      else return;
    }
    const lane = lanes[frog.row];
    if (lane.type === 'road') {
      for (const it of lane.items) if (frog.x > it.x + 6 && frog.x < it.x + it.w - 6) return poof('bump');
    } else if (lane.type === 'river') {
      const on = lane.items.find(it => frog.x > it.x + 4 && frog.x < it.x + it.w - 4 && !(it.turtle && under(it)));
      if (!on) return poof('splash');
      frog.x += lane.dir * lane.speed * dt;
      if (frog.x < 4 || frog.x > W - 4) return poof('splash');
    }
  }

  function drawCar(it, y, dir) {
    const h = RH * 0.62, top = y + (RH - h) / 2;
    g.save();
    if (dir < 0) { g.translate(it.x * 2 + it.w, 0); g.scale(-1, 1); }
    g.fillStyle = '#2B2140';
    for (const wx of [it.x + it.w * 0.22, it.x + it.w * 0.78]) { g.beginPath(); g.arc(wx, top + h, h * 0.2, 0, 7); g.fill(); }
    g.fillStyle = it.color; roundRect(g, it.x, top + h * 0.25, it.w, h * 0.7, h * 0.25); g.fill();
    if (it.style === 'truck') { g.fillStyle = '#F4F4F8'; roundRect(g, it.x + 4, top - h * 0.1, it.w * 0.62, h * 0.85, 6); g.fill(); g.fillStyle = it.color; roundRect(g, it.x + it.w * 0.7, top + h * 0.02, it.w * 0.28, h * 0.5, h * 0.15); g.fill(); }
    else roundRect(g, it.x + it.w * 0.2, top, it.w * 0.55, h * 0.5, h * 0.2), g.fill();
    g.fillStyle = 'rgba(255,255,255,.8)'; roundRect(g, it.x + it.w * 0.5, top + h * 0.08, it.w * 0.2, h * 0.3, 4); g.fill();
    g.fillStyle = '#FFF3C4'; g.beginPath(); g.arc(it.x + it.w - 4, top + h * 0.55, 4, 0, 7); g.fill();
    g.restore();
  }

  function drawFrog(x, y, face, s = 1, mood = 'happy') {
    const r = Math.min(RH * 0.34, 26) * s;
    g.save(); g.translate(x, y); g.rotate(face);
    g.fillStyle = '#2E9E5B';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * 0.85, r * 0.6, r * 0.42, r * 0.28, sx * 0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(sx * r * 0.8, -r * 0.3, r * 0.3, r * 0.22, -sx * 0.5, 0, 7); g.fill(); }
    g.fillStyle = '#5BCB7E'; g.beginPath(); g.ellipse(0, r * 0.1, r * 0.85, r * 0.75, 0, 0, 7); g.fill();
    g.fillStyle = '#C9F2B8'; g.beginPath(); g.ellipse(0, r * 0.3, r * 0.5, r * 0.4, 0, 0, 7); g.fill();
    for (const sx of [-1, 1]) {
      g.fillStyle = '#5BCB7E'; g.beginPath(); g.arc(sx * r * 0.42, -r * 0.55, r * 0.34, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(sx * r * 0.42, -r * 0.58, r * 0.24, 0, 7); g.fill();
      g.fillStyle = '#2B2140'; g.beginPath(); g.arc(sx * r * 0.42, -r * 0.62, r * 0.12, 0, 7); g.fill();
    }
    g.strokeStyle = '#2B2140'; g.lineWidth = Math.max(2, r * 0.1); g.lineCap = 'round';
    g.beginPath(); g.arc(0, -r * 0.05, r * 0.32, 0.25, Math.PI - 0.25); g.stroke();
    g.fillStyle = 'rgba(255,126,182,.6)';
    for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * r * 0.55, r * 0.05, r * 0.13, r * 0.08, 0, 0, 7); g.fill(); }
    g.restore();
  }

  // Round lily pad with a thin notch and a vein pattern.
  function lilyPad(x, y, r, k = 0) {
    const rot = -Math.PI / 2 + k * 0.9;
    g.fillStyle = '#3BB273'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, rot + 0.12, rot + Math.PI * 2 - 0.12); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
    for (let v = 1; v < 6; v++) { const a = rot + v * Math.PI / 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75); g.stroke(); }
    g.fillStyle = '#5FCF8C'; g.beginPath(); g.arc(x, y, r * 0.18, 0, 7); g.fill();
  }

  function draw() {
    g.fillStyle = '#2B2160'; g.fillRect(0, 0, W, HUD);
    for (const lane of lanes) {
      const y = lane.y;
      if (lane.type === 'home') {
        g.fillStyle = '#3A86FF'; g.fillRect(0, y, W, RH);
        g.fillStyle = '#4B95FF'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse((k * 97 + t * 10) % (W + 40) - 20, y + RH * 0.8, 22, 4, 0, 0, 7); g.fill(); }
        for (const h of homes) {
          lilyPad(h.x, y + RH / 2, Math.min(RH * 0.42, 34));
          if (h.filled) drawFrog(h.x, y + RH / 2, 0, 0.8);
          else { g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(h.x, y + RH / 2, 6, 0, 7); g.fill(); }
        }
      } else if (lane.type === 'grass') {
        g.fillStyle = '#8ED47F'; g.fillRect(0, y, W, RH);
        g.fillStyle = '#7BC96F'; for (let k = 0; k < 12; k++) { g.beginPath(); g.arc((k * 53) % W + 10, y + RH * (0.3 + (k % 3) * 0.2), 4, 0, 7); g.fill(); }
        g.font = `${RH * 0.3}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('🌼', W * 0.1, y + RH * 0.5); g.fillText('🌷', W * 0.9, y + RH * 0.45);
      } else if (lane.type === 'road') {
        g.fillStyle = '#6B6F80'; g.fillRect(0, y, W, RH);
        g.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 10; k++) g.fillRect(k * 52 + 8, y + RH - 3, 26, 3);
        for (const it of lane.items) drawCar(it, y, lane.dir);
      } else {
        g.fillStyle = '#3A86FF'; g.fillRect(0, y, W, RH);
        g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(((k * 89 + t * lane.dir * lane.speed * 0.5) % W + W) % W, y + RH * (0.3 + (k % 2) * 0.4), 16, 3, 0, 0, 7); g.fill(); }
        for (const it of lane.items) {
          if (it.log) {
            g.fillStyle = '#9A6237'; roundRect(g, it.x, y + RH * 0.18, it.w, RH * 0.64, RH * 0.3); g.fill();
            g.fillStyle = '#B67A4C'; roundRect(g, it.x + 6, y + RH * 0.26, it.w - 12, RH * 0.14, 5); g.fill();
            g.fillStyle = '#E2B07A'; g.beginPath(); g.ellipse(it.x + it.w - RH * 0.12, y + RH / 2, RH * 0.1, RH * 0.28, 0, 0, 7); g.fill();
          } else if (it.turtle) {
            const n = 3, dive = under(it), half = Math.sin(t * 0.9 + it.phase) < -0.45;
            g.globalAlpha = dive ? 0.18 : half ? 0.55 : 1;
            for (let k = 0; k < n; k++) {
              const cx = it.x + (k + 0.5) * it.w / n, cy = y + RH / 2, r = Math.min(RH * 0.36, it.w / n * 0.45);
              g.fillStyle = '#7BC96F'; g.beginPath(); g.arc(cx + lane.dir * r * 0.9, cy, r * 0.35, 0, 7); g.fill();
              g.fillStyle = '#2E9E5B'; g.beginPath(); g.ellipse(cx, cy, r, r * 0.8, 0, 0, 7); g.fill();
              g.fillStyle = '#3BB273'; g.beginPath(); g.ellipse(cx, cy, r * 0.55, r * 0.45, 0, 0, 7); g.fill();
            }
            g.globalAlpha = 1;
          } else {
            const n = Math.round(it.w / CW);
            for (let k = 0; k < n; k++) lilyPad(it.x + (k + 0.5) * it.w / n, y + RH / 2, Math.min(RH * 0.4, it.w / n * 0.48), k);
          }
        }
      }
    }
    if (night) {
      g.fillStyle = 'rgba(12,16,48,.5)'; g.fillRect(0, HUD, W, H - HUD);
      for (const lane of lanes) if (lane.type === 'road') for (const it of lane.items) {
        const fxp = lane.dir > 0 ? it.x + it.w : it.x, cy = lane.y + RH / 2;
        g.fillStyle = 'rgba(255,240,170,.35)'; g.beginPath(); g.moveTo(fxp, cy); g.lineTo(fxp + lane.dir * 90, cy - RH * 0.45); g.lineTo(fxp + lane.dir * 90, cy + RH * 0.45); g.closePath(); g.fill();
      }
      const gx = frogX(), gy = frogY();
      const glow = g.createRadialGradient(gx, gy, 5, gx, gy, 70); glow.addColorStop(0, 'rgba(255,255,200,.35)'); glow.addColorStop(1, 'rgba(255,255,200,0)');
      g.fillStyle = glow; g.fillRect(gx - 70, gy - 70, 140, 140);
    }
    if (deadT <= 0 || Math.floor(t * 10) % 2) {
      if (!(deadT > 0)) drawFrog(frogX(), frogY(), frog.face);
    }
    fx.draw(g); txt.draw(g);
    hudText(g, `🏠 ${filledCount} / ${nHomes}`, 12, 8, { size: 24, color: '#FFD23F' });
    if (t < 2) hudText(g, `${night ? '🌙 ' : ''}Level ${L}`, W / 2, H / 2 - 30, { size: 44, align: 'center', color: '#FFD23F' });
    if (!little) hudText(g, '❤️'.repeat(Math.max(0, hearts)), W - 12, 8, { size: 22, align: 'right' });
  }

  ctx.instruct((little ? 'Help Pip the frog hop across to the lily pads! Watch out for the cars!' : 'Hop across the road and ride the logs to get every frog home!')
    + (nRiver && little ? ' Ride the lily pads across the river!' : '')
    + (turtles && L === 6 ? ' Careful, the turtles dive under the water!' : '')
    + (night ? ' It\'s night time!' : ''));
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); if (window.__playroomTest) delete window.__playroomTest.hop; };
}
