import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.join(import.meta.dirname, '..', 'storage');

export function projectFolder(id) {
  return path.join(root, id);
}

export function createProject(language) {
  const id = crypto.randomUUID();
  fs.mkdirSync(projectFolder(id), { recursive: true });
  const project = {
    id,
    status: 'uploaded',
    language,
    styleName: 'classic',
    lines: [],
    error: null,
    createdAt: new Date().toISOString()
  };
  saveProject(project);
  return project;
}

export function getProject(id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const file = path.join(projectFolder(id), 'project.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function saveProject(project) {
  const file = path.join(projectFolder(project.id), 'project.json');
  fs.writeFileSync(file, JSON.stringify(project, null, 2), 'utf8');
}


export function recoverInterruptedProjects() {
  if (!fs.existsSync(root)) return;
  for (const name of fs.readdirSync(root)) {
    const project = getProject(name);
    if (project && (project.status === 'processing' || project.status === 'exporting')) {
      project.status = project.lines.length ? 'ready' : 'failed';
      project.error = 'The server restarted while this was running. Please try again.';
      saveProject(project);
    }
  }
}