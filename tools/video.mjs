#!/usr/bin/env node
// Video studio CLI. Claude Code drives this from the skills in .claude/skills.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseBrief } from './brief.mjs';
import { GATES, runGate } from './gates.mjs';
import { measureLufs, mix, mux } from './mix.mjs';
import {
  CATALOG, DIMENSIONS, ROOT, hashPaths, hf, loadEnv, loadTiming, probe, projectPaths,
  readJson, resolveTime, run, slugify, writeJson,
} from './lib.mjs';

loadEnv();
const JOB_ORDER = ['reference', 'data', 'story', 'voice', 'motion', 'sound'];
const OUTPUTS = {
  reference: (p) => [p.spec],
  data: (p) => [p.data],
  story: (p) => [p.story],
  voice: (p) => [p.voiceDir],
  motion: (p) => [p.index],
  sound: (p) => [p.sound],
};
const fail = (msg) => { console.error(`\nSTOP: ${msg}`); process.exit(1); };
const workers = () => process.env.RENDER_WORKERS || '2';

function loadBrief(slug) {
  const p = projectPaths(slug);
  if (!fs.existsSync(p.brief)) fail(`No project "${slug}". Existing: ${listProjects().join(', ') || 'none'}`);
  return parseBrief(fs.readFileSync(p.brief, 'utf8'));
}
function listProjects() {
  const d = path.join(ROOT, 'projects');
  return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => fs.existsSync(path.join(d, n, 'brief.md'))) : [];
}
const loadState = (slug) => readJson(projectPaths(slug).state);
const saveState = (slug, s) => writeJson(projectPaths(slug).state, s);

/** Everything that changes what the viewer sees or hears. Approval is tied to this hash. */
const pictureHash = (p) => hashPaths([p.scene]);
const filmHash = (p) => hashPaths([p.scene, p.sound, p.data, p.voiceDir, p.inputs]);

function printBriefResult(file, b) {
  for (const w of b.warnings) console.log(`  warning: ${w}`);
  if (b.errors.length) {
    console.error(`\n${file} has ${b.errors.length} problem(s):`);
    for (const e of b.errors) console.error(`  - ${e}`);
  } else console.log(`${file}: valid`);
}

function cmdCheckBrief(file) {
  if (!file || !fs.existsSync(file)) fail(`Brief not found: ${file}`);
  const b = parseBrief(fs.readFileSync(file, 'utf8'));
  printBriefResult(file, b);
  if (b.errors.length) process.exit(1);
}

function scaffoldScene(p, b) {
  const [w, h] = DIMENSIONS[b.meta.format.aspect];
  const tpl = path.join(ROOT, 'templates', 'scene');
  fs.cpSync(tpl, p.scene, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'node_modules', 'gsap', 'dist', 'gsap.min.js'), path.join(p.scene, 'gsap.min.js'));

  let t = 0;
  const scenes = {};
  const cues = {};
  const sections = [];
  const scale = b.meta.format.duration_s / b.beats.reduce((s, x) => s + x.seconds, 0);
  b.beats.forEach((beat, i) => {
    const id = slugify(beat.name);
    const dur = Number((beat.seconds * scale).toFixed(3));
    scenes[id] = { start: Number(t.toFixed(3)), dur };
    cues[`${id}_in`] = Number((t + (i === 0 ? 0 : 0.2)).toFixed(3));
    sections.push(`      <section id="${id}" class="clip" data-scene="${id}"><h1 class="title">${beat.name}</h1></section>`);
    t += dur;
  });
  const end = Number(t.toFixed(3));
  const lines = Object.entries(scenes).map(([k, v]) => `    ${k}: { start: ${v.start}, dur: ${v.dur} },`).join('\n');
  const cueLines = Object.entries(cues).map(([k, v]) => `    ${k}: ${v},`).join('\n');
  fs.writeFileSync(p.timing, `// Every moment in the film lives here. A note like "title is a beat late" changes one line.
window.TIMING = {
  film: { duration: ${end}, fps: ${b.meta.format.fps ?? 30} },
  beat: 0.5, // seconds in one "beat" when a note says "a beat late". The motion job sets this from the spec.
  scenes: {
${lines}
  },
  cues: {
${cueLines}
  },
};
`);
  const html = fs.readFileSync(p.index, 'utf8')
    .replaceAll('{{WIDTH}}', w).replaceAll('{{HEIGHT}}', h)
    .replaceAll('{{DURATION}}', end)
    .replaceAll('{{TITLE}}', b.meta.title.replace(/[<>&]/g, ''))
    .replace('{{SECTIONS}}', sections.join('\n'))
    .replace('{{ANIMATIONS}}', Object.keys(scenes)
      .map((id) => `      tl.from("#${id} .title", { opacity: 0, y: 30, duration: 0.4, ease: "power3.out" }, cue("${id}_in"));`).join('\n'));
  fs.writeFileSync(p.index, html);
}

