// What's the Time? Learn to read an analogue clock.
// Question types take turns: set the clock (drag the hands), pick the right clock, match to a digital time.
// 20 levels: o'clock → half past → quarters → 5 minutes → any minute, plus daily-routine times
// and "what time will it be later?" questions.
import { shuffle, pick } from '../words.js';

const HOURS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen',
  'quarter', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five',
  'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine'];
const minW = m => m % 5 === 0 ? NUMW[m] : `${NUMW[m]} minute${m === 1 ? '' : 's'}`;
const nextH = h => (h % 12) + 1;
function sayTime(h, m) {
  if (m === 0) return `${HOURS[h]} o'clock`;
  if (m === 15) return `quarter past ${HOURS[h]}`;
  if (m === 30) return `half past ${HOURS[h]}`;
  if (m === 45) return `quarter to ${HOURS[nextH(h)]}`;
  if (m < 30) return `${minW(m)} past ${HOURS[h]}`;
  return `${minW(60 - m)} to ${HOURS[nextH(h)]}`;
}
const digital = (h, m) => `${h}:${String(m).padStart(2, '0')}`;

function clockSVG(h, m, { interactive = false, ghost = null } = {}) {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = i * 6 * Math.PI / 180, big = i % 5 === 0;
    const r1 = big ? 80 : 84, r2 = 88;
    ticks += `<line x1="${100 + Math.sin(a) * r1}" y1="${100 - Math.cos(a) * r1}" x2="${100 + Math.sin(a) * r2}" y2="${100 - Math.cos(a) * r2}" stroke="${big ? '#2B2140' : '#C9C2D6'}" stroke-width="${big ? 3 : 1.5}" stroke-linecap="round"/>`;
  }
  let nums = '';
  for (let i = 1; i <= 12; i++) {
    const a = i * 30 * Math.PI / 180;
    nums += `<text x="${100 + Math.sin(a) * 66}" y="${100 - Math.cos(a) * 66}" text-anchor="middle" dominant-baseline="central" font-size="19" font-weight="900" fill="#2B2140" font-family="Nunito, system-ui, sans-serif">${i}</text>`;
  }
  const hand = (cls, angle, len, w, color, knob) => `<g class="${cls}" transform="rotate(${angle} 100 100)">
      <line x1="100" y1="${100 + 10}" x2="100" y2="${100 - len}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
      ${knob ? `<circle cx="100" cy="${100 - len}" r="10" fill="${color}" stroke="#fff" stroke-width="3"/>` : ''}
    </g>`;
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  let g = '';
  if (ghost) {
    g = `<g opacity=".28">${hand('', ((ghost.h % 12) + ghost.m / 60) * 30, 46, 11, '#3A86FF', true)}${hand('', ghost.m * 6, 70, 7, '#FF9F1C', true)}</g>`;
  }
  return `<svg viewBox="0 0 200 200" style="width:100%;height:100%;touch-action:none;display:block">
    <circle cx="100" cy="100" r="96" fill="#2EC4B6"/>
    <circle cx="100" cy="100" r="90" fill="#fff"/>
    ${ticks}${g}
    ${hand('hh', ha, 46, 11, '#3A86FF', interactive)}
    ${hand('mh', ma, 70, 7, '#FF9F1C', interactive)}
    <g style="pointer-events:none" paint-order="stroke" stroke="#fff" stroke-width="4">${nums}</g>
    <circle cx="100" cy="100" r="7" fill="#2B2140"/>
  </svg>`;
}

