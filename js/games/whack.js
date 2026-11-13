// Pop-Up Pals: our friends pop up out of holes in the garden — tap them quickly to say "boop!".
// Big kids: watch out for the sleepy cloud. Don't wake it up!
// 20 levels with changing rules: boop everyone, only one friend, only one hat colour,
// tap the animal we name, helmet pals that need two boops, and more holes as you go.
import { arcadeLayout, gameLoop, roundRect, particles, popups, hudText, sprite } from './arcade-kit.js';

const W = 720, H = 540, HUD = 50;
const PALS = ['mango', 'tumble', 'bo', 'zuzu'];
const PAL_NAMES = { mango: 'Mango', tumble: 'Tumble', bo: 'Bo', zuzu: 'Zuzu' };
const HATS = [['red', '#FF4B4B'], ['blue', '#3A86FF'], ['yellow', '#FFD23F'], ['green', '#3BB273']];
const ANIMALS = [['🐮', 'cow'], ['🐷', 'pig'], ['🐶', 'dog'], ['🐱', 'cat'], ['🐸', 'frog'], ['🐵', 'monkey'], ['🐰', 'bunny'], ['🦁', 'lion']];
const RULES = ['all', 'all', 'only', 'helmet', 'color', 'animal', 'only', 'all', 'color', 'animal',
  'helmet', 'only', 'color', 'animal', 'all', 'color', 'animal', 'helmet', 'only', 'animal'];
const pickOne = a => a[(Math.random() * a.length) | 0];

