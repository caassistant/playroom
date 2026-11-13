// Word Builder: see (or hear) the word, tap the letters in order to spell it.
// 30 levels: short-vowel CVC words by vowel → blends → sh/ch/th → long vowels → sight words
// → 5- and 6-letter words → "listen only" spelling. Hints fade out and extra letters grow.
import { shuffle, pick } from '../words.js';

// Picture for every word (emoji are built into the tablet).
const PIC = {
  cat: '🐱', hat: '🎩', bat: '🦇', map: '🗺️', van: '🚐', can: '🥫', rat: '🐀', bag: '👜', cap: '🧢', pan: '🍳', ant: '🐜',
  bed: '🛏️', hen: '🐔', pen: '🖊️', net: '🥅', web: '🕸️', leg: '🦵', jet: '✈️', ten: '🔟', egg: '🥚', red: '🔴',
  pig: '🐷', bin: '🗑️', pin: '📌', lip: '👄', zip: '🤐', six: '6️⃣', kid: '🧒',
  dog: '🐶', fox: '🦊', box: '📦', pot: '🍲', log: '🪵', hot: '🔥', mop: '🧹',
  bus: '🚌', sun: '☀️', cup: '☕', bug: '🐛', nut: '🥜', hut: '🛖', tub: '🛁',
  frog: '🐸', crab: '🦀', drum: '🥁', flag: '🚩', sled: '🛷', swan: '🦢', star: '⭐', clap: '👏', plug: '🔌', slide: '🛝',
  ship: '🚢', fish: '🐟', shell: '🐚', shoe: '👟', sheep: '🐑', brush: '🖌️',
  chick: '🐤', chair: '🪑', cheese: '🧀', cherry: '🍒', bath: '🛁', three: '3️⃣', thumb: '👍', tooth: '🦷', moth: '🦋',
  cake: '🎂', kite: '🪁', bike: '🚲', rose: '🌹', bone: '🦴', nose: '👃', tree: '🌳', bee: '🐝', feet: '🦶', moon: '🌙',
  seal: '🦭', boat: '⛵', goat: '🐐', rain: '🌧️', snail: '🐌', train: '🚆', snow: '❄️', queen: '👸',
  horse: '🐴', snake: '🐍', zebra: '🦓', mouse: '🐭', tiger: '🐯', camel: '🐫', whale: '🐳', koala: '🐨',
  apple: '🍎', house: '🏠', clock: '🕐', pizza: '🍕', lemon: '🍋', heart: '❤️', bread: '🍞', plant: '🪴', truck: '🚚', cloud: '☁️',
  rabbit: '🐰', monkey: '🐵', turtle: '🐢', spider: '🕷️', parrot: '🦜', donkey: '🫏', lizard: '🦎',
  carrot: '🥕', banana: '🍌', rocket: '🚀', flower: '🌸', pencil: '✏️', castle: '🏰', candle: '🕯️', orange: '🍊', school: '🏫',
};
const S = (...w) => w;
// [words, hint ('all' | 'first' | 'none'), extra letters, listen-only?, theme]
const LEVELS = [
  [S('cat', 'hat', 'bat', 'map', 'van', 'can', 'rat', 'bag', 'cap', 'pan'), 'all', 0, false, 'Short a words'],
  [S('bed', 'hen', 'pen', 'net', 'web', 'leg', 'jet', 'ten', 'red'), 'all', 0, false, 'Short e words'],
  [S('pig', 'bin', 'pin', 'lip', 'zip', 'six', 'kid'), 'all', 0, false, 'Short i words'],
  [S('dog', 'fox', 'box', 'pot', 'log', 'hot', 'mop'), 'all', 0, false, 'Short o words'],
  [S('bus', 'sun', 'cup', 'bug', 'nut', 'hut', 'tub'), 'all', 0, false, 'Short u words'],
  [S('cat', 'bed', 'pig', 'dog', 'bus', 'hen', 'fox', 'sun', 'map', 'lip'), 'first', 0, false, 'Mixed short words'],
  [S('hat', 'bat', 'van', 'pen', 'net', 'web', 'jet', 'ant'), 'none', 1, false, 'Short a and e'],
  [S('pin', 'zip', 'box', 'pot', 'log', 'bug', 'nut', 'tub'), 'none', 1, false, 'Short i, o and u'],
  [S('cap', 'leg', 'six', 'mop', 'hut', 'rat', 'ten', 'kid', 'cup'), 'none', 2, false, 'Short word mix'],
  [S('frog', 'crab', 'drum', 'flag', 'star', 'clap', 'swan'), 'first', 0, false, 'Blends'],
  [S('sled', 'plug', 'frog', 'crab', 'swan', 'flag', 'drum'), 'none', 2, false, 'More blends'],
  [S('ship', 'fish', 'shell', 'shoe', 'sheep', 'brush'), 'first', 1, false, 'The sh sound'],
  [S('chick', 'chair', 'bath', 'three', 'thumb', 'tooth', 'moth'), 'first', 1, false, 'The ch and th sounds'],
  [S('ship', 'fish', 'chick', 'bath', 'shell', 'thumb', 'chair'), 'none', 2, false, 'sh, ch and th'],
  [S('cake', 'kite', 'bike', 'rose', 'bone', 'nose'), 'first', 1, false, 'Magic e'],
  [S('tree', 'bee', 'feet', 'moon', 'seal', 'queen'), 'first', 1, false, 'ee, ea and oo'],
  [S('boat', 'goat', 'rain', 'snail', 'train', 'snow'), 'first', 1, false, 'oa, ai and ow'],
  [S('cake', 'tree', 'boat', 'kite', 'moon', 'rain', 'bone', 'feet'), 'none', 2, false, 'Long vowel mix'],
  [S('the', 'and', 'see', 'go', 'my', 'you', 'is', 'it'), 'first', 1, true, 'Sight words'],
  [S('horse', 'snake', 'zebra', 'mouse', 'tiger', 'camel', 'whale', 'koala'), 'first', 1, false, 'Five-letter animals'],
  [S('apple', 'house', 'clock', 'pizza', 'lemon', 'heart', 'bread', 'plant'), 'first', 2, false, 'Five-letter things'],
  [S('said', 'was', 'are', 'they', 'like', 'come', 'here', 'she'), 'none', 1, true, 'More sight words'],
  [S('truck', 'cloud', 'chick', 'sheep', 'snail', 'tiger', 'heart', 'queen'), 'none', 3, false, 'Five-letter mix'],
  [S('rabbit', 'monkey', 'turtle', 'spider', 'parrot', 'donkey', 'lizard'), 'first', 2, false, 'Six-letter animals'],
  [S('carrot', 'banana', 'rocket', 'flower', 'pencil', 'castle', 'candle', 'orange', 'cherry', 'cheese'), 'first', 2, false, 'Six-letter things'],
  [S('have', 'what', 'where', 'there', 'some', 'little', 'want', 'were'), 'none', 2, true, 'Tricky words'],
  [S('school', 'rocket', 'monkey', 'zebra', 'pizza', 'castle', 'spider', 'whale'), 'none', 3, false, 'Big word mix'],
  [S('frog', 'ship', 'cake', 'tree', 'goat', 'drum', 'moth', 'nose'), 'none', 2, true, 'Listen and spell'],
  [S('horse', 'clock', 'train', 'snake', 'lemon', 'bread', 'cloud', 'plant'), 'none', 3, true, 'Listen and spell harder'],
  [S('rabbit', 'carrot', 'flower', 'turtle', 'pencil', 'banana', 'candle', 'parrot'), 'none', 4, true, 'Spelling champion'],
];
const ABC = 'abcdefghijklmnopqrstuvwxyz';

