// Shape Sorter — 20 levels per child.
// Sorting by colour, shape, size, colour+shape, animal homes, food groups and numbers (odd/even, smaller/bigger),
// plus "what comes next?" pattern levels. Drag (or tap, then tap a bucket) each thing into the right bucket.
import { COLORS, SHAPES, shuffle, pick } from '../words.js';

const COLOR_KEYS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange', 'pink'];
const SHAPE_KEYS = ['circle', 'square', 'triangle', 'star', 'heart'];
const CATS = {
  homes: [
    { key: 'farm', icon: '🚜', name: 'the farm', items: [['🐮', 'cow'], ['🐷', 'pig'], ['🐑', 'sheep'], ['🐔', 'chicken'], ['🐴', 'horse']] },
    { key: 'sea', icon: '🌊', name: 'the sea', items: [['🐟', 'fish'], ['🐙', 'octopus'], ['🦀', 'crab'], ['🐳', 'whale'], ['🐬', 'dolphin']] },
    { key: 'sky', icon: '☁️', name: 'the sky', items: [['🐦', 'bird'], ['🦋', 'butterfly'], ['🐝', 'bee'], ['🦉', 'owl'], ['🦅', 'eagle']] },
  ],
  eatPlay: [
    { key: 'eat', icon: '🍽️', name: 'things we eat', items: [['🍎', 'apple'], ['🍌', 'banana'], ['🧀', 'cheese'], ['🍞', 'bread'], ['🥕', 'carrot']] },
    { key: 'play', icon: '🧸', name: 'things we play with', items: [['⚽', 'ball'], ['🧸', 'teddy'], ['🪁', 'kite'], ['🎈', 'balloon'], ['🪀', 'yo-yo']] },
  ],
  food: [
    { key: 'fruit', icon: '🍎', name: 'fruit', items: [['🍌', 'banana'], ['🍇', 'grapes'], ['🍓', 'strawberry'], ['🍐', 'pear'], ['🍉', 'watermelon']] },
    { key: 'veg', icon: '🥕', name: 'vegetables', items: [['🥦', 'broccoli'], ['🌽', 'corn'], ['🥒', 'cucumber'], ['🍅', 'tomato'], ['🥔', 'potato']] },
    { key: 'treat', icon: '🍰', name: 'treats', items: [['🍪', 'cookie'], ['🍭', 'lolly'], ['🍩', 'doughnut'], ['🧁', 'cupcake'], ['🍫', 'chocolate']] },
  ],
  go: [
    { key: 'road', icon: '🛣️', name: 'the road', items: [['🚗', 'car'], ['🚌', 'bus'], ['🚚', 'truck'], ['🚲', 'bicycle']] },
    { key: 'water', icon: '🌊', name: 'the water', items: [['🚢', 'ship'], ['⛵', 'sailboat'], ['🚤', 'speedboat'], ['🛶', 'canoe']] },
    { key: 'air', icon: '☁️', name: 'the air', items: [['✈️', 'aeroplane'], ['🚁', 'helicopter'], ['🎈', 'balloon'], ['🚀', 'rocket']] },
  ],
};

// Level kinds: color/shape [buckets, items] · size [2|3, items] · combo [colours, shapes, items] · cat [set, items]
//              numbers [rule, items] · pattern [type]
const LITTLE = [
  ['color', 2, 4], ['shape', 2, 4], ['color', 3, 5], ['size', 2, 4], ['shape', 3, 5],
  ['pattern', 'ABcol'], ['cat', 'eatPlay', 6], ['color', 3, 6], ['shape', 3, 6], ['pattern', 'ABshape'],
  ['size', 2, 6], ['cat', 'homes', 6], ['color', 4, 6], ['pattern', 'ABB'], ['shape', 4, 7],
  ['cat', 'go', 6], ['color', 4, 8], ['pattern', 'ABC'], ['size', 3, 6], ['color', 5, 9],
];
const BIG = [
  ['color', 3, 6], ['shape', 3, 6], ['color', 4, 7], ['shape', 4, 7], ['pattern', 'ABcol'],
  ['size', 3, 6], ['cat', 'homes', 8], ['combo', 2, 2, 8], ['numbers', 'oddEven', 8], ['pattern', 'ABB'],
  ['shape', 5, 8], ['numbers', 'smallBig', 8], ['combo', 2, 2, 10], ['pattern', 'ABC'], ['cat', 'food', 9],
  ['color', 6, 10], ['pattern', 'skip'], ['combo', 3, 2, 10], ['pattern', 'grow'], ['combo', 3, 2, 12],
];

