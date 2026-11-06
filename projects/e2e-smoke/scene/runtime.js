// Connects timing.js and data.js to the composition. Load after the scene markup.
(function () {
  const T = window.TIMING;
  const D = window.DATA;

  // A typo in a cue name must break loudly, not silently animate at the wrong moment.
  window.cue = function (name) {
    if (!(name in T.cues)) throw new Error('timing.js has no cue "' + name + '"');
    return T.cues[name];
  };
  window.scene = function (name) {
    if (!(name in T.scenes)) throw new Error('timing.js has no scene "' + name + '"');
    return T.scenes[name];
  };

  const root = document.querySelector('[data-composition-id]');
  root.dataset.duration = T.film.duration;

  document.querySelectorAll('[data-scene]').forEach(function (el) {
    const s = window.scene(el.dataset.scene);
    el.dataset.start = s.start;
    el.dataset.duration = s.dur;
  });

  document.querySelectorAll('[data-figure]').forEach(function (el) {
    const f = D.figures[el.dataset.figure];
    if (!f) throw new Error('data.json has no figure "' + el.dataset.figure + '"');
    el.textContent = f.display;
  });

  window.__timelines = window.__timelines || {};
})();
