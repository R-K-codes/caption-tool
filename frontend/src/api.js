async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    let message = 'Request failed';
    try {
      message = (await res.json()).error || message;
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }
  return res.json();
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

export function uploadVideo(file, language) {
  const form = new FormData();
  form.append('language', language);
  form.append('video', file);
  return request('/api/projects', { method: 'POST', body: form });
}

export function getProject(id) {
  return request('/api/projects/' + id);
}

export function startTranscription(id) {
  return request('/api/projects/' + id + '/transcribe', { method: 'POST' });
}

export function saveCaptions(id, lines, settings) {
  return request('/api/projects/' + id + '/captions', json('PUT', { lines, ...settings }));
}

export function startExport(id, settings) {
  return request('/api/projects/' + id + '/export', json('POST', settings));
}

export function getFonts() {
  return request('/api/fonts');
}

export const fontFileUrl = (file) => '/api/fontfiles/' + file;
export const downloadUrl = (id) => '/api/projects/' + id + '/download';
export const videoUrl = (id) => '/api/projects/' + id + '/video';