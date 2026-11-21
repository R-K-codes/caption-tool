import { useState } from 'react';
import UploadPage from './components/UploadPage.jsx';
import StatusPage from './components/StatusPage.jsx';
import EditorPage from './components/EditorPage.jsx';

function idFromHash() {
  const h = window.location.hash.replace('#', '');
  return /^[0-9a-f-]{36}$/.test(h) ? h : null;
}

export default function App() {
  const [projectId, setProjectId] = useState(idFromHash());
  const [project, setProject] = useState(null);

  function openProject(id) {
    window.location.hash = id;
    setProject(null);
    setProjectId(id);
  }

  function reset() {
    history.replaceState(null, '', window.location.pathname);
    setProject(null);
    setProjectId(null);
  }

  return (
    <div className="container">
      <h1>Caption Tool</h1>
      <p className="muted">Roman Urdu and Hinglish captions for your videos</p>

      {!projectId && <UploadPage onCreated={openProject} />}

      {projectId && !project && (
        <StatusPage projectId={projectId} onReady={setProject} onBack={reset} />
      )}

      {projectId && project && (
        <EditorPage key={project.id} project={project} onBack={reset} />
      )}
    </div>
  );
}