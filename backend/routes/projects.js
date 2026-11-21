import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { createProject, getProject, saveProject, projectFolder } from '../storage.js';
import { extractAudio, transcribe } from '../services/transcribe.js';
import { romanize } from '../services/romanize.js';

const router = express.Router();

const upload = multer({
  dest: path.join(import.meta.dirname, '..', '..', 'storage', 'tmp'),
  limits: { fileSize: 200 * 1024 * 1024 }
});

router.post('/', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
  const language = req.body.language === 'hi' ? 'hi' : 'ur';
  const project = createProject(language);
  fs.renameSync(req.file.path, path.join(projectFolder(project.id), 'input.mp4'));
  res.status(201).json(project);
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/:id/transcribe', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.status === 'processing') return res.status(409).json({ error: 'Already processing' });
  project.status = 'processing';
  project.error = null;
  saveProject(project);
  res.status(202).json(project);
  runPipeline(project.id);
});

async function runPipeline(id) {
  const project = getProject(id);
  try {
    const folder = projectFolder(id);
    await extractAudio(folder);
    const segments = await transcribe(folder, project.language);
    const roman = await romanize(segments.map(s => s.text));
    project.lines = segments.map((s, i) => ({
      start: s.start,
      end: s.end,
      original: s.text,
      text: roman[i]
    }));
    project.status = 'ready';
  } catch (err) {
    project.status = 'failed';
    project.error = err.message;
  }
  saveProject(project);
}

export default router;