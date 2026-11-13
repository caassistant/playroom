// Jigsaws: every level is a new picture, with more pieces as levels go up.
// Little (24 levels): 4 → 6 → 9 → 12 pieces. Big (24 levels): 9 → 36 tab-and-blank pieces,
// and from level 13 some pieces start turned round (tap a piece to turn it).
// A faint "ghost" of the picture shows where everything goes; drops snap when close.
import { character } from '../characters.js';

const S = 600; // source picture size (square)

function loadImg(svg) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', '<svg width="200" height="205" '));
  });
}
function grad(g, stops, x0 = 0, y0 = 0, x1 = 0, y1 = S) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}
function emoji(g, e, x, y, size) {
  g.font = `${size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(e, x, y);
}
function circle(g, x, y, r, c) { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
function stars(g, n, color = '#fff', seed = 7) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) circle(g, rnd() * S, rnd() * S, 1.5 + rnd() * 3, color);
}

// Each picture: name (spoken), and draw(g, imgs) onto a 600x600 canvas.
const PICTURES = [
  { id: 'mango', name: 'Mango the cat', chars: ['mango'], draw(g, im) {
    g.fillStyle = grad(g, [[0, '#FFF1A8'], [1, '#FFB23F']]); g.fillRect(0, 0, S, S);
    for (let i = 0; i < 12; i++) circle(g, 300 + Math.cos(i / 12 * 6.28) * 330, 300 + Math.sin(i / 12 * 6.28) * 330, 70, i % 2 ? '#FFE07A' : '#FFD0A0');
    g.fillStyle = '#7ED17E'; g.fillRect(0, 500, S, 100);
    ['🌼', '🌷', '🌸', '🌼'].forEach((e, i) => emoji(g, e, 60 + i * 160, 545, 56));
    emoji(g, '🦋', 500, 110, 64);
    if (im.mango) g.drawImage(im.mango, 100, 70, 400, 410);
  } },
  { id: 'tumble', name: 'Tumble the turtle', chars: ['tumble'], draw(g, im) {
    g.fillStyle = grad(g, [[0, '#8FD3FF'], [0.6, '#D6F0FF']]); g.fillRect(0, 0, S, S);
    circle(g, 500, 90, 55, '#FFD23F');
    g.fillStyle = '#6CC46C'; g.beginPath(); g.ellipse(150, 600, 380, 200, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#4FAF5A'; g.beginPath(); g.ellipse(520, 620, 320, 190, 0, 0, Math.PI * 2); g.fill();
    ['🌻', '🍄', '🌼'].forEach((e, i) => emoji(g, e, 70 + i * 230, 530 - (i % 2) * 20, 60));
    emoji(g, '☁️', 120, 90, 90);
    if (im.tumble) g.drawImage(im.tumble, 110, 120, 380, 390);
  } },
  { id: 'bo', name: 'Bo the robot', chars: ['bo'], draw(g, im) {
    g.fillStyle = grad(g, [[0, '#1E2A5A'], [1, '#4B3F8F']]); g.fillRect(0, 0, S, S);
    stars(g, 70);
    circle(g, 90, 110, 50, '#FF9F1C'); g.strokeStyle = '#FFD23F'; g.lineWidth = 10; g.beginPath(); g.ellipse(90, 110, 85, 22, -0.3, 0, Math.PI * 2); g.stroke();
    emoji(g, '🌙', 510, 90, 80);
    emoji(g, '🚀', 520, 500, 80);
    if (im.bo) g.drawImage(im.bo, 110, 110, 380, 390);
  } },
  { id: 'zuzu', name: 'Zuzu the octopus', chars: ['zuzu'], draw(g, im) {
    g.fillStyle = grad(g, [[0, '#5ED0F0'], [1, '#1E6FB8']]); g.fillRect(0, 0, S, S);
    for (let i = 0; i < 14; i++) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 4; g.beginPath(); g.arc(40 + (i * 97) % 560, 60 + (i * 53) % 480, 8 + (i % 4) * 6, 0, 6.3); g.stroke(); }
    g.fillStyle = '#F2D59B'; g.fillRect(0, 520, S, 80);
    ['🐠', '🐚', '🪸', '🐟'].forEach((e, i) => emoji(g, e, [80, 200, 420, 530][i], [140, 555, 545, 420][i], 64));
    if (im.zuzu) g.drawImage(im.zuzu, 120, 100, 370, 380);
  } },
  { id: 'beach', name: 'the beach', chars: ['mango'], draw(g, im) {
    g.fillStyle = grad(g, [[0, '#7FD0FF'], [1, '#D8F2FF']], 0, 0, 0, 300); g.fillRect(0, 0, S, 300);
    circle(g, 480, 100, 60, '#FFD23F');
    g.fillStyle = '#2E9FE0'; g.fillRect(0, 280, S, 130);
    g.fillStyle = 'rgba(255,255,255,.6)'; for (let x = 0; x < S; x += 60) { g.beginPath(); g.ellipse(x + 30, 300, 26, 6, 0, 0, 6.3); g.fill(); }
    g.fillStyle = '#F7D794'; g.fillRect(0, 400, S, 200);
    emoji(g, '⛵', 140, 300, 80); emoji(g, '⛱️', 470, 440, 130); emoji(g, '🦀', 300, 540, 70); emoji(g, '🐚', 90, 520, 60); emoji(g, '☁️', 150, 90, 80);
    if (im.mango) g.drawImage(im.mango, 180, 330, 200, 205);
  } },
  { id: 'farm', name: 'the farm', chars: [], draw(g) {
    g.fillStyle = grad(g, [[0, '#9FDCFF'], [1, '#E5F6FF']], 0, 0, 0, 340); g.fillRect(0, 0, S, 340);
    circle(g, 90, 90, 55, '#FFD23F');
    g.fillStyle = '#7ED17E'; g.fillRect(0, 330, S, 270);
    g.fillStyle = '#5DBB63'; g.beginPath(); g.ellipse(420, 350, 300, 90, 0, Math.PI, 0); g.fill();
    // barn
    g.fillStyle = '#E04848'; g.fillRect(300, 200, 220, 180);
    g.fillStyle = '#B23030'; g.beginPath(); g.moveTo(280, 210); g.lineTo(410, 110); g.lineTo(540, 210); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.fillRect(375, 280, 70, 100); g.strokeStyle = '#E04848'; g.lineWidth = 8; g.beginPath(); g.moveTo(375, 280); g.lineTo(445, 380); g.moveTo(445, 280); g.lineTo(375, 380); g.stroke();
    // fence
    g.fillStyle = '#C98B5A'; for (let x = 10; x < S; x += 50) g.fillRect(x, 420, 14, 70); g.fillRect(0, 435, S, 12); g.fillRect(0, 465, S, 12);
    emoji(g, '🐄', 130, 360, 110); emoji(g, '🐔', 540, 540, 70); emoji(g, '🐷', 300, 540, 80); emoji(g, '🌻', 70, 540, 70); emoji(g, '☁️', 230, 70, 80);
  } },
  { id: 'space', name: 'outer space', chars: [], draw(g) {
    g.fillStyle = grad(g, [[0, '#0E0B2E'], [1, '#3B2A7A']]); g.fillRect(0, 0, S, S);
    stars(g, 120, '#fff', 3);
    circle(g, 150, 160, 90, '#FF7EB6'); circle(g, 120, 140, 18, '#FFB3D4'); circle(g, 180, 200, 12, '#FFB3D4');
    circle(g, 460, 420, 70, '#3BB273'); g.strokeStyle = '#FFD23F'; g.lineWidth = 12; g.beginPath(); g.ellipse(460, 420, 120, 28, 0.3, 0, 6.3); g.stroke();
    circle(g, 500, 120, 40, '#FFD23F');
    emoji(g, '🚀', 260, 400, 140); emoji(g, '🛸', 470, 230, 90); emoji(g, '⭐', 90, 480, 60); emoji(g, '🌙', 330, 120, 70);
  } },
  { id: 'rainbow', name: 'the rainbow garden', chars: [], draw(g) {
    g.fillStyle = grad(g, [[0, '#BDE7FF'], [1, '#F2FBFF']]); g.fillRect(0, 0, S, S);
    const cols = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#3BB273', '#3A86FF', '#8E6CEF'];
    cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 30; g.beginPath(); g.arc(300, 470, 300 - i * 30, Math.PI, 0); g.stroke(); });
    emoji(g, '☁️', 60, 440, 130); emoji(g, '☁️', 540, 440, 130);
    g.fillStyle = '#7ED17E'; g.fillRect(0, 480, S, 120);
    ['🌷', '🌸', '🌼', '🌹', '🌷'].forEach((e, i) => emoji(g, e, 60 + i * 120, 540, 70));
    emoji(g, '🦋', 300, 330, 80); emoji(g, '🐝', 180, 120, 60);
  } },
];

// Scene helpers for the extra pictures.
function sky(g, a, b, h = S) { g.fillStyle = grad(g, [[0, a], [1, b]], 0, 0, 0, h); g.fillRect(0, 0, S, h); }
function ground(g, y, c) { g.fillStyle = c; g.fillRect(0, y, S, S - y); }
function hill(g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.fill(); }
function items(g, list) { for (const [e, x, y, sz] of list) emoji(g, e, x, y, sz); }
function tree(g, x, y, s = 1) {
  g.fillStyle = '#8E5B3A'; g.fillRect(x - 10 * s, y - 70 * s, 20 * s, 70 * s);
  g.fillStyle = '#5E9E3A'; g.beginPath(); g.ellipse(x, y - 80 * s, 80 * s, 26 * s, 0, 0, 6.3); g.fill();
}
const MORE = [
  { id: 'friends', name: 'all the friends together', draw(g, im) {
    sky(g, '#9FDCFF', '#E8F7FF'); circle(g, 520, 80, 50, '#FFD23F'); hill(g, 300, 640, 420, 260, '#7ED17E');
    items(g, [['☁️', 110, 80, 90], ['🌼', 60, 560, 50], ['🌷', 540, 560, 50]]);
    if (im.mango) g.drawImage(im.mango, 20, 250, 200, 205);
    if (im.tumble) g.drawImage(im.tumble, 380, 260, 200, 205);
    if (im.bo) g.drawImage(im.bo, 150, 130, 160, 165);
    if (im.zuzu) g.drawImage(im.zuzu, 290, 120, 160, 165);
  } },
  { id: 'party', name: 'the birthday party', draw(g) {
    sky(g, '#FFE3F1', '#FFF8E5');
    const cols = ['#FF5A5F', '#FFD23F', '#3BB273', '#3A86FF', '#8E6CEF'];
    for (let i = 0; i < 10; i++) { g.fillStyle = cols[i % 5]; g.beginPath(); g.moveTo(i * 60, 30); g.lineTo(i * 60 + 60, 30); g.lineTo(i * 60 + 30, 90); g.fill(); }
    g.fillStyle = '#C98B5A'; g.fillRect(60, 420, 480, 30); g.fillRect(90, 450, 20, 150); g.fillRect(490, 450, 20, 150);
    items(g, [['🎂', 300, 340, 170], ['🎁', 130, 380, 90], ['🎁', 470, 385, 80], ['🎈', 80, 190, 100], ['🎈', 520, 180, 100], ['🎉', 300, 150, 90], ['🧁', 200, 520, 60], ['🍭', 400, 525, 60]]);
  } },
  { id: 'fruit', name: 'the fruit bowl', draw(g) {
    sky(g, '#FFF4D6', '#FFE2B0'); g.fillStyle = '#E8B07A'; g.fillRect(0, 420, S, 180);
    g.fillStyle = '#3A86FF'; g.beginPath(); g.ellipse(300, 420, 230, 120, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#6FA8FF'; g.beginPath(); g.ellipse(300, 420, 230, 30, 0, 0, 6.3); g.fill();
    items(g, [['🍉', 190, 330, 130], ['🍍', 330, 260, 140], ['🍌', 430, 350, 110], ['🍎', 250, 400, 90], ['🍊', 360, 400, 90], ['🍇', 130, 400, 80], ['🍓', 470, 420, 70], ['🍐', 520, 520, 70], ['🍒', 80, 530, 60]]);
  } },
  { id: 'reef', name: 'the coral reef', draw(g) {
    sky(g, '#38C6F4', '#0B5FA5'); stars(g, 40, 'rgba(255,255,255,.5)', 11);
    g.fillStyle = '#F2D59B'; g.fillRect(0, 520, S, 80);
    items(g, [['🪸', 80, 470, 120], ['🪸', 520, 480, 110], ['🐠', 180, 160, 90], ['🐡', 420, 140, 90], ['🐙', 300, 360, 130], ['🐢', 470, 300, 100], ['🦈', 130, 300, 100], ['🐚', 230, 550, 50], ['⭐', 400, 555, 50]]);
  } },
  { id: 'train', name: 'the choo-choo train', draw(g) {
    sky(g, '#8FD3FF', '#E5F6FF'); hill(g, 120, 420, 260, 160, '#9BD38A'); hill(g, 480, 430, 260, 190, '#7EC46F');
    ground(g, 420, '#7ED17E'); g.fillStyle = '#8E5B3A'; g.fillRect(0, 470, S, 10); g.fillRect(0, 500, S, 10);
    for (let x = 0; x < S; x += 30) { g.fillStyle = '#6B4226'; g.fillRect(x, 465, 12, 50); }
    items(g, [['🚂', 140, 440, 130], ['🚃', 290, 445, 120], ['🚃', 430, 445, 120], ['☁️', 120, 90, 80], ['☁️', 420, 70, 70], ['🌳', 530, 330, 90], ['💨', 60, 330, 70]]);
  } },
  { id: 'snow', name: 'the snowy mountains', draw(g) {
    sky(g, '#BFE3FF', '#F2FAFF');
    g.fillStyle = '#9AB7D6'; g.beginPath(); g.moveTo(-40, 420); g.lineTo(170, 120); g.lineTo(380, 420); g.fill();
    g.fillStyle = '#8AA8C9'; g.beginPath(); g.moveTo(220, 420); g.lineTo(450, 90); g.lineTo(680, 420); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(170, 120); g.lineTo(120, 190); g.lineTo(220, 190); g.fill(); g.beginPath(); g.moveTo(450, 90); g.lineTo(390, 175); g.lineTo(510, 175); g.fill();
    ground(g, 400, '#FFFFFF'); stars(g, 60, '#fff', 5);
    items(g, [['⛄', 160, 440, 130], ['🐧', 380, 470, 90], ['🐧', 460, 480, 70], ['🎿', 300, 540, 60], ['❄️', 520, 60, 50], ['🌲', 560, 380, 80]]);
  } },
  { id: 'jungle', name: 'the jungle', draw(g) {
    sky(g, '#9FE3B0', '#2F7F4A');
    for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? '#3E9E5C' : '#2E8B4A'; g.beginPath(); g.ellipse(i * 100, 30, 110, 70, 0, 0, 6.3); g.fill(); }
    g.strokeStyle = '#6B8E23'; g.lineWidth = 6; for (const x of [120, 300, 470]) { g.beginPath(); g.moveTo(x, 40); g.quadraticCurveTo(x + 30, 220, x, 330); g.stroke(); }
    ground(g, 500, '#5C8A3A');
    items(g, [['🐒', 130, 330, 110], ['🦜', 460, 230, 100], ['🐍', 300, 520, 90], ['🦥', 300, 200, 100], ['🌴', 60, 470, 110], ['🍌', 540, 470, 70], ['🐅', 470, 480, 110]]);
  } },
  { id: 'bugs', name: 'the bug garden', draw(g) {
    sky(g, '#E3F6FF', '#C9F1C0'); ground(g, 470, '#7ED17E');
    for (const [x, c] of [[110, '#FF7EB6'], [300, '#FFD23F'], [490, '#8E6CEF']]) {
      g.fillStyle = '#3BB273'; g.fillRect(x - 6, 260, 12, 240);
      for (let i = 0; i < 6; i++) circle(g, x + Math.cos(i) * 50, 230 + Math.sin(i) * 50, 38, c);
      circle(g, x, 230, 34, '#FFF3C4');
    }
    items(g, [['🐞', 300, 230, 60], ['🐝', 200, 100, 70], ['🦋', 430, 110, 90], ['🐌', 140, 520, 70], ['🐛', 420, 540, 70], ['🐜', 280, 560, 50]]);
  } },
  { id: 'safari', name: 'the African bush', draw(g) {
    sky(g, '#FF9A5A', '#FFE29A', 400); circle(g, 300, 330, 90, '#FFD86B');
    ground(g, 380, '#E3B55B');
    for (const [x, sc] of [[110, 1.1], [500, 0.9]]) { g.fillStyle = '#5B3A22'; g.fillRect(x - 8 * sc, 230 * sc + 40, 16 * sc, 130); g.fillStyle = '#3E6B2E'; g.beginPath(); g.ellipse(x, 220 * sc + 40, 110 * sc, 28 * sc, 0, 0, 6.3); g.fill(); }
    items(g, [['🦒', 200, 330, 150], ['🐘', 420, 420, 150], ['🦓', 130, 470, 110], ['🦁', 320, 520, 100], ['🦏', 520, 530, 80]]);
  } },
  { id: 'dinos', name: 'dinosaur land', draw(g) {
    sky(g, '#FFC58A', '#FFF1D6');
    g.fillStyle = '#8B5A3C'; g.beginPath(); g.moveTo(330, 420); g.lineTo(440, 160); g.lineTo(500, 160); g.lineTo(620, 420); g.fill();
    g.fillStyle = '#FF5A2A'; g.beginPath(); g.moveTo(440, 160); g.lineTo(470, 90); g.lineTo(500, 160); g.fill();
    items(g, [['💨', 470, 60, 70]]); ground(g, 410, '#8CC66F');
    items(g, [['🦕', 170, 340, 190], ['🦖', 420, 470, 150], ['🌴', 60, 380, 110], ['🥚', 260, 540, 60], ['🌿', 540, 550, 60]]);
  } },
  { id: 'castle', name: 'the castle', draw(g) {
    sky(g, '#B9E2FF', '#F2FAFF'); hill(g, 300, 650, 420, 260, '#7ED17E');
    items(g, [['🏰', 300, 280, 280], ['🐉', 110, 140, 100], ['👑', 490, 100, 70], ['🌳', 80, 470, 90], ['🌷', 500, 520, 60], ['🦄', 470, 470, 100]]);
  } },
  { id: 'city', name: 'the city at night', draw(g) {
    sky(g, '#1B1F4B', '#3B3F8F'); stars(g, 60, '#fff', 9); emoji(g, '🌙', 510, 80, 80);
    const b = [[20, 260, 90], [120, 180, 80], [210, 300, 100], [320, 220, 90], [420, 150, 80], [510, 280, 90]];
    for (const [x, h, w] of b) {
      g.fillStyle = '#2A2F66'; g.fillRect(x, 520 - h, w, h);
      for (let yy = 520 - h + 14; yy < 500; yy += 30) for (let xx = x + 12; xx < x + w - 12; xx += 24) { g.fillStyle = (xx * yy) % 7 < 4 ? '#FFD23F' : '#4A4F8F'; g.fillRect(xx, yy, 12, 16); }
    }
    ground(g, 520, '#3A3A4A'); g.fillStyle = '#FFD23F'; for (let x = 20; x < S; x += 80) g.fillRect(x, 555, 40, 6);
    items(g, [['🚕', 200, 545, 70], ['🚌', 430, 545, 80]]);
  } },
  { id: 'soccer', name: 'the soccer match', draw(g) {
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#5CBF5C' : '#4CAF50'; g.fillRect(0, i * 75, S, 75); }
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(20, 20, 560, 560); g.beginPath(); g.moveTo(20, 300); g.lineTo(580, 300); g.stroke();
    g.beginPath(); g.arc(300, 300, 80, 0, 6.3); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(200, 20, 200, 12);
    items(g, [['🥅', 300, 80, 160], ['⚽', 300, 300, 80], ['🏃', 180, 400, 110], ['🏃‍♀️', 420, 220, 100], ['🏆', 520, 520, 80], ['🧤', 300, 150, 50]]);
  } },
  { id: 'rainy', name: 'the rainy day', draw(g) {
    sky(g, '#8FA3B8', '#D6E2EC'); items(g, [['🌧️', 150, 90, 110], ['🌧️', 430, 70, 110]]);
    g.strokeStyle = 'rgba(58,134,255,.6)'; g.lineWidth = 4; for (let i = 0; i < 40; i++) { const x = (i * 67) % S, y = 150 + (i * 41) % 300; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 24); g.stroke(); }
    ground(g, 470, '#7EAF6F'); g.fillStyle = '#5DADEC'; g.beginPath(); g.ellipse(300, 530, 160, 34, 0, 0, 6.3); g.fill();
    items(g, [['☂️', 140, 360, 150], ['🐸', 300, 510, 70], ['🦆', 430, 500, 80], ['🌈', 470, 260, 120], ['👢', 120, 520, 60]]);
  } },
  { id: 'autumn', name: 'the autumn forest', draw(g) {
    sky(g, '#FFD9A8', '#FFF2DE'); ground(g, 460, '#C98B5A');
    for (const [x, c] of [[90, '#E8702A'], [300, '#D9A400'], [510, '#C0392B']]) { g.fillStyle = '#6B4226'; g.fillRect(x - 14, 220, 28, 250); circle(g, x, 200, 100, c); circle(g, x - 50, 230, 60, c); circle(g, x + 50, 230, 60, c); }
    stars(g, 50, '#E8702A', 13);
    items(g, [['🦔', 160, 510, 80], ['🦊', 400, 500, 100], ['🍄', 280, 540, 60], ['🍂', 520, 550, 60], ['🌰', 80, 550, 50], ['🐿️', 300, 330, 70]]);
  } },
  { id: 'capetown', name: 'the flat-topped mountain by the sea', draw(g) {
    sky(g, '#7FCBFF', '#DDF3FF', 360);
    g.fillStyle = '#7A8C99'; g.beginPath(); g.moveTo(0, 360); g.lineTo(60, 300); g.lineTo(140, 140); g.lineTo(440, 140); g.lineTo(520, 260); g.lineTo(600, 300); g.lineTo(600, 360); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(290, 140, 160, 18, 0, Math.PI, 0); g.fill();
    g.fillStyle = '#2E9FE0'; g.fillRect(0, 350, S, 140); g.fillStyle = '#F7D794'; g.fillRect(0, 480, S, 120);
    items(g, [['⛵', 120, 400, 80], ['🐧', 380, 520, 80], ['🐧', 450, 530, 60], ['🪨', 250, 510, 70], ['🐋', 470, 400, 80], ['☀️', 530, 60, 70]]);
  } },
];

// The order pictures appear in, one per level.
const ORDER = ['mango', 'tumble', 'bo', 'zuzu', 'farm', 'beach', 'rainbow', 'space', 'friends', 'party', 'fruit', 'reef',
  'train', 'snow', 'jungle', 'bugs', 'safari', 'dinos', 'castle', 'city', 'soccer', 'rainy', 'autumn', 'capetown'];
const LITTLE_GRID = [[2, 2], [2, 2], [2, 2], [3, 2], [3, 2], [3, 2], [3, 2], [3, 2], [3, 3], [3, 3], [3, 3], [3, 3], [3, 3], [3, 3],
  [4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [4, 3], [4, 3]];
const BIG_GRID = [[3, 3], [3, 3], [3, 3], [4, 3], [4, 3], [4, 3], [4, 4], [4, 4], [4, 4], [4, 4], [5, 4], [5, 4], [5, 4],
  [5, 5], [5, 5], [5, 5], [6, 5], [6, 5], [6, 5], [6, 6], [6, 6], [6, 6], [6, 6], [6, 6]];

export default function start(ctx) {
  const { stage, mode } = ctx;
  const little = mode === 'little';
  const lv = Math.min(Math.max(1, ctx.level), 24);
  const [COLS, ROWS] = (little ? LITTLE_GRID : BIG_GRID)[lv - 1];
  const TABS = !little || lv >= 9;
  const ROTATE = !little && lv >= 13;          // some pieces start turned round
  const ROT_STEP = COLS === ROWS ? 90 : 180;    // non-square pieces only turn upside down
  const ALL = [...PICTURES, ...MORE];
  const thePic = ALL.find(p => p.id === ORDER[(lv - 1) % ORDER.length]) || ALL[0];
  ctx.hideMascot();
  ctx.dots(0);
  let alive = true;
  let cleanupFns = [];
  const imgs = {};

  async function ensureImages() {
    for (const k of ['mango', 'tumble', 'bo', 'zuzu']) if (!imgs[k]) imgs[k] = await loadImg(character(k, { mood: 'happy' }));
  }
  function renderPicture(pic) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    pic.draw(c.getContext('2d'), imgs);
    return c;
  }

  /* ---------- Picture picker ---------- */
  async function picker() {
    stage.innerHTML = `<div class="prompt">Pick a picture!</div>
      <div class="pics" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(42%,150px),1fr));gap:16px;width:100%;max-width:900px;overflow-y:auto;padding:6px"></div>`;
    ctx.instruct('Pick a picture to make a puzzle!');
    await ensureImages();
    if (!alive) return;
    const grid = stage.querySelector('.pics');
    for (const pic of PICTURES) {
      const b = document.createElement('button');
      b.style.cssText = 'background:#fff;border-radius:24px;box-shadow:var(--shadow);aspect-ratio:1;padding:8px;overflow:hidden';
      const im = document.createElement('img');
      im.src = renderPicture(pic).toDataURL('image/png');
      im.style.cssText = 'width:100%;height:100%;border-radius:18px;display:block;pointer-events:none';
      b.appendChild(im);
      b.onclick = () => { ctx.sfx.tap(); ctx.say(`${pic.name}!`); puzzle(pic); };
      grid.appendChild(b);
    }
  }

  /* ---------- Piece shapes ---------- */
  // bump: +1 tab sticks out, -1 blank goes in, 0 flat edge.
  function edge(path, ax, ay, bx, by, nx, ny, bump, size) {
    const P = (u, v) => [ax + (bx - ax) * u + nx * v, ay + (by - ay) * u + ny * v];
    if (!bump) { path.lineTo(bx, by); return; }
    const d = bump * size * 0.32;
    path.lineTo(...P(0.36, 0));
    path.bezierCurveTo(...P(0.28, d), ...P(0.72, d), ...P(0.64, 0));
    path.lineTo(bx, by);
  }
  function piecePath(x, y, w, h, b) {
    const p = new Path2D(), s = Math.min(w, h);
    p.moveTo(x, y);
    edge(p, x, y, x + w, y, 0, -1, b.top, s);
    edge(p, x + w, y, x + w, y + h, 1, 0, b.right, s);
    edge(p, x + w, y + h, x, y + h, 0, 1, b.bottom, s);
    edge(p, x, y + h, x, y, -1, 0, b.left, s);
    p.closePath();
    return p;
  }

  /* ---------- The puzzle ---------- */
  function puzzle(pic) {
    const src = renderPicture(pic);
    stage.innerHTML = `<div class="jz" style="position:relative;flex:1;width:100%;min-height:0;touch-action:none"></div>`;
    const area = stage.querySelector('.jz');
    const W = area.clientWidth, H = area.clientHeight;
    const landscape = W >= H;
    const B = Math.floor(landscape ? Math.min(H * 0.94, W * 0.56) : Math.min(W * 0.94, H * 0.52));
    const bx = landscape ? Math.max(8, (W * 0.6 - B) / 2) : (W - B) / 2;
    const by = landscape ? (H - B) / 2 : 4;
    const tray = landscape ? { x: bx + B + 16, y: 0, w: W - (bx + B + 16) - 4, h: H } : { x: 0, y: by + B + 12, w: W, h: H - (by + B + 12) };
    const cw = B / COLS, ch = B / ROWS, t = TABS ? 0.25 : 0;
    const dpr = Math.min(2, devicePixelRatio || 1);

    // Board: white card with a faint ghost of the picture and a soft grid
    const board = document.createElement('canvas');
    board.width = B * dpr; board.height = B * dpr;
    board.style.cssText = `position:absolute;left:${bx}px;top:${by}px;width:${B}px;height:${B}px;border-radius:14px;box-shadow:0 6px 0 rgba(0,0,0,.12);background:#fff;transition:filter .4s`;
    const bg = board.getContext('2d');
    bg.scale(dpr, dpr);
    bg.globalAlpha = 0.22; bg.drawImage(src, 0, 0, B, B); bg.globalAlpha = 1;
    area.appendChild(board);

    // Random tabs on inner edges
    const hE = Array.from({ length: ROWS - 1 }, () => Array.from({ length: COLS }, () => (Math.random() < .5 ? 1 : -1)));
    const vE = Array.from({ length: ROWS }, () => Array.from({ length: COLS - 1 }, () => (Math.random() < .5 ? 1 : -1)));
    const bumps = (r, c) => TABS ? {
      top: r === 0 ? 0 : -hE[r - 1][c], bottom: r === ROWS - 1 ? 0 : hE[r][c],
      left: c === 0 ? 0 : -vE[r][c - 1], right: c === COLS - 1 ? 0 : vE[r][c],
    } : { top: 0, bottom: 0, left: 0, right: 0 };

    // Draw the grid lines faintly on the board too
    bg.strokeStyle = 'rgba(43,33,64,.18)'; bg.lineWidth = 2;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) bg.stroke(piecePath(c * cw, r * ch, cw, ch, bumps(r, c)));

    const pw = cw * (1 + 2 * t), ph = ch * (1 + 2 * t);
    const pieces = [];
    let z = 10;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(pw * dpr); cv.height = Math.ceil(ph * dpr);
      cv.style.cssText = `position:absolute;width:${pw}px;height:${ph}px;pointer-events:none;filter:drop-shadow(0 4px 3px rgba(0,0,0,.25));transition:filter .2s, transform .15s;transform-origin:50% 50%`;
      const g = cv.getContext('2d');
      g.scale(dpr, dpr);
      const path = piecePath(t * cw, t * ch, cw, ch, bumps(r, c));
      g.save(); g.clip(path);
      g.drawImage(src, (c * cw - t * cw) / B * S, (r * ch - t * ch) / B * S, pw / B * S, ph / B * S, 0, 0, pw, ph);
      g.restore();
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2.5; g.stroke(path);
      const tx = bx + c * cw - t * cw, ty = by + r * ch - t * ch;
      cv.dataset.tx = tx; cv.dataset.ty = ty; cv.className = 'jz-piece';
      const rot = ROTATE && Math.random() < (lv >= 20 ? 0.7 : 0.45) ? ROT_STEP * (1 + ((Math.random() * (360 / ROT_STEP - 1)) | 0)) : 0;
      pieces.push({ cv, g, path, r, c, tx, ty, x: 0, y: 0, done: false, z: z++, rot });
      area.appendChild(cv);
    }
    // Lay pieces out in the tray: shrink them a little so they don't pile up (they grow when picked up).
    const order = pieces.slice().sort(() => Math.random() - .5);
    const n = order.length;
    let best = { tc: 1, sc: 0 };
    for (let tc = 1; tc <= n; tc++) {
      const tr = Math.ceil(n / tc);
      const sc = Math.min(1, (tray.w - 8) / (tc * pw * 1.02), (tray.h - 8) / (tr * ph * 1.02));
      if (sc > best.sc) best = { tc, sc };
    }
    const TS = Math.max(0.3, best.sc), tc = best.tc, tr = Math.ceil(n / tc);
    order.forEach((p, i) => {
      const gx = i % tc, gy = Math.floor(i / tc);
      const cellW = tray.w / tc, cellH = tray.h / tr;
      p.s = TS;
      p.x = tray.x + gx * cellW + cellW / 2 - pw / 2 + (Math.random() - .5) * cellW * 0.12;
      p.y = tray.y + gy * cellH + cellH / 2 - ph / 2 + (Math.random() - .5) * cellH * 0.12;
      place(p);
    });
    function place(p) { p.cv.style.left = p.x + 'px'; p.cv.style.top = p.y + 'px'; p.cv.style.zIndex = p.done ? 1 : p.z; p.cv.style.transform = `rotate(${p.rot || 0}deg) scale(${p.s || 1})`; }

    let placed = 0, misses = 0, drag = null;
    const t0 = performance.now();
    function hit(x, y) {
      // topmost unfinished piece whose shape contains the point
      const cand = pieces.filter(p => !p.done).sort((a, b) => b.z - a.z);
      for (const p of cand) {
        const sc = p.s || 1, a = -(p.rot || 0) * Math.PI / 180;
        const ux = (x - (p.x + pw / 2)) / sc, uy = (y - (p.y + ph / 2)) / sc;
        const lx = ux * Math.cos(a) - uy * Math.sin(a) + pw / 2, ly = ux * Math.sin(a) + uy * Math.cos(a) + ph / 2;
        if (lx < 0 || ly < 0 || lx > pw || ly > ph) continue;
        if (p.g.isPointInPath(p.path, lx * dpr, ly * dpr)) return p;
      }
      // forgiving: nearest piece centre within reach
      let best = null, bd = Math.min(pw, ph) * 0.4;
      for (const p of cand) { const d = Math.hypot(x - (p.x + pw / 2), y - (p.y + ph / 2)); if (d < bd) { bd = d; best = p; } }
      return best;
    }
    const local = e => { const r = area.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    area.addEventListener('pointerdown', e => {
      e.preventDefault();
      const { x, y } = local(e);
      const p = hit(x, y);
      if (!p) return;
      area.setPointerCapture(e.pointerId);
      p.z = ++z; p.s = 1; place(p);
      p.cv.style.filter = 'drop-shadow(0 12px 8px rgba(0,0,0,.3))';
      drag = { p, dx: x - p.x, dy: y - p.y, sx: x, sy: y, moved: false };
      ctx.sfx.tap();
    });
    area.addEventListener('pointermove', e => {
      if (!drag) return;
      const { x, y } = local(e);
      if (Math.hypot(x - drag.sx, y - drag.sy) > 8) drag.moved = true;
      drag.p.x = Math.max(-pw * 0.3, Math.min(W - pw * 0.7, x - drag.dx));
      drag.p.y = Math.max(-ph * 0.3, Math.min(H - ph * 0.7, y - drag.dy));
      place(drag.p);
    });
    const end = () => {
      if (!drag) return;
      const p = drag.p, moved = drag.moved; drag = null;
      p.cv.style.filter = 'drop-shadow(0 4px 3px rgba(0,0,0,.25))';
      // A tap (no drag) on a turned piece turns it.
      const onBoard = (() => { const cx = p.x + pw / 2 - bx, cy = p.y + ph / 2 - by; return cx > 0 && cy > 0 && cx < B && cy < B; })();
      if (!moved && p.rot) {
        p.rot = (p.rot + ROT_STEP) % 360;
        if (!onBoard) p.s = TS;
        ctx.sfx.flip(); place(p);
        if (!p.rot) ctx.say('That way up!');
        return;
      }
      const near = Math.hypot(p.x - p.tx, p.y - p.ty) < Math.max(cw, ch) * 0.42;
      if (near && p.rot) {
        misses++;
        place(p);
        ctx.wrong(p.cv, 'Right place! Now tap the piece to turn it the right way up.');
        return;
      }
      if (near) {
        p.done = true; p.x = p.tx; p.y = p.ty;
        p.cv.style.transition = 'left .12s, top .12s, filter .2s';
        place(p);
        p.cv.style.filter = 'none';
        placed++;
        ctx.sfx.ding();
        ctx.sparkleAt(p.cv, 16);
        if (placed === pieces.length) complete();
        else if (placed === Math.ceil(pieces.length / 2)) ctx.say('Halfway there!');
      } else {
        const cx = p.x + pw / 2 - bx, cy = p.y + ph / 2 - by;
        if (cx > 0 && cy > 0 && cx < B && cy < B) misses++;
        else { p.s = TS; place(p); }
      }
    };
    area.addEventListener('pointerup', end);
    area.addEventListener('pointercancel', end);

    function complete() {
      const secs = (performance.now() - t0) / 1000;
      // Reveal: draw the full picture on the board and pop it
      bg.globalAlpha = 1; bg.drawImage(src, 0, 0, B, B);
      pieces.forEach(p => { p.cv.style.transition = 'opacity .5s'; p.cv.style.opacity = '0'; });
      board.style.transition = 'transform .5s cubic-bezier(.3,1.6,.6,1)';
      board.style.transform = 'scale(1.04)';
      ctx.right(board);
      ctx.say(`You did it! It's ${pic.name}!`);
      const stars = little ? 3 : (misses <= pieces.length && secs < pieces.length * 12) ? 3 : 2;
      ctx.later(() => ctx.finish(stars), 2400);
    }
    if (window.__playroomTest) window.__playroomTest.jigsaw = { pieces, place, pw, ph };
    ctx.setInstruction(little ? 'Drag the pieces onto the picture!' : ROTATE ? 'Drag each piece to the right place. If a piece is turned round, tap it to turn it!' : 'Drag each piece to the right place to finish the picture!');
    ctx.later(() => ctx.say(ROTATE ? 'Some pieces are upside down! Tap a piece to turn it.' : little ? 'Drag the pieces onto the picture!' : 'Drag each piece to the right place!'), 2600);
  }

  (async () => {
    stage.innerHTML = '<div class="prompt">Getting the puzzle ready…</div>';
    await ensureImages();
    if (!alive) return;
    ctx.say(`Level ${ctx.level}: ${thePic.name}! ${COLS * ROWS} pieces.`);
    puzzle(thePic);
  })();
  return () => { alive = false; cleanupFns.forEach(f => f()); };
}
