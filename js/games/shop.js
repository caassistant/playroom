// Rand Shop: buy things with South African money.
// Coins and notes are our own simple drawings (not copies of real money designs).
// 20 levels: paying whole rands → notes → two items → cents → change → fewest coins → budgets → mixed.
import { shuffle, pick } from '../words.js';

const MONEY = {
  10:    { label: '10c',  kind: 'coin', size: 54, face: '#E0A060', rim: '#B9773A' },
  20:    { label: '20c',  kind: 'coin', size: 60, face: '#E0A060', rim: '#B9773A' },
  50:    { label: '50c',  kind: 'coin', size: 66, face: '#E0A060', rim: '#B9773A' },
  100:   { label: 'R1',   kind: 'coin', size: 66, face: '#D9DEE6', rim: '#A3ABB8' },
  200:   { label: 'R2',   kind: 'coin', size: 72, face: '#D9DEE6', rim: '#A3ABB8' },
  500:   { label: 'R5',   kind: 'coin', size: 78, face: '#D9DEE6', rim: '#E3B341' },
  1000:  { label: 'R10',  kind: 'note', color: '#3BB273' },
  2000:  { label: 'R20',  kind: 'note', color: '#C9894A' },
  5000:  { label: 'R50',  kind: 'note', color: '#FF5A5F' },
  10000: { label: 'R100', kind: 'note', color: '#3A86FF' },
};
const DENOMS = [10000, 5000, 2000, 1000, 500, 200, 100, 50, 20, 10];
const ITEMS = [
  ['apple', '🍎'], ['banana', '🍌'], ['ice cream', '🍦'], ['juice box', '🧃'], ['teddy bear', '🧸'], ['ball', '⚽'],
  ['book', '📚'], ['crayons', '🖍️'], ['balloon', '🎈'], ['cookie', '🍪'], ['cupcake', '🧁'], ['toy car', '🚗'],
  ['pizza slice', '🍕'], ['milk', '🥛'], ['bread', '🍞'], ['chocolate', '🍫'], ['lollipop', '🍭'], ['sunglasses', '🕶️'],
  ['kite', '🪁'], ['puzzle', '🧩'], ['doll', '🪆'], ['yo-yo', '🪀'], ['watermelon', '🍉'], ['grapes', '🍇'], ['popcorn', '🍿'],
  ['hat', '🧢'], ['socks', '🧦'], ['backpack', '🎒'], ['paint set', '🎨'], ['dinosaur toy', '🦖'], ['robot toy', '🤖'], ['bubble mix', '🫧'],
];

const fmt = c => {
  const r = Math.floor(c / 100), ct = c % 100;
  if (!r) return `${ct}c`;
  return `R${r}${ct ? ',' + String(ct).padStart(2, '0') : ''}`;
};
const speak = c => {
  const r = Math.floor(c / 100), ct = c % 100;
  if (!r) return `${ct} cents`;
  return `${r} rand${ct ? ' ' + ct : ''}`;
};
function breakdown(c) {
  const out = [];
  for (const d of DENOMS) while (c >= d) { out.push(d); c -= d; }
  return out;
}

