// Where each job stands. The CLI and the checklist page both read this, so they can't disagree.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, hashPaths, projectPaths, readJson } from './lib.mjs';

export const JOB_ORDER = ['reference', 'data', 'story', 'voice', 'motion', 'sound'];
export const OUTPUTS = {
  reference: (p) => [p.spec],
  data: (p) => [p.data],
  story: (p) => [p.story],
  voice: (p) => [p.voiceDir],
  motion: (p) => [p.index],
  sound: (p) => [p.sound],
};

export function listProjects() {
  const d = path.join(ROOT, 'projects');
  return fs.existsSync(d) ? fs.readdirSync(d).filter((n) => fs.existsSync(path.join(d, n, 'brief.md'))) : [];
}

/** Everything that changes what the viewer hears or sees. Approval is tied to this hash. */
export const filmHash = (p) => hashPaths([p.scene, p.sound, p.data, p.voiceDir, p.inputs]);

export const isApproved = (p, state) => !!state.approval && fs.existsSync(p.sound) && state.approval.hash === filmHash(p);

export function jobStatus(slug, brief) {
  const p = projectPaths(slug);
  const state = readJson(p.state);
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
