// Every moment in the film lives here. A note like "title is a beat late" changes one line.
window.TIMING = {
  film: { duration: 12, fps: 30 },
  beat: 0.5, // seconds in one "beat" when a note says "a beat late".
  scenes: {
    library: { start: 0, dur: 2.7 },
    proof: { start: 2.7, dur: 5.3 },
    close: { start: 8, dur: 4 },
  },
  cues: {
    library_in: 0,
    library_label: 0.8,
    proof_setup: 2.88,
    hero_in: 4.8,
    hero_label: 5.92,
    close_in: 8.08,
  },
};