function cmdNew(file, flags) {
  if (!file || !fs.existsSync(file)) fail(`Brief not found: ${file}`);
  const text = fs.readFileSync(file, 'utf8');
  const b = parseBrief(text);
  printBriefResult(file, b);
  if (b.errors.length) process.exit(1);
  const slug = b.meta.id;
  const p = projectPaths(slug);
  if (fs.existsSync(p.dir)) fail(`projects/${slug} already exists. Change the brief's id, or resume with /video ${slug}.`);

  const briefDir = path.dirname(path.resolve(file));
  const attachments = {
    reference: b.meta.reference?.file,
    voice: b.meta.voice?.file,
    music: b.meta.sound?.music && b.meta.sound.music !== 'none' ? b.meta.sound.music : null,
    logo: b.meta.brand?.logo,
  };
  const resolved = {};
  for (const [k, rel] of Object.entries(attachments)) {
    if (!rel) continue;
    const src = path.resolve(briefDir, rel);
    if (!fs.existsSync(src)) fail(`The brief points to a file that does not exist: ${rel}`);
    resolved[k] = { src, name: `${k}${path.extname(src)}` };
  }
  fs.mkdirSync(p.inputs, { recursive: true });
  fs.mkdirSync(p.voiceDir, { recursive: true });
  fs.writeFileSync(p.brief, text);
  const inputs = {};
  for (const [k, v] of Object.entries(resolved)) {
    fs.copyFileSync(v.src, path.join(p.inputs, v.name));
    inputs[k] = `inputs/${v.name}`;
  }
  scaffoldScene(p, b);
  saveState(slug, { slug, created: new Date().toISOString(), inputs, jobs: {}, approval: null });
  if (!flags.keep && path.resolve(file).startsWith(path.join(ROOT, 'briefs', 'inbox'))) {
    const dest = path.join(ROOT, 'briefs', 'archive', `${slug}.md`);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(file, dest);
  }
  syncScene(slug);
  console.log(`\nCreated projects/${slug}`);
  cmdStatus(slug);
}

function syncScene(slug) {
  const p = projectPaths(slug);
  const d = fs.existsSync(p.data) ? readJson(p.data) : { figures: [], hero: null };
  const figures = Object.fromEntries(d.figures.map((f) => [f.id, { display: f.display, value: f.value, label: f.label }]));
  fs.writeFileSync(p.dataJs, `// Generated from ../data.json by tools/video.mjs. Do not edit: change data.json.\nwindow.DATA = ${JSON.stringify({ hero: d.hero, figures }, null, 2)};\n`);
}

function jobStatus(slug, brief) {
  const p = projectPaths(slug);
  const state = loadState(slug);
  const result = {};
  let upstreamChanged = false;
  for (const job of JOB_ORDER) {
    const rec = state.jobs[job];
    if (job === 'voice' && brief.meta.voice?.mode === 'none') { result[job] = 'skipped'; continue; }
    if (!rec) { result[job] = 'pending'; continue; }
    const changed = hashPaths(OUTPUTS[job](p)) !== rec.hash;
    if (changed) result[job] = 'changed since done';
    else if (upstreamChanged) result[job] = 'review: upstream changed';
    else result[job] = 'done';
    if (changed) upstreamChanged = true;
  }
  return result;
}

