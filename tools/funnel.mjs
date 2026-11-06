// The live checklist behind docs/workflow.html. A read-only server on this PC only:
// it binds to 127.0.0.1, answers GET alone, and never opens .env or any path outside ALLOWED_ROOTS.
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { parseBrief } from './brief.mjs';
import { JOB_ORDER, isApproved, jobStatus, listProjects } from './jobs.mjs';
import { BRAND_DESIGN, REFERENCES, ROOT, projectPaths, readJson, referenceFolder } from './lib.mjs';

export const DEFAULT_PORT = 4179;
const PAGE = path.join(ROOT, 'docs', 'workflow.html');
const ALLOWED_ROOTS = new Set(['briefs', 'brand', 'references', 'projects']);
const SECRET_NAME = /^(env$|env\.)|\.(env|pem|key|pfx)$|credential|secret/i;
const MAX_TEXT = 1024 * 1024;
const TEXT_EXT = new Set(['.txt', '.json', '.js', '.html', '.css', '.yml', '.yaml', '.srt', '.vtt', '.csv', '.log', '.svg']);
const MEDIA = {
  '.mp4': ['video', 'video/mp4'], '.m4v': ['video', 'video/mp4'], '.mov': ['video', 'video/mp4'], '.webm': ['video', 'video/webm'],
  '.mp3': ['audio', 'audio/mpeg'], '.wav': ['audio', 'audio/wav'], '.m4a': ['audio', 'audio/mp4'], '.ogg': ['audio', 'audio/ogg'],
  '.png': ['image', 'image/png'], '.jpg': ['image', 'image/jpeg'], '.jpeg': ['image', 'image/jpeg'], '.webp': ['image', 'image/webp'], '.gif': ['image', 'image/gif'],
};

const toRel = (abs) => path.relative(ROOT, abs).replaceAll('\\', '/');
const blockedSegment = (s) => s === '.' || s === '..' || s.startsWith('.') || s.includes(':') || s === 'node_modules' || SECRET_NAME.test(s);
const allowedSegments = (segs) => segs.length > 0 && ALLOWED_ROOTS.has(segs[0]) && !segs.some(blockedSegment);

/** The absolute path for a workspace-relative path, or null when the page may not read it. */
export function resolveAllowed(rel) {
  if (typeof rel !== 'string' || !rel || rel.includes('\0')) return null;
  const segs = rel.replaceAll('\\', '/').split('/').filter(Boolean);
  if (!allowedSegments(segs)) return null;
  const abs = path.join(ROOT, ...segs);
  if (fs.existsSync(abs)) {
    // Checked again on the real path, so a link or a short file name can't lead somewhere else.
    const real = toRel(fs.realpathSync.native(abs));
    if (real.startsWith('..') || path.isAbsolute(real) || !allowedSegments(real.split('/'))) return null;
  }
  return abs;
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function inline(text) {
  return text.split(/(`[^`]+`)/).map((part) => {
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return `<code>${esc(part.slice(1, -1))}</code>`;
    return esc(part)
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  }).join('');
}

const tableCells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const TABLE_RULE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/**
 * Markdown to HTML for the viewer. Briefs and studies are outside material, so everything is escaped
 * first and only tags made here reach the page. Links must be http(s). Images stay as their alt text.
 */
export function renderMarkdown(source) {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const out = [];
  let i = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) {
      out.push(`<pre class="frontmatter">${esc(lines.slice(1, end).join('\n'))}</pre>`);
      i = end + 1;
    }
  }
  const startsBlock = (l, next) => /^(#{1,6}\s|```|>|\s*[-*]\s|\s*\d+\.\s|---+\s*$)/.test(l) || (l.includes('|') && next !== undefined && TABLE_RULE.test(next) && next.includes('-'));
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (line.startsWith('```')) {
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i++;
      out.push(`<pre>${esc(code.join('\n'))}</pre>`);
    } else if (heading) {
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      i++;
    } else if (/^---+\s*$/.test(line)) {
      out.push('<hr>');
      i++;
    } else if (line.includes('|') && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const head = tableCells(line).map((c) => `<th>${inline(c)}</th>`).join('');
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].includes('|')) body.push(`<tr>${tableCells(lines[i++]).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`);
      out.push(`<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body.join('')}</tbody></table></div>`);
    } else if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${renderMarkdown(quote.join('\n'))}</blockquote>`);
    } else if (/^\s*[-*]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
      const ordered = /^\s*\d+\.\s/.test(line);
      const marker = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      const items = [];
      while (i < lines.length && marker.test(lines[i])) items.push(`<li>${inline(lines[i++].replace(marker, ''))}</li>`);
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.join('')}</${ordered ? 'ol' : 'ul'}>`);
    } else {
      const para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i], lines[i + 1])) para.push(lines[i++]);
      out.push(`<p>${inline(para.join(' '))}</p>`);
    }
  }
  return out.join('\n');
}

