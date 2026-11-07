---
name: video-voice
description: Voice job of the video pipeline. Writes the narration script, makes or collects the voice file, and transcribes it with Parakeet for word timings. Use from /video, or when a note is about what's said or how it sounds.
argument-hint: "<project id>"
---

# Voice: writes `voice/`

Skip this job if `voice.mode: none`.

## Script

For `tts`, write `projects/<id>/voice/script.txt`: only the words to be spoken, with no labels or plain-word stage directions. With ElevenLabs, audio tags such as `[whispers]` are allowed, because they aren't spoken.

- Start from the VO lines in the brief, in the order set by `story.md`.
- Every number said must match `data.json`. Write it the way it should sound in the brief's `language` ("ninety percent").
- At about 2.5 words per second it has to fit in the film. If it doesn't, cut words. Don't speed up the voice.
- For ElevenLabs, turn each beat's `TONE:` line into tags and punctuation, following "Intonation and language" in `docs/BRIEF_FORMAT.md`. Keep any tags already in `VO:`. Kokoro can't follow them, so leave them out and tell the person the `TONE:` lines weren't applied.

## Make or collect the voice

```bash
node tools/video.mjs voice <id>
```

| `voice.mode` / provider | What happens | Needs |
|---|---|---|
| `provided` | Copies the file from `inputs/` | The file in the brief |
| `tts` / `elevenlabs` | Sends `script.txt` to ElevenLabs, which uses credits | `ELEVENLABS_API_KEY` and a voice id in `.env` |
| `tts` / `kokoro` | Generates locally and free | `pip install kokoro-onnx soundfile` |

If the key is missing, stop and ask the person to add it to `.env`, or to accept `kokoro`. Never ask them to paste a key in chat. Regenerating with ElevenLabs costs credits again, so change the script only with a reason.

The same command transcribes with `hyperframes transcribe`. It uses Parakeet when the language is covered and falls back to Whisper when it isn't. Indonesian uses Whisper: see "Whisper" in `CLAUDE.md` for the install and for how to transcribe again without regenerating the voice, which would cost credits.

## Check the transcript

Read `voice/transcript.json` and compare it with the script:

- **Numbers:** does a spoken figure match `data.json`? For a `provided` voice, this is your only check, so report any mismatch to the person.
- **Pace:** does the voice's length fit the film? If it's longer than the film, tell the person. Don't speed it up silently.
- **Tags:** do any tag words appear in the transcript? ElevenLabs sometimes speaks a tag aloud. Tell the person, and ask before regenerating, because it uses credits.

Keep the word start times. The motion job turns them into cues so that things land on the words that name them.

## Finish

```bash
node tools/video.mjs done <id> voice
```
