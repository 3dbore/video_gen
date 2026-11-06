// Shared helpers for the video studio CLI. No project logic lives here.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CATALOG = path.join(ROOT, 'assets', 'sfx', 'catalog.json');
export const BRAND_DESIGN = path.join(ROOT, 'brand', 'DESIGN.md');
export const REFERENCES = path.join(ROOT, 'references');
const VIDEO_FILE = /\.(mp4|mov|webm|mkv|m4v|avi)$/i;

/**
 * Everything in the shared reference folder: its video files, then the lines of urls.txt.
 * Each clip names the folder where its one study is kept, so a video is only studied once.
 */
export function referenceFolder(dir = REFERENCES) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && VIDEO_FILE.test(e.name))
    .map((e) => e.name).sort()
    .map((name) => ({ name, file: `references/${name}`, study: `references/studies/${slugify(name)}` }));
  const urlsFile = path.join(dir, 'urls.txt');
  const lines = fs.existsSync(urlsFile) ? fs.readFileSync(urlsFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')) : [];
  const links = lines.map((url, i) => {
    if (!/^https?:\/\//i.test(url)) throw new Error(`references/urls.txt: "${url}" is not a URL. Put one URL per line, and start notes with #.`);
    const id = crypto.createHash('sha1').update(url).digest('hex').slice(0, 8);
    return { name: `link-${i + 1}`, url, study: `references/studies/link-${id}` };
  });
  return [...files, ...links];
}

export const DIMENSIONS = {
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '1:1': [1080, 1080],
};

/** Every path a project owns. Jobs and gates must go through this, never build paths by hand. */
export function projectPaths(slug) {
  const dir = path.join(ROOT, 'projects', slug);
  const scene = path.join(dir, 'scene');
  return {
    dir,
    scene,
    brief: path.join(dir, 'brief.md'),
    state: path.join(dir, 'state.json'),
    inputs: path.join(dir, 'inputs'),
    design: path.join(dir, 'design.md'),
    references: path.join(dir, 'references.json'),
    spec: path.join(dir, 'spec.md'),
    data: path.join(dir, 'data.json'),
    story: path.join(dir, 'story.md'),
    voiceDir: path.join(dir, 'voice'),
    voiceScript: path.join(dir, 'voice', 'script.txt'),
    transcript: path.join(dir, 'voice', 'transcript.json'),
    index: path.join(scene, 'index.html'),
    timing: path.join(scene, 'timing.js'),
    dataJs: path.join(scene, 'data.js'),
    sound: path.join(dir, 'sound.json'),
    directLog: path.join(dir, 'direct.log.md'),
    stills: path.join(dir, 'stills'),
    checks: path.join(dir, 'checks.json'),
    work: path.join(dir, 'work'),
    draft: path.join(dir, 'draft.mp4'),
    final: path.join(dir, 'final.mp4'),
    credits: path.join(dir, 'CREDITS.md'),
  };
}

export function loadEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2] !== '' && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}

export const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const writeJson = (f, v) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v, null, 2) + '\n');
};

/** timing.js is a browser script that sets window.TIMING. Evaluate it the same way in Node. */
export function loadTiming(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file, timeout: 1000 });
  const t = sandbox.window.TIMING;
  if (!t || !t.film || !t.scenes || !t.cues) {
    throw new Error(`${file} must set window.TIMING = { film, beat, scenes, cues }`);
  }
  return t;
}

/** A sound cue's `at` may be a cue name, a scene name (its start) or a number of seconds. */
export function resolveTime(timing, at, offset = 0) {
  let base;
  if (typeof at === 'number') base = at;
  else if (at in timing.cues) base = timing.cues[at];
  else if (at in timing.scenes) base = timing.scenes[at].start;
  else throw new Error(`"${at}" is not a cue or scene in timing.js`);
  return Math.max(0, base + (offset || 0));
}

function listFiles(target) {
  if (!fs.existsSync(target)) return [];
  if (fs.statSync(target).isFile()) return [target];
  const out = [];
  for (const e of fs.readdirSync(target, { withFileTypes: true })) {
    if (e.name === '.hyperframes' || e.name === 'renders' || e.name === 'node_modules') continue;
    out.push(...listFiles(path.join(target, e.name)));
  }
  return out.sort();
}

/** Stable hash of files/directories. Line endings are normalised for text so editors can't invalidate it. */
export function hashPaths(paths) {
  const h = crypto.createHash('sha256');
  for (const p of paths) {
    for (const f of listFiles(p)) {
      h.update(path.relative(ROOT, f).replaceAll('\\', '/'));
      const buf = fs.readFileSync(f);
      h.update(/\.(html|js|json|md|txt|css)$/i.test(f) ? buf.toString('utf8').replaceAll('\r\n', '\n') : buf);
    }
  }
  return h.digest('hex').slice(0, 16);
}

export function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: opts.capture ? 'pipe' : 'inherit',
    cwd: opts.cwd || ROOT,
    maxBuffer: 256 * 1024 * 1024,
  });
  if (res.error) throw new Error(`Could not run ${cmd}: ${res.error.message}`);
  return res;
}

const HF_BIN = (() => {
  const dir = path.join(ROOT, 'node_modules', 'hyperframes');
  if (!fs.existsSync(dir)) return null;
  const bin = readJson(path.join(dir, 'package.json')).bin;
  return path.join(dir, typeof bin === 'string' ? bin : Object.values(bin)[0]);
})();

/** Run the workspace's pinned HyperFrames CLI. */
export function hf(args, opts = {}) {
  if (!HF_BIN) throw new Error('HyperFrames is not installed. Run: npm install');
  return run(process.execPath, [HF_BIN, ...args], opts);
}

export function probe(file) {
  const r = run(
    'ffprobe',
    ['-v', 'error', '-show_entries', 'stream=codec_type,width,height,r_frame_rate:format=duration', '-of', 'json', file],
    { capture: true },
  );
  if (r.status !== 0) throw new Error(`ffprobe failed on ${file}: ${r.stderr}`);
  const j = JSON.parse(r.stdout);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  const [n, d] = (v?.r_frame_rate || '0/1').split('/').map(Number);
  return {
    duration: Number(j.format.duration),
    width: v?.width,
    height: v?.height,
    fps: d ? n / d : 0,
    hasVideo: !!v,
    hasAudio: !!a,
  };
}

export const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'scene';
