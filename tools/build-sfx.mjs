// Builds assets/sfx/ and its catalogue from soundcn and soundfx.
// Usage: node tools/build-sfx.mjs [--src <dir holding both clones>]
//
// Licence rule: only CC0 and CC-BY-3.0 sounds enter the catalogue. soundcn's 110 World of
// Warcraft sounds are (c) Blizzard, all rights reserved, so they are excluded by licence value.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, CATALOG, probe, readJson, run, writeJson } from './lib.mjs';

const OUT = path.join(ROOT, 'assets', 'sfx');
const srcFlag = process.argv.indexOf('--src');
let src = srcFlag > -1 ? process.argv[srcFlag + 1] : null;
let tempSrc = null;

if (!src) {
  tempSrc = fs.mkdtempSync(path.join(os.tmpdir(), 'sfx-src-'));
  src = tempSrc;
  for (const repo of ['kapishdima/soundcn', 'rse/soundfx']) {
    const r = run('git', ['clone', '--depth', '1', '-q', `https://github.com/${repo}.git`, path.basename(repo)], { cwd: src });
    if (r.status !== 0) throw new Error(`Could not clone ${repo}`);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'soundcn'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'soundfx'), { recursive: true });
const sounds = [];
const excluded = {};

// soundcn: each sound is a TypeScript module holding a base64 data URI.
for (const item of readJson(path.join(src, 'soundcn', 'registry.json')).items) {
  const license = item.meta?.license;
  if (!license) continue; // library code, not a sound
  if (license !== 'CC0') {
    excluded[license] = (excluded[license] || 0) + 1;
    continue;
  }
  const ts = fs.readFileSync(path.join(src, 'soundcn', item.files[0].path), 'utf8');
  const uri = ts.match(/data:audio\/([a-z0-9]+);base64,([A-Za-z0-9+/=]+)/);
  if (!uri) throw new Error(`No audio data in ${item.name}`);
  const ext = uri[1] === 'mpeg' ? 'mp3' : uri[1];
  const file = `assets/sfx/soundcn/${item.name}.${ext}`;
  fs.writeFileSync(path.join(ROOT, file), Buffer.from(uri[2], 'base64'));
  sounds.push({
    id: `soundcn/${item.name}`,
    file,
    source: 'soundcn',
    license: 'CC0',
    author: item.author || 'Kenney',
    origin: 'https://github.com/kapishdima/soundcn',
    duration_s: item.meta.duration,
    description: item.description || '',
    tags: [...new Set([...(item.categories || []), ...(item.meta.tags || [])])],
  });
}

// soundfx: mp3 files, each with a text file naming its origin and licence.
const fxDir = path.join(src, 'soundfx', 'soundfx.d');
for (const name of fs.readdirSync(fxDir).filter((f) => f.endsWith('.mp3')).sort()) {
  const base = name.replace(/\.mp3$/, '');
  const info = fs.readFileSync(path.join(fxDir, `${base}.txt`), 'utf8');
  const field = (k) => info.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim() || '';
  const licenseName = field('License-Name');
  const license = /CC-0/.test(licenseName) ? 'CC0' : /CC-BY-3\.0/.test(licenseName) ? 'CC-BY-3.0' : null;
  if (!license) throw new Error(`Unknown licence for ${name}: ${licenseName}`);
  const file = `assets/sfx/soundfx/${name}`;
  fs.copyFileSync(path.join(fxDir, name), path.join(ROOT, file));
  sounds.push({
    id: `soundfx/${base}`,
    file,
    source: 'soundfx',
    license,
    author: field('Sound-Copyright'),
    origin: field('Sound-Origin'),
    license_url: field('License-URL'),
    duration_s: Number(probe(path.join(ROOT, file)).duration.toFixed(3)),
    description: '',
    tags: [base.replace(/\d+$/, '')],
  });
}

const counts = sounds.reduce((c, s) => ({ ...c, [s.license]: (c[s.license] || 0) + 1 }), {});
writeJson(CATALOG, { generated_by: 'tools/build-sfx.mjs', total: sounds.length, by_license: counts, excluded, sounds });
if (tempSrc) fs.rmSync(tempSrc, { recursive: true, force: true });
console.log(`Catalogue: ${sounds.length} sounds`, counts);
console.log('Excluded by licence:', excluded);
