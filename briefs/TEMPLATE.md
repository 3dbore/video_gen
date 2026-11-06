---
brief_version: 1
id: change-me
title: Change me
format:
  aspect: "16:9"        # "16:9", "9:16" or "1:1"
  duration_s: 30
  fps: 30
audience: Who is watching, and where
goal: What they should remember or do afterwards
platform: YouTube
language: en            # two-letter code of the narration: en, id, fr...
one_point: The single idea, in one sentence
hero_number: main_figure   # delete if data.mode is none
# With no reference here, the film draws on everything in references/.
# reference: none           # use the house style instead
# To choose the clips yourself, list them. Each one needs a why:
# reference:
#   - from: fast-cuts.mp4   # a file in references/. Or file: a path relative to this file. Or url: https://...
#     why: The overall pace, with one idea per cut
#   - from: number-slam.mp4
#     why: How the hero number slams in during Beat 2
data:
  mode: provided        # provided, research or none
  figures:
    - id: main_figure
      display: "42%"
      label: what the number measures
      source_url: https://...
      source_title: Name of the source
  # For mode research, replace figures with:
  # questions:
  #   - What to find out
voice:
  mode: none            # none, tts or provided
  # provider: elevenlabs  # tts: elevenlabs or kokoro
  # delivery: narration   # elevenlabs: narration, conversational, news or drama
  # file: voice.mp3       # provided: path relative to this file
sound:
  music: none           # none, or a path relative to this file
  # music_license: Who licensed it, and on what terms
  sfx: subtle           # none, subtle or expressive
  license_policy: cc0-only   # cc0-only or attribution-ok
# brand:                 # brand/DESIGN.md applies to every film. Set these only to differ.
#   design: ../../brand/client-x.md   # this film's own design file, relative to this file
#   palette: ["#101114", "#F4F2EC", "#FFB000"]   # ignored when the film has a design file
#   fonts: ["Inter"]     # ignored when the film has a design file
#   logo: logo.png
---

## Beat 1: Hook (5s)
VO: The words spoken, in the brief's language, with numbers written as words.
TONE: How those words should sound, in plain words.
ON SCREEN: What the viewer sees.
MOTION: How it moves, in plain words.
SOUND: What it sounds like, in plain words.

## Beat 2: Proof (20s)
ON SCREEN: What the viewer sees.

## Beat 3: Close (5s)
ON SCREEN: What the viewer sees.

## Must include
- Anything required

## Must avoid
- Anything banned
