// Every moment in the film lives here. A note like "title is a beat late" changes one line.
window.TIMING = {
  film: { duration: 55, fps: 30 },
  beat: 0.5, // seconds in one "beat" when a note says "a beat late". The motion job sets this from the spec.
  scenes: {
    hook: { start: 0, dur: 6 },
    namanya_promise: { start: 6, dur: 7 },
    dari_mars: { start: 13, dur: 8 },
    tenaga_nuklir: { start: 21, dur: 7 },
    isinya: { start: 28, dur: 6 },
    uji_teknologi: { start: 34, dur: 6 },
    jadwal: { start: 40, dur: 7 },
    penutup: { start: 47, dur: 8 },
  },
  cues: {
    hook_in: 0,
    namanya_promise_in: 6.2,
    dari_mars_in: 13.2,
    tenaga_nuklir_in: 21.2,
    isinya_in: 28.2,
    uji_teknologi_in: 34.2,
    jadwal_in: 40.2,
    penutup_in: 47.2,
  },
};
