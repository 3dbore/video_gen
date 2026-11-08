---
name: 3D BORE Video and Animation
version: 1.0
description: Rules for 3D BORE reels and animated video. Two approved illustration styles and a guide for choosing between them from the script.
extends: claude/DESIGN.md (colors, type, spacing, radius, logo and components come from there)
source: Figma file 3DBORE, page "Brand Guidelines", section "BSG Video Style Board"
status: Illustration as a video device approved by the owner, 8 Nov 2026
canvas: { width: 1080, height: 1920, ratio: "9:16" }
safe-zone: { top: 220, bottom: 380 }
styles:
  A: { name: Isometric system, figma: "VSB / Isometric / ..." }
  B: { name: Grain editorial, figma: "VSB / Grain / ..." }
---

# 3D BORE Video and Animation

Read `DESIGN.md` first. This file adds the rules for reels and animated video only. If the two files disagree, `DESIGN.md` wins for colors, type, logo and components; this file wins for video layout, illustration and motion.

Figma source: Brand Guidelines page, section **"BSG Video Style Board"**. Duplicate a template frame, never edit the original.

## 1. How to use this file (agents)

1. Read the script from Sudo, starting with "Cerita singkat" and the scene list.
2. Pick a style with section 4. Write the choice and the reason at the top of `work/<ID>_design-notes_v<N>.md`, for example: `Video style: A (Isometric system). Reason: 5 steps with settings and a material comparison.`
3. Duplicate the matching templates (section 5) and build with the shared rules (section 2) and the style rules (section 3).
4. Check against section 6 before review.

## 2. Shared rules (both styles)

- **Canvas:** 1080 x 1920 (9:16).
- **Safe zones:** keep text and logo out of the top 220 px and bottom 380 px (Instagram UI). Every template has a hidden layer `Guide / IG Reels safe zone (hidden)`; switch it on to check.
- **Top bar:** y 96, 64 px side margins. `BSG/Logo` scaled to 1.4x (259 px wide) on the left, `BSG/Tag` "REELS · 9:16" on the right. Logo colorway follows the field: White or Electric on Cobalt and Navy, Navy on light fields.
- **Copy block:** x 64, y about 1180, width 952. Eyebrow "SCENE 0X · NAME" (Label), headline (H1), one line of Lead. A CTA scene adds a `BSG/Button` (Primary).
- **Progress bar:** under the copy, one segment per scene plus a "0X/0N" counter in Label style.
- **One idea and one moving element per scene.** Sentence-case headlines.
- **Tokens only:** all text uses BSG text styles; all colors, including gradient stops, are bound to BSG variables. A Navy field sets BSG Color to **Dark** mode on the frame.
- **One style per video.** Do not mix A and B in one reel unless the owner approves it.
- **Copy:** comes from Sudo's script. Template copy is sample copy and must never ship. Facts such as lead times and prices need a source or a placeholder (`[LEAD TIME]`, `[HARGA]`).
- **Illustration supports footage, never replaces proof.** If a script needs a test, a measurement or a customer's part, film the real thing. Use illustration for intros, explainers, transitions and end cards.
- **Graphic device:** the chosen illustration style is the one device of the video. Do not add supersonic cones to an illustrated reel.

## 3. The two styles

### 3.1 Style A: Isometric system

**Feels:** precise, technical, diagrammatic. Shows how things work and connect.

**Looks like:** flat 30 degree isometric objects (printer, spool, file panel, server, parcel, parts) on a light iso grid, joined by wires with pins and small floating spheres.

- **Line:** 3 px Navy 500 outline on every edge.
- **Shadow:** hard 10 px Navy drop under each object (Navy 900 on Navy fields). No gradients, no blur.
- **Color:** faces White and Cobalt 50 to 200; body sides Cobalt 500 or 700; Chartreuse only on the element that moves or matters; Blush only as one small sphere.
- **Fields by scene:** White (hook), Cobalt (process), Navy in Dark mode (detail), Chartreuse (CTA end card).
- **Grid:** iso grid lines in Cobalt 100 (Cobalt 300 on Cobalt, Cobalt 800 on Navy), 64 px step, about 70% opacity, locked.
- **Connections:** wires run along the iso axes on the ground plane, end on a visible face of the next object, and carry arrowheads and small Chartreuse "packet" cubes.
- **Labels:** `VSB/Iso Label` (Title + Detail) on a 2 px Navy stem with a 14 px Chartreuse anchor dot. Stems point up by default, and down when a label would cover another object. Near frame edges, align the label left or right with 24 px padding.
- **Motion:** objects drop onto the grid (ease-out, about 10 px overshoot), wires draw on, packets travel along them, labels pop in (scale 0 to 100%, 200 ms). One element animates at a time. Cut every 1.5 to 2 s.

### 3.2 Style B: Grain editorial

**Feels:** warm, human, editorial. Sells one promise or one moment.

