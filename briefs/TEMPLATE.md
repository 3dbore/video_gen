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
language: en
one_point: The single idea, in one sentence
hero_number: main_figure   # delete if data.mode is none
# reference:
#   url: https://...
#   why: What to take from it
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
  # file: voice.mp3       # provided: path relative to this file
sound:
  music: none           # none, or a path relative to this file
  # music_license: Who licensed it, and on what terms
  sfx: subtle           # none, subtle or expressive
  license_policy: cc0-only   # cc0-only or attribution-ok
# brand:
#   palette: ["#101114", "#F4F2EC", "#FFB000"]
#   fonts: ["Inter"]
#   logo: logo.png
---

## Beat 1: Hook (5s)
VO: The words spoken.
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
