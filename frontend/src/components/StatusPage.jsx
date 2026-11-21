import { useEffect, useState } from 'react';
import { getProject, startTranscription } from '../api.js';

export default function StatusPage({ projectId, onReady, onBack }) {
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stopped = false;

    async function check() {
      try {
        const p = await getProject(projectId);
        if (stopped) return;
        setProject(p);
        if (p.status === 'ready' || p.status === 'done') {
          onReady(p);
          return;
        }
        if (p.status === 'failed') return;
      } catch (err) {
        if (!stopped) setError(err.message);
      }
      if (!stopped) setTimeout(check, 3000);
    }

    check();
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, attempt]);

  async function retry() {
    setError('');
    try {
      await startTranscription(projectId);
      setAttempt((a) => a + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const failed = project && project.status === 'failed';

  return (
    <div className="card">
      <h2>{failed ? 'Something went wrong' : 'Creating your captions...'}</h2>
      {!failed && (
        <p className="muted">
          Transcribing the speech and converting it to Roman Urdu. This usually takes under a minute for a short video.
        </p>
      )}
      {failed && <div className="error">{project.error || 'Unknown error'}</div>}
      {error && <div className="error">{error}</div>}
      <div className="row" style={{ marginTop: 16 }}>
        {failed && <button onClick={retry}>Try again</button>}
        <button className="secondary" onClick={onBack}>Upload a different video</button>
      </div>
    </div>
  );
}