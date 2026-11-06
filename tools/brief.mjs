// Parses and validates the brief format defined in docs/BRIEF_FORMAT.md.
import YAML from 'yaml';
import { DIMENSIONS } from './lib.mjs';

const BEAT = /^##\s+Beat\s+(\d+)\s*[:\-–—]\s*(.+?)\s*(?:\(\s*(\d+(?:\.\d+)?)\s*s\s*\))?\s*$/i;
const FIELD = /^(VO|ON SCREEN|MOTION|SOUND)\s*:\s*(.*)$/i;
const FIELD_KEY = { VO: 'vo', 'ON SCREEN': 'on_screen', MOTION: 'motion', SOUND: 'sound' };
const WORDS_PER_SECOND = 2.5;

function parseBody(body) {
  const beats = [];
  const sections = {};
  let beat = null;
  let field = null;
  let section = null;
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const b = line.match(BEAT);
    if (b) {
      beat = { n: Number(b[1]), name: b[2], seconds: b[3] ? Number(b[3]) : null, vo: '', on_screen: '', motion: '', sound: '' };
      beats.push(beat);
      field = section = null;
      continue;
    }
    if (/^##\s+/.test(line)) {
      section = line.replace(/^##\s+/, '').trim().toLowerCase();
      sections[section] = '';
      beat = field = null;
      continue;
    }
    if (beat) {
      const f = line.match(FIELD);
      if (f) {
        field = FIELD_KEY[f[1].toUpperCase()];
        beat[field] = f[2];
      } else if (field && line.trim()) {
        beat[field] += (beat[field] ? '\n' : '') + line.trim();
      }
    } else if (section) {
      sections[section] += line + '\n';
    }
  }
  for (const k of Object.keys(sections)) sections[k] = sections[k].trim();
  return { beats, sections };
}

/** Returns { meta, beats, sections, errors, warnings }. Never throws on bad input. */
export function parseBrief(text) {
  const errors = [];
  const warnings = [];
  const m = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) {
    return { meta: {}, beats: [], sections: {}, errors: ['The brief must start with a YAML block between --- lines.'], warnings };
  }
  let meta = {};
  try {
    meta = YAML.parse(m[1]) || {};
  } catch (e) {
    return { meta: {}, beats: [], sections: {}, errors: [`YAML error: ${e.message}`], warnings };
  }
  const { beats, sections } = parseBody(m[2]);
  const need = (cond, msg) => { if (!cond) errors.push(msg); };

  need(meta.brief_version === 1, 'brief_version must be 1.');
  need(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.id || ''), 'id must be kebab-case, e.g. "q3-revenue-short".');
  for (const k of ['title', 'audience', 'goal', 'one_point']) need(meta[k], `${k} is required.`);

  const fmt = meta.format || {};
  need(DIMENSIONS[fmt.aspect], `format.aspect must be one of ${Object.keys(DIMENSIONS).join(', ')} (quote it: "16:9").`);
  need(fmt.duration_s > 0, 'format.duration_s must be a positive number of seconds.');
  need([24, 25, 30, 60].includes(fmt.fps ?? 30), 'format.fps must be 24, 25, 30 or 60.');

  const data = meta.data || {};
  need(['provided', 'research', 'none'].includes(data.mode), 'data.mode must be provided, research or none.');
  if (data.mode === 'provided') {
    need(Array.isArray(data.figures) && data.figures.length, 'data.mode "provided" needs data.figures.');
    for (const f of data.figures || []) {
      need(f.id && f.display && f.label, `Every figure needs id, display and label (problem: ${JSON.stringify(f)}).`);
      need(f.source_url || f.source_file, `Figure "${f.id}" needs source_url or source_file. No number ships without a source.`);
    }
  }
  if (data.mode === 'research') need(data.questions?.length, 'data.mode "research" needs data.questions: what to find out.');
  if (data.mode !== 'none') need(meta.hero_number, 'hero_number is required unless data.mode is "none".');
  if (data.mode === 'provided' && meta.hero_number) {
    need((data.figures || []).some((f) => f.id === meta.hero_number), `hero_number "${meta.hero_number}" is not a figure id in data.figures.`);
  }

  const voice = meta.voice || {};
  need(['none', 'tts', 'provided'].includes(voice.mode), 'voice.mode must be none, tts or provided.');
  if (voice.mode === 'provided') need(voice.file, 'voice.mode "provided" needs voice.file.');
  if (voice.mode === 'tts') need(['elevenlabs', 'kokoro'].includes(voice.provider), 'voice.provider must be elevenlabs or kokoro.');

  const sound = meta.sound || {};
  need(['none', 'subtle', 'expressive'].includes(sound.sfx), 'sound.sfx must be none, subtle or expressive.');
  need(['cc0-only', 'attribution-ok'].includes(sound.license_policy), 'sound.license_policy must be cc0-only or attribution-ok.');
  if (sound.music && sound.music !== 'none') need(sound.music_license, 'A music file needs sound.music_license.');

  need(beats.length > 0, 'Add at least one "## Beat 1: Name (5s)" section.');
  beats.forEach((b, i) => {
    need(b.n === i + 1, `Beats must be numbered in order (found Beat ${b.n} at position ${i + 1}).`);
    need(b.seconds, `Beat ${b.n} needs a length in its heading, e.g. "## Beat ${b.n}: ${b.name} (5s)".`);
    need(b.on_screen || b.vo, `Beat ${b.n} needs at least VO: or ON SCREEN:.`);
    if (voice.mode !== 'none' && b.vo && b.seconds) {
      const words = b.vo.split(/\s+/).filter(Boolean).length;
      const secs = words / WORDS_PER_SECOND;
      if (secs > b.seconds * 1.15) {
        warnings.push(`Beat ${b.n}: ${words} words take about ${secs.toFixed(1)}s to say but the beat is ${b.seconds}s.`);
      }
    }
  });
  const total = beats.reduce((s, b) => s + (b.seconds || 0), 0);
  if (fmt.duration_s && total && Math.abs(total - fmt.duration_s) > fmt.duration_s * 0.1) {
    warnings.push(`Beats add up to ${total}s but format.duration_s is ${fmt.duration_s}s.`);
  }
  if (voice.mode === 'none' && beats.some((b) => b.vo)) warnings.push('voice.mode is none, so VO lines will not be spoken.');
  if (!meta.reference || meta.reference === 'none') warnings.push('No reference video, so the spec job will use the house style.');

  return { meta, beats, sections, errors, warnings };
}