/** What the viewer shows for one path. Returns null when the path may not be read. */
export function readEntry(rel) {
  const abs = resolveAllowed(rel);
  if (!abs) return null;
  const clean = toRel(abs);
  if (!fs.existsSync(abs)) return { kind: 'missing', path: clean };
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(abs, { withFileTypes: true })
      .filter((e) => !blockedSegment(e.name) && (e.isFile() || e.isDirectory()))
      .map((e) => {
        const childRel = `${clean}/${e.name}`;
        const media = MEDIA[path.extname(e.name).toLowerCase()];
        return {
          name: e.name,
          path: childRel,
          kind: e.isDirectory() ? 'dir' : (media?.[0] ?? 'file'),
          size: e.isFile() ? fs.statSync(path.join(abs, e.name)).size : null,
        };
      })
      .sort((a, b) => (b.kind === 'dir') - (a.kind === 'dir') || a.name.localeCompare(b.name));
    return { kind: 'dir', path: clean, entries };
  }
  const ext = path.extname(abs).toLowerCase();
  const base = { path: clean, size: stat.size };
  if (MEDIA[ext]) return { ...base, kind: MEDIA[ext][0], url: `/raw?path=${encodeURIComponent(clean)}` };
  if (ext !== '.md' && !TEXT_EXT.has(ext)) return { ...base, kind: 'binary' };
  const length = Math.min(stat.size, MAX_TEXT);
  const buf = Buffer.alloc(length);
  const fd = fs.openSync(abs, 'r');
  try { fs.readSync(fd, buf, 0, length, 0); } finally { fs.closeSync(fd); }
  const text = buf.toString('utf8');
  const truncated = stat.size > MAX_TEXT;
  return ext === '.md'
    ? { ...base, kind: 'markdown', text, html: renderMarkdown(text), truncated }
    : { ...base, kind: 'text', text, truncated };
}

const hasContent = (f) => fs.existsSync(f) && (fs.statSync(f).isFile() || fs.readdirSync(f).some((n) => !n.startsWith('.')));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function briefProblems(file) {
  try {
    const b = parseBrief(fs.readFileSync(file, 'utf8'));
    return b.errors;
  } catch (e) {
    return [e.message];
  }
}

function briefCheck(project) {
  if (project) {
    const file = projectPaths(project).brief;
    const notes = briefProblems(file);
    return notes.length
      ? { state: 'warn', label: 'Has problems', detail: `${plural(notes.length, 'problem')} in this film's brief`, path: toRel(file), notes }
      : { state: 'ok', label: 'Found', detail: "This film's frozen copy", path: toRel(file) };
  }
  const dir = path.join(ROOT, 'briefs', 'inbox');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort() : [];
  if (!files.length) return { state: 'missing', label: 'Missing', detail: 'The inbox is empty', path: toRel(dir) };
  const notes = files.flatMap((f) => briefProblems(path.join(dir, f)).map((e) => `${f}: ${e}`));
  return {
    state: notes.length ? 'warn' : 'ok',
    label: notes.length ? 'Has problems' : 'Found',
    detail: `${files.length} waiting${notes.length ? `, ${plural(notes.length, 'problem')}` : ', valid'}`,
    path: toRel(files.length === 1 ? path.join(dir, files[0]) : dir),
    notes,
  };
}

