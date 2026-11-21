export const STYLES = {
  classic: { label: 'Classic white', mode: 'line', size: 64, bold: true, color: '#ffffff', outline: 4, outlineColor: '#000000' },
  yellow: { label: 'Bold yellow', mode: 'line', size: 70, bold: true, color: '#ffff00', outline: 5, outlineColor: '#000000' },
  boxed: { label: 'Boxed', mode: 'line', size: 60, bold: true, color: '#ffffff', box: 12 },
  minimal: { label: 'Minimal', mode: 'line', size: 54, bold: false, color: '#ffffff', outline: 2, outlineColor: '#000000', shadow: 1 },
  highlight: { label: 'Word highlight', mode: 'line', size: 68, bold: true, color: '#ffffff', outline: 5, outlineColor: '#000000', highlight: '#ffff00' },
  pop: { label: 'Viral pop', mode: 'chunk', chunk: 3, upper: true, size: 84, bold: true, color: '#ffffff', outline: 7, outlineColor: '#000000', highlight: '#00ff00' }
};

export const DEFAULT_SETTINGS = { styleName: 'classic', font: 'Arial', sizeScale: 1, posX: 0.5, posY: 0.8 };

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

export function previewFor(lines, time, styleName) {
  const s = STYLES[styleName] || STYLES.classic;
  const line = lines.find((l) => time >= l.start && time < l.end);
  if (!line) return null;
  let timings = wordTimings(line);
  if (!timings.length) return null;
  if (s.upper) {
    timings = timings.map((t) => ({ ...t, word: t.word.toUpperCase() }));
  } else {
    timings[0] = { ...timings[0], word: capitalizeWord(timings[0].word) };
  }

  if (s.mode === 'chunk') {
    for (let i = 0; i < timings.length; i += s.chunk) {
      const chunk = timings.slice(i, i + s.chunk);
      const idx = chunk.findIndex((t) => time >= t.start && time < t.end);
      if (idx >= 0) return { words: chunk.map((t) => t.word), active: idx };
    }
    return null;
  }

  const active = timings.findIndex((t) => time >= t.start && time < t.end);
  return { words: timings.map((t) => t.word), active: s.highlight ? active : -1 };
}

export function captionBoxStyle(styleName, font, sizeScale, posX, posY, dims) {
  const s = STYLES[styleName] || STYLES.classic;
  const short = Math.min(dims.w, dims.h);
  const unit = (short / (1080 * dims.w)) * 100;
  const maxFrac = Math.max(0.2, Math.min(0.9, 2 * Math.min(posX, 1 - posX) - (20 * short) / (1080 * dims.w)));
  const isPack = !!(font && font.file);

  const css = {
    position: 'absolute',
    left: posX * 100 + '%',
    top: posY * 100 + '%',
    transform: 'translate(-50%, -50%)',
    width: 'max-content',
    maxWidth: maxFrac * 100 + '%',
    textAlign: 'center',
    lineHeight: 1.2,
    fontFamily: "'" + (font ? font.name : 'Arial') + "', Arial, sans-serif",
    fontSize: s.size * sizeScale * unit + 'cqw',
    fontWeight: !isPack && s.bold ? 700 : 400,
    color: s.color
  };
  if (s.outline) {
    css.WebkitTextStroke = 2 * s.outline * unit + 'cqw ' + s.outlineColor;
    css.paintOrder = 'stroke fill';
  }
  if (s.shadow) css.textShadow = `${unit}cqw ${unit}cqw ${unit * 2}cqw rgba(0,0,0,0.8)`;
  if (s.box) {
    css.background = 'rgba(0,0,0,0.6)';
    css.padding = s.box * unit + 'cqw';
    css.borderRadius = '0.2em';
  }
  return css;
}