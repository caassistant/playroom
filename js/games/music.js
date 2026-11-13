// Music Maker: a rainbow xylophone.
// Levels alternate between:
//  🔁 Copy me — Zuzu plays a little tune, you copy it; the tune grows until you reach the goal.
//  🎶 Songs   — Zuzu plays a traditional song first ("listen first"), then you play it by tapping
//               the shining bars. Later Big levels play from memory (lights only come on if you get stuck).
// 🎹 Free play is always one tap away (top-right button).
import { character } from '../characters.js';
import { state } from '../store.js';
import { getAudioContext } from '../audio.js';

// C major scale, C4 to C5.
const FREQ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25];
const NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'];
const COLORS = ['#FF4B4B', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#FF7EB6'];
const PALS = ['🐱', '🐶', '🐥', '🐸', '🐢', '🐳', '🦋', '🐷'];

// Traditional, public-domain tunes as scale steps (0 = low C ... 7 = high C).
// `short` = how many notes the Little version plays.
const SONGS = [
  { name: 'Hot Cross Buns', icon: '🥯', short: 6, notes: [2, 1, 0, 2, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 1, 0] },
  { name: 'Mary Had a Little Lamb', icon: '🐑', short: 13, notes: [2, 1, 0, 1, 2, 2, 2, 1, 1, 1, 2, 4, 4, 2, 1, 0, 1, 2, 2, 2, 2, 1, 1, 2, 1, 0] },
  { name: 'Twinkle, Twinkle, Little Star', icon: '⭐', short: 14, notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1, 0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
  { name: 'Row, Row, Row Your Boat', icon: '🚣', short: 10, notes: [0, 0, 0, 1, 2, 2, 1, 2, 3, 4, 7, 7, 7, 4, 4, 4, 2, 2, 2, 0, 0, 0, 4, 3, 2, 1, 0] },
  { name: 'Brother John', icon: '🔔', short: 14, notes: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4, 4, 5, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 0, 4, 0, 0, 4, 0] },
  { name: 'London Bridge', icon: '🌉', short: 13, notes: [4, 5, 4, 3, 2, 3, 4, 1, 2, 3, 2, 3, 4, 4, 5, 4, 3, 2, 3, 4, 1, 4, 2, 0] },
  { name: 'Old MacDonald', icon: '🚜', short: 12, notes: [4, 4, 4, 1, 2, 2, 1, 6, 6, 5, 5, 4, 1, 4, 4, 4, 1, 2, 2, 1, 6, 6, 5, 5, 4] },
  { name: 'Ode to Joy', icon: '🎻', short: 15, notes: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1, 2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0] },
  { name: 'Jingle Bells', icon: '🛷', short: 11, notes: [2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 2, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 2, 1, 4] },
  { name: 'This Old Man', icon: '👴', short: 13, notes: [4, 2, 4, 4, 2, 4, 5, 4, 3, 2, 1, 2, 3, 2, 3, 4, 0, 0, 0, 0, 0, 1, 2, 3, 4, 4, 1, 1, 3, 2, 1, 0] },
];

/** What a level asks for. Odd levels = copy me, even levels = a song. */
function levelPlan(level, little) {
  if (level % 2 === 1) {
    const k = (level + 1) / 2; // 1..10
    if (little) return { kind: 'copy', bars: k <= 3 ? 4 : k <= 6 ? 5 : 8, goal: Math.min(7, 2 + Math.ceil(k / 2)) };
    return { kind: 'copy', bars: k <= 2 ? 5 : 8, goal: Math.min(12, 3 + k) };
  }
  const i = level / 2 - 1; // 0..9
  const song = SONGS[i % SONGS.length];
  return {
    kind: 'song', song,
    notes: little ? song.notes.slice(0, song.short) : song.notes,
    memory: !little && level >= 14,           // Big, later levels: play from memory
  };
}

