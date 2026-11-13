// Confetti (canvas) and pop-able balloons.
import { sfx } from './audio.js';

const canvas = document.getElementById('fx');
const c2d = canvas.getContext('2d');
const COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#FF7EB6'];
let parts = [];
let running = false;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
addEventListener('resize', resize);

function loop() {
  c2d.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
  for (const p of parts) {
    p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    c2d.save();
    c2d.globalAlpha = Math.min(1, p.life / 30);
    c2d.translate(p.x, p.y); c2d.rotate(p.rot);
    c2d.fillStyle = p.color;
    if (p.shape === 0) c2d.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    else if (p.shape === 1) { c2d.beginPath(); c2d.arc(0, 0, p.s / 2.6, 0, Math.PI * 2); c2d.fill(); }
    else { // little star
      c2d.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? p.s / 4 : p.s / 1.8; const a = i * Math.PI / 5; c2d.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c2d.fill();
    }
    c2d.restore();
  }
  if (parts.length) requestAnimationFrame(loop); else { running = false; c2d.clearRect(0, 0, innerWidth, innerHeight); }
}

/** Burst of confetti from a point (defaults to screen centre). */
export function confetti({ x = innerWidth / 2, y = innerHeight / 2, count = 80, power = 12, spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
  if (reduced) count = Math.min(count, 20);
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - .5) * spread;
    const v = power * (0.4 + Math.random() * 0.8);
    parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0.28, drag: 0.985,
      rot: Math.random() * 6, vr: (Math.random() - .5) * .4, s: 8 + Math.random() * 10,
      color: COLORS[(Math.random() * COLORS.length) | 0], shape: (Math.random() * 3) | 0, life: 160 + Math.random() * 80,
    });
  }
  if (!running) { running = true; requestAnimationFrame(loop); }
}

/** Big celebration: cannons from both bottom corners plus a burst in the middle. */
export function bigConfetti() {
  confetti({ x: 0, y: innerHeight, count: 90, power: 22, angle: -Math.PI / 3, spread: .7 });
  confetti({ x: innerWidth, y: innerHeight, count: 90, power: 22, angle: -Math.PI * 2 / 3, spread: .7 });
  setTimeout(() => confetti({ count: 70, power: 14 }), 250);
}

/** Small "well done" sparkle at an element. */
export function sparkleAt(el, count = 30) {
  const r = el.getBoundingClientRect();
  confetti({ x: r.left + r.width / 2, y: r.top + r.height / 2, count, power: 8 });
}

const BALLOON_COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#2EC4B6', '#3A86FF', '#8E6CEF', '#FF7EB6'];

function balloonSVG(color) {
  return `<svg viewBox="0 0 110 150"><path d="M55 112 Q50 130 58 150" stroke="#8a7f99" stroke-width="2" fill="none"/>
  <ellipse cx="55" cy="55" rx="46" ry="54" fill="${color}"/>
  <path d="M48 106 L62 106 L55 116Z" fill="${color}"/>
  <ellipse cx="38" cy="34" rx="10" ry="16" fill="#fff" opacity=".45" transform="rotate(-25 38 34)"/></svg>`;
}

/**
 * Balloons float up the screen; tap to pop. Returns a stop() function.
 * onPop(count) is called each time a balloon pops.
 */
export function balloons(container, { total = 12, onPop } = {}) {
  let made = 0, popped = 0, stopped = false;
  const live = new Set();
  function spawn() {
    if (stopped || made >= total) return;
    made++;
    const b = document.createElement('div');
    b.className = 'balloon';
    const color = BALLOON_COLORS[(Math.random() * BALLOON_COLORS.length) | 0];
    b.innerHTML = balloonSVG(color);
    const w = Math.min(130, Math.max(90, innerWidth / 7));
    b.style.width = w + 'px'; b.style.height = w * 1.36 + 'px';
    const x = 10 + Math.random() * (container.clientWidth - w - 20);
    b.style.left = x + 'px';
    container.appendChild(b);
    const speed = 1.3 + Math.random() * 1.2;
    const sway = Math.random() * Math.PI * 2;
    let y = 0;
    const st = { b, alive: true };
    live.add(st);
    function step() {
      if (!st.alive || stopped) return;
      y -= speed;
      const sx = Math.sin(sway + y / 60) * 16;
      b.style.transform = `translate(${sx}px, ${y}px)`;
      if (-y > container.clientHeight + w * 1.6) { st.alive = false; b.remove(); live.delete(st); if (made < total + 6) { made--; spawn(); } return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      if (!st.alive) return;
      st.alive = false; live.delete(st);
      sfx.pop();
      const r = b.getBoundingClientRect();
      confetti({ x: r.left + r.width / 2, y: r.top + r.height * .4, count: 26, power: 7 });
      b.remove();
      popped++;
      onPop && onPop(popped);
    });
    setTimeout(spawn, 500 + Math.random() * 600);
  }
  spawn();
  return () => { stopped = true; for (const s of live) { s.alive = false; s.b.remove(); } live.clear(); };
}

export function wobble(el) {
  el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble');
  setTimeout(() => el.classList.remove('wobble'), 550);
}
export function bounce(el) {
  el.classList.remove('bounce'); void el.offsetWidth; el.classList.add('bounce');
  setTimeout(() => el.classList.remove('bounce'), 650);
}
