import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { buildAss, fontsDir } from './styles.js';

const run = promisify(execFile);

export async function exportVideo(folder, lines, opts) {
  const probe = await run(
    'ffprobe',
    ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', 'input.mp4'],
    { cwd: folder }
  );
  const [width, height] = probe.stdout.trim().split(',').map(Number);
  if (!width || !height) throw new Error('Could not read the video size');

  fs.writeFileSync(path.join(folder, 'captions.ass'), buildAss(lines, opts, width, height), 'utf8');

  const relFonts = path.relative(folder, fontsDir).split(path.sep).join('/');

  await run(
    'ffmpeg',
    ['-y', '-i', 'input.mp4', '-vf', 'ass=captions.ass:fontsdir=' + relFonts, '-c:a', 'copy', 'output.mp4'],
    { cwd: folder, maxBuffer: 50 * 1024 * 1024 }
  );
}