export default function start(ctx) {
  const { stage } = ctx;
  ctx.hideMascot();
  const M0 = [0], M30 = [0, 30], M15 = [0, 15, 30, 45], M5 = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const M1 = Array.from({ length: 60 }, (_, i) => i);
  // Level table: which minutes, which question types, and for "later" questions how far ahead.
  const LEVELS = [
    { m: M0, types: ['pick'], say: "o'clock times" },
    { m: M0, types: ['set', 'pick'], say: "set the clock to o'clock" },
    { m: M0, types: ['set', 'pick', 'digital'], say: "o'clock on a digital clock" },
    { m: M30, types: ['pick', 'digital'], say: 'half past' },
    { m: M30, types: ['set', 'pick', 'digital'], say: 'set half past' },
    { m: M30, types: ['routine'], say: 'times in our day' },
    { m: M15, types: ['pick', 'digital'], say: 'quarter past and quarter to' },
    { m: M15, types: ['set', 'pick', 'digital'], say: 'set the quarters' },
    { m: M15, types: ['toclock', 'digital'], say: 'digital to clock' },
    { m: M30, types: ['later'], ahead: [60], say: 'one hour later' },
    { m: M5, types: ['pick', 'digital'], say: 'five minute times' },
    { m: M5, types: ['set', 'pick', 'digital'], say: 'set five minute times' },
    { m: M5, types: ['toclock', 'set'], say: 'digital to clock' },
    { m: M15, types: ['routine'], say: 'our day, with quarters' },
    { m: M15, types: ['later'], ahead: [30, 60], say: 'half an hour later' },
    { m: M1, types: ['digital', 'pick'], say: 'any minute' },
    { m: M1, types: ['toclock', 'digital'], say: 'any minute, digital to clock' },
    { m: M5, types: ['later'], ahead: [15, 30, 120], say: 'later and later' },
    { m: M5, types: ['routine', 'later', 'set'], ahead: [30, 60], say: 'our busy day' },
    { m: M1, types: ['set', 'pick', 'digital', 'toclock', 'later', 'routine'], ahead: [15, 30, 60], say: 'the time master challenge' },
  ];
  const L = LEVELS[Math.min(Math.max(1, ctx.level), LEVELS.length) - 1];
  const MINUTES = L.m;
  const lvl = MINUTES === M0 ? 1 : 2;   // level 1 behaviour for setting o'clock only
  const N = 6;
  let q = 0, mistakes = 0, missesHere = 0, busy = false;
  const TYPES = L.types;
  ctx.dots(N);
  const ROUTINE = [
    ['🥣', 'Breakfast', [7], 'in the morning'], ['🦷', 'Brush your teeth', [7], 'in the morning'], ['🎒', 'Go to school', [7, 8], 'in the morning'],
    ['🍎', 'Snack time', [10], 'in the morning'], ['🥪', 'Lunch time', [12, 1], 'at lunch time'], ['🛝', 'Play in the park', [3, 4], 'in the afternoon'],
    ['⚽', 'Soccer practice', [4], 'in the afternoon'], ['🍝', 'Supper', [6], 'in the evening'], ['🛁', 'Bath time', [6], 'in the evening'],
    ['📖', 'Story time', [7], 'in the evening'], ['😴', 'Bedtime', [7, 8], 'at night'],
  ];

  const randTime = () => ({ h: 1 + ((Math.random() * 12) | 0), m: pick(MINUTES) });
  const same = (a, b) => a.h === b.h && a.m === b.m;
  function distractors(t, n) {
    const out = [t];
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      let c;
      const r = Math.random();
      if (MINUTES.length === 1 || r < 0.45) c = { h: ((t.h - 1 + pick([1, 2, 3, 9, 10, 11])) % 12) + 1, m: t.m };
      else if (r < 0.8) c = { h: t.h, m: pick(MINUTES) };
      else c = randTime();
      // Classic mix-up: swapping the hands' meaning (e.g. 3:00 vs 12:15).
      if (out.every(o => !same(o, c))) out.push(c);
    }
    return shuffle(out);
  }

  function next() {
    busy = false; missesHere = 0;
    const type = TYPES[q % TYPES.length];
    const t = randTime();
    if (type === 'set') setQ(t);
    else if (type === 'pick') pickQ(t);
    else if (type === 'toclock') toClockQ(t);
    else if (type === 'later') laterQ(t);
    else if (type === 'routine') routineQ();
    else digitalQ(t);
  }
  function done(el, t) {
    busy = true;
    ctx.right(el);
    ctx.say(`Yes! It's ${sayTime(t.h, t.m)}!`);
    q++; ctx.progress(q);
    ctx.later(() => q >= N ? ctx.finish(mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1) : next(), 2400);
  }
  const clockSize = () => Math.max(200, Math.min(stage.clientWidth * 0.62, (stage.clientHeight || 600) - 150, 440));

  /* (a) Set the clock */
  function setQ(t, banner = '') {
    if (t.m % 5) t = { h: t.h, m: Math.round(t.m / 5) * 5 % 60 };
    let cur;
    do { cur = randTime(); } while (same(cur, t));
    if (lvl === 1) cur.m = 0;
    const s = clockSize();
    stage.innerHTML = `
      ${banner}<div class="prompt">Set the clock to <span style="color:#2EC4B6">${sayTime(t.h, t.m)}</span></div>
      <div style="display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap">
        <div class="ck-face" style="width:${s}px;height:${s}px;touch-action:none"></div>
        <div style="display:flex;flex-direction:column;gap:12px;align-items:center;font-size:18px;color:var(--ink-soft);max-width:180px;text-align:center">
          <div><span style="color:#FF9F1C">●</span> long hand = minutes<br><span style="color:#3A86FF">●</span> short hand = hours</div>
          <button class="ck-ok big-btn" style="font-size:36px">✓</button>
        </div>
      </div>`;
    const face = stage.querySelector('.ck-face');
    let ghost = null;
    const draw = () => { face.innerHTML = clockSVG(cur.h, cur.m, { interactive: true, ghost }); };
    draw();
    if (window.__playroomTest) window.__playroomTest.clock = { setTo: () => { cur = { ...t }; draw(); } };
    let drag = null;
    const angleOf = e => {
      const r = face.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      return { a: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360, d: Math.hypot(x, y) / (r.width / 2) * 100 };
    };
    const tip = (angle, len) => [Math.sin(angle * Math.PI / 180) * len, -Math.cos(angle * Math.PI / 180) * len];
    face.addEventListener('pointerdown', e => {
      if (busy) return;
      e.preventDefault(); face.setPointerCapture(e.pointerId);
      const r = face.getBoundingClientRect();
      const px = (e.clientX - (r.left + r.width / 2)) / (r.width / 2) * 100, py = (e.clientY - (r.top + r.height / 2)) / (r.width / 2) * 100;
      const [hx, hy] = tip(((cur.h % 12) + cur.m / 60) * 30, 46), [mx, my] = tip(cur.m * 6, 70);
      drag = Math.hypot(px - hx, py - hy) < Math.hypot(px - mx, py - my) ? 'h' : 'm';
      if (lvl === 1 && drag === 'm' && Math.hypot(px - hx, py - hy) < 45) drag = 'h';
      move(e);
    });
    const move = e => {
      if (!drag) return;
      const { a } = angleOf(e);
      if (drag === 'm') {
        const nm = (Math.round(a / 30) * 5) % 60;
        if (nm !== cur.m) { cur.m = nm; ctx.sfx.tap(); draw(); }
      } else {
        let nh = Math.round((a - cur.m / 2) / 30);
        nh = ((nh % 12) + 12) % 12 || 12;
        if (nh !== cur.h) { cur.h = nh; ctx.sfx.tap(); draw(); }
      }
    };
    face.addEventListener('pointermove', move);
    face.addEventListener('pointerup', () => { drag = null; });
    face.addEventListener('pointercancel', () => { drag = null; });
    stage.querySelector('.ck-ok').onclick = () => {
      if (busy) return;
      if (same(cur, t)) return done(face, t);
      mistakes++; missesHere++;
      const hint = cur.m !== t.m ? 'Look at the long minute hand.' : 'Look at the short hour hand.';
      ctx.wrong(face, `This clock says ${sayTime(cur.h, cur.m)}. ${hint}`);
      if (missesHere >= 2) { ghost = t; draw(); }
    };
    if (!banner) ctx.instruct(`Move the hands to show ${sayTime(t.h, t.m)}. Then press the tick.`);
  }

  /* (d) Digital time → which clock? */
  function toClockQ(t) {
    const opts = distractors(t, 3);
    const s = Math.max(120, Math.min((stage.clientWidth - 80) / 3, (stage.clientHeight || 600) - 260, 250));
    stage.innerHTML = `<div style="background:#24324A;color:#5EF2FF;font-size:clamp(48px,8vw,80px);border-radius:22px;padding:6px 28px;box-shadow:0 6px 0 #101828;font-variant-numeric:tabular-nums;letter-spacing:3px">${digital(t.h, t.m)}</div>
      <div class="prompt">Which clock shows this time?</div>
      <div class="ck-opts" style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center"></div>`;
    const box = stage.querySelector('.ck-opts');
    for (const o of opts) {
      const b = document.createElement('button');
      b.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;transition:transform .15s,opacity .2s`;
      b.innerHTML = clockSVG(o.h, o.m);
      b._t = o;
      b.onclick = () => {
        if (busy) return;
        if (same(o, t)) return done(b, t);
        mistakes++; missesHere++;
        ctx.wrong(b, `That one says ${sayTime(o.h, o.m)}.`);
        b.style.opacity = '.4';
        if (missesHere >= 2) [...box.children].find(x => same(x._t, t))?.classList.add('hint');
      };
      box.appendChild(b);
    }
    ctx.instruct(`The digital clock says ${sayTime(t.h, t.m)}. Which clock shows the same time?`);
  }

  /* (e) What time will it be later? */
  function laterQ(t) {
    const add = pick(L.ahead || [60]);
    const plus = (tt, mins) => { let tot = ((tt.h % 12) * 60 + tt.m + mins + 720 * 4) % 720; return { h: Math.floor(tot / 60) || 12, m: tot % 60 }; };
    const ans = plus(t, add);
    const aheadW = add === 60 ? 'one hour' : add === 120 ? 'two hours' : add === 30 ? 'half an hour' : `${add} minutes`;
    const cand = [ans, plus(t, -add), plus(t, add + 60), plus(t, add === 60 ? 30 : 60), t];
    const opts = [];
    for (const c of cand) if (opts.length < 3 && !opts.some(o => same(o, c))) opts.push(c);
    const s = Math.max(170, Math.min(stage.clientWidth * 0.42, (stage.clientHeight || 600) - 240, 320));
    stage.innerHTML = `<div class="prompt">What time will it be in <span style="color:#2EC4B6">${aheadW}</span>?</div>
      <div style="width:${s}px;height:${s}px">${clockSVG(t.h, t.m)}</div>
      <div class="ck-opts" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:14px"></div>`;
    const box = stage.querySelector('.ck-opts');
    for (const o of shuffle(opts)) {
      const b = document.createElement('button');
      b.style.cssText = 'min-width:140px;height:84px;border-radius:18px;background:#24324A;color:#5EF2FF;font-size:44px;font-variant-numeric:tabular-nums;box-shadow:0 6px 0 #101828;letter-spacing:2px';
      b.textContent = digital(o.h, o.m);
      b._t = o;
      b.onclick = () => {
        if (busy) return;
        if (same(o, ans)) { busy = true; ctx.right(b); ctx.say(`Yes! ${aheadW} after ${sayTime(t.h, t.m)} is ${sayTime(ans.h, ans.m)}!`); q++; ctx.progress(q); ctx.later(() => q >= N ? ctx.finish(mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1) : next(), 3000); return; }
        mistakes++; missesHere++;
        ctx.wrong(b, `That's ${sayTime(o.h, o.m)}. Count on ${aheadW} from ${sayTime(t.h, t.m)}.`);
        b.style.opacity = '.4';
        if (missesHere >= 2) [...box.children].find(x => same(x._t, ans))?.classList.add('hint');
      };
      box.appendChild(b);
    }
    ctx.instruct(`The clock says ${sayTime(t.h, t.m)}. What time will it be in ${aheadW}?`);
  }

  /* (f) Our day: set the clock for a daily routine picture */
  function routineQ() {
    const [emoji, what, hours, when] = pick(ROUTINE);
    const mins = MINUTES.filter(m => m % 5 === 0 && (m === 0 || m === 30 || MINUTES.length > 2));
    const t = { h: pick(hours), m: pick(mins.length ? mins : [0]) };
    const banner = `<div style="display:flex;align-items:center;gap:12px;font-size:clamp(22px,3.4vw,34px)"><span style="font-size:clamp(50px,8vw,80px)">${emoji}</span><span>${what} ${when}</span></div>`;
    setQ(t, banner);
    ctx.instruct(`${what} is at ${sayTime(t.h, t.m)} ${when}. Set the clock!`);
  }

  /* (b) Which clock shows the time? */
  function pickQ(t) {
    const opts = distractors(t, 3);
    const s = Math.max(130, Math.min((stage.clientWidth - 80) / 3, (stage.clientHeight || 600) - 170, 280));
    stage.innerHTML = `<div class="prompt">Which clock says <span style="color:#2EC4B6">${sayTime(t.h, t.m)}</span>?</div>
      <div class="ck-opts" style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center"></div>`;
    const box = stage.querySelector('.ck-opts');
    for (const o of opts) {
      const b = document.createElement('button');
      b.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;transition:transform .15s,opacity .2s`;
      b.innerHTML = clockSVG(o.h, o.m);
      b._t = o;
      b.onclick = () => {
        if (busy) return;
        if (same(o, t)) return done(b, t);
        mistakes++; missesHere++;
        ctx.wrong(b, `That one says ${sayTime(o.h, o.m)}.`);
        b.style.opacity = '.4';
        if (missesHere >= 2) [...box.children].find(x => same(x._t, t))?.classList.add('hint');
      };
      box.appendChild(b);
    }
    ctx.instruct(`Which clock says ${sayTime(t.h, t.m)}?`);
  }

  /* (c) Match the clock to the digital time */
  function digitalQ(t) {
    const opts = distractors(t, 3);
    const s = Math.max(180, Math.min(stage.clientWidth * 0.5, (stage.clientHeight || 600) - 220, 360));
    stage.innerHTML = `<div class="prompt">What time is it?</div>
      <div style="width:${s}px;height:${s}px">${clockSVG(t.h, t.m)}</div>
      <div class="ck-opts" style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin-top:14px"></div>`;
    const box = stage.querySelector('.ck-opts');
    for (const o of opts) {
      const b = document.createElement('button');
      b.style.cssText = 'min-width:140px;height:84px;border-radius:18px;background:#24324A;color:#5EF2FF;font-size:44px;font-variant-numeric:tabular-nums;box-shadow:0 6px 0 #101828;letter-spacing:2px';
      b.textContent = digital(o.h, o.m);
      b._t = o;
      b.onclick = () => {
        if (busy) return;
        ctx.say(sayTime(o.h, o.m));
        if (same(o, t)) return done(b, t);
        mistakes++; missesHere++;
        ctx.wrong(b);
        b.style.opacity = '.4';
        if (missesHere >= 2) [...box.children].find(x => same(x._t, t))?.classList.add('hint');
      };
      box.appendChild(b);
    }
    ctx.instruct('What time does this clock show? Find the matching time.');
  }

  ctx.say(`Level ${ctx.level}: ${L.say}!`);
  ctx.later(next, 1500);
  return () => {};
}
