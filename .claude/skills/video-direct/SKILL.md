---
name: video-direct
description: Direct job of the video pipeline. Turns the person's plain-word notes into the smallest change, usually one line in scene/timing.js, and shows the result. Use when the person gives a note about a video in progress, such as "the title is a beat late".
argument-hint: "<project id> <note>"
---

# Direct: changes `scene/timing.js`

The person directs in plain words. Find the one line that answers the note.

## Translate the note

`TIMING.beat` defines "a beat" for this film.

| The person says | Change |
|---|---|
| "X is a beat late" | Subtract `beat` from X's cue |
| "X comes in too early" | Add `beat` to X's cue |
| "hold this longer" | Add to that scene's `dur`, and shift later scenes and cues |
| "this drags" | Subtract from that scene's `dur`, and shift later scenes and cues |

Moving a single cue is one line. Changing a scene's length also moves everything after it. Keep `film.duration` equal to the end of the last scene, unless the note changes the film's length.

Sounds follow on their own, because they refer to cue names. If there's narration, make sure the picture still lands on its word.

## Notes that belong elsewhere

Timing is the only thing this job owns. For other notes, use the table in `/video`. A note about how a scene looks goes to `/video-motion`, and a note about loudness goes to `/video-sound`.

If a note is ambiguous between two fixes, make the more likely one and say which you chose. Ask only if the two would take the film in different directions.

## Show it

1. Record the note in `projects/<id>/direct.log.md`: the person's words, the line changed, and old and new values.
2. Open a still at the changed moment: `npx hyperframes snapshot projects/<id>/scene --at <t> --output projects/<id>/work/look`.
3. If the change depends on motion or sound, make a draft: `node tools/video.mjs draft <id>`.
4. Say in one line what changed, for example `hero_in moved from 4.5s to 4.0s`.

Then ask for the next note, or go back to `/video-ship`. Any change invalidates an earlier approval, and the CLI enforces that.
