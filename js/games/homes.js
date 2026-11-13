// Animal Homes: drag each animal to the right group.
// Most levels sort animals by where they live (9 habitats). Other levels sort by how they move
// (fly / swim / walk), what they eat (plants / meat / both) or how babies start (eggs / milk).
// Every animal says its name and makes its sound; Big mode adds a fun fact (with South African favourites).
import { shuffle, pick } from '../words.js';

const HABITATS = {
  farm:   { name: 'the farm',   icon: '🚜', sky: 'linear-gradient(#BFE7FF 0 55%, #8ED47F 55%)', deco: '🏡 🌾 🌻' },
  ocean:  { name: 'the ocean',  icon: '🌊', sky: 'linear-gradient(#7FD3FF, #2E86DE)', deco: '🫧 🪸 🐚' },
  bush:   { name: 'the bush',   icon: '🌳', sky: 'linear-gradient(#FFE29A 0 55%, #E3B55B 55%)', deco: '🌳 🌵 ⛰️' },
  ice:    { name: 'the ice',    icon: '❄️', sky: 'linear-gradient(#DDF3FF 0 60%, #FFFFFF 60%)', deco: '🏔️ ❄️ 🧊' },
  desert: { name: 'the desert', icon: '🏜️', sky: 'linear-gradient(#FFE8B0 0 55%, #F2C46D 55%)', deco: '🌵 ☀️ 🌵' },
  garden: { name: 'the garden', icon: '🌷', sky: 'linear-gradient(#D7F5FF 0 50%, #A6E39A 50%)', deco: '🌸 🌼 🌿' },
  river:  { name: 'the river',  icon: '🏞️', sky: 'linear-gradient(#C9F0E4 0 45%, #6FC3DF 45%)', deco: '🪷 🌾 🪨' },
  jungle: { name: 'the jungle', icon: '🌴', sky: 'linear-gradient(#9FE3B0, #3E9E5C)', deco: '🌴 🍌 🌺' },
  forest: { name: 'the forest', icon: '🌲', sky: 'linear-gradient(#D9F0D0 0 45%, #7DB46C 45%)', deco: '🌲 🍄 🍂' },
};
// Other ways to sort.
const GROUPS = {
  move: {
    fly:  { name: 'fly',  icon: '🪽', bg: 'linear-gradient(#D6F0FF, #A9DBFF)', say: a => `${cap(pl(a))} can fly!` },
    swim: { name: 'swim', icon: '🌊', bg: 'linear-gradient(#7FD3FF, #2E86DE)', say: a => `${cap(pl(a))} swim!` },
    walk: { name: 'walk', icon: '🐾', bg: 'linear-gradient(#E9F7D9, #B6DE96)', say: a => `${cap(pl(a))} walk on legs!` },
  },
  eat: {
    plants: { name: 'plants', icon: '🥬', bg: 'linear-gradient(#E3F9D6, #9FD98A)', say: a => `${cap(pl(a))} eat plants!` },
    meat:   { name: 'meat',   icon: '🍖', bg: 'linear-gradient(#FFE1D6, #FFB199)', say: a => `${cap(pl(a))} eat meat!` },
    both:   { name: 'both',   icon: '🍽️', bg: 'linear-gradient(#FFF4C7, #FFD978)', say: a => `${cap(pl(a))} eat plants and meat!` },
  },
  egg: {
    egg:  { name: 'eggs', icon: '🥚', bg: 'linear-gradient(#FFF8E6, #FFE3A3)', say: a => `Baby ${pl(a)} hatch from eggs!` },
    milk: { name: 'milk', icon: '🍼', bg: 'linear-gradient(#F3EEFF, #D8CCFF)', say: a => `Baby ${pl(a)} drink milk from their mum!` },
  },
};
const PLURAL = { sheep: 'sheep', fish: 'fish', deer: 'deer', octopus: 'octopuses', fox: 'foxes', butterfly: 'butterflies', 'polar bear': 'polar bears' };
const pl = a => PLURAL[a.n] || a.n + 's';
const cap = s => s[0].toUpperCase() + s.slice(1);

