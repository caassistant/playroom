// Memory Match: flip two cards, find the pairs. Every card says its name out loud.
// 20 levels: more pairs and a new picture set each level. Big mode adds "match the two
// different cards" levels: number ↔ dots, capital ↔ small letter, word ↔ picture, sum ↔ answer.
import { shuffle } from '../words.js';

const SETS = {
  animals: [['🐱', 'cat'], ['🐶', 'dog'], ['🐮', 'cow'], ['🐷', 'pig'], ['🦆', 'duck'], ['🐸', 'frog'], ['🦁', 'lion'], ['🐟', 'fish'], ['🐻', 'bear'], ['🦊', 'fox'], ['🦉', 'owl'], ['🐵', 'monkey'], ['🐰', 'rabbit'], ['🐘', 'elephant'], ['🦒', 'giraffe'], ['🦓', 'zebra']],
  food: [['🍎', 'apple'], ['🍌', 'banana'], ['🍇', 'grapes'], ['🍐', 'pear'], ['🍓', 'strawberry'], ['🍉', 'watermelon'], ['🥕', 'carrot'], ['🧀', 'cheese'], ['🍞', 'bread'], ['🍕', 'pizza'], ['🎂', 'cake'], ['🍦', 'ice cream'], ['🥚', 'egg'], ['🌽', 'corn']],
  vehicles: [['🚗', 'car'], ['🚌', 'bus'], ['🚂', 'train'], ['✈️', 'aeroplane'], ['🚀', 'rocket'], ['🚢', 'ship'], ['🚲', 'bicycle'], ['🚁', 'helicopter'], ['🚒', 'fire engine'], ['🚜', 'tractor'], ['🚑', 'ambulance'], ['🛵', 'scooter']],
  nature: [['☀️', 'sun'], ['🌙', 'moon'], ['⭐', 'star'], ['🌈', 'rainbow'], ['☁️', 'cloud'], ['🌳', 'tree'], ['🌸', 'flower'], ['🍄', 'mushroom'], ['🐚', 'shell'], ['❄️', 'snowflake'], ['🌵', 'cactus'], ['🍁', 'leaf']],
  toys: [['⚽', 'ball'], ['🧸', 'teddy'], ['🪁', 'kite'], ['🎈', 'balloon'], ['🥁', 'drum'], ['🎨', 'paints'], ['🧩', 'puzzle'], ['🪀', 'yo-yo'], ['🎺', 'trumpet'], ['📚', 'books'], ['🛝', 'slide'], ['🎁', 'present']],
};
const COLORS = [['#FF4B4B', 'red'], ['#3A86FF', 'blue'], ['#FFD23F', 'yellow'], ['#3BB273', 'green'], ['#FF9F1C', 'orange'], ['#8E6CEF', 'purple'], ['#FF7EB6', 'pink'], ['#9A6237', 'brown']];
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'diamond'];
const BACKS = ['#FF9F1C', '#3A86FF', '#3BB273', '#8E6CEF', '#FF5A5F', '#2EC4B6'];
const SAY_N = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function shapeSVG(shape, fill) {
  const a = `fill="${fill}" stroke="#2B2140" stroke-width="6" stroke-linejoin="round"`;
  const p = {
    circle: `<circle cx="50" cy="50" r="40" ${a}/>`, square: `<rect x="12" y="12" width="76" height="76" rx="10" ${a}/>`,
    triangle: `<path d="M50 10 L91 86 L9 86 Z" ${a}/>`, star: `<path d="M50 6 L62 37 L95 38 L69 58 L79 91 L50 72 L21 91 L31 58 L5 38 L38 37 Z" ${a}/>`,
    heart: `<path d="M50 88 C10 62 4 38 18 22 C30 9 46 14 50 28 C54 14 70 9 82 22 C96 38 90 62 50 88 Z" ${a}/>`, diamond: `<path d="M50 6 L92 50 L50 94 L8 50 Z" ${a}/>`,
  }[shape];
  return `<svg viewBox="0 0 100 100" style="width:70%;height:70%">${p}</svg>`;
}
function dots(n) {
  const cols = n <= 3 ? n : n <= 4 ? 2 : n <= 6 ? 3 : 4;
  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8%;width:${cols * 20}%">${'<span style="aspect-ratio:1;border-radius:50%;background:#FF9F1C"></span>'.repeat(n)}</div>`;
}

