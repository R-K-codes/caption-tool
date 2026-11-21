import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const run = promisify(execFile);

export async function extractAudio(folder) {
  await run(
    'ffmpeg',
    ['-y', '-i', 'input.mp4', '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', 'audio.mp3'],
    { cwd: folder }
  );
}

export async function transcribe(folder, language) {
  const form = new FormData();
  form.append('file', new Blob([fs.readFileSync(path.join(folder, 'audio.mp3'))]), 'audio.mp3');
  form.append('model', 'whisper-large-v3');
  form.append('language', language);
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: form
  });

  if (!res.ok) throw new Error('Transcription failed: ' + res.status + ' ' + (await res.text()));

  const data = await res.json();
  return data.segments.map(s => ({ start: s.start, end: s.end, text: s.text.trim() }));
}