function brandCheck(project) {
  if (project) {
    const file = projectPaths(project).design;
    return fs.existsSync(file)
      ? { state: 'ok', label: 'Found', detail: "This film's copy", path: toRel(file) }
      : { state: 'off', label: 'House look', detail: 'This film has no design file', path: toRel(file) };
  }
  return fs.existsSync(BRAND_DESIGN)
    ? { state: 'ok', label: 'Found', detail: 'Copied into every new film', path: toRel(BRAND_DESIGN) }
    : { state: 'missing', label: 'Missing', detail: 'New films will use the house look', path: toRel(BRAND_DESIGN) };
}

function referenceChecks() {
  let clips;
  try {
    clips = referenceFolder();
  } catch (e) {
    const bad = { state: 'warn', label: 'Has problems', detail: 'A line in urls.txt is not a link', path: 'references/urls.txt', notes: [e.message] };
    return { references: bad, 'ref-files': { ...bad, detail: 'See the links list' }, 'ref-links': bad, 'ref-studies': { ...bad, detail: 'See the links list' } };
  }
  const rows = clips.map((c) => {
    const study = `${c.study}/study.md`;
    return { name: c.name, file: c.file ?? null, url: c.url ?? null, study, studied: fs.existsSync(path.join(ROOT, study)) };
  });
  const videos = rows.filter((c) => c.file).length;
  const links = rows.length - videos;
  const studied = rows.filter((c) => c.studied).length;
  const urls = path.join(REFERENCES, 'urls.txt');
  return {
    references: rows.length
      ? { state: 'ok', label: 'Found', detail: `${plural(videos, 'video')}, ${plural(links, 'link')}, ${studied} studied`, clips: rows, path: 'references' }
      : { state: 'off', label: 'Empty', detail: 'Films will use the house style', path: 'references' },
    'ref-files': videos
      ? { state: 'ok', label: 'Found', detail: plural(videos, 'video'), clips: rows.filter((c) => c.file), path: 'references' }
      : { state: 'off', label: 'Empty', detail: 'No videos yet', path: 'references' },
    'ref-links': links
      ? { state: 'ok', label: 'Found', detail: plural(links, 'link'), clips: rows.filter((c) => c.url), path: toRel(urls) }
      : { state: 'off', label: 'Empty', detail: 'No links yet', path: toRel(urls) },
    'ref-studies': rows.length
      ? { state: studied === rows.length ? 'ok' : 'todo', label: studied === rows.length ? 'All studied' : 'To study', detail: `${studied} of ${plural(rows.length, 'reference')} studied`, clips: rows, path: 'references/studies' }
      : { state: 'off', label: 'Empty', detail: 'Nothing to study yet', path: 'references/studies' },
  };
}

/** Reports only whether the file and the key exist. The value never leaves process.env. */
function envCheck() {
  const notice = 'This page never opens .env, because it holds your keys. It only says whether the file and the ElevenLabs key are there. Edit .env yourself in a text editor.';
  if (process.env.ELEVENLABS_API_KEY) return { state: 'ok', label: 'Key set', detail: 'ElevenLabs is ready', notice };
  return fs.existsSync(path.join(ROOT, '.env'))
    ? { state: 'off', label: 'No key', detail: 'The file is there, without a key', notice }
    : { state: 'off', label: 'Not set', detail: 'Only ElevenLabs needs it', notice };
}

const JOB_OUTPUT = { reference: 'spec', data: 'data', story: 'story', voice: 'voiceDir', motion: 'index', sound: 'sound' };