// What to say when a pair is found, in proper English ("Two foxes!", "Two bunches of grapes!").
const TWO = {
  fish: 'Two fish', grapes: 'Two bunches of grapes', cheese: 'Two pieces of cheese', bread: 'Two loaves of bread',
  corn: 'Two corn cobs', 'ice cream': 'Two ice creams', strawberry: 'Two strawberries', leaf: 'Two leaves',
  cactus: 'Two cactuses', paints: 'Two paint boxes', books: 'Two piles of books', teddy: 'Two teddies', bus: 'Two buses',
  fox: 'Two foxes', 'fire engine': 'Two fire engines', 'yo-yo': 'Two yo-yos', watermelon: 'Two watermelons',
};
const two = n => (TWO[n] || `Two ${/(s|x|ch|sh)$/.test(n) ? n + 'es' : n + 's'}`) + '!';

// Build card pairs: each pair is [cardA, cardB] where card = { face, say, key, match }.
function same(list) { return list.map(([e, n]) => { const c = { face: `<span style="font-size:1em">${e}</span>`, say: n, key: n, match: two(n) }; return [c, c]; }); }
const MAKERS = {
  animals: n => same(shuffle(SETS.animals).slice(0, n)),
  food: n => same(shuffle(SETS.food).slice(0, n)),
  vehicles: n => same(shuffle(SETS.vehicles).slice(0, n)),
  nature: n => same(shuffle(SETS.nature).slice(0, n)),
  toys: n => same(shuffle(SETS.toys).slice(0, n)),
  mixed: n => same(shuffle([...SETS.animals, ...SETS.food, ...SETS.vehicles, ...SETS.nature, ...SETS.toys]).slice(0, n)),
  colours: n => shuffle(COLORS).slice(0, n).map(([hex, name]) => { const c = { face: `<span style="display:block;width:70%;aspect-ratio:1;border-radius:50%;background:${hex};border:4px solid #2B2140"></span>`, say: name, key: name, match: `Two ${name} ones!` }; return [c, c]; }),
  shapes: n => shuffle(SHAPES).slice(0, n).map((s, i) => { const c = { face: shapeSVG(s, COLORS[i % COLORS.length][0]), say: s, key: s, match: two(s) }; return [c, c]; }),
  dots: n => shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, n).map(k => { const c = { face: dots(k), say: `${SAY_N[k]} dot${k > 1 ? 's' : ''}`, key: 'd' + k, match: `Both have ${SAY_N[k]} dot${k > 1 ? 's' : ''}!` }; return [c, c]; }),
  numDots: n => shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, n).map(k => [
    { face: `<b style="font-size:.8em">${k}</b>`, say: SAY_N[k], key: 'n' + k }, { face: dots(k), say: SAY_N[k], key: 'n' + k }]),
  letters: n => shuffle('ABDEFGHLMNQRT'.split('')).slice(0, n).map(L => [
    { face: `<b style="font-size:.8em">${L}</b>`, say: `big ${L}`, key: L }, { face: `<b style="font-size:.8em;color:#3A86FF">${L.toLowerCase()}</b>`, say: `small ${L}`, key: L }]),
  words: n => shuffle([...SETS.animals, ...SETS.food].filter(([, w]) => w.length <= 6 && !w.includes(' '))).slice(0, n).map(([e, w]) => [
    { face: `<span>${e}</span>`, say: w, key: w }, { face: `<b style="font-size:.42em">${w}</b>`, say: w, key: w }]),
  sums: n => {
    const seen = new Set(), out = [];
    while (out.length < n) {
      const a = 1 + ((Math.random() * 9) | 0), b = 1 + ((Math.random() * (10 - a)) | 0);
      if (seen.has(a + b)) continue; seen.add(a + b);
      out.push([{ face: `<b style="font-size:.42em">${a} + ${b}</b>`, say: `${a} plus ${b}`, key: 's' + (a + b) }, { face: `<b style="font-size:.7em">${a + b}</b>`, say: String(a + b), key: 's' + (a + b) }]);
    }
    return out;
  },
};
const THEME = { animals: 'Animals', food: 'Food', vehicles: 'Things that go', nature: 'Nature', toys: 'Toys', mixed: 'Mixed pictures', colours: 'Colours', shapes: 'Shapes', dots: 'Dots', numDots: 'Numbers and dots', letters: 'Big and small letters', words: 'Words and pictures', sums: 'Sums and answers' };

