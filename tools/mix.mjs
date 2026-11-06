// The audio half of "HyperFrames x FFmpeg": turns sound.json into one WAV.
// Picture is never touched, so a sound note costs seconds rather than a re-render.
import fs from 'node:fs';
import path from 'node:path';
import { CATALOG, ROOT, loadTiming, projectPaths, readJson, resolveTime, run } from './lib.mjs';

const TARGET = { i: -14, tp: -1.5, lra: 11 };

function loudness(file) {
  const r = run('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af',
    `loudnorm=I=${TARGET.i}:TP=${TARGET.tp}:LRA=${TARGET.lra}:print_format=json`, '-f', 'null', '-'], { capture: true });
  const m = (r.stderr || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`Could not measure loudness of ${file}`);
  return JSON.parse(m[0]);
}

export const measureLufs = (file) => Number(loudness(file).input_i);

/** Builds the FFmpeg arguments for the unmastered bus. Pure, so it can be unit tested. */
export function buildGraph(sound, timing, resolveFile) {
  const dur = timing.film.duration;
  const inputs = [];
  const chains = [];
  const buses = [];
  const add = (file, loop = false) => {
    if (loop) inputs.push('-stream_loop', '-1');
    inputs.push('-i', file);
    return inputs.filter((x) => x === '-i').length - 1;
  };
  const base = 'aresample=48000,aformat=channel_layouts=stereo';

  (sound.sfx || []).forEach((c, i) => {
    const idx = add(resolveFile(c.id));
    const ms = Math.round(resolveTime(timing, c.at, c.offset) * 1000);
    chains.push(`[${idx}:a]${base},volume=${c.gain_db ?? -10}dB,adelay=${ms}:all=1[s${i}]`);
    buses.push(`[s${i}]`);
  });

  let voiceKey = null;
  if (sound.voice) {
    const idx = add(resolveFile(sound.voice.file));
    const ms = Math.round(resolveTime(timing, sound.voice.at ?? 0, sound.voice.offset) * 1000);
    const chain = `[${idx}:a]${base},volume=${sound.voice.gain_db ?? 0}dB,adelay=${ms}:all=1`;
    if (sound.music) {
      chains.push(`${chain},asplit=2[v][vkey]`);
      voiceKey = '[vkey]';
    } else {
      chains.push(`${chain}[v]`);
    }
    buses.push('[v]');
  }

  if (sound.music) {
    const m = sound.music;
    const idx = add(resolveFile(m.file), m.loop !== false);
    const fade = m.fade_out ?? 1.5;
    chains.push(`[${idx}:a]${base},volume=${m.gain_db ?? -18}dB,atrim=0:${dur},afade=t=in:d=${m.fade_in ?? 0.3},afade=t=out:st=${Math.max(0, dur - fade)}:d=${fade}[mraw]`);
    if (voiceKey) {
      chains.push(`[mraw]${voiceKey}sidechaincompress=threshold=0.03:ratio=${m.duck_ratio ?? 6}:attack=15:release=350[m]`);
    } else {
      chains.push('[mraw]anull[m]');
    }
    buses.push('[m]');
  }

  if (!buses.length) {
    return { inputs: ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'], graph: `[0:a]atrim=0:${dur}[bus]`, hasBed: false };
  }
  const tail = `apad=whole_dur=${dur},atrim=0:${dur}[bus]`;
  const mix = buses.length > 1
    ? `${buses.join('')}amix=inputs=${buses.length}:normalize=0:duration=longest,${tail}`
    : `${buses[0]}${tail}`;
  return { inputs, graph: [...chains, mix].join(';'), hasBed: !!(sound.voice || sound.music) };
}

export function mix(slug) {
  const p = projectPaths(slug);
  const sound = readJson(p.sound);
  const timing = loadTiming(p.timing);
  const catalog = fs.existsSync(CATALOG) ? readJson(CATALOG) : { sounds: [] };
  const byId = new Map(catalog.sounds.map((s) => [s.id, s]));
  const resolveFile = (ref) => {
    if (byId.has(ref)) return path.join(ROOT, byId.get(ref).file);
    const f = path.resolve(p.dir, ref);
    if (!fs.existsSync(f)) throw new Error(`Sound file not found: ${ref}`);
    return f;
  };
  fs.mkdirSync(p.work, { recursive: true });
  const bus = path.join(p.work, 'bus.wav');
  const out = path.join(p.work, 'mix.wav');
  const { inputs, graph, hasBed } = buildGraph(sound, timing, resolveFile);
  const pass = run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[bus]', '-c:a', 'pcm_s16le', bus], { capture: true });
  if (pass.status !== 0) throw new Error(`Mix failed:\n${pass.stderr}`);

  // Voice or music is mastered to a platform target. Effects alone keep their authored levels:
  // normalising a few short hits over silence would push them far too loud.
  let af;
  if (hasBed) {
    const m = loudness(bus);
    af = `loudnorm=I=${TARGET.i}:TP=${TARGET.tp}:LRA=${TARGET.lra}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=48000`;
  } else {
    af = 'alimiter=limit=0.84:level=disabled';
  }
  const master = run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', bus, '-af', af, '-c:a', 'pcm_s16le', out], { capture: true });
  if (master.status !== 0) throw new Error(`Mastering failed:\n${master.stderr}`);
  return { file: out, mastered: hasBed };
}

export function mux(picture, audio, output) {
  const r = run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', picture, '-i', audio,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', output], { capture: true });
  if (r.status !== 0) throw new Error(`Mux failed:\n${r.stderr}`);
}
