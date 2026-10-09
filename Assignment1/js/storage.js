// Thin, failure-safe wrapper around localStorage. Every other module goes through this.
window.CF = window.CF || {};

CF.storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (err) {
      console.warn(`[storage] could not read "${key}"`, err);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[storage] could not write "${key}"`, err);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage] could not remove "${key}"`, err);
    }
  },
};
