import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseBrief } from '../brief.mjs';
import { modelFollowsTags, speechRequest } from '../elevenlabs.mjs';
import { gateMotion, gateData, visibleText } from '../gates.mjs';
import { buildGraph } from '../mix.mjs';
import { loadTiming, resolveTime } from '../lib.mjs';

const VALID = `---
brief_version: 1
id: test-film
title: Test
format: { aspect: "16:9", duration_s: 10, fps: 30 }
audience: Testers
goal: Pass
one_point: It works
hero_number: a
data:
  mode: provided
  figures:
    - { id: a, display: "5", label: things, source_url: "https://example.org" }
voice: { mode: none }
sound: { sfx: subtle, license_policy: cc0-only }
---

## Beat 1: Hook (4s)
ON SCREEN: Text

## Beat 2: Close (6s)
ON SCREEN: More text
`;

test('a valid brief has no errors', () => {
  const b = parseBrief(VALID);
  assert.deepEqual(b.errors, []);
  assert.equal(b.beats.length, 2);
  assert.equal(b.beats[1].seconds, 6);
});

test('a figure without a source is refused', () => {
  const b = parseBrief(VALID.replace(', source_url: "https://example.org"', ''));
  assert.ok(b.errors.some((e) => /source/.test(e)));
});

test('a hero number that is not a figure is refused', () => {
  const b = parseBrief(VALID.replace('hero_number: a', 'hero_number: b'));
  assert.ok(b.errors.some((e) => /hero_number/.test(e)));
});

test('a brief without frontmatter gives a plain error, not an exception', () => {
  assert.equal(parseBrief('# just a heading').errors.length, 1);
});

test('too many spoken words produces a warning', () => {
  const words = Array(40).fill('word').join(' ');
  const b = parseBrief(VALID.replace('voice: { mode: none }', 'voice: { mode: provided, file: v.mp3 }').replace('ON SCREEN: Text', `VO: ${words}`));
  assert.ok(b.warnings.some((w) => /words/.test(w)));
});

const TTS = VALID.replace('voice: { mode: none }', 'voice: { mode: tts, provider: elevenlabs }');

test('a beat can carry a tone, and audio tags do not count as spoken words', () => {
  const tags = Array(40).fill('[excited]').join(' ');
  const b = parseBrief(TTS.replace('ON SCREEN: Text', `VO: Hello there ${tags}\nTONE: Warm, then rising`));
  assert.equal(b.beats[0].tone, 'Warm, then rising');
  assert.deepEqual(b.errors, []);
  assert.ok(!b.warnings.some((w) => /words/.test(w)));
});

test('kokoro refuses audio tags because it would read them aloud', () => {
  const b = parseBrief(VALID.replace('voice: { mode: none }', 'voice: { mode: tts, provider: kokoro }').replace('ON SCREEN: Text', 'VO: [excited] Hello'));
  assert.ok(b.errors.some((e) => /Kokoro/.test(e)));
});

test('a bad language, delivery or stability is refused', () => {
  const b = parseBrief(`${TTS.replace('voice: { mode: tts, provider: elevenlabs }', 'voice: { mode: tts, provider: elevenlabs, delivery: shouty, stability: 2 }').replace('audience:', 'language: English\naudience:')}`);
  for (const word of ['language', 'delivery', 'stability']) assert.ok(b.errors.some((e) => e.includes(word)), word);
});

test('the brief sets the delivery and language of the speech request', () => {
  const r = speechRequest('Hi', { delivery: 'narration', stability: 0.45 }, 'id');
  assert.deepEqual(r.voiceSettings, { stability: 0.45, similarityBoost: 0.5 });
  assert.equal(r.languageCode, 'id');
  assert.equal(r.modelId, 'eleven_v4');
  assert.equal(speechRequest('Hi', {}).voiceSettings, undefined);
  assert.equal(speechRequest('Hi', {}, 'id', 'eleven_multilingual_v2').languageCode, undefined);
});

test('only models that follow audio tags accept them', () => {
  assert.ok(modelFollowsTags('eleven_v4'));
  assert.ok(modelFollowsTags('eleven_v3'));
  assert.ok(!modelFollowsTags('eleven_multilingual_v2'));
  assert.ok(!modelFollowsTags('eleven_flash_v2_5'));
});