// mv: fly / swim / walk (null = it does more than one, left out of "move" levels)
// eat: plants / meat / both · egg: true (hatch from eggs) / false (drink milk) / null (left out)
const A = (e, n, h, s, f, mv, eat, egg) => ({ e, n, h, s, f, mv, eat, egg });
const ANIMALS = [
  A('🐮', 'cow', 'farm', 'Moo!', 'Cows give us milk for our cereal.', 'walk', 'plants', false),
  A('🐷', 'pig', 'farm', 'Oink oink!', 'Pigs roll in mud to keep cool.', 'walk', 'both', false),
  A('🐑', 'sheep', 'farm', 'Baa!', 'Sheep give us wool for warm jerseys.', 'walk', 'plants', false),
  A('🐴', 'horse', 'farm', 'Neigh!', 'Horses can sleep standing up.', 'walk', 'plants', false),
  A('🐔', 'chicken', 'farm', 'Cluck cluck!', 'Chickens lay eggs for our breakfast.', 'walk', 'both', true),
  A('🐐', 'goat', 'farm', 'Meh-eh-eh!', 'Goats are great climbers.', 'walk', 'plants', false),
  A('🦃', 'turkey', 'farm', 'Gobble gobble!', 'A turkey\'s head can change colour.', 'walk', 'both', true),
  A('🐠', 'fish', 'ocean', 'Blub blub!', 'Fish breathe underwater with gills.', 'swim', 'both', true),
  A('🐙', 'octopus', 'ocean', 'Splish!', 'An octopus has eight arms.', 'swim', 'meat', true),
  A('🐳', 'whale', 'ocean', 'Whoosh!', 'Whales visit the South African coast every winter.', 'swim', 'meat', false),
  A('🐬', 'dolphin', 'ocean', 'Click click!', 'Dolphins talk to each other with clicks and whistles.', 'swim', 'meat', false),
  A('🦀', 'crab', 'ocean', 'Snip snap!', 'Crabs walk sideways.', null, 'both', true),
  A('🐢', 'turtle', 'ocean', 'Splash!', 'Sea turtles can swim across whole oceans.', 'swim', 'both', true),
  A('🦈', 'shark', 'ocean', 'Chomp!', 'Sharks have lots of rows of teeth.', 'swim', 'meat', null),
  A('🦁', 'lion', 'bush', 'Roar!', 'A lion\'s roar can be heard far, far away.', 'walk', 'meat', false),
  A('🐘', 'elephant', 'bush', 'Toot!', 'Elephants use their trunks to drink and to hug.', 'walk', 'plants', false),
  A('🦒', 'giraffe', 'bush', 'Munch munch!', 'Giraffes are the tallest animals in the world.', 'walk', 'plants', false),
  A('🦓', 'zebra', 'bush', 'Hee haw!', 'Every zebra has its very own stripes.', 'walk', 'plants', false),
  A('🦏', 'rhino', 'bush', 'Snort!', 'Rhinos are one of South Africa\'s Big Five.', 'walk', 'plants', false),
  A('🐆', 'leopard', 'bush', 'Grrr!', 'Leopards carry their food up into trees.', 'walk', 'meat', false),
  A('🐧', 'penguin', 'ice', 'Squawk!', 'Penguins can\'t fly, but they are super swimmers. Some live near Cape Town!', 'swim', 'meat', true),
  A('🐻‍❄️', 'polar bear', 'ice', 'Grr!', 'Polar bears have black skin under their white fur.', 'walk', 'meat', false),
  A('🦭', 'seal', 'ice', 'Arf arf!', 'Seals can hold their breath for a long time.', 'swim', 'meat', false),
  A('🐪', 'camel', 'desert', 'Hmmph!', 'Camels can go a long time without drinking water.', 'walk', 'plants', false),
  A('🦎', 'lizard', 'desert', 'Flick flick!', 'Lizards warm up by lying in the sun.', 'walk', 'meat', true),
  A('🐍', 'snake', 'desert', 'Hiss!', 'Snakes smell with their tongues.', null, 'meat', true),
  A('🦂', 'scorpion', 'desert', 'Click!', 'Scorpions glow under special light.', 'walk', 'meat', null),
  A('🦋', 'butterfly', 'garden', 'Flutter!', 'Butterflies taste with their feet.', 'fly', 'plants', true),
  A('🐝', 'bee', 'garden', 'Buzz!', 'Bees make honey from flowers.', 'fly', 'plants', true),
  A('🐞', 'ladybird', 'garden', 'Tick tick!', 'Ladybirds help gardens by eating tiny bugs.', 'fly', 'meat', true),
  A('🐌', 'snail', 'garden', 'Slurp!', 'Snails carry their house on their back.', null, 'plants', true),
  A('🐜', 'ant', 'garden', 'March march!', 'Ants can carry things much heavier than themselves.', 'walk', 'both', true),
  A('🐸', 'frog', 'river', 'Ribbit!', 'Frogs start life as tadpoles.', 'swim', 'meat', true),
  A('🦆', 'duck', 'river', 'Quack quack!', 'Ducks have waterproof feathers.', null, 'both', true),
  A('🦢', 'swan', 'river', 'Honk!', 'Baby swans are called cygnets.', null, 'plants', true),
  A('🐊', 'crocodile', 'river', 'Snap!', 'Crocodiles have been around since the dinosaurs.', 'swim', 'meat', true),
  A('🦛', 'hippo', 'river', 'Harrumph!', 'Hippos spend all day in the water to keep cool.', 'swim', 'plants', false),
  A('🐒', 'monkey', 'jungle', 'Ooh ooh aah aah!', 'Monkeys use their tails to help them climb.', null, 'both', false),
  A('🦜', 'parrot', 'jungle', 'Squawk! Hello!', 'Some parrots can copy words.', 'fly', 'plants', true),
  A('🐅', 'tiger', 'jungle', 'Roar!', 'Tigers love to swim.', 'walk', 'meat', false),
  A('🦍', 'gorilla', 'jungle', 'Hoo hoo!', 'Gorillas build a new bed of leaves every night.', 'walk', 'plants', false),
  A('🦥', 'sloth', 'jungle', 'Yaaawn!', 'Sloths move very, very slowly.', null, 'plants', false),
  A('🦉', 'owl', 'forest', 'Hoo hoo!', 'Owls can turn their heads almost all the way round.', 'fly', 'meat', true),
  A('🐿️', 'squirrel', 'forest', 'Chitter!', 'Squirrels hide nuts for winter.', 'walk', 'plants', false),
  A('🦌', 'deer', 'forest', 'Bleat!', 'Baby deer have spots to help them hide.', 'walk', 'plants', false),
  A('🐻', 'bear', 'forest', 'Grrr!', 'Bears sleep through the winter.', 'walk', 'both', false),
  A('🦔', 'hedgehog', 'forest', 'Snuffle!', 'Hedgehogs roll into a prickly ball.', 'walk', 'meat', false),
  A('🦊', 'fox', 'forest', 'Yip yip!', 'Foxes use their fluffy tails as a blanket.', 'walk', 'both', false),
  A('🦅', 'eagle', 'forest', 'Screech!', 'Eagles can see tiny things from very high up.', 'fly', 'meat', true),
];