export function shapeSVG(shape, fill, { stroke = '#2B2140', sw = 6, dash = '' } = {}) {
  const a = `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ''}`;
  const p = {
    circle: `<circle cx="50" cy="50" r="40" ${a}/>`,
    square: `<rect x="12" y="12" width="76" height="76" rx="10" ${a}/>`,
    triangle: `<path d="M50 10 L91 86 L9 86 Z" ${a}/>`,
    star: `<path d="M50 6 L62 37 L95 38 L69 58 L79 91 L50 72 L21 91 L31 58 L5 38 L38 37 Z" ${a}/>`,
    heart: `<path d="M50 88 C10 62 4 38 18 22 C30 9 46 14 50 28 C54 14 70 9 82 22 C96 38 90 62 50 88 Z" ${a}/>`,
  }[shape];
  return `<svg viewBox="0 0 100 100" style="width:100%;height:100%;overflow:visible">${p}</svg>`;
}

function bucketSVG(fill) {
  return `<svg viewBox="0 0 120 100" style="width:100%;height:100%"><path d="M8 18 H112 L100 92 Q98 98 92 98 H28 Q22 98 20 92 Z" fill="${fill}" stroke="#2B2140" stroke-width="5" stroke-linejoin="round"/><rect x="4" y="10" width="112" height="14" rx="7" fill="${fill}" stroke="#2B2140" stroke-width="5"/></svg>`;
}
const SIZE_NAMES = { 2: ['small', 'big'], 3: ['small', 'medium', 'big'] };
const SIZE_SCALE = { small: 0.5, medium: 0.75, big: 1 };

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const lv = Math.min(ctx.level, 20);
  const L = (little ? LITTLE : BIG)[lv - 1];
  const kind = L[0];
  if (kind === 'pattern') return patterns(ctx, L[1], little);
  const rounds = 2;
  let round = 0, mistakes = 0, selected = null, missesOnItem = 0;
  ctx.dots(rounds);

  stage.innerHTML = `
    <div class="prompt"></div>
    <div class="pile" style="flex:1;width:100%;display:flex;flex-wrap:wrap;gap:14px;align-content:center;justify-content:center;align-items:center;padding:6px"></div>
    <div class="buckets" style="display:flex;gap:clamp(8px,2.4vw,26px);justify-content:center;flex-wrap:wrap;width:100%;padding-bottom:6px"></div>`;
  const promptEl = stage.querySelector('.prompt');
  const pile = stage.querySelector('.pile');
  const bucketsEl = stage.querySelector('.buckets');
  let buckets = [], left = 0, announced = new Set(), itemCount = 0;

  /* Build a round: list of buckets {key, html, name} and items {key, html, name, scale}. */
  function design() {
    const items = [];
    let bs = [], title = '', speak = '';
    if (kind === 'color' || kind === 'shape') {
      const byColor = kind === 'color';
      const keys = shuffle(byColor ? COLOR_KEYS : SHAPE_KEYS).slice(0, L[1]);
      bs = keys.map(k => byColor
        ? { key: k, name: `the ${COLORS[k].en} bucket`, html: bucketSVG(COLORS[k].hex) }
        : { key: k, name: `the ${SHAPES[k].en} bucket`, html: bucketSVG('#FFFFFF') + `<div style="position:absolute;left:30%;top:32%;width:40%;height:46%">${shapeSVG(k, '#E9E4F2', { sw: 5, dash: '8 6' })}</div>` });
      for (let i = 0; i < L[2]; i++) {
        const k = keys[i % keys.length];
        const color = byColor ? k : pick(COLOR_KEYS), shape = byColor ? pick(SHAPE_KEYS) : k;
        items.push({ key: k, name: byColor ? COLORS[color].en : SHAPES[shape].en, html: shapeSVG(shape, COLORS[color].hex) });
      }
      title = byColor ? 'Sort by colour!' : 'Sort by shape!';
      speak = byColor ? 'Put each one in the bucket with the same colour!' : 'Put each shape in the matching bucket!';
    } else if (kind === 'size') {
      const names = SIZE_NAMES[L[1]];
      bs = names.map(n => ({ key: n, name: `the ${n} bucket`, html: bucketSVG('#FFFFFF') + `<div style="position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);width:${SIZE_SCALE[n] * 46}%;aspect-ratio:1;border-radius:50%;background:#C9C2D6"></div>` }));
      const shape = pick(SHAPE_KEYS);
      for (let i = 0; i < L[2]; i++) {
        const n = names[i % names.length];
        items.push({ key: n, name: n, scale: SIZE_SCALE[n], html: shapeSVG(shape, COLORS[pick(COLOR_KEYS)].hex) });
      }
      title = 'Sort by size!'; speak = L[1] === 3 ? 'Put the small, medium and big ones in the right buckets!' : 'Put the big ones and the small ones in the right buckets!';
    } else if (kind === 'combo') {
      const cs = shuffle(COLOR_KEYS).slice(0, L[1]), ss = shuffle(SHAPE_KEYS).slice(0, L[2]);
      for (const c of cs) for (const s of ss) bs.push({ key: c + s, name: `${COLORS[c].en} ${SHAPES[s].en}s`, html: bucketSVG('#FFFFFF') + `<div style="position:absolute;left:30%;top:30%;width:40%;height:50%">${shapeSVG(s, COLORS[c].hex, { sw: 5 })}</div>` });
      for (let i = 0; i < L[3]; i++) {
        const b = bs[i % bs.length];
        const c = cs.find(x => b.key.startsWith(x)), s = b.key.slice(c.length);
        items.push({ key: b.key, name: `${COLORS[c].en} ${SHAPES[s].en}`, html: shapeSVG(s, COLORS[c].hex) });
      }
      title = 'Colour AND shape!'; speak = 'Look at the colour and the shape. Put each one in its matching bucket!';
    } else if (kind === 'cat') {
      const groups = CATS[L[1]];
      bs = groups.map(gr => ({ key: gr.key, name: gr.name, html: bucketSVG('#FFFFFF') + `<div style="position:absolute;left:0;right:0;top:34%;text-align:center;font-size:clamp(30px,5vw,46px)">${gr.icon}</div>` }));
      const pool = shuffle(groups.flatMap(gr => gr.items.map(([e, n]) => ({ key: gr.key, name: n, html: `<div style="font-size:clamp(54px,8.5vw,80px);line-height:1;text-align:center">${e}</div>` }))));
      for (const gr of groups) items.push(pool.find(x => x.key === gr.key));
      for (const it of pool) if (items.length < L[2] && !items.includes(it)) items.push(it);
      title = { homes: 'Where do they live?', eatPlay: 'Eat or play?', food: 'Fruit, vegetables or treats?', go: 'Road, water or air?' }[L[1]];
      speak = { homes: 'Does it live on the farm, in the sea, or in the sky?', eatPlay: 'Do we eat it, or play with it?', food: 'Is it a fruit, a vegetable, or a treat?', go: 'Does it go on the road, on the water, or in the air?' }[L[1]];
    } else if (kind === 'numbers') {
      const rule = L[1];
      bs = rule === 'oddEven'
        ? [{ key: 'odd', name: 'odd numbers', html: bucketSVG('#FFE9C2') + '<div class="blabel">odd<br>1 3 5</div>' }, { key: 'even', name: 'even numbers', html: bucketSVG('#D7F2FF') + '<div class="blabel">even<br>2 4 6</div>' }]
        : [{ key: 'small', name: 'less than 10', html: bucketSVG('#FFE9C2') + '<div class="blabel">1 – 9</div>' }, { key: 'big', name: '10 or more', html: bucketSVG('#D7F2FF') + '<div class="blabel">10 – 20</div>' }];
      const nums = shuffle(Array.from({ length: 20 }, (_, i) => i + 1));
      const keyOf = n => rule === 'oddEven' ? (n % 2 ? 'odd' : 'even') : (n < 10 ? 'small' : 'big');
      for (const k of bs.map(b => b.key)) items.push(nums.find(n => keyOf(n) === k));
      for (const n of nums) if (items.length < L[2] && !items.includes(n)) items.push(n);
      items.forEach((n, i) => { items[i] = { key: keyOf(n), name: String(n), html: `<div style="width:100%;height:100%;border-radius:22px;background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.12);display:grid;place-items:center;font-size:clamp(38px,6vw,56px);color:#2B2140">${n}</div>` }; });
      title = rule === 'oddEven' ? 'Odd or even?' : 'Smaller or bigger than 10?';
      speak = rule === 'oddEven' ? 'Is the number odd, or even?' : 'Is the number less than 10, or 10 and more?';
    }
    return { bs, items, title, speak };
  }

  function newRound() {
    const d = design();
    buckets = d.bs;
    announced = new Set();
    bucketsEl.innerHTML = '';
    const bw = buckets.length > 4 ? 'clamp(84px,14vw,130px)' : 'clamp(100px,19vw,170px)';
    for (const bk of buckets) {
      const b = document.createElement('div');
      b.dataset.key = bk.key;
      b.style.cssText = `width:${bw};aspect-ratio:1.2;position:relative;border-radius:20px;transition:transform .2s`;
      b.innerHTML = bk.html;
      b._name = bk.name;
      b.addEventListener('pointerup', () => { if (selected) drop(selected, b); });
      bucketsEl.appendChild(b);
    }
    bucketsEl.querySelectorAll('.blabel').forEach(x => { x.style.cssText = 'position:absolute;left:0;right:0;top:34%;text-align:center;font-size:clamp(14px,2.2vw,20px);line-height:1.15;color:#2B2140'; });
    pile.innerHTML = '';
    left = d.items.length; itemCount = left;
    shuffle(d.items).forEach(addItem);
    promptEl.textContent = d.title;
    ctx.instruct(d.speak);
  }

  function addItem(it) {
    const d = document.createElement('div');
    const base = itemCount > 8 ? 'clamp(64px,10vw,100px)' : 'clamp(72px,12vw,116px)';
    const sc = it.scale || 1;
    d.style.cssText = `width:calc(${base} * ${sc});aspect-ratio:1;touch-action:none;cursor:grab;transition:transform .15s;position:relative;z-index:2`;
    d.innerHTML = it.html;
    d._it = it;
    let sx = 0, sy = 0, dragging = false, moved = false;
    d.addEventListener('pointerdown', e => {
      e.preventDefault();
      d.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; dragging = true; moved = false;
      d.style.transition = 'none'; d.style.zIndex = 20;
      if (selected && selected !== d) unselect();
      ctx.sfx.tap();
      ctx.say(it.name);
    });
    d.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 12) moved = true;
      d.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
    });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      d.style.transition = 'transform .25s';
      if (!moved) { d.style.transform = ''; select(d); return; }
      const target = bucketAt(e.clientX, e.clientY);
      if (target) drop(d, target);
      else { d.style.transform = ''; d.style.zIndex = 2; }
    };
    d.addEventListener('pointerup', end);
    d.addEventListener('pointercancel', end);
    pile.appendChild(d);
  }

  function select(d) { selected = d; d.style.transform = 'translateY(-14px) scale(1.18)'; d.style.filter = 'drop-shadow(0 10px 0 rgba(0,0,0,.15))'; }
  function unselect() { if (!selected) return; selected.style.transform = ''; selected.style.filter = ''; selected.style.zIndex = 2; selected = null; }

  // Forgiving hit test: the nearest bucket counts if the finger is anywhere near it.
  function bucketAt(x, y) {
    let best = null, bd = Infinity;
    for (const b of bucketsEl.children) {
      const r = b.getBoundingClientRect();
      const cx = Math.max(r.left, Math.min(x, r.right)), cy = Math.max(r.top, Math.min(y, r.bottom));
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < bd) { bd = dist; best = b; }
    }
    return bd < 90 ? best : null;
  }

  function drop(d, bucket) {
    const it = d._it;
    if (bucket.dataset.key === it.key) {
      selected = null;
      missesOnItem = 0;
      [...bucketsEl.children].forEach(b => b.classList.remove('hint'));
      const br = bucket.getBoundingClientRect(), dr = d.getBoundingClientRect();
      const cur = new DOMMatrix(getComputedStyle(d).transform);
      d.style.transition = 'transform .35s ease-in, opacity .35s';
      d.style.transform = `translate(${cur.m41 + br.left + br.width / 2 - dr.left - dr.width / 2}px, ${cur.m42 + br.top + br.height * .4 - dr.top - dr.height / 2}px) scale(.3)`;
      d.style.opacity = '0';
      d._gone = true;
      ctx.right(bucket);
      if (!announced.has(it.key)) { announced.add(it.key); ctx.say(`${it.name}!`); }
      setTimeout(() => d.remove(), 360);
      left--;
      if (left === 0) {
        round++;
        ctx.progress(round);
        ctx.later(() => {
          if (round >= rounds) ctx.finish(little ? 3 : mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1);
          else { ctx.say(pick(['All sorted!', 'Brilliant sorting!', 'Well done!'])); ctx.later(newRound, 1300); }
        }, 900);
      }
    } else {
      mistakes++; missesOnItem++;
      unselect();
      d.style.transform = ''; d.style.zIndex = 2;
      const right = [...bucketsEl.children].find(b => b.dataset.key === it.key);
      ctx.wrong(bucket, `Hmm, not that one. Where does the ${it.name} go?`);
      if (missesOnItem >= 2 && right) { right.classList.add('hint'); ctx.say(`It goes in ${right._name}!`); }
    }
  }

  newRound();
  return () => {};
}

