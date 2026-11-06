import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { parseBrief, referencesOf } from '../brief.mjs';
import { modelFollowsTags, speechRequest } from '../elevenlabs.mjs';
import { colorsIn, designWarnings } from '../design.mjs';
import { gateDesign, gateMotion, gateData, gateReference, visibleText } from '../gates.mjs';
import { buildGraph } from '../mix.mjs';
import { loadTiming, referenceFolder, resolveTime } from '../lib.mjs';
import { createChecklistServer, funnelStatus, renderMarkdown, resolveAllowed } from '../funnel.mjs';

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

function brandProject(design, html = '') {
  const p = tempProject(shell('', 'tl.to("#t",{x:1},cue("go"));') + html);
  p.scene = path.dirname(p.index);
  p.design = path.join(p.scene, 'design.source');
  p.spec = path.join(p.scene, 'spec.md');
  fs.writeFileSync(p.design, design);
  return p;
}
const sectionsWith = (look) => `## Pacing\n## First motion\n## Cut rhythm\n## Look\n${look}\n## Sound\n## Must match\n`;

test('colours are read as hex, rgb and hsl, ignoring transparency', () => {
  const found = colorsIn('#FFB000 #abc #11223344 rgba(255, 0, 0, 0.5) hsl(0, 0%, 100%)');
  assert.deepEqual([...found].sort(), ['#112233', '#aabbcc', '#ff0000', '#ffb000', '#ffffff']);
});

test('colour reading skips entities, links, words and variables', () => {
  assert.equal(colorsIn('&#123; href="#abc" issue#123 #abcdefg').size, 0);
  assert.deepEqual([...colorsIn('color: var(--gold); border: 1px solid', { named: true })], []);
  assert.deepEqual([...colorsIn('the gold standard', { named: true })], []);
  assert.deepEqual([...colorsIn('.a { color: white }', { named: true })], ['#ffffff']);
});

test('the gate accepts brand colours in any notation', () => {
  const p = brandProject('Accent #FFB000, ink #101114', '<style>.a{color:#ffb000;background:rgba(16,17,20,.4)}</style>');
  assert.deepEqual(gateMotion(p), []);
});

test('the gate refuses a colour that is not in the design file', () => {
  const p = brandProject('Accent #FFB000', '<style>.a{color:#ffb000;background:#00ff00;fill:white}</style>');
  const errs = gateMotion(p);
  assert.ok(errs.some((e) => e.includes('#00ff00') && e.includes('#ffffff') && !e.includes('#ffb000')), errs.join());
});

test('a scene id that looks like hex is not a colour', () => {
  const p = brandProject('Accent #FFB000', '<section id="add"></section><style>#add{color:#ffb000}</style><script>tl.from("#add .title",{y:1},cue("go"));</script>');
  assert.deepEqual(gateMotion(p), []);
});

test('the gate checks css files beside the scene and skips libraries', () => {
  const p = brandProject('Accent #FFB000');
  fs.writeFileSync(path.join(p.scene, 'gsap.min.js'), 'var a="#123456";');
  assert.deepEqual(gateDesign(p), []);
  fs.writeFileSync(path.join(p.scene, 'look.css'), '.a{color:#123456}');
  assert.ok(gateDesign(p).some((e) => e.includes('#123456')));
});

test('a design file without readable colours is refused, and no design file means no check', () => {
  const p = brandProject('Use brand orange.', '<style>.a{color:#123456}</style>');
  assert.ok(gateDesign(p).some((e) => /no hex/.test(e)));
  assert.ok(designWarnings('Use brand orange.').some((w) => /no hex/.test(w)));
  fs.rmSync(p.design);
  assert.deepEqual(gateDesign(p), []);
});

test('a brief palette that disagrees with the design file gets a warning', () => {
  assert.deepEqual(designWarnings('#FFB000', ['#ffb000']), []);
  assert.ok(designWarnings('#FFB000', ['#123456']).some((w) => w.includes('#123456')));
});

test('with a design file, the spec look must point to it and add no colours', () => {
  const p = brandProject('Accent #FFB000');
  fs.writeFileSync(p.spec, sectionsWith('Dark and heavy.'));
  assert.ok(gateReference(p).some((e) => /must point to design\.md/.test(e)));
  fs.writeFileSync(p.spec, sectionsWith('See design.md, plus #123456.'));
  assert.ok(gateReference(p).some((e) => e.includes('#123456')));
  fs.writeFileSync(p.spec, sectionsWith('See design.md. Accent #FFB000.'));
  assert.deepEqual(gateReference(p), []);
});

