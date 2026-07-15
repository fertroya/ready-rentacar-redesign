/**
 * Feature flags for the redesign mock.
 * Defaults: READY_DATA.features
 * Override: ?ff=insuranceMatrix  or  ?ff=-insuranceMatrix
 * Persist: localStorage ready_ff (comma list, prefix - to force off)
 */
(function () {
  const STORAGE_KEY = "ready_ff";

  function defaults() {
    return { ...(window.READY_DATA?.features || {}) };
  }

  function parseList(raw) {
    return String(raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function fromStorage() {
    try {
      return parseList(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  }

  function fromQuery() {
    try {
      return parseList(new URL(location.href).searchParams.get("ff"));
    } catch {
      return [];
    }
  }

  /** Resolve enabled map (query wins over storage over defaults). */
  function resolve() {
    const out = defaults();
    fromStorage().forEach((token) => {
      if (token.startsWith("-")) out[token.slice(1)] = false;
      else out[token] = true;
    });
    fromQuery().forEach((token) => {
      if (token.startsWith("-")) out[token.slice(1)] = false;
      else out[token] = true;
    });
    return out;
  }

  function isEnabled(name) {
    return Boolean(resolve()[name]);
  }

  function setEnabled(name, on) {
    const list = fromStorage().filter((t) => t !== name && t !== `-${name}`);
    list.push(on ? name : `-${name}`);
    try {
      localStorage.setItem(STORAGE_KEY, list.join(","));
    } catch {
      /* ignore */
    }
  }

  function toggle(name) {
    const next = !isEnabled(name);
    setEnabled(name, next);
    return next;
  }

  window.READY_FLAGS = { isEnabled, setEnabled, toggle, resolve, STORAGE_KEY };
})();