**Looks like:** one big close-up hero object (a hand holding a part, stopwatches on a build plate, a nozzle laying a line), cropped by the frame edge, with soft gradients and film grain.

- **No outlines.**
- **Gradients:** every shape uses a two-step linear gradient inside one color family. Form: White to Cobalt 300. Shadow: Navy 400 to Navy 800. Hero object: Chartreuse 300 to 700. Blush only as a tiny spark.
- **Grain:** Figma Noise effect, Monotone, Navy 900 color, size 2, density 0.55. About 30% opacity on illustration shapes; 12 to 22% on light and Cobalt fields. On Navy fields use White grain at about 8%. The field is a separate locked "Field" rectangle so it carries grain too.
- **Fields:** Cobalt 500, Navy 500 (Dark mode) or Cobalt 50 (surface/subtle). One field per scene.
- **Motion:** slow push-in from 100 to 108% across the shot, plus one secondary move (a hand turns in, a needle ticks, a nozzle glides). Grain never animates. Cut every 2 to 3 s.

## 4. Choosing a style

Choose by what the script is mainly **doing**, not by its topic.

| The script mainly... | Signals in the copy | Style |
|---|---|---|
| Explains how something works, step by step | numbered steps, "gimana caranya", process, workflow, settings, specs, tolerances, toolpath, layers | **A** |
| Shows several parts that work together | upload, quote, slice, print, check, ship; "dari file sampai rumah"; machine plus material plus part | **A** (System map template) |
| Compares options side by side | PLA vs PETG, infill 20% vs 100%, before and after on settings, a verdict with conditions | **A** |
| Makes one promise, claim or feeling | one number (lead time, price), "kamu", a result, an announcement, a hook question | **B** |
| Tells a human story | a customer, a maker, hands, a broken item fixed, a testimonial, a "finally works" moment | **B** |
| Opens or closes a video (intro, bumper, end card) | brand line, CTA only | Same style as the rest of the video |

**Tie-breakers, in order:**
1. **Objects on screen at once.** Three or more objects that must relate to each other: A. One or two: B.
2. **Numbers.** Several values to read as labels (mm, %, °C, minutes): A. One headline number: B.
3. **Series default.**
   - MITOS ATAU FAKTA: **A** (it explains evidence and compares).
   - BENERIN YUK: **B** (a human fix story).
   - BEDAH PROYEK: **A** for process and specs; **B** if the episode is mostly the customer's story.
   - A series keeps one style across episodes unless the owner changes it.
4. **Still unsure:** A for educational content, B for hooks, brand and promo posts. Mark the choice as an assumption in the design notes.

## 5. Templates in Figma

| Frame | Field | Shows |
|---|---|---|
| `VSB / Isometric / Overview` | White | Palette roles, hero printer, rules |
| `VSB / Isometric / Reel 01 Hook` | White | Printer wired to file, spool and parts |
| `VSB / Isometric / Reel 02 Process` | Cobalt | Layer stack under the nozzle |
| `VSB / Isometric / Reel 03 Material` | Navy (Dark) | Two filament spools |
| `VSB / Isometric / Reel 04 CTA` | Chartreuse | Parcel, check badge, Get a quote button |
| `VSB / Isometric / Reel 05 System map` | White | Six connected sub-systems with labels |
| `VSB / Grain / Overview` | White | Gradient palette, hand card, rules |
| `VSB / Grain / Reel 01 Hook` | Cobalt | Hand holding a printed gear |
| `VSB / Grain / Reel 02 Speed` | Navy (Dark) | Stopwatches on a build plate |
| `VSB / Grain / Reel 03 Process` | Cobalt 50 | Nozzle laying a Chartreuse line |

Component: `VSB/Iso Label` (Style A only). Navy pill, `radius/sm`, padding 12/16. Title in Label style (Chartreuse), Detail in Caption (white). Text properties Title and Detail.

Each template has a motion note under the frame with timing and moves.

## 6. Check before review

- [ ] Style chosen with section 4, and the choice plus reason written in the design notes.
- [ ] One style for the whole video, one moving element per scene.
- [ ] No text or logo inside the safe zones.
- [ ] Headline is the biggest text in every scene; contrast pairs pass (`DESIGN.md` section 3).
- [ ] All colors and gradient stops bound to variables; BSG text styles only.
- [ ] Style A: outlines and hard shadows on every object, labels clear of objects and wires.
- [ ] Style B: no outlines, grain on shapes and field, grain not animated.
- [ ] No sample copy left; unverified facts use placeholders.
- [ ] Real footage used wherever the script needs proof.

## 7. Never

- Never mix the two styles in one reel, or add supersonic cones to an illustrated reel.
- Never add outlines to Style B, or gradients and blur to Style A.
- Never use Blush as a field, or Chartreuse text on a white field.
- Never use an illustration in place of a real test, measurement or customer part.
- Never animate grain.