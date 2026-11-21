import { useState } from 'react';
import { uploadVideo, startTranscription } from '../api.js';

export default function UploadPage({ onCreated }) {
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('ur');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
    <div className="card">
      <h2>Upload a video</h2>
      <p className="muted">Choose an .mp4 video. The app transcribes it and writes Roman Urdu captions.</p>
      <div className="row">
        <input type="file" accept="video/mp4" onChange={(e) => setFile(e.target.files[0] || null)} />
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="ur">Urdu</option>
          <option value="hi">Hindi</option>
        </select>
        <button onClick={handleUpload} disabled={!file || busy}>
          {busy ? 'Uploading...' : 'Upload and transcribe'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </div>
  );
}