---
name: 3D BORE
version: 1.0
description: Design system for 3D BORE, an online manufacturing brand (3D printing and CNC). Sharp, minimal, modern.
source: Figma file 3DBORE, page "Brand Guidelines", section "BSG Extended" (variable collections BSG Primitives, BSG Color, BSG Spacing, BSG Radius, BSG Type)
colors:
  cobalt-surge:        { 50: "#EEF3FE", 100: "#DAE3FC", 200: "#B4C8F9", 300: "#8BA9F6", 400: "#5E87F3", 500: "#3065EF", 600: "#2753C4", 700: "#1F4199", 800: "#162D6C", 900: "#0C193C" }
  midnight-navy:       { 50: "#EBEDF0", 100: "#D1D5DE", 200: "#A3ACBD", 300: "#707E99", 400: "#384B70", 500: "#001848", 600: "#00143B", 700: "#000F2E", 800: "#000B20", 900: "#000612" }
  blush-pop:           { 50: "#FFF0F5", 100: "#FEDEEA", 200: "#FEBDD4", 300: "#FD99BC", 400: "#FC71A2", 500: "#FB4988", 600: "#CE3C70", 700: "#A12F57", 800: "#71213D", 900: "#3F1222" }
  electric-chartreuse: { 50: "#FCFDF0", 100: "#F9FBDD", 200: "#F2F8BB", 300: "#EBF495", 400: "#E3EF6C", 500: "#DBEB42", 600: "#B4C136", 700: "#8C962A", 800: "#636A1E", 900: "#373B11" }
  neutral:             { void-black: "#0C0C0C", charcoal-ink: "#1E1E1E", graphite-smoke: "#303030", white: "#FFFFFF" }
typography:
  family: Geom
  display: { weight: 700, size: 128, lineHeight: 128, letterSpacing: "-2%" }
  h1:      { weight: 700, size: 72,  lineHeight: 80 }
  h2:      { weight: 600, size: 48,  lineHeight: 56 }
  h3:      { weight: 700, size: 36,  lineHeight: 44 }
  lead:    { weight: 300, size: 30,  lineHeight: 42 }
  body:    { weight: 300, size: 26,  lineHeight: 38 }
  body-strong: { weight: 700, size: 26, lineHeight: 38 }
  caption: { weight: 400, size: 22,  lineHeight: 30 }
  label:   { weight: 500, size: 18,  lineHeight: 24, letterSpacing: "+8%", case: uppercase }
spacing: { 4: 4, 8: 8, 12: 12, 16: 16, 24: 24, 32: 32, 48: 48, 64: 64, 96: 96, 128: 128 }
radius: { none: 0, sm: 8, md: 16, lg: 32, full: 999 }
---

# 3D BORE Design System

Reference for designers and coding agents. Sizes are px on a 1920 px design canvas; scale proportionally for other targets. Prefer tokens over raw values everywhere.

## 1. Brand

**Mission.** Making manufacturing more open to anyone. Precision engineering across 3D printing and CNC, ordered online, with open source hardware and open knowledge.

**Design vibe: Sharp, Minimal, Modern.**
- Sharp: high-contrast geometry, crisp edges, zero tolerance for slop.
- Minimal: strip visual noise so structure and function speak.
- Modern: forward-thinking, fast, borderless.

Rule of thumb: if an element does not serve precision, speed or openness, remove it.

## 2. Logo

- Lockup is a mark plus the BORE wordmark, ratio **185 : 30**. Never stretch, rotate, crop, outline or recolor outside the approved colorways.
- Colorways: Main (Cobalt mark + Chartreuse word), Cobalt, Electric (Chartreuse), Navy, White, Pink. Use White or Electric on dark or Cobalt fields, Navy on light fields.
- Clearspace: 1x on every side, where x is the height of the "o" in BORE.
- Minimum size: 120 px wide on screen (preferred 240 px), 25 mm in print.
- Meaning: the mark blends the founders' names, mirrors a fluted drill bit and cutter head, and unifies a 3D printer extruder with multi-axis CNC. The open outer aperture signals open knowledge from any direction.
- Don't: low-contrast pairings (check the ratios below), effects, shadows, busy photo backgrounds.

## 3. Color

