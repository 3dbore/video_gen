---
name: video-reference
description: Reference job of the video pipeline. Measures a reference video's pacing, first motion and cut rhythm and writes spec.md, or writes the house spec when the brief has no reference. Use from /video or to redo a project's spec.
argument-hint: "<project id>"
---

# Reference: writes `spec.md`

Measure the reference rather than describing it from memory. This file is what the film gets checked against later.

## With a reference

Work in `projects/<id>/work/reference/`. A reference is material to study. Take its pacing and structure, never its footage, characters, branding or music.

1. Get the file. If the brief gives `reference.file`, use `inputs/`. If it gives a URL:
   ```bash
   yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" -o "projects/<id>/work/reference/ref.%(ext)s" "<url>"
   ```
   If the download fails, say so and ask for a file. Don't guess the pacing from a description.
2. Measure with HyperFrames. Run `npx hyperframes measure --help` for the current options, then use:
   - `measure probe`: length, size, fps
   - `measure cuts`: every cut, which gives you the shot lengths
   - `measure events`: when motion first happens
   - `measure energy`: audio energy over time
3. Look at it. Pull frames with `measure frames` or FFmpeg at the first second and around the main cuts, then open them with Read.
4. Transcribe the speech if it matters: `node tools/video.mjs transcribe <audio> projects/<id>/work/reference/transcript.json`.

Compute the median and shortest shot length, and cuts per 10 seconds, from the measured cuts. Report numbers you measured, and mark anything you only judged by eye as "judged".

## Without a reference: the house spec

Use these defaults and adapt them to `format`, `audience` and `platform`:

- **Pacing:** vertical holds 1.5-2.5s per idea. Horizontal holds 2.5-4s.
- **First motion:** something moves within 0.3s and the point is visible by 1.5s.
- **Cut rhythm:** hard cuts on act changes. The shot length changes at the hero moment, and the hero number holds the longest.
- **Look:** read `/video-design`, use its palette and type rules, and take brand values from the brief.
- **Sound:** sparse. Effects only where something lands.

## Write `projects/<id>/spec.md`

Use exactly these headings, because the gate requires them:

```markdown
# Spec: <title>
Source: <url or "house style">

## Pacing
Median shot, shortest shot, cuts per 10s, and how that scales to this film's length.

## First motion
What moves first and when, in seconds.

## Cut rhythm
Hard cuts or transitions. Where the rhythm changes.

## Look
Palette as hex, type sizes, layout habits.

## Sound
Density of effects, music or none, and what the sound does at the key moment.

## Must match
3-6 checkable statements, such as "First motion before 0.3s".
```

The `Must match` list is what `/video-ship` verifies against the stills.

## Finish

```bash
node tools/video.mjs done <id> reference
```
