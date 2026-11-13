// Colouring book — 16 levels, each a new picture.
// Tap-to-fill (easy for little fingers) or free brush painting. Some levels are "copy the picture":
// colour it to match the little sample, and the level finishes by itself when it matches.
import { COLORS } from '../words.js';
import { pictureSVG } from '../characters.js';

const PALETTE = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white'];
const INK = '#2B2140';

// Local pictures: list of [region, sample colour, svg shape] plus optional decoration drawn on top.
function star12(cx, cy, r1, r2) {
  let d = '';
  for (let i = 0; i < 24; i++) { const a = -Math.PI / 2 + i * Math.PI / 12, r = i % 2 ? r2 : r1; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `; }
  return `<path d="${d}Z"/>`;
}
function band(R, r) { return `<path d="M${100 - R} 150 A${R} ${R} 0 0 1 ${100 + R} 150 L${100 + r} 150 A${r} ${r} 0 0 0 ${100 - r} 150 Z"/>`; }
const eyes = (x1, x2, y) => `<circle cx="${x1}" cy="${y}" r="5" fill="${INK}"/><circle cx="${x2}" cy="${y}" r="5" fill="${INK}"/>`;

const PICS = {
  apple: { name: 'an apple', parts: [
    ['stem', 'brown', '<rect x="95" y="26" width="10" height="34" rx="5"/>'],
    ['apple', 'red', '<path d="M100 60 C70 40 30 55 32 100 C34 150 70 185 100 172 C130 185 166 150 168 100 C170 55 130 40 100 60 Z"/>'],
    ['leaf', 'green', '<path d="M104 52 C110 30 132 22 150 26 C144 46 126 56 104 52 Z"/>'],
  ] },
  sun: { name: 'a happy sun', parts: [
    ['rays', 'orange', star12(100, 100, 92, 62)],
    ['face', 'yellow', '<circle cx="100" cy="100" r="52"/>'],
    ['cheeks', 'pink', '<circle cx="72" cy="112" r="9"/>'], ['cheeks', 'pink', '<circle cx="128" cy="112" r="9"/>'],
  ], deco: eyes(84, 116, 92) + `<path d="M82 118 Q100 134 118 118" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>` },
  icecream: { name: 'an ice cream', parts: [
    ['cone', 'orange', '<path d="M68 100 L132 100 L100 192 Z"/>'],
    ['bottom scoop', 'pink', '<circle cx="100" cy="92" r="38"/>'],
    ['top scoop', 'brown', '<circle cx="100" cy="52" r="30"/>'],
    ['cherry', 'red', '<circle cx="100" cy="18" r="11"/>'],
  ], deco: `<path d="M84 120 L116 120 M90 140 L110 140" stroke="${INK}" stroke-width="3"/>` },
  butterfly: { name: 'a butterfly', parts: [
    ['top wings', 'purple', '<ellipse cx="60" cy="72" rx="42" ry="48" transform="rotate(-20 60 72)"/>'],
    ['top wings', 'purple', '<ellipse cx="140" cy="72" rx="42" ry="48" transform="rotate(20 140 72)"/>'],
    ['bottom wings', 'pink', '<ellipse cx="70" cy="144" rx="30" ry="34" transform="rotate(25 70 144)"/>'],
    ['bottom wings', 'pink', '<ellipse cx="130" cy="144" rx="30" ry="34" transform="rotate(-25 130 144)"/>'],
    ['spots', 'yellow', '<circle cx="56" cy="70" r="13"/>'], ['spots', 'yellow', '<circle cx="144" cy="70" r="13"/>'],
    ['spots', 'yellow', '<circle cx="70" cy="146" r="9"/>'], ['spots', 'yellow', '<circle cx="130" cy="146" r="9"/>'],
    ['body', 'brown', '<ellipse cx="100" cy="108" rx="11" ry="60"/>'],
  ], deco: `<path d="M96 52 Q88 24 74 18 M104 52 Q112 24 126 18" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>` },
  car: { name: 'a car', parts: [
    ['body', 'red', '<path d="M18 132 Q18 106 44 104 L60 72 Q66 60 80 60 L128 60 Q142 60 150 72 L166 104 Q184 106 184 130 L184 148 L18 148 Z"/>'],
    ['windows', 'blue', '<path d="M70 100 L82 72 L102 72 L102 100 Z"/>'], ['windows', 'blue', '<path d="M110 100 L110 72 L130 72 Q138 72 142 80 L152 100 Z"/>'],
    ['wheels', 'black', '<circle cx="58" cy="150" r="24"/>'], ['wheels', 'black', '<circle cx="146" cy="150" r="24"/>'],
    ['hubcaps', 'white', '<circle cx="58" cy="150" r="10"/>'], ['hubcaps', 'white', '<circle cx="146" cy="150" r="10"/>'],
    ['light', 'yellow', '<circle cx="174" cy="120" r="8"/>'],
  ] },
  boat: { name: 'a sailing boat', parts: [
    ['sea', 'blue', '<path d="M0 168 Q25 156 50 168 T100 168 T150 168 T200 168 L200 205 L0 205 Z"/>'],
    ['hull', 'brown', '<path d="M28 138 L172 138 L150 172 L50 172 Z"/>'], ['hull', 'brown', '<rect x="96" y="24" width="8" height="114"/>'],
    ['big sail', 'yellow', '<path d="M108 36 L108 128 L166 128 Z"/>'],
    ['small sail', 'white', '<path d="M92 54 L92 128 L46 128 Z"/>'],
    ['flag', 'red', '<path d="M104 10 L134 18 L104 26 Z"/>'],
  ] },
  train: { name: 'a train', parts: [
    ['smoke', 'white', '<circle cx="52" cy="34" r="13"/>'], ['smoke', 'white', '<circle cx="72" cy="18" r="10"/>'],
    ['chimney', 'black', '<rect x="42" y="50" width="22" height="40" rx="4"/>'],
    ['engine', 'blue', '<rect x="26" y="88" width="94" height="58" rx="10"/>'],
    ['cab', 'red', '<rect x="112" y="58" width="64" height="88" rx="8"/>'],
    ['roof', 'yellow', '<rect x="104" y="44" width="80" height="16" rx="6"/>'],
    ['window', 'white', '<rect x="126" y="72" width="36" height="30" rx="6"/>'],
    ['wheels', 'black', '<circle cx="54" cy="156" r="19"/>'], ['wheels', 'black', '<circle cx="100" cy="156" r="19"/>'], ['wheels', 'black', '<circle cx="148" cy="156" r="19"/>'],
  ] },
  cupcake: { name: 'a cupcake', parts: [
    ['case', 'pink', '<path d="M50 118 L150 118 L136 188 L64 188 Z"/>'],
    ['icing', 'white', '<path d="M44 122 Q38 94 66 90 Q66 60 100 58 Q134 60 134 90 Q162 94 156 122 Z"/>'],
    ['sprinkles', 'blue', '<circle cx="74" cy="104" r="7"/>'], ['sprinkles', 'blue', '<circle cx="100" cy="88" r="7"/>'], ['sprinkles', 'blue', '<circle cx="126" cy="104" r="7"/>'], ['sprinkles', 'blue', '<circle cx="100" cy="112" r="7"/>'],
    ['cherry', 'red', '<circle cx="100" cy="46" r="14"/>'],
  ], deco: `<path d="M76 124 L82 186 M100 124 L100 186 M124 124 L118 186" stroke="${INK}" stroke-width="3"/>` },
  rainbow: { name: 'a rainbow', parts: [
    ['red stripe', 'red', band(92, 80)], ['orange stripe', 'orange', band(80, 68)], ['yellow stripe', 'yellow', band(68, 56)],
    ['green stripe', 'green', band(56, 44)], ['blue stripe', 'blue', band(44, 32)], ['purple stripe', 'purple', band(32, 20)],
    ['clouds', 'white', '<circle cx="14" cy="156" r="18"/>'], ['clouds', 'white', '<circle cx="36" cy="160" r="20"/>'],
    ['clouds', 'white', '<circle cx="164" cy="160" r="20"/>'], ['clouds', 'white', '<circle cx="186" cy="156" r="18"/>'],
  ] },
  castle: { name: 'a castle', parts: [
    ['grass', 'green', '<rect x="0" y="186" width="200" height="19"/>'],
    ['towers', 'blue', '<rect x="22" y="60" width="44" height="128"/>'], ['towers', 'blue', '<rect x="134" y="60" width="44" height="128"/>'],
    ['wall', 'purple', '<rect x="64" y="92" width="72" height="96"/>'],
    ['roofs', 'red', '<path d="M18 62 L44 18 L70 62 Z"/>'], ['roofs', 'red', '<path d="M130 62 L156 18 L182 62 Z"/>'],
    ['door', 'brown', '<path d="M84 188 L84 150 Q100 128 116 150 L116 188 Z"/>'],
    ['windows', 'yellow', '<rect x="34" y="90" width="20" height="26" rx="10"/>'], ['windows', 'yellow', '<rect x="146" y="90" width="20" height="26" rx="10"/>'], ['windows', 'yellow', '<circle cx="100" cy="114" r="12"/>'],
    ['flags', 'orange', '<path d="M44 18 L44 2 L64 8 L44 14 Z"/>'], ['flags', 'orange', '<path d="M156 18 L156 2 L176 8 L156 14 Z"/>'],
  ] },
};

function picSVG(id, sample = false) {
  const P = PICS[id];
  const body = P.parts.map(([region, col, shape]) => shape.replace('/>', sample
    ? ` fill="${COLORS[col].hex}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    : ` fill="#FFFFFF" class="region" data-region="${region}" data-want="${col}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)).join('');
  return `<svg viewBox="0 0 200 205" xmlns="http://www.w3.org/2000/svg">${body}${P.deco || ''}</svg>`;
}

// [picture, copy-the-sample for little, copy-the-sample for big]
const LEVELS = [
  ['apple', false, false], ['sun', false, true], ['fish', false, false], ['icecream', true, true],
  ['house', false, false], ['butterfly', false, true], ['car', false, true], ['boat', true, true],
  ['mango', false, false], ['flower', false, false], ['train', false, true], ['cupcake', true, true],
  ['tumble', false, false], ['rainbow', true, true], ['bo', false, false], ['castle', true, true],
];
const NAMES = { fish: 'a fish', house: 'a house', mango: 'Mango the cat', flower: 'a flower', tumble: 'Tumble the turtle', bo: 'Bo the robot' };

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const [id, mLittle, mBig] = LEVELS[Math.min(ctx.level, LEVELS.length) - 1];
  const local = !!PICS[id];
  const matchMode = local && (little ? mLittle : mBig);
  const name = local ? PICS[id].name : NAMES[id];
  ctx.hideMascot();
  ctx.dots(0);
  let color = 'red', tool = 'fill', wrongFills = 0, done = false;

  const portrait = innerHeight > innerWidth;
  stage.innerHTML = `
    <div class="cbook" style="display:flex;flex-direction:${portrait ? 'column' : 'row'};gap:14px;width:100%;flex:1;min-height:0;align-items:center;justify-content:center">
      <div class="paper" style="position:relative;background:#fff;border-radius:28px;box-shadow:var(--shadow);aspect-ratio:200/205;
           ${portrait ? 'width:min(92vw, 52vh)' : 'height:min(100%, 78vh)'};flex:none;touch-action:none;overflow:hidden">
        <div class="pic" style="position:absolute;inset:4%"></div>
        <canvas class="paint" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>
      </div>
      <div class="side" style="display:flex;flex-direction:${portrait ? 'row' : 'column'};flex-wrap:wrap;justify-content:center;gap:12px;align-items:center">
        ${matchMode ? `<div class="sample" style="width:${portrait ? 120 : 150}px;background:#fff;border-radius:20px;box-shadow:var(--shadow);padding:8px;text-align:center">
          <div style="font-size:14px;color:var(--ink-soft)">Copy me!</div>${picSVG(id, true)}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:12px;align-items:center">
          <div class="tools" style="display:flex;gap:10px">
            <button data-tool="fill" class="round-btn" aria-label="Fill">🪣</button>
            <button data-tool="brush" class="round-btn" aria-label="Brush">🖌️</button>
            <button class="round-btn clear" aria-label="Start again">🧽</button>
            <button class="round-btn done" aria-label="Finished" style="background:#3BB273;color:#fff">✓</button>
          </div>
          <div class="palette" style="display:grid;grid-template-columns:repeat(5, 58px);gap:10px"></div>
        </div>
      </div>
    </div>`;
  ctx.instruct(matchMode ? `Colour ${name} to look just like the little picture!` : `Let's colour ${name}! Pick a colour, then tap the picture.`);
  const pic = stage.querySelector('.pic');
  pic.innerHTML = local ? picSVG(id) : pictureSVG(id);
  const svg = pic.querySelector('svg');
  svg.style.cssText = 'width:100%;height:100%';
  const sampleSvg = stage.querySelector('.sample svg');
  if (sampleSvg) sampleSvg.style.cssText = 'width:100%;height:auto';
  const paper = stage.querySelector('.paper');
  const canvas = stage.querySelector('.paint');
  const g = canvas.getContext('2d');

  // Palette
  const pal = stage.querySelector('.palette');
  for (const k of PALETTE) {
    const b = document.createElement('button');
    b.dataset.c = k;
    b.style.cssText = `width:58px;height:58px;border-radius:50%;background:${COLORS[k].hex};border:4px solid #fff;box-shadow:0 3px 0 rgba(0,0,0,.15), 0 0 0 2px #ddd;transition:transform .15s`;
    b.onclick = () => { color = k; ctx.sfx.tap(); paintPalette(); ctx.say(COLORS[k].en); };
    pal.appendChild(b);
  }
  function paintPalette() {
    pal.querySelectorAll('button').forEach(b => b.style.transform = b.dataset.c === color ? 'scale(1.2)' : '');
    pal.querySelectorAll('button').forEach(b => b.style.boxShadow = b.dataset.c === color ? `0 0 0 4px ${INK}` : '0 3px 0 rgba(0,0,0,.15), 0 0 0 2px #ddd');
  }
  function paintTools() {
    stage.querySelectorAll('[data-tool]').forEach(b => b.style.background = b.dataset.tool === tool ? '#FFD23F' : '#fff');
    canvas.style.pointerEvents = tool === 'brush' ? 'auto' : 'none';
  }
  stage.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { tool = b.dataset.tool; ctx.sfx.tap(); paintTools(); ctx.say(tool === 'fill' ? 'Tap to fill!' : 'Paint with your finger!'); });
  paintPalette(); paintTools();

  // Fill tool. Regions with the same name fill together (both wheels, all windows…).
  const regions = [...svg.querySelectorAll('.region')];
  const groups = [...new Set(regions.map(r => r.dataset.region))];
  const filled = new Set();
  const groupEls = name => regions.filter(r => r.dataset.region === name);
  regions.forEach(r => r.addEventListener('pointerdown', e => {
    if (tool !== 'fill' || done) return;
    e.preventDefault();
    const grp = groupEls(r.dataset.region);
    grp.forEach(x => { x.setAttribute('fill', COLORS[color].hex); x.dataset.got = color; x.style.strokeDasharray = ''; x.setAttribute('stroke', INK); });
    ctx.sfx.pop();
    filled.add(r.dataset.region);
    if (matchMode) {
      if (r.dataset.want !== color) wrongFills++;
      checkMatch(false);
    } else if (filled.size === groups.length) stage.querySelector('.done').classList.add('hint');
  }));

  function mismatches() { return groups.filter(gn => { const el = groupEls(gn)[0]; return el.dataset.got !== el.dataset.want; }); }
  function checkMatch(pressed) {
    const bad = mismatches();
    if (!bad.length) {
      done = true;
      ctx.right(paper);
      ctx.say(`It matches! Beautiful ${name.replace(/^an? /, '')}!`);
      ctx.later(() => ctx.finish(little ? 3 : wrongFills <= 2 ? 3 : wrongFills <= 6 ? 2 : 1), 1800);
      return;
    }
    if (pressed || filled.size === groups.length) {
      // Show which parts are different.
      bad.forEach(gn => groupEls(gn).forEach(x => { x.setAttribute('stroke', '#FF4B4B'); x.style.strokeDasharray = '8 6'; }));
      const first = groupEls(bad[0])[0];
      ctx.say(`Almost! Look at the ${bad[0]}. What colour is it in the little picture?`);
      ctx.wobble(paper);
      void first;
    }
  }

  // Brush tool
  function size() {
    const r = paper.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  requestAnimationFrame(size);
  let drawing = false, lx = 0, ly = 0, strokes = 0;
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    const r = canvas.getBoundingClientRect();
    drawing = true; lx = e.clientX - r.left; ly = e.clientY - r.top; strokes++;
    dot(lx, ly);
  });
  canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    g.strokeStyle = COLORS[color].hex; g.lineWidth = Math.max(14, r.width / 30); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke();
    lx = x; ly = y;
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener('pointerup', stop); canvas.addEventListener('pointercancel', stop);
  function dot(x, y) { const r = canvas.getBoundingClientRect(); g.fillStyle = COLORS[color].hex; g.beginPath(); g.arc(x, y, Math.max(7, r.width / 60), 0, 7); g.fill(); }

  stage.querySelector('.clear').onclick = () => {
    ctx.sfx.whoosh();
    regions.forEach(r => { r.setAttribute('fill', '#FFFFFF'); delete r.dataset.got; r.setAttribute('stroke', INK); r.style.strokeDasharray = ''; });
    filled.clear();
    g.clearRect(0, 0, canvas.width, canvas.height);
  };
  stage.querySelector('.done').onclick = () => {
    ctx.sfx.tap();
    if (done) return;
    if (matchMode) { checkMatch(true); return; }
    // Colour at least half of the picture before finishing the level.
    if (filled.size < Math.ceil(groups.length / 2) && strokes < 4) { ctx.say('Colour a bit more first!'); ctx.wobble(paper); return; }
    done = true;
    ctx.say(`What a beautiful picture!`);
    ctx.finish(3);
  };
  return () => {};
}