export default function start(ctx) {
  ctx.hideMascot();
  ctx.dots(0);
  const little = ctx.mode === 'little';
  const L = Math.max(1, ctx.level | 0);
  const lvl = L;
  let rule = RULES[(L - 1) % 20];
  if (little && rule === 'helmet') rule = 'all';
  const A = arcadeLayout(ctx.stage, { w: W, h: H });
  const { g } = A;
  const fx = particles(), txt = popups();
  const cols = little ? 3 : L >= 15 ? 4 : 3;
  const rows = little ? (L >= 8 ? 3 : 2) : L >= 8 ? 3 : 3;
  const duration = little ? 30 : 40;
  const goal = little ? 0 : 14 + L;
  let targetPal = pickOne(PALS), targetHat = pickOne(HATS), targetAnimal = pickOne(ANIMALS), sinceSwitch = 0;
  const cellW = W / cols, cellH = (H - HUD - 20) / rows;
  const R = Math.min(cellW, cellH) * (little ? 0.36 : 0.32);
  const holes = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    holes.push({ x: (c + 0.5) * cellW, y: HUD + 20 + (r + 0.62) * cellH, state: 'down', k: 0, timer: 0, who: null, cloud: false, hit: false });
  }
  const k = (L - 1) / 19;
  const upTime = little ? 2.0 - k * 0.7 : 1.4 - k * 0.65;
  const gap = little ? 1.05 - k * 0.45 : 0.8 - k * 0.4;
  const maxUp = little ? (L >= 8 ? 3 : 2) : L >= 15 ? 4 : 3;
  let score = 0, boops = 0, timeLeft = duration, spawnT = 0.8, over = false, t = 0, started = false, countT = rule === 'all' ? 2 : 3.2;

  function spawn() {
    const free = holes.filter(h => h.state === 'down');
    if (!free.length || holes.filter(h => h.state !== 'down').length >= maxUp) return;
    const h = free[(Math.random() * free.length) | 0];
    h.state = 'rising'; h.k = 0; h.hit = false; h.hits = 0;
    h.cloud = !little && (rule === 'all' || rule === 'helmet' || L >= 18) && Math.random() < 0.14 + k * 0.1;
    const wantTarget = Math.random() < 0.5;
    h.animal = null; h.hat = null; h.helmet = false;
    h.who = PALS[(Math.random() * PALS.length) | 0];
    if (rule === 'only') h.who = wantTarget ? targetPal : pickOne(PALS.filter(x => x !== targetPal));
    if (rule === 'color') h.hat = wantTarget ? targetHat : pickOne(HATS.filter(x => x !== targetHat));
    if (rule === 'animal') h.animal = wantTarget ? targetAnimal : pickOne(ANIMALS.filter(x => x !== targetAnimal));
    if (rule === 'helmet') h.helmet = Math.random() < 0.45;
    h.timer = upTime * (0.85 + Math.random() * 0.3) * (h.helmet ? 1.4 : 1);
  }

  function tap(e) {
    e.preventDefault();
    if (over || !started) return;
    const p = A.toLocal(e);
    let best = null, bd = Infinity;
    for (const h of holes) {
      if (h.state === 'down' || h.hit) continue;
      const cy = h.y - R * 0.9 * h.k;
      const d = Math.hypot(p.x - h.x, (p.y - cy) * 0.8);
      if (d < R * 1.45 && d < bd) { bd = d; best = h; }
    }
    if (!best) return;
    const cy = best.y - R * 0.9 * best.k;
    if (best.helmet && !best.cloud && best.hits === 0) {
      best.hits = 1; best.helmet = false;
      ctx.sfx.tap();
      fx.burst(best.x, cy - R * 0.8, 10, 160, ['#B8C0CC', '#fff']);
      txt.add('Clonk! Again!', best.x, cy - R, '#fff', 24);
      best.timer = Math.max(best.timer, 0.6);
      return;
    }
    best.hit = true; best.state = 'hiding'; best.timer = 0.35;
    if (best.cloud) {
      score = Math.max(0, score - 5);
      ctx.sfx.oops();
      txt.add('Shh! Sleeping!', best.x, cy - R, '#BDE7FF', 26);
      return;
    }
    if (!isTarget(best)) {
      if (!little) score = Math.max(0, score - 5);
      ctx.sfx.oops();
      txt.add('Not that one!', best.x, cy - R, '#fff', 24);
      if (Math.random() < 0.5) ctx.say(ruleLine());
      return;
    }
    boops++; score += 10;
    ctx.sfx.pop();
    fx.burst(best.x, cy - R * 0.3, 22, 260);
    txt.add(little ? String(boops) : '+10', best.x, cy - R, '#FFD23F', 32);
    if (little && boops <= 20 && rule !== 'animal') ctx.say(String(boops));
    if (rule === 'animal' && ++sinceSwitch >= 4) {
      sinceSwitch = 0;
      targetAnimal = pickOne(ANIMALS.filter(x => x !== targetAnimal));
      ctx.say(`Now tap the ${targetAnimal[1]}!`);
    }
  }
  function isTarget(h) {
    if (rule === 'only') return h.who === targetPal;
    if (rule === 'color') return h.hat === targetHat;
    if (rule === 'animal') return h.animal === targetAnimal;
    return true;
  }
  function ruleLine() {
    if (rule === 'only') return `Only tap ${PAL_NAMES[targetPal]}!`;
    if (rule === 'color') return `Only tap the friends with ${targetHat[0]} hats!`;
    if (rule === 'animal') return `Tap the ${targetAnimal[1]}!`;
    if (rule === 'helmet') return 'Friends with helmets need two boops!';
    return little ? 'Tap the friends when they pop up!' : 'Tap the friends! But don\'t wake the sleepy cloud!';
  }
  A.canvas.addEventListener('pointerdown', tap);

  function finishGame() {
    over = true;
    for (const h of holes) if (h.state !== 'down') { h.state = 'hiding'; h.timer = 0.3; }
    ctx.sfx.tada();
    ctx.say(`Time's up! You booped ${boops} pals!`);
    const stars = little ? 3 : boops >= goal ? 3 : boops >= goal * 0.6 ? 2 : 1;
    setTimeout(() => ctx.finish(stars), 2000);
  }

  // Lets automated tests finish quickly. Harmless in normal play.
  if (window.__playroomTest) window.__playroomTest.whack = { win: () => { boops = 30; score = 300; timeLeft = 0.01; }, holes };

  function update(dt) {
    t += dt;
    fx.update(dt); txt.update(dt);
    if (!started) { countT -= dt; if (countT <= 0) { started = true; ctx.sfx.ding(); } return; }
    for (const h of holes) {
      if (h.state === 'rising') { h.k = Math.min(1, h.k + dt / 0.18); if (h.k >= 1) h.state = 'up'; }
      else if (h.state === 'up') { h.timer -= dt; if (h.timer <= 0) { h.state = 'hiding'; h.timer = 0; } }
      else if (h.state === 'hiding') {
        if (h.timer > 0) { h.timer -= dt; continue; }
        h.k = Math.max(0, h.k - dt / 0.18); if (h.k <= 0) { h.state = 'down'; h.hit = false; }
      }
    }
    if (over) return;
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; return finishGame(); }
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = gap * (0.7 + Math.random() * 0.6); }
  }

  function drawCloud(x, y, s) {
    g.fillStyle = '#E8ECF6';
    for (const [ox, oy, r] of [[-0.45, 0.1, 0.42], [0.45, 0.1, 0.42], [0, -0.2, 0.55], [0, 0.25, 0.5]]) { g.beginPath(); g.arc(x + ox * s, y + oy * s, r * s, 0, 7); g.fill(); }
    g.strokeStyle = '#2B2140'; g.lineWidth = Math.max(2.5, s * 0.07); g.lineCap = 'round';
    for (const ex of [-0.22, 0.22]) { g.beginPath(); g.arc(x + ex * s, y - 0.02 * s, s * 0.1, 0.2, Math.PI - 0.2); g.stroke(); }
    g.fillStyle = '#9AA6FF'; g.font = `900 ${s * 0.4}px Nunito, system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('z', x + s * 0.7, y - s * 0.6 + Math.sin(t * 3) * 4); g.fillText('z', x + s * 0.95, y - s * 0.95 + Math.sin(t * 3 + 1) * 4);
  }

  function draw() {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#9EE0FF'); sky.addColorStop(0.25, '#C8EEFF'); sky.addColorStop(0.26, '#8ED47F'); sky.addColorStop(1, '#6DBF60');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#7BC96F'; for (let k = 0; k < 30; k++) { g.beginPath(); g.ellipse((k * 131) % W, HUD + 90 + ((k * 67) % (H - HUD - 90)), 10, 4, 0, 0, 7); g.fill(); }
    for (const h of holes) {
      // back of the hole
      g.fillStyle = '#5A3A22'; g.beginPath(); g.ellipse(h.x, h.y, R * 1.1, R * 0.38, 0, 0, 7); g.fill();
      g.fillStyle = '#3B2414'; g.beginPath(); g.ellipse(h.x, h.y + 2, R * 0.95, R * 0.28, 0, 0, 7); g.fill();
      if (h.state !== 'down') {
        // pal, clipped so it pops out of the hole
        g.save();
        g.beginPath(); g.rect(h.x - R * 1.6, h.y - R * 3, R * 3.2, R * 3); g.ellipse(h.x, h.y, R * 1.1, R * 0.38, 0, 0, Math.PI); g.clip();
        const s = R * 2;
        const cy = h.y - R * 0.9 * h.k + R * 0.75 * (1 - h.k) + (h.hit ? Math.sin(t * 40) * 3 : 0);
        if (h.cloud) drawCloud(h.x, cy + R * 0.3, R * 0.95);
        else if (h.animal) {
          g.font = `${R * 1.5}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(h.animal[0], h.x, cy - R * 0.05);
        } else {
          const img = sprite(h.who, h.hit ? 'cheer' : 'happy');
          if (img.complete) g.drawImage(img, h.x - s / 2, cy - s * 0.62, s, s * 1.02);
          if (h.hat) {   // a party hat in the rule colour
            g.fillStyle = h.hat[1]; g.strokeStyle = '#2B2140'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(h.x - R * 0.45, cy - s * 0.42); g.lineTo(h.x, cy - s * 0.95); g.lineTo(h.x + R * 0.45, cy - s * 0.42); g.closePath(); g.fill(); g.stroke();
            g.fillStyle = '#fff'; g.beginPath(); g.arc(h.x, cy - s * 0.95, R * 0.12, 0, 7); g.fill();
          }
          if (h.helmet) {
            g.fillStyle = '#B8C0CC'; g.strokeStyle = '#2B2140'; g.lineWidth = 3;
            g.beginPath(); g.arc(h.x, cy - s * 0.3, R * 0.85, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
            g.fillStyle = '#FFD23F'; g.fillRect(h.x - R * 0.1, cy - s * 0.3 - R * 0.85, R * 0.2, R * 0.3);
          }
        }
        g.restore();
      }
      // front lip of the hole
      g.fillStyle = '#8B5A35'; g.beginPath(); g.ellipse(h.x, h.y + R * 0.06, R * 1.12, R * 0.4, 0, 0, Math.PI); g.fill();
      g.fillStyle = '#A06B42'; g.beginPath(); g.ellipse(h.x, h.y + R * 0.2, R * 1.0, R * 0.22, 0, 0, Math.PI); g.fill();
    }
    fx.draw(g); txt.draw(g);
    // HUD: timer bar + score
    g.fillStyle = 'rgba(43,33,64,.75)'; g.fillRect(0, 0, W, HUD);
    const bw = W * 0.5, bx = W / 2 - bw / 2;
    g.fillStyle = 'rgba(255,255,255,.2)'; roundRect(g, bx, 16, bw, 18, 9); g.fill();
    const k = timeLeft / duration;
    g.fillStyle = k > 0.3 ? '#3BB273' : '#FF9F1C'; roundRect(g, bx, 16, Math.max(0, bw * k), 18, 9); g.fill();
    hudText(g, little ? `⭐ ${boops}` : `⭐ ${boops}/${goal}`, 14, 9, { size: 28, color: '#FFD23F' });
    // What to tap this level
    const tx = W - 120, ty = HUD / 2;
    if (rule === 'only') { const img = sprite(targetPal); if (img.complete) g.drawImage(img, tx - 22, ty - 22, 44, 45); }
    else if (rule === 'color') { g.fillStyle = targetHat[1]; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(tx - 14, ty + 16); g.lineTo(tx, ty - 18); g.lineTo(tx + 14, ty + 16); g.closePath(); g.fill(); g.stroke(); }
    else if (rule === 'animal') { g.font = '34px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(targetAnimal[0], tx, ty + 2); }
    else if (rule === 'helmet') { g.fillStyle = '#B8C0CC'; g.beginPath(); g.arc(tx, ty + 8, 16, Math.PI, 0); g.fill(); }
    hudText(g, `${Math.ceil(timeLeft)}s`, W - 14, 9, { size: 26, align: 'right' });
    if (!started) {
      hudText(g, countT > 1 ? `Level ${L}` : 'Go!', W / 2, H / 2 - 70, { size: 64, align: 'center', color: '#FFD23F' });
      if (countT > 1 && rule !== 'all') {
        g.fillStyle = 'rgba(43,33,64,.7)'; roundRect(g, W / 2 - 110, H / 2, 220, 120, 24); g.fill();
        if (rule === 'only') { const img = sprite(targetPal); if (img.complete) g.drawImage(img, W / 2 - 50, H / 2 + 8, 100, 102); }
        else if (rule === 'color') { g.fillStyle = targetHat[1]; g.beginPath(); g.moveTo(W / 2 - 40, H / 2 + 105); g.lineTo(W / 2, H / 2 + 15); g.lineTo(W / 2 + 40, H / 2 + 105); g.closePath(); g.fill(); }
        else if (rule === 'animal') { g.font = '80px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(targetAnimal[0], W / 2, H / 2 + 62); }
        else if (rule === 'helmet') { g.fillStyle = '#B8C0CC'; g.beginPath(); g.arc(W / 2, H / 2 + 90, 60, Math.PI, 0); g.fill(); }
      }
    }
  }

  ctx.instruct(ruleLine());
  const stop = gameLoop(dt => { update(dt); draw(); });
  return () => { stop(); A.destroy(); if (window.__playroomTest) delete window.__playroomTest.whack; };
}