// Level tables. sort: 'home' | 'move' | 'eat' | 'egg'. homes: list or a number (random homes). n: animals per round.
const LITTLE = [
  { sort: 'home', homes: ['farm', 'ocean'], n: 4 }, { sort: 'home', homes: ['bush', 'ice'], n: 4 },
  { sort: 'home', homes: ['farm', 'ocean', 'bush'], n: 5 }, { sort: 'home', homes: ['garden', 'river'], n: 4 },
  { sort: 'home', homes: ['forest', 'desert'], n: 4 }, { sort: 'home', homes: ['jungle', 'ice'], n: 4 },
  { sort: 'home', homes: 3, n: 6 }, { sort: 'move', groups: ['swim', 'walk'], n: 4 },
  { sort: 'home', homes: ['farm', 'forest', 'garden'], n: 6 }, { sort: 'home', homes: ['ocean', 'river', 'ice'], n: 6 },
  { sort: 'move', groups: ['fly', 'walk'], n: 4 }, { sort: 'home', homes: 3, n: 6 },
  { sort: 'egg', groups: ['egg', 'milk'], n: 4 }, { sort: 'move', groups: ['fly', 'swim', 'walk'], n: 6 },
  { sort: 'home', homes: 4, n: 6 }, { sort: 'eat', groups: ['plants', 'meat'], n: 4 },
  { sort: 'home', homes: 4, n: 7 }, { sort: 'move', groups: ['fly', 'swim', 'walk'], n: 6 },
  { sort: 'home', homes: 4, n: 8 }, { sort: 'home', homes: 4, n: 8 },
];
const BIG = [
  { sort: 'home', homes: 3, n: 6 }, { sort: 'home', homes: ['desert', 'garden', 'forest'], n: 6 },
  { sort: 'home', homes: ['jungle', 'river', 'ice'], n: 6 }, { sort: 'move', groups: ['fly', 'swim', 'walk'], n: 6 },
  { sort: 'home', homes: 4, n: 7 }, { sort: 'eat', groups: ['plants', 'meat'], n: 6 },
  { sort: 'home', homes: 4, n: 8 }, { sort: 'egg', groups: ['egg', 'milk'], n: 6 },
  { sort: 'move', groups: ['fly', 'swim', 'walk'], n: 8 }, { sort: 'eat', groups: ['plants', 'meat', 'both'], n: 6 },
  { sort: 'home', homes: 5, n: 8 }, { sort: 'egg', groups: ['egg', 'milk'], n: 8 },
  { sort: 'eat', groups: ['plants', 'meat', 'both'], n: 8 }, { sort: 'home', homes: 5, n: 9 },
  { sort: 'move', groups: ['fly', 'swim', 'walk'], n: 9 }, { sort: 'eat', groups: ['plants', 'meat', 'both'], n: 9 },
  { sort: 'home', homes: 6, n: 10 }, { sort: 'egg', groups: ['egg', 'milk'], n: 10 },
  { sort: 'eat', groups: ['plants', 'meat', 'both'], n: 10 }, { sort: 'home', homes: 6, n: 12 },
];

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const table = little ? LITTLE : BIG;
  const L = table[Math.min(Math.max(1, ctx.level), table.length) - 1];
  const rounds = 2;
  let round = 0, mistakes = 0, left = 0, selected = null, alive = true, lastDrop = 0;
  ctx.hideMascot();
  ctx.dots(rounds);

  stage.innerHTML = `
    <div class="tray" style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;min-height:clamp(84px,13vw,120px);padding:4px 0 10px"></div>
    <div class="homes" style="flex:1;width:100%;min-height:0;display:grid;gap:12px"></div>`;
  const tray = stage.querySelector('.tray');
  const homesEl = stage.querySelector('.homes');

  // What group an animal belongs to for this level's kind of sorting.
  const keyOf = a => L.sort === 'home' ? a.h : L.sort === 'move' ? a.mv : L.sort === 'eat' ? a.eat : (a.egg === true ? 'egg' : a.egg === false ? 'milk' : null);
  const groupInfo = k => L.sort === 'home' ? { name: HABITATS[k].name, icon: HABITATS[k].icon, bg: HABITATS[k].sky, deco: HABITATS[k].deco } : { ...GROUPS[L.sort][k], deco: '' };
  const intro = {
    home: 'Help the animals get home! Drag each animal to where it lives.',
    move: 'How does each animal get around? Does it fly, swim or walk?',
    eat: 'What does each animal eat? Plants, meat, or both?',
    egg: 'How do the babies start? Do they hatch from eggs, or drink milk from their mum?',
  }[L.sort];

  function newRound() {
    const keys = L.sort === 'home' ? (Array.isArray(L.homes) ? L.homes : shuffle(Object.keys(HABITATS)).slice(0, L.homes)) : L.groups;
    const portrait = innerHeight > innerWidth;
    const n = keys.length;
    homesEl.style.gridTemplateColumns = !portrait ? `repeat(${n <= 4 ? n : Math.ceil(n / 2)}, 1fr)` : n === 4 || n > 4 ? 'repeat(2, 1fr)' : '1fr';
    homesEl.innerHTML = '';
    for (const k of keys) {
      const H = groupInfo(k);
      const d = document.createElement('div');
      d.dataset.h = k;
      d.style.cssText = `position:relative;border-radius:26px;background:${H.bg};box-shadow:var(--shadow);overflow:hidden;min-height:120px;display:flex;flex-wrap:wrap;align-content:flex-end;justify-content:center;gap:4px;padding:40px 8px 10px`;
      d.innerHTML = `<div style="position:absolute;top:8px;left:0;right:0;text-align:center;font-size:clamp(30px,4.5vw,46px)">${H.icon}${!little ? `<span style="font-size:.5em;vertical-align:middle;margin-left:6px;color:#2B2140">${H.name.replace(/^the /, '')}</span>` : ''}</div>
        ${H.deco ? `<div style="position:absolute;top:clamp(46px,7vw,64px);left:0;right:0;text-align:center;font-size:clamp(20px,3vw,30px);opacity:.5;letter-spacing:10px">${H.deco}</div>` : ''}`;
      d.addEventListener('pointerup', () => { if (selected) drop(selected, d); });
      d.addEventListener('click', () => {
        if (selected || performance.now() - lastDrop < 600) return;
        ctx.say(L.sort === 'home' ? `This is ${H.name}.` : L.sort === 'egg' ? (k === 'egg' ? 'Hatch from eggs.' : 'Drink milk.') : `${cap(H.name)}.`);
      });
      homesEl.appendChild(d);
    }
    // Animals for these groups; each group gets at least one.
    const pool = ANIMALS.filter(a => keys.includes(keyOf(a)));
    let animals = keys.map(k => pick(pool.filter(a => keyOf(a) === k))).filter(Boolean);
    for (const a of shuffle(pool)) if (animals.length < L.n && !animals.includes(a)) animals.push(a);
    tray.innerHTML = '';
    left = animals.length;
    shuffle(animals).forEach(addAnimal);
    ctx.instruct((round === 0 ? `Level ${ctx.level}! ` : '') + intro);
  }

  function addAnimal(a) {
    const d = document.createElement('div');
    d.textContent = a.e;
    d._a = a;
    d.style.cssText = `font-size:${L.n > 8 ? 'clamp(46px,7vw,70px)' : 'clamp(56px,9vw,84px)'};line-height:1.1;touch-action:none;cursor:grab;transition:transform .2s;position:relative;z-index:2;filter:drop-shadow(0 4px 0 rgba(0,0,0,.12))`;
    let sx = 0, sy = 0, dragging = false, moved = false;
    d.addEventListener('pointerdown', e => {
      e.preventDefault(); d.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; dragging = true; moved = false;
      d.style.transition = 'none'; d.style.zIndex = 30;
      if (selected && selected !== d) unselect();
      ctx.sfx.tap();
      ctx.sayAll([[`${a.n}!`], [a.s]]);
    });
    d.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 12) moved = true;
      d.style.transform = `translate(${dx}px,${dy}px) scale(1.2)`;
    });
    const end = e => {
      if (!dragging) return;
      dragging = false;
      d.style.transition = 'transform .25s';
      if (!moved) { d.style.transform = 'translateY(-12px) scale(1.2)'; selected = d; return; }
      const target = homeAt(e.clientX, e.clientY);
      if (target) drop(d, target); else reset(d);
    };
    d.addEventListener('pointerup', end);
    d.addEventListener('pointercancel', end);
    tray.appendChild(d);
  }
  function reset(d) { d.style.transform = ''; d.style.zIndex = 2; }
  function unselect() { if (selected) reset(selected); selected = null; }
  function homeAt(x, y) {
    for (const h of homesEl.children) {
      const r = h.getBoundingClientRect();
      if (x > r.left - 20 && x < r.right + 20 && y > r.top - 20 && y < r.bottom + 20) return h;
    }
    return null;
  }

  function drop(d, home) {
    const a = d._a;
    selected = null;
    lastDrop = performance.now();
    const k = keyOf(a);
    if (home.dataset.h === k) {
      [...homesEl.children].forEach(h => h.classList.remove('hint'));
      d.remove();
      const settled = document.createElement('span');
      settled.textContent = a.e;
      settled.style.cssText = 'font-size:clamp(40px,6vw,62px);line-height:1;position:relative;z-index:1';
      home.appendChild(settled);
      ctx.right(settled);
      const lines = [[L.sort === 'home' ? `The ${a.n} lives in ${HABITATS[a.h].name}!` : GROUPS[L.sort][k].say(a)]];
      if (!little) lines.push([a.f]);
      ctx.sayAll(lines);
      left--;
      if (left === 0) {
        round++;
        ctx.progress(round);
        ctx.later(() => {
          if (!alive) return;
          if (round >= rounds) ctx.finish(little ? 3 : mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1);
          else { ctx.say('All done! Here come more animals!'); ctx.later(newRound, 2200); }
        }, little ? 2200 : 4200);
      }
    } else {
      mistakes++;
      reset(d);
      d._miss = (d._miss || 0) + 1;
      const wrongTxt = L.sort === 'home' ? `Hmm, does a ${a.n} live in ${HABITATS[home.dataset.h].name}? Try again!`
        : L.sort === 'move' ? `Hmm, does a ${a.n} ${GROUPS.move[home.dataset.h].name}? Try again!`
        : L.sort === 'eat' ? `Hmm, think about what a ${a.n} likes to eat. Try again!`
        : `Hmm, think about how a baby ${a.n} starts. Try again!`;
      ctx.wrong(home, wrongTxt);
      if (d._miss >= 2) [...homesEl.children].find(h => h.dataset.h === k)?.classList.add('hint');
    }
  }

  if (window.__playroomTest) window.__playroomTest.homes = { keyOf };
  newRound();
  return () => { alive = false; };
}
