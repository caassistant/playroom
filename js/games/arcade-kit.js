// Shared helpers for the arcade games: a crisp scaled canvas, big touch buttons,
// swipe gestures, keyboard support and a pausable game loop.
import { character } from '../characters.js';

/**
 * Layout: [left buttons] [canvas] [right buttons] in landscape,
 * canvas on top and the two button groups underneath in portrait.
 * The canvas has a fixed logical size (w x h) and is scaled to fit.
 */
export function arcadeLayout(stage, { w, h, left = [], right = [] }) {
  stage.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'arcade';
  wrap.innerHTML = `
    <div class="pad pad-l"></div>
    <div class="screen-box"><canvas></canvas></div>
    <div class="pad pad-r"></div>`;
  stage.appendChild(wrap);
  const canvas = wrap.querySelector('canvas');
  const g = canvas.getContext('2d');
  const box = wrap.querySelector('.screen-box');

  function fit() {
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.min(r.width / w, r.height / h);
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.style.width = w * scale + 'px';
    canvas.style.height = h * scale + 'px';
    canvas.width = Math.round(w * scale * dpr);
    canvas.height = Math.round(h * scale * dpr);
    g.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
  }
  const ro = new ResizeObserver(fit);
  ro.observe(box);
  fit();

  const keys = {};
  const pressHandlers = [];
  function makeBtn(spec, parent) {
    const b = document.createElement('button');
    b.className = 'pad-btn' + (spec.small ? ' small' : '');
    b.innerHTML = spec.label;
    b.dataset.id = spec.id;
    if (spec.color) b.style.background = spec.color;
    const down = e => { e.preventDefault(); b.setPointerCapture && b.setPointerCapture(e.pointerId); if (!keys[spec.id]) { keys[spec.id] = true; pressHandlers.forEach(f => f(spec.id)); } b.classList.add('down'); };
    const up = e => { e.preventDefault(); keys[spec.id] = false; b.classList.remove('down'); };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
    parent.appendChild(b);
    return b;
  }
  const btns = {};
  const groups = [[left, wrap.querySelector('.pad-l')], [right, wrap.querySelector('.pad-r')]];
  for (const [specs, el] of groups) {
    for (const row of specs) {
      const r = document.createElement('div');
      r.className = 'pad-row';
      for (const spec of (Array.isArray(row) ? row : [row])) {
        if (!spec) { const sp = document.createElement('div'); sp.className = 'pad-gap'; r.appendChild(sp); continue; }
        btns[spec.id] = makeBtn(spec, r);
      }
      el.appendChild(r);
    }
  }

  // Keyboard (handy on a laptop for grown-ups testing).
  const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'a', z: 'a', x: 'b', c: 'c', v: 'd', Enter: 'a' };
  const kd = e => { const id = KEYMAP[e.key]; if (!id) return; e.preventDefault(); if (!keys[id]) { keys[id] = true; pressHandlers.forEach(f => f(id)); } };
  const ku = e => { const id = KEYMAP[e.key]; if (id) keys[id] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);

  return {
    canvas, g, w, h, keys, btns,
    onPress(f) { pressHandlers.push(f); },
    destroy() { ro.disconnect(); removeEventListener('keydown', kd); removeEventListener('keyup', ku); },
    /** Convert a pointer event to logical canvas coordinates. */
    toLocal(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * w, y: (e.clientY - r.top) / r.height * h }; },
  };
}

/** Calls cb('left'|'right'|'up'|'down'|'tap') for swipes and taps on el. */
export function swipes(el, cb, { min = 24 } = {}) {
  let sx = 0, sy = 0, t0 = 0, fired = false;
  el.addEventListener('pointerdown', e => { e.preventDefault(); sx = e.clientX; sy = e.clientY; t0 = performance.now(); fired = false; });
  el.addEventListener('pointermove', e => {
    if (fired || !t0) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > min) {
      fired = true;
      cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }
  });
  el.addEventListener('pointerup', () => { if (!fired && t0 && performance.now() - t0 < 300) cb('tap'); t0 = 0; });
}

/** requestAnimationFrame loop with dt in seconds; pauses while the tab is hidden. */
export function gameLoop(step) {
  let raf = 0, last = performance.now(), alive = true;
  function f(now) {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!document.hidden) step(dt);
    raf = requestAnimationFrame(f);
  }
  raf = requestAnimationFrame(f);
  return () => { alive = false; cancelAnimationFrame(raf); };
}

/** Our SVG characters as canvas images (data URLs work offline). */
const spriteCache = {};
export function sprite(name, mood = 'happy') {
  const k = name + ':' + mood;
  if (!spriteCache[k]) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(character(name, { mood }).replace('<svg ', '<svg width="200" height="205" '));
    spriteCache[k] = img;
  }
  return spriteCache[k];
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Simple particle bursts drawn on the game canvas. */
export function particles() {
  let list = [];
  const COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#FF7EB6'];
  return {
    burst(x, y, n = 16, power = 220, colors = COLORS) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = power * (0.3 + Math.random() * 0.7);
        list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.5, c: colors[(Math.random() * colors.length) | 0], s: 3 + Math.random() * 5 });
      }
    },
    update(dt) {
      for (const p of list) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt; }
      list = list.filter(p => p.life > 0);
    },
    draw(g) {
      for (const p of list) { g.globalAlpha = Math.min(1, p.life * 2); g.fillStyle = p.c; g.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
      g.globalAlpha = 1;
    },
  };
}

/** Floating text like "POW!" or "+10". */
export function popups() {
  let list = [];
  return {
    add(text, x, y, color = '#FFD23F', size = 34) { list.push({ text, x, y, color, size, life: 1 }); },
    update(dt) { for (const p of list) { p.y -= 50 * dt; p.life -= dt; } list = list.filter(p => p.life > 0); },
    draw(g) {
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const p of list) {
        const s = p.size * (1 + (1 - p.life) * 0.3);
        g.globalAlpha = Math.min(1, p.life * 2);
        g.font = `900 ${s}px Nunito, system-ui, sans-serif`;
        g.lineWidth = 6; g.strokeStyle = '#2B2140'; g.strokeText(p.text, p.x, p.y);
        g.fillStyle = p.color; g.fillText(p.text, p.x, p.y);
      }
      g.globalAlpha = 1;
    },
  };
}

export function hudText(g, text, x, y, { size = 26, align = 'left', color = '#fff' } = {}) {
  g.font = `900 ${size}px Nunito, system-ui, sans-serif`;
  g.textAlign = align; g.textBaseline = 'top';
  g.lineWidth = 5; g.strokeStyle = 'rgba(43,33,64,.85)'; g.strokeText(text, x, y);
  g.fillStyle = color; g.fillText(text, x, y);
}

/** A chunky cartoon star (vector, so it looks the same on every tablet). */
export function drawStar(g, x, y, r, color = '#FFD23F') {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = color; g.fill();
  g.lineWidth = Math.max(1.5, r * 0.14); g.lineJoin = 'round'; g.strokeStyle = '#E09A00'; g.stroke();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x - r * 0.2, y - r * 0.25, r * 0.18, r * 0.1, -0.6, 0, 7); g.fill();
}
