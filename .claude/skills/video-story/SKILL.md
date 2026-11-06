---
name: video-story
description: Story job of the video pipeline. Reduces the brief and data to one point, one hero number and three beats and writes story.md. Use from /video, or when a note says the argument or structure is wrong.
argument-hint: "<project id>"
---

# Story: writes `story.md`

Read `brief.md`, `spec.md` and `data.json`. Your job is to cut. If a beat doesn't serve the one point, it goes.

## Rules

- **One point.** One sentence, with no "and". Start from the brief's `one_point`.
- **One hero number.** It's the moment the film builds to, and it's the biggest thing on screen. Other figures support it or leave.
- **Three beats.** Every film has this shape, whatever its length: set up the tension, show the hero number, say what it means. Several brief beats can sit inside one story beat.
- **Respect the brief.** Keep its beats and VO unless they conflict with the data or can't fit. Note any change and why.
- **Claims stay inside the source.** The story can't say more than `data.json` supports, including its caveats.
- **Say it in the first second.** The viewer should know what this is about before the first cut.

## Write `projects/<id>/story.md`

Use exactly these headings, because the gate requires them:

```markdown
# Story: <title>

## One point
One sentence.

## Hero number
90% (must contain the figure's exact display value)
Why this number, and when it lands.

## Beat 1: Tension (0-4s)
What the viewer believes or wants, and what's on screen.
Maps to brief beats: 1

## Beat 2: Proof (4-14s)
The hero number lands here. What the viewer sees and hears.
Maps to brief beats: 2

## Beat 3: So what (14-20s)
What it means for this audience. The last image.
Maps to brief beats: 3

## Changes from the brief
None, or what changed and why.
```

## Finish

```bash
node tools/video.mjs done <id> story
```

If you changed anything from the brief, tell the person.