test('brand.design must be a Markdown file', () => {
  const withDesign = (v) => parseBrief(VALID.replace('voice: { mode: none }', `voice: { mode: none }\nbrand: { design: ${v} }`));
  assert.ok(withDesign('look.pdf').errors.some((e) => /brand\.design/.test(e)));
  assert.deepEqual(withDesign('../../brand/client-x.md').errors, []);
});

const withRef = (yaml) => parseBrief(VALID.replace('voice: { mode: none }', `voice: { mode: none }\n${yaml}`));
const TWO_CLIPS = 'reference:\n  - { file: a.mp4, why: pace }\n  - { url: "https://example.org/b", why: the slam }';

test('one reference and a list of clips are both valid, and get their names', () => {
  const one = withRef('reference: { url: "https://example.org/a" }');
  assert.deepEqual(one.errors, []);
  assert.equal(referencesOf(one.meta)[0].name, 'reference');
  const list = withRef(TWO_CLIPS);
  assert.deepEqual(list.errors, []);
  assert.deepEqual(referencesOf(list.meta).map((c) => c.name), ['reference-1', 'reference-2']);
  assert.ok(!list.warnings.some((w) => /house style/.test(w)));
});

test('a reference that cannot be used is refused instead of dropped', () => {
  for (const [yaml, word] of [
    ['reference: a.mp4', 'reference needs one of file, url or from'],
    ['reference: { file: [a.mp4, b.mp4] }', 'reference needs one of file, url or from'],
    ['reference: [a.mp4, b.mp4]', 'reference-1 needs one of file, url or from'],
    ['reference:\n  - { file: a.mp4 }', 'reference-1 needs a why'],
    ['reference:\n  - { file: a.mp4, url: "https://example.org", why: x }', 'reference-1 needs one of file, url or from'],
    ['reference:\n  - { file: a.mp4, from: a.mp4, why: x }', 'reference-1 needs one of file, url or from'],
    ['reference: { from: ../secret.mp4 }', 'from is a file name inside references/'],
  ]) assert.ok(withRef(yaml).errors.some((e) => e.includes(word)), yaml);
  assert.deepEqual(withRef('reference: { from: a.mp4 }').errors, []);
});

test('the warning says where a film with no named reference gets its clips', () => {
  assert.ok(withRef('reference: []').warnings.some((w) => /references\/ folder/.test(w)));
  assert.ok(parseBrief(VALID).warnings.some((w) => /references\/ folder/.test(w)));
  assert.ok(withRef('reference: none').warnings.some((w) => /reference is none/.test(w)));
});

test('the shared folder lists videos and URLs, and ignores everything else', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'folder-'));
  assert.deepEqual(referenceFolder(path.join(dir, 'missing')), []);
  for (const f of ['b clip.MOV', 'a.mp4', 'README.md']) fs.writeFileSync(path.join(dir, f), '');
  fs.mkdirSync(path.join(dir, 'studies'));
  fs.writeFileSync(path.join(dir, 'urls.txt'), '# a note\n\nhttps://example.org/x\r\n');
  const clips = referenceFolder(dir);
  assert.deepEqual(clips.map((c) => c.name), ['a.mp4', 'b clip.MOV', 'link-1']);
  assert.equal(clips[1].study, 'references/studies/b_clip_mov');
  assert.equal(clips[2].url, 'https://example.org/x');
  assert.match(clips[2].study, /^references\/studies\/link-[0-9a-f]{8}$/);
  assert.equal(referenceFolder(dir)[2].study, clips[2].study);
  fs.writeFileSync(path.join(dir, 'urls.txt'), 'not a url\n');
  assert.throws(() => referenceFolder(dir), /not a URL/);
});

const STUDIED = '## Text behavior\n## Easing feel\n## Payoff\n## Things NOT to copy\n';

