---
name: video-manim
description: Math animation sub-step of the Motion job. Builds mathematical beats (equations, vectors, coordinate systems, functions, geometry, derivations) in Manim, in the 3D BORE look and on the film's timing, and hands HyperFrames a finished clip. Use from /video-motion when a beat is mathematical. Never for ordinary scenes.
argument-hint: "<project id> <scene id>"
---

# Math with Manim: writes `scene/manim/<scene>.mp4`

Manim draws **only the mathematical beats**. Everything else in the film, including title, copy, logo, progress bar, captions, photos, footage and the end card, stays in HyperFrames. A Manim clip is one layer of one scene, and the Motion job still owns `scene/index.html`.

Read `rules.md` in this folder for the craft: continuity, correctness, pacing, camera, composition. This file says how the craft fits this workspace.

## When a beat is math

Use Manim when the beat's idea **is** a mathematical object changing: an equation being derived, a vector or point moving between coordinate systems, a function or curve being drawn, a geometric construction, a unit conversion shown as a transformation. If a few labelled boxes and arrows say it, that is a diagram, and HyperFrames does it with GSAP. If the proof is a real test or measurement, film it (`DESIGN-VIDEO.md`: illustration never replaces proof).

A brief writer can flag a beat by starting its `ON SCREEN:` line with `[math]`. The Motion job decides the rest from the content, and says which beats it chose and why in `spec.md` under `## Look`.

## The order of work

1. **Storyboard in `projects/<id>/manim/storyboard.md` before any code.** Number scenes and beats the same way as the film (`hook`, `hook.2`), add a short note per scene (purpose, the one insight, a risk), and list the images and the numbers each beat needs. The storyboard may mix text, sketches and notes, and may change as the story takes shape.
2. **Read the film's files**: `design.md` (colours, type), `data.json` (numbers), `scene/timing.js` (scene length and cues), `voice/transcript.json` (which word each step lands on), `story.md` (the one point).
3. **Add cues to `timing.js`** for each step inside the clip, named after what happens (`vec_rotate`, `eq_result`), on the word that names it. Never use a bare number in a Manim scene for a time. Those cues belong to `/video-direct` like any other.
4. **Set up the project folder** (`projects/<id>/manim/`): copy `templates/common.py` next to your scenes. Run `python common.py --selftest projects/<id>` once, then check that Geom is installed (`require_font`).
5. **Build one beat at a time.** Render a draft (`manim -r 540,960 --fps 30 --media_dir projects/<id>/work/manim <file>.py <Scene>`), open stills with Read, fix, then the next beat.
6. **Lint**: `python common.py --lint <file>.py projects/<id>`. Fix every colour it reports.
7. **Final render** of the clip at 1080 x 1920, 30 fps, copy it to `scene/manim/<scene>.mp4`. Render one clip at a time, in the background (see Machine limits in `CLAUDE.md`).
8. **Embed it** in `scene/index.html` (below), run `npx hyperframes check`, then take stills at the start, the middle of each transition, and the end.

## What the brand fixes (do not choose)

