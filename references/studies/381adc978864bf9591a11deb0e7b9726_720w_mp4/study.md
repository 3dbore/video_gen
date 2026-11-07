# Study: 381adc978864bf9591a11deb0e7b9726_720w.mp4

736x414, 60 fps, 14.05s, with music (133.3 bpm measured). No speech. A kinetic typography piece ending on a placeholder logo. All frames read, every 0.5s.

## 1. Pacing
- `measure cuts` lists 9 cuts and 10 shots. Two of them are not scene changes: 3.1/3.133 is one transition split in two (the 0.03s shot), and 10.983 is a reposition inside the "DOUBLE DOWN" scene.
- Treating those as one transition and one scene gives 8 scenes split by 7 changes at 1.55, 3.1, 5.233, 7.417, 9.8, 11.467, 12.783.
- Scene lengths: 1.55, 1.55, 2.13, 2.18, 2.38, 1.67, 1.32, 1.27s. Median 1.61s, shortest 1.27s.
- Slows through the middle (2.13 to 2.38s from 3.1 to 9.8), then tightens to the logo (1.67, 1.32, 1.27s).
- Raw cuts per 10s: 6.4. Scene changes per 10s: 5.0.

## 2. First motion
First change at 0.35s on black ("Hello" enters, `measure curve` start_s 0.35). The frame is empty before that, so the first thing the eye gets is motion, and the line is readable by about 1.0s (judged).

## 3. Cut rhythm
Hard cuts only between scenes (judged from frames). Every scene change flips the field between near-black and near-white, so the cut reads even when the type is small. Within a scene the type keeps drifting, then holds: `measure events` holds of 1.03s at 1.783, 0.5s at 4.417, 0.7s at 7.633, 1.12s at 11.617, 1.22s at 12.817.

## 4. Text behavior
- Lines enter from opposite sides and converge ("Hello" from the left, "world!" from the right). "HOW DESIGN..." does the same line by line, with alternating offsets.
- Extreme scale contrast between scenes: a caption-sized sentence, then a word filling the width. No scene uses the middle sizes.
- Weight or style change marks the key word ("explore." bold, "on cycles." italic).
- One idea per scene.

## 5. Easing feel
Snappy out, with no bounce. `measure curve` on "Hello world" (0.3-1.5s): height 0.333s circ.out with 2.5% overshoot; x 0.467s power2.out with 0% overshoot, rmse 0.046. Frames confirm a fast entry and a soft settle. The whole entry runs 0.35 to about 1.12s. A second curve over the 5.2-7.4s window only reported the hard cut, so its numbers were discarded.

## 6. Payoff
Logo centred on a plain light field at 12.783s, held to the end (1.27s, hold measured 1.22s). The device is stillness after 12s of drift.

## 7. Rules to copy
- First motion by 0.35s, starting from a near-empty frame.
- Every scene change also changes the field colour.
- One idea per scene, held 1.3 to 2.4s.
- Lines enter from opposite sides and settle in under 0.8s, power2.out, without visible bounce.
- A key word is marked by weight, not by a new colour.
- The logo scene is the stillest in the film and holds at least 1.2s.

## 8. Things NOT to copy
Its wording, its flower glyph, the mirrored-text flip gag, its black and white palette, its italics where the brand has none, and its placeholder logo.
