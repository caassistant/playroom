// Paddle Pals: table-tennis style. Play against Bo the robot, or two players on one tablet.
// Each player drags their own paddle (multi-touch: every finger is tracked separately).
// 15 levels: Bo gets smarter, paddles get smaller, bouncy bumpers appear in the middle
// (then start moving), and some levels have two balls at once. 2-player works on every level.
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText, sprite } from './arcade-kit.js';
import { character } from '../characters.js';

const W = 800, H = 450;
const TABLES = ['#1F7A5C', '#1F5F8A', '#5B3F8F', '#8A4B1F', '#7A1F4B'];
// Bumper layouts (positions as fractions of the table).
const BUMPERS = [
  [],
  [[0.5, 0.5]],
  [[0.5, 0.3], [0.5, 0.7]],
  [[0.42, 0.5], [0.58, 0.5]],
  [[0.5, 0.22], [0.5, 0.5], [0.5, 0.78]],
  [[0.4, 0.3], [0.6, 0.7]],
  [[0.4, 0.3], [0.6, 0.3], [0.4, 0.7], [0.6, 0.7]],
];

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const LV = Math.max(1, ctx.level | 0);
  const k = (LV - 1) / 14;                       // 0..1 through the 15 levels
  const me = ctx.profile.avatar || 'mango';
  let cleanupGame = null;

  // Level recipe
  const layout = LV < 4 ? 0 : 1 + ((LV - 4) % (BUMPERS.length - 1));
  const movingBumpers = LV >= 9;
  const nBalls = [6, 9, 12, 15].includes(LV) ? 2 : 1;
  const table = TABLES[Math.floor((LV - 1) / 3) % TABLES.length];

  /* ---------- Choose 1 or 2 players (pictures only, no reading) ---------- */
  ctx.stage.innerHTML = `<div class="prompt">🏓 Level ${LV}</div>
    <div class="modes" style="display:flex;gap:clamp(16px,4vw,48px);flex-wrap:wrap;justify-content:center"></div>`;
  const row = ctx.stage.querySelector('.modes');
  const mk = (html, fn, label) => {
    const b = document.createElement('button');
    b.className = 'profile';
    b.setAttribute('aria-label', label);
    b.innerHTML = html;
    b.onclick = () => { ctx.sfx.tap(); fn(); };
    row.appendChild(b);
  };
  const pair = (a, b) => `<div style="display:flex;align-items:center;gap:6px;width:100%;justify-content:center">
      <div style="width:44%">${character(a, { mood: 'cheer' })}</div><div style="font-size:30px">🏓</div><div style="width:44%">${character(b, { mood: 'cheer' })}</div></div>`;
  mk(pair(me, 'bo') + '<div class="name">🙂 + 🤖</div>', () => play(1), 'One player against Bo');
  mk(pair(me, me === 'zuzu' ? 'tumble' : 'zuzu') + '<div class="name">🙂 + 🙂</div>', () => play(2), 'Two players');
  ctx.instruct('Play against Bo the robot, or play with a friend!');

  function play(players) {
    const target = little ? (LV >= 8 ? 4 : 3) : (LV >= 10 ? 7 : 5);
    const right = players === 1 ? 'bo' : (me === 'zuzu' ? 'tumble' : 'zuzu');
    const extras = [];
    if (layout) extras.push('Watch the bouncy bumpers!');
    if (nBalls > 1) extras.push('Two balls at once!');
    ctx.say((players === 1 ? 'Beat Bo the robot! Slide your paddle up and down.' : 'Two players! Each player slides their own paddle.') + ' ' + extras.join(' '));
    const A = arcadeLayout(ctx.stage, { w: W, h: H });
    const { g } = A;
    const fx = particles(), txt = popups();
    const PH = little ? 150 - k * 40 : 112 - k * 42, PWID = 18;
    const Lp = { y: H / 2, score: 0, x: 40 }, Rp = { y: H / 2, score: 0, x: W - 40 };
    let balls = [];
    const base = little ? 240 + k * 70 : 310 + k * 150;
    let serveT = 1.2, serveDir = -1, over = false, t = 0;
    const cpuSpeed = little ? 140 + k * 90 : 200 + k * 260;
    const cpuSloppy = little ? 150 - k * 60 : 90 - k * 70;
    let cpuErr = 0;
    const bumpers = BUMPERS[layout].map(([fx2, fy], i) => ({ x: fx2 * W, y: fy * H, oy: fy * H, r: 26, ph: i * 1.7, flash: 0 }));

    function serve() {
      balls = [];
      for (let i = 0; i < nBalls; i++) {
        const a = (Math.random() - 0.5) * 0.7;
        const dir = i === 0 ? serveDir : -serveDir;
        balls.push({ x: W / 2 - dir * 150, y: H / 2 + (i ? 60 : 0) * (Math.random() < 0.5 ? 1 : -1), vx: Math.cos(a) * base * dir, vy: Math.sin(a) * base, r: 12, speed: base, trail: [] });
      }
      cpuErr = (Math.random() - 0.5) * cpuSloppy;
    }

    // Multi-touch: each pointer controls the paddle on its side of the table.
    const owners = new Map();
    const setPaddle = (side, y) => { (side === 'L' ? Lp : Rp).y = Math.max(PH / 2, Math.min(H - PH / 2, y)); };
    A.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      A.canvas.setPointerCapture(e.pointerId);
      const p = A.toLocal(e);
      const side = players === 1 ? 'L' : (p.x < W / 2 ? 'L' : 'R');
      owners.set(e.pointerId, side);
      setPaddle(side, p.y);
    });
    A.canvas.addEventListener('pointermove', e => { const side = owners.get(e.pointerId); if (side) setPaddle(side, A.toLocal(e).y); });
    const up = e => owners.delete(e.pointerId);
    A.canvas.addEventListener('pointerup', up);
    A.canvas.addEventListener('pointercancel', up);
    // Keys: W/S for the left player, arrows for the right (or left in 1-player).
    const keys = {};
    const kd = e => { keys[e.key.toLowerCase()] = true; };
    const ku = e => { keys[e.key.toLowerCase()] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);

    function point(scorer) {
      const p = scorer === 'L' ? Lp : Rp;
      p.score++;
      serveDir = scorer === 'L' ? 1 : -1;
      ctx.sfx[scorer === 'L' || players === 2 ? 'good' : 'oops']();
      fx.burst(scorer === 'L' ? W * 0.25 : W * 0.75, H / 2, 30, 300);
      txt.add(`${Lp.score} – ${Rp.score}`, W / 2, H / 2 - 40, '#FFD23F', 56);
      if (p.score >= target) return end(scorer);
      ctx.say(`${Lp.score}, ${Rp.score}`);
      balls = [];
      serveT = 1.3;
    }

    function end(winner) {
      over = true;
      ctx.sfx.tada();
      fx.burst(winner === 'L' ? W * 0.25 : W * 0.75, H / 2, 70, 420);
      if (players === 2) {
        ctx.say(`${winner === 'L' ? 'Left' : 'Right'} player wins! Great game, both of you!`);
        setTimeout(() => ctx.finish(3), 2200);
      } else {
        const margin = Lp.score - Rp.score;
        ctx.say(winner === 'L' ? 'You beat Bo! Amazing!' : 'Bo wins this time. Great game!');
        setTimeout(() => ctx.finish(winner === 'L' ? (margin >= 3 || little ? 3 : 2) : 1), 2200);
      }
    }

    function paddleHit(ball, p, dir) {
      const top = p.y - PH / 2, bottom = p.y + PH / 2;
      const front = p.x + dir * PWID / 2;
      const crossing = dir > 0 ? (ball.x - ball.r <= front && ball.x > p.x - 4) : (ball.x + ball.r >= front && ball.x < p.x + 4);
      if (!crossing || ball.y < top - ball.r || ball.y > bottom + ball.r) return false;
      if ((dir > 0 && ball.vx > 0) || (dir < 0 && ball.vx < 0)) return false;
      const kk = (ball.y - p.y) / (PH / 2);
      ball.speed = Math.min(base * 2.2, ball.speed * 1.06);
      const a = kk * 0.85;
      ball.vx = Math.cos(a) * ball.speed * dir;
      ball.vy = Math.sin(a) * ball.speed;
      ball.x = front + dir * ball.r;
      ctx.sfx.note(dir > 0 ? 392 : 523);
      fx.burst(ball.x, ball.y, 8, 140, ['#fff', '#FFD23F']);
      if (players === 1 && dir < 0) cpuErr = (Math.random() - 0.5) * cpuSloppy;
      return true;
    }

    function bumperHit(ball) {
      for (const b of bumpers) {
        const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
        if (d < b.r + ball.r && d > 0) {
          const nx = dx / d, ny = dy / d;
          const dot = ball.vx * nx + ball.vy * ny;
          if (dot < 0) { ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny; }
          // never let the ball go nearly vertical after a bumper
          const sp = Math.hypot(ball.vx, ball.vy);
          if (Math.abs(ball.vx) < sp * 0.45) { ball.vx = Math.sign(ball.vx || 1) * sp * 0.45; ball.vy = Math.sign(ball.vy || 1) * Math.sqrt(Math.max(0, sp * sp - ball.vx * ball.vx)); }
          ball.x = b.x + nx * (b.r + ball.r + 1); ball.y = b.y + ny * (b.r + ball.r + 1);
          b.flash = 0.2;
          ctx.sfx.note(660);
          fx.burst(ball.x, ball.y, 6, 120, ['#FFD23F', '#fff']);
        }
      }
    }

    // Lets automated tests finish quickly. Harmless in normal play.
    if (window.__playroomTest) window.__playroomTest.paddle = { win: () => { Lp.score = target - 1; point('L'); } };

    function update(dt) {
      t += dt;
      fx.update(dt); txt.update(dt);
      for (const b of bumpers) { if (b.flash > 0) b.flash -= dt; if (movingBumpers) b.y = b.oy + Math.sin(t * 1.2 + b.ph) * 50; }
      if (over) return;
      const ks = 420 * dt;
      const lUp = keys.w || (players === 1 && keys.arrowup), lDn = keys.s || (players === 1 && keys.arrowdown);
      if (lUp) setPaddle('L', Lp.y - ks);
      if (lDn) setPaddle('L', Lp.y + ks);
      if (players === 2) {
        if (keys.arrowup) setPaddle('R', Rp.y - ks);
        if (keys.arrowdown) setPaddle('R', Rp.y + ks);
      } else {
        // Bo follows the nearest ball coming his way, a little slowly and not perfectly.
        const coming = balls.filter(b => b.vx > 0).sort((a, b) => b.x - a.x)[0];
        const aim = coming ? coming.y + cpuErr : H / 2;
        const d = aim - Rp.y;
        setPaddle('R', Rp.y + Math.sign(d) * Math.min(Math.abs(d), cpuSpeed * dt));
      }
      if (serveT > 0) { serveT -= dt; if (serveT <= 0) serve(); return; }
      for (const ball of balls) {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        ball.trail.push({ x: ball.x, y: ball.y }); if (ball.trail.length > 8) ball.trail.shift();
        if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); ctx.sfx.tap(); }
        if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); ctx.sfx.tap(); }
        bumperHit(ball);
        paddleHit(ball, Lp, 1) || paddleHit(ball, Rp, -1);
        if (ball.x < -30) return point('R');
        if (ball.x > W + 30) return point('L');
      }
    }

    function drawPaddle(p, color) {
      g.fillStyle = color;
      roundRect(g, p.x - PWID / 2, p.y - PH / 2, PWID, PH, 9); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)';
      roundRect(g, p.x - PWID / 2 + 4, p.y - PH / 2 + 8, 5, PH - 16, 3); g.fill();
    }

    function draw() {
      g.fillStyle = table; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
      g.setLineDash([14, 14]); g.lineWidth = 4;
      g.beginPath(); g.moveTo(W / 2, 14); g.lineTo(W / 2, H - 14); g.stroke(); g.setLineDash([]);
      const li = sprite(me, 'cheer'), ri = sprite(right, 'cheer');
      if (li.complete) g.drawImage(li, W / 2 - 150, 18, 60, 60);
      if (ri.complete) g.drawImage(ri, W / 2 + 90, 18, 60, 60);
      hudText(g, String(Lp.score), W / 2 - 40, 22, { size: 48, align: 'right', color: '#FFD23F' });
      hudText(g, String(Rp.score), W / 2 + 40, 22, { size: 48, align: 'left', color: '#FFD23F' });
      for (let i = 0; i < target; i++) {
        g.fillStyle = i < Lp.score ? '#FFD23F' : 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(30 + i * 22, H - 28, 7, 0, 7); g.fill();
        g.fillStyle = i < Rp.score ? '#FFD23F' : 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(W - 30 - i * 22, H - 28, 7, 0, 7); g.fill();
      }
      for (const b of bumpers) {
        g.fillStyle = b.flash > 0 ? '#FFF3A8' : '#FFD23F';
        g.beginPath(); g.arc(b.x, b.y, b.r + (b.flash > 0 ? 4 : 0), 0, 7); g.fill();
        g.fillStyle = '#FF9F1C'; g.beginPath(); g.arc(b.x, b.y, b.r * 0.6, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(b.x - 7, b.y - 7, 5, 0, 7); g.fill();
      }
      drawPaddle(Lp, '#FF9F1C');
      drawPaddle(Rp, players === 1 ? '#FF5A5F' : '#8E6CEF');
      for (const ball of balls) {
        ball.trail.forEach((p, i) => { g.globalAlpha = i / ball.trail.length * 0.4; g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, ball.r * 0.8, 0, 7); g.fill(); });
        g.globalAlpha = 1;
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 7); g.fill();
        g.fillStyle = '#FF9F1C'; g.beginPath(); g.arc(ball.x - 3, ball.y - 3, 4, 0, 7); g.fill();
      }
      fx.draw(g); txt.draw(g);
      if (t < 1.5) hudText(g, `Level ${LV}`, W / 2, H / 2 - 20, { size: 48, align: 'center', color: '#FFD23F' });
      if (over) hudText(g, '🏆', (Lp.score > Rp.score ? W * 0.25 : W * 0.75), H / 2 - 60, { size: 90, align: 'center' });
    }

    const stop = gameLoop(dt => { update(dt); draw(); });
    cleanupGame = () => { stop(); A.destroy(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); if (window.__playroomTest) delete window.__playroomTest.paddle; };
  }

  return () => { if (cleanupGame) cleanupGame(); };
}
