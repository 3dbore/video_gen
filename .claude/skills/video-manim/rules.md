# Craft rules for math animation

Used by `/video-manim`. Brand, canvas, safe zones and timing are fixed by the workspace (see `SKILL.md`). These rules decide how the math moves.

Priority when rules conflict: **1. Mathematical correctness → 2. The brand and the film's `spec.md` → 3. Continuity → 4. Clarity → 5. Beauty.**

---

## 1. Story

- **One idea per scene.** If describing it needs "and", split it. This matches the film's one-point rule.
- Each scene runs: **question or puzzle → build the parts one at a time → payoff, held → hand-off to the next scene.**
- **Show before tell.** The picture appears first. Its label or equation follows within about a second, never before.
- **Earn every equation.** It appears after the viewer has seen the geometry that produces it, and it is derived on screen by transforming from the picture, not printed.
- **End on the answer** and hold it. The hero number or result holds longest.
- Remove anything that carries no meaning. If deleting it changes nothing about understanding, delete it.
- **Number scenes and beats in the storyboard and the code** (`hook`, `hook.2`, class `Hook`, method `beat_2_rotate_axes`) so a note can say "fix hook.2". Keep short notes per scene in the storyboard (purpose, insight, risk) and let the storyboard change as the story improves. These numbers and notes do not appear on screen: the copy block already carries "SCENE 0X · NAME" and the progress bar.

---

## 2. Continuity (the core craft rule)

**Connected concepts must be connected visually. Do not cut, wipe or fade everything between two ideas that share an object, a quantity or a geometry.**

| Beat A → beat B | Transition |
|---|---|
| Same object, new representation (vector → coordinates, point → equation) | `Transform` / `ReplacementTransform` / `TransformMatchingTex`; keep the object's identity |
| Same space, new viewpoint (orbit view → ground view) | Move the camera, or move the frame, along one continuous path |
| Same quantity, new coordinate system | Animate the frame itself: the axes rotate, shift or scale while the point stays still, then relabel |
| Change of scale (planet → city → observer) | Continuous zoom; labels update during the move |
| Cause → effect | A visible link (arrow, trace, pulse) from cause to effect, then the change |
| Unrelated chapters | Only here: a short clear (0.4 to 0.8 s) on the scene cut |

1. **Object permanence.** An object in beat A and beat B is the same Python object or an explicit transform of it. Never `FadeOut` something and re-create it identically.
2. **A link between the two beats.** Give every transition a visible tie: an anchor object that stays put, a shared motion, a shared colour, or a match-cut between similar shapes. An anchor is the usual choice but it is not required. Pick whichever makes the connection clearest, and skip the anchor when it would feel forced.
3. **Change one thing at a time.** Camera, frame and representation change in turn, or staggered with `lag_ratio`, not all at once.
4. **Show the frame change, don't announce it.** For a coordinate-system change, turn the old axes into the new ones with the point fixed. Dim the old axes to a ghost (opacity about 0.2) instead of deleting them.
5. **Mid-transition frames must be valid states.** Interpolate rotations on the sphere (slerp or `path_arc`), not by straight-line angle. Take a still at the middle of each transition and look at it.
6. **Match point counts before morphing** (`align_points`, a shared parametrisation) to avoid twisting.
7. **Dim, don't delete.** When focus moves on, drop earlier elements to 15 to 30% opacity. Remove them with a short fade only when they would clutter.
8. **Labels follow their objects** (`always_redraw`, updaters) and change through a transform, not by swapping.
9. **Hand-off.** The last beat of a scene sets up the first beat of the next where the film's cut allows: same field, same camera, same object. A hard cut at a scene change is fine, as the film's pacing needs it.

Worked example, satellite position to horizontal coordinates (the observer is the anchor): Earth view with the line of sight → grow the local East, North and Up axes at the observer → move the camera down along one arc to the ground view while the Earth curves away → the horizon plane fades in as the camera tilts and the satellite sits on the same vector → drop its projection on the horizon, draw the azimuth arc from North, then the elevation arc → the numbers appear last, from the arcs.

---

## 3. Mathematical correctness

- **Compute, don't eyeball.** Positions, angles and sizes come from formulas in named functions, never from hand-tuned values.
- **One source of truth.** Anything that animates is a `ValueTracker`, and everything derived (positions, arcs, labels) is built from it with updaters. Never animate the derived pieces separately.
- **Verify before rendering.** Assert key results in code (round-trip a conversion, unit-vector norms, angle ranges). A wrong picture must fail loudly, not render.
- **Say the conventions**: units, handedness, zero reference (azimuth from North, clockwise), and whether the diagram is to scale.
- **Shown numbers equal computed numbers.** Use `DecimalNumber` tied to the tracker, or format from the same variable.
- **Numbers from the film's data** come from `data.json` through `figure()`. Record every shown number in `numbers.md`.
- **Symbols are defined on first use** and colour-coded to the part of the picture they stand for.

---

## 4. Pacing

`spec.md` sets the film's pace and wins over these defaults. The film cuts every 1.3 to 2.4 s on a phone, so a math beat is short.

| Beat | Typical `run_time` |
|---|---|
| Emphasis (pulse, highlight) | 0.3 to 0.6 s |
| Introduce an object | 0.5 to 1.0 s |
| Transform or representation change | 0.8 to 1.5 s |
| Camera or frame change | 1.5 to 3.0 s |
| Derivation step | 1.0 to 2.0 s |
| Hold after the key result | 1.5 s or more |

- **Ease meaningful motion** (`smooth`, `ease_in_out_sine`). Linear only for constant physical motion (orbits, time sliders).
- **Stagger** unrelated motions (`LaggedStart`, `lag_ratio` 0.1 to 0.3).
- **Hold** after each important change long enough to read it: about 0.3 s per short word, at least 1 s per new equation.
- **No dead air**: a static frame longer than 3 s should have something subtly alive or be an intentional hold.
- **Land on the word.** Each step's cue is the transcript time of the word that names it.

