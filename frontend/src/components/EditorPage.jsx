import { useEffect, useRef, useState } from 'react';
import { saveCaptions, startExport, getProject, getFonts, fontFileUrl, downloadUrl, videoUrl } from '../api.js';
import { STYLES, DEFAULT_SETTINGS, previewFor, captionBoxStyle } from '../captionLogic.js';
import FontSelect from './FontSelect.jsx';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export default function EditorPage({ project, onBack }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const dragging = useRef(false);

  const [lines, setLines] = useState(project.lines);
  const [settings, setSettings] = useState({
    styleName: project.styleName || DEFAULT_SETTINGS.styleName,
    font: project.font || DEFAULT_SETTINGS.font,
    sizeScale: project.sizeScale ?? DEFAULT_SETTINGS.sizeScale,
    posX: project.posX ?? DEFAULT_SETTINGS.posX,
    posY: project.posY ?? DEFAULT_SETTINGS.posY
  });
  const [fonts, setFonts] = useState([]);
  const [time, setTime] = useState(0);
  const [paused, setPaused] = useState(true);
  const [dims, setDims] = useState({ w: 1080, h: 1920 });
  const [busy, setBusy] = useState('');
  const [done, setDone] = useState(project.status === 'done');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getFonts()
      .then((list) => {
        if (cancelled) return;
        setFonts(list);
        list
          .filter((f) => f.file)
          .forEach((f) => {
            const face = new FontFace(f.name, `url(${fontFileUrl(f.file)})`);
            face
              .load()
              .then((loaded) => document.fonts.add(loaded))
              .catch(() => {});
          });
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const style = STYLES[settings.styleName] || STYLES.classic;
  const fontObj = fonts.find((f) => f.name === settings.font) || { name: settings.font, file: null };
  const active = lines.findIndex((l) => time >= l.start && time < l.end);
  const preview = previewFor(lines, time, settings.styleName);
  const shown = preview || (paused ? { words: ['Drag me anywhere'], active: -1, sample: true } : null);

  function change(patch) {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDone(false);
    setMessage('');
  }

  function updateLine(i, field, value) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
    setDone(false);
    setMessage('');
  }

  function commitTime(i, field, raw) {
    const v = parseFloat(raw);
    if (Number.isNaN(v) || v < 0) return;
    updateLine(i, field, v);
  }

  function seek(seconds) {
    if (videoRef.current) videoRef.current.currentTime = seconds;
  }

  function moveCaption(e) {
    if (!dragging.current || !playerRef.current) return;
    const rect = playerRef.current.getBoundingClientRect();
    change({
      posX: clamp((e.clientX - rect.left) / rect.width, 0.15, 0.85),
      posY: clamp((e.clientY - rect.top) / rect.height, 0.05, 0.95)
    });
  }

  async function handleSave() {
    setBusy('saving');
    setError('');
    try {
      await saveCaptions(project.id, lines, settings);
      setMessage('Captions saved.');
    } catch (err) {
      setError(err.message);
    }
    setBusy('');
  }

  async function handleExport() {
    setBusy('exporting');
    setError('');
    setMessage('');
    setDone(false);
    try {
      await saveCaptions(project.id, lines, settings);
      await startExport(project.id, settings);
      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const p = await getProject(project.id);
        if (p.status === 'done') {
          setDone(true);
          setMessage('Your video is ready. Click Download video.');
          break;
        }
        if (p.status === 'failed') throw new Error(p.error || 'Export failed');
      }
    } catch (err) {
      setError(err.message);
    }
    setBusy('');
  }

  return (
    <div>
      <div className="card">
        <div className="row">
          <label>
            Style:{' '}
            <select value={settings.styleName} onChange={(e) => change({ styleName: e.target.value })}>
              {Object.entries(STYLES).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="inline">
            Font:{' '}
            <FontSelect fonts={fonts} value={settings.font} onChange={(name) => change({ font: name })} />
          </label>
          <label>
            Size: {Math.round(settings.sizeScale * 100)}%{' '}
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              value={settings.sizeScale}
              onChange={(e) => change({ sizeScale: parseFloat(e.target.value) })}
            />
          </label>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <span className="muted">Position:</span>
          <button className="secondary" onClick={() => change({ posX: 0.5, posY: 0.15 })}>Top</button>
          <button className="secondary" onClick={() => change({ posX: 0.5, posY: 0.5 })}>Middle</button>
          <button className="secondary" onClick={() => change({ posX: 0.5, posY: 0.8 })}>Bottom</button>
          <span className="muted">or drag the caption on the video</span>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="secondary" onClick={handleSave} disabled={!!busy}>
            {busy === 'saving' ? 'Saving...' : 'Save captions'}
          </button>
          <button onClick={handleExport} disabled={!!busy}>
            {busy === 'exporting' ? 'Rendering video...' : 'Export video'}
          </button>
          {done && (
            <button onClick={() => { window.location.href = downloadUrl(project.id); }}>
              Download video
            </button>
          )}
          <button className="secondary" onClick={onBack}>New video</button>
        </div>
        {message && <p className="muted">{message}</p>}
        {error && <div className="error">{error}</div>}
      </div>

      <div className="editor" style={{ marginTop: 16 }}>
        <div className="player" ref={playerRef} style={{ containerType: 'inline-size' }}>
          <video
            ref={videoRef}
            src={videoUrl(project.id)}
            controls
            style={{ maxHeight: 'none' }}
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
            onLoadedMetadata={(e) =>
              setDims({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })
            }
          />
          {shown && (
            <div
              style={{
                ...captionBoxStyle(settings.styleName, fontObj, settings.sizeScale, settings.posX, settings.posY, dims),
                cursor: 'grab',
                touchAction: 'none',
                userSelect: 'none',
                pointerEvents: 'auto',
                opacity: shown.sample ? 0.6 : 1
              }}
              onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); }}
              onPointerMove={moveCaption}
              onPointerUp={() => { dragging.current = false; }}
              onPointerCancel={() => { dragging.current = false; }}
            >
              {shown.words.map((w, i) => (
                <span key={i} style={i === shown.active && style.highlight ? { color: style.highlight } : undefined}>
                  {i > 0 ? ' ' : ''}{w}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="card lines" style={{ marginTop: 0 }}>
          <div className="line muted">
            <span>Start</span>
            <span>End</span>
            <span>Caption (Roman)</span>
          </div>
          {lines.map((l, i) => (
            <div key={i} className={'line' + (i === active ? ' active' : '')}>
              <input type="number" step="0.1" min="0" defaultValue={Number(l.start).toFixed(2)}
                onBlur={(e) => commitTime(i, 'start', e.target.value)} />
              <input type="number" step="0.1" min="0" defaultValue={Number(l.end).toFixed(2)}
                onBlur={(e) => commitTime(i, 'end', e.target.value)} />
              <input type="text" value={l.text} title={l.original}
                onChange={(e) => updateLine(i, 'text', e.target.value)}
                onFocus={() => seek(l.start)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}