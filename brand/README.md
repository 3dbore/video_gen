# Brand

Put your brand design document here as `brand/DESIGN.md`.

`node tools/video.mjs new` copies it to `projects/<id>/design.md` for every new film. Changing this file later only affects new films, and films already started keep their copy.

| This file decides | The reference video decides |
|---|---|
| Colours, fonts, layout | Pacing, first motion, cut rhythm |

**Write colours as hex, `rgb()` or `hsl()`.** The motion job refuses any colour in a scene's code that isn't in the film's `design.md`, and it can't read a colour that's only given as a name such as "brand orange" or a Pantone number.

**One film needs a different look?** Save its file in this folder with another name, such as `brand/client-x.md`, and point the brief to it. Paths are relative to the brief:

```yaml
brand:
  design: ../../brand/client-x.md
```

Don't save design files in `briefs/inbox/`, because `/video` treats every Markdown file there as a brief.

`brand/SPELLING.md` holds how names and English words are spelled in narration scripts so the Indonesian voice pronounces them right. The voice job reads it for every film. It isn't copied into projects, so a change applies to the next voice you generate.

With no file here and no `brand.design` in the brief, films use the house look from `/video-design`.
