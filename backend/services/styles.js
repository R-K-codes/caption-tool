import fs from 'node:fs';
import path from 'node:path';

export const fontsDir = path.join(import.meta.dirname, '..', 'fonts');

function loadFontPack() {
  try {
    return JSON.parse(fs.readFileSync(path.join(fontsDir, 'fonts.json'), 'utf8'));
  } catch {
    return [];
  }
}

export const FONTS = [
  { name: 'Arial', file: null, family: 'Arial', group: 'System' },
  ...loadFontPack()
];

export const DEFAULTS = { font: 'Arial', sizeScale: 1, posX: 0.5, posY: 0.8 };

export const styles = {
  classic: { mode: 'line', size: 64, bold: true, primary: '&H00FFFFFF', outline: '&H00000000', outlineWidth: 4, shadow: 0, borderStyle: 1 },
  yellow: { mode: 'line', size: 70, bold: true, primary: '&H0000FFFF', outline: '&H00000000', outlineWidth: 5, shadow: 0, borderStyle: 1 },
  boxed: { mode: 'line', size: 60, bold: true, primary: '&H00FFFFFF', outline: '&H66000000', outlineWidth: 12, shadow: 0, borderStyle: 3 },
  minimal: { mode: 'line', size: 54, bold: false, primary: '&H00FFFFFF', outline: '&H00000000', outlineWidth: 2, shadow: 1, borderStyle: 1 },
  highlight: { mode: 'line', size: 68, bold: true, primary: '&H00FFFFFF', outline: '&H00000000', outlineWidth: 5, shadow: 0, borderStyle: 1, highlight: '00FFFF' },
  pop: { mode: 'chunk', chunk: 3, upper: true, size: 84, bold: true, primary: '&H00FFFFFF', outline: '&H00000000', outlineWidth: 7, shadow: 0, borderStyle: 1, highlight: '00FF00' }
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function num(v, d) {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

const pad = (n) => String(n).padStart(2, '0');

export function assTime(sec) {
  const cs = Math.round(sec * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs % 100)}`;
}

export function splitWords(text) {
  return String(text).replace(/[{}\\]/g, '').trim().split(/\s+/).filter(Boolean);
}

export function wordTimings(line) {
  const words = splitWords(line.text);
  if (!words.length) return [];
  const total = words.reduce((sum, w) => sum + w.length + 1, 0);
  const dur = line.end - line.start;
  let t = line.start;
  return words.map((w, i) => {
    const start = t;
    t += (dur * (w.length + 1)) / total;
    return { word: w, start, end: i === words.length - 1 ? line.end : t };
  });
}

const capitalizeWord = (w) => w.charAt(0).toUpperCase() + w.slice(1);

export function buildAss(lines, opts, width, height) {
  const s = styles[opts.styleName] || styles.classic;
  const fontEntry = FONTS.find((f) => f.name === opts.font) || FONTS[0];
  const sizeScale = clamp(num(opts.sizeScale, DEFAULTS.sizeScale), 0.5, 2);
  const posX = clamp(num(opts.posX, DEFAULTS.posX), 0.15, 0.85);
  const posY = clamp(num(opts.posY, DEFAULTS.posY), 0.05, 0.95);

  const k = Math.min(width, height) / 1080;
  const size = Math.round(s.size * k * sizeScale);
  const outlineWidth = Math.round(s.outlineWidth * k);
  const px = Math.round(posX * width);
  const py = Math.round(posY * height);
  const maxWidth = Math.min(width * 0.9, 2 * Math.min(px, width - px) - 20 * k);
  const margin = Math.max(0, Math.round((width - maxWidth) / 2));
  const place = `{\\an5\\pos(${px},${py})}`;
  const bold = fontEntry.file ? 0 : s.bold ? -1 : 0;

  const events = [];
  const add = (start, end, text) => {
    if (end - start < 0.02) return;
    events.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Main,,${margin},${margin},0,,${place}${text}`);
  };
  const render = (words, active) =>
    words
      .map((w, i) => (i === active && s.highlight ? `{\\c&H${s.highlight}&}${w}{\\c}` : w))
      .join(' ');

  for (const line of lines) {
    let timings = wordTimings(line);
    if (!timings.length) continue;
    if (s.upper) {
      timings = timings.map((t) => ({ ...t, word: t.word.toUpperCase() }));
    } else {
      timings[0] = { ...timings[0], word: capitalizeWord(timings[0].word) };
    }

    if (s.mode === 'chunk') {
      for (let i = 0; i < timings.length; i += s.chunk) {
        const chunk = timings.slice(i, i + s.chunk);
        const words = chunk.map((t) => t.word);
        chunk.forEach((t, j) => add(t.start, t.end, render(words, j)));
      }
    } else if (s.highlight) {
      const words = timings.map((t) => t.word);
      timings.forEach((t, i) => add(t.start, t.end, render(words, i)));
    } else {
      add(line.start, line.end, timings.map((t) => t.word).join(' '));
    }
  }

  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    'WrapStyle: 0',
    'PlayResX: ' + width,
    'PlayResY: ' + height,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Main,${fontEntry.family},${size},${s.primary},&H000000FF,${s.outline},&H00000000,${bold},0,0,0,100,100,0,0,${s.borderStyle},${outlineWidth},${s.shadow},5,0,0,0,1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ...events
  ].join('\n') + '\n';
}