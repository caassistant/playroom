// Word bank: English + European Portuguese (pt-PT) + Afrikaans.
// Used for the "bonus words" bubble so the kids hear the same word in other languages.

export const COLORS = {
  red:    { en: 'red',    pt: 'vermelho',     af: 'rooi',   hex: '#FF4B4B' },
  orange: { en: 'orange', pt: 'laranja',      af: 'oranje', hex: '#FF9F1C' },
  yellow: { en: 'yellow', pt: 'amarelo',      af: 'geel',   hex: '#FFD23F' },
  green:  { en: 'green',  pt: 'verde',        af: 'groen',  hex: '#3BB273' },
  blue:   { en: 'blue',   pt: 'azul',         af: 'blou',   hex: '#3A86FF' },
  purple: { en: 'purple', pt: 'roxo',         af: 'pers',   hex: '#8E6CEF' },
  pink:   { en: 'pink',   pt: 'cor-de-rosa',  af: 'pienk',  hex: '#FF7EB6' },
  brown:  { en: 'brown',  pt: 'castanho',     af: 'bruin',  hex: '#9A6237' },
  black:  { en: 'black',  pt: 'preto',        af: 'swart',  hex: '#2B2140' },
  white:  { en: 'white',  pt: 'branco',       af: 'wit',    hex: '#FFFFFF' },
};

export const SHAPES = {
  circle:   { en: 'circle',   pt: 'círculo',   af: 'sirkel' },
  square:   { en: 'square',   pt: 'quadrado',  af: 'vierkant' },
  triangle: { en: 'triangle', pt: 'triângulo', af: 'driehoek' },
  star:     { en: 'star',     pt: 'estrela',   af: 'ster' },
  heart:    { en: 'heart',    pt: 'coração',   af: 'hart' },
};

export const NUMBERS = [
  null,
  { en: 'one',   pt: 'um',     af: 'een' },
  { en: 'two',   pt: 'dois',   af: 'twee' },
  { en: 'three', pt: 'três',   af: 'drie' },
  { en: 'four',  pt: 'quatro', af: 'vier' },
  { en: 'five',  pt: 'cinco',  af: 'vyf' },
  { en: 'six',   pt: 'seis',   af: 'ses' },
  { en: 'seven', pt: 'sete',   af: 'sewe' },
  { en: 'eight', pt: 'oito',   af: 'agt' },
  { en: 'nine',  pt: 'nove',   af: 'nege' },
  { en: 'ten',   pt: 'dez',    af: 'tien' },
];

// Picture words. Emoji are built into the tablet, so no image downloads are needed.
export const THINGS = {
  cat:   { e: '🐱', pt: 'gato',      af: 'kat' },
  dog:   { e: '🐶', pt: 'cão',       af: 'hond' },
  cow:   { e: '🐮', pt: 'vaca',      af: 'koei' },
  pig:   { e: '🐷', pt: 'porco',     af: 'vark' },
  duck:  { e: '🦆', pt: 'pato',      af: 'eend' },
  frog:  { e: '🐸', pt: 'rã',        af: 'padda' },
  lion:  { e: '🦁', pt: 'leão',      af: 'leeu' },
  fish:  { e: '🐟', pt: 'peixe',     af: 'vis' },
  bear:  { e: '🐻', pt: 'urso',      af: 'beer' },
  fox:   { e: '🦊', pt: 'raposa',    af: 'jakkals' },
  hen:   { e: '🐔', pt: 'galinha',   af: 'hen' },
  owl:   { e: '🦉', pt: 'coruja',    af: 'uil' },
  bat:   { e: '🦇', pt: 'morcego',   af: 'vlermuis' },
  bug:   { e: '🐛', pt: 'inseto',    af: 'gogga' },
  horse: { e: '🐴', pt: 'cavalo',    af: 'perd' },
  snake: { e: '🐍', pt: 'cobra',     af: 'slang' },
  zebra: { e: '🦓', pt: 'zebra',     af: 'sebra' },
  mouse: { e: '🐭', pt: 'rato',      af: 'muis' },
  sheep: { e: '🐑', pt: 'ovelha',    af: 'skaap' },
  monkey:{ e: '🐵', pt: 'macaco',    af: 'aap' },
  rabbit:{ e: '🐰', pt: 'coelho',    af: 'haas' },
  elephant:{ e: '🐘', pt: 'elefante', af: 'olifant' },
  apple: { e: '🍎', pt: 'maçã',      af: 'appel' },
  banana:{ e: '🍌', pt: 'banana',    af: 'piesang' },
  grapes:{ e: '🍇', pt: 'uvas',      af: 'druiwe' },
  orange:{ e: '🍊', pt: 'laranja',   af: 'lemoen' },
  pear:  { e: '🍐', pt: 'pera',      af: 'peer' },
  sun:   { e: '☀️', pt: 'sol',       af: 'son' },
  moon:  { e: '🌙', pt: 'lua',       af: 'maan' },
  star:  { e: '⭐', pt: 'estrela',   af: 'ster' },
  tree:  { e: '🌳', pt: 'árvore',    af: 'boom' },
  bus:   { e: '🚌', pt: 'autocarro', af: 'bus' },
  car:   { e: '🚗', pt: 'carro',     af: 'motor' },
  ship:  { e: '🚢', pt: 'navio',     af: 'skip' },
  train: { e: '🚆', pt: 'comboio',   af: 'trein' },
  hat:   { e: '🎩', pt: 'chapéu',    af: 'hoed' },
  cup:   { e: '☕', pt: 'chávena',   af: 'koppie' },
  bed:   { e: '🛏️', pt: 'cama',      af: 'bed' },
  box:   { e: '📦', pt: 'caixa',     af: 'boks' },
  egg:   { e: '🥚', pt: 'ovo',       af: 'eier' },
  cake:  { e: '🎂', pt: 'bolo',      af: 'koek' },
  milk:  { e: '🥛', pt: 'leite',     af: 'melk' },
  drum:  { e: '🥁', pt: 'tambor',    af: 'trom' },
  house: { e: '🏠', pt: 'casa',      af: 'huis' },
  chair: { e: '🪑', pt: 'cadeira',   af: 'stoel' },
  ball:  { e: '⚽', pt: 'bola',      af: 'bal' },
  robot: { e: '🤖', pt: 'robô',      af: 'robot' },
};

export const PRAISE = ['Well done!', 'Great job!', 'Amazing!', 'You did it!', 'Super!', 'Brilliant!', 'Fantastic!', 'Wow!'];
export const PRAISE_X = { pt: 'Muito bem!', af: 'Baie goed!' };

export const pick = a => a[(Math.random() * a.length) | 0];
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
