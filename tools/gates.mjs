// One gate per job. A job is only "done" when its gate returns no errors.
import fs from 'node:fs';
import { referencesOf } from './brief.mjs';
import { colorsIn, sceneColors } from './design.mjs';
import { CATALOG, loadTiming, projectPaths, readJson, resolveTime } from './lib.mjs';

const has = (f) => fs.existsSync(f);
const SPEC_SECTIONS = ['Pacing', 'First motion', 'Cut rhythm', 'Look', 'Sound', 'Must match'];
const STUDIED_SECTIONS = ['Text behavior', 'Easing feel', 'Payoff', 'Things NOT to copy'];
const MAX_RULES = 8;
const STORY_SECTIONS = ['One point', 'Hero number', 'Beat 1', 'Beat 2', 'Beat 3'];

const missingHeadings = (text, names) =>
  names.filter((n) => !new RegExp(`^##\\s+${n}\\b`, 'im').test(text)).map((n) => `Missing section "## ${n}".`);

const sectionOf = (text, name) => text.match(new RegExp(`^##\\s+${name}\\b[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'im'))?.[1];

export function gateReference(p, brief) {
  if (!has(p.spec)) return ['spec.md does not exist.'];
  const text = fs.readFileSync(p.spec, 'utf8');
  const errors = [...missingHeadings(text, SPEC_SECTIONS), ...gateLook(p, text)];
  const fromFolder = has(p.references);
  if (fromFolder || referencesOf(brief?.meta ?? {}).length) errors.push(...gateStudied(text));
  const clips = fromFolder ? readJson(p.references).clips : Array.isArray(brief?.meta?.reference) ? referencesOf(brief.meta) : [];
  return [...errors, ...gateClips(text, clips, fromFolder)];
}

/** A spec drawn from references explains why they work, and stays testable. */
function gateStudied(spec) {
  const errors = missingHeadings(spec, STUDIED_SECTIONS);
  const rules = (sectionOf(spec, 'Must match') ?? '').split(/\r?\n/).filter((l) => /^\s*[-*]\s/.test(l)).length;
  if (rules > MAX_RULES) errors.push(`"## Must match" has ${rules} rules, and the limit is ${MAX_RULES}. Keep the ones that matter most.`);
  return errors;
}

/** With several references, the spec accounts for every clip and says which one, if any, sets the pace. */
function gateClips(spec, clips, canSkip) {
  if (!clips.length) return [];
  const section = sectionOf(spec, 'References');
  if (section === undefined) return ['Missing section "## References": this film has several reference clips.'];
  const allowed = canSkip ? ['pacing', 'moment', 'skipped'] : ['pacing', 'moment'];
  const rows = section.split(/\r?\n/).map((l) => l.split('|').map((c) => c.replace(/`/g, '').trim()));
  const errors = [];
  const roles = [];
  for (const c of clips) {
    const row = rows.find((cells) => cells[1] === c.name);
    if (!row) { errors.push(`"## References" has no row for ${c.name}.`); continue; }
    const role = row[2]?.toLowerCase();
    if (!allowed.includes(role)) errors.push(`${c.name} must have the role ${allowed.join(' or ')}, not "${row[2] ?? ''}".`);
    roles.push(role);
  }
  const pacing = roles.filter((r) => r === 'pacing').length;
  if (pacing > 1) errors.push(`Only one clip can set the film's pace, but ${pacing} have the role pacing.`);
  const clipsAreClassified = !errors.length;
  if (clipsAreClassified && !pacing && !/\bhouse\b/i.test(sectionOf(spec, 'Pacing') ?? '')) {
    errors.push('No clip sets the pace, so "## Pacing" must say it uses the house spec.');
  }
  return errors;
}

