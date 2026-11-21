const PROMPT = 'You are fixing captions for a video where a Pakistani creator speaks Urdu mixed with English words. The Urdu text below comes from speech recognition and sometimes writes English words wrongly, so use the surrounding sentences to correct obvious mistakes. Write the result in Roman Urdu as people type it in chat messages. Write English words in normal English spelling (for example content, quality, matter, paid campaigns, miss). Do not translate Urdu words into English. Do not add or remove lines. Return only a JSON array of strings with exactly the same number of items. Lines: ';

async function romanizeBatch(texts) {
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
      messages: [{ role: 'user', content: PROMPT + JSON.stringify(texts) }]
    })
  });

  if (!res.ok) throw new Error('Romanize failed: ' + res.status + ' ' + (await res.text()));

  const data = await res.json();
  const content = data.choices[0].message.content;
  if (!content) throw new Error('Empty reply from model');

  const out = JSON.parse(content.replace(/```json|```/g, '').trim());
  if (!Array.isArray(out) || out.length !== texts.length) throw new Error('Line count mismatch');
  return out.map(String);
}

export async function romanize(texts) {
  const result = [];
  for (let i = 0; i < texts.length; i += 20) {
    const batch = texts.slice(i, i + 20);
    let out;
    try {
      out = await romanizeBatch(batch);
    } catch {
      try {
        out = await romanizeBatch(batch);
      } catch {
        out = batch;
      }
    }
    result.push(...out);
  }
  return result;
}