function clipSpec(rows, pacing = 'From reference-1.') {
  const p = { spec: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ref-')), 'spec.md') };
  const table = rows === null ? '' : `## References\n| Clip | Role | Take | Where | Measured |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
  fs.writeFileSync(p.spec, `## Pacing\n${pacing}\n## First motion\n## Cut rhythm\n## Look\n## Sound\n## Must match\n${STUDIED}${table}`);
  return gateReference(p, withRef(TWO_CLIPS));
}

function folderSpec({ rows, pacing = 'House spec.', rules = 3, studied = STUDIED }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ref-'));
  const p = { spec: path.join(dir, 'spec.md'), references: path.join(dir, 'references.json') };
  fs.writeFileSync(p.references, JSON.stringify({ clips: [{ name: 'a.mp4' }, { name: 'link-1' }] }));
  const table = `## References\n| Clip | Role | Take | Where | Measured |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
  fs.writeFileSync(p.spec, `## Pacing\n${pacing}\n## First motion\n## Cut rhythm\n## Look\n## Sound\n## Must match\n${'- rule\n'.repeat(rules)}${studied}${table}`);
  return gateReference(p, parseBrief(VALID));
}

test('a film from the folder accounts for every clip, and can skip some', () => {
  const skipAll = ['| a.mp4 | skipped | x | | |', '| link-1 | skipped | x | | |'];
  assert.deepEqual(folderSpec({ rows: skipAll }), []);
  assert.deepEqual(folderSpec({ rows: ['| a.mp4 | pacing | x | Film | y |', '| link-1 | skipped | x | | |'], pacing: 'From a.mp4.' }), []);
  assert.ok(folderSpec({ rows: ['| a.mp4 | skipped | x | | |'] }).some((e) => /no row for link-1/.test(e)));
  assert.ok(folderSpec({ rows: skipAll, pacing: 'Fast.' }).some((e) => /house spec/.test(e)));
});

test('a spec drawn from references needs your sections and at most 8 rules', () => {
  const rows = ['| a.mp4 | skipped | x | | |', '| link-1 | skipped | x | | |'];
  assert.deepEqual(folderSpec({ rows, rules: 8 }), []);
  assert.ok(folderSpec({ rows, rules: 9 }).some((e) => /has 9 rules/.test(e)));
  const missing = folderSpec({ rows, studied: '' });
  for (const name of ['Text behavior', 'Easing feel', 'Payoff', 'Things NOT to copy']) assert.ok(missing.some((e) => e.includes(name)), name);
});

test('skipping is only for the folder, because a listed clip was chosen on purpose', () => {
  assert.ok(clipSpec(['| reference-1 | skipped | x | y | z |', '| reference-2 | moment | x | y | z |'], 'House.').some((e) => /skipped/.test(e)));
});

test('the spec gate passes when every clip has a role', () => {
  assert.deepEqual(clipSpec(['| reference-1 | pacing | x | Film | y |', '| `reference-2` | Moment | x | Beat 2 | y |']), []);
});

test('the spec gate refuses a missing section, a missing clip and a bad role', () => {
  assert.ok(clipSpec(null).some((e) => /## References/.test(e)));
  assert.ok(clipSpec(['| reference-1 | pacing | x | Film | y |']).some((e) => /no row for reference-2/.test(e)));
  assert.ok(clipSpec(['| reference-1 | pacing | x | Film | y |', '| reference-2 | vibes | x | y | z |']).some((e) => /vibes/.test(e)));
});

test('only one clip sets the pace, and with none the spec says house', () => {
  assert.ok(clipSpec(['| reference-1 | pacing | x | y | z |', '| reference-2 | pacing | x | y | z |']).some((e) => /Only one/.test(e)));
  const moments = ['| reference-1 | moment | x | y | z |', '| reference-2 | moment | x | y | z |'];
  assert.ok(clipSpec(moments, 'Fast.').some((e) => /house spec/.test(e)));
  assert.deepEqual(clipSpec(moments, 'House spec, because no clip can set the pace.'), []);
});

test('a brief with one reference needs no references section', () => {
  const p = { spec: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ref-')), 'spec.md') };
  fs.writeFileSync(p.spec, sectionsWith('Dark.') + STUDIED);
  assert.deepEqual(gateReference(p, withRef('reference: { file: a.mp4 }')), []);
});

test('a house-style film needs none of the study sections', () => {
  const p = { spec: path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ref-')), 'spec.md') };
  fs.writeFileSync(p.spec, sectionsWith('Dark.'));
  assert.deepEqual(gateReference(p, parseBrief(VALID)), []);
  assert.deepEqual(gateReference(p, withRef('reference: none')), []);
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

// Checklist page

test('checklist Markdown: file content cannot add tags or script links', () => {
  const html = renderMarkdown('# Hi <script>alert(1)</script>\n\n[bad](javascript:alert(1)) [good](https://example.com) ![pic](x.png)\n\n<img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('javascript:'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('<a href="https://example.com"'));
});

test('checklist Markdown: renders the shapes briefs and specs use', () => {
  const html = renderMarkdown('---\nid: a\n---\n## Head\n\n- one\n- two\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```\ncode <b>\n```\n');
  assert.ok(html.includes('<pre class="frontmatter">id: a</pre>'));
  assert.ok(html.includes('<h2>Head</h2>'));
  assert.ok(html.includes('<li>two</li>'));
  assert.ok(html.includes('<td>2</td>'));
  assert.ok(html.includes('<pre>code &lt;b&gt;</pre>'));
});

test('checklist paths: only the allowed folders, never .env', () => {
  for (const bad of ['.env', 'briefs/../.env', 'briefs/..\.env', 'briefs/.env', 'tools/lib.mjs', 'node_modules/x', 'projects/a/secret.txt', 'references/x.pem', 'C:/Windows/win.ini', '', null]) {
    assert.equal(resolveAllowed(bad), null, String(bad));
  }
  assert.ok(resolveAllowed('brand/DESIGN.md'));
  assert.ok(resolveAllowed('projects/not-made-yet/spec.md'));
});

test('checklist status: says a key is set without ever carrying its value', () => {
  const before = process.env.ELEVENLABS_API_KEY;
  process.env.ELEVENLABS_API_KEY = 'sentinel-value-do-not-show';
  try {
    const status = funnelStatus(null);
    assert.equal(status.checks.env.state, 'ok');
    assert.equal(status.checks.env.path, undefined);
    assert.ok(!JSON.stringify(status).includes('sentinel-value-do-not-show'));
  } finally {
    if (before === undefined) delete process.env.ELEVENLABS_API_KEY;
    else process.env.ELEVENLABS_API_KEY = before;
  }
});

test('checklist server: reads only, for this PC only', async (t) => {
  const server = createChecklistServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); }));
  const { port } = server.address();
  const url = (p) => `http://127.0.0.1:${port}${p}`;

  const page = await fetch(url('/'));
  assert.equal(page.status, 200);
  const text = await page.text();
  const csp = page.headers.get('content-security-policy');
  const nonce = csp.match(/'nonce-([^']+)'/)[1];
  assert.ok(text.includes(`<script nonce="${nonce}">`));
  assert.ok(!text.includes('__CSP_NONCE__'));

  for (const p of ['.env', 'briefs/../.env', 'briefs/%2e%2e/.env', 'tools/lib.mjs']) {
    const res = await fetch(url(`/api/entry?path=${p}`));
    assert.equal(res.status, 403, p);
    const raw = await fetch(url(`/raw?path=${p}`));
    assert.equal(raw.status, 403, p);
  }
  assert.equal((await fetch(url('/raw?path=brand/DESIGN.md'))).status, 403);
  assert.equal((await fetch(url('/api/entry?path=projects/not-made-yet/spec.md'))).status, 404);
  assert.equal((await fetch(url('/api/status'), { method: 'POST' })).status, 405);
  assert.equal((await fetch(url('/api/status?project=not-made-yet'))).status, 404);

  const wrongHost = await new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path: '/api/status', headers: { Host: 'evil.example' } }, (res) => { res.resume(); resolve(res.statusCode); }).on('error', reject);
  });
  assert.equal(wrongHost, 403);

  const entry = await (await fetch(url('/api/entry?path=brand/DESIGN.md'))).json();
  assert.equal(entry.kind, 'markdown');
  assert.ok(entry.html.length > 0);
});

test('checklist server: a video can be seeked with a byte range', async (t) => {
  const name = `range-test-${process.pid}.mp4`;
  const file = path.join('references', name);
  fs.writeFileSync(file, '0123456789');
  const server = createChecklistServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => { fs.rmSync(file, { force: true }); server.closeAllConnections(); server.close(resolve); }));
  const res = await fetch(`http://127.0.0.1:${server.address().port}/raw?path=references/${name}`, { headers: { Range: 'bytes=2-4' } });
  assert.equal(res.status, 206);
  assert.equal(await res.text(), '234');
});
