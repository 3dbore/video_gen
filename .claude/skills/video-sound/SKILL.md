---
name: video-sound
description: Sound Designer job of the video pipeline. Places effects, voice and music against timing cues and writes sound.json, which FFmpeg mixes. Use from /video, or when a note is about the audio.
argument-hint: "<project id>"
---

# Sound: writes `sound.json`

Think like a sound designer. Most moments need nothing. A sound earns its place by making something on screen land.

## Spotting

Go through `timing.js` and `story.md`, and decide what deserves sound:

- The hero number gets the biggest moment. Often that means the rest goes quiet first.
- Silence before a hit makes the hit bigger.
- `sound.sfx: subtle` means a handful of effects per 30 seconds. `expressive` allows more. `none` means none.
- Follow the `SOUND:` lines in the brief, and the density in `spec.md`.
- Under narration, keep effects short and low, and never over a key word.

## Finding sounds

```bash
node tools/video.mjs sfx whoosh
```

```bash
node tools/video.mjs sfx impact heavy --policy cc0-only
```

Pass the brief's `license_policy`. Good words: whoosh, slide, click, tick, impact, bell, chime, bling, resonance, power, glass, metal. Avoid the `voiceover` and `jingles` packs unless the brief wants that style.

To audition without ears, check the description and length. If a choice matters, tell the person which sound it is so they can judge it in the draft.

## Write `projects/<id>/sound.json`

```json
{
  "voice": { "file": "voice/voice.mp3", "at": 0, "gain_db": 0 },
  "music": { "file": "inputs/music.mp3", "gain_db": -18, "duck_ratio": 6, "fade_in": 0.3, "fade_out": 1.5 },
  "sfx": [
    { "id": "soundfx/whoosh1", "at": "hero_in", "offset": -0.1, "gain_db": -12, "why": "Pulls the eye to the hero number" }
  ]
}
```

- `at` is a **cue or scene name from `timing.js`**, so a timing note moves the sound with the picture. Only the voice normally uses a number.
- `offset` nudges in seconds. Whooshes usually start about 0.1s before the moment they lead into.
- `why` is required, and names the on-screen moment it serves.
- Leave out `voice` and `music` when the brief has none. Music ducks automatically under the voice.
- Music needs a licence. `new` copied it into `inputs/`, and the brief must state `music_license`.

## Levels

Start with effects at -12 dB and adjust. With voice or music, the mix is mastered to -14 LUFS. An effects-only film keeps these levels and only gets a limiter, so set them by what you want to hear.

## Finish

```bash
node tools/video.mjs done <id> sound
```

The gate checks that every sound exists, fits the licence policy and lands inside the film. A sound note costs seconds, because a remix doesn't touch the picture.