export default function start(ctx) {
  const { stage } = ctx;
  const L = LEVELS[Math.min(ctx.level, LEVELS.length) - 1];
  const [list, hint, extras, listen, theme] = L;
  const words = shuffle(list).slice(0, 5);
  let idx = 0, mistakes = 0;
  ctx.dots(words.length);

  stage.innerHTML = `
    <div style="font-size:clamp(16px,2.4vw,22px);color:var(--ink-soft)">${theme}</div>
    <button class="pic" style="font-size:clamp(80px,15vh,150px);line-height:1.1;filter:drop-shadow(0 6px 0 rgba(0,0,0,.1))"></button>
    <div class="slots" style="display:flex;gap:clamp(6px,1.4vw,12px);margin:10px 0 18px"></div>
    <div class="tiles" style="display:flex;gap:clamp(8px,1.6vw,14px);flex-wrap:wrap;justify-content:center;max-width:820px"></div>`;
  const pic = stage.querySelector('.pic');
  const slots = stage.querySelector('.slots');
  const tiles = stage.querySelector('.tiles');
  pic.onclick = () => ctx.say(words[idx]);

  function next() {
    const w = words[idx];
    let pos = 0, missesHere = 0;
    pic.textContent = listen || !PIC[w] ? '👂' : PIC[w];
    ctx.bounce(pic);
    const n = w.length;
    const sw = n >= 6 ? 'clamp(48px,8vw,78px)' : 'clamp(58px,10vw,92px)';
    slots.innerHTML = [...w].map((ch, i) => `<div style="width:${sw};height:calc(${sw} * 1.18);border-radius:18px;background:#fff;
       box-shadow:inset 0 -5px 0 rgba(0,0,0,.08);display:grid;place-items:center;font-size:clamp(38px,6.5vw,66px);color:#C9C2D6">${hint === 'all' || (hint === 'first' && i === 0) ? ch : ''}</div>`).join('');
    let letters = [...w];
    const pool = ABC.split('').filter(c => !w.includes(c));
    for (let i = 0; i < extras; i++) letters.push(pick(pool));
    tiles.innerHTML = '';
    const tw = letters.length > 8 ? 'clamp(58px,8.5vw,86px)' : 'clamp(70px,10.5vw,100px)';
    shuffle(letters).forEach(ch => {
      const t = document.createElement('button');
      t.textContent = ch;
      t.style.cssText = `width:${tw};height:${tw};border-radius:22px;background:#3A86FF;color:#fff;font-size:clamp(40px,6.5vw,62px);
        box-shadow:0 6px 0 #2563C9;transition:transform .2s, opacity .2s`;
      t.onclick = () => {
        if (t._used) return;
        if (ch === w[pos]) {
          t._used = true;
          const slot = slots.children[pos];
          slot.textContent = ch; slot.style.color = '#2B2140'; slot.style.background = '#FFE9C2';
          ctx.bounce(slot);
          t.style.opacity = '0'; t.style.transform = 'scale(.5)';
          ctx.sfx.ding();
          ctx.say(ch.toUpperCase());
          pos++;
          [...tiles.children].forEach(x => x.classList.remove('hint'));
          missesHere = 0;
          if (pos === w.length) done(w);
        } else {
          mistakes++; missesHere++;
          ctx.wrong(t);
          if (missesHere >= 2) {
            const right = [...tiles.children].find(x => !x._used && x.textContent === w[pos]);
            right && right.classList.add('hint');
            ctx.say(`Look for ${w[pos].toUpperCase()}`);
          }
        }
      };
      tiles.appendChild(t);
    });
    ctx.instruct(listen ? `Listen! Spell the word: ${w}.` : `Spell ${w}!`);
  }

  function done(w) {
    idx++;
    ctx.progress(idx);
    if (PIC[w]) pic.textContent = PIC[w];
    ctx.right(slots);
    // Sound it out letter by letter, then the whole word.
    ctx.sayAll([[[...w].map(c => c.toUpperCase()).join(', ')], [`${w}!`]]);
    ctx.later(() => {
      if (idx >= words.length) ctx.finish(mistakes <= 1 ? 3 : mistakes <= 5 ? 2 : 1);
      else next();
    }, 3600);
  }

  next();
  return () => {};
}