/** With a design file, the spec points to it and can't bring in colours of its own. */
function gateLook(p, spec) {
  if (!has(p.design)) return [];
  const look = sectionOf(spec, 'Look');
  if (look === undefined) return [];
  const errors = [];
  if (!look.includes('design.md')) errors.push('"## Look" must point to design.md, because this project has one.');
  const allowed = colorsIn(fs.readFileSync(p.design, 'utf8'));
  const stray = [...colorsIn(look)].filter((c) => !allowed.has(c));
  if (stray.length) errors.push(`"## Look" has colour(s) that are not in design.md: ${stray.join(', ')}.`);
  return errors;
}

/** Every colour in the scene's code must come from the project's design file. */
export function gateDesign(p) {
  if (!has(p.design)) return [];
  const allowed = colorsIn(fs.readFileSync(p.design, 'utf8'));
  if (!allowed.size) return ['design.md has no hex, rgb() or hsl() colours to check the scene against. Add the brand colours as hex values.'];
  const stray = [...sceneColors(p.scene)].filter((c) => !allowed.has(c));
  return stray.length ? [`Colour(s) in the scene that are not in design.md: ${stray.join(', ')}. Use a design.md colour. If the brand allows one of these, add it to this project's design.md.`] : [];
}

export function gateData(p, brief) {
  if (!has(p.data)) return ['data.json does not exist.'];
  const errors = [];
  let d;
  try { d = readJson(p.data); } catch (e) { return [`data.json is not valid JSON: ${e.message}`]; }
  if (!Array.isArray(d.figures)) return ['data.json needs a figures array.'];
  const ids = new Set();
  for (const f of d.figures) {
    if (!f.id) errors.push(`A figure has no id: ${JSON.stringify(f)}`);
    if (ids.has(f.id)) errors.push(`Duplicate figure id "${f.id}".`);
    ids.add(f.id);
    if (f.value === undefined || !f.display || !f.label) errors.push(`Figure "${f.id}" needs value, display and label.`);
    const s = f.source || {};
    if (!s.url && !s.path) errors.push(`Figure "${f.id}" has no source.url or source.path.`);
    if (!s.title || !s.accessed) errors.push(`Figure "${f.id}" source needs title and accessed.`);
  }
  if (brief.meta.data?.mode !== 'none' && !ids.has(d.hero)) errors.push(`data.json "hero" must name a figure (got "${d.hero}").`);
  return errors;
}

