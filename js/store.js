// Everything is saved on this device only (localStorage). Nothing ever leaves the tablet.
const KEY = 'playroom.v1';

const DEFAULTS = {
  profiles: [
    { id: 'p1', name: 'Little Explorer', mode: 'little', avatar: 'zuzu', stars: 0, levels: {}, best: {} },
    { id: 'p2', name: 'Big Explorer', mode: 'big', avatar: 'bo', stars: 0, levels: {}, best: {} },
  ],
  settings: {
    sound: true,
    voice: true,
    langs: { pt: true, af: true },
    limitMin: 0,          // 0 = no limit
  },
  usage: { day: '', minutes: 0, extra: 0 },
};

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const s = JSON.parse(raw);
    // Merge with defaults so new settings appear after updates.
    return {
      ...clone(DEFAULTS), ...s,
      settings: { ...DEFAULTS.settings, ...s.settings, langs: { ...DEFAULTS.settings.langs, ...(s.settings || {}).langs } },
      usage: { ...DEFAULTS.usage, ...s.usage },
      profiles: (s.profiles || DEFAULTS.profiles).map((p, i) => ({ ...clone(DEFAULTS.profiles[i] || DEFAULTS.profiles[0]), ...p })),
    };
  } catch { return clone(DEFAULTS); }
}

export const state = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: play on anyway */ }
}

export function resetProgress() {
  for (const p of state.profiles) { p.stars = 0; p.levels = {}; p.best = {}; }
  save();
}

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function usageToday() {
  if (state.usage.day !== today()) { state.usage = { day: today(), minutes: 0, extra: 0 }; save(); }
  return state.usage;
}

// Ask the browser to keep our data even when storage is low.
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch {}
