---
name: video-motion
description: Motion job of the video pipeline. Builds every frame as a deterministic HyperFrames composition in scene/index.html, with all moments in scene/timing.js. Use from /video, or when a note says a scene looks wrong.
argument-hint: "<project id>"
---

# Motion: writes `scene/index.html` and `scene/timing.js`

Read `spec.md`, `story.md`, `data.json`, `brief.md`, and `voice/transcript.json` if there's a voice. If `design.md` exists, read it too: it decides colours, fonts and layout, and `spec.md` decides pacing. Then read:

- `/video-design` for colour, type and layout
- `/motion-design` for timing, easing and choreography
- `/hyperframes` for the composition contract. It wins on anything about how HyperFrames works
- `/hyperframes-registry` before hand-building a named effect, such as a chart, a transition or kinetic type
- `/video-manim` for any beat whose idea is a mathematical object changing (see "Math beats" below). Nothing else uses Manim

`new` already scaffolded the composition from the brief's beats. Replace the placeholder look. Keep the wiring.

## The contract

```html
<script src="gsap.min.js"></script>
<script src="timing.js"></script>
<script src="data.js"></script>
...
<section class="clip" data-scene="drop">
  <div class="hero" data-figure="price_drop"></div>
</section>
...
<script src="runtime.js"></script>
<script>
  const tl = gsap.timeline({ paused: true });
  tl.from(".hero", { scale: 0.8, duration: 0.3, ease: "power3.out" }, cue("hero_in"));
  window.__timelines["main"] = tl;
  tl.seek(0);
</script>
```

- **Scenes** take their start and length from `timing.js`, through `data-scene`.
- **Moments** come from `cue("name")`. A bare number as a timeline position fails the gate. Name cues after what happens (`hero_in`), not when.
- **Inside a tween,** short durations can be literal. The position is what gets directed.
- **Numbers** on screen use `data-figure="id"`. Stray digits fail the gate. Use `data-allow-digits` only for text that isn't data, such as a year in a source line.
- **Runtime:** `runtime.js` must load after the scenes and before the timeline.
- **Deterministic:** no `Date.now()`, unseeded `Math.random()`, network requests or CSS animations that aren't driven by the timeline.
- **Colours:** with a `design.md`, every colour in the scene's code must be in it, or the gate fails. Transparency is fine, and "#FFB000 at 40%" counts as `#FFB000`. A scene can use `design.md` colours only. To allow another one, ask the person, then add it to this project's `design.md`, not `brand/DESIGN.md`.
- **Local assets:** put fonts and images in `scene/`. Use `@font-face` with a local file, or a font that's on the system.

## Math beats

Most scenes are HyperFrames only. A beat that is a derivation, a vector or point moving between coordinate systems, a function being drawn or a geometric construction goes to `/video-manim`, which returns a finished clip, `scene/manim/<scene>.mp4`. You still own `scene/index.html`:

- Name the Manim beats, and why, under `## Look` in `spec.md`.
- Add the clip as a `<video>` with `data-scene="<scene id>"`, `muted playsinline`, covering the canvas, below the logo, copy block and progress bar. `runtime.js` gives it the scene's start and length from `timing.js`.
- A clip's inner steps are cues in `timing.js`, so `/video-direct` can move them. Moving one means the clip must be rendered again.
- The colour gate cannot see inside a video, so `/video-manim` runs its own colour lint. Look at the clip's stills yourself.
- Titles, copy, logo, captions, photos, footage and the end card are never made in Manim.

## timing.js

```js
window.TIMING = {
  film: { duration: 20, fps: 30 },
  beat: 0.5,
  scenes: { hook: { start: 0, dur: 4 } },
  cues: { hook_in: 0, hero_in: 4.32 },
};
```

Set `beat` from the spec's pacing. Place cues on word times from the transcript when something should land on a word. The scenes must end exactly at `film.duration`.

## Craft

- The film must match `spec.md`: first motion, shot lengths and cut rhythm.
- If `spec.md` has `## References`, build each `moment` row at the place it names, using its measured timing. Apply it only there. Ignore `skipped` rows. Take the technique, never the clip's footage, characters or branding.
- If `spec.md` has `## Text behavior`, `## Easing feel` and `## Payoff`, follow them, and don't use anything under `## Things NOT to copy`.
- The hero number is the largest thing in the film, with the longest hold.
- Each scene needs a next action. Avoid long stretches where nothing changes.
- Respect safe areas. Vertical video needs extra room at the top and bottom for platform UI.
- Text must be readable on a phone: 28px at 1080p is the floor.
- Build all three beats before polishing any of them.

Look at it as you go. Snapshot with `npx hyperframes snapshot projects/<id>/scene --at 0.5,2,5 --output projects/<id>/work/look`, and open the images with Read.

## Finish

```bash
npx hyperframes check projects/<id>/scene
```

```bash
node tools/video.mjs done <id> motion
```