export function gateStory(p, brief) {
  if (!has(p.story)) return ['story.md does not exist.'];
  const text = fs.readFileSync(p.story, 'utf8');
  const errors = missingHeadings(text, STORY_SECTIONS);
  if (brief.meta.data?.mode !== 'none' && has(p.data)) {
    const d = readJson(p.data);
    const hero = d.figures.find((f) => f.id === d.hero);
    const section = text.match(/^##\s+Hero number\b[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/im)?.[1] || '';
    if (hero && !section.includes(hero.display)) errors.push(`"## Hero number" must contain the display value "${hero.display}" from data.json.`);
  }
  return errors;
}

export function gateVoice(p, brief) {
  if (brief.meta.voice?.mode === 'none') return [];
  const errors = [];
  const audio = has(p.voiceDir) && fs.readdirSync(p.voiceDir).find((f) => /^voice\.(mp3|wav|m4a)$/i.test(f));
  if (!audio) errors.push('voice/voice.mp3 (or .wav/.m4a) does not exist.');
  if (!has(p.transcript)) errors.push('voice/transcript.json does not exist. Run: node tools/video.mjs voice <slug>');
  return errors;
}

/** Text that a viewer reads in the HTML, with scripts and styles removed. */
export function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<head\b[\s\S]*?<\/head>/gi, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*\bdata-allow-digits\b[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

export function gateMotion(p) {
  if (!has(p.index)) return ['scene/index.html does not exist.'];
  const errors = [];
  // Comments can mention cue("name") as an example, and that isn't a real reference.
  const html = fs.readFileSync(p.index, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[\s;{}>])\/\/.*$/gm, '$1');
  for (const s of ['timing.js', 'data.js', 'runtime.js']) {
    if (!html.includes(`src="${s}"`)) errors.push(`index.html must load ${s}.`);
  }
  let timing;
  try { timing = loadTiming(p.timing); } catch (e) { return [...errors, `timing.js: ${e.message}`]; }

  for (const [, id] of html.matchAll(/data-scene="([^"]+)"/g)) {
    if (!timing.scenes[id]) errors.push(`data-scene="${id}" has no entry in timing.js scenes.`);
  }
  for (const [, id] of html.matchAll(/\bcue\(\s*["']([^"']+)["']\s*\)/g)) {
    if (!(id in timing.cues)) errors.push(`cue("${id}") has no entry in timing.js cues.`);
  }
  // Timing belongs in timing.js. A GSAP position written as a bare number can't be directed.
  for (const m of html.matchAll(/\btl\.(?:to|from|fromTo|set)\([\s\S]*?\},\s*(\d+(?:\.\d+)?)\s*\)\s*;/g)) {
    errors.push(`Hard-coded timeline position ${m[1]}. Use cue("name") from timing.js.`);
  }
  const sceneValues = Object.values(timing.scenes);
  const end = Math.max(...sceneValues.map((s) => s.start + s.dur));
  if (Math.abs(end - timing.film.duration) > 0.001) errors.push(`Scenes end at ${end}s but film.duration is ${timing.film.duration}s.`);

  // Every number on screen must trace back to data.json.
  const figures = has(p.data) ? readJson(p.data).figures : [];
  const ids = new Set(figures.map((f) => f.id));
  for (const [, id] of html.matchAll(/data-figure="([^"]+)"/g)) {
    if (!ids.has(id)) errors.push(`data-figure="${id}" is not in data.json.`);
  }
  const allowed = figures.map((f) => String(f.display));
  let text = visibleText(html);
  for (const a of allowed) text = text.split(a).join(' ');
  const stray = text.match(/\d[\d,.]*/g);
  if (stray) errors.push(`Number(s) on screen that are not from data.json: ${[...new Set(stray)].join(', ')}. Use data-figure="id", or data-allow-digits for non-data text such as a year in a source line.`);
  errors.push(...gateDesign(p));
  return errors;
}

export function gateSound(p, brief) {
  if (!has(p.sound)) return ['sound.json does not exist.'];
  let s;
  try { s = readJson(p.sound); } catch (e) { return [`sound.json is not valid JSON: ${e.message}`]; }
  const errors = [];
  const timing = loadTiming(p.timing);
  const catalog = has(CATALOG) ? readJson(CATALOG) : { sounds: [] };
  const byId = new Map(catalog.sounds.map((x) => [x.id, x]));
  const policy = brief.meta.sound?.license_policy;
  for (const c of s.sfx || []) {
    const entry = byId.get(c.id);
    if (!entry) { errors.push(`Sound "${c.id}" is not in the catalogue.`); continue; }
    if (policy === 'cc0-only' && entry.license !== 'CC0') errors.push(`"${c.id}" is ${entry.license} but this brief allows CC0 only.`);
    try {
      const t = resolveTime(timing, c.at, c.offset);
      if (t >= timing.film.duration) errors.push(`"${c.id}" lands at ${t}s, after the film ends.`);
    } catch (e) { errors.push(`"${c.id}": ${e.message}`); }
    if (!c.why) errors.push(`"${c.id}" needs a "why": what on-screen moment it serves.`);
  }
  if (brief.meta.voice?.mode !== 'none' && !s.voice) errors.push('The brief has a voice, so sound.json needs a voice block.');
  if (s.voice) { try { resolveTime(timing, s.voice.at ?? 0); } catch (e) { errors.push(`voice: ${e.message}`); } }
  if (brief.meta.sound?.sfx === 'none' && (s.sfx || []).length) errors.push('The brief says sound.sfx: none, but sound.json has effects.');
  return errors;
}

export const GATES = {
  reference: gateReference,
  data: gateData,
  story: gateStory,
  voice: gateVoice,
  motion: gateMotion,
  sound: gateSound,
};

export const runGate = (job, slug, brief) => GATES[job](projectPaths(slug), brief);