function cmdStatus(slug) {
  if (!slug) {
    const inbox = path.join(ROOT, 'briefs', 'inbox');
    const waiting = fs.existsSync(inbox) ? fs.readdirSync(inbox).filter((f) => f.endsWith('.md')) : [];
    console.log(`Inbox: ${waiting.length ? waiting.join(', ') : 'empty'}`);
    for (const s of listProjects()) {
      const st = jobStatus(s, loadBrief(s));
      const next = JOB_ORDER.find((j) => st[j] !== 'done' && st[j] !== 'skipped');
      const shipped = fs.existsSync(projectPaths(s).final);
      console.log(`  ${s}: ${shipped ? 'shipped' : next ? `next job: ${next}` : 'ready for direct/ship'}`);
    }
    return;
  }
  const st = jobStatus(slug, loadBrief(slug));
  const state = loadState(slug);
  for (const j of JOB_ORDER) console.log(`  ${j.padEnd(10)} ${st[j]}`);
  console.log(`  ${'direct'.padEnd(10)} open until approved (notes change scene/timing.js)`);
  const p = projectPaths(slug);
  const approved = state.approval && fs.existsSync(p.sound) && state.approval.hash === filmHash(p);
  console.log(`  ${'ship'.padEnd(10)} ${fs.existsSync(p.final) && approved ? 'shipped' : approved ? 'approved, run final' : state.approval ? 'approval expired: film changed' : 'not approved'}`);
  const next = JOB_ORDER.find((j) => st[j] !== 'done' && st[j] !== 'skipped');
  console.log(`\nNext: ${next ? `/video-${next} ${slug}` : `/video-ship ${slug}`}`);
}