- **Canvas and safe zones.** 1080 x 1920, 1 Manim unit = 120 px. Nothing meaningful in the top 220 px, the bottom 380 px, or within 64 px of the sides. `common.py` gives you `STAGE` (952 x 920 px, above the copy block, used when the scene shows a headline) and `FULL` (952 x 1320 px, when the math owns the scene). Use `check_margins` at the start, the end and the worst mid-transition frame of every beat.
- **Look.** The math layer takes the **Style A** line language from `DESIGN-VIDEO.md` section 3.1: 3 px Navy outlines, hard 10 px shadows with no blur, a hairline grid, Chartreuse only on the one element that moves or matters, Blush as one small spark. It is flat, not isometric, unless the idea is genuinely 3D. See section 3.3 there.
- **Colour.** Only colours that are in `design.md`, taken through `Brand()`. No Manim named colours (`BLUE`, `WHITE`...) and no default stroke or text colour: `lint` catches them. The HyperFrames gate cannot see inside a video, so this lint is the only check on a clip's colours.
- **Field.** The clip's background is the exact brand field of its scene (`BoreScene.FIELD`). The clip covers the whole canvas, so no seam can show between the clip and the HTML field. If you want an alpha clip instead, test it with one still first.
- **Type.** Geom for every word and label, sentence case, nothing below 28 px (the phone floor in `/video-motion`). The copy block's Label eyebrow is HTML and is the only smaller text. Equations are the exception: LaTeX has no Geom, so `MathTex` uses the TeX font and is the only place the brand family does not apply. The person confirms the equation font once per brand (see Decisions below).
- **Numbers.** Every figure shown comes from `data.json` through `figure(...)`, or is computed in the scene from figures that do, with the formula in the scene's docstring. Write each shown number and where it came from in `projects/<id>/manim/numbers.md`. Pure maths constants and symbols (2, π, exponents) need no source. Never type a measured value, a price or a spec by hand.
- **No duplicate chrome.** The copy block already shows "SCENE 0X · NAME" and the progress bar. The Manim clip draws neither. Scene numbers, notes and counters are for the storyboard and the code. A step counter such as "Step 2 of 4" inside the math is allowed when the derivation has real steps, small, inside the stage.
- **Images.** Photos, footage and logos go in HTML layers **above** the clip (the clip is opaque, so nothing can sit under it), cropped to a radius token and timed from `timing.js` like any other element. Only put an image inside Manim when it is mapped onto the geometry (a globe texture, a map under a plot). It stays inside the margins, is cropped to a radius token, and its source is in `CREDITS.md` when the licence needs it.
- **One idea and one moving element per scene** still holds. In a derivation the moving element is the step being explained, and the rest dims to 20% instead of staying bright.
- **Pace.** Hard cuts only on scene changes. Inside a clip, transitions between connected mathematical ideas are continuous (rules.md section 2). Pacing comes from `spec.md`, which wins over rules.md's default timings.

## Timing contract

The clip begins at its scene's `start` and lasts exactly its `dur`. In the scene, `self.hold_until("cue")` and `self.play_to("cue", ...)` make every step finish on its cue, and `self.finish()` holds the last frame to the full `dur`. If a beat is too long for its slot, the helper stops with the number of seconds over, so fix the beat or change the cue in `timing.js`, never the playback speed.

A timing note ("the vector is a beat late") changes a cue in `timing.js`. Cues that fall inside a Manim clip mean the clip must be rendered again. After any `/video-direct` change inside a math scene, re-render that clip, then run the stills.

## Embedding in HyperFrames

Put `data-scene` on the `<video>` itself, so `runtime.js` gives it the scene's start and duration from `timing.js`:

```html
<video class="clip" data-scene="vektor_satelit" src="manim/vektor_satelit.mp4"
       muted playsinline style="object-fit: cover; z-index: 1"></video>
```

- Silent: the clip is `muted`. Narration and effects come from the voice and sound jobs.
- The logo, top bar, copy block and progress bar sit above it (higher z-index) as usual.
- Only the clip is timed. Do not wrap it in a timed element.
- This embedding has not been rendered in this workspace yet. The first math film starts with a one-scene smoke test (a short clip, `npx hyperframes check`, a still, a draft) before anything else is built.

## Finish

```bash
python projects/<id>/manim/common.py --lint projects/<id>/manim/<file>.py projects/<id>
npx hyperframes check projects/<id>/scene
node tools/video.mjs done <id> motion
```

Tell the person which beats are Manim, what was rendered, and anything in `numbers.md` that is computed rather than sourced.

## Decisions that belong to the person

Ask once, early, and record the answer in `design.md` under `## This film` (or in the brand file if it is permanent):

1. Is the math layer approved as a third kind of illustration next to Style A and Style B? (`DESIGN-VIDEO.md` 3.3 is a proposal until they say yes.)
2. Which font for equations, since Geom has no maths glyphs?
3. Whether a math beat may appear inside a Style B reel. By default it may not.
