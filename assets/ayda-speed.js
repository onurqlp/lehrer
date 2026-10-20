/* AYDA Lehrer front-end performance coordinator. Apps Script is unchanged. */
(function () {
  'use strict';
  if (window.AYDA_SPEED) return;
  // Short-lived and per-credential. Never use localStorage or sessionStorage here.
  const TTL = Object.freeze({
    overview: 8000, trackingSummary: 10000, studentRoster: 20000,
    adminStudents: 15000, teacherMonthly: 20000, makeupList: 15000,
    reminders: 12000, contactDirectory: 30000, lessonHomework: 12000,
    homeworkTasks: 12000, studentNotes: 8000, feedbackInbox: 8000,
    teacherFeedback: 8000, ping: 0, integrityStatus: 0,
    backupStatus: 0, vaultExport: 0
  });
  const MAX_ENTRIES = 28;
  const cache = new Map();
  const pending = new Map();
  const metrics = {network: 0, reused: 0, joined: 0, invalidations: 0};
  let generation = 0;
  function clone(value) {
    if (value === undefined || value === null || typeof value !== 'object') return value;
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }
  function invalidate() {
    generation += 1;
    cache.clear();
    pending.clear();
    metrics.invalidations += 1;
  }
  function identity(action, credential, params) {
    const p = params && typeof params === 'object' ? params : {};
    return JSON.stringify([action, String(credential || ''), Object.keys(p).sort().map(k => [k, String(p[k])])]);
  }
  function run(action, credential, params, request) {
    if (typeof request !== 'function') return Promise.reject(new TypeError('İstek işlevi eksik.'));
    const knownRead = Object.prototype.hasOwnProperty.call(TTL, action);
    if (!knownRead) {
      // Writes must never be cached, deduplicated or silently retried.
      invalidate();
      metrics.network += 1;
      return Promise.resolve().then(request).finally(invalidate);
    }
    const key = identity(action, credential, params);
    const now = Date.now();
    const entry = cache.get(key);
    if (entry && entry.until > now) {
      metrics.reused += 1;
      return Promise.resolve(clone(entry.value));
    }
    if (entry) cache.delete(key);
    const inFlight = pending.get(key);
    if (inFlight) {
      metrics.joined += 1;
      return inFlight.then(clone);
    }
    const startGeneration = generation;
    metrics.network += 1;
    const task = Promise.resolve().then(request).then(value => {
      if (generation === startGeneration && TTL[action] > 0) {
        cache.set(key, {until: Date.now() + TTL[action], value: clone(value)});
        if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
      }
      return value;
    }).finally(() => {
      if (pending.get(key) === task) pending.delete(key);
    });
    pending.set(key, task);
    return task.then(clone);
  }
  window.AYDA_SPEED = Object.freeze({
    run, invalidate,
    stats: () => Object.freeze({...metrics, cached: cache.size, pending: pending.size})
  });
  for (const eventName of ['ayda:saved', 'ayda:admin-data-updated', 'ayda:logout']) {
    window.addEventListener(eventName, invalidate);
  }
  // An explicit user refresh always contacts Google, regardless of cache age.
  document.addEventListener('click', event => {
    const button = event.target && event.target.closest && event.target.closest('button, a');
    if (!button) return;
    const label = String(button.id || '') + ' ' + String(button.getAttribute('aria-label') || '') + ' ' + String(button.textContent || '').slice(0, 55);
    if (/refresh|yenile|reload/i.test(label)) invalidate();
  }, true);
})();