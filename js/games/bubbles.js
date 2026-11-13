// Bubble Pop — 20 levels per child.
//  Little: count & pop ("Pop 3 bubbles!"), find the animal, pop a colour, find the bubble with N dots.
//  Big:    pop numbers in order (1→10, countdowns, 11→20, counting in 2s, 5s, 10s, odd numbers),
//          find all the even/odd/bigger numbers, and pop two bubbles that add up to a target.
import { NUMBERS, pick, shuffle } from '../words.js';

const SEA = ['🐠', '🐟', '🐡', '🦀', '🐚', '🐢', '🐬', '🦑', '🐳', '⭐'];
const ANIMALS = [['🐟', 'fish'], ['🦀', 'crab'], ['🐢', 'turtle'], ['🐬', 'dolphin'], ['🐳', 'whale'], ['🐙', 'octopus'], ['🐡', 'puffer fish']];
const TINTS = [['red', '#FF4B4B'], ['blue', '#3A86FF'], ['yellow', '#FFD23F'], ['green', '#3BB273'], ['purple', '#8E6CEF'], ['orange', '#FF9F1C']];

// Little levels: [kind, a, b, speed]
const LITTLE = [
  ['count', 1, 3, 1], ['count', 1, 4, 1], ['animal', 3, 2, 1], ['count', 2, 5, 1], ['colour', 3, 3, 1],
  ['count', 3, 6, 1], ['dots', 1, 3, 1], ['animal', 4, 3, 1.1], ['colour', 3, 4, 1.1], ['count', 4, 7, 1.1],
  ['dots', 1, 4, 1.1], ['count', 5, 8, 1.15], ['colour', 4, 5, 1.15], ['dots', 2, 5, 1.2], ['count', 6, 9, 1.25],
  ['animal', 5, 4, 1.3], ['dots', 3, 6, 1.3], ['count', 7, 10, 1.35], ['colour', 5, 6, 1.4], ['count', 8, 10, 1.5],
];
// Big levels: seq [start, step, count] / find [rule, max, need] / sum [target]
const BIG = [
  ['seq', 1, 1, 5], ['seq', 1, 1, 10], ['seq', 10, -1, 10], ['seq', 11, 1, 10], ['find', 'even', 10, 4],
  ['seq', 2, 2, 10], ['find', 'odd', 20, 5], ['sum', 5], ['seq', 20, -1, 10], ['seq', 5, 5, 10],
  ['sum', 10], ['find', 'big', 20, 5], ['seq', 10, 10, 10], ['sum', 10], ['seq', 1, 2, 10],
  ['seq', 3, 3, 10], ['find', 'five', 50, 5], ['sum', 20], ['seq', 100, -10, 10], ['seq', 1, 1, 20],
];
const RULES = {
  even: { test: n => n % 2 === 0, say: 'even numbers', show: '2 4 6' },
  odd: { test: n => n % 2 === 1, say: 'odd numbers', show: '1 3 5' },
  big: { test: n => n > 10, say: 'numbers bigger than 10', show: '> 10' },
  five: { test: n => n % 5 === 0, say: 'numbers in the five times table', show: '5 10 15' },
};

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const lv = Math.min(ctx.level, 20);
  const L = (little ? LITTLE : BIG)[lv - 1];
  const kind = L[0];
  const speedMul = little ? L[3] : 1 + lv * 0.035;
  stage.innerHTML = `
    <div class="prompt"></div>
    <div class="counter" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;min-height:40px;max-width:96%"></div>
    <div class="field" style="position:relative;flex:1;width:100%;overflow:hidden;touch-action:none"></div>`;
  const promptEl = stage.querySelector('.prompt');
  const counter = stage.querySelector('.counter');
  const field = stage.querySelector('.field');

  const rounds = little ? 4 : kind === 'seq' ? (L[3] >= 10 ? 2 : 3) : 3;
  let round = 0, mistakes = 0, busy = false;
  let target = 0, count = 0, need = 0;       // counting kinds
  let goal = null;                           // animal / colour / dots / sum target
  let seq = [], next = 0;                    // big seq
  let held = null;                           // sum: first bubble chosen
  const bubbles = new Set();
  let raf = 0, alive = true;

  ctx.dots(rounds);

  function bubbleStyle(size, tint) {
    const t = tint || 'rgba(70,160,255,.55)';
    return `position:absolute;width:${size}px;height:${size}px;border-radius:50%;display:grid;place-items:center;
      background:radial-gradient(circle at 32% 30%, rgba(255,255,255,.95) 0 10%, rgba(255,255,255,.25) 22%, ${tint ? t + '99' : 'rgba(120,210,255,.35)'} 60%, ${t} 100%);
      box-shadow: inset 0 0 0 3px rgba(255,255,255,.7), 0 4px 14px rgba(40,100,180,.18);
      font-size:${size * .4}px;font-weight:900;color:#1E4B8F;touch-action:none;will-change:transform`;
  }

  function content() {
    // Returns { html, val, tint } for a new bubble, making the wanted thing likely to appear.
    const want = Math.random() < .5;
    if (little) {
      if (kind === 'count') return { html: pick(SEA), val: 1 };
      if (kind === 'animal') { const a = want ? goal : pick(ANIMALS); return { html: a[0], val: a[1] }; }
      if (kind === 'colour') { const c = want ? goal : pick(TINTS.slice(0, L[2])); return { html: '', val: c[0], tint: c[1] }; }
      if (kind === 'dots') {
        const k = want ? goal : 1 + ((Math.random() * L[2]) | 0);
        const cols = k <= 3 ? k : k <= 4 ? 2 : 3;
        return { html: `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;width:${cols * 22}%">${'<span style="aspect-ratio:1;border-radius:50%;background:#1E4B8F"></span>'.repeat(k)}</div>`, val: k };
      }
    }
    if (kind === 'seq') { const rem = seq.slice(next); const n = want ? seq[next] : pick(rem.length ? rem : seq); return { html: n, val: n }; }
    if (kind === 'find') {
      const r = RULES[L[1]], max = L[2];
      let n; do { n = 1 + ((Math.random() * max) | 0); } while (want && !r.test(n));
      return { html: n, val: n };
    }
    if (kind === 'sum') {
      let n;
      if (held && want) n = goal - held.val;
      else if (want && bubbles.size) { const any = pick([...bubbles]); n = goal - any.val; }
      else n = (Math.random() * (goal + 1)) | 0;
      n = Math.max(0, Math.min(goal, n));
      return { html: n, val: n };
    }
    return { html: '', val: 0 };
  }

  function makeBubble() {
    if (!alive || busy) return;
    const size = Math.max(90, Math.min(140, field.clientWidth / 6));
    const b = document.createElement('div');
    const c = content();
    b.style.cssText = bubbleStyle(size, c.tint);
    b.innerHTML = c.html;
    const st = {
      el: b, val: c.val, size,
      x: Math.random() * Math.max(10, field.clientWidth - size),
      y: field.clientHeight + 10,
      vy: (0.9 + Math.random() * 0.8) * speedMul,
      ph: Math.random() * 6.28,
    };
    b.addEventListener('pointerdown', e => { e.preventDefault(); tapBubble(st); });
    field.appendChild(b);
    bubbles.add(st);
  }

  function popBubble(st) {
    bubbles.delete(st);
    ctx.sfx.pop();
    ctx.sparkleAt(st.el, 18);
    st.el.style.transition = 'transform .15s, opacity .15s';
    st.el.style.transform += ' scale(1.4)';
    st.el.style.opacity = '0';
    setTimeout(() => st.el.remove(), 160);
  }

  function miss(st, text) {
    mistakes++;
    ctx.wobble(st.el);
    ctx.sfx.oops();
    if (text) ctx.say(text);
  }

  function tapBubble(st) {
    if (busy || !bubbles.has(st)) return;
    if (little && kind === 'count') {
      popBubble(st); count++; renderCounter(); ctx.say(String(count));
      if (count >= target) roundDone();
      return;
    }
    if (little) {
      if (st.val === (kind === 'animal' ? goal[1] : kind === 'colour' ? goal[0] : goal)) {
        popBubble(st); count++; renderCounter(); ctx.say(String(count));
        if (count >= need) roundDone();
      } else {
        miss(st, kind === 'animal' ? `That's a ${st.val}. Find the ${goal[1]}!` : kind === 'colour' ? `That one is ${st.val}. Find ${goal[0]}!` : `That has ${st.val}. Find ${goal}!`);
      }
      return;
    }
    if (kind === 'seq') {
      if (st.val === seq[next]) {
        popBubble(st); ctx.say(String(st.val)); next++; renderCounter();
        if (next >= seq.length) roundDone();
      } else miss(st, `That's ${st.val}. Find ${seq[next]}!`);
      return;
    }
    if (kind === 'find') {
      if (RULES[L[1]].test(st.val)) {
        popBubble(st); count++; ctx.say(String(st.val)); renderCounter();
        if (count >= need) roundDone();
      } else miss(st, `${st.val} is not one of the ${RULES[L[1]].say}.`);
      return;
    }
    if (kind === 'sum') {
      if (!held) {
        held = st; st.el.style.outline = '6px solid #FFD23F'; ctx.sfx.tap();
        ctx.say(`${st.val}. Now find ${goal - st.val} to make ${goal}!`);
        return;
      }
      if (st === held) { st.el.style.outline = ''; held = null; return; }
      if (held.val + st.val === goal) {
        const a = held; held = null;
        popBubble(a); popBubble(st); count++; renderCounter();
        ctx.say(`${a.val} and ${st.val} make ${goal}!`);
        if (count >= need) roundDone();
      } else {
        miss(st, `${held.val} and ${st.val} make ${held.val + st.val}. We need ${goal}!`);
      }
    }
  }

  function chip(on, label = '') {
    return `<span style="min-width:34px;height:34px;padding:0 6px;border-radius:17px;display:inline-grid;place-items:center;font-size:18px;background:${on ? '#3BB273' : 'rgba(43,33,64,.12)'};color:${on ? '#fff' : '#6B5E80'}">${label}</span>`;
  }
  function renderCounter() {
    if (little) {
      const n = kind === 'count' ? target : need;
      counter.innerHTML = Array.from({ length: n }, (_, i) => `<span style="width:34px;height:34px;border-radius:50%;display:inline-block;background:${i < count ? '#FF9F1C' : 'rgba(43,33,64,.12)'};transition:background .2s"></span>`).join('');
      if (kind === 'count') promptEl.innerHTML = `Pop <span style="color:#FF5A5F;font-size:1.4em">${target}</span> 🫧`;
      if (kind === 'animal') promptEl.innerHTML = `<span style="font-size:1.4em">${goal[0]}</span>`;
      if (kind === 'colour') promptEl.innerHTML = `<span style="display:inline-block;width:1.1em;height:1.1em;border-radius:50%;background:${goal[1]};vertical-align:middle;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2)"></span>`;
      if (kind === 'dots') promptEl.innerHTML = `${'<span style="display:inline-block;width:.6em;height:.6em;margin:0 3px;border-radius:50%;background:#1E4B8F"></span>'.repeat(goal)}`;
      return;
    }
    if (kind === 'seq') {
      counter.innerHTML = seq.map((n, i) => chip(i < next, n)).join('');
      promptEl.innerHTML = next < seq.length ? `Find <span style="color:#FF5A5F;font-size:1.4em">${seq[next]}</span>` : '';
    } else if (kind === 'find') {
      counter.innerHTML = Array.from({ length: need }, (_, i) => chip(i < count)).join('');
      promptEl.innerHTML = `Pop the ${RULES[L[1]].say} <span style="color:#FF5A5F">(${RULES[L[1]].show})</span>`;
    } else if (kind === 'sum') {
      counter.innerHTML = Array.from({ length: need }, (_, i) => chip(i < count)).join('');
      promptEl.innerHTML = `Pop two that make <span style="color:#FF5A5F;font-size:1.4em">${goal}</span>`;
    }
  }

  function roundDone() {
    busy = true;
    round++;
    ctx.progress(round);
    ctx.right(promptEl, { sparkle: false });
    if (little && kind === 'count') ctx.say(`${NUMBERS[target]?.en || target}! Well done!`);
    else ctx.say(pick(['Brilliant!', 'Super!', 'Great job!', 'You did it!']));
    if (held) { held.el.style.outline = ''; held = null; }
    ctx.later(() => { for (const st of [...bubbles]) popBubble(st); }, 400);
    ctx.later(() => { if (round >= rounds) ctx.finish(little ? 3 : mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1); else newRound(); }, 2200);
  }

  function newRound() {
    busy = false; count = 0;
    if (little) {
      if (kind === 'count') {
        let t; do { t = L[1] + ((Math.random() * (L[2] - L[1] + 1)) | 0); } while (t === target && L[2] > L[1]);
        target = t;
        ctx.instruct(`Pop ${target} bubble${target > 1 ? 's' : ''}!`);
      } else if (kind === 'animal') {
        const opts = ANIMALS.slice(0, Math.max(L[2], 2) + 1);
        goal = pick(opts.filter(a => a !== goal)); need = L[1];
        ctx.instruct(`Pop ${need} ${goal[1] === 'fish' ? 'fish' : goal[1] + 's'}!`);
      } else if (kind === 'colour') {
        goal = pick(TINTS.slice(0, L[2]).filter(c => c !== goal)); need = L[1];
        ctx.instruct(`Pop ${need} ${goal[0]} bubbles!`);
      } else if (kind === 'dots') {
        let g; do { g = L[1] + ((Math.random() * (L[2] - L[1] + 1)) | 0); } while (g === goal && L[2] > L[1]);
        goal = g; need = 3;
        ctx.instruct(`Find the bubbles with ${goal} dot${goal > 1 ? 's' : ''}! Pop 3 of them.`);
      }
    } else if (kind === 'seq') {
      const [, s, step, n] = L;
      seq = Array.from({ length: n }, (_, i) => s + i * step);
      next = 0;
      const how = step === 1 ? `from ${seq[0]} to ${seq[n - 1]}` : step === -1 || step === -10 ? `counting down from ${seq[0]}` : `counting in ${Math.abs(step)}s`;
      ctx.instruct(`Pop the numbers in order, ${how}!`);
    } else if (kind === 'find') {
      need = L[3];
      ctx.instruct(`Pop ${need} ${RULES[L[1]].say}!`);
    } else if (kind === 'sum') {
      goal = L[1]; need = 3; held = null;
      ctx.instruct(`Pop two bubbles that add up to ${goal}!`);
    }
    renderCounter();
  }

  let last = performance.now(), sinceSpawn = 0;
  function loop(now) {
    if (!alive) return;
    const dt = Math.min(50, now - last) / 16.7; last = now;
    sinceSpawn += dt * 16.7;
    const maxOnScreen = little ? 7 : kind === 'sum' ? 10 : 9;
    if (sinceSpawn > 750 / speedMul && bubbles.size < maxOnScreen) { sinceSpawn = 0; makeBubble(); }
    for (const st of [...bubbles]) {
      // A chosen bubble waits for its partner.
      if (st !== held) st.y -= st.vy * dt * 1.4;
      st.ph += 0.03 * dt;
      const x = st.x + Math.sin(st.ph) * 18;
      st.el.style.transform = `translate(${x}px, ${st.y}px)`;
      if (st.y < -st.size - 10) { bubbles.delete(st); st.el.remove(); }
    }
    raf = requestAnimationFrame(loop);
  }

  newRound();
  raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); };
}
