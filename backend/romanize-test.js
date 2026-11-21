import 'dotenv/config';
import fs from 'node:fs';

const lines = JSON.parse(fs.readFileSync('transcript.json', 'utf8'));
const texts = lines.map(l => l.text);

const prompt = 'You are fixing captions for a video where a Pakistani creator speaks Urdu mixed with English words. The Urdu text below comes from speech recognition and sometimes writes English words wrongly, so use the surrounding sentences to correct obvious mistakes. Write the result in Roman Urdu as people type it in chat messages. Write English words in normal English spelling (for example content, quality, matter, paid campaigns, miss). Do not translate Urdu words into English. Do not add or remove lines. Return only a JSON array of strings with exactly the same number of items. Lines: ' + JSON.stringify(texts);

const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`
  },
    body: JSON.stringify({
    model: process.env.LLM_MODEL,
    temperature: 0,
    max_completion_tokens: 8000,
    reasoning_effort: 'low',
    messages: [{ role: 'user', content: prompt }]
  })
});

if (!res.ok) {
  console.log(res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log('finish reason:', data.choices[0].finish_reason);
if (!data.choices[0].message.content) {
  console.log('Empty reply:', JSON.stringify(data).slice(0, 1500));
  process.exit(1);
}
const raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
const roman = JSON.parse(raw);

if (!Array.isArray(roman) || roman.length !== texts.length) {
  console.log('Line count mismatch:', roman.length, 'vs', texts.length);
  process.exit(1);
}

const result = lines.map((l, i) => ({ start: l.start, end: l.end, original: l.text, roman: roman[i] }));
fs.writeFileSync('roman.json', JSON.stringify(result, null, 2), 'utf8');
console.log(result.map(r => r.roman).join('\n'));