// Brick Bounce: slide the paddle with your finger, bounce the ball, break all the bricks.
// 30 levels: picture layouts, tough bricks (2–3 hits), steel blocks that never break,
// sliding rows, a multiball power-up and a faster ball as you go.
// Little mode can't lose a ball (the floor is bouncy!). Big mode has 3 lives.
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText } from './arcade-kit.js';

const W = 480, H = 640, COLS = 8;
const COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#FF7EB6'];
const BG = [['#2B2160', '#4B3F8F'], ['#12304F', '#1F6E8C'], ['#3A1C40', '#7A3B69'], ['#123B2A', '#2E7D4F'], ['#3B2A12', '#8C5A1F']];

// Layout key: 1–8 colour (1 hit) · A–H colour (2 hits) · X silver (3 hits) · # steel (never breaks)
//             * big-paddle star · m multiball · . empty
const PICTURES = [
  ['11111111', '22222222', '33333333', '44444444'],                                           // 1 rainbow
  ['.66..66.', '6666666*', '66666666', '.666666.', '..6666..', '...66...'],                   // 2 heart
  ['..3333..', '.333333.', '33.33.33', '33333333', '3.3333.3', '.3....3.', '..3333..'],       // 3 smiley
  ['7.7.7.7.', '.8.8.8.8', '5555*555', '11111111', '2.2.2.2.', '.4.4.4.4'],                   // 4 checks
  ['...22...', '..2222..', '.222222.', '22222222', '...44...', '...44...'],                   // 5 tree
  ['.5....5.', '..5..5..', '.555555.', '55.55.55', '55555555', '5.5..5.5'],                   // 6 space bubble
  ['...33...', '..3333..', '33333333', '.333333.', '.33..33.', '33....33'],                   // 7 star
  ['1.1.1.1.', 'AAAAAAAA', '2.2.m.2.', 'BBBBBBBB', '3.3.3.3.'],                                // 8 stripes (2-hit)
  ['....6...', '...666..', '..66666.', '.666666m', '66666666', '...44...', '...44...'],       // 9 sailboat
  ['FFFFFFFF', 'F......F', 'F.3333.F', 'F.3*33.F', 'F......F', 'FFFFFFFF'],                   // 10 frame
  ['#.#.#.#.', '11111111', '22m22222', '33333333', '.#.#.#.#'],                               // 11 steel teeth
  ['..XXXX..', '.X8888X.', 'X888888X', 'X88*888X', '.X8888X.', '..XXXX..'],                   // 12 gem
  ['22....22', '2D2..2D2', '22222222', '2.2222.2', '2..22..2', '.222222.'],                   // 13 cat face
  ['1.....1.', '11...11.', '1.1.1.1.', '1..1..1.', '1.....1m', 'AAAAAAAA'],                   // 14 mountains
  ['#......#', '.4444444', '4444444.', '.4444*44', '4444444.', '#......#'],                   // 15 zigzag
  ['...7....', '..777...', '.77777..', '7777777m', '..7.7...', '.7...7..'],                   // 16 rocket
  ['CCCCCCCC', 'C3.33.3C', 'C333333C', 'C3....3C', 'CC3333CC', '.CCCCCC.'],                   // 17 robot
  ['5.5.5.5.', '.E.E.E.E', '5.5.m.5.', '.E.E.E.E', '5.5.5.5.', '########'],                   // 18 diamonds over steel
  ['XXXXXXXX', 'X1111*1X', 'X1#11#1X', 'X111111X', 'XXXXXXXX'],                               // 19 vault
  ['.8888888', '8.......', '8.HHHHH.', '8.H*m.H.', '8.HHHHH.', '8.......', '.8888888'],       // 20 spiral
];