Cobalt leads, Navy anchors, Chartreuse energizes, Blush punctuates. Step 500 of each scale is the exact brand color.

| Role | Token | Hex | RGB | CMYK (approx.) |
|---|---|---|---|---|
| Primary brand | cobalt-surge/500 | #3065EF | 48 101 239 | 80 58 0 6 |
| Foundation | midnight-navy/500 | #001848 | 0 24 72 | 100 67 0 72 |
| Accent | electric-chartreuse/500 | #DBEB42 | 219 235 66 | 7 0 72 8 |
| Spark | blush-pop/500 | #FB4988 | 251 73 136 | 0 71 46 2 |

CMYK values are computed approximations. Verify with a print proof before production.

**Proportion (approximate share of any layout):** Cobalt 35%, Navy 30%, White 20%, Chartreuse 10%, Blush 5%. Blush is for rare emphasis only and never a background.

**Accessible pairs (WCAG):**

| Foreground on background | Ratio | Grade |
|---|---|---|
| White on Cobalt 500 | 5.0 | AA |
| White on Navy 500 | 17.2 | AAA |
| Navy on Chartreuse 500 | 13.0 | AAA |
| Chartreuse on Navy 500 | 13.0 | AAA |
| Navy on Blush 500 | 5.2 | AA |
| Cobalt 500 on White | 5.0 | AA |

Do not put white text on Chartreuse or Blush, and do not put Chartreuse text on white.

### Semantic tokens (use these in UI)

| Token | Light | Dark |
|---|---|---|
| surface/default | white | midnight-navy/500 |
| surface/subtle | cobalt-surge/50 | midnight-navy/400 |
| surface/inverse | midnight-navy/500 | white |
| surface/ink | void-black | void-black |
| surface/brand | cobalt-surge/500 | cobalt-surge/500 |
| surface/accent | chartreuse/500 | chartreuse/500 |
| surface/highlight | blush-pop/500 | blush-pop/500 |
| text/primary | void-black | white |
| text/secondary | graphite-smoke | cobalt-surge/200 |
| text/inverse | white | void-black |
| text/brand | cobalt-surge/500 | cobalt-surge/300 |
| text/accent | chartreuse/500 | chartreuse/500 |
| text/highlight | blush-pop/500 | blush-pop/500 |
| border/default | cobalt-surge/200 | midnight-navy/300 |
| border/strong | void-black | white |
| action/primary | cobalt-surge/500 | cobalt-surge/500 |
| action/primary-text | white | white |
| action/secondary | chartreuse/500 | chartreuse/500 |
| action/secondary-text | void-black | void-black |

CSS convention: `--bore-<token>` with slashes replaced by hyphens, e.g. `var(--bore-surface-brand)`. Dark mode swaps the semantic layer only; never reference primitives directly in components.

## 4. Typography

Single family: **Geom** (weights 300, 400, 500, 600, 700). Fall back to a geometric sans-serif stack.

| Style | Weight | Size / Line | Use |
|---|---|---|---|
| Display | 700 | 128 / 128, -2% | Hero statements, one per layout |
| H1 | 700 | 72 / 80 | Page titles |
| H2 | 600 | 48 / 56 | Section titles |
| H3 | 700 | 36 / 44 | Card and block titles |
| Lead | 300 | 30 / 42 | Intro paragraphs |
| Body | 300 | 26 / 38 | Paragraph copy |
| Body strong | 700 | 26 / 38 | Inline emphasis, key values |
| Caption | 400 | 22 / 30 | Notes, metadata |
| Label | 500 | 18 / 24, +8%, uppercase | Eyebrows, tags, buttons |

Rules: sentence case headlines (all caps only for Label). Body is Light, left-aligned, 60 to 80 characters per line. Never center long paragraphs. No second typeface.

## 5. Voice and tone

Sharp engineer who loves sharing what they know. (Draft; confirm with founders.)
- **Direct:** short sentences, active verbs, no filler.
- **Open:** share process, prices and know-how; credit every creator.
- **Precise:** real numbers such as tolerances, materials, lead times.
- **Friendly:** approachable to first-time makers, never condescending.

Do: "Your part ships in 3 days. Want it stronger? Switch to PETG."
Don't: "We are thrilled to leverage cutting-edge additive solutions to elevate your journey!"

