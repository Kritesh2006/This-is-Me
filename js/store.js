/* store.js — tiny, failure-proof persistence.
   Storage can throw (private mode, blocked cookies); the site must
   work identically without it, so every access is guarded. */

function safe(kind) {
  try { const s = window[kind]; const k = '__t'; s.setItem(k, '1'); s.removeItem(k); return s; } catch { return null; }
}
const local = safe('localStorage');
const session = safe('sessionStorage');
const mem = new Map();

export function get(key, fallback, where = 'local') {
  const s = where === 'session' ? session : local;
  try {
    const raw = s ? s.getItem('ron:' + key) : mem.get(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function set(key, value, where = 'local') {
  const s = where === 'session' ? session : local;
  const raw = JSON.stringify(value);
  try { s ? s.setItem('ron:' + key, raw) : mem.set(key, raw); } catch { mem.set(key, raw); }
}

/* Upgrades and garage unlocks earned on the road. */
export const unlocks = {
  all() { return new Set(get('unlocks', [])); },
  has(id) { return this.all().has(id); },
  add(id) { const s = this.all(); if (s.has(id)) return false; s.add(id); set('unlocks', [...s]); return true; },
};