function cmdDone(slug, job) {
  if (!GATES[job]) fail(`Unknown job "${job}". Jobs: ${JOB_ORDER.join(', ')}`);
  const brief = loadBrief(slug);
  syncScene(slug);
  const errors = runGate(job, slug, brief);
  if (errors.length) {
    console.error(`The ${job} job is not done:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  const state = loadState(slug);
  state.jobs[job] = { hash: hashPaths(OUTPUTS[job](projectPaths(slug))), at: new Date().toISOString() };
  saveState(slug, state);
  console.log(`${job}: done`);
}

function cmdVoice(slug) {
  const p = projectPaths(slug);
  const b = loadBrief(slug);
  const state = loadState(slug);
  const v = b.meta.voice;
  let audio;
  if (v.mode === 'none') { console.log('This brief has no voice.'); return; }
  if (v.mode === 'provided') {
    audio = path.join(p.voiceDir, `voice${path.extname(state.inputs.voice)}`);
    fs.copyFileSync(path.join(p.dir, state.inputs.voice), audio);
  } else {
    if (!fs.existsSync(p.voiceScript)) fail('voice/script.txt does not exist. Write the spoken script there first.');
    audio = v.provider === 'kokoro' ? kokoro(p, v) : null;
    if (!audio) return elevenlabs(p, v).then((f) => transcribeTo(f, p.transcript, b));
  }
  transcribeTo(audio, p.transcript, b);
}

function kokoro(p, v) {
  const out = path.join(p.voiceDir, 'voice.wav');
  const r = hf(['tts', p.voiceScript, '-o', out, ...(v.voice_id ? ['-v', v.voice_id] : [])]);
  if (r.status !== 0) fail('Kokoro failed. It needs: pip install kokoro-onnx soundfile');
  return out;
}

async function elevenlabs(p, v) {
  const key = process.env.ELEVENLABS_API_KEY;
  const voice = v.voice_id || process.env.ELEVENLABS_VOICE_ID;
  if (!key) fail('ELEVENLABS_API_KEY is empty. Add it to .env (never paste it in chat), or use voice.provider: kokoro.');
  if (!voice) fail('No voice id. Set voice.voice_id in the brief or ELEVENLABS_VOICE_ID in .env.');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text: fs.readFileSync(p.voiceScript, 'utf8'), model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2' }),
  });
  if (!res.ok) fail(`ElevenLabs returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const out = path.join(p.voiceDir, 'voice.mp3');
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return out;
}

function transcribeTo(audio, output, brief) {
  const lang = brief?.meta?.language || 'en';
  const args = lang === 'en' ? ['--model', 'small.en'] : ['--model', 'small', '--language', lang];
  const r = hf(['transcribe', audio, ...args, '--json'], { capture: true });
  if (r.status !== 0) fail(`Transcription failed:\n${(r.stderr || '').slice(-800)}`);
  const m = r.stdout.match(/[\[{][\s\S]*[\]}]/);
  if (!m) fail(`Unexpected transcribe output:\n${r.stdout.slice(0, 500)}`);
  // --json prints a status object. The words themselves are in the file it names.
  const status = JSON.parse(m[0]);
  if (!status.ok || !status.transcriptPath) fail(`Transcription did not finish:\n${m[0].slice(0, 500)}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  if (path.resolve(status.transcriptPath) !== path.resolve(output)) fs.copyFileSync(status.transcriptPath, output);
  console.log(`Transcript: ${path.relative(ROOT, output)} (${status.engine}, ${status.wordCount} words, ${status.durationSeconds}s)`);
}

function cmdSfx(args) {
  if (!fs.existsSync(CATALOG)) fail('No sound catalogue. Run: npm run sfx:build');
  const policyAt = args.indexOf('--policy');
  const policy = policyAt > -1 ? args[policyAt + 1] : 'attribution-ok';
  const terms = args.filter((a, i) => policyAt === -1 || (i !== policyAt && i !== policyAt + 1)).map((t) => t.toLowerCase());
  const score = (s) => terms.reduce((n, t) => n + (s.id.toLowerCase().includes(t) ? 3 : 0) + (s.tags.some((x) => String(x).toLowerCase().includes(t)) ? 2 : 0) + (s.description.toLowerCase().includes(t) ? 1 : 0), 0);
  const hits = readJson(CATALOG).sounds
    .filter((s) => policy !== 'cc0-only' || s.license === 'CC0')
    .map((s) => [score(s), s]).filter(([n]) => n > 0).sort((a, b) => b[0] - a[0]).slice(0, 15);
  for (const [, s] of hits) console.log(`${s.id.padEnd(34)} ${String(s.duration_s).padEnd(7)}s ${s.license.padEnd(10)} ${s.description.slice(0, 70)}`);
  if (!hits.length) console.log('No match. Try a broader word: whoosh, click, impact, chime, slide, tick, power.');
}

/** Renders picture only. Reuses the last render when the scene has not changed. */
function renderPicture(slug, quality) {
  const p = projectPaths(slug);
  fs.mkdirSync(p.work, { recursive: true });
  const out = path.join(p.work, `picture-${quality}.mp4`);
  const stamp = `${out}.hash`;
  const hash = pictureHash(p);
  if (fs.existsSync(out) && fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === hash) {
    console.log(`Picture unchanged, reusing ${path.relative(ROOT, out)}`);
    return out;
  }
  const r = hf(['render', p.scene, '-o', out, '-q', quality, '-w', workers(), '--no-best-effort', '--quiet']);
  if (r.status !== 0) fail('HyperFrames render failed.');
  fs.writeFileSync(stamp, hash);
  return out;
}

function cmdStills(slug) {
  const p = projectPaths(slug);
  const brief = loadBrief(slug);
  syncScene(slug);
  const gateErrors = {};
  for (const job of JOB_ORDER) {
    const e = runGate(job, slug, brief);
    if (e.length) gateErrors[job] = e;
  }
  console.log('Running HyperFrames check...');
  const check = hf(['check', p.scene], { capture: true });
  const checkTail = (check.stdout || '').split('\n').filter((l) => /⚠|✗|error\(s\)|Check (passed|failed)/.test(l)).slice(-14).join('\n');
  console.log(checkTail);
  fs.rmSync(p.stills, { recursive: true, force: true });
  const snap = hf(['snapshot', p.scene, '--review', '--output', p.stills], { capture: true });
  if (snap.status !== 0) console.error(snap.stderr || snap.stdout);
  const passed = !Object.keys(gateErrors).length && check.status === 0 && snap.status === 0;
  writeJson(p.checks, {
    hash: filmHash(p),
    passed,
    gates: gateErrors,
    hyperframes_check: check.status === 0 ? 'passed' : 'failed',
    stills: fs.existsSync(p.stills) ? fs.readdirSync(p.stills) : [],
    at: new Date().toISOString(),
  });
  for (const [job, errs] of Object.entries(gateErrors)) { console.error(`${job}:`); errs.forEach((e) => console.error(`  - ${e}`)); }
  console.log(`\nStills: ${path.relative(ROOT, p.stills)}\nMachine checks: ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) process.exit(1);
}

function cmdDraft(slug) {
  const p = projectPaths(slug);
  syncScene(slug);
  const picture = renderPicture(slug, 'draft');
  const { file } = mix(slug);
  mux(picture, file, p.draft);
  const info = probe(p.draft);
  console.log(`Draft: ${path.relative(ROOT, p.draft)} (${info.duration.toFixed(2)}s, ${info.width}x${info.height})`);
}

function cmdApprove(slug, note) {
  const p = projectPaths(slug);
  if (!note) fail('approve needs the words the person used, e.g. approve my-video --note "yes, ship it".');
  if (!fs.existsSync(p.checks)) fail('Run stills first.');
  syncScene(slug);
  const checks = readJson(p.checks);
  if (!checks.passed) fail('The last stills run failed its checks.');
  if (checks.hash !== filmHash(p)) fail('The film changed after the last stills run. Run stills again so the person approves what will ship.');
  const state = loadState(slug);
  state.approval = { hash: checks.hash, note, at: new Date().toISOString() };
  saveState(slug, state);
  console.log('Approved.');
}

function writeCredits(slug) {
  const p = projectPaths(slug);
  const brief = loadBrief(slug);
  const sound = readJson(p.sound);
  const catalog = fs.existsSync(CATALOG) ? readJson(CATALOG) : { sounds: [] };
  const used = [...new Set((sound.sfx || []).map((c) => c.id))].map((id) => catalog.sounds.find((s) => s.id === id));
  const required = used.filter((s) => s.license !== 'CC0');
  const data = fs.existsSync(p.data) ? readJson(p.data) : { figures: [] };
  const lines = [`# Credits: ${brief.meta.title}`, ''];
  if (required.length) {
    lines.push('## Required attribution (publish these with the video)', '');
    for (const s of required) lines.push(`- "${s.id.split('/')[1]}" by ${s.author}, ${s.origin}, licensed ${s.license} (${s.license_url || ''})`);
    lines.push('');
  }
  const cc0 = used.filter((s) => s.license === 'CC0');
  if (cc0.length) {
    lines.push('## Sound effects (CC0, no attribution required)', '');
    for (const s of cc0) lines.push(`- ${s.id} by ${s.author}`);
    lines.push('');
  }
  if (brief.meta.sound?.music && brief.meta.sound.music !== 'none') lines.push('## Music', '', `- ${brief.meta.sound.music}: ${brief.meta.sound.music_license}`, '');
  if (data.figures.length) {
    lines.push('## Data sources', '');
    for (const f of data.figures) lines.push(`- ${f.display} ${f.label}: ${f.source.title}, ${f.source.url || f.source.path} (accessed ${f.source.accessed})`);
    lines.push('');
  }
  fs.writeFileSync(p.credits, lines.join('\n'));
  return required.length;
}

function cmdFinal(slug) {
  const p = projectPaths(slug);
  const b = loadBrief(slug);
  syncScene(slug);
  const state = loadState(slug);
  if (!state.approval) fail('Not approved. final.mp4 is only made after the person says yes in chat.');
  if (state.approval.hash !== filmHash(p)) fail('The film changed after approval. Run stills and ask again.');
  const picture = renderPicture(slug, 'delivery');
  const { file, mastered } = mix(slug);
  mux(picture, file, p.final);

  const info = probe(p.final);
  const timing = loadTiming(p.timing);
  const [w, h] = DIMENSIONS[b.meta.format.aspect];
  const problems = [];
  if (info.width !== w || info.height !== h) problems.push(`Size is ${info.width}x${info.height}, brief asks ${w}x${h}.`);
  if (Math.abs(info.duration - timing.film.duration) > 0.15) problems.push(`Length is ${info.duration.toFixed(2)}s, timing.js says ${timing.film.duration}s.`);
  if (!info.hasAudio) problems.push('The file has no audio stream.');
  const lufs = measureLufs(p.final);
  if (mastered && Math.abs(lufs + 14) > 1.5) problems.push(`Loudness is ${lufs} LUFS, target is -14.`);
  const mustCredit = writeCredits(slug);
  const report = { ...info, lufs, mastered, problems, shipped_at: new Date().toISOString() };
  writeJson(path.join(p.work, 'ship-report.json'), report);
  console.log(JSON.stringify(report, null, 2));
  console.log(`\nfinal.mp4: ${path.relative(ROOT, p.final)}`);
  if (mustCredit) console.log(`${mustCredit} sound(s) require attribution: see CREDITS.md`);
  if (problems.length) fail(`Output checks failed:\n  ${problems.join('\n  ')}`);
}

function cmdDoctor() {
  const line = (ok, name, detail = '') => console.log(`${ok ? 'ok     ' : 'MISSING'} ${name}${detail ? `: ${detail}` : ''}`);
  const version = (cmd, flag = '--version') => {
    try {
      const r = run(cmd, [flag], { capture: true });
      return r.status === 0 ? (r.stdout || r.stderr).split('\n')[0].trim() : null;
    } catch { return null; }
  };
  line(true, 'node', process.version);
  for (const [cmd, flag] of [['ffmpeg', '-version'], ['ffprobe', '-version'], ['yt-dlp', '--version']]) {
    const v = version(cmd, flag);
    line(!!v, cmd, v ? v.slice(0, 50) : 'needed');
  }
  const hfv = fs.existsSync(path.join(ROOT, 'node_modules', 'hyperframes')) ? readJson(path.join(ROOT, 'node_modules', 'hyperframes', 'package.json')).version : null;
  line(!!hfv, 'hyperframes', hfv || 'run npm install');
  const models = hfv ? hf(['models', 'list', '--json'], { capture: true }) : null;
  const parakeet = models?.status === 0 && /parakeet/i.test(models.stdout) && /"installed":\s*true/.test(models.stdout);
  line(parakeet, 'parakeet', parakeet ? 'installed' : 'run: npx hyperframes models install parakeet');
  const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(fs.existsSync);
  line(!!chrome, 'google chrome', chrome ? 'for research' : 'install for browser research');
  const cat = fs.existsSync(CATALOG) ? readJson(CATALOG) : null;
  line(!!cat, 'sound catalogue', cat ? `${cat.total} sounds ${JSON.stringify(cat.by_license)}` : 'run: npm run sfx:build');
  const skills = ['video', 'video-reference', 'video-data', 'video-story', 'video-voice', 'video-motion', 'video-sound', 'video-direct', 'video-ship'];
  const miss = skills.filter((s) => !fs.existsSync(path.join(ROOT, '.claude', 'skills', s, 'SKILL.md')));
  line(!miss.length, 'pipeline skills', miss.length ? `missing ${miss.join(', ')}` : `${skills.length} present`);
  const hasEnv = fs.existsSync(path.join(ROOT, '.env'));
  line(hasEnv, '.env', hasEnv ? 'present' : 'copy .env.example to .env');
  console.log(`\nOptional: ELEVENLABS_API_KEY ${process.env.ELEVENLABS_API_KEY ? 'set' : 'empty (voice.provider elevenlabs will not work)'}`);
  const freeGb = os.freemem() / 1e9;
  console.log(`RAM free now: ${freeGb.toFixed(1)} GB of ${(os.totalmem() / 1e9).toFixed(1)} GB${freeGb < 2 ? '. Low: close other apps before rendering.' : ''}`);
  const st = fs.statfsSync(ROOT);
  console.log(`Disk free here: ${((st.bavail * st.bsize) / 1e9).toFixed(1)} GB`);
}

const [cmd, a, ...rest] = process.argv.slice(2);
const noteAt = process.argv.indexOf('--note');
const note = noteAt > -1 ? process.argv[noteAt + 1] : null;
const needSlug = () => { if (!a) fail(`${cmd} needs a project name.`); return a; };

try {
  switch (cmd) {
    case 'doctor': cmdDoctor(); break;
    case 'check-brief': cmdCheckBrief(a); break;
    case 'new': cmdNew(a, { keep: rest.includes('--keep') }); break;
    case 'status': cmdStatus(a); break;
    case 'sync': syncScene(needSlug()); console.log('data.js updated'); break;
    case 'done': cmdDone(needSlug(), rest[0]); break;
    case 'voice': await cmdVoice(needSlug()); break;
    case 'transcribe': transcribeTo(a, rest[0] || `${a}.transcript.json`, null); break;
    case 'sfx': cmdSfx([a, ...rest].filter(Boolean)); break;
    case 'stills': cmdStills(needSlug()); break;
    case 'draft': cmdDraft(needSlug()); break;
    case 'approve': cmdApprove(needSlug(), note); break;
    case 'final': cmdFinal(needSlug()); break;
    case 'cue-time': console.log(resolveTime(loadTiming(projectPaths(needSlug()).timing), rest[0])); break;
    default:
      console.log('Commands: doctor | check-brief <file> | new <brief> | status [slug] | sync <slug> | done <slug> <job> | voice <slug> | transcribe <audio> [out.json] | sfx <words> [--policy cc0-only] | stills <slug> | draft <slug> | approve <slug> --note "..." | final <slug>');
  }
} catch (e) {
  fail(e.message);
}
