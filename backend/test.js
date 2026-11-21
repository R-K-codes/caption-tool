import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

execFileSync('ffmpeg', ['-y', '-i', 'sample.mp4', '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', 'audio.mp3']);

const form = new FormData();
form.append('file', new Blob([fs.readFileSync('audio.mp3')]), 'audio.mp3');
form.append('model', 'whisper-large-v3');
form.append('language', 'ur');
form.append('response_format', 'verbose_json');

const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
  body: form
});

if (!res.ok) {
  console.log(res.status, await res.text());
} else {
  const data = await res.json();
  const lines = data.segments.map(s => ({ start: s.start, end: s.end, text: s.text.trim() }));
  fs.writeFileSync('transcript.json', JSON.stringify(lines, null, 2), 'utf8');
  console.log('Saved transcript.json with', lines.length, 'lines');
}