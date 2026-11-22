import { useRef, useState } from 'react';
import { uploadVideo, startTranscription } from '../api.js';

export default function UploadPage({ onCreated }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('ur');
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');

  function pick(f) {
    if (!f) return;
    if (f.type !== 'video/mp4') {
      setError('Sirf .mp4 video chalegi.');
      return;
    }
    setError('');
    setFile(f);
  }

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const project = await uploadVideo(file, language);
      await startTranscription(project.id);
      onCreated(project.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="card upload">
      <div
        className={'dropzone' + (drag ? ' drag' : '') + (file ? ' has' : '')}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
      >
        <div className="drop-icon">{file ? '✅' : '⬆️'}</div>
        {file ? (
          <>
            <strong>{file.name}</strong>
            <span className="muted">{(file.size / 1024 / 1024).toFixed(1)} MB · click to change</span>
          </>
        ) : (
          <>
            <strong>Drag and drop your video here</strong>
            <span className="muted">or click to browse (.mp4)</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4"
          hidden
          onChange={(e) => pick(e.target.files[0])}
        />
      </div>

      <div className="row upload-actions">
        <label>
          Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="ur">Urdu</option>
            <option value="hi">Hindi</option>
          </select>
        </label>
        <button onClick={handleUpload} disabled={!file || busy}>
          {busy ? 'Uploading...' : 'Upload and transcribe'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}