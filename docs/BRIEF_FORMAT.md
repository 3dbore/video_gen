# Video brief format (version 1)

Hand this file to whichever agent or person writes the brief. A valid brief goes in `briefs/inbox/` and becomes a video with `/video`.

A brief is one Markdown file: a YAML block, then the beats.

Check one without starting a project:

```bash
node tools/video.mjs check-brief briefs/inbox/my-brief.md
```

## Rules for the writer

1. **One point.** If `one_point` needs "and", it is two videos.
2. **Every number needs a source.** A number without a source is refused, not guessed at.
3. **Say what the viewer sees, not how to build it.** "The bar jumps past the competition" is good. "GSAP tween on scaleY" is not.
4. **Count the words.** Speech runs at about 2.5 words per second, so a 4 second beat holds about 10 words.
5. **Don't include anything secret.** No API keys. Those go in `.env`.

## Complete example

```markdown
---
brief_version: 1
id: solar-cost-short
title: Solar got cheap
format:
  aspect: "9:16"
  duration_s: 20
  fps: 30
audience: Curious non-experts scrolling on their phone
goal: They remember how far the price fell
platform: YouTube Shorts
language: en
one_point: Solar power is now far cheaper than it was in 2010
hero_number: price_drop
reference:
  url: https://example.com/a-video-whose-pacing-we-like
  why: Fast first second, one idea per cut
data:
  mode: provided
  figures:
    - id: price_drop
      display: "90%"
      label: fall in solar cost since 2010
      source_url: https://example.org/the-report
      source_title: Name of the report
voice:
  mode: tts
  provider: elevenlabs
sound:
  music: none
  sfx: subtle
  license_policy: cc0-only
brand:
  palette: ["#101114", "#F4F2EC", "#FFB000"]
  fonts: ["Inter"]
---

## Beat 1: Hook (4s)
VO: In 2010, solar was a luxury.
ON SCREEN: A single rooftop panel with a huge price tag
MOTION: The tag slams in on the first word
SOUND: A low hit as the tag lands

## Beat 2: Drop (10s)
VO: Then the price fell ninety percent, faster than almost anyone predicted.
ON SCREEN: The hero number counts up, with a falling line behind it
MOTION: The line draws as the number climbs
SOUND: Rising tick, stops dead on the final number

## Beat 3: Close (6s)
VO: Now it's the cheapest power many countries have ever built.
ON SCREEN: The rooftop again, now a whole street of panels
MOTION: Panels pop on house by house

## Must include
- The source name on screen during Beat 2

## Must avoid
- Stock footage
- The words "game-changing" or "revolutionary"
```

## YAML fields

| Field | Required | Values |
|---|---|---|
| `brief_version` | yes | `1` |
| `id` | yes | Kebab-case and unique. Becomes `projects/<id>/` |
| `title` | yes | Human name |
| `format.aspect` | yes | `"16:9"`, `"9:16"` or `"1:1"`, in quotes |
| `format.duration_s` | yes | Length in seconds |
| `format.fps` | no | `24`, `25`, `30` (default) or `60` |
| `audience` | yes | Who is watching, and where |
| `goal` | yes | What they should remember or do afterwards |
| `platform` | no | Where it will be posted |
| `language` | no | Language code, default `en` |
| `one_point` | yes | The single idea, in one sentence |
| `hero_number` | if there is data | The `id` of the one figure the video is built around |
| `reference.url` or `.file` | no | A video to match. Omit for the house style |
| `reference.why` | no | What to take from it |
| `data.mode` | yes | `provided`, `research` or `none` |
| `data.figures[]` | for `provided` | `id`, `display`, `label`, `source_url` or `source_file`, `source_title`, optional `value`, `quote` |
| `data.questions[]` | for `research` | What to find out. Claude finds the sources |
| `voice.mode` | yes | `none`, `tts` or `provided` |
| `voice.provider` | for `tts` | `elevenlabs` (needs a key in `.env`) or `kokoro` (free and local) |
| `voice.voice_id` | no | Overrides `ELEVENLABS_VOICE_ID` |
| `voice.file` | for `provided` | Path relative to the brief |
| `sound.music` | no | `none`, or a path relative to the brief. A file needs `sound.music_license` |
| `sound.sfx` | yes | `none`, `subtle` or `expressive` |
| `sound.license_policy` | yes | `cc0-only`, or `attribution-ok` (allows CC-BY sounds and adds credits) |
| `brand.palette`, `.fonts`, `.logo` | no | Colours, font names, logo path relative to the brief |

## Beats

Each beat is a heading with a name and a length, then any of four labelled lines:

```markdown
## Beat 2: Drop (10s)
VO: The words spoken.
ON SCREEN: What the viewer sees.
MOTION: How it moves, in plain words.
SOUND: What it sounds like, in plain words.
```

Each beat needs `VO:` or `ON SCREEN:`. Beats must be numbered in order. If the lengths don't add up to `duration_s`, they are scaled to fit and you get a warning.

A brief can have any number of beats. The story job still reduces the argument to three story beats, so a brief with six scenes needs a clear shape.

## Optional sections

`## Must include` and `## Must avoid` are checked by Claude against the stills before you are asked to approve the video.

## What happens to the brief

It is copied to `projects/<id>/brief.md` and never changed again. To change direction, give a note in chat, or write a new brief with a new `id`.