// [set, pairs]
const LITTLE = [['animals', 2], ['animals', 3], ['food', 3], ['colours', 3], ['vehicles', 4], ['shapes', 4], ['animals', 4], ['nature', 4], ['dots', 3], ['toys', 5],
  ['food', 5], ['colours', 5], ['mixed', 5], ['dots', 4], ['vehicles', 6], ['shapes', 6], ['animals', 6], ['toys', 6], ['mixed', 7], ['mixed', 8]];
const BIG = [['animals', 6], ['food', 6], ['numDots', 5], ['vehicles', 7], ['letters', 6], ['nature', 8], ['words', 6], ['mixed', 8], ['sums', 6], ['toys', 9],
  ['numDots', 8], ['letters', 8], ['mixed', 10], ['words', 8], ['sums', 8], ['animals', 10], ['letters', 10], ['mixed', 11], ['words', 10], ['mixed', 12]];

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const [set, pairs] = (little ? LITTLE : BIG)[Math.min(ctx.level, 20) - 1];
  const deck = shuffle(MAKERS[set](pairs).flat());
  const back = BACKS[(Math.random() * BACKS.length) | 0];
  let open = [], matched = 0, moves = 0, lock = false;

  // Pick a grid that fills the space well.
  const n = deck.length;
  const W = stage.clientWidth || innerWidth, H = (stage.clientHeight || innerHeight - 100) - 120;
  let best = { cols: n, size: 0 };
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const size = Math.min((W - 20 - (cols - 1) * 12) / cols, (H - (rows - 1) * 12) / rows);
    if (size > best.size) best = { cols, size };
  }
  const size = Math.min(best.size, 190);

  stage.innerHTML = `<div class="prompt" style="font-size:clamp(22px,3.6vw,36px)">${THEME[set]}</div>
    <div class="grid" style="display:grid;grid-template-columns:repeat(${best.cols}, ${size}px);gap:12px;justify-content:center"></div>`;
  const grid = stage.querySelector('.grid');
  ctx.dots(0);
  const different = ['numDots', 'letters', 'words', 'sums'].includes(set);
  ctx.instruct(different ? `${THEME[set]}! Find two cards that go together.` : `${THEME[set]}! Find two cards that are the same.`);

  deck.forEach(card => {
    const c = document.createElement('button');
    c.style.cssText = `width:${size}px;height:${size}px;perspective:600px;position:relative`;
    c.innerHTML = `<div class="inner" style="position:absolute;inset:0;transition:transform .35s;transform-style:preserve-3d">
      <div style="position:absolute;inset:0;border-radius:${size * 0.13}px;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:${back};box-shadow:0 5px 0 rgba(0,0,0,.15);display:grid;place-items:center;font-size:${size * .4}px;color:rgba(255,255,255,.6)">★</div>
      <div style="position:absolute;inset:0;border-radius:${size * 0.13}px;backface-visibility:hidden;-webkit-backface-visibility:hidden;transform:rotateY(180deg);background:#fff;box-shadow:0 5px 0 rgba(0,0,0,.15);display:grid;place-items:center;font-size:${size * .58}px;color:#2B2140;overflow:hidden">${card.face}</div>
    </div>`;
    c._card = card;
    c._key = card.key;
    c.onclick = () => flip(c);
    grid.appendChild(c);
  });

  function setFace(c, up) { c.querySelector('.inner').style.transform = up ? 'rotateY(180deg)' : ''; c._up = up; }

  function flip(c) {
    if (lock || c._up || c._done) return;
    ctx.sfx.flip();
    setFace(c, true);
    ctx.say(c._card.say);
    open.push(c);
    if (open.length < 2) return;
    moves++;
    const [a, b] = open;
    open = [];
    if (a._key === b._key) {
      a._done = b._done = true;
      matched++;
      setTimeout(() => {
        ctx.right(b);
        ctx.sparkleAt(a, 20);
        ctx.say(different ? 'They go together!' : (a._card.match || 'A match!'));
        [a, b].forEach(x => x.querySelector('.inner').lastElementChild.style.boxShadow = '0 0 0 6px #FFD23F, 0 5px 0 rgba(0,0,0,.15)');
        if (matched === pairs) {
          const extra = moves - pairs;
          ctx.later(() => ctx.finish(little ? 3 : extra <= pairs * .6 ? 3 : extra <= pairs * 1.4 ? 2 : 1), 1600);
        }
      }, 450);
    } else {
      lock = true;
      setTimeout(() => { ctx.sfx.oops(); }, 500);
      setTimeout(() => { setFace(a, false); setFace(b, false); lock = false; }, 1300);
    }
  }
  return () => {};
}
