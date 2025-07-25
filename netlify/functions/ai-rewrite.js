const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const SYSTEM_PROMPT =
  'You are Cosmo Agents, an expert assistant. Only answer questions about SQL, GitHub, Sybase, Oracle, or Supabase. If the question is not about these, politely say you can only answer questions related to SQL, GitHub, Sybase, Oracle, or Supabase. Keep your answers short, precise, and accurate.';

async function fetchWithRetry(body, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text && text.trim().length > 0) {
        return { success: true, text };
      }
      lastError = data.error || 'AI did not return a result.';
    } catch (err) {
      lastError = err.message || 'AI rewrite failed';
    }
    // Wait 500ms before retrying
    await new Promise(res => setTimeout(res, 500));
  }
  return { success: false, error: lastError };
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const { code, prompt } = JSON.parse(event.body);
  if ((!code || code.trim() === '') && (!prompt || prompt.trim() === '')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or prompt' }) };
  }
  const body = {
    model: 'qwen/qwen3-coder:free',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt || code }
    ]
  };
  const result = await fetchWithRetry(body, 3);
  if (result.success) {
    return { statusCode: 200, body: JSON.stringify({ rewrittenCode: result.text }) };
  } else {
    return { statusCode: 500, body: JSON.stringify({ error: result.error || 'AI rewrite failed' }) };
  }
}; 