function rng(seed) { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

// Levels 21–30 are generated, getting tougher each time.
function generated(n) {
  const r = rng(n * 17);
  const rows = 6 + (n % 3);
  const out = [];
  for (let y = 0; y < rows; y++) {
    let row = '';
    for (let x = 0; x < COLS; x++) {
      const v = r();
      const mirrorX = x < COLS / 2 ? x : COLS - 1 - x;
      const v2 = (v + mirrorX * 0.13) % 1;
      if (v2 < 0.12) row += '.';
      else if (v2 < 0.12 + (n - 20) * 0.012) row += '#';
      else if (v2 < 0.45) row += 'ABCDEFGH'[(y + n) % 8];
      else if (v2 < 0.55 + (n - 20) * 0.01) row += 'X';
      else row += String(((y + x + n) % 8) + 1);
    }
    out.push(row);
  }
  // power-ups
  const pr = out[1].split(''); pr[(n * 3) % COLS] = 'm'; out[1] = pr.join('');
  const sr = out[3].split(''); sr[(n * 5 + 2) % COLS] = '*'; out[3] = sr.join('');
  return out;
}

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const lvl = Math.max(1, ctx.level);
  const A = arcadeLayout(ctx.stage, { w: W, h: H });
  const { g } = A;
  const fx = particles(), txt = popups();
  const layout = lvl <= PICTURES.length ? PICTURES[lvl - 1] : generated(lvl);
  const moving = !little && lvl >= 15 && lvl % 3 === 0;   // sliding rows every third level from 15
  const MARGIN = moving ? 26 : 0;
  const BW = (W - MARGIN * 2) / COLS, BH = 28, TOP = 80;
  let bricks = [];
  layout.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    let hp = 1, color, steel = false, star = false, multi = false;
    if (/[1-8]/.test(ch)) color = COLORS[+ch - 1];
    else if (/[A-H]/.test(ch)) { color = COLORS[ch.charCodeAt(0) - 65]; hp = 2; }
    else if (ch === 'X') { color = '#C9CED8'; hp = 3; }
    else if (ch === '#') { color = '#5C6378'; steel = true; }
    else if (ch === '*') { color = '#FFD23F'; star = true; }
    else if (ch === 'm') { color = '#FFFFFF'; multi = true; }
    if (little) { hp = Math.min(hp, 2); if (steel && lvl < 10) { steel = false; color = '#9AA3B8'; } }
    bricks.push({ x: MARGIN + c * BW + 3, bx: MARGIN + c * BW + 3, y: TOP + r * (BH + 6), row: r, w: BW - 6, h: BH, color, hp, maxHp: hp, steel, star, multi });
  }));
  const breakable = () => bricks.filter(b => !b.steel).length;
  const total = breakable();
  let paddle = { x: W / 2, w: little ? 170 : Math.max(84, 116 - lvl), target: W / 2, bigT: 0 };
  const baseSpeed = little ? Math.min(380, 280 + lvl * 4) : Math.min(560, 340 + lvl * 9);
  let balls = [], lives = little ? Infinity : 3, score = 0, over = false, t = 0;
  const bg = BG[(lvl - 1) % BG.length];
  function serve() { balls = [{ x: paddle.x, y: H - 70, vx: 0, vy: 0, r: 11, stuck: true }]; }
  serve();

  function launch() {
    if (over) return;
    for (const b of balls) if (b.stuck) {
      b.stuck = false;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      b.vx = Math.cos(a) * baseSpeed; b.vy = Math.sin(a) * baseSpeed;
      ctx.sfx.whoosh();
    }
  }

  // Finger anywhere on the board moves the paddle; lifting the finger launches.
  A.canvas.addEventListener('pointerdown', e => { e.preventDefault(); A.canvas.setPointerCapture(e.pointerId); paddle.target = A.toLocal(e).x; });
  A.canvas.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') paddle.target = A.toLocal(e).x; });
  A.canvas.addEventListener('pointerup', launch);
  A.onPress(id => { if (id === 'a' || id === 'up') launch(); });

  function hitBrick(b, ball) {
    if (b.steel) { ctx.sfx.tap(); fx.burst(ball.x, ball.y, 4, 120, ['#fff', '#9AA3B8']); return; }
    b.hp--;
    if (b.hp > 0) { ctx.sfx.flip(); fx.burst(b.x + b.w / 2, b.y + b.h / 2, 6, 140, ['#fff']); return; }
    bricks = bricks.filter(x => x !== b);
    score += 10 * b.maxHp;
    ctx.sfx.pop();
    fx.burst(b.x + b.w / 2, b.y + b.h / 2, 14, 220, [b.color, '#fff']);
    if (b.star) { paddle.bigT = 12; ctx.sfx.good(); txt.add('BIG PADDLE!', W / 2, H / 2, '#FFD23F', 34); }
    if (b.multi) {
      ctx.sfx.good(); txt.add('MULTIBALL!', W / 2, H / 2 + 40, '#fff', 34);
      const src = balls.find(x => !x.stuck) || ball;
      const sp = Math.hypot(src.vx, src.vy) || baseSpeed;
      for (const a of [-0.5, 0.5]) {
        const ang = Math.atan2(src.vy, src.vx) + a;
        balls.push({ x: src.x, y: src.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, r: 11, stuck: false });
      }
    }
    const left = breakable();
    if (left === Math.floor(total / 2)) ctx.say('Halfway there!');
    if (left === 0) win();
  }

  function win() {
    over = true;
    ctx.sfx.tada();
    fx.burst(W / 2, H / 2, 80, 450);
    ctx.say(`Level ${lvl} complete! You broke all the bricks!`);
    setTimeout(() => ctx.finish(little ? 3 : lives >= 3 ? 3 : lives >= 2 ? 2 : 1), 2000);
  }

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    if (A.keys.left) paddle.target -= 500 * dt;
    if (A.keys.right) paddle.target += 500 * dt;
    if (paddle.bigT > 0) paddle.bigT -= dt;
    const pw = paddle.w * (paddle.bigT > 0 ? 1.5 : 1);
    paddle.target = Math.max(pw / 2, Math.min(W - pw / 2, paddle.target));
    paddle.x += (paddle.target - paddle.x) * Math.min(1, dt * 18);
    if (moving) for (const b of bricks) b.x = b.bx + Math.sin(t * 1.2 + b.row) * (MARGIN - 4) * (b.row % 2 ? 1 : -1);
    if (over) return;
    const steps = 4;
    for (const ball of [...balls]) {
      if (ball.stuck) { ball.x = paddle.x; ball.y = H - 70; continue; }
      for (let s = 0; s < steps; s++) {
        const d = dt / steps;
        ball.x += ball.vx * d; ball.y += ball.vy * d;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); ctx.sfx.tap(); }
        if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); ctx.sfx.tap(); }
        if (ball.y < ball.r + 40) { ball.y = ball.r + 40; ball.vy = Math.abs(ball.vy); ctx.sfx.tap(); }
        const py = H - 50;
        if (ball.vy > 0 && ball.y + ball.r >= py && ball.y + ball.r <= py + 22 && Math.abs(ball.x - paddle.x) < pw / 2 + ball.r) {
          const k = (ball.x - paddle.x) / (pw / 2);
          const sp = Math.min(baseSpeed * 1.5, Math.hypot(ball.vx, ball.vy) * 1.02);
          const a = -Math.PI / 2 + k * 1.0;
          ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp;
          ball.y = py - ball.r;
          ctx.sfx.note(392 + Math.abs(k) * 200);
        }
        if (ball.y > H + ball.r) {
          if (little) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy); ctx.sfx.oops(); txt.add('Boing!', ball.x, H - 60, '#fff', 30); }
          else { balls = balls.filter(x => x !== ball); break; }
        }
        for (const b of bricks) {
          const cx = Math.max(b.x, Math.min(ball.x, b.x + b.w)), cy = Math.max(b.y, Math.min(ball.y, b.y + b.h));
          if (Math.hypot(ball.x - cx, ball.y - cy) < ball.r) {
            const ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
            const oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
            if (ox < oy) { ball.vx = -ball.vx; ball.x += Math.sign(ball.x - (b.x + b.w / 2)) * ox; }
            else { ball.vy = -ball.vy; ball.y += Math.sign(ball.y - (b.y + b.h / 2)) * oy; }
            hitBrick(b, ball);
            break;
          }
        }
        if (Math.abs(ball.vy) < 90) ball.vy = 90 * Math.sign(ball.vy || -1);
        if (over) return;
      }
    }
    if (!little && !balls.length && !over) {
      lives--;
      ctx.sfx.oops();
      if (lives <= 0) {
        over = true;
        ctx.say(`Good try! You broke ${total - breakable()} bricks!`);
        setTimeout(() => ctx.finish(1), 1800);
        return;
      }
      ctx.say('Oops! Tap to go again!');
      serve();
    }
  }

  function draw() {
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, bg[0]); grad.addColorStop(1, bg[1]);
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    for (const b of bricks) {
      g.fillStyle = b.color; roundRect(g, b.x, b.y, b.w, b.h, 8); g.fill();
      if (b.steel) {
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; roundRect(g, b.x + 3, b.y + 3, b.w - 6, b.h - 6, 6); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.5)'; for (const dx of [8, b.w - 8]) { g.beginPath(); g.arc(b.x + dx, b.y + b.h / 2, 2.5, 0, 7); g.fill(); }
      } else {
        g.fillStyle = 'rgba(255,255,255,.35)'; roundRect(g, b.x + 5, b.y + 4, b.w - 10, 6, 3); g.fill();
      }
      if (b.maxHp > 1 && !b.steel) {
        // cracks show how many hits are left
        g.fillStyle = 'rgba(43,33,64,.55)';
        for (let i = 0; i < b.hp; i++) { g.beginPath(); g.arc(b.x + b.w / 2 + (i - (b.hp - 1) / 2) * 10, b.y + b.h - 8, 3, 0, 7); g.fill(); }
        if (b.hp < b.maxHp) { g.strokeStyle = 'rgba(43,33,64,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(b.x + 10, b.y + 4); g.lineTo(b.x + 20, b.y + 14); g.lineTo(b.x + 14, b.y + 24); g.stroke(); }
      }
      if (b.star || b.multi) { g.font = '18px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.star ? '⭐' : '⚪', b.x + b.w / 2, b.y + b.h / 2 + 1); }
    }
    const pw = paddle.w * (paddle.bigT > 0 ? 1.5 : 1);
    g.fillStyle = paddle.bigT > 0 ? '#FFD23F' : '#FF9F1C';
    roundRect(g, paddle.x - pw / 2, H - 50, pw, 20, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,.4)'; roundRect(g, paddle.x - pw / 2 + 8, H - 46, pw - 16, 5, 3); g.fill();
    for (const ball of balls) {
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 7); g.fill();
      g.fillStyle = '#FF7EB6'; g.beginPath(); g.arc(ball.x - 3, ball.y - 3, 4, 0, 7); g.fill();
    }
    if (balls.some(b => b.stuck) && !over) hudText(g, 'Tap to launch!', W / 2, H / 2 + 60, { size: 30, align: 'center', color: '#FFD23F' });
    fx.draw(g); txt.draw(g);
    hudText(g, String(score), 12, 8, { size: 26, color: '#FFD23F' });
    hudText(g, `Level ${lvl}`, W / 2, 8, { size: 22, align: 'center' });
    if (!little) hudText(g, '⚪'.repeat(Math.max(0, lives)), W - 12, 8, { size: 22, align: 'right' });
  }

  if (window.__playroomTest) window.__playroomTest.bricks = { win: () => { bricks = bricks.filter(b => b.steel); win(); } };
  ctx.instruct(lvl === 1 ? 'Slide your finger to move the paddle. Break all the bricks!' : `Level ${lvl}! Break all the bricks.${bricks.some(b => b.steel) ? ' Grey steel blocks never break!' : ''}${bricks.some(b => b.maxHp > 1) ? ' Some bricks need more than one bop!' : ''}`);
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); };
}
