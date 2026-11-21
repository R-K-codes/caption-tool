import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { createProject, getProject, saveProject, projectFolder } from '../storage.js';
import { extractAudio, transcribe } from '../services/transcribe.js';
import { romanize } from '../services/romanize.js';
import { exportVideo } from '../services/exportVideo.js';
import { styles, FONTS, DEFAULTS } from '../services/styles.js';

const router = express.Router();

const upload = multer({
  dest: path.join(import.meta.dirname, '..', '..', 'storage', 'tmp'),
  limits: { fileSize: 200 * 1024 * 1024 }
});

const withDefaults = (p) => ({ ...DEFAULTS, ...p });
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function applySettings(project, body) {
  if (!body) return;
  if (body.styleName && styles[body.styleName]) project.styleName = body.styleName;
  if (body.font && FONTS.some((f) => f.name === body.font)) project.font = body.font;
  if (num(body.sizeScale) !== null) project.sizeScale = clamp(body.sizeScale, 0.5, 2);
  if (num(body.posX) !== null) project.posX = clamp(body.posX, 0.15, 0.85);
  if (num(body.posY) !== null) project.posY = clamp(body.posY, 0.05, 0.95);
}

router.post('/', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
  const language = req.body.language === 'hi' ? 'hi' : 'ur';
  const project = createProject(language);
  fs.renameSync(req.file.path, path.join(projectFolder(project.id), 'input.mp4'));
  res.status(201).json(withDefaults(project));
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(withDefaults(project));
});

router.post('/:id/transcribe', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.status === 'processing') return res.status(409).json({ error: 'Already processing' });
  project.status = 'processing';
  project.error = null;
  saveProject(project);
  res.status(202).json(withDefaults(project));
  runPipeline(project.id);
});

async function runPipeline(id) {
  const project = getProject(id);
  try {
    const folder = projectFolder(id);
    await extractAudio(folder);
    const segments = await transcribe(folder, project.language);
    const roman = await romanize(segments.map((s) => s.text));
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

router.put('/:id/captions', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const { lines } = req.body ?? {};
  if (Array.isArray(lines)) {
    project.lines = lines.map((l) => ({
      start: Number(l.start),
      end: Number(l.end),
      original: String(l.original ?? ''),
      text: String(l.text ?? '')
    }));
  }
  applySettings(project, req.body);
  saveProject(project);
  res.json(withDefaults(project));
});

router.post('/:id/export', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (project.status === 'exporting') return res.status(409).json({ error: 'Already exporting' });
  if (!project.lines.length) return res.status(400).json({ error: 'No captions to export' });
  applySettings(project, req.body);
  project.status = 'exporting';
  project.error = null;
  saveProject(project);
  res.status(202).json(withDefaults(project));
  runExport(project.id);
});

async function runExport(id) {
  const project = getProject(id);
  try {
    await exportVideo(projectFolder(id), project.lines, withDefaults(project));
    project.status = 'done';
  } catch (err) {
    project.status = 'failed';
    project.error = err.message;
  }
  saveProject(project);
}

router.get('/:id/download', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const file = path.join(projectFolder(project.id), 'output.mp4');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Video not exported yet' });
  res.download(file, 'captioned-video.mp4');
});

router.get('/:id/video', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const file = path.join(projectFolder(project.id), 'input.mp4');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Video not found' });
  res.sendFile(file);
});

export default router;