/* ---------- "What comes next?" pattern levels ---------- */
function patterns(ctx, type, little) {
  const { stage } = ctx;
  const Q = 5;
  let q = 0, mistakes = 0, misses = 0, busy = false;
  ctx.dots(Q);
  stage.innerHTML = `<div class="prompt">What comes next?</div>
    <div class="row" style="display:flex;gap:clamp(6px,1.4vw,14px);align-items:center;justify-content:center;flex-wrap:wrap;margin:10px 0 24px"></div>
    <div class="opts" style="display:flex;gap:clamp(14px,3vw,30px);justify-content:center"></div>`;
  const row = stage.querySelector('.row'), opts = stage.querySelector('.opts');
  const cell = 'clamp(56px,9vw,96px)';
  const shapeBox = (s, c) => `<div style="width:${cell};height:${cell}">${shapeSVG(s, COLORS[c].hex)}</div>`;
  const numBox = n => `<div style="width:${cell};height:${cell};border-radius:18px;background:#fff;box-shadow:0 4px 0 rgba(0,0,0,.1);display:grid;place-items:center;font-size:clamp(28px,4.4vw,46px)">${n}</div>`;

  function makeQ() {
    // Returns { cells: [html], answer: html, wrong: [html], say }
    if (type === 'skip' || type === 'grow') {
      const step = type === 'skip' ? pick([2, 5, 10]) : pick([1, 2, 3]);
      const start = type === 'skip' ? step * (1 + ((Math.random() * 3) | 0)) : 1 + ((Math.random() * 5) | 0);
      const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
      const ans = seq.pop();
      const wrong = shuffle([ans + step, ans - 1, ans + 1, ans - step].filter(x => x !== ans && x > 0)).slice(0, 2);
      return { cells: seq.map(numBox), answer: ans, wrong, render: numBox, say: `Counting in ${step}s. What comes next?` };
    }
    const unit = type === 'ABB' ? [0, 1, 1] : type === 'ABC' ? [0, 1, 2] : [0, 1];
    const n = unit.length === 2 ? 2 : 3;
    const useColor = type === 'ABcol' || (type !== 'ABshape' && Math.random() < .5);
    const shape = pick(SHAPE_KEYS), color = pick(COLOR_KEYS);
    const vals = shuffle(useColor ? COLOR_KEYS : SHAPE_KEYS).slice(0, n);
    const len = unit.length * 2 + (unit.length === 2 ? 1 : 0);
    const seqIdx = Array.from({ length: len + 1 }, (_, i) => unit[i % unit.length]);
    const ansIdx = seqIdx.pop();
    const render = v => useColor ? shapeBox(shape, v) : shapeBox(v, color);
    const answer = vals[ansIdx];
    const pool = (useColor ? COLOR_KEYS : SHAPE_KEYS).filter(v => v !== answer);
    const wrong = shuffle([...vals.filter(v => v !== answer), ...shuffle(pool)]).filter((v, i, a) => a.indexOf(v) === i && v !== answer).slice(0, 2);
    return { cells: seqIdx.map(i => render(vals[i])), answer, wrong, render, say: little ? 'Look at the pattern. What comes next?' : 'What comes next in the pattern?' };
  }

  function show() {
    busy = false; misses = 0;
    const p = makeQ();
    row.innerHTML = p.cells.join('') + `<div class="slot" style="width:${cell};height:${cell};border-radius:18px;border:4px dashed #C9C2D6;display:grid;place-items:center;font-size:40px;color:#C9C2D6">?</div>`;
    opts.innerHTML = '';
    shuffle([p.answer, ...p.wrong]).forEach(v => {
      const b = document.createElement('button');
      b.style.cssText = 'padding:12px;border-radius:24px;background:#fff;box-shadow:var(--shadow)';
      b.innerHTML = p.render(v);
      b._ok = v === p.answer;
      b.onclick = () => {
        if (busy) return;
        if (b._ok) {
          busy = true; q++;
          row.querySelector('.slot').outerHTML = p.render(v);
          ctx.right(b); ctx.progress(q);
          ctx.say(pick(['Yes!', 'That\'s right!', 'Brilliant!', 'Perfect pattern!']));
          ctx.later(() => q >= Q ? ctx.finish(little ? 3 : mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1) : show(), 1600);
        } else {
          mistakes++; misses++;
          ctx.wrong(b, 'Look at the pattern again!');
          if (misses >= 2) [...opts.children].find(x => x._ok)?.classList.add('hint');
        }
      };
      opts.appendChild(b);
    });
    ctx.instruct(p.say);
  }
  show();
  return () => {};
}