function projectChecks(project) {
  const none = { state: 'off', label: 'No film yet', detail: '' };
  const ids = [...JOB_ORDER.map((j) => `job-${j}`), 'job-direct', 'job-ship', 'out-stills', 'out-draft', 'out-final', 'out-credits'];
  if (!project) return { studio: { state: 'off', label: 'Not started', detail: 'Type /video to open a project' }, ...Object.fromEntries(ids.map((id) => [id, none])) };

  const p = projectPaths(project);
  const fileCheck = (file, whenThere = 'Found') => (hasContent(file)
    ? { state: 'ok', label: whenThere, detail: '', path: toRel(file) }
    : { state: 'todo', label: 'Not yet', detail: '', path: toRel(file) });
  const checks = {};
  let state;
  let status;
  try {
    state = readJson(p.state);
    status = jobStatus(project, parseBrief(fs.readFileSync(p.brief, 'utf8')));
  } catch (e) {
    return { studio: { state: 'warn', label: 'Has problems', detail: 'The project files could not be read', path: toRel(p.dir), notes: [e.message] }, ...Object.fromEntries(ids.map((id) => [id, none])) };
  }
  for (const job of JOB_ORDER) {
    const file = p[JOB_OUTPUT[job]];
    const there = hasContent(file);
    const s = status[job];
    let c;
    if (s === 'done') c = { state: 'ok', label: 'Gate passed' };
    else if (s === 'skipped') c = { state: 'off', label: 'Skipped', detail: 'A silent film' };
    else if (s === 'changed since done') c = { state: 'warn', label: 'Changed', detail: 'Edited after its gate passed' };
    else if (s === 'review: upstream changed') c = { state: 'warn', label: 'Review', detail: 'An earlier file changed' };
    else if (there) c = { state: 'todo', label: 'Gate not run', detail: 'The file is there' };
    else c = { state: 'todo', label: 'Not yet' };
    checks[`job-${job}`] = { detail: '', ...c, path: toRel(file) };
  }
  checks['job-direct'] = fileCheck(p.timing);
  const approved = isApproved(p, state);
  const final = fs.existsSync(p.final);
  let ship;
  if (final && approved) ship = { state: 'ok', label: 'Shipped', detail: '' };
  else if (approved) ship = { state: 'todo', label: 'Approved', detail: 'The final render is next' };
  else if (state.approval) ship = { state: 'warn', label: 'Expired', detail: 'The film changed after your yes' };
  else ship = { state: 'todo', label: 'Not approved', detail: '' };
  checks['job-ship'] = { ...ship, path: toRel(p.final) };
  checks['out-stills'] = fileCheck(p.stills);
  checks['out-draft'] = fileCheck(p.draft);
  checks['out-final'] = fileCheck(p.final);
  checks['out-credits'] = fileCheck(p.credits);
  const counted = JOB_ORDER.filter((j) => status[j] !== 'skipped');
  const passed = counted.filter((j) => status[j] === 'done').length;
  checks.studio = { state: passed === counted.length ? 'ok' : 'todo', label: passed === counted.length ? 'Gates passed' : 'In progress', detail: `${passed} of ${plural(counted.length, 'gate')} passed`, path: toRel(p.dir) };
  return checks;
}

/** The whole funnel, for one project or for the next film waiting in the inbox. */
export function funnelStatus(slug) {
  const created = (id) => { try { return readJson(projectPaths(id).state).created ?? ''; } catch { return ''; } };
  const projects = listProjects().map((id) => ({ id, created: created(id) })).sort((a, b) => b.created.localeCompare(a.created));
  const project = projects.some((x) => x.id === slug) ? slug : null;
  const inbox = path.join(ROOT, 'briefs', 'inbox');
  const refs = referenceChecks();
  const checks = { brief: briefCheck(project), brand: brandCheck(project), ...refs, env: envCheck(), ...projectChecks(project) };
  const inputs = ['brief', 'brand', 'references', 'env'];
  return {
    project,
    projects,
    inbox: fs.existsSync(inbox) ? fs.readdirSync(inbox).filter((f) => f.endsWith('.md')).length : 0,
    inputs: { found: inputs.filter((k) => checks[k].state === 'ok').length, total: inputs.length },
    checks,
  };
}

