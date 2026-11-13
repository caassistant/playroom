// Letter Tracing: follow the dotted guide with a finger, stroke by stroke.
// A green dot shows where to start and little arrows show which way to go.
// Checkpoints along each stroke must be passed in order (with a forgiving radius),
// and the finished parts stay coloured in. Progress is kept if the finger lifts.
import { shuffle } from '../words.js';

/* ---------- Stroke geometry (0–100 box, y grows downwards) ---------- */
// Arc points: angles in degrees (0 = right, 90 = down). Goes from a0 to a1 in either direction.
function arc(cx, cy, r, a0, a1, ry = r) {
  const n = Math.max(6, Math.round(Math.abs(a1 - a0) / 12));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * ry]);
  }
  return pts;
}
const L = (...pts) => pts;                       // a polyline stroke
const J = (...parts) => parts.reduce((acc, p) => acc.concat(Array.isArray(p[0]) ? p : [p]), []); // join points and arcs

const UPPER = {
  A: [L([50, 8], [18, 92]), L([50, 8], [82, 92]), L([31, 62], [69, 62])],
  B: [L([26, 8], [26, 92]), J([26, 8], [56, 8], arc(56, 29, 21, -90, 90), [26, 50]), J([26, 50], [60, 50], arc(60, 71, 21, -90, 90), [26, 92])],
  C: [arc(54, 50, 40, -40, -320)],
  D: [L([26, 8], [26, 92]), J([26, 8], [44, 8], arc(44, 50, 42, -90, 90), [26, 92])],
  E: [L([74, 8], [26, 8], [26, 92], [74, 92]), L([26, 50], [64, 50])],
  F: [L([74, 8], [26, 8], [26, 92]), L([26, 50], [64, 50])],
  G: [J(arc(52, 50, 40, -40, -360), [62, 50])],
  H: [L([26, 8], [26, 92]), L([74, 8], [74, 92]), L([26, 50], [74, 50])],
  I: [L([50, 8], [50, 92]), L([30, 8], [70, 8]), L([30, 92], [70, 92])],
  J: [L([30, 8], [76, 8]), J([62, 8], [62, 70], arc(44, 70, 18, 0, 180))],
  K: [L([26, 8], [26, 92]), L([74, 8], [26, 56]), L([40, 43], [76, 92])],
  L: [L([28, 8], [28, 92], [74, 92])],
  M: [L([18, 92], [18, 8], [50, 60], [82, 8], [82, 92])],
  N: [L([26, 92], [26, 8], [74, 92], [74, 8])],
  O: [arc(50, 50, 42, -90, -450, 42)],
  P: [L([26, 92], [26, 8]), J([26, 8], [56, 8], arc(56, 29, 21, -90, 90), [26, 50])],
  Q: [arc(50, 50, 42, -90, -450), L([58, 66], [86, 94])],
  R: [L([26, 92], [26, 8]), J([26, 8], [56, 8], arc(56, 29, 21, -90, 90), [26, 50]), L([46, 50], [78, 92])],
  S: [J(arc(50, 29, 21, -30, -270), arc(50, 71, 21, -90, 150))],
  T: [L([20, 8], [80, 8]), L([50, 8], [50, 92])],
  U: [J([26, 8], [26, 64], arc(50, 64, 24, 180, 0), [74, 8])],
  V: [L([20, 8], [50, 92], [80, 8])],
  W: [L([12, 8], [30, 92], [50, 36], [70, 92], [88, 8])],
  X: [L([22, 8], [78, 92]), L([78, 8], [22, 92])],
  Y: [L([22, 8], [50, 50]), L([78, 8], [50, 50], [50, 92])],
  Z: [L([22, 8], [78, 8], [22, 92], [78, 92])],
};
const LOWER = {
  a: [arc(48, 62, 18, -20, -380), L([68, 44], [68, 80])],
  b: [L([32, 8], [32, 80]), arc(50, 62, 18, 180, 540)],
  c: [arc(54, 62, 18, -40, -320)],
  d: [arc(50, 62, 18, 0, -360), L([68, 8], [68, 80])],
  e: [J([32, 62], [68, 62], arc(50, 62, 18, 0, -310))],
  f: [J(arc(60, 20, 12, -20, -180), [48, 80]), L([34, 44], [64, 44])],
  g: [arc(50, 62, 18, 0, -360), J([68, 50], [68, 84], arc(52, 84, 16, 0, 160))],
  h: [L([32, 8], [32, 80]), J([32, 76], [32, 62], arc(50, 62, 18, 180, 360), [68, 80])],
  i: [L([50, 44], [50, 80]), L([50, 22], [50, 28])],
  j: [J([56, 44], [56, 84], arc(42, 84, 14, 0, 160)), L([56, 22], [56, 28])],
  k: [L([32, 8], [32, 80]), L([66, 44], [32, 66]), L([44, 58], [68, 80])],
  l: [L([50, 8], [50, 80])],
  m: [L([22, 44], [22, 80]), J([22, 76], [22, 58], arc(36, 58, 14, 180, 360), [50, 80]), J([50, 76], [50, 58], arc(64, 58, 14, 180, 360), [78, 80])],
  n: [L([32, 44], [32, 80]), J([32, 76], [32, 62], arc(50, 62, 18, 180, 360), [68, 80])],
  o: [arc(50, 62, 18, -90, -450)],
  p: [L([32, 44], [32, 98]), arc(50, 62, 18, 180, 540)],
  q: [arc(50, 62, 18, 0, -360), L([68, 44], [68, 98])],
  r: [L([36, 44], [36, 80]), J([36, 76], [36, 60], arc(52, 60, 16, 180, 320))],
  s: [J(arc(50, 53, 10, -20, -270), arc(50, 72, 10, -90, 160))],
  t: [L([48, 16], [48, 80]), L([34, 44], [64, 44])],
  u: [J([32, 44], [32, 62], arc(50, 62, 18, 180, 0), [68, 44]), L([68, 44], [68, 80])],
  v: [L([30, 44], [50, 80], [70, 44])],
  w: [L([20, 44], [34, 80], [50, 52], [66, 80], [80, 44])],
  x: [L([32, 44], [68, 80]), L([68, 44], [32, 80])],
  y: [L([32, 44], [50, 78]), L([68, 44], [40, 98])],
  z: [L([32, 44], [68, 44], [32, 80], [68, 80])],
};
const DIGITS = {
  0: [arc(50, 50, 30, -90, -450, 42)],
  1: [L([34, 22], [52, 8], [52, 92])],
  2: [J(arc(50, 30, 22, 200, 380), [26, 92], [78, 92])],
  3: [J(arc(48, 29, 21, 200, 450), arc(48, 71, 21, -90, 160))],
  4: [L([58, 8], [20, 66], [82, 66]), L([62, 32], [62, 92])],
  5: [J([74, 8], [32, 8], [29, 46], arc(48, 67, 25, -125, 150))],
  6: [J([68, 8], [46, 24], [30, 50], arc(50, 70, 21, 180, 540))],
  7: [L([22, 8], [78, 8], [40, 92])],
  8: [arc(50, 29, 19, -90, 270), arc(50, 70, 22, -90, 270)],
  9: [J(arc(50, 32, 21, 0, -360), [71, 92])],
};
const SHAPES = {
  down:   { strokes: [L([50, 10], [50, 90])], say: 'a straight line, from top to bottom', emoji: '⬇️' },
  across: { strokes: [L([10, 50], [90, 50])], say: 'a line across', emoji: '➡️' },
  zigzag: { strokes: [L([10, 32], [30, 70], [50, 32], [70, 70], [90, 32])], say: 'a zigzag', emoji: '⚡' },
  circle: { strokes: [arc(50, 50, 38, -90, -450)], say: 'a circle', emoji: '⚪' },
  rainbow:{ strokes: [arc(50, 72, 38, 180, 360)], say: 'a rainbow', emoji: '🌈' },
  slide:  { strokes: [L([14, 14], [86, 86])], say: 'a slide, from top to bottom', emoji: '🛝' },
  wave:   { strokes: [J(arc(26, 50, 16, 180, 360), arc(58, 50, 16, 180, 0), arc(90, 50, 16, 180, 360).slice(0, 7))], say: 'a wave', emoji: '🌊' },
  square: { strokes: [L([20, 20], [80, 20], [80, 80], [20, 80], [20, 22])], say: 'a square', emoji: '🟦' },
  triangle:{ strokes: [L([50, 12], [86, 84], [14, 84], [48, 15])], say: 'a triangle', emoji: '🔺' },
  plus:   { strokes: [L([50, 14], [50, 86]), L([14, 50], [86, 50])], say: 'a plus sign', emoji: '➕' },
  cross:  { strokes: [L([18, 18], [82, 82]), L([82, 18], [18, 82])], say: 'a cross', emoji: '❌' },
};
// Short words to trace letter by letter.
const TWORDS = {
  cat: '🐱', dog: '🐶', sun: '☀️', mum: '👩', dad: '👨', pig: '🐷', hat: '🎩', bed: '🛏️', fox: '🦊', cup: '☕',
  bus: '🚌', hen: '🐔', fish: '🐟', frog: '🐸', ball: '⚽', star: '⭐', cake: '🎂', duck: '🦆', happy: '😊', smile: '😁',
};
const WORDS = {
  A: ['apple', '🍎'], B: ['ball', '⚽'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'],
  G: ['grapes', '🍇'], H: ['hat', '🎩'], I: ['ice cream', '🍦'], J: ['juice', '🧃'], K: ['key', '🔑'], L: ['lion', '🦁'],
  M: ['moon', '🌙'], N: ['nose', '👃'], O: ['owl', '🦉'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rabbit', '🐰'],
  S: ['sun', '☀️'], T: ['tree', '🌳'], U: ['umbrella', '☂️'], V: ['van', '🚐'], W: ['whale', '🐳'], X: ['fox', '🦊'],
  Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'],
};
const NUMWORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

function itemFor(kind, key, wd) {
  if (wd) {
    const word = wd;
    const lower = kind === 'lower', up = key.toUpperCase();
    const spelled = word.text.split('').map(c => c.toUpperCase()).join(', ');
    return { strokes: lower ? LOWER[key] : UPPER[up], glyph: key, emoji: word.emoji,
      intro: word.idx === 0 ? `Let's write the word ${word.text}! First, ${lower ? 'little' : 'big'} ${up}.` : `Now ${lower ? 'little' : 'big'} ${up}.`,
      done: word.last ? `${spelled}. ${word.text}!` : `${up}!`, word };
  }
  if (kind === 'shape') { const s = SHAPES[key]; return { strokes: s.strokes, glyph: '', emoji: s.emoji, intro: `Let's draw ${s.say}!`, done: `You drew ${s.say}!` }; }
  if (kind === 'digit') return { strokes: DIGITS[key], glyph: String(key), emoji: '⭐'.repeat(Math.max(1, +key)).slice(0, 40), intro: `Let's write the number ${key}!`, done: `${NUMWORDS[key]}!${+key ? ` ${key} star${key > 1 ? 's' : ''}!` : ''}` };
  const up = key.toUpperCase(), [word, emoji] = WORDS[up];
  const lower = kind === 'lower';
  const w = up === 'X' ? `${lower ? 'little ' : ''}${up}, like in ${word}` : `${up} is for ${word}`;
  return { strokes: lower ? LOWER[key] : UPPER[key], glyph: key, emoji, intro: `Let's write ${lower ? 'little ' : 'big '}${up}!`, done: `${lower ? 'Little ' : 'Big '}${up}! ${w}!` };
}

/* ---------- Resample a polyline into evenly spaced checkpoints ---------- */
function resample(pts, step = 5) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    let d = step - carry;
    while (d <= seg) { const t = d / seg; out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]); d += step; }
    carry = seg - (d - step);
  }
  const last = pts[pts.length - 1], prev = out[out.length - 1];
  if (Math.hypot(last[0] - prev[0], last[1] - prev[1]) > 1) out.push(last);
  return out;
}
const pathD = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
const INK = ['#FF5A5F', '#FF9F1C', '#3BB273', '#3A86FF', '#8E6CEF', '#FF7EB6'];

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  ctx.hideMascot();

  // Level table: every letter and digit is covered in order, then reviews and words.
  const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), LO = 'abcdefghijklmnopqrstuvwxyz'.split(''), DG = '0123456789'.split('');
  const T = (kind, keys) => keys.map(k => ({ kind, key: k }));
  const some = (arr, n) => shuffle(arr).slice(0, n);
  const wordItems = (text, emoji, kind0 = 'lower') => text.split('').map((c, i) => ({
    kind: i === 0 && kind0 === 'upper' ? 'upper' : 'lower', key: i === 0 && kind0 === 'upper' ? c.toUpperCase() : c.toLowerCase(),
    word: { text: text.toLowerCase(), emoji, idx: i, last: i === text.length - 1 } }));
  const first = (ctx.profile.name || '').trim().split(/\s+/)[0] || '';
  const nameWord = /^[A-Za-z]{2,10}$/.test(first) && !/^(big|little)$/i.test(first) ? first : 'smile';
  let queue, label;
  const lv = Math.max(1, ctx.level);
  if (little) {
    const groups = [];
    for (let i = 0; i < 26; i += 2) groups.push(UP.slice(i, i + 2));
    const table = [
      () => [T('shape', ['down', 'across', 'slide']), 'lines'],
      () => [T('shape', ['zigzag', 'wave', 'rainbow']), 'wiggly lines'],
      () => [T('shape', ['circle', 'square', 'triangle', 'plus']), 'shapes'],
      () => [T('digit', ['0', '1', '2']), 'numbers 0, 1 and 2'],
      () => [T('digit', ['3', '4', '5']), 'numbers 3, 4 and 5'],
      () => [T('digit', ['6', '7', '8', '9']), 'numbers 6 to 9'],
      () => [T('digit', some(DG, 4)), 'number practice'],
      ...groups.map((g, gi) => () => {
        const earlier = UP.slice(0, gi * 2);
        const items = T('upper', g);
        if (earlier.length) items.push({ kind: 'upper', key: some(earlier, 1)[0] });
        return [items, `big ${g.join(' and ')}`];
      }),
      () => [T('upper', some(UP, 4)), 'letter practice'],
      () => [shuffle([...T('digit', some(DG, 2)), ...T('upper', some(UP, 2))]), 'numbers and letters'],
      () => [shuffle([...T('shape', some(['circle', 'square', 'triangle', 'cross', 'wave'], 2)), ...T('upper', some(UP, 2))]), 'shapes and letters'],
      () => [[{ kind: 'upper', key: (nameWord[0] || 'S').toUpperCase() }, ...T('upper', some(UP, 3))], 'letter practice'],
      () => [T('upper', some(UP, 5)), 'the big letter challenge'],
    ];
    [queue, label] = table[Math.min(lv, table.length) - 1]();
  } else {
    const g4 = s => { const out = []; for (let i = 0; i < s.length; i += 4) out.push(s.slice(i, i + 4)); return out; };
    const ug = g4(UP), lg = g4(LO); // 7 groups each (last has 2)
    const table = [
      ...ug.map(g => () => [T('upper', g.length < 4 ? [...g, ...some(UP.slice(0, 24), 2)] : g), `big ${g.join(', ')}`]),
      ...lg.map(g => () => [T('lower', g.length < 4 ? [...g, ...some(LO.slice(0, 24), 2)] : g), `little ${g.join(', ')}`]),
      () => [T('digit', ['0', '1', '2', '3']), 'numbers 0 to 3'],
      () => [T('digit', ['4', '5', '6']), 'numbers 4 to 6'],
      () => [T('digit', ['7', '8', '9']), 'numbers 7 to 9'],
      () => [T('upper', some(UP, 5)), 'big letter review'],
      () => [T('lower', some(LO, 5)), 'little letter review'],
      () => { const k = some(UP, 3); return [k.flatMap(c => [{ kind: 'upper', key: c }, { kind: 'lower', key: c.toLowerCase() }]), 'big and little pairs']; },
      ...[['cat', 'dog'], ['sun', 'mum'], ['dad', 'pig'], ['hat', 'bed'], ['fox', 'cup'], ['bus', 'hen'], ['fish', 'frog'], ['ball', 'star']]
        .map(ws => () => [ws.flatMap(w => wordItems(w, TWORDS[w])), `the words ${ws.join(' and ')}`]),
      () => [wordItems(nameWord, nameWord === 'smile' ? TWORDS.smile : '🌟', nameWord === 'smile' ? 'lower' : 'upper'), nameWord === 'smile' ? 'the word smile' : 'your name'],
      () => [[...wordItems('happy', TWORDS.happy), ...wordItems('cake', TWORDS.cake)], 'the final challenge'],
    ];
    [queue, label] = table[Math.min(lv, table.length) - 1]();
  }
  const R = little ? 17 : 14;               // forgiving touch radius in box units
  let idx = 0, hints = 0, alive = true;
  ctx.dots(queue.length);

  stage.innerHTML = `
    <div class="tr-strip" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:6px"></div>
    <div class="tr-wrap" style="display:flex;gap:18px;align-items:center;justify-content:center;width:100%;flex:1;min-height:0;flex-wrap:wrap">
      <div class="tr-side" style="display:flex;flex-direction:column;align-items:center;gap:6px;min-width:120px">
        <div class="tr-emoji" style="font-size:clamp(56px,10vw,110px);line-height:1.05;text-align:center;max-width:260px;word-break:break-all"></div>
        <div class="tr-glyph" style="font-size:clamp(44px,7vw,80px);color:#FF9F1C;line-height:1"></div>
      </div>
      <div class="tr-pad" style="position:relative;background:#fff;border-radius:32px;box-shadow:var(--shadow);touch-action:none;flex:none">
        <svg class="tr-svg" viewBox="-6 -6 112 112" style="position:absolute;inset:0;width:100%;height:100%;touch-action:none"></svg>
      </div>
    </div>`;
  const pad = stage.querySelector('.tr-pad');
  const svg = stage.querySelector('.tr-svg');
  const emojiEl = stage.querySelector('.tr-emoji');
  const glyphEl = stage.querySelector('.tr-glyph');
  const stripEl = stage.querySelector('.tr-strip');
  function paintStrip() {
    stripEl.innerHTML = queue.map((q, i) => {
      const g = q.kind === 'shape' ? SHAPES[q.key].emoji : q.key;
      const st = i < idx ? 'background:#3BB273;color:#fff' : i === idx ? 'background:#FFD23F;color:#2B2140;transform:scale(1.15)' : 'background:#fff;color:#B9B0C9';
      const gap = q.word && q.word.idx === 0 && i > 0 ? 'margin-left:14px;' : '';
      return `<span style="${gap}min-width:44px;height:44px;padding:0 8px;border-radius:14px;display:inline-grid;place-items:center;font-size:26px;box-shadow:0 3px 0 rgba(0,0,0,.08);${st}">${g}</span>`;
    }).join('');
  }

  function sizePad() {
    const portrait = stage.clientHeight > stage.clientWidth;
    const s = Math.max(220, Math.min(portrait ? stage.clientWidth * 0.92 : stage.clientWidth * 0.62, (stage.clientHeight || 500) - (portrait ? 230 : 70)));
    pad.style.width = pad.style.height = s + 'px';
  }
  sizePad();
  const ro = new ResizeObserver(sizePad); ro.observe(stage);

  let item, strokes, cps, si, k, ink, color, demoTimer = null, tracing = false, lastAdvance = 0;

  function load() {
    const q = queue[idx];
    item = itemFor(q.kind, q.key, q.word);
    paintStrip();
    strokes = item.strokes;
    cps = strokes.map(s => resample(s, 5));
    si = 0; k = 0; ink = []; color = INK[idx % INK.length];
    emojiEl.textContent = '';
    glyphEl.textContent = '';
    render();
    ctx.instruct((idx === 0 ? `Level ${ctx.level}: ${label}! ` : '') + item.intro + ' Start at the green dot.');
    if (little || idx === 0) demo();
  }

  function arrowsFor(pts) {
    let out = '';
    const step = Math.max(2, Math.floor(pts.length / 4));
    for (let i = step; i < pts.length - 1; i += step) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i + 1];
      const a = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
      out += `<path d="M-3.5 -3.5 L3 0 L-3.5 3.5" transform="translate(${pts[i][0]} ${pts[i][1]}) rotate(${a})" fill="none" stroke="#3BB273" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return out;
  }

  function render() {
    let h = '';
    // faint guide for all strokes
    for (const s of strokes) h += `<path d="${pathD(s)}" fill="none" stroke="#EEE8F6" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>`;
    for (const s of strokes) h += `<path d="${pathD(s)}" fill="none" stroke="#C9BEDD" stroke-width="2.2" stroke-dasharray="0.1 5" stroke-linecap="round"/>`;
    // finished strokes in colour
    for (let i = 0; i < si; i++) h += `<path d="${pathD(cps[i])}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (si < strokes.length) {
      const c = cps[si];
      h += `<path d="${pathD(c)}" fill="none" stroke="#FFF1C2" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
      h += arrowsFor(c);
      if (k > 0) h += `<path d="${pathD(c.slice(0, k + 1))}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
      const sp = c[k];
      h += `<circle class="tr-start" cx="${sp[0]}" cy="${sp[1]}" r="6.5" fill="#3BB273" stroke="#fff" stroke-width="2"><animate attributeName="r" values="6;8;6" dur="1s" repeatCount="indefinite"/></circle>`;
      if (strokes.length > 1) h += `<text x="${sp[0] + 7}" y="${sp[1] - 6}" font-size="8" font-weight="900" fill="#3BB273">${si + 1}</text>`;
    }
    h += `<circle class="tr-demo" r="5" fill="#FFD23F" stroke="#2B2140" stroke-width="1.5" opacity="0"/>`;
    svg.innerHTML = h;
  }

  // A yellow dot slides along the current stroke to show the way.
  function demo() {
    clearInterval(demoTimer);
    const c = cps[si]; if (!c) return;
    let i = k;
    demoTimer = setInterval(() => {
      const d = svg.querySelector('.tr-demo'); if (!d || !alive) { clearInterval(demoTimer); return; }
      if (i >= c.length) { d.setAttribute('opacity', 0); clearInterval(demoTimer); return; }
      d.setAttribute('cx', c[i][0]); d.setAttribute('cy', c[i][1]); d.setAttribute('opacity', 0.9);
      i++;
    }, 45);
  }

  function toBox(e) {
    const r = svg.getBoundingClientRect();
    return [-6 + (e.clientX - r.left) / r.width * 112, -6 + (e.clientY - r.top) / r.height * 112];
  }

  function advance(p) {
    const c = cps[si];
    let moved = false;
    // Look a few checkpoints ahead so small wobbles don't block progress.
    for (let j = Math.min(c.length - 1, k + 3); j > k; j--) {
      if (Math.hypot(p[0] - c[j][0], p[1] - c[j][1]) < R) { k = j; moved = true; break; }
    }
    if (moved) {
      const now = performance.now();
      if (now - lastAdvance > 90) { ctx.sfx.note(440 + k * 18); lastAdvance = now; }
      if (k >= c.length - 1) strokeDone(); else render();
    }
  }

  function strokeDone() {
    tracing = false;
    si++; k = 0;
    ctx.sfx.ding();
    render();
    if (si >= strokes.length) itemDone();
    else { ctx.say(strokes.length > 2 ? 'Next line!' : 'Now the next line!'); if (little) demo(); }
  }

  function itemDone() {
    clearInterval(demoTimer);
    ctx.right(pad);
    emojiEl.textContent = item.emoji;
    glyphEl.textContent = item.glyph;
    ctx.bounce(emojiEl);
    ctx.say(item.done);
    idx++;
    ctx.progress(idx);
    ctx.later(() => {
      if (idx >= queue.length) ctx.finish(little ? 3 : hints <= 1 ? 3 : hints <= 4 ? 2 : 1);
      else load();
    }, 2600);
  }

  let missStreak = 0;
  svg.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (si >= strokes.length) return;
    svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
    const p = toBox(e);
    const sp = cps[si][k];
    if (Math.hypot(p[0] - sp[0], p[1] - sp[1]) < R * 1.25) { tracing = true; missStreak = 0; advance(p); }
    else {
      missStreak++;
      const dot = svg.querySelector('.tr-start');
      if (missStreak >= 2) { hints++; ctx.say('Start at the green dot!'); demo(); missStreak = 0; }
      else ctx.sfx.oops();
      if (dot) dot.setAttribute('r', 10);
    }
  });
  svg.addEventListener('pointermove', e => { if (tracing) advance(toBox(e)); });
  const up = () => { tracing = false; };
  svg.addEventListener('pointerup', up);
  svg.addEventListener('pointercancel', up);

  load();
  return () => { alive = false; clearInterval(demoTimer); ro.disconnect(); };
}
