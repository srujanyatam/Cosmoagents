const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  const { code, prompt } = JSON.parse(event.body);
  if (!code || !prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code or prompt' }) };
  }
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-coder:free',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for code rewriting and explanation.' },
          { role: 'user', content: `${prompt}\n\n${code}` }
        ]
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    return { statusCode: 200, body: JSON.stringify({ rewrittenCode: text }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'AI rewrite failed' }) };
  }
}; 