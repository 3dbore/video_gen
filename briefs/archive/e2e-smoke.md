---
brief_version: 1
id: e2e-smoke
title: The sound library
format:
  aspect: "16:9"
  duration_s: 12
  fps: 30
audience: Whoever is checking this workspace works
goal: Prove a brief can become a finished film
platform: Local test
language: en
one_point: Almost every sound in this studio is free to use without credit
hero_number: cc0_sounds
data:
  mode: provided
  figures:
    - id: all_sounds
      display: "770"
      label: sounds in the library
      source_file: assets/sfx/catalog.json
      source_title: Studio sound catalogue
    - id: cc0_sounds
      display: "741"
      label: need no credit
      source_file: assets/sfx/catalog.json
      source_title: Studio sound catalogue
voice:
  mode: provided
  file: e2e-voice.wav
sound:
  music: none
  sfx: subtle
  license_policy: cc0-only
---

## Beat 1: Library (3s)
VO: This studio has a sound library.
ON SCREEN: The total number of sounds.

## Beat 2: Proof (6s)
VO: Almost every sound in it is free to use, with no credit needed.
ON SCREEN: The number that need no credit, very large.

## Beat 3: Close (3s)
VO: So just pick one and go.
ON SCREEN: "Pick one and go."

## Must include
- Both numbers

## Must avoid
- Any number not in the catalogue
