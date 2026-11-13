// Sound effects are synthesised with WebAudio (no audio files, no network).
// Speech uses the tablet's built-in voices (speechSynthesis), which work offline.
import { state } from './store.js';

let ctx = null;
function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Must be called from a tap (iOS only allows audio after a user gesture).
export function unlockAudio() {
  const a = ac();
  if (a) { const b = a.createBuffer(1, 1, 22050); const s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); s.start(0); }
  try { if (window.speechSynthesis) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch {}
}

function tone(freq, start, dur, { type = 'sine', vol = .25, slide = 0 } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function noise(start, dur, vol = .3, hp = 800) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + start;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = a.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination);
  s.start(t);
}

const C = 523.25, E = 659.25, G = 783.99, C2 = 1046.5;

export const sfx = {
  pop()   { if (!state.settings.sound) return; noise(0, .12, .45, 1200); tone(700 + Math.random() * 300, 0, .12, { type: 'triangle', vol: .2, slide: -400 }); },
  tap()   { if (!state.settings.sound) return; tone(880, 0, .07, { type: 'triangle', vol: .12 }); },
  ding()  { if (!state.settings.sound) return; tone(C2, 0, .35, { vol: .2 }); tone(C2 * 1.5, .06, .4, { vol: .12 }); },
  good()  { if (!state.settings.sound) return; [C, E, G].forEach((f, i) => tone(f, i * .08, .25, { type: 'triangle', vol: .2 })); },
  tada()  { if (!state.settings.sound) return; [C, E, G, C2].forEach((f, i) => tone(f, i * .11, .35, { type: 'triangle', vol: .22 })); tone(C2, .45, .8, { vol: .15 }); tone(G, .45, .8, { vol: .1 }); },
  // Gentle, never harsh: a soft "boop" for try-again.
  oops()  { if (!state.settings.sound) return; tone(330, 0, .18, { type: 'sine', vol: .16, slide: -80 }); tone(262, .15, .22, { type: 'sine', vol: .14, slide: -60 }); },
  whoosh(){ if (!state.settings.sound) return; noise(0, .45, .25, 400); tone(200, 0, .45, { type: 'sine', vol: .08, slide: 600 }); },
  flip()  { if (!state.settings.sound) return; noise(0, .06, .2, 2500); },
  star(i = 0) { if (!state.settings.sound) return; tone([E, G, C2][i % 3] * 1.0, 0, .3, { type: 'triangle', vol: .2 }); tone([E, G, C2][i % 3] * 2, .05, .3, { vol: .08 }); },
  note(freq) { if (!state.settings.sound) return; tone(freq, 0, .6, { type: 'triangle', vol: .25 }); tone(freq * 2, 0, .3, { vol: .06 }); },
};

/* ---------------- Speech ---------------- */
const synth = window.speechSynthesis;
let voices = [];
function loadVoices() { try { voices = synth ? synth.getVoices() : []; } catch { voices = []; } }
loadVoices();
if (synth && 'onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;

// South African English first, then other English voices.
const PREF = {
  en: ['en-ZA', 'en-GB', 'en-AU', 'en-IE', 'en-NZ', 'en-US', 'en'],
  pt: ['pt-PT', 'pt'],
  af: ['af-ZA', 'af'],
};
// Higher-quality voices usually have one of these words in their name.
const NICE = /(enhanced|premium|natural|neural|siri|wavenet|studio)/i;
// Voices that sound silly or robotic for children's instructions.
const AVOID = /(novelty|bells|bubbles|boing|cellos|whisper|zarvox|trinoids|bahh|albert|bad news|good news|jester|organ|superstar|wobble|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)/i;

const norm = v => v.lang.replace('_', '-').toLowerCase();

/** All usable English voices, best first (for the grown-up voice picker). */
export function englishVoices() {
  if (!voices.length) loadVoices();
  const rank = v => {
    const i = PREF.en.findIndex(c => norm(v).startsWith(c.toLowerCase()));
    return (i < 0 ? 9 : i) * 10 - (NICE.test(v.name) ? 5 : 0) - (v.localService ? 1 : 0);
  };
  return voices.filter(v => norm(v).startsWith('en') && !AVOID.test(v.name)).sort((a, b) => rank(a) - rank(b));
}

export function voiceFor(lang) {
  if (!voices.length) loadVoices();
  if (lang === 'en') {
    const chosen = state.settings.voiceName && voices.find(v => v.name === state.settings.voiceName);
    if (chosen) return chosen;
    return englishVoices()[0] || null;
  }
  for (const code of PREF[lang] || [lang]) {
    const c = code.toLowerCase();
    const list = voices.filter(v => norm(v) === c).concat(voices.filter(v => norm(v).startsWith(c)));
    if (list.length) return list.find(v => NICE.test(v.name)) || list.find(v => v.localService) || list[0];
  }
  return null;
}

export function hasVoice(lang) { return !!voiceFor(lang); }

let queue = Promise.resolve();
let generation = 0;

/* Captions: show what is said on screen when the tablet can't speak (or when switched on). */
function speechWorks() {
  if (!synth) return false;
  if (!voices.length) loadVoices();
  return voices.length > 0;
}
function captionsOn() {
  const c = state.settings.captions || 'auto';
  return c === 'on' || (c === 'auto' && (!state.settings.voice || !speechWorks()));
}
let capEl = null;
function showCaption(text) {
  if (!capEl) { capEl = document.createElement('div'); capEl.className = 'caption'; document.body.appendChild(capEl); }
  capEl.textContent = text;
  capEl.classList.add('show');
}
function hideCaption() { if (capEl) capEl.classList.remove('show'); }

export function getAudioContext() { return ac(); }

function speakOne(text, lang, gen) {
  return new Promise(res => {
    if (gen !== generation) return res();
    const cap = captionsOn();
    const t0 = performance.now();
    // When captions are showing, give enough time to read them even if the voice is silent.
    const minMs = cap ? 900 + text.length * 55 : 0;
    let done = false;
    const finish = () => {
      if (done) return;
      const left = minMs - (performance.now() - t0);
      if (left > 0) { setTimeout(finish, left); return; }
      done = true;
      if (cap && gen === generation) hideCaption();
      res();
    };
    if (cap) showCaption(text);
    const v = voiceFor(lang);
    if (!synth || !state.settings.voice || (!v && lang !== 'en')) return finish();
    const u = new SpeechSynthesisUtterance(text);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = state.settings.rate || 0.85;   // a little slower than normal speech
    u.pitch = 1.05;
    u.onend = finish; u.onerror = finish;
    setTimeout(finish, 1200 + text.length * 120); // safety net: some engines never fire onend
    try { synth.speak(u); } catch { finish(); }
  });
}

/** Say something now, interrupting whatever was being said. */
export function say(text, lang = 'en') {
  stopSpeech();
  const gen = generation;
  queue = speakOne(text, lang, gen);
  return queue;
}

/** Say several things in order: [['Red'], ['vermelho','pt']] */
export function sayAll(parts) {
  stopSpeech();
  const gen = generation;
  queue = parts.reduce((p, [t, l = 'en']) => p.then(() => speakOne(t, l, gen)), Promise.resolve());
  return queue;
}

/** Add to the end of what is currently being said. */
export function sayAfter(text, lang = 'en') {
  const gen = generation;
  queue = queue.then(() => speakOne(text, lang, gen));
  return queue;
}

export function stopSpeech() {
  generation++;
  hideCaption();
  try { synth && synth.cancel(); } catch {}
}