function moneyHTML(v, scale = 1) {
  const m = MONEY[v];
  if (m.kind === 'coin') {
    const s = m.size * scale;
    const bimetal = v === 500;
    return `<span style="width:${s}px;height:${s}px;border-radius:50%;display:inline-grid;place-items:center;flex:none;
      background:${bimetal ? `radial-gradient(circle, ${m.face} 0 52%, #E3B341 54% 100%)` : `radial-gradient(circle at 35% 30%, #fff8 0 12%, ${m.face} 40%)`};
      border:${Math.max(2, 4 * scale)}px solid ${m.rim};box-shadow:0 ${3 * scale}px 0 rgba(0,0,0,.2);
      font-size:${Math.max(11, 20 * scale)}px;font-weight:900;color:#2B2140">${m.label}</span>`;
  }
  const w = 118 * scale, h = 62 * scale;
  return `<span style="width:${w}px;height:${h}px;border-radius:${8 * scale}px;display:inline-flex;align-items:center;justify-content:space-between;flex:none;
    padding:0 ${8 * scale}px;background:linear-gradient(135deg, ${m.color}, ${m.color}cc);border:${2 * scale}px solid rgba(0,0,0,.18);
    box-shadow:0 ${3 * scale}px 0 rgba(0,0,0,.2);color:#fff;font-weight:900;font-size:${Math.max(12, 24 * scale)}px;text-shadow:0 2px 0 rgba(0,0,0,.2)">
    <span style="width:${22 * scale}px;height:${22 * scale}px;border-radius:50%;background:rgba(255,255,255,.35)"></span>${m.label}</span>`;
}

export default function start(ctx) {
  const { stage } = ctx;
  ctx.hideMascot();
  const C10 = [10, 20, 50], COINS = [100, 200, 500], NOTES = [1000, 2000, 5000, 10000];
  const W = (...a) => a.flat();
  // Level table. price in rand (whole) unless cents:true; two: buy two items; type: pay | change | budget | budget2 | fewest
  const LEVELS = [
    { type: 'pay', r: [2, 5], wallet: [100, 200], say: 'Pay with one rand and two rand coins' },
    { type: 'pay', r: [3, 10], wallet: COINS, say: 'Pay with rand coins' },
    { type: 'pay', r: [6, 20], wallet: W(COINS, 1000), say: 'Now with ten rand notes' },
    { type: 'pay', r: [10, 50], wallet: W(COINS, 1000, 2000), say: 'Bigger prices' },
    { type: 'pay', r: [20, 100], wallet: W(COINS, 1000, 2000, 5000), say: 'Up to one hundred rand' },
    { type: 'pay', two: true, r: [2, 10], wallet: W(COINS, 1000), say: 'Buy two things at once' },
    { type: 'pay', cents: [50], r: [1, 9], wallet: W(50, COINS), say: 'Prices with fifty cents' },
    { type: 'pay', cents: [10, 20, 30, 40, 50, 60, 70, 80, 90], r: [1, 9], wallet: W(C10, COINS), say: 'Prices with cents' },
    { type: 'change', paid: 1000, r: [1, 9], say: 'Change from ten rand' },
    { type: 'pay', two: true, cents: [50, 20, 70], r: [1, 8], wallet: W(C10, COINS, 1000), say: 'Two things with cents' },
    { type: 'fewest', r: [3, 20], wallet: W(COINS, 1000), say: 'Use the fewest coins and notes' },
    { type: 'change', paid: 2000, r: [5, 19], say: 'Change from twenty rand' },
    { type: 'budget', budget: [1000, 2000], say: 'What can you afford?' },
    { type: 'pay', r: [50, 200], wallet: W(COINS, NOTES), say: 'Big shopping' },
    { type: 'change', paid: 1000, cents: [50, 20, 80], r: [2, 8], say: 'Change with cents' },
    { type: 'change', two: true, paid: 5000, r: [5, 20], say: 'Two things, then change' },
    { type: 'budget2', budget: [2000, 3000, 5000], say: 'Pick two things you can afford together' },
    { type: 'fewest', cents: [10, 20, 50, 70, 80], r: [1, 15], wallet: W(C10, COINS, 1000), say: 'Fewest coins, with cents' },
    { type: 'change', paid: 10000, r: [20, 95], say: 'Change from one hundred rand' },
    { type: 'mixed', say: 'The big shop challenge' },
  ];
  const cfg0 = LEVELS[Math.min(Math.max(1, ctx.level), LEVELS.length) - 1];
  const ROUND = 5;
  let idx = 0, mistakes = 0, missesHere = 0, busy = false, total = 0, count = 0;
  ctx.dots(ROUND);
  const items = shuffle(ITEMS);
  let itemPtr = 0;
  const nextItem = () => items[(itemPtr++) % items.length];
  const rnd = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);
  const priceOf = cfg => rnd(cfg.r[0], cfg.r[1]) * 100 + (cfg.cents ? pick(cfg.cents) : 0);
  const MIXED = [LEVELS[4], LEVELS[9], LEVELS[11], LEVELS[12], LEVELS[17]];

  function itemCard(it, price, small = false) {
    return `<div class="sh-item" style="background:#fff;border-radius:28px;box-shadow:var(--shadow);padding:${small ? 8 : 12}px ${small ? 14 : 22}px;display:flex;flex-direction:column;align-items:center;min-width:${small ? 110 : 150}px">
      <div class="sh-emoji" style="font-size:${small ? 'clamp(50px,8vw,80px)' : 'clamp(70px,12vw,120px)'};line-height:1.1">${it[1]}</div>
      <div style="position:relative;margin-top:4px;background:#FFD23F;border-radius:12px;padding:4px 16px;font-size:${small ? 'clamp(20px,3vw,30px)' : 'clamp(26px,4vw,40px)'};box-shadow:0 4px 0 #D9A400">${fmt(price)}</div>
    </div>`;
  }
  // Fewest pieces of money for an amount, using only the given wallet.
  function fewestCount(amount, wallet) {
    let c = 0;
    for (const d of [...wallet].sort((a, b) => b - a)) while (amount >= d) { amount -= d; c++; }
    return amount === 0 ? c : Infinity;
  }
  function solved(extraMs = 2800, text) {
    busy = true;
    if (text) ctx.say(text);
    idx++; ctx.progress(idx);
    ctx.later(() => idx >= ROUND ? ctx.finish(mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1) : next(), extraMs);
  }

  function next() {
    busy = false; missesHere = 0; total = 0; count = 0;
    const cfg = cfg0.type === 'mixed' ? MIXED[idx % MIXED.length] : cfg0;
    if (cfg.type === 'change') return changeQuestion(cfg);
    if (cfg.type === 'budget') return budgetQuestion(cfg);
    if (cfg.type === 'budget2') return budget2Question(cfg);
    payQuestion(cfg);
  }

  function payQuestion(cfg) {
    const its = cfg.two ? [nextItem(), nextItem()] : [nextItem()];
    const prices = its.map(() => priceOf(cfg));
    const price = prices.reduce((a, b) => a + b, 0);
    const WALLET = cfg.wallet;
    const fewest = cfg.type === 'fewest';
    const best = fewest ? fewestCount(price, WALLET) : 0;
    stage.innerHTML = `
      <div style="display:flex;gap:18px;align-items:stretch;justify-content:center;flex-wrap:wrap;width:100%">
        <div style="display:flex;gap:10px;align-items:center">${its.map((it, i) => itemCard(it, prices[i], its.length > 1)).join('<span style="font-size:40px">+</span>')}</div>
        <div style="flex:1;min-width:260px;max-width:620px;display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:clamp(20px,3vw,28px);gap:8px;flex-wrap:wrap">
            <span>🧺 ${its.length > 1 ? `Pay <b>${fmt(price)}</b>` : 'Counter'}</span><span>Total: <b class="sh-total" style="color:#3BB273">R0</b>${fewest ? ` · <span class="sh-count">0</span> pieces` : ''}</span>
          </div>
          <div class="sh-tray" style="flex:1;min-height:140px;border:4px dashed #B9E3C6;border-radius:24px;background:#F7FFF9;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start;align-items:center"></div>
        </div>
      </div>
      <div style="display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:14px;width:100%">
        <div class="sh-wallet" style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center;background:#fff;border-radius:24px;padding:12px;box-shadow:var(--shadow)"></div>
        <button class="sh-pay big-btn" style="min-width:140px;font-size:30px">Pay ✓</button>
      </div>`;
    const tray = stage.querySelector('.sh-tray');
    const wallet = stage.querySelector('.sh-wallet');
    const totalEl = stage.querySelector('.sh-total');
    const countEl = stage.querySelector('.sh-count');
    const update = () => { totalEl.textContent = fmt(total); if (countEl) countEl.textContent = count; };
    for (const v of WALLET) {
      const b = document.createElement('button');
      b.dataset.v = v;
      b.style.cssText = 'border-radius:14px;padding:2px;display:grid;place-items:center;transition:transform .12s';
      b.innerHTML = moneyHTML(v, MONEY[v].kind === 'note' ? 0.8 : 1);
      b.onclick = () => {
        if (busy) return;
        if (tray.children.length >= 24) return;
        ctx.sfx.tap();
        total += v; count++; update();
        const c = document.createElement('button');
        c.dataset.v = v;
        c.innerHTML = moneyHTML(v, MONEY[v].kind === 'note' ? 0.75 : 0.85);
        c.style.cssText = 'transition:transform .2s;border-radius:12px';
        c.onclick = () => { if (busy) return; total -= v; count--; update(); c.remove(); ctx.sfx.flip(); ctx.say(speak(total) || 'zero'); };
        tray.appendChild(c);
        ctx.bounce(c);
        wallet.querySelectorAll('.hint').forEach(x => x.classList.remove('hint'));
        ctx.say(total ? speak(total) : 'zero');
      };
      wallet.appendChild(b);
    }
    const hintNext = () => {
      const need = price - total;
      const v = [...WALLET].sort((a, b) => b - a).find(d => d <= need);
      if (v) wallet.querySelector(`[data-v="${v}"]`).classList.add('hint');
    };
    stage.querySelector('.sh-pay').onclick = () => {
      if (busy) return;
      if (total === price) {
        if (fewest && count > best && missesHere < 2) {
          mistakes++; missesHere++;
          ctx.wrong(tray, `That's the right amount! But can you pay with fewer pieces? Try bigger coins or notes. You can do it with ${best}.`);
          return;
        }
        ctx.right(stage.querySelector('.sh-item'));
        [...tray.children].forEach((c, i) => { c.style.transform = 'translateY(-40px) scale(.2)'; c.style.opacity = 0; c.style.transition = `transform .4s ${i * 0.04}s, opacity .4s ${i * 0.04}s`; });
        solved(2800, `Thank you! That's exactly ${speak(price)}. Enjoy your ${its.map(i => i[0]).join(' and ')}!`);
        return;
      }
      mistakes++; missesHere++;
      if (total < price) ctx.wrong(tray, total ? `Not enough yet! You need ${speak(price - total)} more.` : `Tap the money to pay ${speak(price)}.`);
      else ctx.wrong(tray, `That's too much! Tap some money on the counter to take it back.`);
      if (missesHere >= 2 && total < price) hintNext();
    };
    const what = its.length > 1 ? `The ${its[0][0]} costs ${speak(prices[0])} and the ${its[1][0]} costs ${speak(prices[1])}. Together that's ${speak(price)}.` : `The ${its[0][0]} costs ${speak(price)}.`;
    ctx.instruct(`${what} ${fewest ? `Pay with as few coins and notes as you can!` : 'Put the right money on the counter, then press pay!'}`);
  }

  // Choose the right change.
  function changeQuestion(cfg) {
    const its = cfg.two ? [nextItem(), nextItem()] : [nextItem()];
    let prices = its.map(() => priceOf(cfg));
    let price = prices.reduce((a, b) => a + b, 0);
    const paid = cfg.paid;
    if (price >= paid) { prices = prices.map(p => Math.min(p, Math.floor((paid - 100) / its.length / 100) * 100)); price = prices.reduce((a, b) => a + b, 0); }
    const change = paid - price;
    const amounts = new Set([change]);
    const deltas = shuffle([100, -100, 200, -200, 50, -50, 500, 1000, -1000]);
    for (const d of deltas) { if (amounts.size >= 3) break; if (change + d > 0 && change + d !== change) amounts.add(change + d); }
    stage.innerHTML = `
      <div style="display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%">
        <div style="display:flex;gap:10px;align-items:center">${its.map((it, i) => itemCard(it, prices[i], its.length > 1)).join('<span style="font-size:40px">+</span>')}</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;font-size:clamp(20px,3vw,28px)">
          <span>You pay with</span>${moneyHTML(paid, 1.2)}
          <span style="margin-top:6px">Which change is right?</span>
        </div>
      </div>
      <div class="sh-opts" style="display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:16px;width:100%"></div>`;
    const opts = stage.querySelector('.sh-opts');
    shuffle([...amounts]).forEach(a => {
      const b = document.createElement('button');
      b.dataset.a = a;
      b.style.cssText = 'background:#fff;border-radius:22px;box-shadow:var(--shadow);padding:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;min-width:180px;max-width:340px;min-height:96px';
      b.innerHTML = breakdown(a).map(v => moneyHTML(v, MONEY[v].kind === 'note' ? 0.6 : 0.75)).join('');
      b.onclick = () => {
        if (busy) return;
        if (a === change) { ctx.right(b); solved(3200, `Yes! ${speak(paid)} take away ${speak(price)} is ${speak(change)} change.`); }
        else {
          mistakes++; missesHere++;
          ctx.wrong(b, `That's ${speak(a)}. Count again!`);
          b.style.opacity = '.45';
          if (missesHere >= 2) opts.querySelector(`[data-a="${change}"]`).classList.add('hint');
        }
      };
      opts.appendChild(b);
    });
    const what = its.length > 1 ? `The ${its[0][0]} and the ${its[1][0]} cost ${speak(price)} together.` : `The ${its[0][0]} costs ${speak(price)}.`;
    ctx.instruct(`${what} You pay with ${speak(paid)}. Which change is right?`);
  }

  // You have some money: which ONE thing can you buy?
  function budgetQuestion(cfg) {
    const budget = pick(cfg.budget);
    const its = [nextItem(), nextItem(), nextItem()];
    const ok = rnd(0, 2);
    const prices = its.map((_, i) => i === ok ? rnd(Math.max(1, budget / 100 - 6), budget / 100 - 1) * 100 + pick([0, 0, 50]) : rnd(budget / 100 + 1, budget / 100 + 15) * 100);
    choiceUI(budget, its.map((it, i) => ({ html: itemCard(it, prices[i], true), good: i === ok, name: it[0], price: prices[i] })),
      `You have ${speak(budget)}. Which one can you buy?`,
      o => `Yes! ${speak(o.price)} is less than ${speak(budget)}. You can buy the ${o.name}!`,
      o => `The ${o.name} costs ${speak(o.price)}. That's more than ${speak(budget)}!`);
  }
  // Which PAIR of things can you buy together?
  function budget2Question(cfg) {
    const budget = pick(cfg.budget);
    const ok = rnd(0, 2);
    const opts = [0, 1, 2].map(i => {
      const its = [nextItem(), nextItem()];
      let ps;
      if (i === ok) { const a = rnd(1, Math.max(1, budget / 200 - 1)); ps = [a * 100, rnd(1, budget / 100 - a) * 100]; }
      else { const a = rnd(Math.ceil(budget / 200), budget / 100); ps = [a * 100, (budget / 100 - a + rnd(1, 8)) * 100]; }
      const sum = ps[0] + ps[1];
      return { html: `<div style="display:flex;gap:6px">${itemCard(its[0], ps[0], true)}${itemCard(its[1], ps[1], true)}</div>`, good: sum <= budget, name: `${its[0][0]} and the ${its[1][0]}`, price: sum };
    });
    choiceUI(budget, opts, `You have ${speak(budget)}. Which two things can you buy together?`,
      o => `Yes! Together they cost ${speak(o.price)}. That fits in ${speak(budget)}!`,
      o => `Together they cost ${speak(o.price)}. That's too much!`);
  }
  function choiceUI(budget, options, question, yes, no) {
    stage.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap;font-size:clamp(22px,3.2vw,32px)">
        <span>👛 You have</span><div style="display:flex;gap:6px;flex-wrap:wrap">${breakdown(budget).map(v => moneyHTML(v, 0.8)).join('')}</div>
        <b style="color:#3BB273">${fmt(budget)}</b>
      </div>
      <div class="sh-opts" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:18px;width:100%"></div>`;
    const box = stage.querySelector('.sh-opts');
    options.forEach(o => {
      const b = document.createElement('button');
      b.style.cssText = 'border-radius:30px;padding:10px;background:#DDF3E4;box-shadow:inset 0 0 0 3px #B9E3C6;transition:transform .15s, opacity .2s';
      b.innerHTML = o.html;
      b._good = o.good;
      b.onclick = () => {
        if (busy) return;
        if (o.good) { ctx.right(b); solved(3200, yes(o)); }
        else {
          mistakes++; missesHere++;
          ctx.wrong(b, no(o));
          b.style.opacity = '.45';
          if (missesHere >= 2) [...box.children].find(x => x._good)?.classList.add('hint');
        }
      };
      box.appendChild(b);
    });
    ctx.instruct(question);
  }

  ctx.say(`Level ${ctx.level}. ${cfg0.say}!`);
  ctx.later(next, 1600);
  return () => {};
}
