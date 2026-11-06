// Reads colours out of a design file and a scene, so the gates can compare them.
import fs from 'node:fs';
import path from 'node:path';

const NAMED = {
  white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff', yellow: '#ffff00',
  orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', gray: '#808080', grey: '#808080', silver: '#c0c0c0',
  gold: '#ffd700', navy: '#000080', teal: '#008080', aqua: '#00ffff', cyan: '#00ffff', magenta: '#ff00ff',
  fuchsia: '#ff00ff', maroon: '#800000', lime: '#00ff00', olive: '#808000', brown: '#a52a2a', beige: '#f5f5dc',
  ivory: '#fffff0', coral: '#ff7f50', crimson: '#dc143c', indigo: '#4b0082', violet: '#ee82ee', tomato: '#ff6347',
  salmon: '#fa8072', tan: '#d2b48c', khaki: '#f0e68c', lavender: '#e6e6fa', turquoise: '#40e0d0',
};
const COLOUR_PROPERTY = /(?:^|[\s;{,"'])(?:color|background|background-?color|backgroundColor|fill|stroke|outline|outline-?color|border(?:-?\w+)?|box-?shadow|boxShadow|text-?shadow|textShadow)["']?\s*[:=]\s*["']?([^;}"'<>]+)/gim;
const SCANNED = /\.(html|css|svg|js)$/i;
const LIBRARIES = new Set(['timing.js', 'data.js', 'runtime.js']);
const SKIPPED_DIRS = new Set(['.hyperframes', 'renders', 'node_modules']);

const toHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`;
const channel = (s) => (s.endsWith('%') ? parseFloat(s) * 2.55 : parseFloat(s));

function hslToHex(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    return (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return toHex(f(0), f(8), f(4));
}

function normaliseHex(raw) {
  const h = raw.toLowerCase();
  const full = h.length <= 4 ? [...h].map((c) => c + c).join('') : h;
  return `#${full.slice(0, 6)}`; // Transparency doesn't change which colour it is.
}

/** Hex, rgb() and hsl() colours in a text, as lowercase #rrggbb. `ignore` holds ids, which look like hex. */
export function colorsIn(text, { named = false, ignore = new Set() } = {}) {
  const found = new Set();
  for (const [, hex] of text.matchAll(/(?<![&\w#-])(?<!href=["'])#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})\b(?!-)/gi)) {
    if (!ignore.has(hex)) found.add(normaliseHex(hex));
  }
  for (const [, r, g, b] of text.matchAll(/\brgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)/gi)) {
    found.add(toHex(channel(r), channel(g), channel(b)));
  }
  for (const [, h, s, l] of text.matchAll(/\bhsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/gi)) {
    found.add(hslToHex(Number(h), Number(s), Number(l)));
  }
  if (named) {
    for (const [, value] of text.matchAll(COLOUR_PROPERTY)) {
      const plain = value.replace(/\b(?:var|url)\([^)]*\)/gi, ' '); // var(--gold) names a variable, not a colour.
      for (const word of plain.toLowerCase().match(/[a-z]+/g) || []) if (NAMED[word]) found.add(NAMED[word]);
    }
  }
  return found;
}

function sceneFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIPPED_DIRS.has(e.name) ? [] : sceneFiles(path.join(dir, e.name));
    if (!SCANNED.test(e.name) || LIBRARIES.has(e.name) || /\.min\.js$/i.test(e.name)) return [];
    return [path.join(dir, e.name)];
  });
}

/** Every colour the scene's own code can put on screen. Colours inside images and videos aren't seen. */
export function sceneColors(dir) {
  const text = sceneFiles(dir)
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[\s;{}>])\/\/.*$/gm, '$1');
  const ignore = new Set([...text.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
  return colorsIn(text, { named: true, ignore });
}

/** What the person should know about a design file before the jobs start. */
export function designWarnings(text, palette = []) {
  const allowed = colorsIn(text);
  if (!allowed.size) return ['The design file has no hex, rgb() or hsl() colours, so the motion gate will refuse the film until it has some.'];
  const stray = [...colorsIn(palette.join(' '))].filter((c) => !allowed.has(c));
  return stray.length ? [`brand.palette has ${stray.join(', ')}, which the design file doesn't. The design file wins, so these won't be used.`] : [];
}