// A soft, bell-like xylophone tone on the app's shared (already unlocked) audio.
function bell(freq, vol = 0.32) {
  if (!state.settings.sound) return;
  const ac = getAudioContext();
  if (!ac) return;
  const t = ac.currentTime;
  for (const [mult, v, dur] of [[1, vol, 1.2], [4, vol * 0.18, 0.4], [10, vol * 0.05, 0.15]]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
}

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const plan = levelPlan(ctx.level, little);
  let alive = true, onBar = null, run = { id: 0 };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  ctx.hideMascot();
  ctx.dots(0);

  /* ---------- Xylophone ---------- */
  function xylophone(count = 8, { labels = !little } = {}) {
    const idx = count === 8 ? [0, 1, 2, 3, 4, 5, 6, 7] : count === 5 ? [0, 2, 4, 5, 7] : [0, 2, 4, 7];
    const wrap = document.createElement('div');
    wrap.style.cssText = `display:flex;align-items:center;justify-content:center;gap:clamp(6px,1.4vw,14px);width:100%;max-width:${idx.length * 136}px;margin:0 auto;flex:1;min-height:0;padding:10px 0;position:relative`;
    wrap.innerHTML = `<div style="position:absolute;left:4%;right:4%;top:32%;height:12px;border-radius:6px;background:#C98B5A"></div>
      <div style="position:absolute;left:4%;right:4%;bottom:32%;height:12px;border-radius:6px;background:#C98B5A"></div>`;
    const bars = [];
    idx.forEach((n, k) => {
      const b = document.createElement('button');
      const h = 92 - k * (40 / idx.length);
      b.className = 'xbar';
      b.style.cssText = `position:relative;flex:1;max-width:120px;height:${h}%;border-radius:18px;background:${COLORS[n]};
        display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:12px 0;transition:transform .08s, filter .15s, box-shadow .15s;touch-action:none`;
      b.innerHTML = `<span style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.7)"></span>
        <span style="font-size:clamp(28px,4.5vw,46px)">${PALS[n]}</span>
        <span style="font-size:clamp(18px,2.6vw,26px);color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.2)">${labels ? NAMES[n] : ''}</span>
        <span style="width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.7)"></span>`;
      b._note = n;
      glow(b, false);
      b.addEventListener('pointerdown', e => { e.preventDefault(); hit(b); onBar && onBar(n, b); });
      wrap.appendChild(b);
      bars.push(b);
    });
    return { el: wrap, bars, byNote: n => bars.find(b => b._note === n), notes: idx };
  }
  function hit(b) {
    bell(FREQ[b._note]);
    b.style.transform = 'translateY(5px) scale(.97)';
    b.style.filter = 'brightness(1.25)';
    setTimeout(() => { b.style.transform = ''; b.style.filter = ''; }, 150);
    const n = document.createElement('div');
    n.textContent = ['♪', '♫', '♬'][(Math.random() * 3) | 0];
    const r = b.getBoundingClientRect();
    n.style.cssText = `position:fixed;left:${r.left + r.width / 2 - 12}px;top:${r.top}px;font-size:34px;color:${COLORS[b._note]};pointer-events:none;z-index:20;transition:transform 1s ease-out, opacity 1s`;
    document.body.appendChild(n);
    requestAnimationFrame(() => { n.style.transform = `translate(${(Math.random() - .5) * 60}px,-90px) rotate(${(Math.random() - .5) * 40}deg)`; n.style.opacity = '0'; });
    setTimeout(() => n.remove(), 1000);
  }
  function glow(b, on) {
    b.style.boxShadow = on ? '0 0 0 6px #FFD23F, 0 0 36px 14px rgba(255,210,63,.95), 0 7px 0 rgba(0,0,0,.18)' : '0 7px 0 rgba(0,0,0,.18), inset 0 -10px 0 rgba(0,0,0,.08)';
    b.dataset.glow = on ? '1' : '';
    let f = b.querySelector('.finger');
    if (on && !f) {
      f = document.createElement('span');
      f.className = 'finger';
      f.textContent = '👇';
      f.style.cssText = 'position:absolute;top:-52px;left:50%;transform:translateX(-50%);font-size:44px;pointer-events:none;animation:fingerBob .6s infinite alternate';
      b.appendChild(f);
    } else if (!on && f) f.remove();
  }
  if (!document.getElementById('music-css')) {
    const st = document.createElement('style');
    st.id = 'music-css';
    st.textContent = '@keyframes fingerBob { from { margin-top: 0 } to { margin-top: -12px } }';
    document.head.appendChild(st);
  }

  /* ---------- Shared header: Zuzu, a status line and buttons ---------- */
  function header(title) {
    stage.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;justify-content:center;width:100%;position:relative">
        <div class="zz" style="width:clamp(64px,9vw,100px);flex:none">${character('zuzu')}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-start;min-width:0">
          <div class="title" style="font-size:clamp(20px,3vw,30px)">${title}</div>
          <div class="status prompt" style="margin:0;font-size:clamp(22px,3.4vw,34px)"></div>
        </div>
        <div class="hbtns" style="position:absolute;right:0;top:0;display:flex;gap:10px"></div>
      </div>`;
    const zz = stage.querySelector('.zz');
    const status = stage.querySelector('.status');
    const btns = stage.querySelector('.hbtns');
    const addBtn = (label, aria, fn) => {
      const b = document.createElement('button');
      b.className = 'round-btn'; b.textContent = label; b.setAttribute('aria-label', aria);
      b.onclick = () => { ctx.sfx.tap(); fn(); };
      btns.appendChild(b);
      return b;
    };
    const mood = m => { zz.innerHTML = character('zuzu', { mood: m }); };
    return { zz, status, addBtn, mood };
  }

  /* ---------- Free play ---------- */
  function freePlay() {
    const r = ++run.id;
    const h = header('🎹 Free play');
    h.status.textContent = 'Play anything!';
    h.addBtn('🎯', 'Back to the level', () => startLevel());
    const x = xylophone(8, { labels: !little });
    stage.appendChild(x.el);
    onBar = () => {};
    ctx.instruct('Free play! Tap the bars to make any music you like. Tap the target to go back to your level.');
    return r;
  }

  /* ---------- Copy me ---------- */
  async function copyMe() {
    const r = ++run.id;
    const live = () => alive && run.id === r;
    const h = header(`🔁 Copy Zuzu`);
    const x = xylophone(plan.bars, { labels: false });
    stage.appendChild(x.el);
    h.addBtn('🎹', 'Free play', freePlay);
    const again = h.addBtn('👂', 'Hear the tune again', () => { if (listening) playTune(); });
    ctx.dots(plan.goal);
    let tune = [], pos = 0, listening = false, mistakes = 0;

    async function playTune() {
      listening = false;
      h.status.textContent = '👂 Listen…';
      h.mood('cheer');
      await wait(500);
      for (const n of tune) {
        if (!live()) return;
        const b = x.byNote(n);
        glow(b, true); hit(b);
        await wait(little ? 650 : 520);
        glow(b, false);
        await wait(140);
      }
      if (!live()) return;
      h.mood('happy');
      h.status.textContent = '👆 Your turn!';
      ctx.say('Your turn!');
      pos = 0; listening = true;
    }
    function addNote() { tune.push(x.notes[(Math.random() * x.notes.length) | 0]); }

    onBar = async n => {
      if (!listening) return;
      if (n === tune[pos]) {
        pos++;
        if (pos < tune.length) return;
        listening = false;
        ctx.progress(tune.length);
        ctx.sfx.good();
        ctx.sparkleAt(x.el, 25);
        if (tune.length >= plan.goal) {
          h.status.textContent = '🌟 Music star!';
          await ctx.say('You are a music star!');
          if (live()) ctx.finish(little ? 3 : mistakes <= 1 ? 3 : mistakes <= 3 ? 2 : 1);
          return;
        }
        h.status.textContent = '🎉';
        await ctx.say(['Yes!', 'Perfect!', 'Brilliant!', 'Lovely!'][(Math.random() * 4) | 0]);
        if (!live()) return;
        addNote();
        playTune();
      } else {
        listening = false;
        mistakes++;
        ctx.sfx.oops();
        h.mood('think');
        h.status.textContent = '🙈 Oops!';
        await ctx.say('Oops! Listen again.');
        if (live()) playTune();
      }
    };

    // Start with a 2-note tune for a quick first success.
    addNote(); addNote();
    h.status.textContent = '👂 Listen…';
    ctx.setInstruction('Listen to Zuzu\'s tune, then copy it!');
    await ctx.say(`Level ${ctx.level}. Listen to my tune, then copy it!`);
    if (live()) playTune();
  }

  /* ---------- Songs: listen first, then play along ---------- */
  async function song() {
    const r = ++run.id;
    const live = () => alive && run.id === r;
    const { song: s, notes, memory } = plan;
    const h = header(`${s.icon} ${s.name}`);
    const bar = document.createElement('div');
    bar.style.cssText = 'width:min(90%,700px);height:14px;border-radius:7px;background:rgba(43,33,64,.1);overflow:hidden;margin-top:8px';
    bar.innerHTML = '<div style="height:100%;width:0;background:#3BB273;transition:width .2s"></div>';
    stage.appendChild(bar);
    const fill = bar.firstChild;
    const x = xylophone(8, { labels: !little });
    stage.appendChild(x.el);
    h.addBtn('🎹', 'Free play', freePlay);
    h.addBtn('👂', 'Listen to the song again', () => { if (!demoing) demo(); });
    let i = 0, done = false, demoing = false, idleT = null;

    const showNext = () => {
      x.bars.forEach(b => glow(b, false));
      fill.style.width = (i / notes.length * 100) + '%';
      clearTimeout(idleT);
      if (i >= notes.length) return;
      if (!memory) glow(x.byNote(notes[i]), true);
      else idleT = setTimeout(() => { if (live() && !demoing && !done) glow(x.byNote(notes[i]), true); }, 2500);
    };

    async function demo() {
      demoing = true;
      clearTimeout(idleT);
      x.bars.forEach(b => glow(b, false));
      h.mood('cheer');
      h.status.textContent = '👂 Listen first…';
      await ctx.say(`Listen first! This is ${s.name}.`);
      for (const n of notes) {
        if (!live()) return;
        const b = x.byNote(n);
        glow(b, true); hit(b);
        await wait(little ? 480 : 380);
        glow(b, false);
        await wait(70);
      }
      if (!live()) return;
      demoing = false;
      h.mood('happy');
      h.status.textContent = memory ? '🧠 Your turn! Play it from memory.' : '👆 Your turn! Tap the shining bar.';
      ctx.setInstruction(memory ? 'Play the song from memory! If you get stuck, the right bar will shine.' : 'Tap the shining bar to play the song!');
      ctx.say(memory ? 'Your turn! Can you play it from memory?' : 'Your turn! Tap the shining bar.');
      showNext();
    }

    onBar = n => {
      if (done || demoing) return;
      if (n === notes[i]) {
        i++;
        showNext();
        if (i === notes.length) {
          done = true;
          ctx.sfx.good();
          ctx.sparkleAt(x.el, 40);
          h.status.textContent = '🎉 You did it!';
          ctx.say(`You played ${s.name}!`);
          ctx.later(() => ctx.finish(3), 2000);
        }
      }
      // Wrong bars just play their note: no penalty when making music.
    };

    await wait(300);
    if (live()) demo();
  }

  function startLevel() {
    onBar = null;
    ctx.dots(0);
    if (plan.kind === 'copy') copyMe(); else song();
  }

  startLevel();
  return () => { alive = false; run.id++; onBar = null; };
}
