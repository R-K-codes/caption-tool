export const styles = {
  classic: { font: 'Arial', size: 64, bold: true, primary: '&H00FFFFFF', outline: '&H00000000', outlineWidth: 4, shadow: 0, borderStyle: 1, marginV: 220 },
  yellow: { font: 'Arial', size: 70, bold: true, primary: '&H0000FFFF', outline: '&H00000000', outlineWidth: 5, shadow: 0, borderStyle: 1, marginV: 220 },
  boxed: { font: 'Arial', size: 60, bold: true, primary: '&H00FFFFFF', outline: '&H66000000', outlineWidth: 12, shadow: 0, borderStyle: 3, marginV: 220 },
  minimal: { font: 'Arial', size: 54, bold: false, primary: '&H00FFFFFF', outline: '&H00000000', outlineWidth: 2, shadow: 1, borderStyle: 1, marginV: 160 }
};

const pad = (n) => String(n).padStart(2, '0');

export function assTime(sec) {
  const cs = Math.round(sec * 100);
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${pad(m)}:${pad(s)}.${pad(cs % 100)}`;
}

function cleanText(text) {
  const t = text.replace(/[{}]/g, '').replace(/\r?\n/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function buildAss(lines, styleName, width, height) {
  const s = styles[styleName] || styles.classic;
  const k = Math.min(width, height) / 1080;
  const size = Math.round(s.size * k);
  const outlineWidth = Math.round(s.outlineWidth * k);
  const marginV = Math.round(s.marginV * k);
  const marginH = Math.round(60 * k);

  const out = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'PlayResX: ' + width,
    'PlayResY: ' + height,
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Main,${s.font},${size},${s.primary},&H000000FF,${s.outline},&H00000000,${s.bold ? -1 : 0},0,0,0,100,100,0,0,${s.borderStyle},${outlineWidth},${s.shadow},2,${marginH},${marginH},${marginV},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'
  ];

  for (const line of lines) {
    out.push(`Dialogue: 0,${assTime(line.start)},${assTime(line.end)},Main,,0,0,0,,${cleanText(line.text)}`);
  }

  return out.join('\n') + '\n';
}