function tempProject(html, figures = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  const p = { index: path.join(dir, 'index.html'), timing: path.join(dir, 'timing.js'), data: path.join(dir, 'data.json') };
  fs.writeFileSync(p.index, html);
  fs.writeFileSync(p.timing, 'window.TIMING={film:{duration:4},beat:0.5,scenes:{a:{start:0,dur:4}},cues:{go:1}};');
  fs.writeFileSync(p.data, JSON.stringify({ hero: null, figures }));
  return p;
}
const shell = (body, script = '') => `<head><title>Year 2026</title></head><script src="timing.js"></script><script src="data.js"></script><script src="runtime.js"></script><section data-scene="a">${body}</section><script>${script}</script>`;

test('motion gate passes a clean composition', () => {
  assert.deepEqual(gateMotion(tempProject(shell('<b data-figure="x"></b>', 'tl.to("#t",{x:1},cue("go"));'), [{ id: 'x', display: '5' }])), []);
});

test('motion gate ignores cue() examples in comments', () => {
  assert.deepEqual(gateMotion(tempProject(shell('', '// Use cue("name") here\ntl.to("#t",{x:1},cue("go"));'))), []);
});

test('motion gate catches an invented number', () => {
  assert.ok(gateMotion(tempProject(shell('<b>87%</b>'))).some((e) => /87/.test(e)));
});

test('motion gate catches a hard-coded position', () => {
  assert.ok(gateMotion(tempProject(shell('', 'tl.to("#t",{x:1},2.5);'))).some((e) => /2\.5/.test(e)));
});

test('motion gate catches an unknown cue, scene and figure', () => {
  const errs = gateMotion(tempProject(shell('<b data-figure="nope"></b><i data-scene="zz"></i>', 'tl.to("#t",{x:1},cue("late"));')));
  for (const word of ['nope', 'zz', 'late']) assert.ok(errs.some((e) => e.includes(word)), word);
});

test('visible text ignores head, script and allowed digits', () => {
  assert.equal(visibleText('<head><title>9</title></head><script>9</script><i data-allow-digits>9</i>Hi').trim(), 'Hi');
});

test('data gate refuses a figure with no source', () => {
  const p = { data: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'd-')), 'data.json') };
  fs.writeFileSync(p.data, JSON.stringify({ hero: 'a', figures: [{ id: 'a', value: 1, display: '1', label: 'x', source: {} }] }));
  assert.ok(gateData(p, { meta: { data: { mode: 'provided' } } }).some((e) => /source/.test(e)));
});

const TIMING = { film: { duration: 4 }, scenes: { a: { start: 1, dur: 3 } }, cues: { go: 2 } };

test('sound times resolve from cues, scenes and numbers', () => {
  assert.equal(resolveTime(TIMING, 'go', -0.5), 1.5);
  assert.equal(resolveTime(TIMING, 'a'), 1);
  assert.equal(resolveTime(TIMING, 0.25), 0.25);
  assert.throws(() => resolveTime(TIMING, 'missing'));
});

test('moving a cue moves its sound in the mix', () => {
  const at = (t) => buildGraph({ sfx: [{ id: 'x', at: 'go' }] }, t, (f) => f).graph;
  assert.match(at(TIMING), /adelay=2000/);
  assert.match(at({ ...TIMING, cues: { go: 2.5 } }), /adelay=2500/);
});

test('music ducks only when there is a voice', () => {
  const r = (f) => f;
  assert.match(buildGraph({ voice: { file: 'v' }, music: { file: 'm' } }, TIMING, r).graph, /sidechaincompress/);
  assert.doesNotMatch(buildGraph({ music: { file: 'm' } }, TIMING, r).graph, /sidechaincompress/);
});

test('a silent track of the film length sets the mix length', () => {
  const g = buildGraph({ voice: { file: 'v' } }, TIMING, (f) => f);
  assert.equal(g.inputs[g.inputs.indexOf('-t') + 1], '4');
  assert.match(g.graph, /\[1:a\]\[v\]amix=inputs=2:normalize=0:duration=longest,atrim=0:4\[bus\]/);
  assert.doesNotMatch(g.graph, /apad/);
});

test('a silent film still produces a valid graph', () => {
  const g = buildGraph({}, TIMING, (f) => f);
  assert.equal(g.hasBed, false);
  assert.ok(g.inputs.includes('anullsrc=r=48000:cl=stereo'));
});

test('timing.js loads the way the browser reads it', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 't-')), 'timing.js');
  fs.writeFileSync(f, 'window.TIMING = { film: { duration: 1 }, scenes: {}, cues: { a: 0.5 } };');
  assert.equal(loadTiming(f).cues.a, 0.5);
});