## 6. Imagery

Real parts, real machines, real hands. Macro shots with one sharp edge in focus, Bambu Lab A1 mid-print on dark navy, maker hands in natural light, flat lays on Chartreuse or white. Show layer, toolpath and finished part. Credit makers whenever their design appears. No generic stock scenes.

## 7. Graphic language

- **Supersonic cones:** sharp wedges radiating from a point (the mark or a nozzle), using Chartreuse, Blush, Navy, Cobalt/300 and White on a Cobalt field. One device per layout, cropped by the edge.
- **Shape:** corners come only from radius tokens. Cards use `md`, large containers `lg`, small chips `sm`, pills `full`.
- **Icons:** simple, geometric, drawn on a 24 px grid, 2 px round-cap stroke, one color (usually surface/brand or text/primary). Examples: upload, layers, cube, gear, check, arrow.

## 8. Layout and spacing

- Spacing scale (4 px base): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Never invent values.
- Grid: 12 columns, 96 px margins, 24 px gutters on the 1920 canvas.
- Leave at least `space/48` around any logo or headline block. Whitespace is a feature.
- Default page padding 64 (vertical) by 96 (horizontal); default stack gap 32.

## 9. Components

Built in Figma under "BSG Components"; implement with the same names and variants.

| Component | Variants / props | Notes |
|---|---|---|
| Logo | Colorway: Main, Cobalt, Electric, Navy, White, Pink | Keep ratio 185:30 |
| Header | Tone: White, Navy, Cobalt, Chartreuse, Black; Section, Document text | Logo left, section path, document name right |
| Heading | Eyebrow (Label), Title (H1), Description (Lead) | Stack gap 16 |
| Button | Style: Primary, Secondary, Outline; State: Default, Hover, Disabled; Label | Label style, uppercase. Primary = action/primary + action/primary-text. Secondary = Chartreuse + void-black. Hover darkens one step (600). Disabled uses the 200 step |
| Tag | Tone: Brand, Accent, Highlight, Ink; Label | Pill (`radius/full`), Label style |
| Card | Tone: Subtle, Brand, Ink, Accent; Label, Title, Body | `radius/md`, padding `space/24`; text color follows tone for contrast |
| Callout | Title, Body | Subtle surface with a 4 px brand left rule |
| Usage card | Type: Do, Don't; Caption; Preview slot | Check mark in Chartreuse for Do, cross in Blush for Don't |
| Spec row | Label (Label style), Value (Body) | Bottom border/default |
| Swatch | Name, HEX, RGB, CMYK, Role; Text: Light, Dark | Fill bound to a color variable |
| Tint step | Step, Hex | Chip plus step label |
| Token row | Token, Value | Bar width = value x 2 px |
| Type row | Name, Spec, Sample | Sample uses the named text style |

## 10. Applications

- **Social:** one idea per post. Large Geom headline (H1 or Display), a single color field, logo in a corner.
- **Print:** business card (Navy front with Electric logo, white back with name/role/contact), part label (Chartreuse, Navy text: part ID, material, layer height, printer), box sticker (Cobalt, white logo, short tagline).
- **Web / quote tool:** buttons, tags and callouts from section 9. Primary action is Cobalt.

## 11. Usage and governance

- Source of truth: Figma file 3DBORE, Brand Guidelines page. Token changes happen in the variable collections, then propagate to code.
- Logo formats: SVG for web, PDF for print, PNG as fallback.
- New logo uses or partner lockups need founder approval. (Draft; confirm process.)
- Ownership: showcased third-party designs remain the property of their creators; 3D BORE displays them as a manufacturing service with permission. Credit the creator and license.

## 12. Agent rules (quick checklist)

1. Use semantic tokens (`surface/*`, `text/*`, `border/*`, `action/*`), never raw hex.
2. Only Geom, only the nine styles above, sentence case.
3. Corners from radius tokens; spacing from the spacing scale.
4. Verify every text/background pair meets AA (4.5:1 body, 3:1 large text).
5. Chartreuse is for accents and dark fields, Blush for rare emphasis, Cobalt for primary actions.
6. One graphic device and one idea per layout; if in doubt, remove it.
7. Treat items marked "draft" as unconfirmed brand decisions.
