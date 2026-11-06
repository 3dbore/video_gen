# Video studio

Give Claude Code a written brief and get an MP4 back. Every stage leaves one file behind, so a note changes one file and nothing gets re-rolled.

## Setup

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run doctor
```

The machine needs Node 22+, FFmpeg and yt-dlp. Add `ELEVENLABS_API_KEY` to `.env` if you want ElevenLabs narration.

## Making a video

1. Give [docs/BRIEF_FORMAT.md](docs/BRIEF_FORMAT.md) to the agent or person writing the brief.
2. Save the brief in `briefs/inbox/`.
3. Open this folder in Claude Code and type `/video`.
4. Answer when asked. You'll see stills and a draft, and give notes in plain words such as "the title is a beat late".
5. Say yes, and you get `projects/<id>/final.mp4` and `CREDITS.md`.

`/video` with no arguments lists waiting briefs and unfinished projects. `/video <id>` resumes a project.

## What's where

| Path | Contents |
|---|---|
| `briefs/inbox/` | Briefs waiting to start |
| `briefs/archive/` | Briefs already started |
| `projects/<id>/` | Everything for one video |
| `assets/sfx/` | 770 sound effects and `catalog.json`, with a licence per sound |
| `templates/scene/` | The starting HyperFrames composition |
| `tools/` | The CLI behind the skills |
| `.claude/skills/` | The pipeline skills and motion/video design skills |
| `docs/SKILLS_LIBRARY.md` | Where to find more skills |

## Stack

| Role | Tool |
|---|---|
| Editor | Claude Code |
| Picture | HyperFrames (HTML and GSAP to video, Apache-2.0) |
| Audio mix and mux | FFmpeg |
| Speech to text | Parakeet, through HyperFrames |
| Voice | ElevenLabs, local Kokoro, or your own recording |
| Sound | soundcn and soundfx, through the `/video-sound` job |
| Research | Google Chrome or the built-in browser |

## Licences

`assets/sfx` holds 741 CC0 sounds and 29 CC-BY-3.0 sounds. CC-BY sounds require attribution, which `CREDITS.md` lists for you. A `cc0-only` brief can't use them. soundcn's 110 World of Warcraft sounds are excluded because Blizzard reserves all rights to them.

`motion-design` (LottieFiles) and `video-design` (digitalsamba) are MIT licensed. `video-design` was adapted for this workspace, as its `SKILL.md` notes.

## Tests

```bash
npm test
```
