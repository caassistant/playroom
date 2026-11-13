// Robo Rumble: a cartoon sparring match in the style of classic arcade fighters.
// Kid-friendly: boxing gloves, "POW!" bubbles and bouncy knock-backs. No blood, nobody gets hurt.
// Best of 3 rounds against a computer friend.
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText, sprite } from './arcade-kit.js';
import { CAST } from '../characters.js';
import { pick } from '../words.js';

const W = 800, H = 450, FLOOR = 390;
const SIZE = 150;
const MOVES = {
  punch: { range: 105, dmg: 7, startup: 0.07, active: 0.12, recover: 0.18, push: 140 },
  kick:  { range: 130, dmg: 10, startup: 0.14, active: 0.14, recover: 0.28, push: 220 },
  super: { range: 170, dmg: 22, startup: 0.2, active: 0.35, recover: 0.4, push: 420 },
};

export default function start(ctx) {
  ctx.hideMascot();
  const A = arcadeLayout(ctx.stage, {
    w: W, h: H,
    left: [[null, { id: 'up', label: '⤒' }, null], [{ id: 'left', label: '◀' }, null, { id: 'right', label: '▶' }]],
    right: [[{ id: 'c', label: '🛡️', small: true }, { id: 'd', label: '⭐', small: true, color: '#FFD23F' }], [{ id: 'a', label: '👊', color: '#FF9F1C' }, { id: 'b', label: '🦶', color: '#3A86FF' }]],
  });
  const { g } = A;
  const fx = particles(), txt = popups();
  const lvl = Math.max(1, ctx.level);
  const boss = lvl % 5 === 0;
  const me = ctx.profile.avatar in CAST ? ctx.profile.avatar : 'bo';
  const others = Object.keys(CAST).filter(k => k !== me);
  const foeName = others[(lvl - 1) % others.length];
  const OUTFITS = ['#3A86FF', '#3BB273', '#FF9F1C', '#8E6CEF', '#2EC4B6', '#FF7EB6', '#2B2140', '#FF5A5F'];
  const foeBand = OUTFITS[(lvl - 1) % OUTFITS.length];
  const foeLabel = `${CAST[foeName].name}${boss ? ' 👑' : ''}`;
  const stage = (lvl - 1) % 5;
  // AI gets smarter level by level; bosses (every 5th level) are bigger and tougher.
  const AI = {
    aggression: Math.min(0.95, 0.38 + lvl * 0.03 + (boss ? 0.08 : 0)),
    block: Math.min(0.6, 0.1 + lvl * 0.025 + (boss ? 0.08 : 0)),
    speed: 150 + lvl * 8 + (boss ? 20 : 0),
    jump: Math.min(0.25, 0.08 + lvl * 0.008),
  };
  let wins = [0, 0], round = 1, phase = 'intro', phaseT = 2.2, t = 0, shake = 0;
  ctx.dots(3);

  function fighter(name, x, facing, cpu) {
    const maxHp = cpu ? (boss ? 140 : 90 + Math.min(30, lvl * 2)) : 100;
    return { name, x, y: FLOOR, vx: 0, vy: 0, facing, cpu, hp: maxHp, maxHp, meter: 0, act: 'idle', actT: 0, move: null, hitDone: false, stun: 0, flash: 0, blocking: false, aiT: 0.6,
      size: cpu && boss ? SIZE * 1.2 : SIZE, dmgMul: cpu ? (boss ? 1.25 : 0.85 + lvl * 0.015) : 1, band: cpu ? foeBand : null, crown: cpu && boss };
  }
  let P, C;
  function resetRound() {
    P = fighter(me, 220, 1, false);
    C = fighter(foeName, 580, -1, true);
  }
  resetRound();

  function startMove(f, kind) {
    if (f.act !== 'idle' || f.stun > 0) return;
    if (kind === 'super' && f.meter < 100) return;
    if (kind === 'super') { f.meter = 0; if (!f.cpu) ctx.say('Super spin!'); }
    f.act = kind; f.move = MOVES[kind]; f.actT = 0; f.hitDone = false;
    ctx.sfx.whoosh();
  }

  function attackUpdate(f, o, dt) {
    if (!f.move) return;
    f.actT += dt;
    const m = f.move;
    if (!f.hitDone && f.actT >= m.startup && f.actT <= m.startup + m.active) {
      const dist = (o.x - f.x) * f.facing;
      const heightOk = Math.abs(o.y - f.y) < 110;
      if (dist > 0 && dist < m.range && heightOk) {
        f.hitDone = true;
        const blocked = o.blocking && o.act === 'idle' && o.stun <= 0;
        const dmg = Math.round((blocked ? Math.ceil(m.dmg * 0.2) : m.dmg) * f.dmgMul);
        o.hp = Math.max(0, o.hp - dmg);
        o.vx = f.facing * m.push * (blocked ? 0.4 : 1);
        f.meter = Math.min(100, f.meter + (blocked ? 6 : 18));
        o.meter = Math.min(100, o.meter + 8);
        const hx = (f.x + o.x) / 2, hy = o.y - SIZE * 0.55;
        if (blocked) {
          ctx.sfx.tap();
          txt.add('BLOCK!', hx, hy, '#BDE7FF', 30);
        } else {
          o.stun = f.act === 'super' ? 0.7 : 0.3; o.flash = 0.2; o.act = 'idle'; o.move = null;
          if (f.act === 'super') o.vy = -380;
          ctx.sfx.pop();
          shake = f.act === 'super' ? 0.35 : 0.12;
          fx.burst(hx, hy, f.act === 'super' ? 40 : 16, 300);
          txt.add(pick(f.act === 'super' ? ['SUPER!', 'WHOOSH!'] : f.act === 'kick' ? ['BOING!', 'WHAM!', 'BOP!'] : ['POW!', 'BAM!', 'BOP!']), hx, hy, '#FFD23F', f.act === 'super' ? 52 : 38);
        }
      }
    }
    if (f.actT >= m.startup + m.active + m.recover) { f.act = 'idle'; f.move = null; }
  }

  function physics(f, dt) {
    f.vy += 1500 * dt;
    f.y += f.vy * dt;
    if (f.y >= FLOOR) { f.y = FLOOR; f.vy = 0; }
    f.x += f.vx * dt;
    f.vx *= Math.pow(0.002, dt);
    f.x = Math.max(70, Math.min(W - 70, f.x));
    if (f.stun > 0) f.stun -= dt;
    if (f.flash > 0) f.flash -= dt;
  }

  function control(dt) {
    const k = A.keys;
    P.blocking = !!k.c;
    const busy = P.act !== 'idle' || P.stun > 0;
    if (!busy && !P.blocking) {
      const sp = 260;
      if (k.left) P.x -= sp * dt;
      if (k.right) P.x += sp * dt;
    }
  }
  A.onPress(id => {
    if (phase !== 'fight') return;
    if (id === 'up' && P.y >= FLOOR && P.stun <= 0) { P.vy = -720; ctx.sfx.flip(); }
    if (id === 'a') startMove(P, 'punch');
    if (id === 'b') startMove(P, 'kick');
    if (id === 'd') startMove(P, 'super');
  });

  function ai(dt) {
    C.aiT -= dt;
    const dist = Math.abs(C.x - P.x);
    const aggression = AI.aggression;
    C.blocking = false;
    if (C.stun > 0 || C.act !== 'idle') return;
    // React to the player's attacks by blocking sometimes.
    if (P.act !== 'idle' && P.actT < 0.1 && dist < 160 && Math.random() < AI.block * dt * 30) C.blocking = true;
    const want = dist > 115 ? Math.sign(P.x - C.x) : dist < 70 ? -Math.sign(P.x - C.x) : 0;
    C.x += want * AI.speed * dt;
    if (C.aiT <= 0) {
      C.aiT = 0.9 - aggression * 0.55 + Math.random() * 0.5;
      if (C.meter >= 100 && dist < 170) startMove(C, 'super');
      else if (dist < 130 && Math.random() < aggression) startMove(C, Math.random() < 0.6 ? 'punch' : 'kick');
      else if (Math.random() < AI.jump && C.y >= FLOOR) C.vy = -650;
    }
  }

  function endRound() {
    const pWon = P.hp >= C.hp;
    wins[pWon ? 0 : 1]++;
    ctx.progress(round);
    phase = 'roundEnd'; phaseT = 2.6;
    if (pWon) { ctx.sfx.good(); ctx.say(`${CAST[me].name} wins round ${round}!`); }
    else { ctx.sfx.oops(); ctx.say(`${CAST[foeName].name} wins round ${round}! You can do it!`); }
  }

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    if (shake > 0) shake -= dt;
    if (phase === 'intro') {
      phaseT -= dt;
      if (phaseT <= 0) { phase = 'fight'; ctx.say('Go!'); ctx.sfx.ding(); }
    } else if (phase === 'fight') {
      control(dt);
      ai(dt);
      for (const f of [P, C]) { attackUpdate(f, f === P ? C : P, dt); physics(f, dt); }
      // Face each other.
      if (P.act === 'idle') P.facing = Math.sign(C.x - P.x) || 1;
      if (C.act === 'idle') C.facing = Math.sign(P.x - C.x) || -1;
      // Don't overlap.
      const gap = C.x - P.x;
      if (Math.abs(gap) < 70 && Math.abs(P.y - C.y) < 80) { const push = (70 - Math.abs(gap)) / 2 * Math.sign(gap || 1); P.x -= push; C.x += push; }
      if (P.hp <= 0 || C.hp <= 0) endRound();
    } else if (phase === 'roundEnd') {
      for (const f of [P, C]) physics(f, dt);
      phaseT -= dt;
      if (phaseT <= 0) {
        if (wins[0] === 2 || wins[1] === 2 || round === 3) {
          phase = 'done';
          const iWon = wins[0] > wins[1];
          if (iWon) { ctx.say(boss ? `You beat the champion! Amazing!` : `You win level ${lvl}!`); }
          else ctx.say('Great fight! Practice makes perfect!');
          setTimeout(() => ctx.finish(iWon ? (wins[1] === 0 ? 3 : 2) : 1), 1500);
        } else {
          round++; resetRound(); phase = 'intro'; phaseT = 1.8;
          ctx.say(`Round ${round}!`);
        }
      }
    }
  }

  function drawFighter(f) {
    const img = sprite(f.name, f.stun > 0 ? 'think' : f.act === 'super' ? 'cheer' : (phase === 'roundEnd' && f.hp > 0 && f.hp >= (f === P ? C : P).hp) ? 'cheer' : 'happy');
    const lean = f.act === 'punch' ? 0.12 : f.act === 'kick' ? -0.18 : f.stun > 0 ? -0.2 : 0;
    const spin = f.act === 'super' && f.actT > f.move.startup ? (f.actT * 22) : 0;
    const breathe = f.act === 'idle' ? Math.sin(t * 5 + (f.cpu ? 1 : 0)) * 3 : 0;
    // shadow
    g.fillStyle = 'rgba(0,0,0,.2)';
    g.beginPath(); g.ellipse(f.x, FLOOR + 6, 55 * (1 - (FLOOR - f.y) / 600), 10, 0, 0, 7); g.fill();
    g.save();
    g.translate(f.x, f.y);
    g.scale(f.facing, 1);
    g.rotate(lean + spin);
    const SIZE = f.size;
    if (img.complete) g.drawImage(img, -SIZE / 2, -SIZE + breathe, SIZE, SIZE);
    if (f.band) { // sweatband in the opponent's colour
      g.fillStyle = f.band; roundRect(g, -SIZE * 0.3, -SIZE * 0.83 + breathe, SIZE * 0.6, SIZE * 0.07, 5); g.fill();
      g.beginPath(); g.moveTo(-SIZE * 0.3, -SIZE * 0.8 + breathe); g.lineTo(-SIZE * 0.44, -SIZE * 0.72 + breathe); g.lineTo(-SIZE * 0.4, -SIZE * 0.84 + breathe); g.fill();
    }
    if (f.crown) {
      const cy = -SIZE * 0.98 + breathe;
      g.fillStyle = '#FFD23F'; g.strokeStyle = '#B8860B'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(-26, cy + 18); g.lineTo(-26, cy - 4); g.lineTo(-13, cy + 8); g.lineTo(0, cy - 10); g.lineTo(13, cy + 8); g.lineTo(26, cy - 4); g.lineTo(26, cy + 18); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = '#FF5A5F'; g.beginPath(); g.arc(0, cy + 10, 4, 0, 7); g.fill();
    }
    if (f.flash > 0) { g.globalAlpha = 0.5; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -SIZE / 2, SIZE / 2, 0, 7); g.fill(); g.globalAlpha = 1; }
    // Boxing glove / sneaker during attacks
    if (f.move) {
      const m = f.move, p = Math.min(1, f.actT / (m.startup + m.active * 0.5));
      if (f.act === 'punch') { glove(SIZE * 0.25 + p * 45, -SIZE * 0.55, '#FF5A5F'); }
      if (f.act === 'kick') { shoe(SIZE * 0.2 + p * 55, -SIZE * 0.2); }
    } else if (!f.blocking) {
      glove(SIZE * 0.32, -SIZE * 0.5 + breathe, '#FF5A5F', 0.8);
    }
    g.restore();
    if (f.blocking) {
      g.strokeStyle = 'rgba(189,231,255,.9)'; g.lineWidth = 6;
      g.beginPath(); g.arc(f.x + f.facing * 30, f.y - SIZE / 2, SIZE * 0.55, -1.1, 1.1); if (f.facing < 0) { g.beginPath(); g.arc(f.x - 30, f.y - SIZE / 2, SIZE * 0.55, Math.PI - 1.1, Math.PI + 1.1); } g.stroke();
    }
  }
  function glove(x, y, c, s = 1) {
    g.fillStyle = c; g.strokeStyle = '#2B2140'; g.lineWidth = 3;
    g.beginPath(); g.ellipse(x, y, 20 * s, 17 * s, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.fillRect(x - 22 * s, y - 6 * s, 6 * s, 12 * s);
  }
  function shoe(x, y) {
    g.fillStyle = '#3A86FF'; g.strokeStyle = '#2B2140'; g.lineWidth = 3;
    roundRect(g, x - 18, y - 12, 40, 24, 10); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.fillRect(x - 18, y + 6, 40, 5);
  }

  function bar(x, y, w, hp, meter, right, name) {
    g.fillStyle = 'rgba(43,33,64,.7)'; roundRect(g, x, y, w, 26, 13); g.fill();
    const fw = (w - 6) * hp / 100;
    g.fillStyle = hp > 50 ? '#3BB273' : hp > 25 ? '#FFD23F' : '#FF5A5F';
    roundRect(g, right ? x + 3 + (w - 6 - fw) : x + 3, y + 3, Math.max(0, fw), 20, 10); g.fill();
    g.fillStyle = 'rgba(43,33,64,.7)'; roundRect(g, x, y + 30, w * 0.6, 12, 6); g.fill();
    g.fillStyle = meter >= 100 ? (Math.floor(t * 6) % 2 ? '#FFD23F' : '#FF9F1C') : '#FFD23F';
    const mw = (w * 0.6 - 4) * meter / 100;
    roundRect(g, right ? x + w * 0.4 + 2 + (w * 0.6 - 4 - mw) : x + 2, y + 32, mw, 8, 4); g.fill();
    if (right) { g.fillStyle = 'rgba(43,33,64,.7)'; }
    hudText(g, name, right ? x + w : x, y + 46, { size: 20, align: right ? 'right' : 'left' });
  }

  const STAGES = [
    { sky: ['#FFB8D9', '#FFE3A8'], sun: '#FFF3C4', hills: '#A7D98B', floor: '#C98B5A', lines: '#B67A4C' },   // sunset park
    { sky: ['#7FD3FF', '#D9F4FF'], sun: '#FFF7B0', hills: '#3BA7D9', floor: '#F2D49B', lines: '#E3BF7A' },   // beach
    { sky: ['#1B1F4B', '#4B3F8F'], sun: '#F4F1FF', hills: '#2B2F5F', floor: '#5A5F7A', lines: '#FFD23F' },   // night city
    { sky: ['#BFD9FF', '#F2F8FF'], sun: '#FFFFFF', hills: '#E6EEF7', floor: '#DDE7F2', lines: '#B9C8DA' },   // snowy peak
    { sky: ['#0B0B2A', '#2A1B5C'], sun: '#C9B8FF', hills: '#3A2A70', floor: '#5B4BC4', lines: '#8E6CEF' },   // space dome
  ];
  const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * 300, Math.random() * 2 + 1]);
  function drawStage() {
    const S = STAGES[stage];
    const sky = g.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, S.sky[0]); sky.addColorStop(1, S.sky[1]);
    g.fillStyle = sky; g.fillRect(-10, -10, W + 20, H + 20);
    if (stage === 2 || stage === 4) { g.fillStyle = '#fff'; for (const [x, y, r] of stars) { g.globalAlpha = 0.5 + Math.sin(t * 2 + x) * 0.3; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.globalAlpha = 1; }
    g.fillStyle = S.sun; g.beginPath(); g.arc(W / 2, 170, 70, 0, 7); g.fill();
    if (stage === 2) { // city skyline with lit windows
      for (let i = 0; i < 10; i++) { const bh = 90 + ((i * 53) % 120); g.fillStyle = '#23285A'; g.fillRect(i * 82, FLOOR - bh, 70, bh); g.fillStyle = '#FFD23F'; for (let wy = FLOOR - bh + 12; wy < FLOOR - 10; wy += 22) for (let wx = 8; wx < 60; wx += 20) if ((wx + wy + i) % 3) g.fillRect(i * 82 + wx, wy, 8, 10); }
    } else if (stage === 3) { // snowy mountains
      g.fillStyle = S.hills; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(i * 200 - 60, FLOOR); g.lineTo(i * 200 + 60, FLOOR - 170); g.lineTo(i * 200 + 180, FLOOR); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(i * 200 + 30, FLOOR - 130); g.lineTo(i * 200 + 60, FLOOR - 170); g.lineTo(i * 200 + 90, FLOOR - 130); g.fill(); g.fillStyle = S.hills; }
    } else {
      g.fillStyle = S.hills;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(i * 170 - 20, FLOOR - 10, 130, 70, 0, Math.PI, 0); g.fill(); }
      if (stage === 1) { g.font = '40px system-ui'; g.textAlign = 'center'; g.fillText('🌴', 90, FLOOR - 40); g.fillText('🌴', W - 90, FLOOR - 50); }
    }
    g.fillStyle = S.floor; g.fillRect(-10, FLOOR, W + 20, H - FLOOR + 10);
    g.fillStyle = S.lines; for (let i = 0; i < 12; i++) g.fillRect(i * 72, FLOOR + 22, 36, 6);
  }

  function draw() {
    g.save();
    if (shake > 0) g.translate((Math.random() - .5) * 12, (Math.random() - .5) * 8);
    drawStage();
    drawFighter(C); drawFighter(P);
    fx.draw(g); txt.draw(g);
    g.restore();
    bar(16, 14, 300, P.hp / P.maxHp * 100, P.meter, false, CAST[me].name);
    bar(W - 316, 14, 300, C.hp / C.maxHp * 100, C.meter, true, foeLabel);
    hudText(g, `${'🏆'.repeat(wins[0])}`, 330, 14, { size: 24 });
    hudText(g, `${'🏆'.repeat(wins[1])}`, W - 330, 14, { size: 24, align: 'right' });
    if (phase === 'intro') hudText(g, phaseT > 0.9 ? `ROUND ${round}` : 'GO!', W / 2, 150, { size: 72, align: 'center', color: '#FFD23F' });
    if (phase === 'roundEnd') hudText(g, P.hp >= C.hp ? 'YOU WIN!' : 'NICE TRY!', W / 2, 150, { size: 64, align: 'center', color: '#FFD23F' });
    // super button glow
    A.btns.d.classList.toggle('disabled', P.meter < 100);
  }

  if (window.__playroomTest) window.__playroomTest.rumble = { win: () => { wins = [1, 0]; C.hp = 0; } };
  ctx.instruct(`Level ${lvl}! ${CAST[me].name} versus ${boss ? 'the champion, ' : ''}${CAST[foeName].name}! Punch, kick, and fill your star meter for a super spin!`);
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); };
}
