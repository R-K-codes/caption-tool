import { useState } from 'react';
import UploadPage from './components/UploadPage.jsx';
import StatusPage from './components/StatusPage.jsx';
import EditorPage from './components/EditorPage.jsx';

function idFromHash() {
  const h = window.location.hash.replace('#', '');
  return /^[0-9a-f-]{36}$/.test(h) ? h : null;
}

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

const FEATURES = [
  { tone: 'green', title: 'Word highlight', text: 'Bolte hue har word alag colour mein chamakta hai.' },
  { tone: 'amber', title: 'Font library', text: 'Bold, impact aur Urdu-friendly fonts ek dropdown mein.' },
  { tone: 'peach', title: 'Drag to place', text: 'Caption ko video par kahin bhi khench kar rakho.' },
  { tone: 'cream', title: 'Timing editor', text: 'Har line ka start aur end second tak theek karo.' }
];

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

  const home = !projectId;

  return (
    <div className="page">
      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="/" onClick={(e) => { e.preventDefault(); reset(); }}>
            <span className="logo">Aa</span>
            <span>Caption Tool</span>
          </a>
          {home && (
            <button className="link" onClick={() => scrollTo('features')}>Features</button>
          )}
          <button className="cta sm" onClick={() => (home ? scrollTo('upload') : reset())}>
            {home ? 'Upload a video' : 'New video'}
          </button>
        </div>
      </header>

      <main className="container">
        {home && (
          <>
            <section className="hero">
              <div className="hero-text">
                <span className="pill">Urdu · Hindi · Roman</span>
                <h1>
                  Your voice,<br />
                  <span className="accent">perfectly captioned</span> instantly.
                </h1>
                <button className="cta" onClick={() => scrollTo('upload')}>Start captioning</button>
              </div>
              <div id="upload"><UploadPage onCreated={openProject} /></div>
            </section>

            <section id="features" className="section">
              <h2 className="section-title">Built for fast edits</h2>
              <div className="features">
                {FEATURES.map((f) => (
                  <div className={'feature ' + f.tone} key={f.title}>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {projectId && !project && (
          <StatusPage projectId={projectId} onReady={setProject} onBack={reset} />
        )}
        {projectId && project && (
          <EditorPage key={project.id} project={project} onBack={reset} />
        )}
      </main>
    </div>
  );
}