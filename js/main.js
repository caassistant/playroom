import { state, save, resetProgress, usageToday } from './store.js';
import { sfx, say, sayAll, sayAfter, stopSpeech, unlockAudio, hasVoice, englishVoices } from './audio.js';
import { bigConfetti, sparkleAt, balloons, wobble, bounce } from './fx.js';
import { character, CAST } from './characters.js';
import { PRAISE, pick } from './words.js';
import { GAMES } from './games/index.js';

const app = document.getElementById('app');
let cleanup = null;
let current = { screen: 'profiles', profile: null };

const ICON = {
  home: `<svg viewBox="0 0 48 48"><path d="M8 22 L24 8 L40 22 V40 H30 V29 H18 V40 H8 Z" fill="#FF9F1C" stroke="#2B2140" stroke-width="3.5" stroke-linejoin="round"/></svg>`,
  sound: `<svg viewBox="0 0 48 48"><path d="M8 18 H16 L26 9 V39 L16 30 H8 Z" fill="#3A86FF" stroke="#2B2140" stroke-width="3" stroke-linejoin="round"/><path d="M32 17 Q37 24 32 31 M37 12 Q45 24 37 36" stroke="#2B2140" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
  again: `<svg viewBox="0 0 48 48"><path d="M38 24 A14 14 0 1 1 30 11.5" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M27 4 L36 12 L26 18 Z" fill="#fff"/></svg>`,
  homeW: `<svg viewBox="0 0 48 48"><path d="M8 22 L24 8 L40 22 V40 H30 V29 H18 V40 H8 Z" fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>`,
  gear: `<span style="font-size:30px">⚙️</span>`,
  back: `<svg viewBox="0 0 48 48"><path d="M30 8 L14 24 L30 40" stroke="#2B2140" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function show(name, render) {
  stopSpeech();
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } }
  cleanup = null;
  current.screen = name;
  app.innerHTML = '';
  cleanup = render(app) || null;
}

/* ---------------- Profiles ---------------- */
function profilesScreen(root) {
  const s = el(`<div class="screen profiles">
    <h1>${[...'Playroom'].map(c => `<span>${c}</span>`).join('')}</h1>
    <div class="profile-row"></div>
    <button class="round-btn small" style="position:absolute;top:calc(10px + var(--safe-t));right:calc(12px + var(--safe-r))" aria-label="Grown-ups">${ICON.gear}</button>
  </div>`);
  const row = s.querySelector('.profile-row');
  state.profiles.forEach(p => {
    const b = el(`<button class="profile">${character(p.avatar, { mood: 'happy' })}<div class="name">${esc(p.name)}</div><div class="stars">⭐ ${p.stars}</div></button>`);
    b.onclick = () => {
      unlockAudio(); sfx.tap();
      current.profile = p;
      say(`Hi ${p.name}!`);
      hubScreenShow();
    };
    row.appendChild(b);
  });
  s.querySelector('.round-btn').onclick = () => parentGate(() => settingsModal());
  root.appendChild(s);
}

/* ---------------- Hub ---------------- */
function hubScreenShow() {
  if (limitReached()) return restScreenShow();
  show('hub', root => {
    const p = current.profile;
    const s = el(`<div class="screen hub">
      <div class="topbar">
        <button class="round-btn" aria-label="Back">${ICON.back}</button>
        <div class="who">${character(p.avatar, { mood: 'cheer' })}<span>${esc(p.name)}</span></div>
        <div class="spacer"></div>
        <div class="star-count"><span class="star">⭐</span><span>${p.stars}</span></div>
      </div>
      <div class="tabs"><button class="tab" data-t="learn">🎓 Learn</button><button class="tab" data-t="arcade">🕹️ Arcade</button></div>
      <div class="hub-grid"></div>
    </div>`);
    s.querySelector('.round-btn').onclick = () => { sfx.tap(); show('profiles', profilesScreen); };
    const tab = current.tab || 'learn';
    s.querySelectorAll('.tab').forEach(b => {
      b.classList.toggle('on', b.dataset.t === tab);
      b.onclick = () => { sfx.tap(); current.tab = b.dataset.t; say(b.dataset.t === 'arcade' ? 'Arcade!' : 'Learning games!'); hubScreenShow(); };
    });
    const grid = s.querySelector('.hub-grid');
    GAMES.filter(g => g.modes.includes(p.mode) && !!g.arcade === (tab === 'arcade')).forEach(g => {
      const done = Object.keys((p.lstars || {})[g.id] || {}).length;
      const best = g.endless ? ((p.hiscore || {})[g.id] ? `🏆 ${p.hiscore[g.id]}` : '') : done ? `Lv ${Math.min(unlockedLevel(p, g), maxLevelFor(g, p))}` : '';
      const t = el(`<button class="tile${g.arcade ? ' arcade-tile' : ''}" style="background:${g.color || '#2B2140'}">
        <div class="tstars">${best}</div>
        <div class="art">${character(g.mascot, { mood: 'happy' })}<span class="badge">${g.icon}</span></div>
        <div class="title">${esc(g.title)}</div></button>`);
      t.onclick = () => { sfx.tap(); g.endless ? startGame(g, 1) : levelMap(g); };
      grid.appendChild(t);
    });
    root.appendChild(s);
  });
}

/* ---------------- Game shell ---------------- */
/* ---------------- Levels ---------------- */
export function maxLevelFor(g, p) {
  const m = g.maxLevel || 10;
  return typeof m === 'number' ? m : (m[p.mode] || m.big || 10);
}
function unlockedLevel(p, g) {
  p.unlocked = p.unlocked || {};
  return Math.max(1, p.unlocked[g.id] || 1);
}

function levelMap(g) {
  if (limitReached()) return restScreenShow();
  const p = current.profile;
  const max = maxLevelFor(g, p);
  const open = Math.min(unlockedLevel(p, g), max);
  const ls = (p.lstars || {})[g.id] || {};
  show('levels', root => {
    const s = el(`<div class="screen levels" style="background:${g.bg || 'var(--bg)'}">
      <div class="topbar">
        <button class="round-btn" aria-label="Back">${ICON.back}</button>
        <div class="who"><span style="font-size:40px">${g.icon}</span><span style="${g.dark ? 'color:#fff' : ''}">${esc(g.title)}</span></div>
        <div class="spacer"></div>
        <div class="star-count"><span class="star">⭐</span><span>${p.stars}</span></div>
      </div>
      <div class="level-grid"></div>
    </div>`);
    s.querySelector('.round-btn').onclick = () => { sfx.tap(); hubScreenShow(); };
    const grid = s.querySelector('.level-grid');
    for (let n = 1; n <= max; n++) {
      const locked = n > open;
      const st = ls[n] || 0;
      const b = el(`<button class="lvl${locked ? ' locked' : ''}${n === open ? ' next' : ''}" style="--c:${g.color || '#8E6CEF'}">
        <span class="n">${locked ? '🔒' : n}</span><span class="st">${st ? '⭐'.repeat(st) : '&nbsp;'}</span></button>`);
      b.onclick = () => {
        if (locked) { sfx.oops(); wobble(b); say('Finish the glowing level first!'); return; }
        sfx.tap(); startGame(g, n);
      };
      grid.appendChild(b);
    }
    root.appendChild(s);
    const nb = grid.querySelector('.next');
    if (nb) nb.scrollIntoView({ block: 'center' });
    say(`${g.title}. Pick a level!`);
  });
}

function startGame(g, level) {
  if (limitReached()) return restScreenShow();
  const p = current.profile;
  if (!level) level = Math.min(unlockedLevel(p, g), maxLevelFor(g, p));
  const maxL = maxLevelFor(g, p);
  show('game', root => {
    const s = el(`<div class="screen game${g.dark ? ' dark' : ''}" style="background:${g.bg || 'var(--bg)'}">
      <div class="topbar">
        <button class="round-btn home" aria-label="Home">${ICON.home}</button>
        <button class="round-btn speak" aria-label="Say it again">${ICON.sound}</button>
        <div class="level-chip">${g.endless ? `🏆 ${(p.hiscore || {})[g.id] || 0}` : `Level ${level}`}</div>
        <div class="spacer"></div>
        <div class="dots"></div>
        <div class="spacer"></div>
        <div class="star-count"><span class="star">⭐</span><span class="sc">${p.stars}</span></div>
      </div>
      <div class="stage"></div>
      <div class="mascot">${character(g.mascot)}</div>
    </div>`);
    root.appendChild(s);
    const stage = s.querySelector('.stage');
    const mascot = s.querySelector('.mascot');
    let instruction = '';
    let finished = false;
    let gameCleanup = null;
    const timers = new Set();

    const ctx = {
      stage, mode: p.mode, level, maxLevel: maxL, profile: p, root: s,
      say, sayAll, sayAfter, sfx, wobble, bounce, sparkleAt,
      instruct(text) { instruction = text; say(text); },
      setInstruction(text) { instruction = text; },
      later(fn, ms) { const t = setTimeout(() => { timers.delete(t); if (!finished) fn(); }, ms); timers.add(t); return t; },
      dots(n) { s.querySelector('.dots').innerHTML = '<i></i>'.repeat(n); },
      progress(i) { s.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k < i)); },
      mascot(mood = 'cheer') {
        mascot.innerHTML = character(g.mascot, { mood });
        mascot.classList.remove('cheer'); void mascot.offsetWidth; mascot.classList.add('cheer');
        clearTimeout(mascot._t); mascot._t = setTimeout(() => { mascot.innerHTML = character(g.mascot); }, 1400);
      },
      hideMascot() { mascot.style.display = 'none'; },
      right(elm, { sparkle = true, praise = false } = {}) {
        sfx.good();
        if (elm) { bounce(elm); if (sparkle) sparkleAt(elm); }
        ctx.mascot('cheer');
        if (praise) say(pick(PRAISE));
      },
      wrong(elm, text) {
        sfx.oops();
        if (elm) wobble(elm);
        ctx.mascot('think');
        if (text) say(text);
      },
      finish(stars, info = {}) {
        if (finished) return; finished = true;
        stars = Math.max(1, Math.min(3, stars | 0));
        p.stars += stars;
        p.best[g.id] = Math.max(p.best[g.id] || 0, stars);
        p.lstars = p.lstars || {}; p.lstars[g.id] = p.lstars[g.id] || {};
        p.lstars[g.id][level] = Math.max(p.lstars[g.id][level] || 0, stars);
        p.unlocked = p.unlocked || {};
        p.unlocked[g.id] = Math.max(unlockedLevel(p, g), Math.min(maxL, level + 1));
        save();
        if (g.endless) {
          save();
          celebrate(stars, () => startGame(g, 1), () => hubScreenShow(), null, level, info.newBest ? 'New high score!' : null);
          return;
        }
        const hasNext = level < maxL;
        celebrate(stars, () => startGame(g, level), () => levelMap(g), hasNext ? () => startGame(g, level + 1) : null, level);
      },
    };
    s.querySelector('.home').onclick = () => { sfx.tap(); g.endless ? hubScreenShow() : levelMap(g); };
    s.querySelector('.speak').onclick = () => { if (instruction) say(instruction); };
    gameCleanup = g.start(ctx);
    return () => {
      finished = true;
      timers.forEach(clearTimeout);
            if (typeof gameCleanup === 'function') gameCleanup();
      const c = document.querySelector('.celebrate'); if (c) c._stop && c._stop();
    };
  });
}

/* ---------------- Celebration: confetti, stars, pop-able balloons ---------------- */
function celebrate(stars, again, home, next, level, headline) {
    const c = el(`<div class="celebrate">
    <div class="panel">
      <h2>${esc(headline || pick(PRAISE))}</h2>
      <div class="won-stars">${[0, 1, 2].map(i => `<span class="${i < stars ? '' : 'dim'}">⭐</span>`).join('')}</div>
      <div class="actions">
        ${next ? `<button class="big-btn next-btn" aria-label="Next level">Level ${level + 1} ▶</button>` : ''}
        <button class="big-btn again-btn ${next ? 'alt2' : ''}" aria-label="Play again">${ICON.again}</button>
        <button class="big-btn alt home-btn" aria-label="Levels">${ICON.homeW}</button>
      </div>
    </div></div>`);
  document.getElementById('app').appendChild(c);
  sfx.tada();
  bigConfetti();
  const h2 = c.querySelector('h2');
  say(next ? `${h2.textContent} On to level ${level + 1}!` : h2.textContent);
  c.querySelectorAll('.won-stars span').forEach((sp, i) => setTimeout(() => { sp.classList.add('in'); if (i < stars) sfx.star(i); }, 500 + i * 380));
  const stop = balloons(c, { total: 14 });
  c._stop = () => { stop(); c.remove(); };
  setTimeout(() => c.querySelector('.actions').classList.add('show'), 1800);
  c.querySelector('.again-btn').onclick = () => { sfx.tap(); c._stop(); again(); };
  c.querySelector('.home-btn').onclick = () => { sfx.tap(); c._stop(); home(); };
  const nb = c.querySelector('.next-btn');
  if (nb) nb.onclick = () => { sfx.tap(); c._stop(); next(); };
}

/* ---------------- Screen-time limit ---------------- */
function limitReached() {
  const lim = state.settings.limitMin;
  if (!lim) return false;
  const u = usageToday();
  return u.minutes >= lim + u.extra;
}
setInterval(() => {
  if (document.hidden || current.screen === 'profiles' || current.screen === 'rest') return;
  const u = usageToday();
  u.minutes += 0.25; save();
  if (limitReached() && current.screen === 'hub') restScreenShow();
  // In a game we let them finish the current round; the limit applies when they leave it.
}, 15000);

function restScreenShow() {
  show('rest', root => {
    const p = current.profile || state.profiles[0];
    const s = el(`<div class="screen rest">
      <div class="moon">🌙</div>
      ${character(p.avatar, { mood: 'sleep' })}
      <h2>Time for a rest!</h2>
      <div style="font-size:22px;opacity:.85">See you next time 💤</div>
      <button class="round-btn small" style="position:absolute;top:calc(10px + var(--safe-t));left:calc(12px + var(--safe-l))" aria-label="Grown-ups">${ICON.gear}</button>
    </div>`);
    s.querySelector('.round-btn').onclick = () => parentGate(() => settingsModal());
    say('Time for a rest! See you next time.');
    root.appendChild(s);
  });
}

/* ---------------- Grown-up gate: hold for 3 seconds ---------------- */
function parentGate(onPass) {
  const m = el(`<div class="modal-back gate"><div class="modal" style="text-align:center">
    <h3>Grown-ups only</h3>
    <p>Press the circle and keep your finger on it for 3 seconds.</p>
    <div class="hold"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="68" fill="none" stroke="#eee" stroke-width="10"/><circle class="ring" cx="75" cy="75" r="68" fill="none" stroke="#3BB273" stroke-width="10" stroke-linecap="round" stroke-dasharray="427" stroke-dashoffset="427"/></svg><span class="lock">🔒</span></div>
    <div class="footer" style="justify-content:center"><button class="btn ghost">Cancel</button></div>
  </div></div>`);
  document.body.appendChild(m);
  const ring = m.querySelector('.ring');
  const hold = m.querySelector('.hold');
  let t0 = 0, raf = 0;
  const reset = () => { cancelAnimationFrame(raf); t0 = 0; ring.style.strokeDashoffset = 427; };
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / 3000);
    ring.style.strokeDashoffset = 427 * (1 - k);
    if (k >= 1) { m.remove(); onPass(); return; }
    raf = requestAnimationFrame(tick);
  };
  hold.addEventListener('pointerdown', e => { e.preventDefault(); hold.setPointerCapture(e.pointerId); t0 = performance.now(); tick(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => hold.addEventListener(ev, reset));
  m.querySelector('.btn').onclick = () => { reset(); m.remove(); };
}

/* ---------------- Settings ---------------- */
function settingsModal() {
  const S = state.settings;
  const m = el(`<div class="modal-back"><div class="modal">
    <h3>Grown-up settings</h3>
    <p>Everything stays on this tablet. The app never connects to the internet, shows ads or asks for money.</p>
    <div class="kids"></div>
    <div class="row"><label>Sound effects</label><button class="toggle" data-k="sound"></button></div>
    <div class="row"><label>Spoken instructions</label><button class="toggle" data-k="voice"></button></div>
    <div class="row"><label>Voice<div class="note vnote">South African English voices are listed first.</div></label>
      <select class="voicepick" style="max-width:230px"></select></div>
    <div class="row"><label>Talking speed</label>
      <div class="seg rate"><button data-v="0.72">Slow</button><button data-v="0.85">Gentle</button><button data-v="0.95">Normal</button></div>
      <button class="btn ghost vtest">▶ Test</button></div>
    <div class="row"><label>Show words on screen<div class="note">Captions of everything that is said. "Auto" shows them when the tablet can't speak.</div></label>
      <div class="seg caps"><button data-v="auto">Auto</button><button data-v="on">On</button><button data-v="off">Off</button></div></div>
    <div class="row"><label>Left-handed controls<div class="note">Swaps the arcade buttons to the other side.</div></label><button class="toggle" data-k="leftHanded"></button></div>
    <div class="row"><label>Daily play time<div class="note used"></div></label>
      <select class="limit">${[0, 10, 15, 20, 30, 45, 60].map(v => `<option value="${v}">${v ? v + ' minutes' : 'No limit'}</option>`).join('')}</select></div>
    <div class="row"><label>Play time used up?</label><button class="btn ghost more">+10 minutes today</button></div>
    <div class="row"><label>App version <b>${APP_VERSION}</b><div class="note upd-note">Updates download by themselves when the app opens with internet.</div></label><button class="btn upd">🔄 Check for updates</button></div>
    <div class="row"><label>Start everyone's stars and levels again</label><button class="btn danger reset">Reset</button></div>
    <div class="footer"><button class="btn done">Done</button></div>
    <p class="note" style="margin-top:14px">Playroom · version ${APP_VERSION} · made at home with love · works offline</p>
  </div></div>`);
  const kids = m.querySelector('.kids');
  state.profiles.forEach(p => {
    const r = el(`<div class="row" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <input type="text" maxlength="16" value="${esc(p.name)}" aria-label="Name">
        <div class="seg mode"><button data-v="little">Little (3–4)</button><button data-v="big">Big (5–7)</button></div>
      </div>
      <div class="avatars" style="display:flex;gap:8px;margin-top:8px">${Object.keys(CAST).map(k => `<button data-a="${k}" style="width:56px;height:56px;border-radius:14px;padding:4px">${character(k)}</button>`).join('')}</div>
    </div>`);
    const inp = r.querySelector('input');
    inp.oninput = () => { p.name = inp.value.trim() || p.name; save(); };
    const paintMode = () => r.querySelectorAll('.mode button').forEach(b => b.classList.toggle('on', b.dataset.v === p.mode));
    r.querySelectorAll('.mode button').forEach(b => b.onclick = () => { p.mode = b.dataset.v; save(); paintMode(); });
    const paintAv = () => r.querySelectorAll('[data-a]').forEach(b => b.style.background = b.dataset.a === p.avatar ? '#FFE9C2' : 'transparent');
    r.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { p.avatar = b.dataset.a; save(); paintAv(); });
    paintMode(); paintAv();
    kids.appendChild(r);
  });
  const paint = () => {
    m.querySelectorAll('[data-k]').forEach(b => b.classList.toggle('on', !!S[b.dataset.k]));
  };
  m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { S[b.dataset.k] = !S[b.dataset.k]; save(); paint(); });
  const vp = m.querySelector('.voicepick');
  const fillVoices = () => {
    const list = englishVoices();
    vp.innerHTML = `<option value="">Best available (automatic)</option>` + list.map(v => `<option value="${esc(v.name)}">${esc(v.name)} · ${esc(v.lang)}</option>`).join('');
    vp.value = S.voiceName || '';
    if (!list.length) m.querySelector('.vnote').textContent = 'No voices found on this tablet yet. Check the tablet\'s text-to-speech settings.';
    else if (!list.some(v => /en[-_]ZA/i.test(v.lang))) m.querySelector('.vnote').textContent = 'No South African voice on this tablet yet. See below to add one.';
  };
  fillVoices();
  if (window.speechSynthesis) speechSynthesis.addEventListener?.('voiceschanged', fillVoices);
  vp.onchange = () => { S.voiceName = vp.value; save(); say('Hello! Shall we play a game?'); };
  const paintRate = () => m.querySelectorAll('.rate button').forEach(b => b.classList.toggle('on', +b.dataset.v === (S.rate || 0.85)));
  m.querySelectorAll('.rate button').forEach(b => b.onclick = () => { S.rate = +b.dataset.v; save(); paintRate(); say('Hello! Shall we play a game?'); });
  paintRate();
  m.querySelector('.vtest').onclick = () => say('Hello! Well done, you are a superstar! Shall we play a game?');
  m.querySelector('.upd').onclick = async e => {
    const note = m.querySelector('.upd-note'), btn = e.currentTarget;
    if (!navigator.onLine) { note.textContent = 'Connect to Wi-Fi first, then try again.'; return; }
    btn.disabled = true; note.textContent = 'Checking…';
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      const latest = (await r.json()).version;
      if (latest > APP_VERSION) {
        note.textContent = `Updating to version ${latest}…`;
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) await reg.update().catch(() => {});
        setTimeout(() => location.reload(), 1200);
      } else {
        note.textContent = `You have the newest version (${APP_VERSION}).`;
        btn.disabled = false;
      }
    } catch {
      note.textContent = 'Couldn\'t reach the internet. Try again later.';
      btn.disabled = false;
    }
  };
  const paintCaps = () => m.querySelectorAll('.caps button').forEach(b => b.classList.toggle('on', b.dataset.v === (S.captions || 'auto')));
  m.querySelectorAll('.caps button').forEach(b => b.onclick = () => { S.captions = b.dataset.v; save(); paintCaps(); });
  paintCaps();
  const sel = m.querySelector('.limit');
  sel.value = String(S.limitMin);
  sel.onchange = () => { S.limitMin = +sel.value; save(); };
  const u = usageToday();
  m.querySelector('.used').textContent = `Played today: about ${Math.round(u.minutes)} min`;
  m.querySelector('.more').onclick = e => { usageToday().extra += 10; save(); e.target.textContent = 'Added ✓'; };
  m.querySelector('.reset').onclick = e => {
    if (e.target.dataset.sure) { resetProgress(); e.target.textContent = 'Done ✓'; return; }
    e.target.dataset.sure = 1; e.target.textContent = 'Tap again to confirm';
  };
  m.querySelector('.done').onclick = () => {
    m.remove();
    if (current.screen === 'rest' && !limitReached()) hubScreenShow();
    else if (current.screen === 'profiles') show('profiles', profilesScreen);
    else if (current.screen === 'hub') hubScreenShow();
  };
  paint();
  document.body.appendChild(m);
}

/* ---------------- Boot ---------------- */
// Block the long-press menu and pinch-zoom gestures that pull little ones out of the game.
addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

show('profiles', profilesScreen);

export const APP_VERSION = 9;

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    // Look for a new version whenever the app is opened or brought back to the front.
    const check = () => { if (navigator.onLine) reg.update().catch(() => {}); };
    check();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  }).catch(() => {});
  // When a new version takes over, reload, but only on the profile screen so no game is interrupted.
  let pendingReload = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { pendingReload = true; if (current.screen === 'profiles') location.reload(); });
  setInterval(() => { if (pendingReload && current.screen === 'profiles') location.reload(); }, 2000);
}
