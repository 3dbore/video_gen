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
6. **Direct the voice.** If the film is narrated, set the language and say how each line should sound. See [Intonation and language](#intonation-and-language).

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
  delivery: narration
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
TONE: Dry and unhurried, a little amused
ON SCREEN: A single rooftop panel with a huge price tag
MOTION: The tag slams in on the first word
SOUND: A low hit as the tag lands

## Beat 2: Drop (10s)
VO: [excited] Then the price fell... ninety percent, faster than almost anyone predicted.
TONE: Builds, with the weight on "ninety percent"
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
| `language` | no | Two-letter language code such as `en`, `id` or `fr`, default `en`. Used for the voice and the transcript |
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
| `voice.delivery` | no | ElevenLabs only: `narration`, `conversational`, `news` or `drama` |
| `voice.stability` | no | ElevenLabs only: 0 to 1, overrides `delivery`. Lower is more expressive |
| `voice.similarity_boost` | no | ElevenLabs only: 0 to 1, overrides `delivery`. Lower it if you hear artifacts |
| `voice.file` | for `provided` | Path relative to the brief |
| `sound.music` | no | `none`, or a path relative to the brief. A file needs `sound.music_license` |
| `sound.sfx` | yes | `none`, `subtle` or `expressive` |
| `sound.license_policy` | yes | `cc0-only`, or `attribution-ok` (allows CC-BY sounds and adds credits) |
| `brand.palette`, `.fonts`, `.logo` | no | Colours, font names, logo path relative to the brief |

## Beats

Each beat is a heading with a name and a length, then any of five labelled lines:

```markdown
## Beat 2: Drop (10s)
VO: The words spoken.
TONE: How those words should sound, in plain words.
ON SCREEN: What the viewer sees.
MOTION: How it moves, in plain words.
SOUND: What it sounds like, in plain words.
```

Each beat needs `VO:` or `ON SCREEN:`. Beats must be numbered in order. If the lengths don't add up to `duration_s`, they are scaled to fit and you get a warning.

A brief can have any number of beats. The story job still reduces the argument to three story beats, so a brief with six scenes needs a clear shape.

## Intonation and language

These rules apply to `voice.provider: elevenlabs`. Kokoro refuses audio tags because it would read them out loud, and a `provided` recording already has its delivery. Direction costs nothing to write, but regenerating a voice uses credits, so get it right in the brief.

### Set the language

1. Set `language` to the two-letter code of the narration. Omit it only for English.
2. Write every `VO:` line in that language. The voice reads what you write and won't translate it.
3. Use one language per film. Make a second brief, with its own `id`, for another language.
4. Write numbers, dates and abbreviations in words, the way they should be said in that language: "ninety percent", not "90%". The figure on screen still comes from `data.json`.
5. Check the timing by ear. The limit of about 2.5 words per second is a guide for English, and other languages can run longer or shorter.

### Set the intonation, from broad to fine

**1. The whole film: `voice.delivery`**

| Value | Stability | Sounds like |
|---|---|---|
| `drama` | 0.3 | Highly expressive, for character and story |
| `conversational` | 0.4 | A person talking to you, for most short social films |
| `narration` | 0.7 | Steady and consistent, for explainers |
| `news` | 0.8 | Very even and professional |

If the result is monotone, lower `voice.stability`. If it sounds erratic, raise it. With no setting, the voice uses the ElevenLabs default of 0.5.

**2. Each beat: `TONE:`**

Describe the sound in plain words, such as "Quiet and close, then rising" or "Dry, a little amused". Name the word that carries the weight. The voice job turns this into the tags and punctuation below.

**3. Individual words: inside `VO:`, only when it must be exact**

| To get | Write | Example |
|---|---|---|
| A feeling or manner | An audio tag before the words | `[whispers] Nobody saw it coming.` |
| A sound the voice makes | An audio tag at that moment | `It failed. [sighs] Again.` |
| An accent | An audio tag | `[strong French accent] Bonjour.` |
| A pause or added weight | An ellipsis | `It fell... ninety percent.` |
| Emphasis | Capitals on one word | `It was NOT cheap.` |
| Rhythm | Short sentences and normal punctuation | `One panel. Then a street.` |
| An exact pronunciation | IPA between slashes | `/ˈsoʊlər/` |

Tag names like `[excited]`, `[sarcastic]` and `[laughs]` also work. Tags aren't spoken and don't count toward the word limit.

### Keep it believable

- Use at most one tag per sentence. Let punctuation do the rest.
- Choose a tag that suits the voice. A deep, serious voice won't giggle convincingly.
- Capitalize one word per line at most.
- Don't use `<break>` tags, SSML or a speed value. The current model doesn't support them. To make a line fit, cut words.
- Test unusual names and any IPA, because results vary by voice.

## Optional sections

`## Must include` and `## Must avoid` are checked by Claude against the stills before you are asked to approve the video.

## What happens to the brief

It is copied to `projects/<id>/brief.md` and never changed again. To change direction, give a note in chat, or write a new brief with a new `id`.