const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

function sendJson(res, status, value) {
  res.writeHead(status, { ...HEADERS, 'Content-Type': 'application/json; charset=utf-8', 'Content-Security-Policy': "default-src 'none'" });
  res.end(JSON.stringify(value));
}

function sendPage(res) {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.writeHead(200, {
    ...HEADERS,
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self'; media-src 'self'; img-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`,
  });
  res.end(fs.readFileSync(PAGE, 'utf8').replaceAll('__CSP_NONCE__', nonce));
}

function sendMedia(req, res, rel) {
  const abs = resolveAllowed(rel);
  const media = abs && MEDIA[path.extname(abs).toLowerCase()];
  if (!media) return sendJson(res, 403, { error: 'This page does not open that file.' });
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return sendJson(res, 404, { error: 'Not found.' });
  const size = fs.statSync(abs).size;
  const headers = { ...HEADERS, 'Content-Type': media[1], 'Accept-Ranges': 'bytes', 'Content-Security-Policy': "default-src 'none'" };
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0;
  let end = size - 1;
  if (req.headers.range) {
    if (range && range[1]) {
      start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), end);
    } else if (range && range[2]) {
      start = Math.max(size - Number(range[2]), 0);
    }
    if (!range || (!range[1] && !range[2]) || start > end) {
      res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
      return res.end();
    }
    res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
  } else {
    res.writeHead(200, { ...headers, 'Content-Length': size });
  }
  if (size === 0) return res.end();
  fs.createReadStream(abs, { start, end }).on('error', () => res.destroy()).pipe(res);
}

export function createChecklistServer() {
  return http.createServer((req, res) => {
    try {
      // Another site can't reach this by pointing its own domain at 127.0.0.1, because the host must match.
      const { port } = req.socket.address();
      if (req.headers.host !== `127.0.0.1:${port}` && req.headers.host !== `localhost:${port}`) return sendJson(res, 403, { error: 'Wrong host.' });
      if (req.method !== 'GET') return sendJson(res, 405, { error: 'This page only reads.' });
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (url.pathname === '/' || url.pathname === '/workflow.html') return sendPage(res);
      if (url.pathname === '/api/status') {
        const slug = url.searchParams.get('project');
        const status = funnelStatus(slug);
        if (slug && status.project !== slug) return sendJson(res, 404, { error: `No project "${slug}".`, ...status });
        return sendJson(res, 200, status);
      }
      if (url.pathname === '/api/entry') {
        const entry = readEntry(url.searchParams.get('path'));
        if (!entry) return sendJson(res, 403, { error: 'This page does not open that file.' });
        return sendJson(res, entry.kind === 'missing' ? 404 : 200, entry);
      }
      if (url.pathname === '/raw') return sendMedia(req, res, url.searchParams.get('path'));
      return sendJson(res, 404, { error: 'Not found.' });
    } catch (e) {
      console.error(`Checklist error on ${req.url}: ${e.message}`);
      if (res.headersSent) return res.destroy();
      return sendJson(res, 500, { error: 'The check failed. See the terminal.' });
    }
  });
}

export function startChecklist(port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    const server = createChecklistServer();
    server.on('error', (e) => reject(e.code === 'EADDRINUSE'
      ? new Error(`Port ${port} is in use, so the checklist may already be running at http://127.0.0.1:${port}. To use another port, set CHECKLIST_PORT.`)
      : e));
    server.listen(port, '127.0.0.1', () => {
      console.log(`Checklist: http://127.0.0.1:${port}\nOnly this PC can open it. It only reads files. Press Ctrl+C to stop it.`);
      resolve(server);
    });
  });
}