---

## 5. Camera and 3D

- A camera move is choreography: plan the start pose, the end pose and the duration, and ease both ends. Never snap.
- Interpolate orientation with quaternions or on the sphere. Check mid-move frames for gimbal flips.
- Labels in 3D: HUD text uses fixed-in-frame mobjects. Labels on points face the camera.
- Depth cues: shading or opacity, thin axes with arrowheads, a ground plane or grid.
- Offset coplanar surfaces slightly to avoid z-fighting, and check that nothing crosses the camera.
- Keep the subject near the middle of the stage during a move, and leave room for labels.

---

## 6. Layout and margins

**Hard rule: nothing meaningful sits close to an edge.** In pixels at 1080 x 1920:

| Edge | Keep clear |
|---|---|
| Top | 220 px |
| Bottom | 380 px, and when the scene shows a copy block, everything ends 40 px above it (the stage, 952 x 920 px) |
| Left and right | 64 px |

- These cover everything: labels, equations, notes, images, arrows, and the extremes of 3D objects as the camera projects them. Use the full bounding box including stroke width and shadow.
- Position with the constants (`STAGE`, `FULL`), never with defaults like `to_edge()` with no buff.
- **Moving content is checked at its extremes**: start, end and the worst mid-transition frame.
- **Fit before you place.** If content is too large for the stage, scale it down, don't let it touch the edge.
- **Bleed is allowed** only for backgrounds, grids and ambient shapes, and is marked in a comment. Anything the viewer must read stays inside.
- **Place by relation** (`next_to`, `align_to`, `arrange`, `surround` with a `buff`). Hard-coded coordinates are for data-driven positions.
- **One focal point per beat.** Fill at most about 60% of the stage. Whitespace is a feature, as in `DESIGN.md`.
- **Layering**: field → grid → geometry → annotations → labels on top.
- **No overlaps**: labels clear of lines and of each other. Leader lines for far labels. Run a still and look.
- **Re-layout by animation**: when something new appears, move the existing items with `.animate`, never let them jump.

---

## 7. Colour and type (see `SKILL.md` for the fixed brand values)

- **Semantic colour, defined once per film.** Each concept keeps one colour for the whole film (observer, satellite, East, North, Up, and so on). Never reuse a colour for another meaning. Chartreuse is for the element that moves or matters in this beat.
- Three to five semantic colours plus the field's neutral. Contrast pairs follow `DESIGN.md` section 3. Never rely on red against green alone.
- **Consistent line weights**: 3 px geometry, 5 px focus, 1 px grid.
- **Consistent motion language**: the same kind of event always gets the same animation (a new vector grows, a new label fades in with a small rise, emphasis is an `Indicate`).
- **Equations**: transform with `TransformMatchingTex` (isolate shared terms), colour each symbol like its object, highlight the term being discussed and dim the rest, reveal term by term.
- Text appears after the object it names and leaves with it. Keep text to names, units and the core statement.

---

## 8. Images inside the math

- Use an image only when it adds meaning geometry cannot: a real satellite, a map under a plot, a texture on a globe. Real parts and real hands stay in the HTML layers.
- Sources: files the person supplied, generated assets, or licensed material. If a file is missing, use a labelled placeholder and say which file is needed. Never invent a file. Credit it in `CREDITS.md` when the licence asks.
- Prefer SVG for diagrams. A raster must be at least as large in pixels as it appears. Crop to a radius token and match brightness to the palette.
- Link the image to the model: cross-fade into the drawing of the same thing, shrink into the point it stands for, or pin it to the object.
- Bring it in and take it out smoothly, and hold it at least 1.5 s.

---

## 9. Code

- One file per scene or per related set; one class per scene; methods named after beats.
- Constants at the top. Helpers for repeated patterns (`make_axes`, `camera_to`, `transition_to_frame`).
- Deterministic: seed any randomness, no wall-clock time. `config.disable_caching = True`.
- Keep updaters cheap and pure. Change points with `become` or point updates instead of creating mobjects inside an updater.
- Small diffs when iterating: change only what the note asks, re-render only the affected clip.

---

## 10. Never

- Hard cut or `FadeOut(*self.mobjects)` between related ideas.
- Re-creating an identical object after deleting it.
- A camera that snaps to a pose.
- The final equation shown first, with no derivation.
- A shown number that was typed by hand and does not come from a formula or `data.json`.
- A colour that is not in `design.md`, or any Manim named colour.
- A word set in a fallback font because Geom is missing.
- Text, images or key objects inside the safe zones' margins.
- Playback speed changed to make a clip fit.
- Rendering a clip without looking at stills.

---

## 11. Check before the clip goes in the film

**Maths**
- [ ] Every shown value is computed from the same source as the geometry, or comes from `data.json`.
- [ ] Conventions are stated or obvious. Assertions pass.

**Continuity**
- [ ] Every link between connected ideas is a transform, a camera move or a frame move.
- [ ] No object deleted and re-created. Mid-transition stills look valid.

**Brand and layout**
- [ ] `--lint` is clean. Geom confirmed installed.
- [ ] Stills show nothing inside the safe zones, including the worst mid-transition frame.
- [ ] Text at least 28 px, one focal point per beat, no overlaps.

**Timing**
- [ ] Every step lands on its cue. The clip is exactly the scene's `dur` long.
- [ ] Key results hold at least 1.5 s. Easing applied.

**Delivery**
- [ ] Clip is 1080 x 1920 at 30 fps, silent, in `scene/manim/`.
- [ ] `numbers.md` lists every shown number and its source.
