// Every moment in the film lives here. A note like "title is a beat late" changes one line.
window.TIMING = {
  film: { duration: 45, fps: 30 },
  beat: 0.5, // seconds in one "beat" when a note says "a beat late". The motion job sets this from the spec.
  scenes: {
    hook: { start: 0, dur: 5 },
    desain_gratis: { start: 5, dur: 8 },
    tiga_bagian: { start: 13, dur: 9 },
    harga_motor: { start: 22, dur: 12 },
    jujur_soal_harga: { start: 34, dur: 5 },
    ajakan: { start: 39, dur: 6 },
  },
  cues: {
    hook_in: 0,
    desain_gratis_in: 5.2,
    tiga_bagian_in: 13.2,
    harga_motor_in: 22.2,
    jujur_soal_harga_in: 34.2,
    ajakan_in: 39.2,
  },
};
