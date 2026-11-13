// Our own original cast, designed with the "three-read rule":
//  1. Silhouette: each one is recognisable as a solid shape (cat ears / turtle dome / robot antenna / octopus tentacles).
//  2. Colour: 2–3 dominant colours each, all different from each other.
//  3. Detail: only big, simple features (eyes, cheeks, smile) that still read at small sizes.
// Round shapes everywhere = friendly and safe.
//
// character(name, { mood, outline }) returns an SVG string.
// mood: 'happy' | 'cheer' | 'sleep' | 'think'
// outline: true gives a colouring-book version (white regions with data-region attributes).

export const CAST = {
  mango:  { name: 'Mango',  kind: 'cat',     color: '#FF9F1C' },
  tumble: { name: 'Tumble', kind: 'turtle',  color: '#3BB273' },
  bo:     { name: 'Bo',     kind: 'robot',   color: '#FF5A5F' },
  zuzu:   { name: 'Zuzu',   kind: 'octopus', color: '#8E6CEF' },
};

const INK = '#2B2140';

function face({ lx, rx, ey, my, mood, ink = INK, eyeR = 9, mouthW = 12 }) {
  let eyes = '', mouth = '';
  if (mood === 'cheer') {
    eyes = [lx, rx].map(x => `<path d="M${x - eyeR} ${ey + 3} Q${x} ${ey - eyeR - 2} ${x + eyeR} ${ey + 3}" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    mouth = `<path d="M${(lx + rx) / 2 - mouthW - 2} ${my - 2} Q${(lx + rx) / 2} ${my + mouthW * 1.8} ${(lx + rx) / 2 + mouthW + 2} ${my - 2} Z" fill="${ink}"/>
             <ellipse cx="${(lx + rx) / 2}" cy="${my + mouthW * .75}" rx="${mouthW * .55}" ry="${mouthW * .35}" fill="#FF7E9A"/>`;
  } else if (mood === 'sleep') {
    eyes = [lx, rx].map(x => `<path d="M${x - eyeR} ${ey} Q${x} ${ey + eyeR} ${x + eyeR} ${ey}" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
    mouth = `<ellipse cx="${(lx + rx) / 2}" cy="${my + 4}" rx="5" ry="6" fill="${ink}"/>`;
  } else if (mood === 'think') {
    eyes = [lx, rx].map(x => `<circle cx="${x}" cy="${ey}" r="${eyeR}" fill="${ink}"/><circle cx="${x + eyeR * .35}" cy="${ey - eyeR * .45}" r="${eyeR * .38}" fill="#fff"/>`).join('');
    mouth = `<circle cx="${(lx + rx) / 2 + 3}" cy="${my + 5}" r="5" fill="none" stroke="${ink}" stroke-width="4"/>`;
  } else {
    eyes = [lx, rx].map(x => `<circle cx="${x}" cy="${ey}" r="${eyeR}" fill="${ink}"/><circle cx="${x + eyeR * .3}" cy="${ey - eyeR * .35}" r="${eyeR * .36}" fill="#fff"/>`).join('');
    mouth = `<path d="M${(lx + rx) / 2 - mouthW} ${my} Q${(lx + rx) / 2} ${my + mouthW} ${(lx + rx) / 2 + mouthW} ${my}" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }
  return eyes + mouth;
}

function cheeks(lx, rx, y, outline) {
  if (outline) return '';
  return `<ellipse cx="${lx}" cy="${y}" rx="9" ry="6" fill="#FF7EB6" opacity=".45"/><ellipse cx="${rx}" cy="${y}" rx="9" ry="6" fill="#FF7EB6" opacity=".45"/>`;
}

function make(parts, outline) {
  // parts: [region, defaultFill, svgShapeWithoutFill]
  const stroke = `stroke="${INK}" stroke-width="${outline ? 4 : 0}" stroke-linejoin="round"`;
  return parts.map(([region, fill, shape]) =>
    shape.replace('/>', ` ${outline ? `fill="#FFFFFF" class="region" data-region="${region}"` : `fill="${fill}"`} ${stroke}/>`)
  ).join('');
}

function mango(mood, outline) {
  const body = make([
    ['tail', '#FF9F1C', `<ellipse cx="160" cy="148" rx="12" ry="32" transform="rotate(35 160 148)"/>`],
    ['body', '#FF9F1C', `<ellipse cx="100" cy="160" rx="46" ry="34"/>`],
    ['belly', '#FFE7C2', `<ellipse cx="100" cy="168" rx="25" ry="20"/>`],
    ['feet', '#FFE7C2', `<ellipse cx="76" cy="190" rx="15" ry="8"/>`],
    ['feet', '#FFE7C2', `<ellipse cx="124" cy="190" rx="15" ry="8"/>`],
    ['ears', '#FF9F1C', `<path d="M42 84 Q38 22 56 14 Q72 18 100 46 Z"/>`],
    ['ears', '#FF9F1C', `<path d="M158 84 Q162 22 144 14 Q128 18 100 46 Z"/>`],
    ['inner-ears', '#FF7EB6', `<path d="M54 62 Q52 34 60 28 Q72 32 88 46 Z"/>`],
    ['inner-ears', '#FF7EB6', `<path d="M146 62 Q148 34 140 28 Q128 32 112 46 Z"/>`],
    ['head', '#FF9F1C', `<circle cx="100" cy="88" r="56"/>`],
    ['stripe', '#E07A00', `<path d="M88 34 Q100 30 112 34 L106 52 Q100 55 94 52 Z"/>`],
    ['muzzle', '#FFE7C2', `<ellipse cx="100" cy="112" rx="26" ry="18"/>`],
  ], outline);
  return body + cheeks(66, 134, 104, outline) +
    face({ lx: 78, rx: 122, ey: 84, my: 112, mood, mouthW: 10 }) +
    `<path d="M93 101 Q100 98 107 101 L100 108 Z" fill="${outline ? INK : '#FF5A8A'}"/>`;
}

function tumble(mood, outline) {
  const parts = make([
    ['legs', '#9BD770', `<ellipse cx="44" cy="172" rx="20" ry="15"/>`],
    ['legs', '#9BD770', `<ellipse cx="156" cy="172" rx="20" ry="15"/>`],
    ['head', '#9BD770', `<circle cx="100" cy="60" r="42"/>`],
    ['shell', '#3BB273', `<path d="M28 168 Q28 88 100 88 Q172 88 172 168 Z"/>`],
    ['spots', '#2A8A55', `<circle cx="100" cy="128" r="18"/>`],
    ['spots', '#2A8A55', `<circle cx="62" cy="146" r="12"/>`],
    ['spots', '#2A8A55', `<circle cx="138" cy="146" r="12"/>`],
    ['spots', '#2A8A55', `<circle cx="72" cy="110" r="9"/>`],
    ['spots', '#2A8A55', `<circle cx="128" cy="110" r="9"/>`],
    ['rim', '#FFD23F', `<rect x="22" y="160" width="156" height="20" rx="10"/>`],
  ], outline);
  return parts + cheeks(70, 130, 70, outline) + face({ lx: 82, rx: 118, ey: 52, my: 70, mood, mouthW: 9, eyeR: 8 });
}

function bo(mood, outline) {
  const parts = make([
    ['antenna', '#B8C0CC', `<rect x="96" y="22" width="8" height="28" rx="4"/>`],
    ['bulb', '#FFD23F', `<circle cx="100" cy="20" r="12"/>`],
    ['ears', '#B8C0CC', `<rect x="26" y="74" width="18" height="34" rx="8"/>`],
    ['ears', '#B8C0CC', `<rect x="156" y="74" width="18" height="34" rx="8"/>`],
    ['arms', '#B8C0CC', `<ellipse cx="44" cy="160" rx="13" ry="20" transform="rotate(20 44 160)"/>`],
    ['arms', '#B8C0CC', `<ellipse cx="156" cy="160" rx="13" ry="20" transform="rotate(-20 156 160)"/>`],
    ['feet', '#B8C0CC', `<rect x="62" y="180" width="30" height="16" rx="8"/>`],
    ['feet', '#B8C0CC', `<rect x="108" y="180" width="30" height="16" rx="8"/>`],
    ['body', '#FF5A5F', `<rect x="56" y="134" width="88" height="52" rx="18"/>`],
    ['button', '#FFD23F', `<circle cx="100" cy="160" r="11"/>`],
    ['head', '#FF5A5F', `<rect x="40" y="46" width="120" height="92" rx="30"/>`],
    ['screen', '#24324A', `<rect x="56" y="62" width="88" height="60" rx="18"/>`],
  ], outline);
  const ink = outline ? INK : '#5EF2FF';
  return parts + face({ lx: 80, rx: 120, ey: 86, my: 102, mood, ink, eyeR: 9, mouthW: 11 });
}

function zuzu(mood, outline) {
  const parts = make([
    ['tentacles', '#8E6CEF', `<ellipse cx="58" cy="158" rx="15" ry="34" transform="rotate(28 58 158)"/>`],
    ['tentacles', '#8E6CEF', `<ellipse cx="142" cy="158" rx="15" ry="34" transform="rotate(-28 142 158)"/>`],
    ['tentacles', '#8E6CEF', `<ellipse cx="86" cy="168" rx="14" ry="30" transform="rotate(8 86 168)"/>`],
    ['tentacles', '#8E6CEF', `<ellipse cx="114" cy="168" rx="14" ry="30" transform="rotate(-8 114 168)"/>`],
    ['head', '#8E6CEF', `<path d="M38 118 Q38 28 100 28 Q162 28 162 118 Q162 150 100 150 Q38 150 38 118 Z"/>`],
    ['spots', '#B9A2FF', `<circle cx="72" cy="58" r="9"/>`],
    ['spots', '#B9A2FF', `<circle cx="96" cy="44" r="6"/>`],
    ['spots', '#B9A2FF', `<circle cx="60" cy="84" r="5"/>`],
    ['bow', '#FF7EB6', `<path d="M132 42 Q146 20 158 36 Q150 52 132 42 Q118 22 108 36 Q116 54 132 42 Z"/>`],
    ['bow-knot', '#FF4F9A', `<circle cx="132" cy="40" r="7"/>`],
  ], outline);
  return parts + cheeks(66, 134, 116, outline) + face({ lx: 80, rx: 120, ey: 98, my: 116, mood, eyeR: 11, mouthW: 11 });
}

const DRAW = { mango, tumble, bo, zuzu };

export function character(name, { mood = 'happy', outline = false, cls = '' } = {}) {
  const fn = DRAW[name] || mango;
  let extra = '';
  if (mood === 'sleep' && !outline) extra = `<text x="150" y="40" font-size="30" font-weight="900" fill="#9AA6FF">z</text><text x="168" y="20" font-size="22" font-weight="900" fill="#9AA6FF">z</text>`;
  return `<svg class="${cls}" viewBox="0 0 200 205" xmlns="http://www.w3.org/2000/svg" aria-label="${CAST[name]?.name || ''}">${fn(mood, outline)}${extra}</svg>`;
}

/* ---- Extra colouring pages (simple shapes, big regions for little fingers) ---- */
export const PICTURES = {
  rocket: () => make([
    ['flame', '#FF9F1C', `<path d="M82 160 Q100 205 118 160 Z"/>`],
    ['fin', '#FF5A5F', `<path d="M66 120 L40 168 L72 156 Z"/>`],
    ['fin', '#FF5A5F', `<path d="M134 120 L160 168 L128 156 Z"/>`],
    ['body', '#F4F4F8', `<path d="M100 14 Q144 56 136 160 L64 160 Q56 56 100 14 Z"/>`],
    ['nose', '#FF5A5F', `<path d="M100 14 Q122 34 128 52 L72 52 Q78 34 100 14 Z"/>`],
    ['window', '#3A86FF', `<circle cx="100" cy="92" r="20"/>`],
    ['stripe', '#FFD23F', `<rect x="66" y="128" width="68" height="14"/>`],
  ], true),
  flower: () => make([
    ['stem', '#3BB273', `<rect x="94" y="110" width="12" height="80" rx="6"/>`],
    ['leaf', '#3BB273', `<ellipse cx="72" cy="160" rx="24" ry="11" transform="rotate(-25 72 160)"/>`],
    ['leaf', '#3BB273', `<ellipse cx="128" cy="150" rx="24" ry="11" transform="rotate(25 128 150)"/>`],
    ...[0, 60, 120, 180, 240, 300].map(a => ['petals', '#FF7EB6', `<ellipse cx="100" cy="42" rx="20" ry="30" transform="rotate(${a} 100 78)"/>`]),
    ['middle', '#FFD23F', `<circle cx="100" cy="78" r="22"/>`],
  ], true),
  house: () => make([
    ['sun', '#FFD23F', `<circle cx="166" cy="32" r="20"/>`],
    ['wall', '#FFE7C2', `<rect x="40" y="90" width="120" height="96"/>`],
    ['roof', '#FF5A5F', `<path d="M28 96 L100 30 L172 96 Z"/>`],
    ['door', '#8E5B3A', `<rect x="86" y="132" width="30" height="54" rx="6"/>`],
    ['window', '#3A86FF', `<rect x="52" y="110" width="26" height="26" rx="4"/>`],
    ['window', '#3A86FF', `<rect x="124" y="110" width="26" height="26" rx="4"/>`],
    ['grass', '#3BB273', `<rect x="6" y="186" width="188" height="16" rx="8"/>`],
  ], true),
  fish: () => make([
    ['tail', '#FF9F1C', `<path d="M140 100 L190 64 L182 100 L190 136 Z"/>`],
    ['fin', '#FF9F1C', `<path d="M86 66 Q104 32 128 64 Z"/>`],
    ['body', '#2EC4B6', `<ellipse cx="96" cy="100" rx="58" ry="40"/>`],
    ['stripe', '#FFD23F', `<path d="M96 61 Q112 100 96 139 L80 136 Q94 100 80 64 Z"/>`],
    ['bubble', '#BDE7FF', `<circle cx="28" cy="52" r="12"/>`],
    ['bubble', '#BDE7FF', `<circle cx="44" cy="26" r="8"/>`],
  ], true) + `<circle cx="62" cy="92" r="7" fill="${INK}"/><path d="M42 108 Q50 116 58 110" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};

export function pictureSVG(id) {
  if (DRAW[id]) return character(id, { outline: true });
  return `<svg viewBox="0 0 200 205" xmlns="http://www.w3.org/2000/svg">${PICTURES[id]()}</svg>`;
}
